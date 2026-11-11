/* Dropdown manager for topbar menus. Panels are rendered when opened (and refreshed if the store changes while open). */
(function () {
  const App = (window.App = window.App || {});
  const reg = {};
  let openId = null;

  function panelOf(id) {
    return document.getElementById(`dd-${id}`);
  }
  function btnOf(id) {
    return document.querySelector(`[data-dd="${id}"]`);
  }
  function register(id, render, after) {
    reg[id] = { render, after };
  }
  function fill(id) {
    const p = panelOf(id);
    if (p && reg[id]) {
      p.innerHTML = reg[id].render();
      reg[id].after && reg[id].after(p);
    }
  }
  function close() {
    if (!openId) return;
    const p = panelOf(openId),
      b = btnOf(openId);
    if (p && !p.hidden) {
      const tok = (p._leave = {});
      App.leave(p, () => {
        if (p._leave !== tok) return;
        p.hidden = true;
        p.classList.remove('closing');
      });
    }
    if (b) b.setAttribute('aria-expanded', 'false');
    openId = null;
  }
  function open(id) {
    close();
    const p = panelOf(id),
      b = btnOf(id);
    if (!p || !reg[id]) return;
    fill(id);
    p._leave = null;
    p.classList.remove('closing');
    p.hidden = false;
    openId = id;
    if (b) b.setAttribute('aria-expanded', 'true');
    const f = p.querySelector('button,a,input,select');
    if (f) f.focus();
  }
  function toggle(id) {
    if (openId === id) {
      close();
      const b = btnOf(id);
      b && b.focus();
    } else open(id);
  }
  function refresh() {
    if (openId) fill(openId);
  }

  function closeSelectMenus(except) {
    document.querySelectorAll('.app-select-menu:not([hidden])').forEach((menu) => {
      if (!except || !menu.closest('.app-select')?.contains(except)) {
        menu.hidden = true;
        const trigger = menu.previousElementSibling;
        trigger && trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function init() {
    document.addEventListener('click', (e) => {
      const select = e.target.closest('.app-select');
      closeSelectMenus(select ? e.target : null);
      const t = e.target.closest('[data-dd]');
      if (t) {
        e.preventDefault();
        if (t.dataset.dd === 'notif' && window.matchMedia && window.matchMedia('(max-width: 479px)').matches) {
          window.location.hash = '#/notifications';
          return;
        }
        toggle(t.dataset.dd);
        return;
      }
      if (openId && !e.target.closest('.dd-panel')) close();
      else if (openId && e.target.closest('.dd-panel [data-dd-close],.dd-panel a')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openId && !App.modal.isOpen()) {
        const b = btnOf(openId);
        close();
        b && b.focus();
      }
    });
    enhanceSelects(document);
    const appRoot = document.getElementById('app-shell') || document.body;
    if (window.MutationObserver) new MutationObserver(() => enhanceSelects(appRoot)).observe(appRoot, {childList: true, subtree: true});
  }
  function enhanceSelects(root) {
    root.querySelectorAll('select.select:not([data-enhanced]), select[data-an]:not([data-enhanced]), select[data-au]:not([data-enhanced]), select[data-rp]:not([data-enhanced]), select[data-f]:not([data-enhanced]), select[data-uf]:not([data-enhanced]), select[data-rm]:not([data-enhanced]), select[data-cal-loc]:not([data-enhanced]), select[data-pref]:not([data-enhanced])').forEach((select) => {
      if (select.closest('.lg-shell') || select.disabled) return;
      const wrap = document.createElement('div');
      wrap.className = 'app-select';
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(select);
      select.dataset.enhanced = 'true';
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'app-select-trigger';
      if (select.dataset.settingsSection !== undefined) button.dataset.settingsSection = '';
      button.setAttribute('aria-haspopup', 'listbox'); button.setAttribute('aria-expanded', 'false');
      const menu = document.createElement('div'); menu.className = 'app-select-menu'; menu.setAttribute('role', 'listbox'); menu.hidden = true;
      wrap.append(button, menu);
      const rebuild = () => {
        button.textContent = select.options[select.selectedIndex]?.text || '';
        menu.innerHTML = '';
        [...select.options].forEach((option) => {
          const item = document.createElement('button'); item.type = 'button'; item.className = 'app-select-option'; item.textContent = option.text; item.dataset.value = option.value;
          if (select.dataset.settingsSection !== undefined) item.dataset.settingsSection = option.value;
          item.setAttribute('role', 'option'); item.setAttribute('aria-selected', String(option.selected)); item.disabled = option.disabled;
          item.addEventListener('click', () => { select.value = option.value; select.dispatchEvent(new Event('change', {bubbles: true})); if (select.dataset.settingsSection !== undefined) select.dispatchEvent(new CustomEvent('settings-section-change', {bubbles: true, detail: {value: option.value}})); closeMenu(); rebuild(); });
          menu.appendChild(item);
        });
      };
      const closeMenu = () => { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        // Only one custom select may be open at a time. Use the shared
        // closer so the previous trigger's aria-expanded state is reset too.
        const wasOpen = !menu.hidden;
        closeSelectMenus();
        menu.hidden = wasOpen;
        button.setAttribute('aria-expanded', String(!menu.hidden));
      });
      select.addEventListener('change', rebuild);
      rebuild();
    });
  }
  App.dropdown = { register, open, close, toggle, refresh, init, enhanceSelects, isOpen: () => openId };
})();
