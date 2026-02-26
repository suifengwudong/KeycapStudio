import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeycapStore } from '../../store/keycapStore';

export function PerformanceMonitor() {
  const setPerformanceStats = useKeycapStore(state => state.setPerformanceStats);

  const lastTime = React.useRef(performance.now());
  const frames = React.useRef(0);

  useFrame(() => {
    frames.current++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime.current;

    if (delta >= 1000) {
      setPerformanceStats({
        fps: Math.round((frames.current * 1000) / delta),
        frameTime: (delta / frames.current).toFixed(2),
      });
      frames.current = 0;
      lastTime.current = currentTime;
    }
  });

  return null;
}
