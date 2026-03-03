/**
 * Cherry MX 固定几何参数（单位：mm）
 * 基于 Cherry MX 轴座规格与 Cherry Profile 键帽标准测量值
 */

// 键帽顶部尺寸（Cherry Profile 标准）
export const CHERRY_TOP_WIDTH = 12.7;   // 顶面宽度
export const CHERRY_TOP_DEPTH = 12.7;   // 顶面深度（1u 方形）
export const CHERRY_DISH_DEPTH = 1.2;   // 顶部球面内凹最大深度

// Cherry MX 十字轴孔（stem hole）
export const CHERRY_CROSS_SIZE  = 4.15; // 十字槽长度（含公差）
export const CHERRY_CROSS_THICK = 1.35; // 十字槽宽度
export const CHERRY_STEM_DEPTH  = 4.0;  // 十字孔深度

// 法线平滑阈值
export const CHERRY_SMOOTH_ANGLE = 35;  // 平滑法线角度阈值（度）

// 顶部球面碟形曲线指数（抛物线形状控制参数）
export const CHERRY_DISH_EXPONENT = 2.2;

/**
 * Returns the Y coordinate of the keycap top surface at horizontal position (x, z).
 *
 * The keycap top is a paraboloid-like concave dish.  At the centre (x=0, z=0)
 * the surface sits at Y = keycapHeight (zero sag).  Toward the edges the
 * surface dips by up to dishDepth millimetres.
 *
 * The formula mirrors the deformation applied in
 * OptimizedKeycapGenerator._applyKeycapDeformation at normalizedY = 1
 * (topFactor = 1):
 *   sag = pow(dist / maxDim, 2.2) × dishDepth
 *
 * Pure math – no THREE.js dependency; safe to import in tests.
 *
 * @param {number} x            – horizontal X position (mm)
 * @param {number} z            – horizontal Z position (mm)
 * @param {number} keycapHeight – full keycap height (mm)
 * @param {number} dishDepth    – dish concavity depth (mm)
 * @param {number} [topWidth]   – keycap top surface width (mm); default CHERRY_TOP_WIDTH
 * @param {number} [topDepth]   – keycap top surface depth (mm); default CHERRY_TOP_DEPTH
 * @returns {number} Y coordinate of the keycap top surface at (x, z)
 */
export function topSurfaceY(
  x, z, keycapHeight, dishDepth,
  topWidth  = CHERRY_TOP_WIDTH,
  topDepth  = CHERRY_TOP_DEPTH,
) {
  const maxDim = Math.max(topWidth, topDepth) / 2;
  const dist   = Math.sqrt(x * x + z * z);
  const nd     = Math.min(dist / maxDim, 1.0);
  return keycapHeight - Math.pow(nd, CHERRY_DISH_EXPONENT) * dishDepth;
}
