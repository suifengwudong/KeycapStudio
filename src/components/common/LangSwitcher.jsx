/**
 * LangSwitcher – toggles between Chinese (zh) and English (en).
 *
 * Renders a compact pill button: "中" (active) / "EN" or vice versa.
 * Designed to sit in the main toolbar header.
 */

import React from 'react';
import { useLangStore } from '../../store/langStore';

export default function LangSwitcher() {
  const lang       = useLangStore(s => s.lang);
  const toggleLang = useLangStore(s => s.toggleLang);

  return (
    <button
      onClick={toggleLang}
      title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
      className="px-2 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 select-none"
    >
      {lang === 'zh' ? '中 / EN' : 'EN / 中'}
    </button>
  );
}
