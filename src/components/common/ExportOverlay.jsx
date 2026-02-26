/**
 * ExportOverlay – fixed full-screen overlay that blocks interaction
 * while an export is in progress.
 *
 * Props:
 *   open  {boolean} – whether the overlay is visible
 *   stage {string}  – current stage description (e.g. "Building geometry…")
 */

import React from 'react';

export default function ExportOverlay({ open, stage }) {
  if (!open) return null;
  return (
    <div
      style={{ zIndex: 9990 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center"
    >
      <div className="bg-gray-800 border border-gray-600 rounded-lg px-8 py-5 flex flex-col items-center gap-3 shadow-2xl">
        {/* Spinner */}
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-white text-sm font-medium">Exporting…</div>
        {stage && (
          <div className="text-gray-400 text-xs max-w-xs text-center">{stage}</div>
        )}
      </div>
    </div>
  );
}
