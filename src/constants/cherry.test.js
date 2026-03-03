/**
 * Tests for cherry.js constants and utilities.
 *
 * topSurfaceY and computeTopDimensions are pure-math functions with no THREE.js
 * dependency so tests run fast and produce deterministic, exact results.
 */

import { describe, it, expect } from 'vitest';
import {
  CHERRY_TOP_WIDTH,
  CHERRY_TOP_DEPTH,
  CHERRY_DISH_DEPTH,
  KEYCAP_1U_WIDTH,
  computeTopDimensions,
  topSurfaceY,
} from './cherry.js';

const HEIGHT    = 11.5;             // typical Cherry keycap height (mm)
const DISH      = CHERRY_DISH_DEPTH; // 1.2 mm
const HALF_DEPTH = CHERRY_TOP_DEPTH / 2; // 6.35 mm – half of the 1u top depth

// ─── computeTopDimensions ────────────────────────────────────────────────────

describe('computeTopDimensions', () => {
  it('returns CHERRY_TOP_WIDTH × CHERRY_TOP_DEPTH for a 1u key (18 × 18 bottom)', () => {
    const { topWidth, topDepth } = computeTopDimensions(18, 18);
    expect(topWidth).toBeCloseTo(CHERRY_TOP_WIDTH, 5);
    expect(topDepth).toBeCloseTo(CHERRY_TOP_DEPTH, 5);
  });

  it('scales topWidth proportionally for a 2u key (36 × 18 bottom)', () => {
    const { topWidth, topDepth } = computeTopDimensions(36, 18);
    expect(topWidth).toBeCloseTo(CHERRY_TOP_WIDTH * (36 / KEYCAP_1U_WIDTH), 5); // ~25.4 mm
    expect(topDepth).toBeCloseTo(CHERRY_TOP_DEPTH, 5); // depth unchanged (18 mm base)
  });

  it('scales both dimensions for ISO-Enter (22.5 × 27 bottom)', () => {
    const { topWidth, topDepth } = computeTopDimensions(22.5, 27);
    expect(topWidth).toBeCloseTo(CHERRY_TOP_WIDTH * (22.5 / KEYCAP_1U_WIDTH), 5);
    expect(topDepth).toBeCloseTo(CHERRY_TOP_DEPTH * (27 / KEYCAP_1U_WIDTH), 5); // ~19.05 mm
  });

  it('scales topWidth for a 6.25u spacebar (112.5 × 18 bottom)', () => {
    const { topWidth, topDepth } = computeTopDimensions(112.5, 18);
    expect(topWidth).toBeCloseTo(CHERRY_TOP_WIDTH * (112.5 / KEYCAP_1U_WIDTH), 5); // ~79.4 mm
    expect(topDepth).toBeCloseTo(CHERRY_TOP_DEPTH, 5); // depth always 12.7 for standard keys
  });
});

// ─── topSurfaceY (cylindrical dish – Z axis only) ────────────────────────────

describe('topSurfaceY', () => {
  it('returns keycapHeight exactly at the centre (x=0, z=0, sag=0)', () => {
    expect(topSurfaceY(0, 0, HEIGHT, DISH)).toBeCloseTo(HEIGHT, 10);
  });

  it('returns less than keycapHeight with non-zero z (dish curves in Z)', () => {
    const y = topSurfaceY(0, 3, HEIGHT, DISH);
    expect(y).toBeLessThan(HEIGHT);
  });

  it('returns keycapHeight for any non-zero x (cylindrical dish – X direction is flat)', () => {
    // Cherry profile is cylindrical: no curvature in the left-right direction.
    expect(topSurfaceY(3, 0, HEIGHT, DISH)).toBeCloseTo(HEIGHT, 10);
    expect(topSurfaceY(6, 0, HEIGHT, DISH)).toBeCloseTo(HEIGHT, 10);
  });

  it('returns keycapHeight − dishDepth at the Z-edge of the top face', () => {
    const y = topSurfaceY(0, HALF_DEPTH, HEIGHT, DISH);
    expect(y).toBeCloseTo(HEIGHT - DISH, 5);
  });

  it('is symmetric for ±x positions (X always flat in cylindrical dish)', () => {
    const y1 = topSurfaceY( 3, 0, HEIGHT, DISH);
    const y2 = topSurfaceY(-3, 0, HEIGHT, DISH);
    expect(y1).toBeCloseTo(y2, 10);
  });

  it('is symmetric for ±z positions', () => {
    const y1 = topSurfaceY(0,  2, HEIGHT, DISH);
    const y2 = topSurfaceY(0, -2, HEIGHT, DISH);
    expect(y1).toBeCloseTo(y2, 10);
  });

  it('clamps sag to dishDepth when z is beyond the Z-edge of the top face', () => {
    const yEdge   = topSurfaceY(0, HALF_DEPTH,     HEIGHT, DISH);
    const yBeyond = topSurfaceY(0, HALF_DEPTH * 2, HEIGHT, DISH);
    expect(yBeyond).toBeCloseTo(yEdge, 10);
  });

  it('returns keycapHeight for dishDepth = 0 (flat top profile)', () => {
    const y = topSurfaceY(3, 2, HEIGHT, 0);
    expect(y).toBeCloseTo(HEIGHT, 10);
  });

  it('uses custom topDepth – larger topDepth gives less sag at the same z position', () => {
    const yDefault = topSurfaceY(0, 3, HEIGHT, DISH);
    const yDeeper  = topSurfaceY(0, 3, HEIGHT, DISH, CHERRY_TOP_WIDTH, CHERRY_TOP_DEPTH * 2);
    expect(yDeeper).toBeGreaterThan(yDefault);
  });

  it('sag increases monotonically with |z| distance from centre', () => {
    const y0 = topSurfaceY(0, 0, HEIGHT, DISH);
    const y1 = topSurfaceY(0, 2, HEIGHT, DISH);
    const y2 = topSurfaceY(0, 4, HEIGHT, DISH);
    expect(y0).toBeGreaterThan(y1);
    expect(y1).toBeGreaterThan(y2);
  });
});
