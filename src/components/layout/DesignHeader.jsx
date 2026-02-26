/**
 * KeycapStudio V1 – Toolbar / Header
 *
 * Buttons: New | Open | Save | Export PNG | Export SVG | Undo | Redo
 * Plus mode toggle: 2D Design ↔ 3D Preview
 */

import React, { useState, useCallback } from 'react';
import { useProjectStore, readAutosave } from '../../store/projectStore.js';
import { openProjectFile, saveProjectFile } from '../../core/io/projectIO.js';
import { exportPNG } from '../../core/export/PNGExporter.js';
import { exportSVG } from '../../core/export/SVGExporter.js';

function ToolbarBtn({ onClick, disabled, children, title, variant = 'default' }) {
  const base  = 'px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed';
  const theme = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-500 text-white'
    : variant === 'danger'
    ? 'bg-red-700 hover:bg-red-600 text-white'
    : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600';
  return (
    <button className={`${base} ${theme}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export default function DesignHeader({ mode, setMode }) {
  const project  = useProjectStore(s => s.project);
  const isDirty  = useProjectStore(s => s.isDirty);
  const past     = useProjectStore(s => s.past);
  const future   = useProjectStore(s => s.future);
  const undo     = useProjectStore(s => s.undo);
  const redo     = useProjectStore(s => s.redo);
  const newProject  = useProjectStore(s => s.newProject);
  const setProject  = useProjectStore(s => s.setProject);
  const markSaved   = useProjectStore(s => s.markSaved);

  const [exportOpen, setExportOpen] = useState(false);

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    newProject();
  }, [isDirty, newProject]);

  const handleOpen = useCallback(async () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    try {
      const loaded = await openProjectFile();
      setProject(loaded, { resetHistory: true });
    } catch (e) {
      if (e.message !== 'No file selected') alert(`Open failed: ${e.message}`);
    }
  }, [isDirty, setProject]);

  const handleSave = useCallback(() => {
    saveProjectFile(project);
    markSaved();
  }, [project, markSaved]);

  const handleExportPNG = useCallback((scale, transparentBg) => {
    exportPNG(project, scale, transparentBg);
    setExportOpen(false);
  }, [project]);

  const handleExportSVG = useCallback((transparentBg) => {
    exportSVG(project, transparentBg);
    setExportOpen(false);
  }, [project]);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
      {/* Logo */}
      <span className="text-sm font-bold text-white mr-2 select-none">⌨ Keycap Studio</span>

      {/* Divider */}
      <span className="w-px h-5 bg-gray-600" />

      {/* File ops */}
      <ToolbarBtn onClick={handleNew} title="New project (Ctrl+N)">New</ToolbarBtn>
      <ToolbarBtn onClick={handleOpen} title="Open .keycap file">Open</ToolbarBtn>
      <ToolbarBtn
        onClick={handleSave}
        variant={isDirty ? 'primary' : 'default'}
        title="Save .keycap file"
      >
        {isDirty ? '● Save' : 'Save'}
      </ToolbarBtn>

      {/* Divider */}
      <span className="w-px h-5 bg-gray-600" />

      {/* Export dropdown */}
      <div className="relative">
        <ToolbarBtn onClick={() => setExportOpen(v => !v)} title="Export">
          Export ▾
        </ToolbarBtn>
        {exportOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 min-w-max text-xs">
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-600"
              onClick={() => handleExportPNG(2, false)}
            >PNG 2× (opaque)</button>
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-600"
              onClick={() => handleExportPNG(4, false)}
            >PNG 4× (opaque)</button>
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-600"
              onClick={() => handleExportPNG(2, true)}
            >PNG 2× (transparent bg)</button>
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-600"
              onClick={() => handleExportPNG(4, true)}
            >PNG 4× (transparent bg)</button>
            <div className="border-t border-gray-600 my-1" />
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-600"
              onClick={() => handleExportSVG(false)}
            >SVG (opaque)</button>
            <button
              className="block w-full text-left px-3 py-2 hover:bg-gray-600"
              onClick={() => handleExportSVG(true)}
            >SVG (transparent bg)</button>
          </div>
        )}
      </div>

      {/* Divider */}
      <span className="w-px h-5 bg-gray-600" />

      {/* Undo / Redo */}
      <ToolbarBtn onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">↩ Undo</ToolbarBtn>
      <ToolbarBtn onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)">↪ Redo</ToolbarBtn>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Mode toggle */}
      <div className="flex rounded overflow-hidden border border-gray-600 text-xs">
        <button
          className={`px-3 py-1 ${mode === '2d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          onClick={() => setMode('2d')}
        >2D Design</button>
        <button
          className={`px-3 py-1 ${mode === '3d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          onClick={() => setMode('3d')}
        >3D Preview</button>
      </div>
    </header>
  );
}
