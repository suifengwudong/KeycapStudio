/**
 * KeycapStudio – Unified Project Document (.kcs.json)
 *
 * A single `.kcs.json` file that embeds both:
 *   - `shape3d` : keycap geometry parameters (engine "keycap-param-v1")
 *   - `legend2d` : 2D legend/style data (keycap style + legend slots)
 *
 * This replaces the separate `.keycap` and per-store localStorage blobs
 * with one portable, self-contained project file.
 *
 * File format: .kcs.json  (JSON, UTF-8)
 */

import { SIZE_TO_PRESET, mapSizeToPreset } from './sizeMapping.js';

export const KCS_FORMAT  = 'kcs';
export const KCS_VERSION = 1;

// ─── Size → 2D preset mapping ────────────────────────────────────────────────

/**
 * Map from 3D `shape3d.params.size` values to 2D `legend2d.keycap.preset` keys.
 * ISO-Enter is approximated as '2.25u' in V1.1.
 *
 * @deprecated Import from sizeMapping.js directly; this re-export exists for
 *   backward compatibility with code that imports from kcsDocument.
 */
export const SIZE_TO_2D_PRESET = SIZE_TO_PRESET;

/**
 * Derive the 2D preset key from a 3D size string.
 * ISO-Enter is approximated as '2.25u'.
 * Returns null for unknown sizes.
 *
 * @param {string} size  – e.g. '1u', '2.25u', 'ISO-Enter'
 * @returns {string|null}
 */
export function sizeToPreset(size) {
  return mapSizeToPreset(size);
}

// ─── Default shape3d params ──────────────────────────────────────────────────

/** Default 3D shape parameters (mirrors keycapStore initial params). */
export function defaultShape3d() {
  return {
    engine: 'keycap-param-v1',
    params: {
      profile      : 'Cherry',
      size         : '1u',
      color        : '#ffffff',
      text         : 'A',
      fontSize     : 14,
      textDepth    : 0.5,
      topRadius    : 0.5,
      wallThickness: 1.5,
      hasStem      : true,
      texture      : 'smooth',
      pattern      : null,
    },
  };
}

// ─── Default legend2d data ───────────────────────────────────────────────────

/** Default 2D legend slot. */
function defaultLegendSlot(overrides = {}) {
  return {
    enabled : false,
    text    : '',
    x       : 0,
    y       : 0,
    font    : 'Arial',
    fontSize: 11,
    color   : '#111111',
    ...overrides,
  };
}

/** Default 2D legend data (mirrors projectModel defaults). */
export function defaultLegend2d() {
  return {
    keycap: {
      preset          : '1u',
      bgColor         : '#e0e0e0',
      outlineEnabled  : true,
      outlineColor    : '#555555',
      outlineThickness: 2,
    },
    legends: {
      main       : defaultLegendSlot({ enabled: true, text: 'A', x: 0,     y: 0,     font: 'Arial', fontSize: 24, color: '#111111' }),
      topLeft    : defaultLegendSlot({ text: '',                  x: -0.28, y: -0.28 }),
      bottomRight: defaultLegendSlot({ text: '',                  x:  0.28, y:  0.28 }),
      left       : defaultLegendSlot({ text: '',                  x: -0.3,  y:  0    }),
    },
  };
}

// ─── Document factory ────────────────────────────────────────────────────────

/** Create a brand-new default KCS document. */
export function createDefaultKcsDocument() {
  return {
    format    : KCS_FORMAT,
    version   : KCS_VERSION,
    asset     : { name: 'New Project' },
    shape3d   : defaultShape3d(),
    legend2d  : defaultLegend2d(),
    uiContext : { mode: '3d', selectedLegend: 'main' },
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a raw parsed KCS document object.
 * Throws if fundamentally invalid; returns the object if valid.
 * @param {object} raw
 * @returns {object}
 */
export function validateKcsDocument(raw) {
  if (!raw || typeof raw !== 'object')
    throw new Error('Invalid KCS document: not an object');
  if (raw.format !== KCS_FORMAT)
    throw new Error(`Not a .kcs.json document (format="${raw.format}")`);
  if (raw.version !== KCS_VERSION)
    throw new Error(`Unsupported KCS version: ${raw.version}`);
  if (!raw.shape3d || typeof raw.shape3d !== 'object')
    throw new Error('Invalid KCS document: missing shape3d');
  if (raw.shape3d.engine !== 'keycap-param-v1')
    throw new Error(`Unsupported shape3d engine: ${raw.shape3d.engine}`);
  if (!raw.shape3d.params || typeof raw.shape3d.params !== 'object')
    throw new Error('Invalid KCS document: missing shape3d.params');
  if (!raw.legend2d || typeof raw.legend2d !== 'object')
    throw new Error('Invalid KCS document: missing legend2d');
  if (!raw.legend2d.keycap || !raw.legend2d.legends)
    throw new Error('Invalid KCS document: missing legend2d.keycap or legend2d.legends');
  // Migrate legacy top-level `name` into `asset.name`
  if (!raw.asset || typeof raw.asset !== 'object') {
    raw = { ...raw, asset: { name: raw.name ?? 'Project' } };
  }
  // Migrate legacy preset aliases ('Shift'/'Enter') → '2.25u'
  const preset = raw.legend2d.keycap.preset;
  if (preset === 'Shift' || preset === 'Enter') {
    raw = {
      ...raw,
      legend2d: {
        ...raw.legend2d,
        keycap: { ...raw.legend2d.keycap, preset: '2.25u' },
      },
    };
  }
  return raw;
}

// ─── Serialisation ───────────────────────────────────────────────────────────

/**
 * Serialise a KCS document to a pretty-printed JSON string.
 * @param {object} doc
 * @returns {string}
 */
export function serialiseKcsDocument(doc) {
  return JSON.stringify(doc, null, 2);
}

/**
 * Deserialise and validate a `.kcs.json` string.
 * @param {string} text
 * @returns {object} validated KCS document
 */
export function deserialiseKcsDocument(text) {
  let raw;
  try { raw = JSON.parse(text); }
  catch (e) { throw new Error('Invalid JSON in .kcs.json file'); }
  return validateKcsDocument(raw);
}

// ─── Conversion helpers ──────────────────────────────────────────────────────

/**
 * Build a KCS document from separate shape-params and project objects.
 *
 * @param {object} shape3dParams  – keycapStore.params  (flat params object)
 * @param {object} project        – projectStore.project (V1 .keycap object)
 * @param {string} [name]         – optional project name
 * @returns {object} KCS document
 */
export function buildKcsDocument(shape3dParams, project, name = 'New Project') {
  return {
    format  : KCS_FORMAT,
    version : KCS_VERSION,
    asset   : { name },
    shape3d : {
      engine: 'keycap-param-v1',
      params: { ...shape3dParams },
    },
    legend2d: {
      keycap : { ...project.keycap },
      legends: { ...project.legends },
    },
  };
}

/**
 * Extract the shape3d params from a KCS document.
 * @param {object} doc – validated KCS document
 * @returns {object}   – flat params object suitable for keycapStore
 */
export function extractShape3dParams(doc) {
  return { ...doc.shape3d.params };
}

/**
 * Extract the legend2d data from a KCS document as a V1 project object.
 * @param {object} doc – validated KCS document
 * @returns {object}   – V1 project object { version, keycap, legends }
 */
export function extractLegend2dProject(doc) {
  return {
    version : 1,
    keycap  : { ...doc.legend2d.keycap },
    legends : { ...doc.legend2d.legends },
  };
}
