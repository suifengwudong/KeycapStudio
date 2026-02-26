/**
 * KeycapStudio V1 – Project Data Model
 *
 * A "project" represents a single keycap design.
 * File format: .keycap  (JSON, UTF-8)
 */

export const MODEL_VERSION = 1;

/** Physical size of one unit in canvas pixels (at scale 1×). */
export const UNIT_PX = 54;

/**
 * Named size presets.
 * `widthUnits` / `heightUnits` are keycap widths/heights in 1u multiples.
 * `physW` / `physH` are the exported physical widths/heights in mm (MX standard).
 */
export const SIZE_PRESETS = {
  '1u':    { label: '1u',           widthUnits: 1,    heightUnits: 1,   physW: 18.0, physH: 18.0 },
  '1.25u': { label: '1.25u',        widthUnits: 1.25, heightUnits: 1,   physW: 22.5, physH: 18.0 },
  '1.5u':  { label: '1.5u',         widthUnits: 1.5,  heightUnits: 1,   physW: 27.0, physH: 18.0 },
  '2u':    { label: '2u',           widthUnits: 2,    heightUnits: 1,   physW: 36.0, physH: 18.0 },
  'Shift': { label: 'Shift (2.25u)',widthUnits: 2.25, heightUnits: 1,   physW: 40.5, physH: 18.0 },
  'Enter': { label: 'Enter (2.25u)',widthUnits: 2.25, heightUnits: 1,   physW: 40.5, physH: 18.0 },
};

/**
 * Returns pixel dimensions for a preset at a given scale multiplier.
 * @param {string} preset  - key of SIZE_PRESETS
 * @param {number} scale   - e.g. 1, 2, 4
 * @returns {{ w: number, h: number }}
 */
export function presetPx(preset, scale = 1) {
  const p = SIZE_PRESETS[preset] ?? SIZE_PRESETS['1u'];
  return {
    w: Math.round(p.widthUnits  * UNIT_PX * scale),
    h: Math.round(p.heightUnits * UNIT_PX * scale),
  };
}

/**
 * Default legend object.
 * `x` / `y` are offsets from keycap centre, expressed as fraction of keycap width/height
 * (range roughly −0.5 … +0.5).
 */
export function defaultLegend(overrides = {}) {
  return {
    enabled: false,
    text: '',
    x: 0,
    y: 0,
    font: 'Arial',
    fontSize: 11,
    color: '#111111',
    ...overrides,
  };
}

/** Returns a brand-new project with all defaults. */
export function createDefaultProject() {
  return {
    version: MODEL_VERSION,
    keycap: {
      preset: '1u',
      bgColor: '#e0e0e0',
      outlineEnabled: true,
      outlineColor: '#555555',
      outlineThickness: 2,
    },
    legends: {
      main: defaultLegend({
        enabled: true,
        text: 'A',
        x: 0,
        y: 0,
        font: 'Arial',
        fontSize: 24,
        color: '#111111',
      }),
      topLeft: defaultLegend({ text: '', x: -0.28, y: -0.28 }),
      bottomRight: defaultLegend({ x: 0.28, y: 0.28, text: '' }),
      left: defaultLegend({ x: -0.3, y: 0, text: '' }),
    },
  };
}

/**
 * Validate and migrate a parsed project object.
 * Throws if the object is fundamentally invalid.
 * @param {object} raw
 * @returns {object} validated project
 */
export function validateProject(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid project: not an object');
  if (raw.version !== MODEL_VERSION) {
    // Future: run migrations here
    throw new Error(`Unsupported project version: ${raw.version}`);
  }
  if (!raw.keycap || !raw.legends) throw new Error('Invalid project: missing keycap or legends');
  return raw;
}

/**
 * Serialise project to JSON string (for .keycap files).
 * @param {object} project
 * @returns {string}
 */
export function serialiseProject(project) {
  return JSON.stringify(project, null, 2);
}

/**
 * Deserialise a .keycap JSON string.
 * @param {string} text
 * @returns {object} validated project
 */
export function deserialiseProject(text) {
  let raw;
  try { raw = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON in project file'); }
  return validateProject(raw);
}
