/**
 * Batch STL Export
 *
 * Generates one STL file per requested size using the current keycap shape
 * parameters.  Sizes that cannot be resolved in KEYCAP_SIZES are silently
 * skipped.
 *
 * @param {object}   baseParams   – shape3d.params from the current asset
 * @param {string[]} sizes        – array of size strings (e.g. ['1u', 'ISO-Enter'])
 * @param {function} [onProgress] – optional (stageText) callback
 */

import { createKeycapNode, createGroupNode } from '../model/sceneDocument.js';
import { exportSceneSTL } from '../csg/csgEvaluator.js';

const DOWNLOAD_DELAY_MS = 400;

/** Build a minimal scene containing a single keycap of the given size. */
function _buildSingleKeycapScene(baseParams, size) {
  const params  = { ...baseParams, size };
  const keycap  = createKeycapNode({ params });
  const root    = createGroupNode([keycap], { id: 'root', name: 'Scene' });
  return { version: 1, format: 'kcs3d', name: size, root };
}

export async function batchExportSTL(baseParams, sizes, onProgress) {
  const total = sizes.length;

  for (let i = 0; i < total; i++) {
    const size = sizes[i];
    onProgress?.(`Step ${i + 1}/${total}: Exporting ${size}…`);

    const scene    = _buildSingleKeycapScene(baseParams, size);
    const filename = `keycap_${size.replace(/[^a-zA-Z0-9_.-]/g, '_')}.stl`;

    try {
      await exportSceneSTL(scene, filename);
    } catch (err) {
      console.error(`Batch export failed for ${size}:`, err);
    }

    // Small delay between downloads so browsers don't coalesce them.
    if (i < total - 1) {
      await new Promise(r => setTimeout(r, DOWNLOAD_DELAY_MS));
    }
  }
}
