/**
 * KeycapStudio – File I/O for .kcs.json unified project files
 *
 * - Open / save `.kcs.json` files via the browser File API
 * - Autosave to localStorage (key: kcs_autosave_v1)
 */

import {
  serialiseKcsDocument,
  deserialiseKcsDocument,
} from '../model/kcsDocument.js';
import { triggerDownload, pickFile } from './browser.js';

export const KCS_AUTOSAVE_KEY = 'kcs_autosave_v1';

// ─── Browser file helpers ────────────────────────────────────────────────────

/**
 * Prompt the user to pick a `.kcs.json` file and return the parsed document.
 * @returns {Promise<object>}
 */
export async function openKcsFile() {
  const text = await pickFile('.kcs.json,.json');
  return deserialiseKcsDocument(text);
}

/**
 * Trigger a browser download of a KCS document as a `.kcs.json` file.
 * @param {object} doc
 * @param {string} [filename]
 */
export function saveKcsFile(doc, filename = 'project.kcs.json') {
  const blob = new Blob([serialiseKcsDocument(doc)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

// ─── Autosave ────────────────────────────────────────────────────────────────

/**
 * Write a KCS document to localStorage (autosave).
 * Uses requestIdleCallback when available to avoid blocking the main thread.
 * @param {object} doc
 */
export function writeKcsAutosave(doc) {
  const doWrite = () => {
    try {
      localStorage.setItem(KCS_AUTOSAVE_KEY, serialiseKcsDocument(doc));
    } catch (_) {
      // localStorage full or unavailable — silently ignore
    }
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(doWrite, { timeout: 2000 });
  } else {
    doWrite();
  }
}

/**
 * Clear the stored KCS autosave.
 */
export function clearKcsAutosave() {
  localStorage.removeItem(KCS_AUTOSAVE_KEY);
}

/**
 * Read any stored KCS autosave from localStorage.
 * Returns null if nothing is stored or the stored value is invalid.
 * @returns {object|null}
 */
export function readKcsAutosave() {
  try {
    const raw = localStorage.getItem(KCS_AUTOSAVE_KEY);
    if (!raw) return null;
    return deserialiseKcsDocument(raw);
  } catch (_) {
    return null;
  }
}

// ─── Periodic autosave timer ─────────────────────────────────────────────────

let _autosaveTimer = null;
const AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * Start the 30-second periodic autosave timer.
 * Calls `getDoc()` every 30 s and writes the result using writeKcsAutosave.
 * @param {() => object} getDoc  callback that returns the current KCS document
 */
export function startKcsAutosave(getDoc) {
  stopKcsAutosave();
  _autosaveTimer = setInterval(() => {
    writeKcsAutosave(getDoc());
  }, AUTOSAVE_INTERVAL_MS);
}

/** Stop the periodic autosave timer. */
export function stopKcsAutosave() {
  if (_autosaveTimer !== null) {
    clearInterval(_autosaveTimer);
    _autosaveTimer = null;
  }
}
