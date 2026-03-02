import React, { useState, useEffect, lazy, Suspense } from 'react';
import DesignHeader   from './components/layout/DesignHeader';
import InspectorPanel from './components/panels/InspectorPanel';
import KeycapCanvas2D from './components/canvas/KeycapCanvas2D';
import ExportOverlay  from './components/common/ExportOverlay';
import PresetsGallery from './components/common/PresetsGallery';
import { useAssetStore, readKcsAutosave } from './store/assetStore';
import { useProjectStore } from './store/projectStore';
import { startKcsAutosave, stopKcsAutosave } from './core/io/kcsIO';
import { useExportController } from './hooks/useExportController';
import { useT } from './store/langStore';

// ── Lazy-load the 3D components so three.js is only fetched when needed ───────
const Scene3D       = lazy(() => import('./components/canvas/Scene3D'));
const NodeInspector = lazy(() => import('./components/panels/NodeInspector'));

function ThreeDFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full text-gray-500 text-sm">
      Loading 3D viewport…
    </div>
  );
}

export default function App() {
  const t = useT();
  const [mode, setMode] = useState('3d'); // start in Shape (3D) – step 1 of the flow
  const [presetsOpen, setPresetsOpen] = useState(false);
  const loadAsset         = useAssetStore(s => s.loadAsset);
  const setUiContext      = useAssetStore(s => s.setUiContext);
  const setSelectedLegend = useProjectStore(s => s.setSelectedLegend);
  const { isExporting, stage, runExport } = useExportController();

  // Crash-recovery: offer to restore autosave on first launch
  useEffect(() => {
    const saved = readKcsAutosave();
    if (saved) {
      const restore = window.confirm(t('confirmRestore'));
      if (restore) {
        loadAsset(saved, { resetDirty: true });
        // Restore UI context (mode + selected legend)
        const ctx = saved.uiContext;
        if (ctx) {
          if (ctx.mode) setMode(ctx.mode);
          if (ctx.selectedLegend) setSelectedLegend(ctx.selectedLegend);
        }
      } else {
        // No saved project – show preset gallery so user can start immediately
        setPresetsOpen(true);
      }
    } else {
      // First launch: show preset gallery
      setPresetsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist mode to uiContext whenever it changes
  useEffect(() => {
    setUiContext({ mode });
  }, [mode, setUiContext]);

  // 30-second periodic autosave (safety net on top of on-change writes)
  useEffect(() => {
    startKcsAutosave(() => useAssetStore.getState().asset);
    return () => stopKcsAutosave();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Export overlay – blocks all interaction during export */}
      <ExportOverlay open={isExporting} stage={stage} />

      {/* Preset gallery overlay */}
      <PresetsGallery open={presetsOpen} onClose={() => setPresetsOpen(false)} />

      {/* Toolbar */}
      <DesignHeader
        mode={mode}
        setMode={setMode}
        isExporting={isExporting}
        runExport={runExport}
        onOpenPresets={() => setPresetsOpen(true)}
      />

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
            {/* 3D mode: viewport | right inspector (no Outliner) */}
            <main className="flex-1 relative">
              <Suspense fallback={<ThreeDFallback />}>
                <Scene3D />
              </Suspense>
            </main>
            <aside className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto">
              <div className="p-3 border-b border-gray-700">
                <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{t('inspector')}</h2>
              </div>
              <Suspense fallback={null}>
                <NodeInspector />
              </Suspense>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

