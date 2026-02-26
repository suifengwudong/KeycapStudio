/**
 * Tests for kcsDocument.js – the unified .kcs.json project format.
 */

import { describe, it, expect } from 'vitest';
import {
  KCS_FORMAT,
  KCS_VERSION,
  SIZE_TO_2D_PRESET,
  sizeToPreset,
  createDefaultKcsDocument,
  validateKcsDocument,
  serialiseKcsDocument,
  deserialiseKcsDocument,
  buildKcsDocument,
  extractShape3dParams,
  extractLegend2dProject,
  defaultShape3d,
  defaultLegend2d,
} from './kcsDocument.js';

// ─── createDefaultKcsDocument ────────────────────────────────────────────────

describe('createDefaultKcsDocument', () => {
  it('has correct format and version', () => {
    const doc = createDefaultKcsDocument();
    expect(doc.format).toBe(KCS_FORMAT);
    expect(doc.version).toBe(KCS_VERSION);
  });

  it('has an asset.name field', () => {
    const doc = createDefaultKcsDocument();
    expect(doc.asset).toBeDefined();
    expect(typeof doc.asset.name).toBe('string');
    expect(doc.asset.name.length).toBeGreaterThan(0);
  });

  it('contains shape3d with keycap-param-v1 engine', () => {
    const doc = createDefaultKcsDocument();
    expect(doc.shape3d.engine).toBe('keycap-param-v1');
    expect(doc.shape3d.params).toBeDefined();
  });

  it('shape3d.params contains expected keys', () => {
    const doc = createDefaultKcsDocument();
    const p = doc.shape3d.params;
    expect(p.profile).toBe('Cherry');
    expect(p.size).toBe('1u');
    expect(p.hasStem).toBe(true);
    expect(p.topRadius).toBeDefined();
    expect(p.wallThickness).toBeDefined();
  });

  it('contains legend2d with keycap and legends', () => {
    const doc = createDefaultKcsDocument();
    expect(doc.legend2d.keycap).toBeDefined();
    expect(doc.legend2d.legends).toBeDefined();
  });

  it('legend2d.legends has four slots', () => {
    const doc = createDefaultKcsDocument();
    const slots = Object.keys(doc.legend2d.legends);
    expect(slots).toContain('main');
    expect(slots).toContain('topLeft');
    expect(slots).toContain('bottomRight');
    expect(slots).toContain('left');
  });

  it('main legend is enabled with text "A"', () => {
    const doc = createDefaultKcsDocument();
    expect(doc.legend2d.legends.main.enabled).toBe(true);
    expect(doc.legend2d.legends.main.text).toBe('A');
  });

  it('secondary legends are disabled by default', () => {
    const doc = createDefaultKcsDocument();
    expect(doc.legend2d.legends.topLeft.enabled).toBe(false);
    expect(doc.legend2d.legends.bottomRight.enabled).toBe(false);
    expect(doc.legend2d.legends.left.enabled).toBe(false);
  });
});

// ─── validateKcsDocument ─────────────────────────────────────────────────────

describe('validateKcsDocument', () => {
  it('accepts a valid default document', () => {
    const doc = createDefaultKcsDocument();
    expect(() => validateKcsDocument(doc)).not.toThrow();
  });

  it('throws for non-object input', () => {
    expect(() => validateKcsDocument(null)).toThrow();
    expect(() => validateKcsDocument('string')).toThrow();
  });

  it('throws when format is missing or wrong', () => {
    const doc = createDefaultKcsDocument();
    doc.format = 'wrong';
    expect(() => validateKcsDocument(doc)).toThrow(/format/i);
  });

  it('throws for unsupported version', () => {
    const doc = createDefaultKcsDocument();
    doc.version = 99;
    expect(() => validateKcsDocument(doc)).toThrow(/version/i);
  });

  it('throws when shape3d is missing', () => {
    const doc = createDefaultKcsDocument();
    delete doc.shape3d;
    expect(() => validateKcsDocument(doc)).toThrow(/shape3d/i);
  });

  it('throws for unsupported shape3d engine', () => {
    const doc = createDefaultKcsDocument();
    doc.shape3d.engine = 'unknown-engine';
    expect(() => validateKcsDocument(doc)).toThrow(/engine/i);
  });

  it('throws when shape3d.params is missing', () => {
    const doc = createDefaultKcsDocument();
    delete doc.shape3d.params;
    expect(() => validateKcsDocument(doc)).toThrow(/params/i);
  });

  it('throws when legend2d is missing', () => {
    const doc = createDefaultKcsDocument();
    delete doc.legend2d;
    expect(() => validateKcsDocument(doc)).toThrow(/legend2d/i);
  });

  it('throws when legend2d.keycap is missing', () => {
    const doc = createDefaultKcsDocument();
    delete doc.legend2d.keycap;
    expect(() => validateKcsDocument(doc)).toThrow();
  });

  it('throws when legend2d.legends is missing', () => {
    const doc = createDefaultKcsDocument();
    delete doc.legend2d.legends;
    expect(() => validateKcsDocument(doc)).toThrow();
  });
});

