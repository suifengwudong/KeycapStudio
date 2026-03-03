/**
 * Cherry MX 固定几何参数（单位：mm）
 * 基于 Cherry MX 轴座规格与 Cherry Profile 键帽标准测量值
 */

// 1u 底面尺寸（所有 Cherry 键帽的基准单位，单位 mm）
export const KEYCAP_1U_WIDTH = 18;      // 1u 键底面宽度（X 方向）
export const KEYCAP_1U_DEPTH = 18;      // 1u 键底面深度（Z 方向）

// 键帽顶部尺寸（Cherry Profile 1u 标准值）
export const CHERRY_TOP_WIDTH = 12.7;   // 1u 顶面宽度
export const CHERRY_TOP_DEPTH = 12.7;   // 1u 顶面深度
export const CHERRY_DISH_DEPTH = 1.2;   // 顶部柱面内凹最大深度

// Cherry MX 十字轴孔（stem hole）
export const CHERRY_CROSS_SIZE  = 4.15; // 十字槽长度（含公差）
export const CHERRY_CROSS_THICK = 1.35; // 十字槽宽度
export const CHERRY_STEM_DEPTH  = 4.0;  // 十字孔深度

// 法线平滑阈值
export const CHERRY_SMOOTH_ANGLE = 35;  // 平滑法线角度阈值（度）

// 顶部球面碟形曲线指数（抛物线形状控制参数）
export const CHERRY_DISH_EXPONENT = 2.2;

/**
 * Compute the top-face dimensions for any Cherry-profile key size.
 *
 * Cherry keycaps taper uniformly from bottom to top.  The 1u base ratio is
 * CHERRY_TOP_WIDTH / KEYCAP_1U_WIDTH = 12.7 / 18 ≈ 0.7056.  All larger key
 * widths scale by the same ratio.  For standard keys the depth is always
 * 18 mm so topDepth is always 12.7 mm; ISO-Enter (depth=27 mm) gets a
 * proportionally deeper top face.
 *
 * Pure math – no THREE.js dependency; safe to import in tests.
 *
 * @param {number} bottomWidth  – key bottom width (mm)
 * @param {number} bottomDepth  – key bottom depth (mm)
 * @returns {{ topWidth: number, topDepth: number }}
 */
export function computeTopDimensions(bottomWidth, bottomDepth) {
  const taper = CHERRY_TOP_WIDTH / KEYCAP_1U_WIDTH;  // ≈ 0.7056
  return {
    topWidth : bottomWidth * taper,
    topDepth : bottomDepth * taper,
  };
}

/**
 * Returns the Y coordinate of the keycap top surface at horizontal position (x, z).
 *
 * Cherry profile uses a **cylindrical** dish – the concavity runs front-to-back
 * (Z axis only).  The X (left-right) direction is flat, matching real Cherry MX
 * keycap geometry.  Wide keys like the spacebar therefore curve only in Z, not
 * in their long X direction.
 *
 * At the centre (z=0) the surface sits at Y = keycapHeight (zero sag).  Toward
 * the front and back edges (z = ±topDepth/2) the surface dips by dishDepth mm.
 *
 * The formula mirrors the deformation applied in
 * OptimizedKeycapGenerator._applyKeycapDeformation at normalizedY = 1
 * (topFactor = 1):
 *   sag = pow(|z| / halfTopDepth, 2.2) × dishDepth
 *
 * Pure math – no THREE.js dependency; safe to import in tests.
 *
 * @param {number} x            – horizontal X position (mm) – unused (flat in X)
 * @param {number} z            – horizontal Z position (mm)
 * @param {number} keycapHeight – full keycap height (mm)
 * @param {number} dishDepth    – dish concavity depth (mm)
 * @param {number} [topWidth]   – keycap top surface width (mm); accepted for API
 *                                compatibility but does not affect the result
 * @param {number} [topDepth]   – keycap top surface depth (mm); default CHERRY_TOP_DEPTH
 * @returns {number} Y coordinate of the keycap top surface at (x, z)
 */
export function topSurfaceY(
  x, z, keycapHeight, dishDepth,
  topWidth  = CHERRY_TOP_WIDTH,   // kept for API compatibility; not used in cylindrical dish
  topDepth  = CHERRY_TOP_DEPTH,
) {
  const halfDepth = topDepth / 2;
  const nz        = Math.min(Math.abs(z) / halfDepth, 1.0);
  return keycapHeight - Math.pow(nz, CHERRY_DISH_EXPONENT) * dishDepth;
}
