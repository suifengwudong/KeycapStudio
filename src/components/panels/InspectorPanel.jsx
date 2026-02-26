/**
 * KeycapStudio V1 – Inspector Panel
 *
 * Left panel with sections:
 *  1. Preset / size selector
 *  2. Style (background color, outline toggle + color + thickness)
 *  3. Legends (main + topLeft + bottomRight + left)
 *  4. Font selection
 *  5. Position (numeric X/Y + "Center" shortcut for main legend)
 */

import React, { useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.js';
import { useAssetStore }   from '../../store/assetStore.js';
import { SIZE_PRESETS }    from '../../core/model/projectModel.js';

const LEGEND_LABELS = {
  main:        'Main',
  topLeft:     'Top-Left',
  bottomRight: 'Bottom-Right',
  left:        'Left',
};

// ── Small reusable widgets ─────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1">
      <label className="text-xs text-gray-300 flex-1">{label}</label>
      <div className="flex items-center gap-1">
        <div
          className="w-5 h-5 rounded border border-gray-600"
          style={{ background: value }}
        />
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-7 h-7 cursor-pointer bg-transparent border-none p-0"
          title={value}
        />
        <input
          type="text"
          value={value}
          maxLength={7}
          onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className="w-20 bg-gray-800 border border-gray-600 rounded px-1 text-xs text-gray-200"
        />
      </div>
    </div>
  );
}

function NumericInput({ label, value, onChange, min = -0.5, max = 0.5, step = 0.01 }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1">
      <label className="text-xs text-gray-300 w-4">{label}</label>
      <input
        type="number"
        value={Number(value.toFixed(3))}
        min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-gray-200"
      />
    </div>
  );
}

// Canonical preset keys shown in the UI dropdown (excludes legacy aliases Shift/Enter)
const PRESET_OPTIONS = Object.entries(SIZE_PRESETS).filter(
  ([k]) => k !== 'Shift' && k !== 'Enter'
);

export default function InspectorPanel() {
  const project        = useProjectStore(s => s.project);
  const selectedLegend = useProjectStore(s => s.selectedLegend);
  const setSelectedLegend = useProjectStore(s => s.setSelectedLegend);
  const updateKeycap   = useProjectStore(s => s.updateKeycap);
  const updateLegend   = useProjectStore(s => s.updateLegend);
  const systemFonts    = useProjectStore(s => s.systemFonts);

  // Read 3D size to detect ISO Enter approximation notice
  const shape3dSize = useAssetStore(s => s.asset?.shape3d?.params?.size);
  const isIsoEnterApprox = shape3dSize === 'ISO-Enter';

  const { keycap, legends } = project;
  const activeLeg = legends[selectedLegend];

  const centerMain = useCallback(() => {
    updateLegend('main', { x: 0, y: 0 });
  }, [updateLegend]);

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto p-3 text-sm text-gray-200 flex-shrink-0">
      {/* ── 1. Size preset ──────────────────────────────────────────── */}
      <SectionTitle>Size Preset</SectionTitle>
      <select
        value={keycap.preset}
        onChange={e => updateKeycap({ preset: e.target.value })}
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs mb-1"
      >
        {PRESET_OPTIONS.map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      {isIsoEnterApprox && (
        <p className="text-xs text-yellow-400 mb-1">
          ⚠ ISO Enter（矩形近似）
        </p>
      )}

      {/* ── 2. Style ────────────────────────────────────────────────── */}
      <SectionTitle>Style</SectionTitle>
      <ColorInput
        label="Background"
        value={keycap.bgColor}
        onChange={c => updateKeycap({ bgColor: c })}
      />
      <div className="flex items-center gap-2 mb-1">
        <input
          type="checkbox"
          id="outline-toggle"
          checked={keycap.outlineEnabled}
          onChange={e => updateKeycap({ outlineEnabled: e.target.checked })}
          className="accent-blue-500"
        />
        <label htmlFor="outline-toggle" className="text-xs text-gray-300 flex-1 cursor-pointer">
          Outline
        </label>
      </div>
      {keycap.outlineEnabled && (
        <>
          <ColorInput
            label="Outline color"
            value={keycap.outlineColor}
            onChange={c => updateKeycap({ outlineColor: c })}
          />
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-xs text-gray-300">Thickness</label>
            <input
              type="range"
              min={1} max={8} step={0.5}
              value={keycap.outlineThickness}
              onChange={e => updateKeycap({ outlineThickness: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs w-6 text-right">{keycap.outlineThickness}</span>
          </div>
        </>
      )}

      {/* ── 3. Legends ──────────────────────────────────────────────── */}
      <SectionTitle>Legends</SectionTitle>
      <div className="flex gap-1 flex-wrap mb-2">
        {Object.keys(LEGEND_LABELS).map(key => (
          <button
            key={key}
            onClick={() => setSelectedLegend(key)}
            className={`px-2 py-0.5 rounded text-xs border ${
              selectedLegend === key
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {LEGEND_LABELS[key]}
          </button>
        ))}
      </div>

      {activeLeg && (
        <div className="bg-gray-750 border border-gray-600 rounded p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`legend-enabled-${selectedLegend}`}
              checked={activeLeg.enabled}
              onChange={e => updateLegend(selectedLegend, { enabled: e.target.checked })}
              className="accent-blue-500"
            />
            <label
              htmlFor={`legend-enabled-${selectedLegend}`}
              className="text-xs text-gray-300 cursor-pointer"
            >
              Enabled
            </label>
          </div>

          {activeLeg.enabled && (
            <>
              <input
                type="text"
                value={activeLeg.text}
                onChange={e => updateLegend(selectedLegend, { text: e.target.value })}
                placeholder="Legend text"
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs"
              />
              <ColorInput
                label="Text color"
                value={activeLeg.color}
                onChange={c => updateLegend(selectedLegend, { color: c })}
              />
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-gray-300">Font size</label>
                <input
                  type="number"
                  min={6} max={72} step={1}
                  value={activeLeg.fontSize}
                  onChange={e => updateLegend(selectedLegend, { fontSize: parseInt(e.target.value) || 12 })}
                  className="w-16 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 4. Font ─────────────────────────────────────────────────── */}
      {activeLeg?.enabled && (
        <>
          <SectionTitle>Font</SectionTitle>
          <select
            value={activeLeg.font}
            onChange={e => updateLegend(selectedLegend, { font: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs mb-1"
          >
            {systemFonts.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </>
      )}

      {/* ── 5. Position ─────────────────────────────────────────────── */}
      {activeLeg?.enabled && (
        <>
          <SectionTitle>Position</SectionTitle>
          <NumericInput
            label="X"
            value={activeLeg.x}
            onChange={v => updateLegend(selectedLegend, { x: v })}
          />
          <NumericInput
            label="Y"
            value={activeLeg.y}
            onChange={v => updateLegend(selectedLegend, { y: v })}
          />
          {selectedLegend === 'main' && (
            <button
              onClick={centerMain}
              className="mt-1 w-full py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600"
            >
              Center main legend
            </button>
          )}
        </>
      )}
    </aside>
  );
}
