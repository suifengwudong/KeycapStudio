/**
 * Tests for projectModel.js
 */

import { describe, it, expect } from 'vitest';
import {
  MODEL_VERSION,
  UNIT_PX,
  SIZE_PRESETS,
  presetPx,
  createDefaultProject,
  serialiseProject,
  deserialiseProject,
  validateProject,
  defaultLegend,
} from './projectModel.js';

describe('presetPx', () => {
  it('returns correct pixel size for 1u at scale 1', () => {
    const { w, h } = presetPx('1u', 1);
    expect(w).toBe(UNIT_PX);
    expect(h).toBe(UNIT_PX);
  });

  it('doubles dimensions at scale 2', () => {
    const s1 = presetPx('1u', 1);
    const s2 = presetPx('1u', 2);
    expect(s2.w).toBe(s1.w * 2);
    expect(s2.h).toBe(s1.h * 2);
  });

  it('quadruples dimensions at scale 4', () => {
    const s1 = presetPx('1u', 1);
    const s4 = presetPx('1u', 4);
    expect(s4.w).toBe(s1.w * 4);
    expect(s4.h).toBe(s1.h * 4);
  });

  it('scales width correctly for 2u', () => {
    const { w, h } = presetPx('2u', 1);
    expect(w).toBe(UNIT_PX * 2);
    expect(h).toBe(UNIT_PX);
  });

  it('Shift preset has widthUnits 2.25', () => {
    const { w } = presetPx('Shift', 1);
    expect(w).toBe(Math.round(UNIT_PX * 2.25));
  });

  it('falls back to 1u for unknown preset', () => {
    const { w, h } = presetPx('unknown', 1);
    expect(w).toBe(UNIT_PX);
    expect(h).toBe(UNIT_PX);
  });

  it('all defined presets produce positive dimensions', () => {
    for (const key of Object.keys(SIZE_PRESETS)) {
      const { w, h } = presetPx(key, 2);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    }
  });
});

describe('createDefaultProject', () => {
  it('has the correct model version', () => {
    const p = createDefaultProject();
    expect(p.version).toBe(MODEL_VERSION);
  });

  it('has main legend enabled with text "A"', () => {
    const p = createDefaultProject();
    expect(p.legends.main.enabled).toBe(true);
    expect(p.legends.main.text).toBe('A');
  });

  it('has secondary legends disabled by default', () => {
    const p = createDefaultProject();
    expect(p.legends.topLeft.enabled).toBe(false);
    expect(p.legends.bottomRight.enabled).toBe(false);
    expect(p.legends.left.enabled).toBe(false);
  });

  it('default preset is 1u', () => {
    const p = createDefaultProject();
    expect(p.keycap.preset).toBe('1u');
  });
});

describe('serialisation round-trip', () => {
  it('serialises and deserialises without data loss', () => {
    const original = createDefaultProject();
    original.legends.topLeft.enabled = true;
    original.legends.topLeft.text    = 'F1';
    original.keycap.bgColor          = '#aabbcc';

    const json     = serialiseProject(original);
    const restored = deserialiseProject(json);

    expect(restored).toEqual(original);
  });

  it('round-trips all legend fields', () => {
    const project = createDefaultProject();
    project.legends.main.font     = 'Courier New';
    project.legends.main.fontSize = 32;
    project.legends.main.color    = '#ff0000';
    project.legends.main.x        = 0.1;
    project.legends.main.y        = -0.2;

    const restored = deserialiseProject(serialiseProject(project));
    expect(restored.legends.main).toEqual(project.legends.main);
  });

  it('preserves keycap style settings', () => {
    const project = createDefaultProject();
    project.keycap.outlineEnabled   = false;
    project.keycap.outlineThickness = 4;
    project.keycap.outlineColor     = '#123456';

    const restored = deserialiseProject(serialiseProject(project));
    expect(restored.keycap).toEqual(project.keycap);
  });
});

describe('validateProject', () => {
  it('throws on non-object input', () => {
    expect(() => validateProject(null)).toThrow();
    expect(() => validateProject('string')).toThrow();
  });

  it('throws on wrong version', () => {
    const p = createDefaultProject();
    p.version = 99;
    expect(() => validateProject(p)).toThrow(/version/i);
  });

  it('throws on missing keycap key', () => {
    const p = createDefaultProject();
    delete p.keycap;
    expect(() => validateProject(p)).toThrow();
  });

  it('accepts a valid project', () => {
    const p = createDefaultProject();
    expect(() => validateProject(p)).not.toThrow();
  });
});

describe('defaultLegend', () => {
  it('creates a disabled legend by default', () => {
    const leg = defaultLegend();
    expect(leg.enabled).toBe(false);
  });

  it('applies overrides correctly', () => {
    const leg = defaultLegend({ enabled: true, text: 'X', fontSize: 20 });
    expect(leg.enabled).toBe(true);
    expect(leg.text).toBe('X');
    expect(leg.fontSize).toBe(20);
    // defaults preserved for non-overridden fields
    expect(leg.x).toBe(0);
    expect(leg.y).toBe(0);
  });
});
