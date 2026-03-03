/**
 * Tests for topSurfaceY – the keycap top-surface height utility in cherry.js.
 *
 * topSurfaceY is pure math (no THREE.js dependency) so these tests run fast
 * and give deterministic, exact results.
 */

import { describe, it, expect } from 'vitest';
import {
  CHERRY_TOP_WIDTH,
  CHERRY_TOP_DEPTH,
  CHERRY_DISH_DEPTH,
  topSurfaceY,
} from './cherry.js';

const HEIGHT    = 11.5;   // typical Cherry keycap height (mm)
const DISH      = CHERRY_DISH_DEPTH; // 1.2 mm
const MAX_DIM   = Math.max(CHERRY_TOP_WIDTH, CHERRY_TOP_DEPTH) / 2; // 6.35 mm

describe('topSurfaceY', () => {
  it('returns keycapHeight exactly at the centre (x=0, z=0, sag=0)', () => {
    expect(topSurfaceY(0, 0, HEIGHT, DISH)).toBeCloseTo(HEIGHT, 10);
  });

  it('returns less than keycapHeight away from the centre', () => {
    const y = topSurfaceY(3, 0, HEIGHT, DISH);
    expect(y).toBeLessThan(HEIGHT);
  });

  it('returns keycapHeight − dishDepth at the maximum radius (edge of top face)', () => {
    const y = topSurfaceY(MAX_DIM, 0, HEIGHT, DISH);
    expect(y).toBeCloseTo(HEIGHT - DISH, 5);
  });

  it('is symmetric for ±x positions', () => {
    const y1 = topSurfaceY( 3, 0, HEIGHT, DISH);
    const y2 = topSurfaceY(-3, 0, HEIGHT, DISH);
    expect(y1).toBeCloseTo(y2, 10);
  });

  it('is symmetric for ±z positions', () => {
    const y1 = topSurfaceY(0,  2, HEIGHT, DISH);
    const y2 = topSurfaceY(0, -2, HEIGHT, DISH);
    expect(y1).toBeCloseTo(y2, 10);
  });

  it('clamps sag to dishDepth when position is beyond the keycap edge', () => {
    // Any dist > MAX_DIM should give the same result as dist = MAX_DIM.
    const yEdge   = topSurfaceY(MAX_DIM,     0, HEIGHT, DISH);
    const yBeyond = topSurfaceY(MAX_DIM * 2, 0, HEIGHT, DISH);
    expect(yBeyond).toBeCloseTo(yEdge, 10);
  });

  it('returns keycapHeight for dishDepth = 0 (flat top profile)', () => {
    const y = topSurfaceY(3, 2, HEIGHT, 0);
    expect(y).toBeCloseTo(HEIGHT, 10);
  });

  it('uses custom topWidth and topDepth when provided', () => {
    // Double the top dimensions → smaller normalised distance → less sag.
    const yDefault = topSurfaceY(3, 0, HEIGHT, DISH);
    const yWider   = topSurfaceY(3, 0, HEIGHT, DISH, CHERRY_TOP_WIDTH * 2, CHERRY_TOP_DEPTH * 2);
    expect(yWider).toBeGreaterThan(yDefault);
  });

  it('sag increases monotonically with distance from centre', () => {
    const y0 = topSurfaceY(0, 0, HEIGHT, DISH);
    const y1 = topSurfaceY(2, 0, HEIGHT, DISH);
    const y2 = topSurfaceY(4, 0, HEIGHT, DISH);
    expect(y0).toBeGreaterThan(y1);
    expect(y1).toBeGreaterThan(y2);
  });
});
