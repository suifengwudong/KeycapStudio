import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CSG } from 'three-csg-ts';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';

/**
 * 键帽生成器类
 * 负责根据参数生成键帽的3D几何体
 */
export class KeycapGenerator {
  /**
   * @param {Object} params - 键帽参数
   */
  generate(params) {
    const {
      profile = 'Cherry',
      size = '1u',
      hasStem = true
    } = params;
    
    // 1. 获取基础参数
    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = params.height || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;
    
    // 2. 生成基础几何体 (带圆角和内凹)
    let mesh = this._createBaseMesh(bottomWidth, bottomDepth, height, profileData);

    // 3. 挖十字轴孔 (使用 CSG)
    if (hasStem) {
      mesh = this._subtractStem(mesh);
    }

    return mesh;
  }

  _createBaseMesh(bottomWidth, bottomDepth, height, profileData) {
    // 基础参数
    const steps = 10; // 提高细分段数以获得更平滑的角落
    
    // 关键修复：RoundedBoxGeometry width/height/depth 初始为 1
    // 如果 radius 设为 1，就会变成球体。
    // 我们需要根据实际尺寸比例反推一个合适的初始 radius。
    // 假设我们希望最终圆角大约是 1-2mm，而平均宽度是 18mm。
    // 那么 normalized radius 应该是 1/18 ≈ 0.05 或 更小
    const radius = 0.05; 
    
    // 使用 RoundedBoxGeometry 作为基础
    // 创建一个归一化的 RoundedBox (1x1x1)，之后通过顶点操作进行塑形
    const geometry = new RoundedBoxGeometry(1, 1, 1, steps, radius);
    
    // 变换参数
    const topWidth = 12.7; // Cherry标准顶部宽度
    const topDepth = 12.7; // Cherry标准顶部深度 (方形)
    const dishRadius = 40; // 顶部下凹球半径
    const dishDepth = 1.2; // 最大下凹深度

    const pos = geometry.attributes.position;
    const center = new THREE.Vector3();
    const vector = new THREE.Vector3();

    // 遍历所有顶点进行变形
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i); // range -0.5 to 0.5
        const z = pos.getZ(i);

        // 1. 垂直映射：将 y(-0.5~0.5) 映射到 (0~height)
        const normalizedY = y + 0.5; // 0 ~ 1
        let currentH = normalizedY * height;

        // 2. 梯形插值计算当前的宽和深
        // 使用 EaseOut 曲线让侧面有点弧度 (可选，这里先用线性)
        const currentW = bottomWidth + (topWidth - bottomWidth) * normalizedY;
        const currentD = bottomDepth + (topDepth - bottomDepth) * normalizedY;

        // 3. 应用尺寸缩放
        // RoundedBox 原始宽高深是1，所以需要乘以 currentW/1
        let finalX = x * currentW;
        let finalZ = z * currentD;

        // 4. 顶部内凹 (Dish)
        // 只有顶部的顶点受到显著影响
        if (normalizedY > 0.9) { // 只影响最顶部的面
             // 计算到中心的距离
             const distXY = Math.sqrt(finalX * finalX + finalZ * finalZ);
             
             // 简单的球形内凹模拟
             const maxDim = Math.max(bottomWidth, bottomDepth);
             // 限制一下 sag 的范围，避免边缘过度下陷
             const normalizedDist = Math.min(distXY / (maxDim / 2), 1.0);
             
             const sag = Math.pow(normalizedDist, 2) * dishDepth;
             
             currentH -= sag;
        }

