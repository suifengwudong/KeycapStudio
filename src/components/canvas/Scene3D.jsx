import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Stage, 
  Grid, 
  Environment 
} from '@react-three/drei';
import Keycap from './Keycap';
import { useKeycapStore } from '../../store/keycapStore';

export default function Scene3D() {
  const params = useKeycapStore(state => state.params);

  return (
    <Canvas
      camera={{ position: [30, 30, 30], fov: 50 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={null}>
        {/* 环境光照 */}
        <Environment preset="studio" />
        
        {/* 舞台灯光 */}
        <Stage
          intensity={0.5}
          shadows="contact"
          adjustCamera={false}
        >
          {/* 键帽模型 */}
          <Keycap {...params} />
        </Stage>
        
        {/* 网格地面 */}
        <Grid 
          args={[100, 100]} 
          cellSize={5} 
          cellColor="#6f6f6f"
          sectionColor="#9d4b4b"
        />
        
        {/* 相机控制 */}
        <OrbitControls 
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Suspense>
    </Canvas>
  );
}
