/**
 * KeycapStudio – Export Package
 *
 * One-click delivery export: triggers three sequential downloads:
 *   1. {name}_shape.stl    – 3D geometry (STL binary)
 *   2. {name}_legend@4x.png – 2D legend image (PNG at 4× scale)
 *   3. {name}_legend.svg   – 2D legend vector (SVG)
 *
 * Uses existing exporters (PNGExporter, SVGExporter, csgEvaluator).
 * Downloads are triggered with a small delay so browsers don't coalesce them.
 */

import { exportPNG } from './PNGExporter.js';
import { exportSVG } from './SVGExporter.js';
import { exportSceneSTL } from '../csg/csgEvaluator.js';

const DOWNLOAD_DELAY_MS = 400;

/**
 * Trigger all three delivery downloads for the current keycap asset.
 *
 * @param {string} assetName   – base name for filenames (from asset.asset.name)
 * @param {object} project     – 2D project object (legend2d → projectStore.project shape)
 * @param {object} scene       – 3D scene document (from sceneStore.scene)
 */
export function exportPackage(assetName, project, scene) {
  const safeName = (assetName ?? 'keycap').replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim() || 'keycap';

  // 1. STL (immediate)
  exportSceneSTL(scene, `${safeName}_shape.stl`);

  // 2. PNG @4x (after short delay so browser handles the first download)
  setTimeout(() => {
    exportPNG(project, 4, false, `${safeName}_legend@4x.png`);
  }, DOWNLOAD_DELAY_MS);

  // 3. SVG (another short delay)
  setTimeout(() => {
    exportSVG(project, false, `${safeName}_legend.svg`);
  }, DOWNLOAD_DELAY_MS * 2);
}