// ─── Serialisation round-trip ─────────────────────────────────────────────────

describe('serialisation round-trip', () => {
  it('serialises and deserialises without data loss', () => {
    const original = createDefaultKcsDocument();
    original.asset.name = 'My Keycap';
    original.shape3d.params.color = '#2563eb';
    original.legend2d.legends.main.text = 'Enter';

    const json     = serialiseKcsDocument(original);
    const restored = deserialiseKcsDocument(json);
    expect(restored).toEqual(original);
  });

  it('serialised output is valid JSON', () => {
    const doc  = createDefaultKcsDocument();
    const json = serialiseKcsDocument(doc);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('serialised output is pretty-printed', () => {
    const doc  = createDefaultKcsDocument();
    const json = serialiseKcsDocument(doc);
    expect(json).toContain('\n');
  });

  it('throws on invalid JSON in deserialiseKcsDocument', () => {
    expect(() => deserialiseKcsDocument('{broken json')).toThrow(/Invalid JSON/i);
  });

  it('preserves all shape3d params through round-trip', () => {
    const original = createDefaultKcsDocument();
    original.shape3d.params.texture = 'matte';
    original.shape3d.params.pattern = 'grid';

    const restored = deserialiseKcsDocument(serialiseKcsDocument(original));
    expect(restored.shape3d.params).toEqual(original.shape3d.params);
  });

  it('preserves all legend2d fields through round-trip', () => {
    const original = createDefaultKcsDocument();
    original.legend2d.keycap.bgColor = '#ff0000';
    original.legend2d.legends.topLeft.enabled = true;
    original.legend2d.legends.topLeft.text = 'F1';

    const restored = deserialiseKcsDocument(serialiseKcsDocument(original));
    expect(restored.legend2d).toEqual(original.legend2d);
  });
});

// ─── buildKcsDocument ────────────────────────────────────────────────────────

describe('buildKcsDocument', () => {
  it('produces a valid KCS document', () => {
    const params = {
      profile      : 'SA',
      size         : '2u',
      color        : '#ff0000',
      hasStem      : false,
      topRadius    : 0.3,
      wallThickness: 1.2,
      text         : 'Q',
      fontSize     : 16,
      textDepth    : 0.4,
      texture      : 'glossy',
      pattern      : null,
    };
    const project = {
      version: 1,
      keycap: { preset: '2u', bgColor: '#ff0000', outlineEnabled: false, outlineColor: '#000', outlineThickness: 1 },
      legends: { main: { enabled: true, text: 'Q', x: 0, y: 0, font: 'Arial', fontSize: 20, color: '#fff' } },
    };
    const doc = buildKcsDocument(params, project, 'Q key');
    expect(() => validateKcsDocument(doc)).not.toThrow();
    expect(doc.asset.name).toBe('Q key');
    expect(doc.shape3d.params.profile).toBe('SA');
    expect(doc.legend2d.keycap.bgColor).toBe('#ff0000');
  });

  it('uses default name when not provided', () => {
    const doc = buildKcsDocument(
      defaultShape3d().params,
      { keycap: defaultLegend2d().keycap, legends: defaultLegend2d().legends },
    );
    expect(typeof doc.asset.name).toBe('string');
  });

  it('does not mutate the input params', () => {
    const params = { ...defaultShape3d().params };
    const project = { keycap: { ...defaultLegend2d().keycap }, legends: { ...defaultLegend2d().legends } };
    buildKcsDocument(params, project);
    params.color = '#mutated';
    const doc2 = buildKcsDocument(params, project);
    expect(doc2.shape3d.params.color).toBe('#mutated');
    // first doc is unaffected (separate copy)
    const doc1 = buildKcsDocument({ ...defaultShape3d().params }, project);
    expect(doc1.shape3d.params.color).toBe(defaultShape3d().params.color);
  });
});

// ─── extractShape3dParams / extractLegend2dProject ───────────────────────────

describe('extractShape3dParams', () => {
  it('returns a copy of the shape3d params', () => {
    const doc = createDefaultKcsDocument();
    const params = extractShape3dParams(doc);
    expect(params).toEqual(doc.shape3d.params);
    // mutation should not affect doc
    params.color = '#mutated';
    expect(doc.shape3d.params.color).toBe(defaultShape3d().params.color);
  });
});

describe('extractLegend2dProject', () => {
  it('returns a V1 project object with version=1', () => {
    const doc = createDefaultKcsDocument();
    const project = extractLegend2dProject(doc);
    expect(project.version).toBe(1);
    expect(project.keycap).toBeDefined();
    expect(project.legends).toBeDefined();
  });

  it('keycap and legends match the document', () => {
    const doc = createDefaultKcsDocument();
    doc.legend2d.keycap.bgColor = '#123456';
    const project = extractLegend2dProject(doc);
    expect(project.keycap.bgColor).toBe('#123456');
    expect(project.legends.main).toEqual(doc.legend2d.legends.main);
  });

  it('returned project is independent of the document', () => {
    const doc     = createDefaultKcsDocument();
    const project = extractLegend2dProject(doc);
    project.keycap.bgColor = '#mutated';
    expect(doc.legend2d.keycap.bgColor).toBe('#e0e0e0');
  });
});

// ─── defaultShape3d / defaultLegend2d ────────────────────────────────────────

describe('defaultShape3d', () => {
  it('has engine keycap-param-v1', () => {
    expect(defaultShape3d().engine).toBe('keycap-param-v1');
  });

  it('returns independent objects on each call', () => {
    const a = defaultShape3d();
    const b = defaultShape3d();
    a.params.color = '#mutated';
    expect(b.params.color).toBe('#ffffff');
  });
});

describe('defaultLegend2d', () => {
  it('has keycap and legends', () => {
    const d = defaultLegend2d();
    expect(d.keycap).toBeDefined();
    expect(d.legends).toBeDefined();
  });

  it('returns independent objects on each call', () => {
    const a = defaultLegend2d();
    const b = defaultLegend2d();
    a.keycap.bgColor = '#mutated';
    expect(b.keycap.bgColor).toBe('#e0e0e0');
  });
});

// ─── sizeToPreset / SIZE_TO_2D_PRESET ────────────────────────────────────────

describe('sizeToPreset', () => {
  it('maps standard sizes to 2D presets', () => {
    expect(sizeToPreset('1u')).toBe('1u');
    expect(sizeToPreset('1.25u')).toBe('1.25u');
    expect(sizeToPreset('1.5u')).toBe('1.5u');
    expect(sizeToPreset('2u')).toBe('2u');
  });

  it('maps 2.25u to Shift preset', () => {
    expect(sizeToPreset('2.25u')).toBe('Shift');
  });

  it('maps ISO-Enter to Enter preset', () => {
    expect(sizeToPreset('ISO-Enter')).toBe('Enter');
  });

  it('returns null for sizes without a 2D equivalent', () => {
    expect(sizeToPreset('6.25u')).toBeNull();
    expect(sizeToPreset('2.75u')).toBeNull();
    expect(sizeToPreset('1.75u')).toBeNull();
    expect(sizeToPreset('unknown')).toBeNull();
  });

  it('SIZE_TO_2D_PRESET covers all expected direct mappings', () => {
    expect(SIZE_TO_2D_PRESET['1u']).toBe('1u');
    expect(SIZE_TO_2D_PRESET['2.25u']).toBe('Shift');
    expect(SIZE_TO_2D_PRESET['ISO-Enter']).toBe('Enter');
  });
});

// ─── validateKcsDocument – legacy name migration ─────────────────────────────

describe('validateKcsDocument – legacy name migration', () => {
  it('migrates top-level name to asset.name if asset is missing', () => {
    const doc = {
      format  : KCS_FORMAT,
      version : KCS_VERSION,
      name    : 'Old Style Name',
      shape3d : defaultShape3d(),
      legend2d: defaultLegend2d(),
    };
    const validated = validateKcsDocument(doc);
    expect(validated.asset.name).toBe('Old Style Name');
  });
});
