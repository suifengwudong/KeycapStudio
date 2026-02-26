/**
 * KeycapStudio V1 – PNG Exporter
 *
 * Renders a keycap project to an off-screen Canvas and triggers download.
 *
 * Exported dimensions (pixels):
 *   width  = widthUnits  * UNIT_PX * scale
 *   height = heightUnits * UNIT_PX * scale
 */

import { presetPx, SIZE_PRESETS, UNIT_PX } from '../model/projectModel.js';

/**
 * Draw the keycap project onto a CanvasRenderingContext2D.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}  project
 * @param {number}  scale        - pixel multiplier (1, 2, 4 …)
 * @param {boolean} transparentBg
 */
export function drawKeycapToContext(ctx, project, scale, transparentBg = false) {
  const { w, h } = presetPx(project.keycap.preset, scale);
  const { bgColor, outlineEnabled, outlineColor, outlineThickness } = project.keycap;

  const radius = Math.max(4, Math.round(6 * scale));

  // Background
  if (!transparentBg) {
    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.fill();
  }

  // Outline
  if (outlineEnabled) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth   = outlineThickness * scale;
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.stroke();
  }

  // Legends
  const { legends } = project;
  for (const [, legend] of Object.entries(legends)) {
    if (!legend.enabled || !legend.text) continue;
    const fontSize = legend.fontSize * scale;
    ctx.font      = `${fontSize}px "${legend.font}", Arial, sans-serif`;
    ctx.fillStyle = legend.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = w / 2 + legend.x * w;
    const cy = h / 2 + legend.y * h;
    ctx.fillText(legend.text, cx, cy);
  }
}

/**
 * Export PNG and trigger browser download.
 *
 * @param {object}  project
 * @param {number}  scale            - 2 or 4
 * @param {boolean} transparentBg
 * @param {string}  [filename]
 */
export function exportPNG(project, scale = 2, transparentBg = false, filename = null) {
  const { w, h } = presetPx(project.keycap.preset, scale);
  const canvas   = document.createElement('canvas');
  canvas.width   = w;
  canvas.height  = h;
  const ctx      = canvas.getContext('2d');

  drawKeycapToContext(ctx, project, scale, transparentBg);

  const defaultName = `keycap-${project.keycap.preset}-${scale}x.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename ?? defaultName;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// ---------- helpers ----------

/** Draw a rounded rectangle path. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
