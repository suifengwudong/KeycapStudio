/**
 * KeycapInspector – dedicated editor for KeycapTemplate scene nodes.
 *
 * Parameters exposed:
 *   - Profile         (Cherry / SA / DSA / OEM)
 *   - Size            (1u, 1.25u, …)
 *   - Color
 *   - Top Radius      (0.1–3.0 mm)
 *   - Wall Thickness  (0.8–3.5 mm)
 *   - Cherry MX stem  (checkbox)
 *   - Height override (6–20 mm, Auto by default)
 *   - Dish Depth      (0–3.0 mm, controls top-surface concavity)
 *   - Text Emboss     (enabled, text, font size, depth) – 字的浮雕
 */

import React from 'react';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';
import { CHERRY_DISH_DEPTH } from '../../constants/cherry';
import Slider from '../common/Slider';
import ColorPicker from '../common/ColorPicker';
import { useT } from '../../store/langStore';

export default function KeycapInspector({ node, onUpdate }) {
  const t    = useT();
  const p    = node.params ?? {};
  const setP = (key, val) => onUpdate({ params: { ...p, [key]: val } });

  // Resolve the effective height so sliders always have a meaningful value.
  const profileData    = PROFILES[p.profile] ?? PROFILES['Cherry'];
  const resolvedHeight = p.height != null ? p.height : profileData.baseHeight;
  const resolvedDish   = p.dishDepth != null ? p.dishDepth : CHERRY_DISH_DEPTH;

  return (
    <>
      {/* ── Profile ──────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">{t('profile')}</label>
        <select
          value={p.profile ?? 'Cherry'}
          onChange={e => setP('profile', e.target.value)}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700"
        >
          {Object.keys(PROFILES).map(k => (
            <option key={k} value={k}>{PROFILES[k].name}</option>
          ))}
        </select>
      </div>

      {/* ── Size ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">{t('size')}</label>
        <select
          value={p.size ?? '1u'}
          onChange={e => setP('size', e.target.value)}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700"
        >
          {Object.keys(KEYCAP_SIZES).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* ── Color ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">{t('color')}</label>
        <ColorPicker value={p.color ?? '#c8dff0'} onChange={c => setP('color', c)} />
      </div>

      {/* ── Top Radius ───────────────────────────────────────────── */}
      <Slider
        label={t('topRadius')}
        min={0.1} max={3.0} step={0.1}
        value={p.topRadius ?? 0.5}
        onChange={v => setP('topRadius', v)}
        unit="mm"
      />

      {/* ── Wall Thickness ───────────────────────────────────────── */}
      <Slider
        label={t('wallThickness')}
        min={0.8} max={3.5} step={0.1}
        value={p.wallThickness ?? 1.5}
        onChange={v => setP('wallThickness', v)}
        unit="mm"
      />

      {/* ── Height override ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-400">{t('height')}</label>
          {p.height != null && (
            <button
              className="text-xs text-blue-400 hover:text-blue-300 leading-none"
              title={t('heightAuto')}
              onClick={() => setP('height', null)}
            >
              {t('heightAuto')}
            </button>
          )}
        </div>
        <input
          type="number"
          min={6} max={20} step={0.1}
          value={resolvedHeight}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) setP('height', Math.max(6, Math.min(20, v)));
          }}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        {p.height == null && (
          <div className="text-xs text-gray-600 mt-0.5">
            {t('heightAutoNote').replace('{h}', profileData.baseHeight)}
          </div>
        )}
      </div>

      {/* ── Dish Depth ───────────────────────────────────────────── */}
      <Slider
        label={t('dishDepth')}
        min={0} max={3.0} step={0.1}
        value={resolvedDish}
        onChange={v => setP('dishDepth', v)}
        unit="mm"
      />

      {/* ── Cherry MX Stem ───────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <input
          id={`ks-hasStem-${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
          type="checkbox"
          checked={p.hasStem ?? true}
          onChange={e => setP('hasStem', e.target.checked)}
          className="accent-blue-500"
        />
        <label htmlFor={`ks-hasStem-${node.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`} className="text-xs text-gray-300 cursor-pointer">
          {t('stemHole')}
        </label>
      </div>

      {/* ── Text Emboss (字的浮雕) ────────────────────────────────── */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('embossTitle')}</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={p.embossEnabled ?? false}
              onChange={e => setP('embossEnabled', e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-xs text-gray-300">{t('embossEnable')}</span>
          </label>
        </div>

        {p.embossEnabled && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('embossTextLabel')}</label>
              <input
                type="text"
                maxLength={6}
                value={p.embossText ?? ''}
                onChange={e => setP('embossText', e.target.value)}
                placeholder={t('embossTextPlaceholder')}
                className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <Slider
              label={t('embossFontSize')}
              min={2} max={10} step={0.5}
              value={p.embossFontSize ?? 5}
              onChange={v => setP('embossFontSize', v)}
              unit="mm"
            />

            <Slider
              label={t('embossDepth')}
              min={0.1} max={2.0} step={0.1}
              value={p.embossDepth ?? 1.0}
              onChange={v => setP('embossDepth', v)}
              unit="mm"
            />

            {/* Emboss text color */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('embossColor')}</label>
              <ColorPicker value={p.embossColor ?? '#222222'} onChange={c => setP('embossColor', c)} />
            </div>

            {/* Recommended parameter hints */}
            <div className="bg-gray-900/60 rounded p-2 text-xs text-gray-500 space-y-0.5">
              <div className="text-gray-400 font-medium mb-1">{t('embossHintTitle')}</div>
              <div>{t('embossHintFDM')}</div>
              <div>{t('embossHintVisual')}</div>
              <div>{t('embossHintFont')}</div>
              <div className="text-green-600 mt-1">{t('embossHintVisible')}</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