        pos.setXYZ(i, finalX, currentH, finalZ);
    }

    // 重新计算法线，否则光照会错乱
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  _subtractInnerBody(outerMesh, width, height, thickness) {
      outerMesh.updateMatrix();
      
      // 简单的内胆生成：克隆外壳并缩小
      // 缩放中心要在底部中心，所以需要平移
      // 或者更简单的：缩放比例
      const scaleX = (width - thickness * 2) / width;
      // 高度方向：保留顶部厚度。 innerHeight = height - thickness
      const scaleY = (height - thickness) / height;

      // 克隆并变换
      const innerMesh = outerMesh.clone();
      
      // 注意：直接 scale 会导致圆角也变形，但对于内壁来说通常可以接受
      innerMesh.scale.set(scaleX, scaleY, scaleX);
      
      // 位置校正：因为原点是在几何体中心，scale后底部会浮空。
      // 我们之前在 _createBaseMesh 里把 y 映射到了 0~height。
      // 所以原来的 y 原点是 0吗？看代码：pos.getY(i) 是 -0.5~0.5，然后 normalizedY = y+0.5 (0~1)。
      // 最后的 currentH 是 0~height。
      // 所以几何体底面在 y=0。
      // 直接 Scale，origin (0,0,0) 就是底面中心。
      // 所以 innerMesh 底部依然在 0，高度变矮了。这会导致底部变薄成0。
      // 我们需要内胆底部往上抬一点吗？
      // 一般键帽是底部开口的，所以内胆底部应该和外壳底部平齐(或者更低以确保切穿)。
      // 这里的 scaleY 会让顶部变低 (height * scaleY)。
      // 外壳顶是 height。内胆顶是 height - thickness。
      // 所以这个 scaleY 是正确的。
      
      // 执行布尔运算
      const outerCSG = CSG.fromMesh(outerMesh);
      const innerCSG = CSG.fromMesh(innerMesh);
      
      const resultCSG = outerCSG.subtract(innerCSG);
      
      const resultMesh = CSG.toMesh(resultCSG, outerMesh.matrix, outerMesh.material);
      resultMesh.castShadow = true;
      resultMesh.receiveShadow = true;
      
      return resultMesh;
  }

  _subtractStem(keycapMesh) {
    // 确保矩阵更新
    keycapMesh.updateMatrix();

    // 创建十字轴反相模具 (用于减去)
    const stemGroup = new THREE.Group();
    
    // 1. 十字柱
    const crossSize = 4.1; // 略大于4mm以容差
    const crossThick = 1.35; // 略大于1.27mm
    const stemDepth = 3.8;
    
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(crossSize, stemDepth, crossThick));
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(crossThick, stemDepth, crossSize));
    
    // 调整位置到底部
    hBar.position.y = stemDepth / 2;
    vBar.position.y = stemDepth / 2;
    
    // 合并十字
    // 注意：CSG 操作需要基于 Mesh
    // 为了简单，我们只用两个Box分别减去
    
    // 转换为 CSG
    const keycapCSG = CSG.fromMesh(keycapMesh);
    const hBarCSG = CSG.fromMesh(hBar);
    const vBarCSG = CSG.fromMesh(vBar);

    // 运算：Keycap - hBar - vBar
    let resultCSG = keycapCSG.subtract(hBarCSG);
    resultCSG = resultCSG.subtract(vBarCSG);

    // 转换回 Mesh
    const resultMesh = CSG.toMesh(resultCSG, keycapMesh.matrix, keycapMesh.material);
    
    // 恢复属性
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;
    
    // TODO: CSG 丢失了原始 UV 和 法线优化，可能需要处理
    // 简单的 StandardMaterial 通常没问题
    
    return resultMesh;
  }

  // 辅助方法：获取十字轴的几何体用于显示虚线
  getStemGeometry() {
    const crossSize = 4.1; 
    const crossThick = 1.35; 
    const stemDepth = 4.0; // 稍微长一点
    
    const geometry = new THREE.BufferGeometry();
    
    // 简单构建一个十字的线框点集
    // 横条
    const hBox = new THREE.BoxGeometry(crossSize, stemDepth, crossThick);
    // 竖条
    const vBox = new THREE.BoxGeometry(crossThick, stemDepth, crossSize);
    
    // 这里的合并比较麻烦，我们可以返回一个 Group 包含两个 Mesh，或者 simply 返回一个十字形状的 Mesh
    // 为了简单，我们只返回两个 Box 的组合
    // 或者直接在 Scene 里渲染两个 Box
    
    return { hBox, vBox, stemDepth };
  }
}

