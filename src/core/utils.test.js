/**
 * Tests for src/core/utils.js
 */

import { describe, it, expect } from 'vitest';
import { clone } from './utils.js';

describe('clone', () => {
  it('returns a new object with the same value', () => {
    const original = { a: 1, b: 'hello', c: true };
    const copy     = clone(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
  });

  it('deep-clones nested objects', () => {
    const original = { x: { y: { z: 42 } } };
    const copy     = clone(original);
    expect(copy).toEqual(original);
    copy.x.y.z = 99;
    expect(original.x.y.z).toBe(42); // original untouched
  });

  it('deep-clones arrays', () => {
    const original = [1, [2, 3], { a: 4 }];
    const copy     = clone(original);
    expect(copy).toEqual(original);
    copy[1][0] = 99;
    expect(original[1][0]).toBe(2); // original untouched
  });

  it('handles null', () => {
    expect(clone(null)).toBeNull();
  });

  it('handles numbers and strings (primitives round-trip unchanged)', () => {
    expect(clone(42)).toBe(42);
    expect(clone('hello')).toBe('hello');
  });

  it('handles an empty object', () => {
    expect(clone({})).toEqual({});
  });
});
