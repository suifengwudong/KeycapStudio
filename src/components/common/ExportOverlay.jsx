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

import React, { useState, useEffect } from 'react';

/** Parse "Step X/Y" from stage text and return a 0–1 fraction, or null. */
function parseProgress(stage) {
  const m = stage?.match(/Step\s+(\d+)\/(\d+)/i);
  if (!m) return null;
  const current = parseInt(m[1], 10);
  const total   = parseInt(m[2], 10);
  return total > 0 ? current / total : null;
}

/** Format integer seconds as "Xs" or "Xm YYs". */
function formatSeconds(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function ExportOverlay({
  open,
  title = 'Exporting…',
  stage = '',
  cancellable = false,
  onCancel,
}) {
  const [elapsed, setElapsed] = useState(0);

  // Reset and start elapsed-time counter whenever the overlay opens.
  useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }
    const startTime = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const progress = parseProgress(stage);

  // Estimate remaining time once we have enough data.
  // Require > 5% progress and ≥ 2 s elapsed to avoid wildly inaccurate early estimates.
  let estimatedRemaining = null;
  if (progress !== null && progress > 0.05 && elapsed >= 2) {
    const totalEstimate = elapsed / progress;
    estimatedRemaining = Math.max(0, Math.ceil(totalEstimate - elapsed));
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
      {/* Wider than before to comfortably fit the progress percentage label */}
      <div className="w-[360px] rounded-lg bg-gray-800 border border-gray-700 shadow-xl p-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {stage && <div className="mt-2 text-xs text-gray-300">{stage}</div>}

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          {progress !== null ? (
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          ) : (
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }} />
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="text-xs text-gray-400">
            {elapsed > 0 ? `Elapsed: ${formatSeconds(elapsed)}` : 'Please wait…'}
          </div>
          <span className="flex-1" />
          {estimatedRemaining !== null && (
            <div className="text-xs text-gray-400">~{formatSeconds(estimatedRemaining)} remaining</div>
          )}
          {progress !== null && (
            <div className="text-xs text-gray-400">{Math.round(progress * 100)}%</div>
          )}
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
