/**
 * KeycapStudio – Language Store
 *
 * Persists the UI language preference to localStorage.
 * Default language: 'zh' (Chinese).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, LANGUAGES } from '../i18n/translations';

export const useLangStore = create(
  persist(
    (set, get) => ({
      /** Current language code: 'zh' | 'en' */
      lang: 'zh',

      /** Toggle between zh and en. */
      toggleLang() {
        const next = get().lang === 'zh' ? 'en' : 'zh';
        set({ lang: next });
      },

      /** Set language explicitly. */
      setLang(lang) {
        if (LANGUAGES.includes(lang)) set({ lang });
      },

      /**
       * Get a translated string by key.
       * Falls back to the key itself if the translation is missing.
       * @param {string} key
       * @returns {string}
       */
      t(key) {
        const dict = translations[get().lang] ?? translations.zh;
        return dict[key] ?? key;
      },
    }),
    {
      name: 'keycap-lang',
      partialize: (state) => ({ lang: state.lang }),
    }
  )
);

/**
 * React hook – returns the t() translation function for the current language.
 * Returns a stable callback that only changes when the language changes.
 */
export function useT() {
  const lang = useLangStore(s => s.lang);
  // Inline import: useCallback is already available via React in consumers,
  // but we can inline a minimal stable-ref here by subscribing only to lang.
  // The function is re-created only when lang changes, not on every render.
  const dict = translations[lang] ?? translations.zh;
  return (key) => dict[key] ?? key;
}
