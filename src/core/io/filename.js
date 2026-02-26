/**
 * KeycapStudio – Export filename utilities
 *
 * Provides helpers to generate consistent, cross-browser-safe filenames
 * for exported assets (STL, PNG, SVG).
 *
 * Naming rule:  {preset}_{mainText || 'keycap'}.{ext}
 * Examples:
 *   1u key with "Esc" legend  → 1u_Esc.svg / 1u_Esc.png / 1u_Esc.stl
 *   6.25u spacebar (no text)  → 6.25u_keycap.stl / 6.25u_keycap.svg / 6.25u_keycap.png
 */

/**
 * Sanitize a filename token so it only contains safe characters.
 * Replaces any character that is not [A-Za-z0-9._-] with an underscore.
 *
 * @param {string} s
 * @returns {string}
 */
export function sanitizeToken(s) {
  return String(s).replace(/[^A-Za-z0-9._-]/g, '_');
}

/**
 * Build the base name (without extension) for an exported keycap file.
 *
 * @param {{ preset: string, mainText?: string }} options
 * @returns {string}  e.g. '1u_Esc', '6.25u_keycap'
 */
export function makeBaseName({ preset, mainText }) {
  const safePreset   = sanitizeToken(preset || '1u');
  const sanitized    = sanitizeToken(mainText || '');
  const trimmedText  = sanitized.replace(/^_+|_+$/g, '') || 'keycap';
  return `${safePreset}_${trimmedText}`;
}

/**
 * Generate all three export filenames for a KCS document.
 *
 * @param {object} kcs  – KCS document (shape3d + legend2d)
 * @returns {{ stl: string, png: string, svg: string }}
 */
export function makeExportNames(kcs) {
  const preset   = kcs?.legend2d?.keycap?.preset ?? '1u';
  const mainLeg  = kcs?.legend2d?.legends?.main;
  const mainText = mainLeg?.enabled ? (mainLeg.text ?? '') : '';
  const base     = makeBaseName({ preset, mainText });
  return {
    stl: `${base}.stl`,
    png: `${base}.png`,
    svg: `${base}.svg`,
  };
}
