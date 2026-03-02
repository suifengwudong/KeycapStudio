/**
 * KeycapStudio V1 – SVG Exporter
 *
 * Generates a text-based SVG string from a keycap project and triggers download.
 *
 * Dimensions use CSS pixels (1× scale).  Embed inline or scale with CSS/viewBox.
 */

import { presetPx } from '../model/projectModel.js';

/**
 * Generate an SVG string for the given project.
 *
 * @param {object}  project
 * @param {boolean} transparentBg
 * @returns {string}  SVG source
 */
export function generateSVG(project, transparentBg = false) {
  const scale = 1;
  const { w, h } = presetPx(project.keycap.preset, scale);
  const { bgColor, outlineEnabled, outlineColor, outlineThickness } = project.keycap;

  const r = Math.max(4, 6); // corner radius

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);

  // Background rect
  const fillAttr  = transparentBg ? 'fill="none"' : `fill="${esc(bgColor)}"`;
  const strokeAttr = outlineEnabled
    ? `stroke="${esc(outlineColor)}" stroke-width="${outlineThickness}"`
    : 'stroke="none"';
  parts.push(
    `  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" ${fillAttr} ${strokeAttr}/>`
  );

  // Legends
  const { legends } = project;
  for (const [, legend] of Object.entries(legends)) {
    if (!legend.enabled || !legend.text) continue;
    const cx     = w / 2 + legend.x * w;
    const cy     = h / 2 + legend.y * h;
    const fsAttr = `font-size="${legend.fontSize}"`;
    const ffAttr = `font-family="${esc(legend.font)}, Arial, sans-serif"`;
    parts.push(
      `  <text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" ` +
      `fill="${esc(legend.color)}" ${fsAttr} ${ffAttr}>${escText(legend.text)}</text>`
    );
  }

  parts.push('</svg>');
  return parts.join('\n');
}

/**
 * Export SVG and trigger browser download.
 *
 * @param {object}  project
 * @param {boolean} transparentBg
 * @param {string}  [filename]
 */
export function exportSVG(project, transparentBg = false, filename = null) {
  const svg  = generateSVG(project, transparentBg);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename ?? `keycap-${project.keycap.preset}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- helpers ----------

/** Escape attribute values */
function esc(s) { return String(s).replace(/"/g, '&quot;'); }

/** Escape text content */
function escText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
