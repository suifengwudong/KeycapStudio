import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helvetikerBoldData from 'three/examples/fonts/helvetiker_bold.typeface.json';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';
import {
  CHERRY_TOP_WIDTH,
  CHERRY_TOP_DEPTH,
  CHERRY_DISH_DEPTH,
  CHERRY_CROSS_SIZE,
  CHERRY_CROSS_THICK,
  CHERRY_STEM_DEPTH,
  CHERRY_SMOOTH_ANGLE,
} from '../../constants/cherry';

/** Recommended emboss parameter bounds (kept in sync with KeycapInspector sliders). */
const EMBOSS_FONT_SIZE_MIN  = 2;
const EMBOSS_FONT_SIZE_MAX  = 10;
const EMBOSS_DEPTH_MIN      = 0.1;
const EMBOSS_DEPTH_MAX      = 2.0;
function _getFont() {
  if (!_font) {
    const loader = new FontLoader();
    _font = loader.parse(helvetikerBoldData);
  }
  return _font;
}

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
   * 生成即时预览网格（超低精度，极快）
   * 使用最少分段数 + computeVertexNormals 替代昂贵的 _smoothNormals
   * 适合首次渲染展示，让用户立即看到图形
   */
  generateInstantPreview(params) {
    const {
      profile = 'Cherry',
      size = '1u',
    } = params;

    const topRadius = Math.max(0.1, Math.min(3.0, params.topRadius ?? 0.5));
    const dishDepth = params.dishDepth != null
      ? Math.max(0, Math.min(3.0, params.dishDepth))
      : CHERRY_DISH_DEPTH;

    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = params.height || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;

    // 固定最少分段数，不动态计算
    const bottomShape = this._createRoundedRectShape(
      bottomWidth / 2,
      bottomDepth / 2,
      topRadius,
      8
    );

    const extrudePath = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, height, 0)
    );

    const geometry = new THREE.ExtrudeGeometry(bottomShape, {
      steps: 6,
      bevelEnabled: false,
      extrudePath,
    });

    this._applyKeycapDeformation(
      geometry,
      bottomWidth,
      bottomDepth,
      height,
      CHERRY_TOP_WIDTH,
      CHERRY_TOP_DEPTH,
      dishDepth
    );

    // 使用内置法线计算替代昂贵的 _smoothNormals
    geometry.computeVertexNormals();

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
   * 生成预览网格（跳过 CSG，仅外壳，速度快）
   */
  generatePreview(params) {
    const {
      profile = 'Cherry',
      size = '1u',
    } = params;

    const topRadius = Math.max(0.1, Math.min(3.0, params.topRadius ?? 0.5));
    const dishDepth = params.dishDepth != null
      ? Math.max(0, Math.min(3.0, params.dishDepth))
      : CHERRY_DISH_DEPTH;

    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = params.height || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;

    const mesh = this._createHighQualityMesh(
      bottomWidth,
      bottomDepth,
      height,
      profileData,
      topRadius,
      dishDepth
    );

    return mesh;
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
    const dishDepth = params.dishDepth != null
      ? Math.max(0, Math.min(3.0, params.dishDepth))
      : CHERRY_DISH_DEPTH;
    
    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = params.height || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;
    
    // 生成高质量外壳
    let mesh = this._createHighQualityMesh(
      bottomWidth, 
      bottomDepth, 
      height, 
      profileData,
      topRadius,
      dishDepth
    );

    // CSG 运算优化：合并所有减法操作
    if (hasStem || wallThickness > 0) {
      mesh = this._performCombinedCSG(
        mesh, 
        bottomWidth, 
        height, 
        wallThickness, 
        hasStem
      );
    }

    // 文字浮雕（如已启用）
    if (params.embossEnabled && params.embossText?.trim()) {
      mesh = this._applyTextEmboss(mesh, params, height);
    }
    
    return mesh;
  }

  /**
   * 创建高质量键帽网格
   */
  _createHighQualityMesh(bottomWidth, bottomDepth, height, profileData, topRadius, dishDepth = CHERRY_DISH_DEPTH) {
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
      steps: this._getExtrudeSteps(), // 垂直分段（影响侧面平滑度）
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
      CHERRY_TOP_WIDTH,
      CHERRY_TOP_DEPTH,
      dishDepth
    );

    // 7. 平滑法线（关键步骤！）
    this._smoothNormals(geometry, CHERRY_SMOOTH_ANGLE);

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
   * 根据性能模式计算拉伸分段数
   */
  _getExtrudeSteps() {
    const stepsMap = { fast: 8, balanced: 15, quality: 25 };
    return stepsMap[this.performanceMode] ?? 15;
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
   * 使用类型化数组和预分配向量，避免循环内对象分配
   */
  _smoothNormals(geometry, angleThresholdDeg = 30) {
    const thresholdDot = Math.cos(THREE.MathUtils.degToRad(angleThresholdDeg));

    const positions = geometry.attributes.position;
    const indices = geometry.index;

    if (!indices) {
      console.warn('Geometry is not indexed, skipping smooth normals');
      return;
    }

    const posCount = positions.count;
    const faceCount = indices.count / 3;

    // 第一步：计算每个面的法线，复用 Vector3 实例，结果存入 Float32Array
    const faceNormals = new Float32Array(faceCount * 3);
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();

    for (let i = 0; i < faceCount; i++) {
      const i0 = indices.getX(i * 3);
      const i1 = indices.getX(i * 3 + 1);
      const i2 = indices.getX(i * 3 + 2);

      p0.fromBufferAttribute(positions, i0);
      p1.fromBufferAttribute(positions, i1);
      p2.fromBufferAttribute(positions, i2);

      e1.subVectors(p1, p0);
      e2.subVectors(p2, p0);
      fn.crossVectors(e1, e2).normalize();

      faceNormals[i * 3]     = fn.x;
      faceNormals[i * 3 + 1] = fn.y;
      faceNormals[i * 3 + 2] = fn.z;
    }

    // 第二步：用 CSR 格式构建顶点→面的邻接表（避免 Map 和动态数组）
    const counts = new Int32Array(posCount);
    for (let i = 0; i < indices.count; i++) {
      counts[indices.getX(i)]++;
    }
    const offsets = new Int32Array(posCount + 1);
    for (let i = 0; i < posCount; i++) {
      offsets[i + 1] = offsets[i] + counts[i];
    }
    const faceList = new Int32Array(offsets[posCount]);
    const fill = new Int32Array(posCount);
    for (let i = 0; i < faceCount; i++) {
      for (let j = 0; j < 3; j++) {
        const v = indices.getX(i * 3 + j);
        faceList[offsets[v] + fill[v]++] = i;
      }
    }

    // 第三步：用标量运算累加平滑法线（无 Vector3 分配）
    // 对于合法的 ExtrudeGeometry，每个顶点必定至少被一个面引用，
    // 所以 start === end 分支不会触发，zero-init 是安全的。
    const smoothed = new Float32Array(posCount * 3);

    for (let i = 0; i < posCount; i++) {
      const start = offsets[i];
      const end   = offsets[i + 1];
      if (start === end) continue;

      const f0 = faceList[start];
      const bx = faceNormals[f0 * 3];
      const by = faceNormals[f0 * 3 + 1];
      const bz = faceNormals[f0 * 3 + 2];

      let nx = 0, ny = 0, nz = 0;
      for (let j = start; j < end; j++) {
        const fi = faceList[j];
        const fx = faceNormals[fi * 3];
        const fy = faceNormals[fi * 3 + 1];
        const fz = faceNormals[fi * 3 + 2];
        if (bx * fx + by * fy + bz * fz > thresholdDot) {
          nx += fx; ny += fy; nz += fz;
        }
      }

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        smoothed[i * 3]     = nx / len;
        smoothed[i * 3 + 1] = ny / len;
        smoothed[i * 3 + 2] = nz / len;
      } else {
        // All neighbours filtered by threshold — fall back to the base face normal
        smoothed[i * 3]     = bx;
        smoothed[i * 3 + 1] = by;
        smoothed[i * 3 + 2] = bz;
      }
    }

    geometry.setAttribute('normal', new THREE.BufferAttribute(smoothed, 3));
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
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(CHERRY_CROSS_SIZE, CHERRY_STEM_DEPTH, CHERRY_CROSS_THICK)
      );
      const vBar = new THREE.Mesh(
        new THREE.BoxGeometry(CHERRY_CROSS_THICK, CHERRY_STEM_DEPTH, CHERRY_CROSS_SIZE)
      );
      
      hBar.position.y = CHERRY_STEM_DEPTH / 2;
      vBar.position.y = CHERRY_STEM_DEPTH / 2;
      
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
    const hBox = new THREE.BoxGeometry(CHERRY_CROSS_SIZE, CHERRY_STEM_DEPTH, CHERRY_CROSS_THICK);
    const vBox = new THREE.BoxGeometry(CHERRY_CROSS_THICK, CHERRY_STEM_DEPTH, CHERRY_CROSS_SIZE);
    
    return { hBox, vBox, stemDepth: CHERRY_STEM_DEPTH };
  }

  /**
   * 在键帽顶面添加文字浮雕（CSG union）
   *
   * 推荐参数：
   *   embossFontSize  4–6 mm（1u 键帽）
   *   embossDepth     0.3–0.6 mm（FDM 打印可识别范围）
   *
   * @param {THREE.Mesh} mesh          – 已生成的键帽网格
   * @param {object}     params        – shape params
   * @param {number}     keycapHeight  – 键帽高度（mm）
   * @returns {THREE.Mesh}
   */
  _applyTextEmboss(mesh, params, keycapHeight) {
    const text      = params.embossText.trim();
    const fontSize  = Math.max(EMBOSS_FONT_SIZE_MIN, Math.min(EMBOSS_FONT_SIZE_MAX, params.embossFontSize ?? 5));
    const depth     = Math.max(EMBOSS_DEPTH_MIN, Math.min(EMBOSS_DEPTH_MAX, params.embossDepth ?? 0.4));

    try {
      const font    = _getFont();
      const textGeo = new TextGeometry(text, {
        font,
        size          : fontSize,
        height        : depth,
        curveSegments : 4,
        bevelEnabled  : false,
      });

      // Center text in X/Z and place its bottom face at the keycap top surface.
      textGeo.computeBoundingBox();
      const bb     = textGeo.boundingBox;
      const cx     = (bb.max.x + bb.min.x) / 2;
      const cz     = (bb.max.z + bb.min.z) / 2;
      // y: place emboss so its base is just below the keycap top (for solid overlap)
      textGeo.translate(-cx, keycapHeight - depth * 0.5, -cz);

      const textMesh = new THREE.Mesh(textGeo, mesh.material);
      textMesh.updateMatrix();
      mesh.updateMatrix();

      const resultCSG = CSG.fromMesh(mesh).union(CSG.fromMesh(textMesh));
      const result    = CSG.toMesh(resultCSG, mesh.matrix, mesh.material);
      result.geometry.computeVertexNormals();
      result.castShadow    = true;
      result.receiveShadow = true;
      return result;
    } catch (err) {
      console.warn('Text emboss skipped:', err);
      return mesh;
    }
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
