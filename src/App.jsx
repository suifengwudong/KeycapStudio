import React, { useState, useEffect } from 'react';
import DesignHeader   from './components/layout/DesignHeader';
import InspectorPanel from './components/panels/InspectorPanel';
import KeycapCanvas2D from './components/canvas/KeycapCanvas2D';
import Scene3D        from './components/canvas/Scene3D';
import PropertyPanel  from './components/layout/PropertyPanel';
import { useProjectStore, readAutosave } from './store/projectStore';

export default function App() {
  const [mode, setMode] = useState('2d'); // '2d' | '3d'
  const setProject = useProjectStore(s => s.setProject);

  // Crash-recovery: offer to restore autosave on first launch
  useEffect(() => {
    const saved = readAutosave();
    if (saved) {
      const restore = window.confirm(
        'An unsaved project was found. Restore it?'
      );
      if (restore) setProject(saved, { resetHistory: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Toolbar */}
      <DesignHeader mode={mode} setMode={setMode} />

      <div className="flex flex-1 overflow-hidden">
        {mode === '2d' ? (
          <>
            {/* Left inspector (2D mode) */}
            <InspectorPanel />

            {/* 2D canvas */}
            <main className="flex-1 relative overflow-hidden">
              <KeycapCanvas2D />
            </main>
          </>
        ) : (
          <>
            {/* 3D mode: keep existing layout */}
            <main className="flex-1 relative">
              <Scene3D />
            </main>
            <PropertyPanel />
          </>
        )}
      </div>
    </div>
  );
}
