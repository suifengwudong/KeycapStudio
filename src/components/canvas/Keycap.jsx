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
  const { geometry, material: generatedMaterial } = useMemo(() => {
    const generator = new KeycapGenerator();
    const mesh = generator.generate({
      profile,
      size,
      hasStem,
    });
    return {
      geometry: mesh.geometry,
      material: mesh.material 
    };
  }, [profile, size, hasStem]);

  // 材质 (颜色覆盖)
  const material = useMemo(() => {
    // 如果生成器返回了标准材质，我们克隆并只修改颜色
    const mat = generatedMaterial.clone();
    mat.color.set(color);
    return mat;
  }, [color, generatedMaterial]);

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
