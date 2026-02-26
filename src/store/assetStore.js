/**
 * KeycapStudio – Asset Store (single source of truth)
 *
 * The `assetStore` owns the current `.kcs.json` document in memory.
 * It drives both the 2D (projectStore) and 3D (keycapStore) stores so
 * they always reflect the same underlying asset.
 *
 * Lifecycle:
 *   loadAsset(doc)          → pushes shape3d.params → keycapStore
 *                              pushes legend2d       → projectStore
 *   updateShape3dParams(p)  → updates asset + keycapStore + auto-syncs 2D preset
 *   updateLegend2d(kc, lg)  → updates asset + projectStore
 */

import { create } from 'zustand';
import {
  createDefaultKcsDocument,
  serialiseKcsDocument,
  sizeToPreset,
} from '../core/model/kcsDocument.js';
import {
  writeKcsAutosave,
  readKcsAutosave,
} from '../core/io/kcsIO.js';
import { useProjectStore } from './projectStore.js';
import { useKeycapStore } from './keycapStore.js';

/** Deep-clone via JSON (safe for plain-data assets). */
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAssetStore = create((set, get) => ({
  /** The current .kcs.json document (in-memory). */
  asset: createDefaultKcsDocument(),

  /** Whether the asset has unsaved changes. */
  isDirty: false,

  // ── Load / New ────────────────────────────────────────────────────────────

  /**
   * Load a validated .kcs.json document and sync both sub-stores.
   * @param {object} doc
   * @param {{ resetDirty?: boolean }} [opts]
   */
  loadAsset(doc, { resetDirty = false } = {}) {
    const fresh = clone(doc);
    set({ asset: fresh, isDirty: !resetDirty });
    writeKcsAutosave(fresh);
    // Push legend2d → projectStore
    const projectMod = {
      version: 1,
      keycap : { ...fresh.legend2d.keycap },
      legends: { ...fresh.legend2d.legends },
    };
    useProjectStore.getState().setProject(projectMod, { resetHistory: resetDirty });
    // Push shape3d.params → keycapStore
    useKeycapStore.getState().updateParams(fresh.shape3d.params);
  },

  /** Create a fresh default asset and reset both sub-stores. */
  newAsset() {
    const doc = createDefaultKcsDocument();
    set({ asset: doc, isDirty: false });
    useProjectStore.getState().newProject();
    useKeycapStore.getState().resetParams();
  },

  // ── Shape 3D params ───────────────────────────────────────────────────────

  /**
   * Update shape3d params (e.g. from 3D inspector).
   * Automatically syncs the 2D preset when `size` changes.
   *
   * @param {object} paramsPatch – partial params to merge
   */
  updateShape3dParams(paramsPatch) {
    const { asset } = get();
    const prevSize  = asset.shape3d.params.size;
    const newParams = { ...asset.shape3d.params, ...paramsPatch };
    let updatedLegend2d = asset.legend2d;

    // Auto-sync 2D preset when size changes
    if (paramsPatch.size !== undefined && paramsPatch.size !== prevSize) {
      const preset = sizeToPreset(paramsPatch.size);
      if (preset) {
        updatedLegend2d = {
          ...updatedLegend2d,
          keycap: { ...updatedLegend2d.keycap, preset },
        };
        useProjectStore.getState().updateKeycap({ preset });
      }
    }

    const updatedAsset = {
      ...asset,
      shape3d : { ...asset.shape3d, params: newParams },
      legend2d: updatedLegend2d,
    };
    set({ asset: clone(updatedAsset), isDirty: true });
    writeKcsAutosave(clone(updatedAsset));
    useKeycapStore.getState().updateParams(newParams);
  },

  // ── Legend 2D ─────────────────────────────────────────────────────────────

  /**
   * Sync legend2d from the current projectStore state into the asset.
   * Call this whenever projectStore changes (keycap or legend edits).
   */
  syncLegend2dFromProject() {
    const { asset } = get();
    const ps = useProjectStore.getState();
    const updatedAsset = {
      ...asset,
      legend2d: {
        keycap : { ...ps.project.keycap },
        legends: { ...ps.project.legends },
      },
    };
    set({ asset: clone(updatedAsset), isDirty: true });
    writeKcsAutosave(clone(updatedAsset));
  },

  // ── Asset name ────────────────────────────────────────────────────────────

  setAssetName(name) {
    const { asset } = get();
    const updatedAsset = { ...asset, asset: { ...asset.asset, name } };
    set({ asset: clone(updatedAsset), isDirty: true });
    writeKcsAutosave(clone(updatedAsset));
  },

  // ── Mark saved ────────────────────────────────────────────────────────────

  markSaved() { set({ isDirty: false }); },

  // ── Serialise (used by save handler) ─────────────────────────────────────

  serialise() { return serialiseKcsDocument(get().asset); },
}));

// ── Expose crash-recovery helper ─────────────────────────────────────────────

export { readKcsAutosave };
