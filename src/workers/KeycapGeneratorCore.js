import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CSG } from 'three-csg-ts';
import { PROFILES, KEYCAP_SIZES } from '../constants/profiles';

// Workaround for self reference in worker environment if needed
// simplistic version of KeycapGenerator copy-pasted or imported.
// Since we are moving to use this in worker, we keep it pure.

export class KeycapGenerator {
  generate(params) {
    const {
      profile = 'Cherry',
      size = '1u',
      hasStem = true,
      topRadius = 0.5,
      wallThickness = 1.5,
      height: overrideHeight
    } = params;
    
    // 1. 获取基础参数
    const profileData = PROFILES[profile] || PROFILES['Cherry'];
    const sizeData = KEYCAP_SIZES[size] || KEYCAP_SIZES['1u'];
    const height = overrideHeight || profileData.baseHeight;
    const bottomWidth = sizeData.width;
    const bottomDepth = sizeData.depth;
    
    // 2. 生成外壳
    let mesh = this._createBaseMesh(bottomWidth, bottomDepth, height, profileData, topRadius);

    // 3. 挖内胆
    if (wallThickness > 0 && wallThickness < bottomWidth / 2) {
        mesh = this._subtractInnerBody(mesh, bottomWidth, height, wallThickness);
    }

    // 4. 挖十字轴孔
    if (hasStem) {
      mesh = this._subtractStem(mesh);
    }

    return mesh;
  }

  _createBaseMesh(bottomWidth, bottomDepth, height, profileData, topRadius) {
    const steps = 10; 
    const radius = Math.max(0.01, topRadius / bottomWidth); 
    
    // Geometry creation
    const geometry = new RoundedBoxGeometry(1, 1, 1, steps, radius);
    
    // Vertex transformation logic...
    // Note: In worker, we might not want to create Meshes if we can just return GeometryBuffer
    // But CSG needs Mesh. So we keep using Mesh inside here.
    
    const topWidth = 12.7; 
    const topDepth = 12.7; 
    const dishDepth = 1.2; 

    // Access attributes
    const pos = geometry.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i); 
        const z = pos.getZ(i);

        const normalizedY = y + 0.5;
        let currentH = normalizedY * height;

        const currentW = bottomWidth + (topWidth - bottomWidth) * normalizedY;
        const currentD = bottomDepth + (topDepth - bottomDepth) * normalizedY;

        let finalX = x * currentW;
        let finalZ = z * currentD;

        if (normalizedY > 0.9) {
             const distXY = Math.sqrt(finalX * finalX + finalZ * finalZ);
             const maxDim = Math.max(bottomWidth, bottomDepth);
             const normalizedDist = Math.min(distXY / (maxDim / 2), 1.0);
             const sag = Math.pow(normalizedDist, 2) * dishDepth;
             currentH -= sag;
        }

        pos.setXYZ(i, finalX, currentH, finalZ);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  _subtractInnerBody(outerMesh, width, height, thickness) {
      outerMesh.updateMatrix();
      
      const scaleX = (width - thickness * 2) / width;
      const scaleY = (height - thickness) / height;

      const innerMesh = outerMesh.clone();
      innerMesh.scale.set(scaleX, scaleY, scaleX);
      
      const outerCSG = CSG.fromMesh(outerMesh);
      const innerCSG = CSG.fromMesh(innerMesh);
      
      const resultCSG = outerCSG.subtract(innerCSG);
      
      const resultMesh = CSG.toMesh(resultCSG, outerMesh.matrix, outerMesh.material);
      return resultMesh;
  }

  _subtractStem(keycapMesh) {
    keycapMesh.updateMatrix();

    const crossSize = 4.1; 
    const crossThick = 1.35; 
    const stemDepth = 3.8;
    
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(crossSize, stemDepth, crossThick));
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(crossThick, stemDepth, crossSize));
    
    hBar.position.y = stemDepth / 2;
    vBar.position.y = stemDepth / 2;
    hBar.updateMatrix();
    vBar.updateMatrix();

    const keycapCSG = CSG.fromMesh(keycapMesh);
    const hBarCSG = CSG.fromMesh(hBar);
    const vBarCSG = CSG.fromMesh(vBar);

    let resultCSG = keycapCSG.subtract(hBarCSG);
    resultCSG = resultCSG.subtract(vBarCSG);

    const resultMesh = CSG.toMesh(resultCSG, keycapMesh.matrix, keycapMesh.material);
    return resultMesh;
  }
}
