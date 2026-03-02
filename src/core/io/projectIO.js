/**
 * KeycapStudio V1 – File I/O + Autosave
 *
 * - Open / save .keycap project files via browser File API
 * - Autosave to localStorage every AUTOSAVE_INTERVAL_MS
 * - On app launch, if a stored autosave exists, return it so the caller
 *   can offer crash-recovery
 */

import { serialiseProject, deserialiseProject } from '../model/projectModel.js';
import { triggerDownload, pickFile } from './browser.js';

const AUTOSAVE_KEY = 'keycap-studio-autosave';
const AUTOSAVE_INTERVAL_MS = 30_000; // 30 s

// ---------- browser file helpers ----------

/**
 * Prompt the user to pick a .keycap file and return the parsed project.
 * @returns {Promise<object>}
 */
export async function openProjectFile() {
  const text = await pickFile('.keycap,application/json');
  return deserialiseProject(text);
}

/**
 * Trigger a browser download of the current project as a .keycap file.
 * @param {object} project
 * @param {string} [filename]
 */
export function saveProjectFile(project, filename = 'project.keycap') {
  const blob = new Blob([serialiseProject(project)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

// ---------- autosave ----------

let _autosaveTimer = null;

/**
 * Write the current project to localStorage (autosave).
 * @param {object} project
 */
export function writeAutosave(project) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serialiseProject(project));
  } catch (_) {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Clear the stored autosave (call after a successful explicit save).
 */
export function clearAutosave() {
  localStorage.removeItem(AUTOSAVE_KEY);
}

/**
 * Read any stored autosave from localStorage.
 * Returns null if nothing is stored or the stored value is invalid.
 * @returns {object|null}
 */
export function readAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return deserialiseProject(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Start the periodic autosave timer.
 * Calls `getProject()` every AUTOSAVE_INTERVAL_MS and writes the result.
 * @param {() => object} getProject  callback that returns the current project
 */
export function startAutosave(getProject) {
  stopAutosave();
  _autosaveTimer = setInterval(() => {
    writeAutosave(getProject());
  }, AUTOSAVE_INTERVAL_MS);
}

/** Stop the periodic autosave timer. */
export function stopAutosave() {
  if (_autosaveTimer !== null) {
    clearInterval(_autosaveTimer);
    _autosaveTimer = null;
  }
}
