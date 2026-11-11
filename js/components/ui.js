/* Small shared UI builders: page header, empty/skeleton/error states, form fields, stat cards. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);

  const pageHead = (title, actions, sub) =>
    `<div class="page-head"><div class="grow"><h1 class="page-title" id="page-h1" tabindex="-1">${esc(title)}</h1>${sub ? `<p class="muted m-0">${sub}</p>` : ''}</div>${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
  // The one avatar: the profile picture, always a circle. Size comes from the CSS of the place it is used.
  const AVATAR_SRC = 'assets/profile-picture.png';
  const avatar = (cls) =>
    `<img class="avatar${cls ? ' ' + cls : ''}" src="${AVATAR_SRC}" alt="" aria-hidden="true" draggable="false">`;
  const empty = (icon, text, action) =>
    `<div class="empty">${App.icon(icon || 'info')}<p>${text}</p>${action || ''}</div>`;
  const skeleton = (rows) =>
    `<div aria-busy="true" aria-label="Loading"><div class="skeleton block"></div>${Array.from({ length: rows || 4 })
      .map(() => '<div class="skeleton"></div>')
      .join('')}</div>`;
  const errorState = (msg) =>
    `<div class="card empty" role="alert">${App.icon('alert')}<p><b>${esc(msg || 'Unable to process the request.')}</b></p><button type="button" class="btn" data-act="retry" data-testid="retry">${App.icon('refresh')}Retry</button></div>`;

  // Labelled form field with optional help text, error slot and required marker.
  function field(id, label, control, o) {
    o = o || {};
    return `<div class="field" data-field="${id}"><label for="${id}">${esc(label)}${o.required ? ' <span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span>' : ''}</label>${control}${o.help || o.counter ? `<div class="field-foot">${o.help ? `<div class="help" id="${id}-help">${o.help}</div>` : ''}${o.counter ? `<div class="counter" id="${id}-count" aria-live="off"></div>` : ''}</div>` : ''}<div class="err" id="${id}-err" role="alert">${App.icon('alert')} <span></span></div></div>`;
  }
  const options = (list, sel, placeholder) =>
    (placeholder != null ? `<option value="">${esc(placeholder)}</option>` : '') +
    list
      .map((o) => {
        const v = typeof o === 'object' ? o.value : o,
          l = typeof o === 'object' ? o.label : o;
        return `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`;
      })
      .join('');
  const locOptions = (sel, ph) =>
    options(
      App.metrics.activeLocations().map((l) => ({ value: l.id, label: `${l.name} (${l.id})` })),
      sel,
      ph === undefined ? 'Select location' : ph,
    );

  // Show / clear an inline error beside a field (linked with aria-describedby, announced via role=alert).
  function setError(root, id, msg) {
    const f = root.querySelector(`[data-field="${id}"]`);
    if (!f) return;
    f.classList.toggle('invalid', !!msg);
    const ctl = f.querySelector('input,select,textarea,[data-ctl]');
    if (ctl) {
      if (msg) {
        ctl.setAttribute('aria-invalid', 'true');
        ctl.setAttribute('aria-describedby', `${id}-err`);
      } else {
        ctl.removeAttribute('aria-invalid');
        ctl.removeAttribute('aria-describedby');
      }
    }
    const sp = f.querySelector('.err span');
    if (sp) sp.textContent = msg || '';
  }
  // Apply an errors object, and move focus to the first invalid field.
  function showErrors(root, errors, map) {
    root.querySelectorAll('[data-field]').forEach((f) => setError(root, f.dataset.field, ''));
    let first = null;
    Object.entries(errors || {}).forEach(([k, msg]) => {
      const id = (map && map[k]) || k;
      setError(root, id, msg);
      if (!first) {
        const f = root.querySelector(`[data-field="${id}"]`);
        first = f && (f.querySelector('input,select,textarea,button,[data-ctl]') || f);
      }
    });
    if (first && first.focus) first.focus();
  }

  function stat(label, num, icon, cls, href) {
    const tag = href ? `a href="#${href}"` : 'div';
    return `<${tag} class="card stat ${cls || ''}${href ? ' is-link' : ''}"><span class="stat-icon">${App.icon(icon)}</span><span class="stat-content"><span class="stat-label">${esc(label)}</span><span class="stat-num">${num}</span></span>${href ? '<span class="stat-arrow" aria-hidden="true">→</span>' : ''}</${href ? 'a' : 'div'}>`;
  }
  const banner = (cls, icon, html) =>
    `<div class="banner ${cls}" role="${cls === 'bad' ? 'alert' : 'note'}">${App.icon(icon)}<div class="grow">${html}</div></div>`;

  // Renders a table that turns into stacked cards on phones. cols: [{h, f(row), cls}]
  function table(cols, rows, o) {
    o = o || {};
    return `<div class="table-wrap"><table class="tbl tbl-responsive${o.tableClass ? ' ' + o.tableClass : ''}" ${o.testid ? `data-testid="${o.testid}"` : ''}><caption class="sr-only">${esc(o.caption || 'Data table')}</caption>
      <thead><tr>${cols.map((c) => `<th scope="col">${esc(c.h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td data-label="${esc(c.h)}" class="${c.cls || ''}"><span class="tbl-value">${c.f(r)}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  const backLink = (t) =>
    `<a class="back-link no-print" href="#${esc(t.path)}" data-testid="back-link">${App.icon('arrowleft')}<span>Back to ${esc(t.label)}</span></a>`;
  App.ui = {
    backLink,
    avatar,
    pageHead,
    empty,
    skeleton,
    errorState,
    field,
    options,
    locOptions,
    setError,
    showErrors,
    stat,
    banner,
    table,
  };
})();
