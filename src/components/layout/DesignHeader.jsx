/**
 * KeycapStudio – Toolbar / Header
 *
 * Single-mode (3D) toolbar.
 *
 * File operations:
 *   New Project | Presets | Open Project (.kcs.json) | Save Project (.kcs.json)
 *
 * Export:
 *   Export STL | Batch Export | Export Package
 *
 * Legacy: Import .keycap | Export .keycap
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSceneStore } from '../../store/sceneStore.js';
import { useAssetStore } from '../../store/assetStore.js';
import { openKcsFile, saveKcsFile } from '../../core/io/kcsIO.js';
import { openProjectFile, saveProjectFile } from '../../core/io/projectIO.js';
import { exportPackage } from '../../core/export/exportPackage.js';
import { exportSceneSTL } from '../../core/csg/csgEvaluator.js';
import { batchExportSTL } from '../../core/export/batchExport.js';
import { makeExportNames } from '../../core/io/filename.js';
import { useProjectStore } from '../../store/projectStore.js';
import BatchExportDialog from '../common/BatchExportDialog.jsx';
import LangSwitcher from '../common/LangSwitcher.jsx';
import { useT } from '../../store/langStore.js';

function ToolbarBtn({ onClick, disabled, children, title, variant = 'default' }) {
  const base  = 'px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed';
  const theme = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-500 text-white'
    : variant === 'success'
    ? 'bg-green-700 hover:bg-green-600 text-white'
    : variant === 'danger'
    ? 'bg-red-700 hover:bg-red-600 text-white'
    : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600';
  return (
    <button className={`${base} ${theme}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export default function DesignHeader({ isExporting, runExport, onOpenPresets }) {
  const t     = useT();
  const scene = useSceneStore(s => s.scene);

  const { asset, isDirty, loadAsset, newAsset, markSaved, syncLegend2dFromProject } = useAssetStore();
  const assetName = asset?.asset?.name ?? 'New Project';

  const project            = useProjectStore(s => s.project);
  const [legacyOpen,      setLegacyOpen]      = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  // ── File handlers ─────────────────────────────────────────────────────────

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm(t('confirmDiscard'))) return;
    newAsset();
    onOpenPresets?.();
  }, [isDirty, newAsset, onOpenPresets, t]);

  const handleOpenProject = useCallback(async () => {
    if (isDirty && !window.confirm(t('confirmDiscard'))) return;
    try {
      const doc = await openKcsFile();
      loadAsset(doc, { resetDirty: true });
    } catch (e) {
      if (e.message !== 'No file selected') alert(`Open failed: ${e.message}`);
    }
  }, [isDirty, loadAsset, t]);

  const handleSaveProject = useCallback(() => {
    syncLegend2dFromProject();
    saveKcsFile(useAssetStore.getState().asset, `${assetName}.kcs.json`);
    markSaved();
  }, [assetName, markSaved, syncLegend2dFromProject]);

  // ── Export handlers ───────────────────────────────────────────────────────

  const validateScene = useCallback(() => {
    if (!scene?.root) throw new Error('Scene is empty – nothing to export.');
  }, [scene]);

  const handleExportSTL = useCallback(() => {
    if (isExporting) return;
    const latestKcs = useAssetStore.getState().asset;
    const { stl } = makeExportNames(latestKcs);
    runExport(
      async ({ setStage }) => {
        validateScene();
        await exportSceneSTL(scene, stl, setStage);
      },
      {
        initialStage: 'Starting STL export…',
        successMessage: `STL exported: ${stl}`,
        errorMessageMapper: (e) => {
          const m = e?.message ?? '';
          if (m.includes('CSG')) return 'Export failed: geometry error – check wall thickness / corner radius';
          return `Export failed: ${m || 'unknown error'}`;
        },
      },
    );
  }, [isExporting, runExport, scene, validateScene]);

  const handleExportPackage = useCallback(() => {
    if (isExporting) return;
    syncLegend2dFromProject();
    const latestKcs     = useAssetStore.getState().asset;
    const latestProject = useProjectStore.getState().project;
    const names = makeExportNames(latestKcs);
    runExport(
      async ({ setStage }) => {
        validateScene();
        await exportPackage(latestKcs, latestProject, scene, (s) => setStage(s));
      },
      {
        initialStage: 'Starting package export…',
        successMessage: `Package exported: ${names.stl}, ${names.png}, ${names.svg}`,
        errorMessageMapper: (e) => {
          const m = e?.message ?? '';
          if (m.includes('CSG')) return 'Export failed: geometry error – check wall thickness / corner radius';
          return `Export failed: ${m || 'unknown error'}`;
        },
      },
    );
  }, [isExporting, runExport, scene, syncLegend2dFromProject, validateScene]);

  const handleBatchExport = useCallback((sizes) => {
    setBatchDialogOpen(false);
    if (isExporting) return;
    const latestKcs  = useAssetStore.getState().asset;
    const baseParams = latestKcs.shape3d.params;
    runExport(
      async ({ setStage }) => { await batchExportSTL(baseParams, sizes, setStage); },
      {
        initialStage    : 'Starting batch export…',
        successMessage  : `Batch export complete: ${sizes.length} files`,
        errorMessageMapper: (e) => `Batch export failed: ${e?.message ?? 'unknown error'}`,
      },
    );
  }, [isExporting, runExport]);

  // ── Legacy .keycap ────────────────────────────────────────────────────────

  const handleImportKeycap = useCallback(async () => {
    try {
      const loaded = await openProjectFile();
      loadAsset({
        ...useAssetStore.getState().asset,
        legend2d: { keycap: loaded.keycap, legends: loaded.legends },
      }, { resetDirty: false });
      setLegacyOpen(false);
    } catch (e) {
      if (e.message !== 'No file selected') alert(`Import failed: ${e.message}`);
    }
  }, [loadAsset]);

  const handleExportKeycap = useCallback(() => {
    saveProjectFile(project);
    setLegacyOpen(false);
  }, [project]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSaveProject]);

  return (
    <>
      <BatchExportDialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        onExport={handleBatchExport}
        isExporting={isExporting}
      />

      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
        {/* Logo */}
        <span className="text-sm font-bold text-white mr-2 select-none">{t('appTitle')}</span>

        <span className="w-px h-5 bg-gray-600" />

        {/* File ops */}
        <ToolbarBtn onClick={handleNew}          title={t('btnNew')}>{t('btnNew')}</ToolbarBtn>
        <ToolbarBtn onClick={onOpenPresets}       title={t('btnPresets')}>{t('btnPresets')}</ToolbarBtn>
        <ToolbarBtn onClick={handleOpenProject}   title={t('btnOpenProject')}>{t('btnOpenProject')}</ToolbarBtn>
        <ToolbarBtn
          onClick={handleSaveProject}
          variant={isDirty ? 'primary' : 'default'}
          title={`${t('btnSaveProject')} (Ctrl+S)`}
        >
          {isDirty ? t('btnSaveProjectDirty') : t('btnSaveProject')}
        </ToolbarBtn>

        <span className="w-px h-5 bg-gray-600" />

        {/* Export ops */}
        <ToolbarBtn onClick={handleExportSTL}     disabled={isExporting} variant="success" title={t('btnExportSTL')}>{t('btnExportSTL')}</ToolbarBtn>
        <ToolbarBtn onClick={() => setBatchDialogOpen(true)} disabled={isExporting} title={t('btnBatchExport')}>{t('btnBatchExport')}</ToolbarBtn>
        <ToolbarBtn onClick={handleExportPackage} disabled={isExporting} variant="primary" title={t('btnExportPackage')}>{t('btnExportPackage')}</ToolbarBtn>

        <span className="w-px h-5 bg-gray-600" />

        {/* Legacy menu */}
        <div className="relative">
          <ToolbarBtn onClick={() => setLegacyOpen(v => !v)} title={t('btnLegacy')}>{t('btnLegacy')}</ToolbarBtn>
          {legacyOpen && (
            <div className="absolute top-full right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 min-w-max text-xs">
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={handleImportKeycap}>{t('legacyImport')}</button>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={handleExportKeycap}>{t('legacyExport')}</button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Language switcher */}
        <LangSwitcher />
      </header>
    </>
  );
}

