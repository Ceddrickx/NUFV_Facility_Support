/* ChartCard (Chart.js, vendored locally). NU palette only; colours are read from CSS variables (variables.css --chart-*) so charts follow the tokens.
   Every chart has a visible text summary; data tables are opt-in for pages that need them. responsive:true + maintainAspectRatio:false in a sized box. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const registry = {};
  let live = [];

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  // Every series colour comes from a CSS variable (variables.css), read when a chart is built. Getters keep the old App.chart.PAL / STATUS_COL API.
  const getters = (map) => {
    const o = {};
    Object.keys(map).forEach((k) => Object.defineProperty(o, k, { enumerable: true, get: () => css(map[k]) }));
    return o;
  };
  const PAL = getters({
    blue: '--primary',
    navy: '--primary-700',
    gold: '--accent',
    green: '--success',
    inprogress: '--in-progress',
    orange: '--warning',
    red: '--error',
    gray: '--chart-neutral',
    bar: '--chart-bar',
    barTop: '--chart-bar-top',
  });
  const STATUS_COL = getters({
    Pending: '--chart-pending',
    Assigned: '--chart-assigned',
    'In Progress': '--chart-inprogress',
    Resolved: '--chart-resolved',
    'Closed / Verified': '--chart-closed',
    Reopened: '--chart-reopened',
  });
  // Bar charts: one primary tint for every bar, the top item in full primary (no rainbow).
  const barColors = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? css('--chart-bar-top') : css('--chart-bar')));
  const BLUES = [];

  // cfg: { id, title, type, labels, values, colors?, summary, horizontal?, tall?, filter?, dataTable? }
  function card(cfg) {
    registry[cfg.id] = cfg;
    const total = cfg.values.reduce((a, b) => a + b, 0);
    const order = cfg.labels.map((_, i) => i);
    if (cfg.tableDesc) order.reverse();
    const rows = order
      .map((i) => `<tr><th scope="row">${esc(cfg.labels[i])}</th><td>${cfg.values[i]}</td></tr>`)
      .join('');
    const isPie = cfg.type === 'doughnut';
    const canvas = `<canvas data-chart="${cfg.id}" role="img" aria-label="${esc(cfg.title)}. ${esc(cfg.summary || '')}"></canvas>`;
    // Doughnuts use an HTML legend so the graph-to-legend gap is the same on every doughnut (a canvas legend sizes itself to its longest label).
    const legend = isPie
      ? `<ul class="pie-legend">${cfg.labels.map((l, i) => `<li><i style="background:${esc(cfg.colors && typeof cfg.colors[i] === 'string' && cfg.colors[i].startsWith('--') ? css(cfg.colors[i]) : cfg.colors ? cfg.colors[i] : '')}"></i>${esc(l)} (${cfg.values[i]})</li>`).join('')}</ul>`
      : '';
    return `<section class="card chart-card" aria-labelledby="ch-${cfg.id}-t" data-testid="chart-${cfg.id}">
      <div class="card-head"><h3 id="ch-${cfg.id}-t">${esc(cfg.title)}</h3>${cfg.filter || ''}</div>
      <div class="chart-box ${cfg.tall ? 'tall' : ''} ${isPie ? 'pie' : ''}">${isPie ? `<div class="pie-canvas">${canvas}</div>${legend}` : canvas}</div>
      <p class="small mt-2">${esc(cfg.summary || `${total} in total.`)}</p>
      ${cfg.dataTable === false ? '' : `<details class="data-table"><summary>View data table</summary><div class="data-table-scroll"><table class="tbl"><caption class="sr-only">${esc(cfg.title)}</caption><thead><tr><th scope="col">Item</th><th scope="col">Count</th></tr></thead><tbody>${rows}</tbody></table></div></details>`}
    </section>`;
  }

  function build(canvas) {
    const cfg = registry[canvas.dataset.chart];
    if (!cfg || !window.Chart) return;
    const text = css('--text'),
      grid = css('--border');
    const colors = cfg.colors
      ? cfg.colors.map((c) => (typeof c === 'string' && c.startsWith('--') ? css(c) : c))
      : barColors(cfg.labels.length);
    const isPie = cfg.type === 'doughnut';
    const isLine = cfg.type === 'line';
    const ds = {
      data: cfg.values,
      backgroundColor: isLine ? css('--chart-fill') : colors,
      borderColor: isLine ? css('--chart-line') : isPie ? css('--surface') : colors,
      borderWidth: isLine ? 3 : isPie ? 2 : 0,
      label: cfg.title,
      fill: isLine,
      tension: 0.3,
      pointRadius: isLine ? 3 : 0,
    };
    const opts = {
      font: { family: css('--font') || 'sans-serif', size: 12 },
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400 },
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    };
    if (!isPie) {
      opts.indexAxis = cfg.horizontal ? 'y' : 'x';
      const clip = function (v) {
        const l = String(this.getLabelForValue(v));
        return l.length > 22 ? l.slice(0, 21) + '\u2026' : l;
      };
      opts.scales = {
        x: {
          ticks: { color: text, padding: 2, maxRotation: 45, font: { size: 13, weight: '600' } },
          grid: { color: grid },
        },
        y: {
          beginAtZero: true,
          ticks: { color: text, padding: 2, precision: 0, font: { size: 13, weight: '600' } },
          grid: { color: grid },
        },
      };
      if (cfg.horizontal) {
        const align = cfg.labelAlign === 'right' ? 'right' : 'left';
        opts.scales.y.ticks.callback = clip;
        // Keep each chart's labels aligned to its reserved column edge.
        opts.scales.y.ticks.crossAlign = align === 'right' ? 'near' : 'far';
        opts.scales.y.ticks.textAlign = align;
        opts.scales.y.ticks.padding = align === 'right' ? 2 : 0;
      }
      else opts.scales.x.ticks.callback = clip;
      if (cfg.horizontal) opts.scales.x.beginAtZero = true;
    } else opts.cutout = '55%';
    const ch = new window.Chart(canvas, {
      type: cfg.type,
      data: { labels: cfg.labels, datasets: [ds] },
      options: opts,
    });
    live.push(ch);
  }
  // Create charts for every canvas inside el. Old instances are destroyed first (page re-render).
  function mount(el) {
    live = live.filter((c) => {
      if (!document.contains(c.canvas)) {
        c.destroy();
        return false;
      }
      return true;
    });
    el.querySelectorAll('canvas[data-chart]').forEach((cv) => {
      if (!live.some((c) => c.canvas === cv)) build(cv);
    });
  }
  function destroyAll() {
    live.forEach((c) => c.destroy());
    live = [];
  }
  // Theme change: rebuild so axis/legend colours follow the theme.
  document.addEventListener('nuf-theme', () => {
    const cvs = live.map((c) => c.canvas);
    destroyAll();
    cvs.forEach((cv) => document.contains(cv) && build(cv));
  });
  App.viewport &&
    App.viewport.onChange &&
    App.viewport.onChange(() => {
      const cvs = live.map((c) => c.canvas);
      destroyAll();
      cvs.forEach((cv) => document.contains(cv) && build(cv));
    });

  // Convenience: build the standard breakdown charts from a ticket list.
  function top(list, keyFn, n) {
    return App.metrics.groupCount(list, keyFn).slice(0, n || 8);
  }
  function overTime(list, weeks) {
    const now = App.clock.now(),
      W = 7 * 86400000,
      labels = [],
      values = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const end = now - i * W,
        start = end - W;
      labels.push(App.fmt.date(end).replace(/, \d{4}$|\/\d{4}$|^\d{4}-/, ''));
      values.push(list.filter((t) => t.createdAt > start && t.createdAt <= end).length);
    }
    return { labels, values };
  }

  App.chart = { card, mount, destroyAll, top, overTime, PAL, STATUS_COL, BLUES };
})();
