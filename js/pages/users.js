/* Users (Administrator). No real account management: actions only show a "Demo only" toast. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;
  const st = () => (App.store.session.userF = App.store.session.userF || { q: '', role: '', status: '' });

  function detail(ctx) {
    const u = S().users.find((x) => x.id === ctx.params.id);
    if (!u)
      return `<div class="card not-avail"><div class="empty">${App.icon('search')}</div><h1 class="page-title" id="page-h1" tabindex="-1">User not found</h1><a class="btn" href="#/users">Back to users</a></div>`;
    const reported = S().tickets.filter((t) => t.reporterId === u.id),
      assigned = S().tickets.filter((t) => t.assigneeId === u.id);
    return `${App.ui.pageHead(u.fullName, '', App.metrics.roleLabel(u))}
      <div class="grid two"><section class="card"><dl class="kv"><dt>${u.program ? 'Student ID' : 'Employee ID'}</dt><dd>${esc(u.idNo || 'n/a')}</dd><dt>${u.program ? 'Program and year' : 'Position'}</dt><dd>${esc(u.program ? `${u.program}, ${u.yearLevel}` : u.position || 'n/a')}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Department</dt><dd>${esc(u.department)}</dd><dt>Status</dt><dd>${esc(u.status)}</dd><dt>Last activity</dt><dd>${esc(App.fmt.dateTime(u.lastActivity))}</dd><dt>Reported</dt><dd>${reported.length} tickets</dd><dt>Assigned</dt><dd>${assigned.length} tickets (${assigned.filter(App.metrics.isActive).length} active)</dd></dl>
        <div class="row mt-4"><button type="button" class="btn secondary" data-demo="Edit user">Edit user</button><button type="button" class="btn danger" data-demo="${u.status === 'Active' ? 'Deactivate' : 'Activate'} user">${u.status === 'Active' ? 'Deactivate' : 'Activate'}</button></div></section>
        <section class="card"><h2>${u.role === 'student' ? 'Recent reports' : 'Assigned tickets'}</h2>${(u.role === 'student' ? reported : assigned).length ? App.ticketCard.list((u.role === 'student' ? reported : assigned).slice(0, 5)) : '<p class="muted">None.</p>'}</section></div>`;
  }
  App.pages.users = {
    title: (ctx) => (ctx.route.detail ? 'User Details' : 'Users'),
    render(ctx) {
      if (ctx.route.detail) return detail(ctx);
      const f = st(),
        q = f.q.trim().toLowerCase();
      const list = S().users.filter(
        (u) =>
          (!f.role || u.role === f.role) &&
          (!f.status || u.status === f.status) &&
          (!q || `${u.fullName} ${u.email} ${u.department}`.toLowerCase().includes(q)),
      );
      const cols = [
        { h: 'Name', f: (u) => `<a href="#/users/${esc(u.id)}">${esc(u.fullName)}</a>` },
        { h: 'Role', f: (u) => esc(App.metrics.roleLabel(u)) },
        { h: 'Department', f: (u) => esc(u.department) },
        {
          h: 'Status',
          f: (u) =>
            u.status === 'Active'
              ? '<span class="pill-text">Active</span>'
              : `<span class="pill-text status-inactive">${esc(u.status)}</span>`,
        },
        { h: 'Last Activity', f: (u) => esc(App.fmt.ago(u.lastActivity)) },
        { h: 'Actions', cls: 'actions', f: (u) => `<a class="btn sm secondary" href="#/users/${esc(u.id)}">View</a>` },
      ];
      return `${App.ui.pageHead('Users', '', 'Manage system accounts.')}<div class="card"><div class="filter-bar" role="search"><div class="search"><label class="sr-only" for="us-q">Search users</label><input class="input" id="us-q" type="search" data-focus-key="us-q" data-uf="q" value="${esc(f.q)}" placeholder="Search users" data-testid="user-search"></div>
        <div><label class="sr-only" for="us-r">Role</label><select class="select" id="us-r" data-uf="role">${App.ui.options(
          App.C.ROLE_KEYS.map((k) => ({ value: k, label: App.C.ROLES[k].label })),
          f.role,
          'All roles',
        )}</select></div>
        <div><label class="sr-only" for="us-s">Status</label><select class="select" id="us-s" data-uf="status">${App.ui.options(['Active', 'Inactive'], f.status, 'All statuses')}</select></div></div><p class="result-count" role="status">${list.length} users</p>${App.ui.table(cols, list, { caption: 'Users', testid: 'user-table' })}</div>`;
    },
    mount(el, ctx) {
      let t;
      el.addEventListener('input', (e) => {
        const i = e.target.closest('[data-uf="q"]');
        if (i) {
          clearTimeout(t);
          t = setTimeout(() => {
            st().q = i.value;
            ctx.refresh();
          }, 150);
        }
      });
      el.addEventListener('change', (e) => {
        const i = e.target.closest('[data-uf]');
        if (i && i.dataset.uf !== 'q') {
          st()[i.dataset.uf] = i.value;
          ctx.refresh();
        }
      });
      el.addEventListener('click', (e) => {
        const d = e.target.closest('[data-demo]');
        if (d) App.toast.show(`${d.dataset.demo}: request recorded.`, 'info');
      });
    },
  };
})();
