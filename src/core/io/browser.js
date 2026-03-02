/**
 * KeycapStudio – Browser I/O utilities
 *
 * Shared helpers for triggering file downloads and opening file-picker dialogs.
 * These DOM interactions appear in multiple IO and export modules; centralising
 * them here eliminates the duplication and makes the helpers easier to test.
 */

/**
 * Trigger a browser download for the given Blob.
 *
 * Creates a temporary `<a>` element, clicks it programmatically, then frees
 * the object URL.  Works in all modern browsers without appending to the DOM.
 *
 * @param {Blob}   blob
 * @param {string} filename
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open the browser's native file-picker dialog and return the raw text of
 * the selected file.  Rejects with `Error('No file selected')` if the user
 * cancels.
 *
 * @param {string} accept  – `<input accept>` value, e.g. `'.kcs.json,.json'`
 * @returns {Promise<string>}  raw file text
 */
export function pickFile(accept) {
  return new Promise((resolve, reject) => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      try {
        resolve(await file.text());
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
