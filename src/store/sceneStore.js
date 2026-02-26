import { create } from 'zustand';
import {
  createDefaultScene,
  createPrimitive,
  createKeycapNode,
  createBooleanNode,
  createGroupNode,
  patchNodeById,
  addChildById,
  removeNodeById,
} from '../core/model/sceneDocument';

export const useSceneStore = create((set, get) => ({
  /** Current 3D scene document. */
  scene: createDefaultScene(),

  /** ID of the currently selected node (null = nothing selected). */
  selectedId: null,

  // ─── Scene-level actions ──────────────────────────────────────────────────

  setScene: (scene) => set({ scene, selectedId: null }),

  updateSceneName: (name) =>
    set(s => ({ scene: { ...s.scene, name } })),

  // ─── Selection ────────────────────────────────────────────────────────────

  selectNode: (id) => set({ selectedId: id }),
  clearSelection: () => set({ selectedId: null }),

  // ─── Node mutations ────────────────────────────────────────────────────────

  /**
   * Patch any node by id.
   * @param {string} id
   * @param {object} patch – shallow merge onto the node
   */
  updateNode: (id, patch) =>
    set(s => ({
      scene: {
        ...s.scene,
        root: patchNodeById(s.scene.root, id, patch),
      },
    })),

  /**
   * Add a new node as a child of `parentId`.
   * If the parent cannot have children (Primitive / Keycap), fall back to root.
   */
  addChildNode: (parentId, node) =>
    set(s => {
      const effectiveParent = parentId ?? 'root';
      const newRoot = addChildById(s.scene.root, effectiveParent, node);
      return {
        scene     : { ...s.scene, root: newRoot },
        selectedId: node.id,
      };
    }),

  /** Remove a node by id (never removes the root). */
  deleteNode: (id) =>
    set(s => {
      if (id === s.scene.root.id) return s; // guard: never delete root
      return {
        scene     : { ...s.scene, root: removeNodeById(s.scene.root, id) },
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    }),

  // ─── Convenience add helpers ──────────────────────────────────────────────

  addBox: (parentId) => {
    const n = createPrimitive('box');
    get().addChildNode(parentId ?? 'root', n);
  },

  addCylinder: (parentId) => {
    const n = createPrimitive('cylinder');
    get().addChildNode(parentId ?? 'root', n);
  },

  addSphere: (parentId) => {
    const n = createPrimitive('sphere');
    get().addChildNode(parentId ?? 'root', n);
  },

  addKeycap: (parentId) => {
    const n = createKeycapNode();
    get().addChildNode(parentId ?? 'root', n);
  },

  addBoolean: (operation = 'subtract', parentId) => {
    const n = createBooleanNode(operation);
    get().addChildNode(parentId ?? 'root', n);
  },

  addGroup: (parentId) => {
    const n = createGroupNode();
    get().addChildNode(parentId ?? 'root', n);
  },
}));
