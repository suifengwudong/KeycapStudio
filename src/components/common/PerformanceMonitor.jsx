import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(0);
  
  // Use refs for values that change every frame to avoid recreation
  const lastTime = React.useRef(performance.now());
  const frames = React.useRef(0);
  
  useFrame(() => {
    frames.current++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime.current;
    
    if (delta >= 1000) {
      setFps(Math.round((frames.current * 1000) / delta));
      setFrameTime((delta / frames.current).toFixed(2));
      frames.current = 0;
      lastTime.current = currentTime;
    }
  });

  return (
    <Html position={[-25, 15, 0]}>
      <div className="bg-black/70 text-white px-3 py-2 rounded text-xs font-mono select-none pointer-events-none">
        <div>FPS: {fps}</div>
        <div>Frame: {frameTime}ms</div>
      </div>
    </Html>
  );
}
