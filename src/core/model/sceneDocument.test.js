/**
 * Tests for sceneDocument.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SCENE_VERSION,
  SCENE_FORMAT,
  NODE_TYPES,
  BOOLEAN_OPS,
  PRIMITIVES,
  newId,
  resetIdCounter,
  createPrimitive,
  createKeycapNode,
  createBooleanNode,
  createGroupNode,
  createDefaultScene,
  validateScene,
  serialiseScene,
  deserialiseScene,
  findNodeById,
  patchNodeById,
  addChildById,
  removeNodeById,
  collectNodes,
} from './sceneDocument.js';

beforeEach(() => resetIdCounter());

// ─── Node factories ────────────────────────────────────────────────────────

describe('createPrimitive', () => {
  it('creates a box with default params', () => {
    const n = createPrimitive('box');
    expect(n.type).toBe(NODE_TYPES.PRIMITIVE);
    expect(n.primitive).toBe('box');
    expect(n.params.width).toBe(18);
    expect(n.params.height).toBe(11.5);
    expect(n.params.depth).toBe(18);
    expect(n.material.color).toBe('#cccccc');
    expect(n.position).toEqual([0, 0, 0]);
  });

  it('creates a cylinder with default params', () => {
    const n = createPrimitive('cylinder');
    expect(n.primitive).toBe('cylinder');
    expect(n.params.radiusTop).toBe(9);
    expect(n.params.height).toBe(11.5);
  });

  it('creates a sphere with default params', () => {
    const n = createPrimitive('sphere');
    expect(n.primitive).toBe('sphere');
    expect(n.params.radius).toBe(9);
  });

  it('accepts param overrides', () => {
    const n = createPrimitive('box', { params: { width: 30 } });
    expect(n.params.width).toBe(30);
    expect(n.params.height).toBe(11.5); // default preserved
  });

  it('accepts material overrides', () => {
    const n = createPrimitive('box', { material: { color: '#ff0000' } });
    expect(n.material.color).toBe('#ff0000');
  });

  it('generates a unique id', () => {
    const a = createPrimitive();
    const b = createPrimitive();
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });

  it('falls back to box for unknown primitive', () => {
    const n = createPrimitive('unknown');
    expect(n.params.width).toBe(18);
  });
});

describe('createKeycapNode', () => {
  it('has correct type and default params', () => {
    const n = createKeycapNode();
    expect(n.type).toBe(NODE_TYPES.KEYCAP);
    expect(n.params.profile).toBe('Cherry');
    expect(n.params.size).toBe('1u');
    expect(n.params.hasStem).toBe(true);
    expect(n.params.color).toBe('#cccccc');
  });

  it('accepts param overrides', () => {
    const n = createKeycapNode({ params: { profile: 'SA', size: '2u' } });
    expect(n.params.profile).toBe('SA');
    expect(n.params.size).toBe('2u');
    expect(n.params.hasStem).toBe(true); // default preserved
  });
});

describe('createBooleanNode', () => {
  it('has correct type and default operation', () => {
    const n = createBooleanNode();
    expect(n.type).toBe(NODE_TYPES.BOOLEAN);
    expect(n.operation).toBe('subtract');
    expect(n.children).toEqual([]);
  });

  it('stores inline children', () => {
    const child = createPrimitive('box');
    const n = createBooleanNode('union', [child]);
    expect(n.operation).toBe('union');
    expect(n.children).toHaveLength(1);
    expect(n.children[0].id).toBe(child.id);
  });
});

describe('createGroupNode', () => {
  it('has correct type with empty children by default', () => {
    const n = createGroupNode();
    expect(n.type).toBe(NODE_TYPES.GROUP);
    expect(n.children).toEqual([]);
  });
});

// ─── createDefaultScene ───────────────────────────────────────────────────

describe('createDefaultScene', () => {
  it('has correct version and format', () => {
    const s = createDefaultScene();
    expect(s.version).toBe(SCENE_VERSION);
    expect(s.format).toBe(SCENE_FORMAT);
  });

  it('root node is a Group', () => {
    const s = createDefaultScene();
    expect(s.root.type).toBe(NODE_TYPES.GROUP);
    expect(s.root.id).toBe('root');
  });

  it('root contains one KeycapTemplate child', () => {
    const s = createDefaultScene();
    expect(s.root.children).toHaveLength(1);
    expect(s.root.children[0].type).toBe(NODE_TYPES.KEYCAP);
  });
});

// ─── Serialisation round-trip ─────────────────────────────────────────────

describe('serialisation round-trip', () => {
  it('serialises and deserialises without data loss', () => {
    const original = createDefaultScene();
    original.name = 'My Test Scene';
    original.root.children[0].params.color = '#abcdef';

    const json     = serialiseScene(original);
    const restored = deserialiseScene(json);
    expect(restored).toEqual(original);
  });

  it('serialised output is valid JSON', () => {
    const scene = createDefaultScene();
    const json  = serialiseScene(scene);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('serialised output is pretty-printed', () => {
    const scene = createDefaultScene();
    const json  = serialiseScene(scene);
    expect(json).toContain('\n');
  });

  it('round-trip preserves nested Boolean children', () => {
    const box  = createPrimitive('box');
    const cyl  = createPrimitive('cylinder');
    const bool = createBooleanNode('subtract', [box, cyl]);
    const root = createGroupNode([bool], { id: 'root', name: 'Scene' });
    const scene = { version: SCENE_VERSION, format: SCENE_FORMAT, name: 'CSG Test', root };

    const json     = serialiseScene(scene);
    const restored = deserialiseScene(json);
    expect(restored.root.children[0].operation).toBe('subtract');
    expect(restored.root.children[0].children).toHaveLength(2);
  });
});

// ─── validateScene ────────────────────────────────────────────────────────

describe('validateScene', () => {
  it('accepts a valid scene', () => {
    const s = createDefaultScene();
    expect(() => validateScene(s)).not.toThrow();
  });

  it('throws for non-object input', () => {
    expect(() => validateScene(null)).toThrow();
    expect(() => validateScene('foo')).toThrow();
  });

  it('throws when format is missing or wrong', () => {
    expect(() => validateScene({ version: 1, root: {} })).toThrow();
    expect(() => validateScene({ version: 1, format: 'wrong', root: {} })).toThrow();
  });

  it('throws for unsupported version', () => {
    expect(() => validateScene({ version: 99, format: SCENE_FORMAT, root: {} })).toThrow(/version/i);
  });

  it('throws when root is missing', () => {
    expect(() => validateScene({ version: SCENE_VERSION, format: SCENE_FORMAT })).toThrow(/root/i);
  });

  it('throws on invalid JSON in deserialiseScene', () => {
    expect(() => deserialiseScene('{broken json')).toThrow(/Invalid JSON/i);
  });
});

// ─── Tree helpers ─────────────────────────────────────────────────────────

describe('findNodeById', () => {
  it('finds the root node', () => {
    const s = createDefaultScene();
    expect(findNodeById(s.root, 'root')).toBe(s.root);
  });

  it('finds a nested node', () => {
    const child = createKeycapNode();
    const root  = createGroupNode([child], { id: 'root', name: 'Scene' });
    expect(findNodeById(root, child.id)).toBe(child);
  });

  it('returns null for unknown id', () => {
    const s = createDefaultScene();
    expect(findNodeById(s.root, 'nonexistent')).toBeNull();
  });
});

describe('patchNodeById', () => {
  it('patches a top-level node', () => {
    const s       = createDefaultScene();
    const childId = s.root.children[0].id;
    const patched = patchNodeById(s.root, childId, { name: 'Updated' });
    expect(findNodeById(patched, childId).name).toBe('Updated');
  });

  it('does not mutate the original tree', () => {
    const s       = createDefaultScene();
    const childId = s.root.children[0].id;
    const before  = s.root.children[0].name;
    patchNodeById(s.root, childId, { name: 'Changed' });
    expect(s.root.children[0].name).toBe(before);
  });
});

describe('addChildById', () => {
  it('adds a child to the matching parent', () => {
    const root  = createGroupNode([], { id: 'root', name: 'Scene' });
    const child = createPrimitive('box');
    const updated = addChildById(root, 'root', child);
    expect(updated.children).toHaveLength(1);
    expect(updated.children[0].id).toBe(child.id);
  });
});

describe('removeNodeById', () => {
  it('removes the matching child', () => {
    const child = createPrimitive('box');
    const root  = createGroupNode([child], { id: 'root', name: 'Scene' });
    const updated = removeNodeById(root, child.id);
    expect(updated.children).toHaveLength(0);
  });

  it('does not remove the root when id matches', () => {
    // root itself is never removed by this helper (it operates on children)
    const root = createGroupNode([], { id: 'root', name: 'Scene' });
    const same = removeNodeById(root, 'root');
    expect(same.id).toBe('root');
  });
});

describe('collectNodes', () => {
  it('collects all nodes in depth-first order', () => {
    const s     = createDefaultScene();
    const nodes = collectNodes(s.root);
    expect(nodes.length).toBeGreaterThanOrEqual(2); // root + keycap
    expect(nodes[0].id).toBe('root');
  });
});

// ─── Constants integrity ──────────────────────────────────────────────────

describe('constants', () => {
  it('PRIMITIVES covers expected shapes', () => {
    expect(PRIMITIVES).toContain('box');
    expect(PRIMITIVES).toContain('cylinder');
    expect(PRIMITIVES).toContain('sphere');
  });

  it('BOOLEAN_OPS covers expected operations', () => {
    expect(BOOLEAN_OPS).toContain('subtract');
    expect(BOOLEAN_OPS).toContain('union');
    expect(BOOLEAN_OPS).toContain('intersect');
  });

  it('NODE_TYPES has all four types', () => {
    expect(Object.keys(NODE_TYPES)).toHaveLength(4);
  });
});
