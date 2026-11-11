/* Settings: one page with tabs (Account, Preferences, Notifications, Privacy and Security, Help and Support, System for admins, Demo data). All roles. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;

  const sw = (
    key,
    on,
    label,
    hint,
    attr,
  ) => `<div class="setting-row"><div class="txt"><b id="sw-${key}">${esc(label)}</b>${hint ? `<small class="muted">${esc(hint)}</small>` : ''}</div>
    <label class="switch"><input type="checkbox" role="switch" aria-labelledby="sw-${key}" ${attr || `data-pref="${key}"`} data-focus-key="pref-${key}" ${on ? 'checked' : ''}><span></span></label></div>`;
  const seg = (key, val, items) =>
    `<div class="seg" role="group" aria-label="${esc(key)}">${items.map(([v, l]) => `<button type="button" data-pref-btn="${key}" data-val="${v}" aria-pressed="${String(val) === v}">${esc(l)}</button>`).join('')}</div>`;
  const row = (label, hint, control) =>
    `<div class="setting-row"><div class="txt"><b>${esc(label)}</b>${hint ? `<small class="muted">${esc(hint)}</small>` : ''}</div><div>${control}</div></div>`;
  const card = (id, title, body, intro) =>
    `<section class="card" aria-labelledby="${id}"><h2 id="${id}" class="profile-sec">${esc(title)}</h2>${intro ? `<p class="muted mt-0">${esc(intro)}</p>` : ''}${body}</section>`;

  const SECTIONS = {
    account(me, p) {
      return `<div>
        ${card(
          'ac1',
          'Signed in as',
          `<div class="row mb-3">${App.ui.avatar('avatar-lg')}
          <div><b>${esc(me.fullName)}</b></div></div>
          <dl class="kv"><dt>Email</dt><dd>${esc(me.email)}</dd><dt>Role</dt><dd data-testid="account-role">${esc(App.metrics.roleLabel(me))}</dd><dt>Department</dt><dd>${esc(me.department)}</dd>${App.fmt.roleId(me, S().role) ? `<dt>${esc(App.C.ROLES[S().role].short)}-ID</dt><dd data-testid="account-id">${esc(App.fmt.roleId(me, S().role))}</dd>` : ''}</dl>
          <div class="row mt-4"><button type="button" class="btn danger signout-action" data-act="logout" data-testid="account-signout">${App.icon('logout')}Sign out</button></div>`,
        )}
      </div>`;
    },
    preferences(me, p) {
      return `<div class="grid two">${card(
        'pf1',
        'Region',
        `
        ${row('Time zone', 'Campus time zone for schedules and tickets.', `<div><b>(UTC+08:00) Manila, Philippines</b><p class="help" id="tz-help">Fixed to Asia/Manila.</p></div>`)}`,
      )}
        ${card(
          'pf2',
          'Date and time',
          `
        ${row(
          'Date format',
          '',
          `<select class="select" data-pref="dateStyle" data-focus-key="pref-dateStyle" aria-label="Date format">${App.ui.options(
            [
              { value: 'mdy', label: 'Oct 7, 2026' },
              { value: 'dmy', label: '07/10/2026' },
              { value: 'iso', label: '2026-10-07' },
            ],
            p.dateStyle,
          )}</select>`,
        )}
        ${row(
          'Time format',
          '',
          seg('hour12', String(p.hour12), [
            ['true', '12-hour'],
            ['false', '24-hour'],
          ]),
        )}
        <p class="muted small mb-0">Preview: <b data-testid="fmt-preview">${esc(App.fmt.dateTime(App.clock.now()))}</b></p>`,
        )}</div>`;
    },
    notifications(me, p) {
      const n = p.channels,
        t = p.topics;
      return `<div class="grid two">${card(
        'nf1',
        'Delivery channels',
        `
        ${sw('inApp', n.inApp, 'In-app notifications', 'Shown in the bell menu and Notifications page.', 'data-ch="inApp"')}
        ${sw('email', n.email, 'Email', 'Sent to your registered email address.', 'data-ch="email"')}`,
      )}
        ${card(
          'nf2',
          'Alert types',
          `
        ${sw('assigned', t.assigned, 'Ticket assignments', 'When a ticket is assigned to you.', 'data-topic="assigned"')}
        ${sw('status', t.status, 'Ticket status changes', 'When a ticket you follow is updated.', 'data-topic="status"')}
        ${sw('schedule', t.schedule, 'Ticket schedule', 'Upcoming and changed ticket schedules.', 'data-topic="schedule"')}
        ${sw('digest', t.digest, 'Weekly summary email', 'A weekly digest of ticket activity.', 'data-topic="digest"')}`,
        )}</div>`;
    },
    security(me, p) {
      const showAssistantInfo = App.chatbot && App.chatbot.isInfoVisible ? App.chatbot.isInfoVisible() : true;
      return `<div class="grid two">${card(
        'sc2',
        'Signed-in devices',
        `
        <ul class="plain-list"><li><b>This device</b><br><span class="muted small">Web browser &middot; Active now</span></li><li><b>Campus workstation</b><br><span class="muted small">Web browser &middot; Last active yesterday</span></li></ul>
        <button type="button" class="btn secondary mt-3" data-others data-testid="signout-others">Sign out of other devices</button>`,
      )}
        ${card('sc3', 'Privacy', `<p class="mt-0">Your account details are visible only to you and system administrators. Ticket details are shared with the staff assigned to them.</p><p class="muted small">Activity on your account is recorded in the audit log for security purposes.</p>${sw('assistantInfo', showAssistantInfo, 'Show assistant information', 'Restore the chatbot notice after dismissing it.', 'data-assistant-info')}`)}</div>`;
    },
    help(me, p) {
      const faq = [
        [
          'How do I report a problem?',
          'Choose Report Issue from the menu, scan the location QR code, describe the problem, attach a clear photo and submit. You can follow its progress under My Tickets.',
        ],
        [
          'What happens after I submit a report?',
          'The administrator reviews each new report and assigns it to the right team. You will be notified as its status changes.',
        ],
        [
          'How do I change my contact details?',
          'Your name and email come from your university account. Ask the IT Services Office if something is wrong.',
        ],
        [
          'I forgot my password. What now?',
          'Contact the IT Services Office. They can verify your identity and reset it for you.',
        ],
      ];
      return `<div class="grid two">${card('hp1', 'Frequently asked questions', faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join(''))}
        <div>${card(
          'hp2',
          'Contact support',
          `<dl class="kv"><dt>Facilities Management Office</dt><dd>Upper Ground</dd><dt>IT Services Office</dt><dd>4th Floor</dd><dt>Office hours</dt><dd>Mon-Sat, 8:00 AM to 5:00 PM</dd></dl>
          <div class="row mt-4"><a class="btn" href="#/report">${App.icon('plus')}Report an issue</a></div>`,
        )}
        <div style="height:var(--s4)"></div>
        ${card('hp3', 'About', '<dl class="kv"><dt>System</dt><dd>NU Fairview Facility &amp; IT Maintenance Ticketing System</dd><dt>Version</dt><dd>1.0</dd></dl>')}</div></div>`;
    },
  };

  SECTIONS.system = function () {
    const s = S().settings;
    return `<section class="card" aria-labelledby="tg"><h2 id="tg" class="profile-sec">Recurring issue detection</h2><form id="tg-form" novalidate><div class="form-grid">
      ${App.ui.field('rc-n', 'Recurring issue threshold (tickets in 90 days)', `<input class="input" id="rc-n" type="number" min="2" max="50" value="${s.recurringThreshold}" data-testid="recurring-threshold">`)}</div><button type="submit" class="btn" data-testid="save-settings">Save settings</button></form></section>`;
  };
  SECTIONS.demo = function () {
    return card(
      'dm1',
      'Reset demo data',
      `<p class="mt-0">Puts every ticket, notification and setting back to the original demo data. You stay signed in. This cannot be undone.</p>
      <button type="button" class="btn danger" data-act="reset" data-testid="reset-demo">${App.icon('refresh')}Reset demo data</button>`,
    );
  };
  const TABS = [
    ['account', 'Account'],
    ['preferences', 'Preferences'],
    ['notifications', 'Notifications'],
    ['security', 'Privacy and Security'],
    ['help', 'Help and Support'],
    ['system', 'System'],
    ['demo', 'Demo data'],
  ];
  const tabsFor = (role) =>
    TABS.filter((t) => t[0] !== 'system' || role === 'admin').map((t) => ({ id: t[0], label: t[1] }));

  const SUB = {
    system: 'Recurring-issue detection.',
    demo: 'Return the whole demo to its starting data.',
    account: 'Your sign-in details.',
    preferences: 'Time zone and how dates and times appear.',
    notifications: 'Choose how and when you are notified.',
    security: 'Keep your account safe.',
    help: 'Answers, contacts and system information.',
  };

  App.pages.userSettings = {
    title: () => 'Settings',
    render() {
      const tabs = tabsFor(S().role);
      let sec = App.store.session.settingsTab || 'account';
      if (!tabs.some((t) => t.id === sec)) sec = 'account';
      const me = App.metrics.currentUser(),
        p = App.userPrefs.get();
      const mobileSections = `<label class="settings-section-label" for="settings-section">Settings section</label><select class="select" id="settings-section" data-settings-section>${tabs.map((t) => `<option value="${t.id}" ${t.id === sec ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select>`;
      return `${App.ui.pageHead('Settings', '', SUB[sec])}<div data-settings-tabs>${App.tabs.render(tabs, sec, 'settings')}</div><div class="settings-mobile-section" style="margin-bottom:var(--s4)">${mobileSections}</div><div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings-${sec}">${SECTIONS[sec](me, p)}</div>`;
    },
    mount(el, ctx) {
      const saved = () => App.toast.show('Preference saved.', 'success');
      App.tabs.bind(el, (key, id) => {
        App.store.session.settingsTab = id;
        ctx.refresh();
      });
      el.addEventListener('settings-section-change', (e) => {
        App.store.session.settingsTab = e.detail.value;
        ctx.refresh();
      });
      el.addEventListener('change', (e) => {
        const t = e.target;
        if (t.dataset.settingsSection) {
          App.store.session.settingsTab = t.value;
          ctx.refresh();
          return;
        }
        if (t.hasAttribute('data-assistant-info')) {
          if (App.chatbot && App.chatbot.setInfoVisible) App.chatbot.setInfoVisible(t.checked);
          saved();
          return;
        }
        if (t.dataset.ch) {
          App.userPrefs.set({
            channels: Object.assign({}, App.userPrefs.get().channels, { [t.dataset.ch]: t.checked }),
          });
          saved();
          return;
        }
        if (t.dataset.topic) {
          const patch = { topics: Object.assign({}, App.userPrefs.get().topics, { [t.dataset.topic]: t.checked }) };
          if (t.dataset.topic === 'digest' && t.checked)
            patch.digestWeek = App.fmt.addDays(
              App.fmt.ymd(App.clock.now()),
              -((App.fmt.parts(App.clock.now()).wd + 6) % 7),
            ); // first summary arrives next week
          App.userPrefs.set(patch);
          saved();
          return;
        }
        if (t.dataset.pref) {
          App.userPrefs.set({ [t.dataset.pref]: t.type === 'checkbox' ? t.checked : t.value });
          saved();
        }
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pref-btn]');
        if (b) {
          const v = b.dataset.val;
          App.userPrefs.set({ [b.dataset.prefBtn]: v === 'true' ? true : v === 'false' ? false : v });
          saved();
          return;
        }
        if (e.target.closest('[data-others]')) App.toast.show('Signed out of all other devices.', 'success');
      });
      // Delegated: the forms only exist while their tab is showing.
      el.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        if (form.id === 'tg-form') {
          const errs = {};
          const n = Number(el.querySelector('#rc-n').value);
          if (!(n >= 2 && n <= 50)) errs['rc-n'] = 'Enter a number between 2 and 50.';
          App.ui.showErrors(el, errs);
          if (Object.keys(errs).length) return;
          App.toast.fromResult(App.actions.updateSettings({ recurringThreshold: n }));
          App.actions.runAutomation();
          return;
        }
      });
    },
  };
})();
