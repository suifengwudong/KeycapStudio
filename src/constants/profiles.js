import * as THREE from 'three';

/**
 * 键帽高度曲线数据
 * 基于真实键帽尺寸测量
 */
export const PROFILES = {
  Cherry: {
    name: 'Cherry Profile',
    baseHeight: 11.2,
    topWidth: 12.7,
    bottomWidth: 18.2,
    topCurvature: 'cylindrical',
    radius: 90,
    
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
    bottomWidth: 18.2,
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
    bottomWidth: 18.2,
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
    bottomWidth: 18.2,
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
  '1u':       { width: 18.2,   depth: 18.2 },
  '1.25u':    { width: 22.75,  depth: 18.2 },
  '1.5u':     { width: 27.3,   depth: 18.2 },
  '1.75u':    { width: 31.85,  depth: 18.2 },
  '2u':       { width: 36.4,   depth: 18.2 },
  '2.25u':    { width: 40.95,  depth: 18.2 },
  '2.75u':    { width: 50.05,  depth: 18.2 },
  '6.25u':    { width: 113.75, depth: 18.2 },
  'ISO-Enter': { width: 22.75, depth: 27.3 }
};
