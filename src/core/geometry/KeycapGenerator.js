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
    const steps = 6; // 细分段数
    const radius = 1.0; // 侧边圆角半径
    
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
        if (normalizedY > 0.8) {
             // 计算到中心的距离
             const distXY = Math.sqrt(finalX * finalX + finalZ * finalZ);
             
             // 简单的球形内凹模拟
             // y偏移 = 1 - Math.cos(angle) * scale
             // 或者用抛物线：k * r^2
             const sag = (distXY / (Math.max(bottomWidth, bottomDepth) / 2)) ** 2 * dishDepth;
             
             // 混合权重：底部不受影响，顶部全受影响
             const weight = Math.pow(normalizedY, 8); // 这种混合确保侧壁不会被扭曲太多
             
             currentH -= sag * weight;
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
    
    // CSG 丢失了原始 UV 和 法线优化，可能需要处理
    // 简单的 StandardMaterial 通常没问题
    
    return resultMesh;
  }
}

