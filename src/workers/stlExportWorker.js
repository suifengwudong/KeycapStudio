/**
 * STL Export Web Worker
 *
 * Runs the full CSG evaluation + STL serialisation off the main thread so the
 * UI stays responsive during heavy geometry operations.
 *
 * Message protocol
 * ─────────────────
 * IN  { scene }          – serialised scene document (plain JSON)
 * OUT { buffer }         – ArrayBuffer of the binary STL (transferable)
 *     { error: string }  – on failure
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { STLExporter as ThreeSTLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OptimizedKeycapGenerator } from '../core/geometry/OptimizedKeycapGenerator';
import { NODE_TYPES } from '../core/model/sceneDocument';

// ─── Geometry evaluator (mirror of csgEvaluator, self-contained) ─────────────

const _generator = new OptimizedKeycapGenerator();

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

function _evalKeycap(node) {
  const p = node.params ?? {};
  _generator.setPerformanceMode('quality');
  const mesh = _generator.generate(p);
  mesh.material.color.set(p.color ?? '#ffffff');
  _applyTransform(mesh, node);
  return mesh;
}

function _evalBoolean(node) {
  const children = node.children ?? [];
  if (children.length === 0) return null;
  if (children.length === 1) return _evalNode(children[0]);

  const base = _evalNode(children[0]);
  if (!base) return null;
  base.updateMatrix();

  let resultCSG = CSG.fromMesh(base);

  for (let i = 1; i < children.length; i++) {
    const child = _evalNode(children[i]);
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

function _evalGroup(node) {
  const group = new THREE.Group();
  for (const child of node.children ?? []) {
    const obj = _evalNode(child);
    if (obj) group.add(obj);
  }
  _applyTransform(group, node);
  return group;
}

function _evalNode(node) {
  if (!node) return null;
  switch (node.type) {
    case NODE_TYPES.PRIMITIVE: return _evalPrimitive(node);
    case NODE_TYPES.KEYCAP   : return _evalKeycap(node);
    case NODE_TYPES.BOOLEAN  : return _evalBoolean(node);
    case NODE_TYPES.GROUP    : return _evalGroup(node);
    default: return null;
  }
}

// ─── Worker message handler ───────────────────────────────────────────────────

self.onmessage = (e) => {
  const { scene } = e.data;
  try {
    const object = scene?.root ? (_evalNode(scene.root) ?? new THREE.Group()) : new THREE.Group();

    const exporter = new ThreeSTLExporter();
    const result = exporter.parse(object, { binary: true });

    // Store a reference before transfer so the message property remains valid
    const stlBuffer = result.buffer;
    self.postMessage({ buffer: stlBuffer }, [stlBuffer]);
  } catch (err) {
    self.postMessage({ error: err?.message ?? String(err) });
  }
};
