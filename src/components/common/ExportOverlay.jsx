/**
 * ExportOverlay – fixed full-screen overlay that blocks interaction
 * while an export is in progress.
 *
 * Props:
 *   open        {boolean}  – whether the overlay is visible
 *   title       {string}   – headline shown inside the card
 *   stage       {string}   – current stage description (e.g. "Step 1/3…")
 *   cancellable {boolean}  – show a Cancel button (default false)
 *   onCancel    {function} – called when Cancel is clicked
 */

import React from 'react';

export default function ExportOverlay({
  open,
  title = 'Exporting…',
  stage = '',
  cancellable = false,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
      <div className="w-[340px] rounded-lg bg-gray-800 border border-gray-700 shadow-xl p-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {stage && <div className="mt-2 text-xs text-gray-300">{stage}</div>}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <div className="text-xs text-gray-400">Please wait…</div>
          <span className="flex-1" />
          {cancellable && (
            <button
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-100"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
