import React, { useState, useEffect } from 'react';
import DesignHeader   from './components/layout/DesignHeader';
import InspectorPanel from './components/panels/InspectorPanel';
import KeycapCanvas2D from './components/canvas/KeycapCanvas2D';
import Scene3D        from './components/canvas/Scene3D';
import Outliner       from './components/panels/Outliner';
import NodeInspector  from './components/panels/NodeInspector';
import { useAssetStore, readKcsAutosave } from './store/assetStore';

export default function App() {
  const [mode, setMode] = useState('3d'); // start in Shape (3D) – step 1 of the flow
  const loadAsset = useAssetStore(s => s.loadAsset);

  // Crash-recovery: offer to restore autosave on first launch
  useEffect(() => {
    const saved = readKcsAutosave();
    if (saved) {
      const restore = window.confirm(
        'An unsaved project was found. Restore it?'
      );
      if (restore) loadAsset(saved, { resetDirty: true });
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
            {/* 3D mode: Outliner | viewport | NodeInspector */}
            <aside className="w-48 bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
              <Outliner />
            </aside>
            <main className="flex-1 relative">
              <Scene3D />
            </main>
            <aside className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto">
              <div className="p-3 border-b border-gray-700">
                <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Inspector</h2>
              </div>
              <NodeInspector />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

