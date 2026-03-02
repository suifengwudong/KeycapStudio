/**
 * Tests for geometryEngine.js
 *
 * These tests verify the shared CSG evaluation logic and the keycap geometry
 * cache that avoids recomputing expensive CSG operations for unchanged params.
 *
 * OptimizedKeycapGenerator is mocked so the tests run quickly and focus on
 * dispatch / caching behaviour rather than 3-D geometry correctness.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

// ─── Mock the keycap generator before importing geometryEngine ───────────────

// Track calls so we can assert cache hit/miss behaviour.
const generateSpy = vi.fn();
const generatePreviewSpy = vi.fn();

vi.mock('./OptimizedKeycapGenerator', () => ({
  OptimizedKeycapGenerator: class {
    setPerformanceMode() {}
    generate(params) {
      generateSpy(params);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(18, 11.5, 18),
        new THREE.MeshStandardMaterial(),
      );
      return mesh;
    }
    generatePreview(params) {
      generatePreviewSpy(params);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(18, 11.5, 18),
        new THREE.MeshStandardMaterial(),
      );
      return mesh;
    }
  },
}));

// Import AFTER the mock is registered.
const { evalNode, evalScene, clearGeometryCache } = await import('./geometryEngine.js');

import {
  createPrimitive,
  createKeycapNode,
  createGroupNode,
  createDefaultScene,
  resetIdCounter,
} from '../model/sceneDocument.js';

beforeEach(() => {
  resetIdCounter();
  clearGeometryCache();
  generateSpy.mockClear();
  generatePreviewSpy.mockClear();
});

// ─── evalNode dispatch ────────────────────────────────────────────────────────

describe('evalNode – null safety', () => {
  it('returns null for a null node', () => {
    expect(evalNode(null)).toBeNull();
  });

  it('returns null for an unknown node type', () => {
    expect(evalNode({ type: '__unknown__' })).toBeNull();
  });
});

describe('evalNode – Primitive nodes', () => {
  it('returns a THREE.Mesh for a box primitive', () => {
    const node = createPrimitive('box');
    expect(evalNode(node)).toBeInstanceOf(THREE.Mesh);
  });

  it('returns a THREE.Mesh for a cylinder primitive', () => {
    const node = createPrimitive('cylinder');
    expect(evalNode(node)).toBeInstanceOf(THREE.Mesh);
  });

  it('returns a THREE.Mesh for a sphere primitive', () => {
    const node = createPrimitive('sphere');
    expect(evalNode(node)).toBeInstanceOf(THREE.Mesh);
  });

  it('applies position from node.position', () => {
    const node = createPrimitive('box');
    node.position = [1, 2, 3];
    const mesh = evalNode(node);
    expect(mesh.position.x).toBeCloseTo(1);
    expect(mesh.position.y).toBeCloseTo(2);
    expect(mesh.position.z).toBeCloseTo(3);
  });

  it('uses the node material colour', () => {
    const node = createPrimitive('box', { material: { color: '#ff0000' } });
    const mesh = evalNode(node);
    expect(mesh.material.color.r).toBeCloseTo(1, 1);
  });
});

describe('evalNode – Keycap nodes (preview mode)', () => {
  it('returns a THREE.Mesh for a keycap in preview mode', () => {
    const node = createKeycapNode();
    expect(evalNode(node, 'preview')).toBeInstanceOf(THREE.Mesh);
  });

  it('calls generatePreview (not generate) in preview mode', () => {
    evalNode(createKeycapNode(), 'preview');
    expect(generatePreviewSpy).toHaveBeenCalledTimes(1);
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it('applies the keycap colour in preview mode', () => {
    const node = createKeycapNode({ params: { color: '#00ff00' } });
    const mesh = evalNode(node, 'preview');
    expect(mesh.material.color.g).toBeCloseTo(1, 1);
  });
});

describe('evalNode – Keycap geometry cache (export mode)', () => {
  it('returns a THREE.Mesh for a keycap in export mode', () => {
    expect(evalNode(createKeycapNode(), 'export')).toBeInstanceOf(THREE.Mesh);
  });

  it('calls generate (not generatePreview) in export mode', () => {
    evalNode(createKeycapNode(), 'export');
    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(generatePreviewSpy).not.toHaveBeenCalled();
  });

  it('second export call with identical params hits the cache (generate called once)', () => {
    const nodeA = createKeycapNode({ params: { profile: 'Cherry', size: '1u' } });
    const nodeB = createKeycapNode({ params: { profile: 'Cherry', size: '1u' } });

    evalNode(nodeA, 'export');
    evalNode(nodeB, 'export');

    // The generator should only have been called once; the second call used the cache.
    expect(generateSpy).toHaveBeenCalledTimes(1);
  });

  it('different geometry params bypass the cache (generate called for each)', () => {
    evalNode(createKeycapNode({ params: { size: '1u' } }), 'export');
    evalNode(createKeycapNode({ params: { size: '2u' } }), 'export');

    expect(generateSpy).toHaveBeenCalledTimes(2);
  });

  it('color does not affect the cache key (same geometry, different colour)', () => {
    const nodeRed  = createKeycapNode({ params: { color: '#ff0000' } });
    const nodeBlue = createKeycapNode({ params: { color: '#0000ff' } });

    const meshRed  = evalNode(nodeRed,  'export');
    const meshBlue = evalNode(nodeBlue, 'export');

    // Same shape → generate called only once (cache hit for blue).
    expect(generateSpy).toHaveBeenCalledTimes(1);

    // But materials must reflect each node's colour.
    expect(meshRed.material.color.r).toBeCloseTo(1, 1);
    expect(meshBlue.material.color.b).toBeCloseTo(1, 1);
  });

  it('clearGeometryCache causes generate to be called again', () => {
    evalNode(createKeycapNode(), 'export');
    expect(generateSpy).toHaveBeenCalledTimes(1);

    clearGeometryCache();
    evalNode(createKeycapNode(), 'export');
    expect(generateSpy).toHaveBeenCalledTimes(2);
  });
});

describe('evalNode – Group nodes', () => {
  it('returns a THREE.Group', () => {
    const group = createGroupNode([createPrimitive('box')]);
    expect(evalNode(group)).toBeInstanceOf(THREE.Group);
  });

  it('Group with no children returns an empty group', () => {
    expect(evalNode(createGroupNode([])).children.length).toBe(0);
  });

  it('Group children are added as children of the returned group', () => {
    const group = createGroupNode([createPrimitive('box'), createPrimitive('sphere')]);
    expect(evalNode(group).children.length).toBe(2);
  });
});

// ─── evalScene ────────────────────────────────────────────────────────────────

describe('evalScene', () => {
  it('returns a THREE.Group for a default scene', () => {
    expect(evalScene(createDefaultScene())).toBeInstanceOf(THREE.Group);
  });

  it('returns an empty group when scene has no root', () => {
    const result = evalScene({});
    expect(result).toBeInstanceOf(THREE.Group);
    expect(result.children.length).toBe(0);
  });

  it('returns an empty group for null scene', () => {
    expect(evalScene(null)).toBeInstanceOf(THREE.Group);
  });
});

