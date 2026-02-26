import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment,
  ContactShadows,
  Lightformer,
  Grid
} from '@react-three/drei';
import * as THREE from 'three';
import { useKeycapStore } from '../../store/keycapStore';
import { useSceneStore } from '../../store/sceneStore';
import { PerformanceMonitor } from '../common/PerformanceMonitor';
import SceneNodeRenderer from './SceneNodeRenderer';

function PerformanceOverlay() {
  const { fps, frameTime } = useKeycapStore(state => state.performanceStats);
  return (
    <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono select-none pointer-events-none z-10">
      <div>FPS: {fps}</div>
      <div>Frame: {frameTime}ms</div>
    </div>
  );
}

export default function Scene3D() {
  const scene = useSceneStore(s => s.scene);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ 
          position: [35, 35, 35], 
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        shadows
        dpr={[1, 2]}  // 设备像素比（移动端 1x，桌面 2x）
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false,
          //  启用高质量渲染
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <Suspense fallback={null}>
          {/*  专业级环境光 */}
          <Environment 
            preset="studio" 
            background={false}
            blur={0.8}
          >
            {/* 添加自定义光源形状 */}
            <group rotation={[-Math.PI / 3, 0, 0]}>
              <Lightformer
                form="ring"
                intensity={3}
                rotation-x={Math.PI / 2}
                position={[0, 5, -9]}
                scale={2}
              />
              <Lightformer
                form="rect"
                intensity={2}
                rotation-y={Math.PI / 2}
                position={[-5, 1, -1]}
                scale={[20, 0.1, 1]}
              />
              <Lightformer
                form="rect"
                intensity={2}
                rotation-y={-Math.PI / 2}
                position={[10, 1, 0]}
                scale={[20, 1, 1]}
              />
            </group>
          </Environment>
          
          {/*  真实接触阴影 */}
          <ContactShadows
            position={[0, -0.05, 0]}
            opacity={0.4}
            scale={30}
            blur={2.5}
            far={4}
            resolution={256}
            color="#000000"
          />
          
          {/* Scene document nodes */}
          <SceneNodeRenderer scene={scene} />
          
          {/*  参考网格 */}
          <Grid 
            args={[100, 100]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#6f6f6f"
            sectionSize={25}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={400}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
          
          {/*  优化的相机控制 */}
          <OrbitControls 
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
            minDistance={10}
            maxDistance={100}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            panSpeed={0.5}
            zoomSpeed={0.8}
          />
          <PerformanceMonitor />
        </Suspense>
      </Canvas>
      <PerformanceOverlay />
    </div>
  );
}
