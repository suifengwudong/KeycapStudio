/**
 * NodeInspector – 3D keycap inspector.
 *
 * Auto-selects the first KeycapTemplate node in the scene on mount,
 * then shows the full KeycapInspector directly.
 * The Outliner and custom-shape building have been removed; only the
 * keycap node is exposed to the user.
 */

import React, { useEffect } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { findNodeById, collectNodes, NODE_TYPES } from '../../core/model/sceneDocument';
import KeycapInspector from './KeycapInspector';
import { useT } from '../../store/langStore';

// ─── Main component ───────────────────────────────────────────────────────────

export default function NodeInspector() {
  const t        = useT();
  const scene    = useSceneStore(s => s.scene);
  const selectedId = useSceneStore(s => s.selectedId);
  const selectNode = useSceneStore(s => s.selectNode);
  const updateNode = useSceneStore(s => s.updateNode);

  // Auto-select the first keycap node on mount (or when scene changes).
  useEffect(() => {
    if (!scene?.root) return;
    const all = collectNodes(scene.root);
    const keycap = all.find(n => n.type === NODE_TYPES.KEYCAP);
    if (keycap) selectNode(keycap.id);
  }, [scene, selectNode]);

  const node = findNodeById(scene?.root, selectedId);

  if (!node || node.type !== NODE_TYPES.KEYCAP) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        {t('noNodeSelected')}
      </div>
    );
  }

  const onUpdate = patch => updateNode(selectedId, patch);

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      <KeycapInspector node={node} onUpdate={onUpdate} />
    </div>
  );
}
