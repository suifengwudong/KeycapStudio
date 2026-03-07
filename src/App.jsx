import React, { useState, useEffect, lazy, Suspense } from 'react';
import DesignHeader   from './components/layout/DesignHeader';
import ExportOverlay  from './components/common/ExportOverlay';
import PresetsGallery from './components/common/PresetsGallery';
import { useAssetStore, readKcsAutosave } from './store/assetStore';
import { startKcsAutosave, stopKcsAutosave, clearKcsAutosave } from './core/io/kcsIO';
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

/**
 * In-page restore-confirmation dialog.
 * Replaces the native window.confirm() so the UI renders immediately and the
 * dialog is part of the React tree (no browser blocking of the render loop).
 */
function RestoreDialog({ onRestore, onDiscard }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4">
        <p className="text-white text-sm mb-5">{t('confirmRestore')}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            {t('restoreNo')}
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            {t('restoreYes')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const t = useT();
  const [presetsOpen,   setPresetsOpen]   = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null); // holds unsaved doc while user decides
  const loadAsset    = useAssetStore(s => s.loadAsset);
  const { isExporting, stage, runExport } = useExportController();

  // Crash-recovery: show an in-page dialog instead of blocking window.confirm()
  // so the full React UI renders first and the dialog is non-blocking.
  useEffect(() => {
    const saved = readKcsAutosave();
    if (saved) {
      setPendingRestore(saved);
    } else {
      setPresetsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestoreYes = () => {
    if (pendingRestore) loadAsset(pendingRestore, { resetDirty: true });
    setPendingRestore(null);
  };

  const handleRestoreNo = () => {
    clearKcsAutosave();
    setPendingRestore(null);
    setPresetsOpen(true);
  };

  // 30-second periodic autosave (safety net on top of on-change writes)
  useEffect(() => {
    startKcsAutosave(() => useAssetStore.getState().asset);
    return () => stopKcsAutosave();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Export overlay – blocks all interaction during export */}
      <ExportOverlay open={isExporting} stage={stage} />

      {/* Autosave restore dialog (replaces native window.confirm) */}
      {pendingRestore && (
        <RestoreDialog onRestore={handleRestoreYes} onDiscard={handleRestoreNo} />
      )}

      {/* Preset gallery overlay */}
      <PresetsGallery open={presetsOpen} onClose={() => setPresetsOpen(false)} />

      {/* Toolbar */}
      <DesignHeader
        isExporting={isExporting}
        runExport={runExport}
        onOpenPresets={() => setPresetsOpen(true)}
      />

      {/* 3D workspace: viewport | right inspector */}
      <div className="flex flex-1 overflow-hidden">
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
      </div>
    </div>
  );
}

