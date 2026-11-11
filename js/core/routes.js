/* Route table and per-role navigation. Four roles: student, fmo, it, admin. Student also covers Faculty. */
(function () {
  const App = (window.App = window.App || {});
  const ALL = ['student', 'fmo', 'it', 'admin'];
  const r = (path, page, title, roles, extra) => Object.assign({ path, page, title, roles }, extra || {});

  const routes = [
    r('/login', 'login', 'Sign In', ALL, { public: true }),
    r('/dashboard', 'dashboard', 'Dashboard', ALL),
    r('/report', 'reportIssue', 'Report an Issue', ALL),
    r('/my-tickets', 'myTickets', 'My Tickets', ALL),
    r('/tickets', 'allTickets', 'Tickets', ['admin'], { variant: 'all' }),
    r('/fmo-tickets', 'allTickets', 'FMO Tickets', ['fmo', 'admin'], { variant: 'fmo' }),
    r('/it-tickets', 'allTickets', 'IT Tickets', ['it', 'admin'], { variant: 'it' }),
    r('/tickets/:id', 'ticketDetail', 'Ticket Details', ALL, { parent: '/my-tickets' }),
    r('/assignments', 'assignments', 'Assignments', ['admin']),
    r('/scheduled', 'schedule', 'Scheduled Tickets', ['fmo', 'it'], { variant: 'staff' }),
    r('/schedules', 'schedule', 'Schedules', ['admin'], { variant: 'admin' }),
    r('/notifications', 'notifications', 'Notifications', ALL),
    r('/chatbot', 'chatbotPage', 'NU Fairview Support Assistant', ['student']),
    r('/history', 'history', 'Ticket History', ['fmo', 'it']),
    r('/users', 'users', 'Users', ['admin']),
    r('/users/:id', 'users', 'User Details', ['admin'], { detail: true, parent: '/users' }),
    r('/locations', 'locations', 'Locations', ['admin']),
    r('/analytics', 'analytics', 'Analytics', ['admin']),
    r('/recurring', 'recurring', 'Recurring Issues', ['admin']),
    r('/audit', 'audit', 'Audit Activity', ['admin']),
    r('/settings', 'userSettings', 'Settings', ALL),
    // Old section URLs still work: they open Settings on the matching tab.
    r('/account', 'userSettings', 'Account', ALL, { redirect: '/settings', tab: 'account' }),
    r('/preferences', 'userSettings', 'Preferences', ALL, { redirect: '/settings', tab: 'preferences' }),
    r('/notification-settings', 'userSettings', 'Notification Settings', ALL, {
      redirect: '/settings',
      tab: 'notifications',
    }),
    r('/security', 'userSettings', 'Privacy and Security', ALL, { redirect: '/settings', tab: 'security' }),
    r('/help', 'userSettings', 'Help and Support', ALL, { redirect: '/settings', tab: 'help' }),
    r('/profile', 'userSettings', 'Account', ALL, { redirect: '/settings', tab: 'account' }), // the standalone Profile page was removed
  ];

  // Sidebar section for each page (headings only).
  const GROUP = {
    '/dashboard': 'Menu',
    '/report': 'Menu',
    '/my-tickets': 'Menu',
    '/tickets': 'Menu',
    '/fmo-tickets': 'Menu',
    '/it-tickets': 'Menu',
    '/assignments': 'Menu',
    '/scheduled': 'Manage',
    '/schedules': 'Manage',
    '/users': 'Manage',
    '/locations': 'Manage',
    '/history': 'Manage',
    '/analytics': 'Insights',
    '/recurring': 'Insights',
    '/audit': 'Insights',
    '/notifications': 'General',
    '/chatbot': 'General',
    '/settings': 'General',
  };
  const n = (path, label, icon, group) => ({ path, label, icon, group: group || GROUP[path] });
  // One Settings item for every role; its tabs (Account, Preferences, ... System, Demo data) live inside the page.
  const prefs = () => [n('/settings', 'Settings', 'settings')];
  // Student / Faculty have no Manage section: they report issues and follow their own tickets only.
  const nav = {
    student: [
      n('/dashboard', 'Dashboard', 'home'),
      n('/report', 'Report Issue', 'plus'),
      n('/my-tickets', 'My Tickets', 'ticket'),
      n('/notifications', 'Notifications', 'bell'),
      n('/chatbot', 'Chatbot', 'assistant'),
      ...prefs(),
    ],
    fmo: [
      n('/dashboard', 'Dashboard', 'home'),
      n('/fmo-tickets', 'FMO Tickets', 'ticket'),
      n('/scheduled', 'Scheduled Tickets', 'calendar'),
      n('/history', 'Ticket History', 'history'),
      n('/notifications', 'Notifications', 'bell'),
      ...prefs(),
    ],
    it: [
      n('/dashboard', 'Dashboard', 'home'),
      n('/it-tickets', 'IT Tickets', 'ticket'),
      n('/scheduled', 'Scheduled Tickets', 'calendar'),
      n('/history', 'Ticket History', 'history'),
      n('/notifications', 'Notifications', 'bell'),
      ...prefs(),
    ],
    admin: [
      n('/dashboard', 'Dashboard', 'home', 'Operations'),
      n('/tickets', 'Tickets', 'ticket', 'Operations'),
      n('/assignments', 'Assignments', 'assignment', 'Operations'),
      n('/schedules', 'Schedules', 'calendar', 'Operations'),
      n('/users', 'Users', 'users', 'People and places'),
      n('/locations', 'Locations', 'pin', 'People and places'),
      n('/analytics', 'Analytics', 'chart'),
      n('/recurring', 'Recurring Issues', 'repeat'),
      n('/audit', 'Audit Activity', 'audit'),
      ...prefs(),
    ],
  };
  // Max 5 items; everything else lives under "More" (spec 9.1).
  const bottom = {
    student: [
      { path: '/dashboard' },
      { path: '/my-tickets', bottomLabel: 'My tickets' },
      { path: '/report', bottomLabel: 'QR', bottomIcon: 'qr', bottomKey: 'qr', bottomHref: '/report?new=1&scan=1' },
      { path: '/chatbot' },
    ],
    fmo: ['/dashboard', '/fmo-tickets', '/scheduled', '/history'],
    it: ['/dashboard', '/it-tickets', '/scheduled', '/history'],
    admin: ['/dashboard', '/tickets', '/assignments', '/analytics'],
  };
  const short = {
    '/tickets': 'Tickets',
    '/fmo-tickets': 'FMO Tickets',
    '/it-tickets': 'IT Tickets',
    '/scheduled': 'Schedule',
    '/history': 'History',
    '/report': 'Report',
    '/my-tickets': 'My Tickets',
    '/notifications': 'Alerts',
    '/chatbot': 'Chatbot',
  };

  function match(path) {
    for (const rt of routes) {
      const names = [];
      const re = new RegExp(
        '^' +
          rt.path.replace(/:([a-z]+)/g, (_, k) => {
            names.push(k);
            return '([^/]+)';
          }) +
          '/?$',
      );
      const m = path.match(re);
      if (m) {
        const params = {};
        names.forEach((k, i) => {
          params[k] = decodeURIComponent(m[i + 1]);
        });
        return { route: rt, params };
      }
    }
    return null;
  }

  App.routes = {
    routes,
    nav,
    bottom,
    short,
    match,
    ALL,
    GROUP_ORDER: ['Menu', 'Operations', 'People and places', 'Manage', 'Insights', 'General'],
  };
})();
