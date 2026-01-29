import * as THREE from 'three';

/**
 * 键帽高度曲线数据
 * 基于真实键帽尺寸测量
 */
export const PROFILES = {
  Cherry: {
    name: 'Cherry Profile',
    baseHeight: 11.5,
    topWidth: 12.7,
    bottomWidth: 18,
    topCurvature: 'spherical',
    radius: 40,
    
    // 生成轮廓点（用于旋转或拉伸）
    generatePoints: (height) => {
      const points = [];
      const steps = 20;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = height * t;
        
        // 球面曲线公式
        const r = 9 - 3.5 * Math.pow(t, 2);
        points.push(new THREE.Vector2(r, y));
      }
      
      return points;
    }
  },
  
  SA: {
    name: 'SA Profile',
    baseHeight: 14.5,
    topWidth: 13.5,
    bottomWidth: 18,
    topCurvature: 'cylindrical',
    
    generatePoints: (height) => {
      // TODO: SA的圆柱面轮廓
      return [];
    }
  },
  
  DSA: {
    name: 'DSA Profile',
    baseHeight: 7.4,
    topWidth: 12.7,
    bottomWidth: 18,
    topCurvature: 'spherical',
    
    generatePoints: (height) => {
      // TODO: DSA的球面低矮轮廓
      return [];
    }
  },
  
  OEM: {
    name: 'OEM Profile',
    baseHeight: 11.9,
    topWidth: 12.7,
    bottomWidth: 18,
    topCurvature: 'cylindrical',
    
    generatePoints: (height) => {
      // TODO: OEM的圆柱面轮廓
      return [];
    }
  }
};

/**
 * 键帽尺寸定义（单位：mm）
 */
export const KEYCAP_SIZES = {
  '1u': { width: 18, depth: 18 },
  '1.25u': { width: 22.5, depth: 18 },
  '1.5u': { width: 27, depth: 18 },
  '1.75u': { width: 31.5, depth: 18 },
  '2u': { width: 36, depth: 18 },
  '2.25u': { width: 40.5, depth: 18 },
  '2.75u': { width: 49.5, depth: 18 },
  '6.25u': { width: 112.5, depth: 18 },
  'ISO-Enter': { width: 22.5, depth: 27 }
};
