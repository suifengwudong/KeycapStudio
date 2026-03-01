/**
 * STL Export Web Worker
 *
 * Runs the full CSG evaluation + STL serialisation off the main thread so the
 * UI stays responsive during heavy geometry operations.
 *
 * The geometry evaluation logic is provided by geometryEngine.js, which is
 * also used by the main thread's csgEvaluator.js – keeping a single source
 * of truth for the CSG pipeline.
 *
 * Message protocol
 * ─────────────────
 * IN  { scene }          – serialised scene document (plain JSON)
 * OUT { buffer }         – ArrayBuffer of the binary STL (transferable)
 *     { error: string }  – on failure
 */

import { STLExporter as ThreeSTLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { evalScene } from '../core/geometry/geometryEngine';

// ─── Worker message handler ───────────────────────────────────────────────────

self.onmessage = (e) => {
  const { scene } = e.data;
  try {
    const object = evalScene(scene, 'export');

    const exporter = new ThreeSTLExporter();
    const result = exporter.parse(object, { binary: true });

    // Store a reference before transfer so the message property remains valid
    const stlBuffer = result.buffer;
    self.postMessage({ buffer: stlBuffer }, [stlBuffer]);
  } catch (err) {
    self.postMessage({ error: err?.message ?? String(err) });
  }
};
