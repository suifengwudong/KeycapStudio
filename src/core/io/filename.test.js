/**
 * Tests for filename.js – export naming utilities.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeToken, makeBaseName, makeExportNames } from './filename.js';

// ─── sanitizeToken ────────────────────────────────────────────────────────────

describe('sanitizeToken', () => {
  it('passes through safe characters unchanged', () => {
    expect(sanitizeToken('Hello')).toBe('Hello');
    expect(sanitizeToken('1u')).toBe('1u');
    expect(sanitizeToken('file-name_v1.2')).toBe('file-name_v1.2');
  });

  it('replaces spaces with underscores', () => {
    expect(sanitizeToken('my file')).toBe('my_file');
  });

  it('replaces special characters with underscores', () => {
    expect(sanitizeToken('key@cap!')).toBe('key_cap_');
    expect(sanitizeToken('<Esc>')).toBe('_Esc_');
    expect(sanitizeToken('A/B')).toBe('A_B');
  });

  it('handles empty string', () => {
    expect(sanitizeToken('')).toBe('');
  });

  it('handles non-string input by coercing to string', () => {
    expect(sanitizeToken(42)).toBe('42');
  });

  it('allows digits, letters, dots, hyphens, underscores', () => {
    const safe = 'aZ09._-';
    expect(sanitizeToken(safe)).toBe(safe);
  });
});

// ─── makeBaseName ─────────────────────────────────────────────────────────────

describe('makeBaseName', () => {
  it('produces {preset}_{mainText} for normal inputs', () => {
    expect(makeBaseName({ preset: '1u', mainText: 'Esc' })).toBe('1u_Esc');
  });

  it('uses "keycap" when mainText is empty', () => {
    expect(makeBaseName({ preset: '6.25u', mainText: '' })).toBe('6.25u_keycap');
  });

  it('uses "keycap" when mainText is undefined', () => {
    expect(makeBaseName({ preset: '2u' })).toBe('2u_keycap');
  });

  it('sanitizes special characters in mainText (strips surrounding underscores)', () => {
    expect(makeBaseName({ preset: '1u', mainText: '<Esc>' })).toBe('1u_Esc');
  });

  it('strips only leading underscores from sanitized text', () => {
    expect(makeBaseName({ preset: '1u', mainText: '!test' })).toBe('1u_test');
  });

  it('strips only trailing underscores from sanitized text', () => {
    expect(makeBaseName({ preset: '1u', mainText: 'test!' })).toBe('1u_test');
  });

  it('sanitizes special characters in preset', () => {
    expect(makeBaseName({ preset: 'ISO Enter', mainText: 'Enter' })).toBe('ISO_Enter_Enter');
  });

  it('falls back to 1u preset when preset is falsy', () => {
    expect(makeBaseName({ preset: '', mainText: 'A' })).toBe('1u_A');
  });
});

// ─── makeExportNames ──────────────────────────────────────────────────────────

describe('makeExportNames', () => {
  const makeKcs = (preset, mainText, enabled = true) => ({
    legend2d: {
      keycap: { preset },
      legends: {
        main: { enabled, text: mainText },
      },
    },
  });

  it('returns stl, png, svg filenames', () => {
    const names = makeExportNames(makeKcs('1u', 'Esc'));
    expect(names).toHaveProperty('stl');
    expect(names).toHaveProperty('png');
    expect(names).toHaveProperty('svg');
  });

  it('generates correct names for 1u / Esc', () => {
    const names = makeExportNames(makeKcs('1u', 'Esc'));
    expect(names.stl).toBe('1u_Esc.stl');
    expect(names.png).toBe('1u_Esc.png');
    expect(names.svg).toBe('1u_Esc.svg');
  });

  it('uses "keycap" when main legend is empty', () => {
    const names = makeExportNames(makeKcs('6.25u', ''));
    expect(names.stl).toBe('6.25u_keycap.stl');
    expect(names.svg).toBe('6.25u_keycap.svg');
    expect(names.png).toBe('6.25u_keycap.png');
  });

  it('uses "keycap" when main legend is disabled', () => {
    const names = makeExportNames(makeKcs('2u', 'Space', false));
    expect(names.stl).toBe('2u_keycap.stl');
  });

  it('handles null kcs gracefully with defaults', () => {
    const names = makeExportNames(null);
    expect(names.stl).toBe('1u_keycap.stl');
  });

  it('all three filenames share the same base', () => {
    const names = makeExportNames(makeKcs('1.75u', 'F1'));
    const base = '1.75u_F1';
    expect(names.stl).toBe(`${base}.stl`);
    expect(names.png).toBe(`${base}.png`);
    expect(names.svg).toBe(`${base}.svg`);
  });
});
