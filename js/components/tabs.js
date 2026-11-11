/* Tabs with arrow-key navigation. render() returns the tablist; the page decides which panel to show. */
(function () {
  const App = (window.App = window.App || {});
  function render(tabs, active, key) {
    return `<div class="tabs" role="tablist" data-tabs="${key}">${tabs.map((t) => `<button type="button" class="tab" role="tab" id="tab-${key}-${t.id}" data-tab="${t.id}" aria-selected="${t.id === active}" tabindex="${t.id === active ? 0 : -1}" aria-controls="panel-${key}">${t.label}</button>`).join('')}</div>`;
  }
  // Call once on a stable container; handles clicks and arrow keys for any tablist inside it.
  function bind(container, onSelect) {
    container.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (b && container.contains(b)) onSelect(b.closest('[data-tabs]').dataset.tabs, b.dataset.tab);
    });
    container.addEventListener('keydown', (e) => {
      const b = e.target.closest('[role=tab]');
      if (!b || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      const all = [...b.closest('[role=tablist]').querySelectorAll('[role=tab]')];
      let i = all.indexOf(b);
      if (e.key === 'ArrowRight') i = (i + 1) % all.length;
      if (e.key === 'ArrowLeft') i = (i - 1 + all.length) % all.length;
      if (e.key === 'Home') i = 0;
      if (e.key === 'End') i = all.length - 1;
      e.preventDefault();
      all[i].focus();
      onSelect(b.closest('[data-tabs]').dataset.tabs, all[i].dataset.tab);
      setTimeout(() => {
        const n = container.querySelector(`#${all[i].id}`);
        n && n.focus();
      }, 0);
    });
  }
  App.tabs = { render, bind };
})();
