/**
 * KeycapStudio V1 – 2D Keycap Canvas
 *
 * HTML5 Canvas-based preview with:
 * - High-DPI rendering (devicePixelRatio)
 * - Zoom in/out
 * - Drag-to-reposition legends
 * - Arrow-key nudge (1 px step; Shift = 8 px step), expressed in fraction units
 * - One-click centering for the main legend
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';
import { useProjectStore }   from '../../store/projectStore.js';
import { drawKeycapToContext } from '../../core/export/PNGExporter.js';
import { presetPx }           from '../../core/model/projectModel.js';

const LEGEND_KEYS    = ['main', 'topLeft', 'bottomRight', 'left'];
const HIT_RADIUS_PX  = 16; // legend hit-test radius in canvas CSS pixels

export default function KeycapCanvas2D() {
  const canvasRef = useRef(null);

  const project        = useProjectStore(s => s.project);
  const zoom           = useProjectStore(s => s.zoom);
  const setZoom        = useProjectStore(s => s.setZoom);
  const selectedLegend = useProjectStore(s => s.selectedLegend);
  const setSelectedLegend = useProjectStore(s => s.setSelectedLegend);
  const updateLegend   = useProjectStore(s => s.updateLegend);

  const [dragging, setDragging]    = useState(null); // { key, startX, startY, origX, origY }
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 400 });

  // ── Keycap pixel size at current zoom ──────────────────────────────────
  const { w: kcW, h: kcH } = presetPx(project.keycap.preset, zoom);

  // ── Draw ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    canvas.style.width  = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    // Checkerboard background
    drawCheckerboard(ctx, canvasSize.w, canvasSize.h);

    // Center the keycap
    const ox = Math.round((canvasSize.w - kcW) / 2);
    const oy = Math.round((canvasSize.h - kcH) / 2);
    ctx.save();
    ctx.translate(ox, oy);
    drawKeycapToContext(ctx, project, zoom, false);
    ctx.restore();

    // Draw selection handles for enabled legends
    for (const key of LEGEND_KEYS) {
      const leg = project.legends[key];
      if (!leg.enabled) continue;
      const { lx, ly } = legendCanvasPos(leg, ox, oy, kcW, kcH);
      const isSelected = key === selectedLegend;
      ctx.save();
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#94a3b8';
      ctx.lineWidth   = isSelected ? 2 : 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(lx - 18, ly - 12, 36, 24);
      ctx.restore();
    }
  }, [project, zoom, canvasSize, selectedLegend, kcW, kcH]);

  // ── Resize observer ──────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────
  const getOffset = useCallback(() => {
    return {
      ox: Math.round((canvasSize.w - kcW) / 2),
      oy: Math.round((canvasSize.h - kcH) / 2),
    };
  }, [canvasSize, kcW, kcH]);

  const hitTest = useCallback((cx, cy) => {
    const { ox, oy } = getOffset();
    for (const key of LEGEND_KEYS) {
      const leg = project.legends[key];
      if (!leg.enabled) continue;
      const { lx, ly } = legendCanvasPos(leg, ox, oy, kcW, kcH);
      if (Math.abs(cx - lx) < HIT_RADIUS_PX && Math.abs(cy - ly) < HIT_RADIUS_PX) {
        return key;
      }
    }
    return null;
  }, [project.legends, getOffset, kcW, kcH]);

  // ── Mouse events ──────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx   = e.clientX - rect.left;
    const cy   = e.clientY - rect.top;
    const key  = hitTest(cx, cy);
    if (key) {
      setSelectedLegend(key);
      const leg = project.legends[key];
      setDragging({ key, startX: cx, startY: cy, origX: leg.x, origY: leg.y });
    }
  }, [hitTest, project.legends, setSelectedLegend]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx   = e.clientX - rect.left;
    const cy   = e.clientY - rect.top;
    const dx   = (cx - dragging.startX) / kcW;
    const dy   = (cy - dragging.startY) / kcH;
    updateLegend(dragging.key, {
      x: clamp(dragging.origX + dx, -0.5, 0.5),
      y: clamp(dragging.origY + dy, -0.5, 0.5),
    });
  }, [dragging, kcW, kcH, updateLegend]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  // ── Keyboard nudge ────────────────────────────────────────────────────
  const onKeyDown = useCallback((e) => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const step   = (e.shiftKey ? 8 : 1);
    const frac   = step / Math.min(kcW, kcH);   // pixels → fraction
    const key    = selectedLegend;
    const leg    = project.legends[key];
    if (!leg) return;
    let { x, y } = leg;
    if (e.key === 'ArrowLeft')  x = clamp(x - frac, -0.5, 0.5);
    if (e.key === 'ArrowRight') x = clamp(x + frac, -0.5, 0.5);
    if (e.key === 'ArrowUp')    y = clamp(y - frac, -0.5, 0.5);
    if (e.key === 'ArrowDown')  y = clamp(y + frac, -0.5, 0.5);
    updateLegend(key, { x, y });
  }, [selectedLegend, project.legends, kcW, kcH, updateLegend]);

  // ── Wheel zoom ────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-gray-800/80 rounded px-2 py-1 text-xs select-none">
        <button
          className="px-1 hover:text-blue-400"
          onClick={() => setZoom(zoom - 0.25)}
        >−</button>
        <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          className="px-1 hover:text-blue-400"
          onClick={() => setZoom(zoom + 0.25)}
        >+</button>
        <button
          className="ml-2 px-1 hover:text-blue-400"
          onClick={() => setZoom(1)}
        >Reset</button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        tabIndex={0}
        style={{ cursor: dragging ? 'grabbing' : 'default', outline: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
      />
    </div>
  );
}

// ── Utility ──────────────────────────────────────────────────────────────────

function legendCanvasPos(leg, ox, oy, kcW, kcH) {
  return {
    lx: ox + kcW / 2 + leg.x * kcW,
    ly: oy + kcH / 2 + leg.y * kcH,
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function drawCheckerboard(ctx, w, h) {
  const size = 12;
  for (let row = 0; row * size < h; row++) {
    for (let col = 0; col * size < w; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#374151' : '#2d3748';
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
}
