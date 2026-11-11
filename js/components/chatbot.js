/* Chatbot: "NU Fairview Maintenance Assistant" (Future Enhancement Preview). Predefined keyword + decision-tree replies only: no AI API.
   Same component serves the floating button (Student / Faculty) and the Chatbot page. The conversation lives in the session store,
   so it survives navigation and live window resizes. Never asks for a password. */
(function () {
  const App = (window.App = window.App || {});
  const ASSISTANT_NAME = 'NU Fairview Support Assistant';
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;

  const GREETING = 'I can help you find the right maintenance request or guide you through reporting an issue.';
  const QUICK = [
    ['Report an Issue', 'guide'],
    ['Check My Ticket', 'check'],
    ['Common IT Problems', 'commonIT'],
    ['Common Facility Problems', 'commonFM'],
    ['Contact Support', 'contact'],
  ];
  const SAFETY_KW = ['fire', 'smoke', 'spark', 'sparks', 'burning', 'flood', 'electrocuted', 'shock'];
  const SAFETY_REPLY =
    'If anyone is in danger, leave the area and contact campus security or emergency services first. You can report it here afterwards.';
  // Spec 17.2 keyword table. Order matters: ties go to the first row.
  const ROWS = [
    ['Wi-Fi / Network', ['wifi', 'wi-fi', 'internet', 'network', 'disconnect', 'connection', 'walang internet']],
    ['Computer Login / Access', ['password', 'username', 'login', 'log in', 'cannot sign in']],
    ['School Email / Account', ['email', 'school account', 'account']],
    ['Computer / Hardware', ['computer', 'pc', 'cpu', 'system unit', 'will not turn on', 'ayaw mag-on', 'display', 'monitor', 'screen', 'black screen', 'no signal', 'mouse', 'keyboard', 'cursor', 'keys']],
    ['Air Conditioning', ['aircon', 'air conditioner', 'ac', 'too hot', 'too cold']],
    ['Lighting', ['light', 'lamp', 'bulb', 'walang ilaw']],
    ['Plumbing', ['leak', 'faucet', 'toilet', 'clog', 'no water']],
    ['Furniture', ['chair', 'table', 'desk', 'broken', 'sira']],
    ['Electrical', ['outlet', 'socket', 'power', 'electric']],
    ['Equipment', ['projector', 'whiteboard', 'tv']],
  ];
  const norm = (s) =>
    ` ${s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()} `;
  function hits(text, kws) {
    const t = norm(text);
    return kws.filter((k) => {
      const n = norm(k).trim();
      return n.length <= 3 ? t.includes(` ${n} `) : t.includes(` ${n}`);
    }).length;
  }

  const st = () => (App.store.session.chat = App.store.session.chat || { msgs: [], open: false, started: false, startedFor: '', pending: null });
  const now = () => App.fmt.time(App.clock.now());
  let host = null; // current mounted container (panel or page)
  let typing = false;
  let replyTimer = null;

  function trimHistory() {
    const s = st();
    if (s.msgs.length > 100) s.msgs.splice(0, s.msgs.length - 100);
  }

  function say(text, opts, extra) {
    st().msgs.push(Object.assign({ from: 'bot', text, opts: opts || [], time: now() }, extra || {}));
    trimHistory();
  }
  function you(text) {
    st().msgs.push({ from: 'user', text, time: now() });
    trimHistory();
  }
  function quick() {
    return QUICK.map(([l, a]) => ({ label: l, act: a }));
  }
  function ensureStarted() {
    const s = st();
    const currentUserId = String(S().user || '');
    // Chat history belongs to the signed-in account. Do not show a previous
    // account's greeting or conversation after a user change.
    if ((s.started && s.startedFor !== currentUserId) || (!s.startedFor && s.msgs.length)) {
      cancelReply();
      s.msgs = [];
      s.started = false;
      s.pending = null;
    }
    if (!s.started) {
      s.started = true;
      s.startedFor = currentUserId;
      const first = String((App.metrics.currentUser() || {}).name || '').trim() || 'there';
      say(`Hi, ${first}! ${GREETING}`, quick());
    }
  }

  // Bot replies after a short typing indicator.
  function reply(fn) {
    if (typing) return;
    typing = true;
    draw();
    replyTimer = setTimeout(() => {
      replyTimer = null;
      typing = false;
      fn();
      draw();
    }, 550);
  }
  function cancelReply() {
    if (replyTimer) clearTimeout(replyTimer);
    replyTimer = null;
    typing = false;
    syncChatControls();
  }
  function syncChatControls() {
    if (!host) return;
    host.setAttribute('aria-busy', String(typing));
    host.querySelectorAll('[data-chat]').forEach((control) => {
      control.disabled = typing;
      control.setAttribute('aria-disabled', String(typing));
    });
  }
  const userLoc = () => (App.metrics.currentUser() || {}).usualLocationId || '';

  function reportOpts(cat, extra) {
    return [
      { label: 'Report Issue', act: 'report', arg: JSON.stringify(Object.assign({ category: cat }, extra || {})) },
      { label: 'Not This', act: 'notThis' },
    ];
  }
  function interpret(text) {
    const t = norm(text);
    if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(t))
      return reply(() => say('Hello! What can I help you with today?', quick()));
    if (/\b(thank you|thanks|salamat)\b/.test(t))
      return reply(() => say('You’re welcome. I’m here if you need help with a maintenance issue or ticket.', quick()));
    if (/\b(what can you do|how can you help|help me|what is this)\b/.test(t))
      return reply(() => say('I can guide you through reporting an issue, help you check your tickets, explain common IT or facility problems, and show support contacts.', quick()));
    if (/\b(who are you|what are you|what is nu fairview|what is this system)\b/.test(t))
      return reply(() => say(`I am the ${ASSISTANT_NAME}. I provide guided help for facility and IT maintenance requests inside this ticketing system.`, quick()));
    if (/\b(branch|campus|which campus|where is this|what location)\b/.test(t))
      return reply(() => say('This is the National University Fairview campus facility and IT maintenance system. The selected campus is NU Fairview.', quick()));
    if (/\b(what is this for|purpose|why was this made|what does this system do)\b/.test(t))
      return reply(() => say('The system lets students and faculty report facility or IT problems, track ticket progress, view schedules, and receive support updates. Staff use it to assign and resolve maintenance work.', quick()));
    if (/\b(office hours|when are you open|what time|business hours)\b/.test(t))
      return reply(() => say('The Facilities Management Office and IT Services Office are available Monday to Saturday, 8:00 AM to 5:00 PM.', [{ label: 'Contact Support', act: 'contact' }]));
    if (/\b(private|privacy|secure|security|who can see|data)\b/.test(t))
      return reply(() => say('Your account and ticket details are visible to you and authorized system staff. The assistant does not request passwords and only uses your signed-in session to show your own ticket information.', quick()));
    if (/\b(role|student|faculty|staff|administrator|permissions|access)\b/.test(t))
      return reply(() => say('Access depends on your account role. Students and faculty manage their own reports, IT and Facilities staff handle assigned work, and administrators oversee the system.', quick()));
    if (/\b(how do i|how can i|where do i).{0,30}\b(report|submit|create).{0,20}\b(issue|ticket|problem)\b/.test(t)) return act('guide');
    if (/\b(status|meaning|difference).{0,24}\b(pending|assigned|in progress|resolved|closed|reopened)\b/.test(t))
      return reply(() => say('Ticket statuses show progress: Pending means waiting to be handled, Assigned has an owner, In Progress is being worked on, Resolved is awaiting verification, and Closed / Verified is completed.', quick()));
    if (/\b(qr|scan|location code|room|building|floor).{0,24}\b(report|ticket|choose|select)\b|\bhow.*location\b/.test(t))
      return reply(() => say('On Step 1 of Report an Issue, scan the NU location QR code or choose the building, floor, location type, and room manually. You can clear the selection and choose again.', [{ label: 'Report an Issue', act: 'guide' }]));
    if (/\b(schedule|scheduled|appointment|upcoming|visit|inspection)\b/.test(t))
      return reply(() => say('Scheduled ticket visits appear on your dashboard and Schedule page. Open the linked ticket to review its details, location, and time.', [{ label: 'Check My Ticket', act: 'check' }, { label: 'Contact Support', act: 'contact' }]));
    if (/\b(notification|notifications|alert|alerts)\b/.test(t))
      return reply(() => say('Notifications summarize ticket assignments, status changes, and schedules. Use the bell or Notifications page to review, mark read, or dismiss them.', quick()));
    if (/\b(password|forgot.*password|login|sign in|account locked|mfa|authenticator)\b/.test(t))
      return reply(() => say(App.C.NO_PASSWORD + ' For account access help, contact IT Support.', [{ label: 'Contact Support', act: 'contact' }], { alert: true }));
    if (/\b(cancel|delete|remove).{0,20}\b(ticket|report)\b/.test(t))
      return reply(() => say('Submitted tickets are kept for tracking and audit history. Open the ticket and contact the assigned support team if the report was submitted by mistake.', [{ label: 'Check My Ticket', act: 'check' }, { label: 'Contact Support', act: 'contact' }]));
    if (/\b(where|status|check|find|view).{0,24}\b(my )?tickets?\b|\bmy tickets?\b/.test(t)) return act('check');
    if (/\b(hours?|open|close|located|location|contact|support office)\b/.test(t)) return act('contact');
    if (SAFETY_KW.some((k) => t.includes(` ${k} `) || t.includes(` ${k}`)))
      return reply(() =>
        say(
          SAFETY_REPLY,
          [{ label: 'Report this issue', act: 'report', arg: JSON.stringify({ safety: 1 }) }],
          { alert: true },
        ),
      );
    let best = null,
      bestN = 0;
    ROWS.forEach(([cat, kws]) => {
      const n = hits(text, kws);
      if (n > bestN) {
        bestN = n;
        best = cat;
      }
    }); // strict ">" keeps the first row on ties
    if (!best)
      return reply(() =>
        say('I can help with NU Fairview IT and facility tickets, schedules, notifications, and support contacts. I cannot answer unrelated questions, but you can choose a supported topic below:', quick()),
      );
    if (best === 'Computer / Hardware' && /\bmissing\b|\bno cpu\b/.test(t.trim()))
      best = 'Missing / Unavailable Hardware';
    reply(() => {
      say(`This sounds like a ${best} issue. Would you like to report it?`, reportOpts(best));
      if (best === 'Computer Login / Access' || best === 'School Email / Account')
        say(App.C.NO_PASSWORD, [], { alert: true });
    });
  }

  const GUIDE = {
    Computer: 'Computer / Hardware',
    Network: 'Wi-Fi / Network',
    Monitor: 'Computer / Hardware',
    'Keyboard/Mouse': 'Computer / Hardware',
  };
  const NET = {
    'No Connection': 'No connection',
    'Unstable Connection': 'Unstable connection',
    'Weak Signal': 'Weak signal',
    Other: 'Other',
  };
  function act(a, arg, label) {
    if (typing) return;
    if (label) you(label);
    if (a === 'toggleNote') {
      st().noteHidden = false;
      st().noteExpanded = !st().noteExpanded;
      updateNote();
      return;
    }
    if (a === 'hideNote') {
      st().noteHidden = true;
      st().noteExpanded = false;
      updateNote();
      return;
    }
    if (a === 'guide')
      return reply(() =>
        say(
          'What type of problem are you experiencing?',
          ['Computer', 'Network', 'Monitor', 'Keyboard/Mouse', 'Facility'].map((l) => ({
            label: l,
            act: 'gtype',
            arg: l,
          })),
        ),
      );
    if (a === 'gtype') {
      if (arg === 'Network')
        return reply(() =>
          say(
            'Is the connection completely unavailable or unstable?',
            Object.keys(NET).map((l) => ({ label: l, act: 'gnet', arg: l })),
          ),
        );
      if (arg === 'Facility')
        return reply(() =>
          say(
            'Which facility problem?',
            App.C.CATEGORIES.filter((c) => c.group === 'Facility').map((c) => ({
              label: c.id,
              act: 'gfac',
              arg: c.id,
            })),
          ),
        );
      return reply(() =>
        say('Would you like to create a ticket?', [
          { label: 'Create Ticket', act: 'report', arg: JSON.stringify({ category: GUIDE[arg] }) },
          { label: 'Not now', act: 'notThis' },
        ]),
      );
    }
    if (a === 'gnet')
      return reply(() =>
        say('Would you like to create a ticket?', [
          {
            label: 'Create Ticket',
            act: 'report',
            arg: JSON.stringify({ category: 'Wi-Fi / Network', problem: NET[arg] }),
          },
          { label: 'Not now', act: 'notThis' },
        ]),
      );
    if (a === 'gfac')
      return reply(() =>
        say('Would you like to create a ticket?', [
          { label: 'Create Ticket', act: 'report', arg: JSON.stringify({ category: arg }) },
          { label: 'Not now', act: 'notThis' },
        ]),
      );
    if (a === 'report') {
      let o;
      try {
        o = JSON.parse(arg || '{}');
      } catch {
        return reply(() => say('I could not prepare that report. Please use Report an Issue and choose the details manually.', quick(), { alert: true }));
      }
      st().pending = o;
      return reply(() =>
        say(
          `I understood this as a ${o.category || 'maintenance'} issue${o.problem ? ` (${o.problem})` : ''}. Would you like to continue to the report form?`,
          [
            { label: 'Continue to Report', act: 'confirmReport' },
            { label: 'Change Details', act: 'editReport' },
          ],
        ),
      );
    }
    if (a === 'confirmReport') {
      const o = st().pending || {};
      st().pending = null;
      const q = new URLSearchParams();
      // The report form no longer asks for a category or problem; it only starts a fresh report (chat=1) and prefills the location.
      q.set('chat', '1');
      if (userLoc()) q.set('location', userLoc());
      close();
      App.router.go(`/report?${q}`);
      return;
    }
    if (a === 'editReport') {
      st().pending = null;
      close();
      App.router.go('/report?new=1');
      return;
    }
    if (a === 'resetChat') {
      cancelReply();
      st().msgs = [];
      st().started = false;
      st().pending = null;
      ensureStarted();
      draw();
      return;
    }
    if (a === 'notThis') return reply(() => say('No problem. What would you like to do?', quick()));
    if (a === 'check')
      return reply(() => {
        const mine = S()
          .tickets.filter((t) => t.reporterId === S().user)
          .sort((x, y) => y.updatedAt - x.updatedAt)
          .slice(0, 5);
        if (!mine.length)
          say('You have no tickets yet. Would you like to report an issue?', [
            { label: 'Report an Issue', act: 'guide' },
          ]);
        else
          say(
            'Here are your latest tickets. Tap one to open it:',
            mine.map((t) => ({ label: `#${t.id}: ${t.status}`, act: 'open', arg: t.id })),
          );
      });
    if (a === 'open') {
      close();
      App.router.go(`/tickets/${arg}`);
      return;
    }
    if (a === 'commonIT')
      return reply(() =>
        say(
          'Common IT problems. Pick one:',
          App.C.CATEGORIES.filter((c) => c.group === 'IT').map((c) => ({ label: c.id, act: 'pick', arg: c.id })),
        ),
      );
    if (a === 'commonFM')
      return reply(() =>
        say(
          'Common facility problems. Pick one:',
          App.C.CATEGORIES.filter((c) => c.group === 'Facility').map((c) => ({ label: c.id, act: 'pick', arg: c.id })),
        ),
      );
    if (a === 'pick')
      return reply(() => {
        say(`This sounds like a ${arg} issue. Would you like to report it?`, reportOpts(arg));
        if (App.C.catByName(arg).noPassword) say(App.C.NO_PASSWORD, [], { alert: true });
      });
    if (a === 'contact')
      return reply(() =>
        say(
          'Support contacts: Facilities Management Office, Upper Ground. IT Services Office, 4th Floor. Office hours: Mon-Sat, 8:00 AM to 5:00 PM.',
        ),
      );
  }

  /* ---------- rendering ---------- */
  function msgHtml(m) {
      const avatar = m.from === 'bot' ? '<div class="msg-avatar"><img class="chat-avatar chat-ai-avatar" src="assets/nu-bulldog.png" alt="NU Fairview support assistant" draggable="false"></div>' : '';
    return `<div class="msg ${m.from === 'user' ? 'user' : 'bot'} ${m.alert ? 'alert' : ''}" data-testid="chat-msg">${avatar}<div class="msg-body">${m.alert ? App.icon('alert') + ' ' : ''}<span class="msg-text">${esc(m.text)}</span><time>${esc(m.time)}</time>${m.opts && m.opts.length ? `<div class="opts">${m.opts.map((o) => `<button type="button" class="btn sm ${o.act === 'report' || o.act === 'guide' || o.act === 'confirmReport' ? '' : 'secondary'}" data-chat="${o.act}" data-arg="${esc(o.arg || '')}" data-label="${esc(o.label)}" data-testid="chat-${App.fmt.slug(o.label)}">${esc(o.label)}</button>`).join('')}</div>` : ''}</div></div>`;
  }
  function draw() {
    if (!host) return;
    const log = host.querySelector('.chat-log');
    if (!log) return;
    log.innerHTML =
      st().msgs.map(msgHtml).join('') +
      (typing
        ? '<div class="msg" aria-label="Assistant is typing"><span class="typing"><i></i><i></i><i></i></span></div>'
        : '');
    log.scrollTop = log.scrollHeight;
    syncChatControls();
  }
  function updateNote() {
    if (!host) return;
    const note = host.querySelector('.chat-note');
    if (!note) return;
    const hidden = st().noteHidden === true;
    const expanded = st().noteExpanded === true && !hidden;
    note.hidden = hidden;
    note.classList.toggle('expanded', expanded);
    const toggle = note.querySelector('.chat-note-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? 'Collapse assistant information' : 'Show assistant information');
    }
  }
  function shellHtml(inline) {
    return `<div class="chat-head"><h2 id="chat-title"><img class="chat-logo" src="assets/nu-bulldog.png" alt="" aria-hidden="true" draggable="false"> ${ASSISTANT_NAME}</h2><div class="chat-head-actions">${App.badges.futureTag()}<button type="button" class="icon-btn" data-chat="resetChat" aria-label="Start over" title="Start over">${App.icon('refresh')}</button>${inline ? '' : `<button type="button" class="icon-btn" data-chat-close aria-label="Close assistant">${App.icon('x')}</button>`}</div></div>
      <div class="chat-log" role="log" aria-live="polite" aria-label="Conversation" tabindex="0"></div>
      <div class="chat-note" role="note"><button type="button" class="chat-note-toggle" data-chat="toggleNote" aria-expanded="false" aria-label="Show assistant information">${App.icon('info')}<span>Assistant info</span></button><span class="chat-note-copy">Automated keyword assistant for common maintenance questions. It cannot replace emergency services or staff diagnosis.</span><button type="button" class="icon-btn chat-note-dismiss" data-chat="hideNote" aria-label="Hide assistant information">${App.icon('x')}</button></div>
      <form class="chat-input" data-chat-form><label class="sr-only" for="chat-text">Describe your problem</label><input class="input" id="chat-text" maxlength="500" autocomplete="off" placeholder="Describe the problem..." data-testid="chat-input"><button type="submit" class="btn" aria-label="Send message" data-testid="chat-send">${App.icon('send')}</button></form>`;
  }
  function bindHost(el) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-chat]');
      if (b) {
        if (typing) return;
        if (b.dataset.chat === 'resetChat') {
          b.classList.remove('is-spinning');
          void b.offsetWidth;
          b.classList.add('is-spinning');
        }
        act(b.dataset.chat, b.dataset.arg, b.dataset.label);
        return;
      }
      if (e.target.closest('[data-chat-close]')) close();
    });
    el.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-chat-form]');
      if (!form || !el.contains(form)) return;
      e.preventDefault();
      const i = form.querySelector('#chat-text');
      const v = i.value.trim();
      if (!v) return;
      if (typing) return;
      i.value = '';
      you(v);
      draw();
      interpret(v);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !el.classList.contains('chat-inline')) {
        e.stopPropagation();
        close();
      }
    });
  }

  /* ---------- floating panel ---------- */
  let fab = null,
    panel = null;
  function open() {
    ensureStarted();
    st().open = true;
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'chat-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-labelledby', 'chat-title');
      panel.setAttribute('data-testid', 'chat-panel');
      panel.innerHTML = shellHtml(false);
      document.body.appendChild(panel);
      bindHost(panel);
    }
    panel.hidden = false;
    host = panel;
    draw();
    updateNote();
    sync();
    panel.querySelector('#chat-text').focus();
  }
  function close() {
    cancelReply();
    st().open = false;
    if (panel) panel.hidden = true;
    host = null;
    sync();
    if (fab && !fab.hidden) fab.focus();
  }
  // Show the floating button for Student / Faculty only, and not on the full Chatbot page.
  function sync() {
    if (App.auth.isIn()) ensureStarted();
    const show = App.auth.isIn() && S().role === 'student' && !/^#\/chatbot/.test(location.hash);
    if (!fab) {
      fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'chat-fab';
      fab.setAttribute('aria-label', `Open ${ASSISTANT_NAME}`);
      fab.setAttribute('data-testid', 'chat-fab');
      fab.innerHTML = App.icon('chat');
      fab.addEventListener('click', open);
      document.body.appendChild(fab);
    }
    const opened = st().open && show;
    fab.hidden = !show || opened;
    if (panel) panel.hidden = !opened;
    if (opened && panel) host = panel;
    queueLift();
  }
  // Keeps the floating button above the footer: --fab-lift is how far the footer has risen into the screen.
  let liftQueued = false;
  function lift() {
    liftQueued = false;
    const f = document.querySelector('.app-footer');
    const px = f ? Math.max(0, Math.round(window.innerHeight - f.getBoundingClientRect().top)) : 0;
    document.documentElement.style.setProperty('--fab-lift', px + 'px');
  }
  function queueLift() {
    if (!liftQueued) {
      liftQueued = true;
      requestAnimationFrame(lift);
    }
  }
  function init() {
    window.addEventListener('hashchange', () => {
      sync();
      queueLift();
    });
    window.addEventListener('scroll', queueLift, { passive: true });
    window.addEventListener('resize', queueLift);
  }

  App.chatbot = {
    init,
    open,
    close,
    sync,
    interpret,
    ROWS,
    isInfoVisible: () => st().noteHidden !== true,
    setInfoVisible(visible) {
      st().noteHidden = !visible;
      st().noteExpanded = false;
      updateNote();
    },
  };

  /* ---------- Chatbot page (same component, inline) ---------- */
  App.pages.chatbotPage = {
    static: true,
    title: () => ASSISTANT_NAME,
    render() {
      return `<div class="chatbot-page">${App.ui.pageHead(ASSISTANT_NAME, App.badges.futureTag())}<div class="chat-inline" data-testid="chat-inline" role="region" aria-labelledby="chat-title">${shellHtml(true)}</div></div>`;
    },
    mount(el) {
      ensureStarted();
      host = el.querySelector('.chat-inline');
      bindHost(host);
      draw();
      updateNote();
      sync();
    },
    unmount() {
      cancelReply();
      host = null;
    },
  };
})();
