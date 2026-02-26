/**
 * Tests for sizeMapping.js – 3D size → 2D preset mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  SIZE_ENUM,
  SIZE_TO_PRESET,
  ISO_ENTER_APPROX_LABEL,
  mapSizeToPreset,
} from './sizeMapping.js';

// ─── SIZE_ENUM ────────────────────────────────────────────────────────────────

describe('SIZE_ENUM', () => {
  it('contains all expected 3D size values', () => {
    expect(SIZE_ENUM).toContain('1u');
    expect(SIZE_ENUM).toContain('1.25u');
    expect(SIZE_ENUM).toContain('1.5u');
    expect(SIZE_ENUM).toContain('1.75u');
    expect(SIZE_ENUM).toContain('2u');
    expect(SIZE_ENUM).toContain('2.25u');
    expect(SIZE_ENUM).toContain('6.25u');
    expect(SIZE_ENUM).toContain('7u');
    expect(SIZE_ENUM).toContain('ISO-Enter');
  });

  it('has exactly 9 entries', () => {
    expect(SIZE_ENUM).toHaveLength(9);
  });
});

// ─── SIZE_TO_PRESET ───────────────────────────────────────────────────────────

describe('SIZE_TO_PRESET', () => {
  it('maps all regular sizes one-to-one to same-named preset', () => {
    const regularSizes = ['1u', '1.25u', '1.5u', '1.75u', '2u', '2.25u', '6.25u', '7u'];
    for (const size of regularSizes) {
      expect(SIZE_TO_PRESET[size]).toBe(size);
    }
  });

  it('maps ISO-Enter to 2.25u (rectangular approximation)', () => {
    expect(SIZE_TO_PRESET['ISO-Enter']).toBe('2.25u');
  });
});

// ─── mapSizeToPreset ──────────────────────────────────────────────────────────

describe('mapSizeToPreset', () => {
  it('maps 1u to 1u', () => {
    expect(mapSizeToPreset('1u')).toBe('1u');
  });

  it('maps 1.25u to 1.25u', () => {
    expect(mapSizeToPreset('1.25u')).toBe('1.25u');
  });

  it('maps 1.5u to 1.5u', () => {
    expect(mapSizeToPreset('1.5u')).toBe('1.5u');
  });

  it('maps 1.75u to 1.75u', () => {
    expect(mapSizeToPreset('1.75u')).toBe('1.75u');
  });

  it('maps 2u to 2u', () => {
    expect(mapSizeToPreset('2u')).toBe('2u');
  });

  it('maps 2.25u to 2.25u', () => {
    expect(mapSizeToPreset('2.25u')).toBe('2.25u');
  });

  it('maps 6.25u to 6.25u', () => {
    expect(mapSizeToPreset('6.25u')).toBe('6.25u');
  });

  it('maps 7u to 7u', () => {
    expect(mapSizeToPreset('7u')).toBe('7u');
  });

  it('maps ISO-Enter to 2.25u (rectangular approximation)', () => {
    expect(mapSizeToPreset('ISO-Enter')).toBe('2.25u');
  });

  it('returns null for unknown sizes', () => {
    expect(mapSizeToPreset('2.75u')).toBeNull();
    expect(mapSizeToPreset('unknown')).toBeNull();
    expect(mapSizeToPreset('')).toBeNull();
  });

  it('all sizes in SIZE_ENUM map to a non-null preset', () => {
    for (const size of SIZE_ENUM) {
      expect(mapSizeToPreset(size)).not.toBeNull();
    }
  });
});

// ─── ISO_ENTER_APPROX_LABEL ───────────────────────────────────────────────────

describe('ISO_ENTER_APPROX_LABEL', () => {
  it('is a non-empty string', () => {
    expect(typeof ISO_ENTER_APPROX_LABEL).toBe('string');
    expect(ISO_ENTER_APPROX_LABEL.length).toBeGreaterThan(0);
  });

  it('mentions ISO Enter and approximation', () => {
    expect(ISO_ENTER_APPROX_LABEL).toMatch(/ISO/i);
    expect(ISO_ENTER_APPROX_LABEL).toMatch(/近似|approx/i);
  });
});
