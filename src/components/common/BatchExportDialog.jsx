/**
 * BatchExportDialog – lets users select keycap sizes and export one STL per size,
 * all using the current keycap shape parameters.
 *
 * Props:
 *   open       {boolean}    – whether the dialog is visible
 *   onClose    {function}   – called when dialog is dismissed
 *   onExport   {function}   – called with (sizes[]) when user confirms
 *   isExporting {boolean}   – true while export is running (disables button)
 */

import React, { useState } from 'react';
import { SIZE_ENUM } from '../../core/model/sizeMapping.js';

/** Human-readable labels for common sizes. */
const SIZE_LABELS = {
  '1u'       : '1u  – 字母 / 数字',
  '1.25u'    : '1.25u – Ctrl / Alt',
  '1.5u'     : '1.5u – Tab',
  '1.75u'    : '1.75u – CapsLock',
  '2u'       : '2u  – Backspace (100%)',
  '2.25u'    : '2.25u – Enter / Shift',
  '6.25u'    : '6.25u – 空格键',
  '7u'       : '7u  – 大空格键',
  'ISO-Enter': 'ISO Enter',
};

/** Sizes pre-selected when the dialog opens. */
const DEFAULT_BATCH_SIZES = new Set(['1u', '1.25u', 'ISO-Enter', '2.25u', '6.25u']);

export default function BatchExportDialog({ open, onClose, onExport, isExporting }) {
  const [selected, setSelected] = useState(new Set(DEFAULT_BATCH_SIZES));

  if (!open) return null;

  const toggle = (size) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size); else next.add(size);
      return next;
    });
  };

  const handleExport = () => {
    if (selected.size === 0) return;
    onExport([...selected]);
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-5 w-[400px] max-w-[95vw]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">批量导出 STL</h2>
            <p className="text-xs text-gray-400 mt-0.5">选择尺寸，将使用当前键帽参数生成各尺寸 STL</p>
          </div>
          <button className="text-gray-400 hover:text-white text-lg leading-none px-1" onClick={onClose}>✕</button>
        </div>

        {/* Size checkboxes */}
        <div className="space-y-1.5 mb-4">
          {SIZE_ENUM.map(size => (
            <label key={size} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.has(size)}
                onChange={() => toggle(size)}
                className="accent-blue-500 w-3.5 h-3.5 shrink-0"
              />
              <span className="text-xs text-gray-300 group-hover:text-white">
                {SIZE_LABELS[size] ?? size}
              </span>
            </label>
          ))}
        </div>

        {/* Select / clear all */}
        <div className="flex gap-2 mb-4 text-xs">
          <button
            className="text-blue-400 hover:text-blue-300"
            onClick={() => setSelected(new Set(SIZE_ENUM))}
          >
            全选
          </button>
          <span className="text-gray-600">·</span>
          <button
            className="text-gray-400 hover:text-gray-200"
            onClick={() => setSelected(new Set())}
          >
            清空
          </button>
          <span className="flex-1" />
          <span className="text-gray-500">{selected.size} 个已选</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={selected.size === 0 || isExporting}
            onClick={handleExport}
          >
            {isExporting ? '导出中…' : `导出 ${selected.size} 个 STL`}
          </button>
        </div>
      </div>
    </div>
  );
}
