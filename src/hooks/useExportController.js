/**
 * useExportController – manages export lifecycle state.
 *
 * Returns { isExporting, stage, error, runExport } where:
 *   isExporting – true while an export is in flight
 *   stage       – current human-readable stage description
 *   error       – last error message (null when idle / success)
 *   runExport   – async wrapper; accepts a task({ setStage }) and optional opts.
 *                 Prevents concurrent exports via lockRef + state.
 *                 Always resets state in finally; shows toast on success/failure.
 *
 * opts shape:
 *   initialStage       {string}   – stage text shown before task starts
 *   successMessage     {string}   – toast text on success (false to suppress)
 *   successToast       {boolean}  – set false to skip success toast
 *   errorMessageMapper {function} – (err) => string; humanises thrown errors
 */

import { useCallback, useRef, useState } from 'react';
import { showToast } from '../components/common/toast.js';

/** Yield one animation frame so the overlay/disabled state renders first. */
function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export function useExportController() {
  const [isExporting, setIsExporting] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);

  // lockRef prevents concurrent exports more reliably than reading stale state.
  const lockRef = useRef(false);

  const runExport = useCallback(async (task, opts = {}) => {
    if (lockRef.current) return;
    lockRef.current = true;

    setError(null);
    setStage(opts.initialStage ?? 'Preparing export…');
    setIsExporting(true);

    // Yield one frame so the overlay and disabled buttons render before heavy work.
    await nextFrame();

    try {
      await task({ setStage });

      if (opts.successToast !== false) {
        showToast(opts.successMessage ?? 'Export complete', 'success');
      }
    } catch (e) {
      const msg = opts.errorMessageMapper?.(e)
        ?? (e?.message ? `Export failed: ${e.message}` : 'Export failed');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
      lockRef.current = false;
      // Brief delay avoids stage text flickering away instantly.
      setTimeout(() => setStage(''), 150);
    }
  }, []);

  return { isExporting, stage, error, runExport };
}
