/**
 * KeycapStudio – Toolbar / Header
 *
 * Unified for the keycap-asset product loop:
 *   1 Shape (3D)  →  2 Legends (2D)  →  3 Export
 *
 * File operations (all modes):
 *   New Project | Open Project (.kcs.json) | Save Project (.kcs.json)
 *   Legacy: Import .keycap | Export .keycap
 *
 * 3D mode extras:  Next: Legends →
 * 2D mode extras:  ← Back: Shape | Export dropdown | Undo | Redo
 * Both modes:      Export Package (STL + PNG@4x + SVG)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore.js';
import { useSceneStore } from '../../store/sceneStore.js';
import { useAssetStore, readKcsAutosave } from '../../store/assetStore.js';
import { openKcsFile, saveKcsFile } from '../../core/io/kcsIO.js';
import { openProjectFile, saveProjectFile } from '../../core/io/projectIO.js';
import { exportPNG } from '../../core/export/PNGExporter.js';
import { exportSVG } from '../../core/export/SVGExporter.js';
import { exportPackage } from '../../core/export/exportPackage.js';
import { exportSceneSTL } from '../../core/csg/csgEvaluator.js';
import { batchExportSTL } from '../../core/export/batchExport.js';
import { makeExportNames } from '../../core/io/filename.js';
import BatchExportDialog from '../common/BatchExportDialog.jsx';

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

/** Slim stage indicator: 1 Shape → 2 Legends → 3 Export */
function StageIndicator({ mode }) {
  const steps = [
    { key: '3d', label: '1 Shape' },
    { key: '2d', label: '2 Legends' },
    { key: 'export', label: '3 Export' },
  ];
  const activeIdx = mode === '3d' ? 0 : mode === '2d' ? 1 : 2;
  return (
    <div className="flex items-center gap-0 text-xs select-none">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <span className={`px-2 py-0.5 rounded ${activeIdx === i ? 'bg-blue-700 text-white font-semibold' : 'text-gray-400'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-gray-600 mx-0.5">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function DesignHeader({ mode, setMode, isExporting, runExport, onOpenPresets }) {
  const project   = useProjectStore(s => s.project);
  const isDirty2d = useProjectStore(s => s.isDirty);
  const past      = useProjectStore(s => s.past);
  const future    = useProjectStore(s => s.future);
  const undo      = useProjectStore(s => s.undo);
  const redo      = useProjectStore(s => s.redo);

  const scene     = useSceneStore(s => s.scene);

  const { asset, isDirty, loadAsset, newAsset, markSaved, syncLegend2dFromProject } = useAssetStore();
  const assetName = asset?.asset?.name ?? 'New Project';

  const [exportOpen,      setExportOpen]      = useState(false);
  const [legacyOpen,      setLegacyOpen]      = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  // ── Unified project handlers ──────────────────────────────────────────────

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    newAsset();
    onOpenPresets?.(); // open preset gallery after creating blank project
  }, [isDirty, newAsset, onOpenPresets]);

  const handleOpenProject = useCallback(async () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    try {
      const doc = await openKcsFile();
      loadAsset(doc, { resetDirty: true });
    } catch (e) {
      if (e.message !== 'No file selected') alert(`Open failed: ${e.message}`);
    }
  }, [isDirty, loadAsset]);

  const handleSaveProject = useCallback(() => {
    // Sync 2D edits into asset before saving, then read the updated state
    syncLegend2dFromProject();
    // Re-read from store to get the just-synced asset
    saveKcsFile(useAssetStore.getState().asset, `${assetName}.kcs.json`);
    markSaved();
  }, [assetName, markSaved, syncLegend2dFromProject]);

  // ── Shared export validation ──────────────────────────────────────────────

  const validateSceneForExport = useCallback(() => {
    if (!scene?.root) throw new Error('Scene is empty – nothing to export.');
    return true;
  }, [scene]);

  // ── 3D STL export ─────────────────────────────────────────────────────────

  const handleExportSTL = useCallback(() => {
    if (isExporting) return;
    const latestKcs = useAssetStore.getState().asset;
    const { stl } = makeExportNames(latestKcs);
    runExport(
      async ({ setStage }) => {
        validateSceneForExport();
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
  }, [isExporting, runExport, scene, validateSceneForExport]);

  // ── Export package handler ────────────────────────────────────────────────

  const handleExportPackage = useCallback(() => {
    if (isExporting) return;
    syncLegend2dFromProject();
    const latestKcs     = useAssetStore.getState().asset;
    const latestProject = useProjectStore.getState().project;
    const names = makeExportNames(latestKcs);
    runExport(
      async ({ setStage }) => {
        validateSceneForExport();
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
  }, [isExporting, runExport, scene, syncLegend2dFromProject, validateSceneForExport]);

  // ── 2D export dropdown ────────────────────────────────────────────────────

  const handleBatchExport = useCallback((sizes) => {
    setBatchDialogOpen(false);
    if (isExporting) return;
    const latestKcs = useAssetStore.getState().asset;
    const baseParams = latestKcs.shape3d.params;
    runExport(
      async ({ setStage }) => {
        await batchExportSTL(baseParams, sizes, setStage);
      },
      {
        initialStage    : 'Starting batch export…',
        successMessage  : `Batch export complete: ${sizes.length} files`,
        errorMessageMapper: (e) => `Batch export failed: ${e?.message ?? 'unknown error'}`,
      },
    );
  }, [isExporting, runExport]);

  const handleExportPNG = useCallback((scale, transparentBg) => {
    exportPNG(project, scale, transparentBg);
    setExportOpen(false);
  }, [project]);

  const handleExportSVG = useCallback((transparentBg) => {
    exportSVG(project, transparentBg);
    setExportOpen(false);
  }, [project]);

  // ── Legacy .keycap import/export ─────────────────────────────────────────

  const handleImportKeycap = useCallback(async () => {
    try {
      const loaded = await openProjectFile();
      // Only replaces legend2d; shape3d is unchanged
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
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSaveProject();
        return;
      }

      if (mode === '2d') {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
          return;
        }
        if ((e.key === 'y' || e.key === 'Y') && !e.shiftKey) {
          e.preventDefault();
          redo();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSaveProject, mode, undo, redo]);

  return (
    <>
      {/* Batch Export Dialog */}
      <BatchExportDialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        onExport={handleBatchExport}
        isExporting={isExporting}
      />

      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
        {/* Logo */}
        <span className="text-sm font-bold text-white mr-2 select-none">⌨ Keycap Studio</span>

        {/* Divider */}
        <span className="w-px h-5 bg-gray-600" />

        {/* Unified file ops (always visible) */}
        <ToolbarBtn onClick={handleNew} title="New blank project">New</ToolbarBtn>
        <ToolbarBtn onClick={onOpenPresets} title="Start from a common keycap preset">Presets</ToolbarBtn>
        <ToolbarBtn onClick={handleOpenProject} title="Open .kcs.json project file">Open Project</ToolbarBtn>
        <ToolbarBtn
          onClick={handleSaveProject}
          variant={isDirty ? 'primary' : 'default'}
          title="Save project as .kcs.json (Ctrl+S)"
        >
          {isDirty ? '● Save Project' : 'Save Project'}
        </ToolbarBtn>

        {/* Divider */}
        <span className="w-px h-5 bg-gray-600" />

        {/* Stage-specific actions */}
        {mode === '3d' ? (
          <>
            {/* Export STL for 3D mode */}
            <ToolbarBtn onClick={handleExportSTL} disabled={isExporting} variant="success" title="Export STL from 3D scene">
              Export STL
            </ToolbarBtn>
            {/* Batch export */}
            <ToolbarBtn onClick={() => setBatchDialogOpen(true)} disabled={isExporting} title="Batch export STL for multiple key sizes">
              批量导出
            </ToolbarBtn>
            {/* Next step CTA */}
            <ToolbarBtn onClick={() => setMode('2d')} variant="success" title="Switch to 2D Legends editor">
              Next: Legends →
            </ToolbarBtn>
          </>
        ) : (
          <>
            {/* Back CTA */}
            <ToolbarBtn onClick={() => setMode('3d')} title="Switch back to 3D Shape editor">
              ← Back: Shape
            </ToolbarBtn>

            {/* Divider */}
            <span className="w-px h-5 bg-gray-600" />

            {/* 2D Export dropdown */}
            <div className="relative">
              <ToolbarBtn onClick={() => setExportOpen(v => !v)} title="Export 2D image">
                Export ▾
              </ToolbarBtn>
              {exportOpen && (
                <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 min-w-max text-xs">
                  <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={() => handleExportPNG(2, false)}>PNG 2× (opaque)</button>
                  <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={() => handleExportPNG(4, false)}>PNG 4× (opaque)</button>
                  <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={() => handleExportPNG(2, true)}>PNG 2× (transparent bg)</button>
                  <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={() => handleExportPNG(4, true)}>PNG 4× (transparent bg)</button>
                  <div className="border-t border-gray-600 my-1" />
                  <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={() => handleExportSVG(false)}>SVG (opaque)</button>
                  <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={() => handleExportSVG(true)}>SVG (transparent bg)</button>
                </div>
              )}
            </div>

            {/* Divider */}
            <span className="w-px h-5 bg-gray-600" />

            {/* Undo / Redo */}
            <ToolbarBtn onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">↩ Undo</ToolbarBtn>
            <ToolbarBtn onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)">↪ Redo</ToolbarBtn>
          </>
        )}

        {/* Divider */}
        <span className="w-px h-5 bg-gray-600" />

        {/* Export Package – always visible */}
        <ToolbarBtn onClick={handleExportPackage} disabled={isExporting} variant="primary" title="Export STL + PNG@4x + SVG">
          Export Package
        </ToolbarBtn>

        {/* Legacy menu */}
        <div className="relative">
          <ToolbarBtn onClick={() => setLegacyOpen(v => !v)} title="Legacy .keycap file operations">
            Legacy ▾
          </ToolbarBtn>
          {legacyOpen && (
            <div className="absolute top-full right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 min-w-max text-xs">
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={handleImportKeycap}>Import .keycap (legends only)</button>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-600" onClick={handleExportKeycap}>Export .keycap</button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Stage indicator */}
        <StageIndicator mode={mode} />
      </header>
    </>
  );
}

