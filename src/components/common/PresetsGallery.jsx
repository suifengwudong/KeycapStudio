/**
 * PresetsGallery – full-screen overlay showing built-in keycap presets.
 *
 * Clicking a preset loads it into the asset store and closes the gallery.
 *
 * Props:
 *   open     {boolean}   – whether the overlay is visible
 *   onClose  {function}  – called when the gallery is dismissed
 */

import React from 'react';
import { KEYCAP_PRESETS, PRESET_CATEGORY_LABELS, buildPresetKcs } from '../../constants/presets.js';
import { useAssetStore } from '../../store/assetStore.js';

/** Tiny keycap preview card sized proportionally to the size. */
function PresetCard({ preset, onClick }) {
  // Normalise display width: wider keys get wider cards (capped at 2× height).
  const sizeNum   = parseFloat(preset.size) || 1;
  const widthRem  = Math.min(sizeNum * 2.5, 5.5); // rem

  return (
    <button
      onClick={onClick}
      title={preset.name}
      className="flex flex-col items-center gap-1 group"
      style={{ width: `${widthRem}rem` }}
    >
      {/* Visual keycap block */}
      <div
        className="rounded border border-gray-600 group-hover:border-blue-400 transition-colors flex items-center justify-center text-white text-xs font-bold select-none shadow"
        style={{
          width      : '100%',
          height     : '2.5rem',
          background : preset.color ?? '#2c2c2c',
          fontSize   : '0.65rem',
        }}
      >
        {preset.label || preset.name.slice(0, 4)}
      </div>
      {/* Label */}
      <span className="text-gray-300 text-xs leading-tight text-center break-words group-hover:text-white" style={{ fontSize: '0.6rem' }}>
        {preset.name}
      </span>
    </button>
  );
}

export default function PresetsGallery({ open, onClose }) {
  const loadAsset = useAssetStore(s => s.loadAsset);

  if (!open) return null;

  const handleSelect = (preset) => {
    loadAsset(buildPresetKcs(preset), { resetDirty: true });
    onClose();
  };

  // Group presets by category
  const byCategory = {};
  for (const p of KEYCAP_PRESETS) {
    const cat = p.category ?? 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-6 w-[600px] max-w-[95vw] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">选择键帽预设</h2>
            <p className="text-xs text-gray-400 mt-0.5">选择一个预设作为起点，然后立即开始编辑</p>
          </div>
          <button
            className="text-gray-400 hover:text-white text-lg leading-none px-1"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Category groups */}
        {Object.entries(byCategory).map(([cat, presets]) => (
          <div key={cat} className="mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {PRESET_CATEGORY_LABELS[cat] ?? cat}
            </h3>
            <div className="flex flex-wrap gap-3 items-end">
              {presets.map(p => (
                <PresetCard
                  key={p.id}
                  preset={p}
                  onClick={() => handleSelect(p)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="border-t border-gray-700 pt-3 mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>所有预设均使用 Cherry MX 轴孔，可在 Inspector 中修改参数</span>
          <button
            className="text-gray-400 hover:text-gray-200 ml-4"
            onClick={onClose}
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  );
}
