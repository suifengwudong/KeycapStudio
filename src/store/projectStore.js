/**
 * KeycapStudio V1 – Project Store
 *
 * Zustand store for the 2D design tool.
 * Includes:
 *  - Current project state
 *  - Undo / redo stack (up to MAX_HISTORY entries)
 *  - Dirty flag (unsaved changes)
 *  - Selected legend (for inspector focus)
 *  - Canvas zoom
 *  - System font list
 */

import { create } from 'zustand';
import {
  createDefaultProject,
  deserialiseProject,
  serialiseProject,
} from '../core/model/projectModel.js';
import {
  writeAutosave,
  readAutosave,
  startAutosave,
} from '../core/io/projectIO.js';

const MAX_HISTORY = 100;

/** Deep-clone via JSON round-trip (sufficient for plain-data project objects). */
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

export const useProjectStore = create((set, get) => ({
  // ── Current project ──────────────────────────────────────────────────────
  project: createDefaultProject(),

  // ── Undo / redo stacks ───────────────────────────────────────────────────
  past:   [],   // array of serialised project snapshots (strings)
  future: [],

  // ── UI state ─────────────────────────────────────────────────────────────
  isDirty:        false,
  selectedLegend: 'main',   // 'main' | 'topLeft' | 'bottomRight' | 'left'
  zoom:           1,
  systemFonts:    ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana'],

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Push current project onto the undo stack before a mutation. */
  _snapshot() {
    const { project, past } = get();
    const newPast = [...past, serialiseProject(project)];
    if (newPast.length > MAX_HISTORY) newPast.shift();
    set({ past: newPast, future: [] });
  },

  // ── Project mutations ─────────────────────────────────────────────────────

  /** Replace the entire project (also used by open / new). */
  setProject(newProject, { resetHistory = false } = {}) {
    const { _snapshot } = get();
    if (!resetHistory) _snapshot();
    set({
      project:  clone(newProject),
      isDirty:  !resetHistory,
      past:     resetHistory ? [] : get().past,
      future:   [],
    });
    writeAutosave(newProject);
  },

  /** Update a subset of keycap properties, e.g. { bgColor: '#ff0000' }. */
  updateKeycap(partial) {
    const { project, _snapshot } = get();
    _snapshot();
    const updated = { ...project, keycap: { ...project.keycap, ...partial } };
    set({ project: updated, isDirty: true });
    writeAutosave(updated);
  },

  /** Update a legend by key, e.g. updateLegend('main', { text: 'Enter' }). */
  updateLegend(key, partial) {
    const { project, _snapshot } = get();
    _snapshot();
    const updated = {
      ...project,
      legends: {
        ...project.legends,
        [key]: { ...project.legends[key], ...partial },
      },
    };
    set({ project: updated, isDirty: true });
    writeAutosave(updated);
  },

  /** Undo last action. */
  undo() {
    const { past, future, project } = get();
    if (past.length === 0) return;
    const prevStr = past[past.length - 1];
    const newPast = past.slice(0, -1);
    set({
      project:  deserialiseProject(prevStr),
      past:     newPast,
      future:   [serialiseProject(project), ...future],
      isDirty:  true,
    });
  },

  /** Redo last undone action. */
  redo() {
    const { past, future, project } = get();
    if (future.length === 0) return;
    const nextStr   = future[0];
    const newFuture = future.slice(1);
    set({
      project:  deserialiseProject(nextStr),
      past:     [...past, serialiseProject(project)],
      future:   newFuture,
      isDirty:  true,
    });
  },

  canUndo: () => get().past.length   > 0,
  canRedo: () => get().future.length > 0,

  // ── New project ───────────────────────────────────────────────────────────
  newProject() {
    const fresh = createDefaultProject();
    set({
      project: fresh,
      past:    [],
      future:  [],
      isDirty: false,
    });
  },

  // ── Mark saved ───────────────────────────────────────────────────────────
  markSaved() { set({ isDirty: false }); },

  // ── UI state setters ──────────────────────────────────────────────────────
  setSelectedLegend(key)  { set({ selectedLegend: key }); },
  setZoom(zoom)            { set({ zoom: Math.max(0.25, Math.min(4, zoom)) }); },
  setSystemFonts(fonts)    { set({ systemFonts: fonts }); },
}));

// ── Bootstrap autosave (fires once at module load) ────────────────────────────
startAutosave(() => useProjectStore.getState().project);

// ── Crash-recovery helpers (used at app startup) ──────────────────────────────
export { readAutosave };
