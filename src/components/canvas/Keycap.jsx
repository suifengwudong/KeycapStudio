import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { AsyncKeycapGenerator } from '../../core/geometry/AsyncKeycapGenerator';
import { Html } from '@react-three/drei';

// 创建全局生成器实例
const asyncGenerator = new AsyncKeycapGenerator();

export default function Keycap({ 
  profile = 'Cherry',
  size = '1u',
  color = '#ffffff',
  text = 'A',
  hasStem = true,
  topRadius = 0.5,
  wallThickness = 1.5,
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  // 监听参数变化，异步生成几何体
  useEffect(() => {
    // 标记是否取消（用于防止组件卸载后设置状态）
    let cancelled = false;
    
    const generateGeometry = async () => {
      // 只有当没有数据或者参数确实改变时才显示loading (简单处理：每次都显示)
      setIsLoading(true);
      
      try {
        const result = await asyncGenerator.generateAsync({
          profile,
          size,
          hasStem,
          topRadius,
          wallThickness,
        });
        
        if (!cancelled && mountedRef.current) {
          setData(result);
        }
      } catch (error) {
        console.error('生成键帽失败:', error);
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    generateGeometry();

    return () => {
      cancelled = true;
    };
  }, [profile, size, hasStem, topRadius, wallThickness]);

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 材质颜色更新 (不需要重新计算几何体)
  const material = useMemo(() => {
    if (!data || !data.material) return new THREE.MeshStandardMaterial({ color });
    const mat = data.material.clone();
    mat.color.set(color);
    mat.roughness = 0.6; // 确保质感
    return mat;
  }, [color, data]);

  // 加载中的占位符
  if (!data && isLoading) {
      return (
        <group>
             <Html center>
                <div className="bg-gray-800 text-white px-3 py-1 rounded text-sm shadow opacity-80 whitespace-nowrap">
                   Calculating...
                </div>
            </Html>
        </group>
      )
  }

  // 如果还在加载但是有旧数据，可以暂时显示旧数据（或者叠加loading指示）
  // 这里我们选择：如果有数据就显示数据，叠加上loading提示
  
  if (!data) return null;

  return (
    <group>
      {/* 键帽主体 */}
      <mesh 
        geometry={data.geometry} 
        material={material}
        castShadow
        receiveShadow
      />

      {/* 虚线显示内部十字轴 */}
      {hasStem && data.stemHelp && (
          <group position={[0, data.stemHelp.stemDepth / 2, 0]}>
              <lineSegments>
                  <edgesGeometry args={[data.stemHelp.hBox]} />
                  <lineBasicMaterial color="cyan" transparent opacity={0.3} depthTest={false} />
              </lineSegments>
              <lineSegments>
                  <edgesGeometry args={[data.stemHelp.vBox]} />
                  <lineBasicMaterial color="cyan" transparent opacity={0.3} depthTest={false} />
              </lineSegments>
          </group>
      )}

      {/* Loading Indicator Overlay */}
      {isLoading && (
        <Html center position={[0, 15, 0]}>
            <div className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                Updating...
            </div>
        </Html>
      )}
    </group>
  );
}
