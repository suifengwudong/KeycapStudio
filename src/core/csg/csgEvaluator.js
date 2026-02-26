/**
 * CSG Evaluator
 *
 * Two pipelines:
 *   preview – fast, no CSG; Boolean nodes show children as-is.
 *   export  – full CSG via three-csg-ts; produces a watertight mesh for STL.
 *
 * Units: millimetres (matches sceneDocument).
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { STLExporter as ThreeSTLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { OptimizedKeycapGenerator } from '../geometry/OptimizedKeycapGenerator';
import { NODE_TYPES } from '../model/sceneDocument';

const _generator = new OptimizedKeycapGenerator();

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
  _generator.setPerformanceMode(mode === 'export' ? 'quality' : 'balanced');
  const mesh = mode === 'export'
    ? _generator.generate(p)
    : _generator.generatePreview(p);
  mesh.material.color.set(p.color ?? '#ffffff');
  _applyTransform(mesh, node);
  return mesh;
}

function _evalBoolean(node, mode) {
  const children = node.children ?? [];

  if (mode === 'preview') {
    // Preview: render children without CSG (first child opaque, rest ghost)
    const group = new THREE.Group();
    children.forEach((child, i) => {
      const obj = evaluateNode(child, mode);
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
  if (children.length === 1) return evaluateNode(children[0], mode);

  const base = evaluateNode(children[0], mode);
  if (!base) return null;
  base.updateMatrix();

  let resultCSG = CSG.fromMesh(base);

  for (let i = 1; i < children.length; i++) {
    const child = evaluateNode(children[i], mode);
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
  result.geometry.computeVertexNormals();
  _applyTransform(result, node);
  return result;
}

function _evalGroup(node, mode) {
  const group = new THREE.Group();
  for (const child of node.children ?? []) {
    const obj = evaluateNode(child, mode);
    if (obj) group.add(obj);
  }
  _applyTransform(group, node);
  return group;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a single node and return a THREE.Object3D.
 *
 * @param {object} node  - scene document node
 * @param {'preview'|'export'} [mode='preview']
 * @returns {THREE.Object3D|null}
 */
export function evaluateNode(node, mode = 'preview') {
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
 * @param {object} scene - scene document
 * @param {'preview'|'export'} [mode='preview']
 * @returns {THREE.Group}
 */
export function evaluateScene(scene, mode = 'preview') {
  if (!scene?.root) return new THREE.Group();
  const result = evaluateNode(scene.root, mode);
  return result ?? new THREE.Group();
}

/** Yield to the browser so the UI can update before heavy work. */
function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Run the export pipeline and trigger a binary STL download.
 *
 * @param {object}   scene             - scene document
 * @param {string}   [filename='scene.stl']
 * @param {function} [onStage]         - optional callback(stageText) for progress updates
 */
export async function exportSceneSTL(scene, filename = 'scene.stl', onStage) {
  if (!scene?.root) throw new Error('Nothing to export: scene is empty.');

  onStage?.('Building geometry…');
  await nextFrame();
  const object = evaluateScene(scene, 'export');

  onStage?.('Running CSG…');
  await nextFrame();
  const exporter = new ThreeSTLExporter();
  const result = exporter.parse(object, { binary: true });

  onStage?.('Writing file…');
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
