/* Recurring Issues (Administrator): same category + same location with N or more tickets in 90 days (N configurable in Settings). */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;

  App.pages.recurring = {
    title: () => 'Recurring Issues',
    render() {
      const n = S().settings.recurringThreshold;
      const list = App.metrics.recurring(1).filter((r) => r.count >= Math.min(n, 3)); // show near-threshold items too, highlight those at or above N
      const sorted = list.sort((a, b) => b.count - a.count);
      return `${App.ui.pageHead('Recurring Issues', '', `Highlighted when a category repeats ${n} or more times at one location in the last 90 days (change in Settings).`)}
        ${
          sorted.length
            ? `<div class="grid three" data-testid="recurring-list">${sorted
                .map((r) => {
                  const hot = r.count >= n;
                  const open = S().tickets.filter((t) => r.ids.includes(t.id) && App.metrics.isActive(t)).length;
                  return `<article class="card recurring-card${hot ? ' is-hot' : ''}" aria-label="${esc(r.category)} at ${esc(App.metrics.locName(r.locationId))}"><div class="recurring-head"><h2 class="recurring-title">${App.icon(App.badges.catIcon(r.category))}<span>${esc(r.category)}</span></h2>${hot ? `<span class="badge tag-bad recurring-badge">${App.icon('repeat')}Recurring</span>` : ''}</div>
            <p class="recurring-location">${App.icon('pin')}<span>${esc(App.metrics.locName(r.locationId))}</span></p><div class="recurring-count"><strong data-testid="rec-count-${esc(App.fmt.slug(r.category + '-' + r.locationId))}">${r.count}</strong><span>Reports in the last 90 days</span></div><div class="recurring-meta"><span>${open} still open</span><span>Last reported ${esc(App.fmt.date(r.last))}</span></div>
            <div class="recurring-actions"><button type="button" class="btn sm" data-rd="${esc(r.category)}|${esc(r.locationId)}">View details</button><a class="btn sm secondary" href="#/tickets?category=${encodeURIComponent(r.category)}&location=${encodeURIComponent(r.locationId)}&q=">Related tickets</a></div></article>`;
                })
                .join('')}</div>`
            : App.ui.empty('repeat', 'No recurring issues yet.')
        }`;
    },
    mount(el) {
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-rd]');
        if (!b) return;
        const [cat, loc] = b.dataset.rd.split('|');
        const since = App.clock.now() - 90 * 86400000;
        const ts = S()
          .tickets.filter((t) => t.category === cat && t.locationId === loc && t.createdAt >= since)
          .sort((a, c) => c.createdAt - a.createdAt);
        const avg = App.metrics.avgResolution(ts);
        App.modal.open({
          title: `${cat} at ${App.metrics.locName(loc)}`,
          wide: true,
          body: `<dl class="kv"><dt>Reports (90 days)</dt><dd>${ts.length}</dd><dt>Still open</dt><dd>${ts.filter(App.metrics.isActive).length}</dd><dt>Average fix time</dt><dd>${avg ? esc(App.fmt.duration(avg)) : 'n/a'}</dd></dl><h3>Related tickets</h3>${App.ticketCard.list(ts.slice(0, 8))}`,
          footer: [{ label: 'Close', cls: 'secondary' }],
        });
      });
    },
  };
})();
