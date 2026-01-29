import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { KeycapGenerator } from '../../core/geometry/KeycapGenerator';

export default function Keycap({ 
  profile = 'Cherry',
  size = '1u',
  color = '#ffffff',
  text = 'A',
  hasStem = true
}) {
  // 生成键帽几何体
  const geometry = useMemo(() => {
    const generator = new KeycapGenerator();
    const mesh = generator.generate({
      profile,
      size,
      hasStem
    });
    return mesh.geometry;
  }, [profile, size, hasStem]);

  // 材质
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.1
    });
  }, [color]);

  return (
    <group>
      {/* 键帽主体 */}
      <mesh 
        geometry={geometry} 
        material={material}
        castShadow
        receiveShadow
      >
        {/* TODO: 添加文字贴图 */}
      </mesh>
      
      {/* 调试辅助 */}
      {/* <axesHelper args={[20]} /> */}
    </group>
  );
}
