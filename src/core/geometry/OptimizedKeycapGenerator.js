import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';

/**
 * 优化的键帽生成器 - 高质量 + 高性能
 * 特点：
 * 1. 使用 ExtrudeGeometry 替代 RoundedBoxGeometry
 * 2. 自定义平滑法线算法
 * 3. 合并 CSG 操作减少计算
 * 4. 动态调整几何体复杂度
 */
export class OptimizedKeycapGenerator {
  constructor() {
    this.performanceMode = 'balanced'; // 'fast', 'balanced', 'quality'
  }

  /**
   * 生成键帽网格
   */
  generate(params) {
    const {
      profile = 'Cherry',
      size = '1u',
      hasStem = true,
    } = params;

    // clamp 参数范围，防止 CSG/生成崩溃
    const topRadius = Math.max(0.1, Math.min(3.0, params.topRadius ?? 0.5));
    const wallThickness = Math.max(0.8, Math.min(3.5, params.wallThickness ?? 1.5));
    
    console.time('⏱️ 键帽生成总耗时');
    
    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = params.height || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;
    
    // 生成高质量外壳
    console.time('  ├─ 外壳生成');
    let mesh = this._createHighQualityMesh(
      bottomWidth, 
      bottomDepth, 
      height, 
      profileData,
      topRadius
    );
    console.timeEnd('  ├─ 外壳生成');

    // CSG 运算优化：合并所有减法操作
    if (hasStem || wallThickness > 0) {
      console.time('  ├─ CSG布尔运算');
      mesh = this._performCombinedCSG(
        mesh, 
        bottomWidth, 
        height, 
        wallThickness, 
        hasStem
      );
      console.timeEnd('  ├─ CSG布尔运算');
    }

    console.timeEnd('⏱️ 键帽生成总耗时');
    
    return mesh;
  }

