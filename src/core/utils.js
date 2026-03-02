/**
 * KeycapStudio – Shared pure utilities
 *
 * Small helper functions that are used by multiple modules across the project.
 * All functions here are pure (no DOM, no side-effects) so they are trivially
 * testable and safe to import anywhere, including Web Workers.
 */

/**
 * Deep-clone a plain-data object via JSON round-trip.
 *
 * Sufficient for all project/asset/scene objects that contain only JSON-safe
 * values (strings, numbers, booleans, null, plain arrays and objects).
 *
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
