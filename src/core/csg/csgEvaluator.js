/**
 * CSG Evaluator
 *
 * Two pipelines:
 *   preview – fast, no CSG; Boolean nodes show children as-is.
 *   export  – full CSG via three-csg-ts; produces a watertight mesh for STL.
 *
 * Units: millimetres (matches sceneDocument).
 *
 * The heavy geometry evaluation logic lives in geometryEngine.js, which is
 * also imported by stlExportWorker.js so the implementation is not duplicated.
 */

import { STLExporter as ThreeSTLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { evalNode, evalScene } from '../geometry/geometryEngine';
import { triggerDownload } from '../io/browser.js';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a single node and return a THREE.Object3D.
 *
 * @param {object} node  - scene document node
 * @param {'preview'|'export'} [mode='preview']
 * @returns {THREE.Object3D|null}
 */
export function evaluateNode(node, mode = 'preview') {
  return evalNode(node, mode);
}

/**
 * Evaluate the full scene tree and return a THREE.Group.
 *
 * @param {object} scene - scene document
 * @param {'preview'|'export'} [mode='preview']
 * @returns {THREE.Group}
 */
export function evaluateScene(scene, mode = 'preview') {
  return evalScene(scene, mode);
}

/** Yield to the browser so the UI can update before heavy work. */
function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

// ─── Persistent worker singleton ─────────────────────────────────────────────
//
// A single worker instance is reused across export calls.  This allows the
// in-process geometry cache inside the worker's copy of geometryEngine.js to
// survive between exports, so unchanged keycap shapes are never re-computed.

let _worker = null;
const _exportQueue = [];

function _getOrCreateWorker() {
  if (_worker) return _worker;

  const w = new Worker(
    new URL('../../workers/stlExportWorker.js', import.meta.url),
    { type: 'module' },
  );

  w.onmessage = (e) => {
    const cb = _exportQueue.shift();
    if (!cb) {
      // Orphaned message (e.g. arrived after a queue drain on worker crash) – ignore.
      return;
    }
    if (e.data.error) {
      cb.reject(new Error(e.data.error));
    } else {
      cb.resolve(new Uint8Array(e.data.buffer));
    }
  };

  w.onerror = (event) => {
    // Reset on crash so the next call gets a fresh worker.
    _worker = null;
    const cb = _exportQueue.shift();
    if (cb) cb.reject(new Error(event.message ?? 'Worker error'));
    // Drain any remaining queued exports.
    while (_exportQueue.length) {
      _exportQueue.shift().reject(new Error('Worker crashed'));
    }
  };

  _worker = w;
  return w;
}

/**
 * Run the CSG evaluation + STL serialisation in the persistent Web Worker and
 * return the binary buffer.  Falls back to main-thread evaluation if workers
 * are unavailable.
 *
 * @param {object} scene - scene document (plain JSON, transferable)
 * @returns {Promise<Uint8Array>} binary STL bytes
 */
function _exportInWorker(scene) {
  return new Promise((resolve, reject) => {
    try {
      const worker = _getOrCreateWorker();
      _exportQueue.push({ resolve, reject });
      worker.postMessage({ scene });
    } catch (err) {
      // Worker construction failed (e.g. in test environments) – fall back.
      reject(new Error('worker_unavailable', { cause: err }));
    }
  });
}

/**
 * Run the export pipeline and trigger a binary STL download.
 *
 * Heavy CSG computation runs in a Web Worker when available so the main
 * thread (and the UI) stays responsive throughout.
 *
 * @param {object}   scene             - scene document
 * @param {string}   [filename='scene.stl']
 * @param {function} [onStage]         - optional callback(stageText) for progress updates
 */
export async function exportSceneSTL(scene, filename = 'scene.stl', onStage) {
  if (!scene?.root) throw new Error('Nothing to export: scene is empty.');

  onStage?.('Step 1/3: Generating geometry…');
  await nextFrame();

  let stlBytes;

  try {
    onStage?.('Step 2/3: Running CSG pipeline (background)…');
    stlBytes = await _exportInWorker(scene);
  } catch (workerErr) {
    // Fallback: run on main thread (blocks UI but always works)
    if (workerErr.message !== 'worker_unavailable') throw workerErr;
    const object = evaluateScene(scene, 'export');
    await nextFrame();
    const exporter = new ThreeSTLExporter();
    stlBytes = exporter.parse(object, { binary: true });
  }

  onStage?.('Step 3/3: Writing STL file…');
  const blob = new Blob([stlBytes], { type: 'application/octet-stream' });
  triggerDownload(blob, filename);
}
