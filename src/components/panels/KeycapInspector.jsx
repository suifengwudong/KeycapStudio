/**
 * KeycapInspector – dedicated editor for KeycapTemplate scene nodes.
 *
 * Parameters exposed:
 *   - Profile         (Cherry / SA / DSA / OEM)
 *   - Size            (1u, 1.25u, …)
 *   - Color
 *   - Top Radius      (0.1–3.0 mm)
 *   - Wall Thickness  (0.8–3.5 mm)
 *   - Cherry MX stem  (checkbox)
 *   - Height override (6–20 mm, Auto by default)
 *   - Dish Depth      (0–3.0 mm, controls top-surface concavity)
 */

import React from 'react';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';
import { CHERRY_DISH_DEPTH } from '../../constants/cherry';
import Slider from '../common/Slider';
import ColorPicker from '../common/ColorPicker';

export default function KeycapInspector({ node, onUpdate }) {
  const p    = node.params ?? {};
  const setP = (key, val) => onUpdate({ params: { ...p, [key]: val } });

  // Resolve the effective height so sliders always have a meaningful value.
  const profileData    = PROFILES[p.profile] ?? PROFILES['Cherry'];
  const resolvedHeight = p.height != null ? p.height : profileData.baseHeight;
  const resolvedDish   = p.dishDepth != null ? p.dishDepth : CHERRY_DISH_DEPTH;

  return (
    <>
      {/* ── Profile ──────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Profile</label>
        <select
          value={p.profile ?? 'Cherry'}
          onChange={e => setP('profile', e.target.value)}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700"
        >
          {Object.keys(PROFILES).map(k => (
            <option key={k} value={k}>{PROFILES[k].name}</option>
          ))}
        </select>
      </div>

      {/* ── Size ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Size</label>
        <select
          value={p.size ?? '1u'}
          onChange={e => setP('size', e.target.value)}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700"
        >
          {Object.keys(KEYCAP_SIZES).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* ── Color ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Color</label>
        <ColorPicker value={p.color ?? '#ffffff'} onChange={c => setP('color', c)} />
      </div>

      {/* ── Top Radius ───────────────────────────────────────────── */}
      <Slider
        label="Top Radius (mm)"
        min={0.1} max={3.0} step={0.1}
        value={p.topRadius ?? 0.5}
        onChange={v => setP('topRadius', v)}
        unit="mm"
      />

      {/* ── Wall Thickness ───────────────────────────────────────── */}
      <Slider
        label="Wall Thickness (mm)"
        min={0.8} max={3.5} step={0.1}
        value={p.wallThickness ?? 1.5}
        onChange={v => setP('wallThickness', v)}
        unit="mm"
      />

      {/* ── Height override ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-400">Height (mm)</label>
          {p.height != null && (
            <button
              className="text-xs text-blue-400 hover:text-blue-300 leading-none"
              title="Reset to profile default"
              onClick={() => setP('height', null)}
            >
              Auto
            </button>
          )}
        </div>
        <input
          type="number"
          min={6} max={20} step={0.1}
          value={resolvedHeight}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) setP('height', Math.max(6, Math.min(20, v)));
          }}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        {p.height == null && (
          <div className="text-xs text-gray-600 mt-0.5">
            Auto ({profileData.baseHeight} mm from profile)
          </div>
        )}
      </div>

      {/* ── Dish Depth ───────────────────────────────────────────── */}
      <Slider
        label="Dish Depth (mm)"
        min={0} max={3.0} step={0.1}
        value={resolvedDish}
        onChange={v => setP('dishDepth', v)}
        unit="mm"
      />

      {/* ── Cherry MX Stem ───────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <input
          id={`ks-hasStem-${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
          type="checkbox"
          checked={p.hasStem ?? true}
          onChange={e => setP('hasStem', e.target.checked)}
          className="accent-blue-500"
        />
        <label htmlFor={`ks-hasStem-${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`} className="text-xs text-gray-300 cursor-pointer">
          Cherry MX stem hole
        </label>
      </div>
    </>
  );
}