  /**
   * 创建高质量键帽网格
   */
  _createHighQualityMesh(bottomWidth, bottomDepth, height, profileData, topRadius) {
    // 1. 动态计算最优分段数
    const curveSegments = this._calculateOptimalSegments(bottomWidth, bottomDepth);
    
    // 2. 创建底部轮廓（圆角矩形）
    const bottomShape = this._createRoundedRectShape(
      bottomWidth / 2, 
      bottomDepth / 2, 
      topRadius,
      curveSegments
    );

    // 3. 创建垂直拉伸路径
    const extrudePath = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, height, 0)
    );

    // 4. 拉伸设置
    const extrudeSettings = {
      steps: 25,              // 垂直分段（影响侧面平滑度）
      bevelEnabled: false,
      extrudePath: extrudePath,
    };

    // 5. 生成基础几何体
    const geometry = new THREE.ExtrudeGeometry(bottomShape, extrudeSettings);

    // 6. 应用键帽变形（梯形 + 内凹）
    this._applyKeycapDeformation(
      geometry, 
      bottomWidth, 
      bottomDepth, 
      height, 
      12.7,   // 顶部宽度
      12.7,   // 顶部深度
      1.2     // 内凹深度
    );

    // 7. 平滑法线（关键步骤！）
    geometry.computeVertexNormals();
    this._smoothNormals(geometry, 35); // 35度阈值

    // 8. 创建高质量材质
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.08,
      envMapIntensity: 1.0,
      side: THREE.FrontSide,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  /**
   * 根据尺寸计算最优分段数
   */
  _calculateOptimalSegments(width, depth) {
    const maxDim = Math.max(width, depth);
    
    const segmentMap = {
      'fast': Math.ceil(maxDim / 4),      // 快速模式：少分段
      'balanced': Math.ceil(maxDim / 2),  // 平衡模式
      'quality': Math.ceil(maxDim / 1.5)  // 质量模式：多分段
    };
    
    const segments = segmentMap[this.performanceMode] || segmentMap['balanced'];
    
    // 限制范围
    return Math.max(8, Math.min(32, segments));
  }

  /**
   * 创建圆角矩形 Shape
   */
  _createRoundedRectShape(halfWidth, halfDepth, radius, segments = 12) {
    const shape = new THREE.Shape();
    
    const r = Math.min(radius, Math.min(halfWidth, halfDepth) * 0.4);
    const w = halfWidth;
    const h = halfDepth;

    // 右下角起点
    shape.moveTo(w - r, -h);
    
    // 底边
    shape.lineTo(-w + r, -h);
    
    // 左下圆角（使用 absarc 更平滑）
    shape.absarc(-w + r, -h + r, r, Math.PI * 1.5, Math.PI, true);
    
    // 左边
    shape.lineTo(-w, h - r);
    
    // 左上圆角
    shape.absarc(-w + r, h - r, r, Math.PI, Math.PI * 0.5, true);
    
    // 上边
    shape.lineTo(w - r, h);
    
    // 右上圆角
    shape.absarc(w - r, h - r, r, Math.PI * 0.5, 0, true);
    
    // 右边
    shape.lineTo(w, -h + r);
    
    // 右下圆角
    shape.absarc(w - r, -h + r, r, 0, -Math.PI * 0.5, true);

    return shape;
  }

  /**
   * 应用键帽变形
   */
  _applyKeycapDeformation(geometry, bottomWidth, bottomDepth, height, topWidth, topDepth, dishDepth) {
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // 归一化高度 (0 at bottom, 1 at top)
      const normalizedY = Math.max(0, Math.min(1, y / height));

      // 梯形缩放（使用 easeInOut 曲线）
      const eased = this._easeInOutCubic(normalizedY);
      const scaleX = 1 - eased * (1 - topWidth / bottomWidth);
      const scaleZ = 1 - eased * (1 - topDepth / bottomDepth);

      let newX = x * scaleX;
      let newZ = z * scaleZ;
      let newY = y;

      // 顶部内凹（球面）
      if (normalizedY > 0.8) {
        const topFactor = (normalizedY - 0.8) / 0.2; // 0~1
        const distXZ = Math.sqrt(newX * newX + newZ * newZ);
        const maxDim = Math.max(topWidth, topDepth) / 2;
        const normalizedDist = Math.min(distXZ / maxDim, 1.0);
        
        // 使用抛物线内凹
        const sag = Math.pow(normalizedDist, 2.2) * dishDepth * topFactor;
        newY -= sag;
      }

      pos.setXYZ(i, newX, newY, newZ);
    }

    pos.needsUpdate = true;
  }

  /**
   * 缓动函数
   */
  _easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 平滑法线算法（类似 Blender 的 Smooth Shading）
   */
  _smoothNormals(geometry, angleThresholdDeg = 30) {
    const angleThreshold = THREE.MathUtils.degToRad(angleThresholdDeg);
    const thresholdDot = Math.cos(angleThreshold);
    
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const indices = geometry.index;
    
    if (!indices) {
      console.warn('Geometry is not indexed, skipping smooth normals');
      return;
    }

    // 第一步：计算每个面的法线
    const faceNormals = [];
    const faceCount = indices.count / 3;
    
    for (let i = 0; i < faceCount; i++) {
      const i0 = indices.getX(i * 3);
      const i1 = indices.getX(i * 3 + 1);
      const i2 = indices.getX(i * 3 + 2);
      
      const v0 = new THREE.Vector3().fromBufferAttribute(positions, i0);
      const v1 = new THREE.Vector3().fromBufferAttribute(positions, i1);
      const v2 = new THREE.Vector3().fromBufferAttribute(positions, i2);
      
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
      
      faceNormals.push(faceNormal);
    }

    // 第二步：为每个顶点平均相邻面的法线
    const vertexFaceMap = new Map();
    
    for (let i = 0; i < faceCount; i++) {
      const i0 = indices.getX(i * 3);
      const i1 = indices.getX(i * 3 + 1);
      const i2 = indices.getX(i * 3 + 2);
      
      [i0, i1, i2].forEach(vertexIndex => {
        if (!vertexFaceMap.has(vertexIndex)) {
          vertexFaceMap.set(vertexIndex, []);
        }
        vertexFaceMap.get(vertexIndex).push(i);
      });
    }

    // 第三步：计算平滑后的法线
    const smoothedNormals = new Float32Array(normals.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      const adjacentFaces = vertexFaceMap.get(i) || [];
      const avgNormal = new THREE.Vector3();
      
      if (adjacentFaces.length === 0) continue;
      
      const baseNormal = faceNormals[adjacentFaces[0]];
      
      adjacentFaces.forEach(faceIndex => {
        const faceNormal = faceNormals[faceIndex];
        
        // 只平均角度接近的面
        if (baseNormal.dot(faceNormal) > thresholdDot) {
          avgNormal.add(faceNormal);
        }
      });
      
      avgNormal.normalize();
      
      smoothedNormals[i * 3] = avgNormal.x;
      smoothedNormals[i * 3 + 1] = avgNormal.y;
      smoothedNormals[i * 3 + 2] = avgNormal.z;
    }
    
    geometry.setAttribute('normal', new THREE.BufferAttribute(smoothedNormals, 3));
  }

  /**
   * 合并 CSG 操作（性能优化）
   */
  _performCombinedCSG(outerMesh, width, height, wallThickness, hasStem) {
    outerMesh.updateMatrix();

    // 收集所有需要减去的网格
    const subtractMeshes = [];

    // 1. 添加内胆
    if (wallThickness > 0.1 && wallThickness < width / 2) {
      const innerMesh = outerMesh.clone();
      const scaleX = Math.max(0.1, (width - wallThickness * 2) / width);
      const scaleY = Math.max(0.1, (height - wallThickness) / height);
      
      innerMesh.scale.set(scaleX, scaleY, scaleX);
      
      // 底部向上偏移，保持底部厚度
      innerMesh.position.y = wallThickness * 0.5;
      
      innerMesh.updateMatrix();
      subtractMeshes.push(innerMesh);
    }

    // 2. 添加十字轴
    if (hasStem) {
      const crossSize = 4.15;   // 稍大一点确保容差
      const crossThick = 1.35;
      const stemDepth = 4.0;
      
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(crossSize, stemDepth, crossThick)
      );
      const vBar = new THREE.Mesh(
        new THREE.BoxGeometry(crossThick, stemDepth, crossSize)
      );
      
      hBar.position.y = stemDepth / 2;
      vBar.position.y = stemDepth / 2;
      
      hBar.updateMatrix();
      vBar.updateMatrix();
      
      subtractMeshes.push(hBar, vBar);
    }

    // 3. 一次性执行所有布尔运算
    if (subtractMeshes.length === 0) {
      return outerMesh;
    }

    let resultCSG = CSG.fromMesh(outerMesh);
    
    for (const mesh of subtractMeshes) {
      const subtractCSG = CSG.fromMesh(mesh);
      resultCSG = resultCSG.subtract(subtractCSG);
    }

    const resultMesh = CSG.toMesh(resultCSG, outerMesh.matrix, outerMesh.material);
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;

    // CSG 后重新计算法线
    resultMesh.geometry.computeVertexNormals();

    return resultMesh;
  }

  /**
   * 获取十字轴几何体（用于辅助显示）
   */
  getStemGeometry() {
    const crossSize = 4.1;
    const crossThick = 1.35;
    const stemDepth = 4.0;
    
    const hBox = new THREE.BoxGeometry(crossSize, stemDepth, crossThick);
    const vBox = new THREE.BoxGeometry(crossThick, stemDepth, crossSize);
    
    return { hBox, vBox, stemDepth };
  }

  /**
   * 设置性能模式
   */
  setPerformanceMode(mode) {
    if (['fast', 'balanced', 'quality'].includes(mode)) {
      this.performanceMode = mode;
    }
  }
}
