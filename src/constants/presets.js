/**
 * KeycapStudio – Built-in keycap preset configurations
 *
 * Each preset is a named starting point that builds a complete KCS document.
 * Users can pick one from the Presets Gallery and immediately begin editing.
 */

import { mapSizeToPreset } from '../core/model/sizeMapping.js';

/**
 * Build a complete KCS document from a preset descriptor.
 * @param {object} preset
 * @returns {object} valid KCS document
 */
export function buildPresetKcs(preset) {
  const size2d = mapSizeToPreset(preset.size) ?? '1u';
  return {
    format  : 'kcs',
    version : 1,
    asset   : { name: preset.name },
    shape3d : {
      engine: 'keycap-param-v1',
      params: {
        profile      : preset.profile ?? 'Cherry',
        size         : preset.size    ?? '1u',
        color        : preset.color   ?? '#2c2c2c',
        hasStem      : preset.hasStem ?? true,
        topRadius    : 0.5,
        wallThickness: 1.5,
        height       : null,
        dishDepth    : null,
        embossEnabled: !!(preset.embossText),
        embossText   : preset.embossText ?? '',
        embossFontSize: 5,
        embossDepth  : 1.0,
      },
    },
    legend2d: {
      keycap: {
        preset          : size2d,
        bgColor         : preset.color ?? '#2c2c2c',
        outlineEnabled  : true,
        outlineColor    : '#1a1a1a',
        outlineThickness: 2,
      },
      legends: {
        main: {
          enabled : !!preset.label,
          text    : preset.label ?? '',
          x: 0, y: 0,
          font    : 'Arial',
          fontSize: 24,
          color   : '#ffffff',
        },
        topLeft    : { enabled: false, text: '', x: -0.28, y: -0.28, font: 'Arial', fontSize: 11, color: '#cccccc' },
        bottomRight: { enabled: false, text: '', x:  0.28, y:  0.28, font: 'Arial', fontSize: 11, color: '#cccccc' },
        left       : { enabled: false, text: '', x: -0.3,  y:  0,    font: 'Arial', fontSize: 11, color: '#cccccc' },
      },
    },
    uiContext: { mode: '3d', selectedLegend: 'main' },
  };
}

/**
 * Common keycap presets for quick-start editing.
 * Grouped into categories for display in the Presets Gallery.
 */
export const KEYCAP_PRESETS = [
  // ── Alpha ─────────────────────────────────────────────────────────────────
  {
    id        : 'alpha-1u',
    name      : '字母键 (1u)',
    category  : 'alpha',
    size      : '1u',
    color     : '#2c2c2c',
    label     : 'A',
    embossText: 'A',
  },

  // ── Modifier ──────────────────────────────────────────────────────────────
  {
    id        : 'mod-escape',
    name      : 'Escape',
    category  : 'modifier',
    size      : '1u',
    color     : '#1a1a2e',
    label     : 'Esc',
    embossText: 'Esc',
  },
  {
    id        : 'mod-tab',
    name      : 'Tab (1.5u)',
    category  : 'modifier',
    size      : '1.5u',
    color     : '#16213e',
    label     : 'Tab',
    embossText: 'Tab',
  },
  {
    id        : 'mod-caps',
    name      : 'CapsLock (1.75u)',
    category  : 'modifier',
    size      : '1.75u',
    color     : '#0f3460',
    label     : 'Caps',
    embossText: 'Caps',
  },
  {
    id        : 'mod-backspace',
    name      : 'Backspace (2u)',
    category  : 'modifier',
    size      : '2u',
    color     : '#16213e',
    label     : '⌫',
    embossText: '',
  },
  {
    id        : 'mod-enter-ansi',
    name      : 'Enter ANSI (2.25u)',
    category  : 'modifier',
    size      : '2.25u',
    color     : '#533483',
    label     : 'Enter',
    embossText: '',
  },
  {
    id        : 'mod-shift-l',
    name      : 'Left Shift (2.25u)',
    category  : 'modifier',
    size      : '2.25u',
    color     : '#1a1a2e',
    label     : 'Shift',
    embossText: '',
  },
  {
    id        : 'mod-ctrl',
    name      : 'Ctrl (1.25u)',
    category  : 'modifier',
    size      : '1.25u',
    color     : '#1a1a2e',
    label     : 'Ctrl',
    embossText: 'Ctrl',
  },

  // ── ISO Enter ─────────────────────────────────────────────────────────────
  {
    id        : 'iso-enter',
    name      : 'ISO Enter',
    category  : 'iso',
    size      : 'ISO-Enter',
    color     : '#533483',
    label     : '↵',
    embossText: '',
  },

  // ── Space ─────────────────────────────────────────────────────────────────
  {
    id        : 'space-6-25u',
    name      : '空格键 (6.25u)',
    category  : 'modifier',
    size      : '6.25u',
    color     : '#1a1a2e',
    label     : '',
    embossText: '',
    hasStem   : true,
  },
];

/** Human-readable category labels. */
export const PRESET_CATEGORY_LABELS = {
  alpha   : '字母键',
  modifier: '功能键',
  iso     : 'ISO 键',
};
