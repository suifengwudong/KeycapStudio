import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CSG } from 'three-csg-ts';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';

// Constants for Stem (Cherry MX style)
const STEM_OD = 5.5;      // Outer Diameter of the stem post (mm)
const STEM_OR = STEM_OD / 2;
const CROSS_SIZE = 4.1;   // Horizontal/Vertical slot length (mm)
const CROSS_THICK = 1.35; // Slot thickness (mm)
const STEM_DEPTH = 4.0;   // Depth of the stem hole (mm)

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
      hasStem = true,
      topRadius = 0.5,
      wallThickness = 1.5
    } = params;
    
    // 1. 获取基础参数
    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = params.height || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;
    
    // 2. 生成外壳 (Solid Base)
    let mesh = this._createBaseMesh(bottomWidth, bottomDepth, height, profileData, topRadius);

    // 3. 挖内胆 (Hollow Out) - 同时保留十字轴柱(Stem Post)
    if (wallThickness > 0 && wallThickness < bottomWidth / 2) {
        mesh = this._hollowOut(mesh, bottomWidth, height, wallThickness, hasStem);
    }

    // 4. 挖十字轴孔 (Cut Stem Hole)
    if (hasStem) {
      mesh = this._subtractStemHole(mesh);
    }

    return mesh;
  }

  _createBaseMesh(bottomWidth, bottomDepth, height, profileData, topRadius) {
    // 基础参数
    const steps = 10; 
    
    // 动态计算归一化的 radius
    const normalizedRadius = topRadius / 18.0;
    const radius = Math.max(0.01, Math.min(normalizedRadius, 0.4));
    
    // 使用 RoundedBoxGeometry 作为基础 (dimensions 1,1,1)
    const geometry = new RoundedBoxGeometry(1, 1, 1, steps, radius);
    
    // 变换参数
    const topWidth = 12.7; // Cherry标准顶部宽度
    const topDepth = 12.7; // Cherry标准顶部深度 (方形)
    const dishRadius = 40; // 顶部下凹球半径
    const dishDepth = 1.2; // 最大下凹深度

    const pos = geometry.attributes.position;

    // 遍历所有顶点进行变形
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i); // range -0.5 to 0.5
        const z = pos.getZ(i);

        // 1. 垂直映射：将 y(-0.5~0.5) 映射到 (0~height)
        const normalizedY = y + 0.5; // 0 ~ 1
        let currentH = normalizedY * height;

        // 2. 梯形插值计算当前的宽和深
        const currentW = bottomWidth + (topWidth - bottomWidth) * normalizedY;
        const currentD = bottomDepth + (topDepth - bottomDepth) * normalizedY;

        // 3. 应用尺寸缩放
        let finalX = x * currentW;
        let finalZ = z * currentD;

        // 4. 顶部内凹 (Dish)
        if (normalizedY > 0.9) { 
             const distXY = Math.sqrt(finalX * finalX + finalZ * finalZ);
             
             const maxDim = Math.max(bottomWidth, bottomDepth);
             const normalizedDist = Math.min(distXY / (maxDim / 2), 1.0);
             
             const sag = Math.pow(normalizedDist, 2) * dishDepth;
             
             currentH -= sag;
        }

        pos.setXYZ(i, finalX, currentH, finalZ);
    }

    // 重新计算法线
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // 更新矩阵以供后续CSG使用
    mesh.updateMatrix();
    return mesh;
  }

  _hollowOut(baseMesh, width, height, thickness, preserveStemPost) {
      baseMesh.updateMatrix();
      
      // Calculate scales for inner mesh (approximated)
      const scaleX = (width - thickness * 2) / width;
      // Keep top thickness
      const scaleY = (height - thickness) / height;

      // Create Inner Mesh (The volume to be removed)
      const innerMesh = baseMesh.clone();
      innerMesh.scale.set(scaleX, scaleY, scaleX);
      innerMesh.updateMatrix();
      
      const innerCSG = CSG.fromMesh(innerMesh);

      let voidCSG = innerCSG;

      // If we need a stem post, we subtract the post cylinder from the Inner Volume.
      // (Removing the post from the "Air" means the post remains "Solid" in the final result)
      if (preserveStemPost) {
          // Cylinder centered at 0,0,0. 
          // Height * 2 ensures it covers the full height of inner mesh.
          const stemGeo = new THREE.CylinderGeometry(STEM_OR, STEM_OR, height * 2, 32);
          const stemMesh = new THREE.Mesh(stemGeo);
          stemMesh.updateMatrix(); // Identity matrix, centered at 0,0,0

          const stemCSG = CSG.fromMesh(stemMesh);
          
          // Void = Inner - StemPost
          voidCSG = innerCSG.subtract(stemCSG);
      }
      
      // Final = Base - Void
      const baseCSG = CSG.fromMesh(baseMesh);
      const resultCSG = baseCSG.subtract(voidCSG);
      
      const resultMesh = CSG.toMesh(resultCSG, baseMesh.matrix, baseMesh.material);
      resultMesh.castShadow = true;
      resultMesh.receiveShadow = true;
      resultMesh.updateMatrix();
      
      return resultMesh;
  }

  _subtractStemHole(keycapMesh) {
    keycapMesh.updateMatrix();

    // Box Geometry is centered at (0,0,0).
    // Height is STEM_DEPTH. Y range: -Depth/2 to +Depth/2.
    // We want the hole to be from 0 to Depth.
    // So we shift Y by +Depth/2.
    
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(CROSS_SIZE, STEM_DEPTH, CROSS_THICK));
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(CROSS_THICK, STEM_DEPTH, CROSS_SIZE));
    
    hBar.position.y = STEM_DEPTH / 2;
    vBar.position.y = STEM_DEPTH / 2;
    
    hBar.updateMatrix();
    vBar.updateMatrix();
    
    const keycapCSG = CSG.fromMesh(keycapMesh);
    const hBarCSG = CSG.fromMesh(hBar);
    const vBarCSG = CSG.fromMesh(vBar);

    // Subtract cross
    let resultCSG = keycapCSG.subtract(hBarCSG);
    resultCSG = resultCSG.subtract(vBarCSG);

    const resultMesh = CSG.toMesh(resultCSG, keycapMesh.matrix, keycapMesh.material);
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;
    resultMesh.updateMatrix();
    
    return resultMesh;
  }

  // 辅助方法：获取十字轴的几何体用于显示虚线
  // Make sure this matches _subtractStemHole logic exactly
  getStemGeometry() {
    const hBox = new THREE.BoxGeometry(CROSS_SIZE, STEM_DEPTH, CROSS_THICK);
    const vBox = new THREE.BoxGeometry(CROSS_THICK, STEM_DEPTH, CROSS_SIZE);
    
    return { hBox, vBox, stemDepth: STEM_DEPTH };
  }
}

