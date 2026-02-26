/**
 * KeycapStudio – lightweight DOM-based toast notifications.
 *
 * Usage: showToast('Exported 1u_Esc.stl')
 *        showToast('Export failed: CSG error', 'error')
 */

const BG = { success: '#166534', error: '#991b1b', warning: '#92400e' };

/**
 * Display a small transient toast message.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'} [type='success']
 * @param {number} [durationMs=3500]
 */
export function showToast(message, type = 'success', durationMs = 3500) {
  const el = document.createElement('div');
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: BG[type] ?? BG.success,
    color: '#fff',
    padding: '8px 18px',
    borderRadius: '6px',
    fontSize: '13px',
    zIndex: '10000',
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    maxWidth: '420px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
  });
  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, durationMs);
}
