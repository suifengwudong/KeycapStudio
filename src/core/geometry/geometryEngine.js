/**
 * GeometryEngine – Pure, DOM-free CSG evaluation core.
 *
 * Shared between the main thread (csgEvaluator) and the STL export Web Worker.
 * Has no DOM or UI dependencies and can be safely imported in both contexts.
 *
 * Caching
 * ───────
 * The geometry produced for a KeycapTemplate node during export is memoised by
 * its geometry-affecting parameters so that repeated exports with unchanged
 * keycap settings skip the expensive CSG pipeline entirely.  Color is excluded
 * from the cache key because it does not affect the mesh shape.
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OptimizedKeycapGenerator } from './OptimizedKeycapGenerator';
import { NODE_TYPES } from '../model/sceneDocument';

const _generator = new OptimizedKeycapGenerator();

// ─── Keycap geometry cache ────────────────────────────────────────────────────

/**
 * Memoised quality-mode keycap geometries, keyed by JSON-stringified
 * geometry-affecting params (color excluded).
 *
 * @type {Map<string, THREE.BufferGeometry>}
 */
const _keycapGeometryCache = new Map();

/** Build the cache key from geometry-affecting params only. */
function _keycapCacheKey(p) {
  const { profile = '', size = '', topRadius, wallThickness, dishDepth, height, hasStem } = p;
  return `${profile}|${size}|${topRadius}|${wallThickness}|${dishDepth}|${height}|${hasStem}`;
}

/** Clear the geometry cache (useful for testing or memory management). */
export function clearGeometryCache() {
  _keycapGeometryCache.clear();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _material(node) {
  const color = node.material?.color ?? '#cccccc';
  return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.08 });
}

function _applyTransform(obj, node) {
  if (node.position) obj.position.fromArray(node.position);
  if (node.rotation) obj.rotation.fromArray(node.rotation);
  obj.updateMatrix();
  obj.updateMatrixWorld(true);
}

// ─── Node evaluators ──────────────────────────────────────────────────────────

function _evalPrimitive(node) {
  const p = node.params ?? {};
  let geometry;
  switch (node.primitive) {
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(
        p.radiusTop    ?? 9,
        p.radiusBottom ?? 9,
        p.height       ?? 11.5,
        p.radialSegments ?? 32,
      );
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(
        p.radius         ?? 9,
        p.widthSegments  ?? 32,
        p.heightSegments ?? 16,
      );
      break;
    case 'box':
    default:
      geometry = new THREE.BoxGeometry(
        p.width  ?? 18,
        p.height ?? 11.5,
        p.depth  ?? 18,
      );
  }
  const mesh = new THREE.Mesh(geometry, _material(node));
  _applyTransform(mesh, node);
  return mesh;
}

function _evalKeycap(node, mode) {
  const p = node.params ?? {};
  const isExport = mode === 'export';

  let geometry;
  if (isExport) {
    // Cache hit: reuse previously computed geometry for the same shape params.
    const key = _keycapCacheKey(p);
    if (_keycapGeometryCache.has(key)) {
      geometry = _keycapGeometryCache.get(key).clone();
    } else {
      _generator.setPerformanceMode('quality');
      const generated = _generator.generate(p);
      // Store a clone so the cached copy is never mutated by downstream code.
      _keycapGeometryCache.set(key, generated.geometry.clone());
      geometry = generated.geometry;
    }
  } else {
    _generator.setPerformanceMode('balanced');
    geometry = _generator.generatePreview(p).geometry;
  }

  const material = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.08 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.material.color.set(p.color ?? '#ffffff');
  _applyTransform(mesh, node);
  return mesh;
}

function _evalBoolean(node, mode) {
  const children = node.children ?? [];

  if (mode === 'preview') {
    // Preview: render children without CSG (first child opaque, rest ghost).
    const group = new THREE.Group();
    children.forEach((child, i) => {
      const obj = evalNode(child, mode);
      if (!obj) return;
      if (i > 0 && obj.material) {
        obj.material = obj.material.clone();
        obj.material.transparent = true;
        obj.material.opacity = 0.25;
      }
      group.add(obj);
    });
    _applyTransform(group, node);
    return group;
  }

  // Export: full CSG
  if (children.length === 0) return null;
  if (children.length === 1) return evalNode(children[0], mode);

  const base = evalNode(children[0], mode);
  if (!base) return null;
  base.updateMatrix();

  let resultCSG = CSG.fromMesh(base);

  for (let i = 1; i < children.length; i++) {
    const child = evalNode(children[i], mode);
    if (!child) continue;
    child.updateMatrix();
    const childCSG = CSG.fromMesh(child);
    switch (node.operation) {
      case 'union'    : resultCSG = resultCSG.union(childCSG);     break;
      case 'intersect': resultCSG = resultCSG.intersect(childCSG); break;
      case 'subtract' :
      default          : resultCSG = resultCSG.subtract(childCSG);
    }
  }

  const result = CSG.toMesh(resultCSG, new THREE.Matrix4(), base.material);
  result.geometry = mergeVertices(result.geometry);
  result.geometry.computeVertexNormals();
  _applyTransform(result, node);
  return result;
}

function _evalGroup(node, mode) {
  const group = new THREE.Group();
  for (const child of node.children ?? []) {
    const obj = evalNode(child, mode);
    if (obj) group.add(obj);
  }
  _applyTransform(group, node);
  return group;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a single scene node and return a THREE.Object3D.
 *
 * @param {object} node
 * @param {'preview'|'export'} [mode='preview']
 * @returns {THREE.Object3D|null}
 */
export function evalNode(node, mode = 'preview') {
  if (!node) return null;
  switch (node.type) {
    case NODE_TYPES.PRIMITIVE: return _evalPrimitive(node);
    case NODE_TYPES.KEYCAP   : return _evalKeycap(node, mode);
    case NODE_TYPES.BOOLEAN  : return _evalBoolean(node, mode);
    case NODE_TYPES.GROUP    : return _evalGroup(node, mode);
    default: return null;
  }
}

/**
 * Evaluate the full scene tree and return a THREE.Group.
 *
 * @param {object} scene
 * @param {'preview'|'export'} [mode='preview']
 * @returns {THREE.Group}
 */
export function evalScene(scene, mode = 'preview') {
  if (!scene || !scene.root) return new THREE.Group();
  const result = evalNode(scene.root, mode);
  return result ?? new THREE.Group();
}
