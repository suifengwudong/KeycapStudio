/**
 * KeycapStudio V1.1 – 3D size → 2D preset mapping
 *
 * Canonical single-direction mapping from `shape3d.params.size` enum values
 * to `legend2d.keycap.preset` keys.
 *
 * Rule (V1.1):
 *   - All sizes except ISO-Enter map one-to-one to the same-named 2D preset.
 *   - ISO-Enter maps to '2.25u' (rectangular approximation).
 */

/** Ordered enum of all valid 3D size values. */
export const SIZE_ENUM = [
  '1u',
  '1.25u',
  '1.5u',
  '1.75u',
  '2u',
  '2.25u',
  '6.25u',
  '7u',
  'ISO-Enter',
];

/**
 * Map from 3D size → 2D preset key.
 * ISO-Enter is approximated as '2.25u' (rectangular) in V1.1.
 */
export const SIZE_TO_PRESET = {
  '1u'       : '1u',
  '1.25u'    : '1.25u',
  '1.5u'     : '1.5u',
  '1.75u'    : '1.75u',
  '2u'       : '2u',
  '2.25u'    : '2.25u',
  '6.25u'    : '6.25u',
  '7u'       : '7u',
  'ISO-Enter': '2.25u',
};

/** UI notice shown when ISO-Enter is selected (rectangular approximation). */
export const ISO_ENTER_APPROX_LABEL = 'ISO Enter（矩形近似）';

/**
 * Returns the 2D preset key for a given 3D size string.
 * ISO-Enter is approximated as '2.25u'.
 * Returns null for unknown / unsupported sizes.
 *
 * @param {string} size – e.g. '1u', '2.25u', 'ISO-Enter'
 * @returns {string|null}
 */
export function mapSizeToPreset(size) {
  return SIZE_TO_PRESET[size] ?? null;
}
