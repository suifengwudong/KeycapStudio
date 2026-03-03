/**
 * Cherry MX 固定几何参数（单位：mm）
 * 基于 Cherry MX 轴座规格与 Cherry Profile 键帽工业标准测量值
 * 1单位（1u）中心距为 19.05mm（3/4 inch），键帽底面留 0.85mm 碰撞间隙
 */

// 1u 底面尺寸（所有 Cherry 键帽的基准单位，单位 mm）
// 工业标准：18.2mm × 18.2mm，预留 0.85mm 碰撞间隙（总间隙：19.05 - 18.2 = 0.85mm，即每侧 0.425mm）
export const KEYCAP_1U_WIDTH = 18.2;    // 1u 键底面宽度（X 方向）
export const KEYCAP_1U_DEPTH = 18.2;    // 1u 键底面深度（Z 方向）

// 键帽顶部尺寸（Cherry Profile 1u 标准值）
export const CHERRY_TOP_WIDTH = 12.7;   // 1u 顶面宽度
export const CHERRY_TOP_DEPTH = 12.7;   // 1u 顶面深度
export const CHERRY_DISH_DEPTH = 0.6;   // 顶部柱面内凹最大深度（工业标准 0.5–0.8mm，取中间值）

// Cherry MX 十字轴孔（stem hole）
// 十字槽水平长 4.10mm（补偿 3D 打印胀大 +/-0.05mm），竖向宽 1.25mm（预留 0.08mm 公差防爆轴）
export const CHERRY_CROSS_SIZE  = 4.10; // 十字槽长度（含公差）
export const CHERRY_CROSS_THICK = 1.25; // 十字槽宽度
export const CHERRY_STEM_DEPTH  = 4.5;  // 十字孔深度

// 法线平滑阈值
export const CHERRY_SMOOTH_ANGLE = 35;  // 平滑法线角度阈值（度）

// 顶部柱面碟形曲线指数（exponent=2 对应抛物线，最接近 R80–R100mm 圆柱面近似）
export const CHERRY_DISH_EXPONENT = 2.0;

/**
 * Cherry Profile 分行高度与坡角（Row-based sculpted profile）
 * R4 = Esc / 数字行，R3 = QWERTY 行，R2 = ASDF 行，R1 = Shift / 空格行
 * height：从底面到顶面凹陷中心的高度（mm）
 * angle：顶面相对水平面的仰角（度，正值向后仰，负值向前倾）
 */
export const CHERRY_STANDARDS = {
  R4: { height: 12.5, angle: 11 },  // Esc, F1–F12, 数字行
  R3: { height: 11.2, angle:  7 },  // QWERTY 行（默认行）
  R2: { height:  9.5, angle:  0 },  // ASDF 行（顶面水平）
  R1: { height: 10.8, angle: -8 },  // ZXCV / 空格行
};

/**
 * Cherry MX 轴柱参数（结构化对象，与上方独立常量保持一致）
 * CROSS_X：十字槽水平长度，CROSS_Y：十字槽垂直宽度
 * TOTAL_DEPTH：轴柱总深度，CLEARANCE：单侧公差
 */
export const CHERRY_STEM = {
  CROSS_X:     4.10,  // 与 CHERRY_CROSS_SIZE 保持一致
  CROSS_Y:     1.25,  // 与 CHERRY_CROSS_THICK 保持一致
  TOTAL_DEPTH: 4.5,   // 与 CHERRY_STEM_DEPTH 保持一致
  CLEARANCE:   0.05,  // 单侧打印公差（mm）
};

/**
 * Compute the top-face dimensions for any Cherry-profile key size.
 *
 * Cherry keycaps taper uniformly from bottom to top.  The 1u base ratio is
 * CHERRY_TOP_WIDTH / KEYCAP_1U_WIDTH = 12.7 / 18.2 ≈ 0.6978.  All larger key
 * widths scale by the same ratio.  For standard keys the depth is always
 * 18.2 mm so topDepth is always 12.7 mm; ISO-Enter (depth=27.3 mm) gets a
 * proportionally deeper top face.
 *
 * Pure math – no THREE.js dependency; safe to import in tests.
 *
 * @param {number} bottomWidth  – key bottom width (mm)
 * @param {number} bottomDepth  – key bottom depth (mm)
 * @returns {{ topWidth: number, topDepth: number }}
 */
export function computeTopDimensions(bottomWidth, bottomDepth) {
  const taper = CHERRY_TOP_WIDTH / KEYCAP_1U_WIDTH;  // ≈ 0.6978
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
 *   sag = pow(|z| / halfTopDepth, 2.0) × dishDepth
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
