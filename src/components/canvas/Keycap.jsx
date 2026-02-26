import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { asyncGenerator } from '../../core/geometry/generatorInstance';
import { Html } from '@react-three/drei';
import { useKeycapStore } from '../../store/keycapStore';

// 创建全局生成器实例 (Exported for PerformanceSettings)
export { asyncGenerator };

//  加载指示器组件
function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="bg-gray-800/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xl">
          正在生成键帽...
        </div>
      </div>
    </Html>
  );
}

//  占位符组件
function PlaceholderKeycap({ size = '1u' }) {
  const sizeMap = {
    '1u': [18, 18, 11.5],
    '1.25u': [22.5, 18, 11.5],
    '1.5u': [27, 18, 11.5],
    '2u': [36, 18, 11.5],
  };
  
  const dimensions = sizeMap[size] || sizeMap['1u'];
  
  return (
    <mesh position={[0, dimensions[2] / 2, 0]}>
      <boxGeometry args={dimensions} />
      <meshStandardMaterial 
        color="#333333" 
        transparent 
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

export default function Keycap({ 
  profile = 'Cherry',
  size = '1u',
  color = '#ffffff',
  text = 'A',
  hasStem = true,
  topRadius = 0.5,
  wallThickness = 1.5,
}) {
  const [geometryData, setGeometryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  //  监听参数变化，异步生成几何体
  useEffect(() => {
    // 取消之前的生成任务
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = { abort: () => {} };
    let cancelled = false;
    
    const generateGeometry = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await asyncGenerator.generatePreviewAsync({
          profile,
          size,
          hasStem,
          topRadius,
          wallThickness,
        });
        
        if (!cancelled && mountedRef.current) {
          if (result) {
            setGeometryData(result);
          } else {
            setError('生成失败');
          }
        }
      } catch (err) {
        console.error('生成键帽失败:', err);
        if (!cancelled && mountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    generateGeometry();

    abortControllerRef.current.abort = () => {
      cancelled = true;
    };

    return () => {
      cancelled = true;
    };
  }, [profile, size, hasStem, topRadius, wallThickness]);

  //  组件卸载时清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  //  颜色材质（不需要重新生成几何体）
  const material = useMemo(() => {
    if (!geometryData?.material) return null;
    
    const mat = geometryData.material.clone();
    mat.color.set(color);
    mat.needsUpdate = true;
    
    return mat;
  }, [color, geometryData]);

  //  错误状态
  if (error) {
    return (
      <group>
        <PlaceholderKeycap size={size} />
        <Html center>
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
             {error}
          </div>
        </Html>
      </group>
    );
  }

  //  加载中状态
  if (isLoading && !geometryData) {
    return (
      <group>
        <PlaceholderKeycap size={size} />
        <LoadingIndicator />
      </group>
    );
  }

  //  没有数据时
  if (!geometryData) {
    return <PlaceholderKeycap size={size} />;
  }

  return (
    <group>
      {/*  键帽主体 */}
      <mesh 
        geometry={geometryData.geometry} 
        material={material}
        castShadow
        receiveShadow
      />

      {/*  十字轴辅助线（半透明） */}
      {hasStem && geometryData.stemHelp && (
        <group position={[0, geometryData.stemHelp.stemDepth / 2, 0]}>
          <lineSegments>
            <edgesGeometry args={[geometryData.stemHelp.hBox]} />
            <lineBasicMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.25} 
              depthTest={false} 
            />
          </lineSegments>
          <lineSegments>
            <edgesGeometry args={[geometryData.stemHelp.vBox]} />
            <lineBasicMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.25} 
              depthTest={false} 
            />
          </lineSegments>
        </group>
      )}

      {/*  更新中提示（叠加在模型上） */}
      {isLoading && geometryData && (
        <Html 
          center 
          position={[0, 20, 0]}
          distanceFactor={10}
        >
          <div className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            更新中...
          </div>
        </Html>
      )}
    </group>
  );
}
