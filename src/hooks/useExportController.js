/**
 * useExportController – manages export lifecycle state.
 *
 * Returns { isExporting, stage, runExport } where:
 *   isExporting – true while an export is in flight
 *   stage       – current human-readable stage description
 *   runExport   – async wrapper; accepts a fn(setStage) that performs the work.
 *                 Prevents concurrent exports, always resets state on completion.
 */

import { useState, useCallback } from 'react';
import { showToast } from '../components/common/toast.js';

export function useExportController() {
  const [isExporting, setIsExporting] = useState(false);
  const [stage, setStage] = useState('');

  const runExport = useCallback(
    async (fn) => {
      if (isExporting) return;
      setIsExporting(true);
      setStage('');
      try {
        await fn(setStage);
      } catch (e) {
        showToast(e.message || 'Export failed', 'error');
      } finally {
        setIsExporting(false);
        setStage('');
      }
    },
    [isExporting],
  );

  return { isExporting, stage, runExport };
}
