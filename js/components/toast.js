/* Toasts: success, warning, error, info. Auto-dismiss ~4 s, manual close, aria-live polite. */
(function () {
  const App = (window.App = window.App || {});
  const ICON = { success: 'check', error: 'alert', warning: 'alert', info: 'info' };

  // Shared exit helper (also used by modal and dropdown): adds .closing (CSS plays a short exit), then calls done on animationend
  // with a ~250ms fallback. Under prefers-reduced-motion, or if the element is gone, done runs immediately.
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  App.leave = function (el, done) {
    if (!el || !el.isConnected || reduced()) {
      done();
      return;
    }
    let finished = false;
    const end = (e) => {
      if (finished || (e && e.target !== el)) return;
      finished = true;
      el.removeEventListener('animationend', end);
      done();
    };
    el.classList.add('closing');
    el.addEventListener('animationend', end);
    setTimeout(end, 250);
  };

  function show(msg, type, action) {
    const host = document.getElementById('toasts');
    if (!host) return;
    type = type || 'info';
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${App.icon(ICON[type] || 'info')}<span class="toast-msg"></span>${action ? `<button type="button" class="toast-action">${action.label}</button>` : ''}<button type="button" aria-label="Dismiss notification">${App.icon('x')}</button>`;
    el.querySelector('.toast-msg').textContent = msg; // textContent: never inject raw text as HTML
    let gone = false;
    const close = () => {
      if (gone) return;
      gone = true;
      App.leave(el, () => el.remove());
    };
    if (action) el.querySelector('.toast-action').addEventListener('click', () => { action.onClick(); close(); });
    el.querySelector('[aria-label="Dismiss notification"]').addEventListener('click', close);
    host.appendChild(el);
    while (host.children.length > 4) host.firstChild.remove();
    setTimeout(close, 4000);
  }
  // Turn an action result into a toast.
  function fromResult(res) {
    if (!res) return;
    show(res.msg, res.type || (res.ok ? 'success' : 'error'));
    return res;
  }
  App.toast = { show, fromResult };
})();
