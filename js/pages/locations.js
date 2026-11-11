/* Locations (Administrator): Building > Floor > Room hierarchy, QR generation (View / Generate / Download / Print) and a simple floor-plan map. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const st = () =>
    (App.store.session.locF = App.store.session.locF || { mode: 'table', genId: App.db.config.defaultLocationId, typed: '' });

  function table() {
    let h = '';
    [...new Set(App.metrics.activeLocations().map((l) => l.building))].forEach((b) => {
      const inB = App.metrics.activeLocations().filter((l) => l.building === b);
      [...new Set(inB.map((l) => l.floor))].sort((a, b) => App.seed.floorRank(a) - App.seed.floorRank(b)).forEach((fl) => {
        const rows = inB.filter((l) => l.floor === fl);
        h += `<h3 style="margin:var(--s4) 0 var(--s2)">${esc(b)}, Floor ${fl}</h3><div class="loc-tables">${App.ui.table(
          [
            { h: 'Location ID', f: (l) => `<code>${esc(l.id)}</code>` },
            { h: 'Room', f: (l) => `<span class="trunc" title="${esc(l.name)}">${esc(l.name)}</span>` },
            { h: 'Type', f: (l) => `<span class="trunc" title="${esc(l.type)}">${esc(l.type)}</span>` },
            {
              h: 'Status',
              f: (l) =>
                `<span class="badge trunc ${l.status === 'Active' ? 'tag-ok' : 'tag-bad'}" title="${esc(l.status)}">${App.icon(l.status === 'Active' ? 'active' : 'alert')}${esc(l.status)}</span>`,
            },
            {
              h: 'QR',
              cls: 'actions',
              f: (l) =>
                `<button type="button" class="btn sm secondary" data-qr="${esc(l.id)}">${App.icon('qr')}View QR</button> <button type="button" class="btn sm secondary" data-qr-print="${esc(l.id)}">${App.icon('printer')}Print QR</button>`,
            },
          ],
          rows,
          { caption: `${b}, floor ${fl}` },
        )}</div>`;
      });
    });
    return h;
  }
  function map() {
    return [...new Set(App.metrics.activeLocations().map((l) => l.building))]
      .map(
        (b) =>
          `<h3>${esc(b)}</h3>${[
            ...new Set(
              App.metrics.activeLocations().filter((l) => l.building === b)
                .map((l) => l.floor),
            ),
          ]
            .sort((a, b) => App.seed.floorRank(a) - App.seed.floorRank(b))
            .map(
              (fl) =>
                `<p class="muted small" style="margin:8px 0 4px">Floor ${fl}</p><div class="floor-map">${App.metrics.activeLocations().filter((l) => l.building === b && l.floor === fl)
                  .map(
                    (l) =>
                      `<button type="button" class="floor-room ${l.status !== 'Active' ? 'closed' : ''}" data-qr="${esc(l.id)}" aria-label="${esc(l.name)}, ${esc(l.status)}. Show QR code">${App.icon(l.type === 'Computer Laboratory' ? 'monitor' : 'building')}<br><b>${esc(l.room)}</b><br><small>${esc(l.type)}</small></button>`,
                  )
                  .join('')}</div>`,
            )
            .join('')}`,
      )
      .join('');
  }

  App.pages.locations = {
    title: () => 'Locations',
    render() {
      const f = st();
      return `${App.ui.pageHead('Locations')}
        <section class="card mb-4" aria-labelledby="gq"><h2 id="gq">QR code generator</h2><form data-gen class="form-grid ai-end">
          <div class="field" data-field="gen-id"><label for="gen-id">Location ID</label><input class="input" id="gen-id" list="loc-ids" value="${esc(f.genId)}" data-testid="qr-location-id" autocomplete="off"><datalist id="loc-ids">${App.metrics.activeLocations().map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`)
            .join('')}</datalist><div class="err" role="alert">${App.icon('alert')} <span></span></div></div>
          <div class="field"><label for="gen-sel">or choose from the list</label><select class="select" id="gen-sel">${App.ui.locOptions(f.genId)}</select></div>
          <div class="field"><button type="submit" class="btn" data-testid="generate-qr">${App.icon('qr')}Generate QR</button></div></form></section>
        <div class="card"><div class="seg mb-3" role="group" aria-label="View"><button type="button" data-lm="table" aria-pressed="${f.mode === 'table'}">${App.icon('list')} Table</button><button type="button" data-lm="map" aria-pressed="${f.mode === 'map'}">${App.icon('pin')} Floor-plan map</button></div>${f.mode === 'map' ? map() : table()}</div>`;
    },
    mount(el, ctx) {
      el.addEventListener('submit', (e) => {
        const form = e.target.closest('[data-gen]');
        if (!form || !el.contains(form)) return;
        e.preventDefault();
        const id = el.querySelector('#gen-id').value.trim().toUpperCase(),
          loc = App.metrics.activeLocations().find((x) => x.id === id);
        if (!loc) {
          App.ui.setError(el, 'gen-id', 'Please enter a valid Location ID, for example ' + App.db.config.defaultLocationId + '.');
          el.querySelector('#gen-id').focus();
          return;
        }
        App.ui.setError(el, 'gen-id', '');
        st().genId = id;
        App.qr.show(loc);
      });
      el.addEventListener('change', (e) => {
        if (e.target.id === 'gen-sel' && e.target.value) {
          el.querySelector('#gen-id').value = e.target.value;
          st().genId = e.target.value;
        }
      });
      el.addEventListener('click', (e) => {
        const q = e.target.closest('[data-qr]');
        if (q) {
          App.qr.show(App.metrics.loc(q.dataset.qr));
          return;
        }
        const p = e.target.closest('[data-qr-print]');
        if (p) {
          App.qr.print(App.metrics.loc(p.dataset.qrPrint));
          return;
        }
        const m = e.target.closest('[data-lm]');
        if (m) {
          st().mode = m.dataset.lm;
          ctx.refresh();
        }
      });
    },
  };
})();
