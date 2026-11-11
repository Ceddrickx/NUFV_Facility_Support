/* All data changes go through here. Every mutating action: validates, persists, appends an audit entry,
   creates the notifications listed in spec 7.5, and returns { ok, type, msg } for the UI to show as a toast. */
(function () {
  const App = (window.App = window.App || {});
  const H = 3600000;
  const S = () => App.store.state;
  const ok = (msg, extra) => Object.assign({ ok: true, type: 'success', msg }, extra || {});
  const fail = (msg, extra) => Object.assign({ ok: false, type: 'error', msg }, extra || {});
  const nm = (id) => App.metrics.userName(id);

  const ticketInternalId = (ref) => {
    if (ref == null) return null;
    const t = S().tickets.find(
      (x) => x.id === ref || x.ticketNo === ref || (x.ticketId != null && String(x.ticketId) === String(ref)),
    );
    return t && Number.isInteger(t.ticketId) ? t.ticketId : null;
  };

  function audit(action, o) {
    o = Object.assign({}, o || {});
    if (o.ticketId != null && o.ticketInternalId == null) {
      const internal = ticketInternalId(o.ticketId);
      if (internal != null) o.ticketInternalId = internal;
    }
    S().auditLog.unshift(
      Object.assign({ id: App.ids.uid('aud'), at: App.clock.now(), actorId: S().user, action, details: '' }, o),
    );
    if (S().auditLog.length > 2000) S().auditLog.length = 2000;
  }
  // o.topic ('assigned' | 'status' | 'schedule' | 'digest') is checked against the RECIPIENT's saved Alert types; o.ticketId / o.scheduleId link the item.
  // The record stores the recipient's enabled delivery channels (inApp / email). The bell and Notifications page show inApp ones; email is what a real mail service sends from.
  function notify(userId, type, message, o) {
    if (!userId) return;
    o = o || {};
    const p = App.userPrefs.getFor(userId);
    if (o.topic && p.topics[o.topic] === false) return;
    const channels = Object.keys(p.channels).filter((k) => p.channels[k]);
    if (!channels.length) return;
    if (o.ticketId != null && o.ticketInternalId == null) {
      const internal = ticketInternalId(o.ticketId);
      if (internal != null) o.ticketInternalId = internal;
    }
    S().notifications.unshift(
      Object.assign(
        { id: App.ids.uid('ntf'), userId, type, message, read: false, createdAt: App.clock.now(), channels },
        o,
      ),
    );
  }
  const staffOfGroup = (g) =>
    S().users.filter(
      (u) =>
        u.status === 'Active' &&
        (g === 'Facility' ? u.role === 'fmo' : g === 'IT' ? u.role === 'it' : u.role === 'admin'),
    );
  const admins = () => S().users.filter((u) => u.role === 'admin');
  const me = () => App.metrics.user(S().user);
  const roleNow = () => S().role;
  const canStaffEditTicket = (t) => ['fmo', 'it', 'admin'].includes(roleNow()) && (roleNow() === 'admin' || t.assigneeId === S().user);

  /* ---------- session ---------- */
  // Sets who is signed in. The role always comes from the person's own record, never from the caller.
  function setUser(userId) {
    const u = App.metrics.user(userId);
    if (!u) return fail('Unknown user');
    S().role = u.role;
    S().user = u.id;
    App.store.commit(['role', 'user']);
    return ok('Signed in');
  }
  function setTheme(t) {
    S().theme = t;
    App.store.commit(['theme']);
  }
  function updateSettings(patch) {
    Object.assign(S().settings, patch);
    App.store.commit(['settings']);
    return ok('Settings saved.');
  }
  function resetDemoData() {
    App.store.reset();
    return ok('Data was reset.');
  }

  /* ---------- automation (RPA simulation): verification reminders ---------- */
  function runAutomation() {
    const keys = new Set();
    S().tickets.forEach((t) => {
      if (t.status === 'Resolved' && !t.reminded && App.clock.now() - t.resolvedAt >= 48 * H) {
        t.reminded = true;
        notify(t.reporterId, 'warning', `Reminder: please confirm whether ticket #${t.id} is resolved.`, {
          ticketId: t.id,
          topic: 'status',
        });
        audit(`Verification reminder sent for #${t.id} (automation)`, { actorId: 'system', ticketId: t.id });
        keys.add('tickets');
        keys.add('auditLog');
        keys.add('notifications');
      }
    });
    // Weekly summary: one per user in each new week (Monday to Sunday), only for users whose "Weekly summary email" alert is on.
    const wp = App.fmt.parts(App.clock.now()),
      week = App.fmt.addDays(App.fmt.ymd(App.clock.now()), -((wp.wd + 6) % 7));
    S()
      .users.filter((u) => u.status === 'Active')
      .forEach((u) => {
        const pr = App.userPrefs.getFor(u.id);
        if (!pr.topics.digest || pr.digestWeek === week) return;
        App.userPrefs.setFor(u.id, { digestWeek: week });
        if (!pr.digestWeek) return; // switched on this week: the first summary arrives next week
        const mine =
          u.role === 'admin'
            ? S().tickets
            : u.role === 'student'
              ? S().tickets.filter((t) => t.reporterId === u.id)
              : S().tickets.filter((t) => t.assigneeId === u.id);
        const created = mine.filter((t) => t.createdAt > App.clock.now() - 7 * 86400000).length;
        notify(
          u.id,
          'info',
          `Weekly summary: ${created} ticket${created === 1 ? '' : 's'} created in the last 7 days.`,
          { topic: 'digest' },
        );
        keys.add('notifications');
      });
    if (keys.size) App.store.commit([...keys]);
  }

  /* ---------- tickets ---------- */
  function createTicket(f) {
    const errs = App.validators.ticketForm(f);
    if (Object.keys(errs).length) return fail('Please fix the highlighted fields.', { errors: errs });
    // The reporter's category decides the routing group, and the group decides the ticket prefix (IT / FM / TR).
    const group = App.C.groupOf(f.category);
    const now = App.clock.now();
    const year = App.ids.ticketYear(now);
    const key = App.ids.counterKey(group, year);
    const counters = S().counters || (S().counters = {});
    const prefix = App.ids.ticketPrefix(group);
    // Always reconcile the saved counter with the actual tickets. A stale
    // localStorage counter must never cause a new ticket to reuse a number.
    const existingMax = S().tickets.reduce((max, ticket) => {
      const parsed = App.ids.sequenceFromTicketNo(ticket.ticketNo || ticket.id);
      return parsed && parsed.prefix === prefix && parsed.year === year ? Math.max(max, parsed.sequence) : max;
    }, 0);
    const previousCounter = Number(counters[key]) || 0;
    // The ticket records are authoritative. A stale cached counter must not
    // make the next ticket jump forward or reuse an older number.
    const reconciledCounter = existingMax;
    counters[key] = reconciledCounter;
    const previousNextId = Number(counters.nextTicketId) || 0;
    const maxInternal = S().tickets.reduce((max, ticket) => Math.max(max, Number(ticket.ticketId) || 0), 0);
    const internalId = previousNextId > maxInternal ? previousNextId : maxInternal + 1;
    const existingNumbers = new Set(S().tickets.map((ticket) => String(ticket.ticketNo || ticket.id)));
    let sequence = reconciledCounter + 1;
    let ticketNo = App.ids.ticketNo(group, year, sequence);
    // Keep legacy records untouched, but never create a new public duplicate.
    while (existingNumbers.has(ticketNo)) {
      sequence += 1;
      ticketNo = App.ids.ticketNo(group, year, sequence);
    }
    counters[key] = sequence;
    counters.nextTicketId = internalId + 1;
    const t = {
      // `id` remains the public alias used by current UI routes.
      id: ticketNo,
      ticketId: internalId,
      ticketNo,
      ticketYear: year,
      ticketSeq: sequence,
      groupCode: prefix,
      category: f.category,
      title: String(f.title || '').trim(),
      description: f.description.trim(),
      group,
      status: 'Pending',
      locationId: f.locationId,
      reporterId: S().user,
      assigneeId: null,
      createdAt: now,
      updatedAt: now,
      reopenCount: 0,
      attachments: (f.attachments || []).map((a) => Object.assign({ addedById: S().user, addedAt: now }, a)),
      notes: [],
      timeline: [{ status: 'Pending', at: now, byId: S().user }],
    };
    const beforeAudit = S().auditLog.length;
    const beforeNotifications = S().notifications.length;
    try {
      S().tickets.unshift(t);
      const routed = 'the Administrator';
      audit(`Ticket #${ticketNo} submitted`, { ticketId: ticketNo });
      audit('Sent to the Administrator for assignment', {
        actorId: 'system',
        ticketId: ticketNo,
        details: 'RPA simulation',
      });
      notify(S().user, 'success', `Your ticket #${ticketNo} has been submitted and is pending review.`, { ticketId: ticketNo, topic: 'status' });
      staffOfGroup('Triage').forEach((u) =>
        notify(u.id, 'info', `Ticket #${ticketNo} is pending assignment: ${App.fmt.ticketTitle(t)}`, {
          ticketId: ticketNo,
          topic: 'assigned',
        }),
      );
      App.store.commit(['tickets', 'counters', 'auditLog', 'notifications']);
      return ok('Ticket submitted successfully.', { ticket: t, routed });
    } catch (e) {
      // Model the database transaction boundary locally: a failed write puts
      // the counter and related arrays back exactly as they were.
      const index = S().tickets.indexOf(t);
      if (index >= 0) S().tickets.splice(index, 1);
      counters[key] = previousCounter;
      if (previousNextId) counters.nextTicketId = previousNextId;
      else delete counters.nextTicketId;
      S().auditLog.splice(0, Math.max(0, S().auditLog.length - beforeAudit));
      S().notifications.splice(0, Math.max(0, S().notifications.length - beforeNotifications));
      return fail('Ticket could not be saved. Please try again.');
    }
  }

  // State machine (spec 7). Anything not in this table is rejected, both here and by hiding the button in the UI.
  const TRANSITIONS = {
    accept: { from: ['Pending'], to: 'Assigned' },
    assign: { from: ['Pending', 'Reopened'], to: 'Assigned' },
    start: { from: ['Assigned'], to: 'In Progress' },
    resolve: { from: ['In Progress'], to: 'Resolved' },
    verify: { from: ['Resolved'], to: 'Closed / Verified' },
    reopen: { from: ['Resolved'], to: 'Reopened' },
    reaccept: { from: ['Reopened'], to: 'Assigned' },
    reassign: { from: ['Assigned', 'In Progress'], to: 'Assigned' },
  };

  // Who may do what (also used by the UI to decide which buttons to show).
  function can(action, t, user, role) {
    user = user || S().user;
    role = role || roleNow();
    const tr = TRANSITIONS[action];
    if (!tr || !tr.from.includes(t.status)) return false;
    const isAssignee = t.assigneeId === user;
    switch (action) {
      case 'accept':
        // Technicians cannot self-assign: they see tickets routed to their group, and only the Administrator assigns them.
        return role === 'admin';
      case 'assign':
        return role === 'admin';
      case 'reassign':
        return role === 'admin';
      case 'start':
        return (isAssignee && (role === 'fmo' || role === 'it')) || role === 'admin';
      case 'resolve':
        return (isAssignee && (role === 'fmo' || role === 'it')) || role === 'admin';
      case 'reaccept':
        return (isAssignee && (role === 'fmo' || role === 'it')) || role === 'admin';
      case 'verify':
      case 'reopen':
        return t.reporterId === user;
      default:
        return false;
    }
  }

  // FMO and IT technicians never see a Triage ticket until the Administrator assigns it to them (assigning also moves it to their group).
  function canSee(t, user, role) {
    user = user || S().user;
    role = role || roleNow();
    if (role !== 'fmo' && role !== 'it') return true;
    if (t.group === 'Triage') return t.assigneeId === user;
    // A ticket that started as Triage (TR number) is only for the team it was assigned to, even by direct link.
    const own = role === 'fmo' ? 'Facility' : 'IT';
    if (/^TR-/.test(String(t.ticketNo || t.id)) && t.group !== own) return t.assigneeId === user;
    return t.group === own || t.assigneeId === user;
  }

  function transitionTicket(id, action, payload) {
    payload = payload || {};
    const t = App.metrics.ticket(id);
    if (!t) return fail('Ticket not found.');
    const tr = TRANSITIONS[action];
    if (!tr || !tr.from.includes(t.status))
      return fail(`Not allowed: a ${t.status} ticket cannot be changed this way.`);
    if (!can(action, t)) return fail('You do not have permission for this action.');
    const now = App.clock.now();
    const prevAssignee = t.assigneeId;
    const notifyReporter = (type, msg) => notify(t.reporterId, type, msg, { ticketId: id, topic: 'status' });

    if (action === 'accept') {
      t.assigneeId = roleNow() === 'admin' ? payload.assigneeId || S().user : S().user;
      const acceptedBy = App.metrics.user(t.assigneeId);
      t.assignedTeam = acceptedBy && acceptedBy.role === 'fmo' ? 'Facility' : acceptedBy && acceptedBy.role === 'it' ? 'IT' : t.group;
      if (t.group === 'Triage' && t.assignedTeam !== 'Triage') t.group = t.assignedTeam;
      audit(`Ticket #${id} assigned to ${nm(t.assigneeId)}`, { ticketId: id });
      notifyReporter('info', `Ticket #${id} was assigned to ${nm(t.assigneeId)}.`);
      notify(t.assigneeId, 'info', `Ticket #${id} is now assigned to you.`, { ticketId: id, topic: 'assigned' });
    } else if (action === 'assign' || action === 'reassign') {
      const assignedTo = payload.assigneeId && App.metrics.user(payload.assigneeId);
      const validAssignee = assignedTo && assignedTo.status === 'Active' && (t.group === 'Facility' ? assignedTo.role === 'fmo' : t.group === 'IT' ? assignedTo.role === 'it' : assignedTo.role === 'fmo' || assignedTo.role === 'it');
      if (!validAssignee) return fail("Please choose an active technician from the ticket's team.");
      t.assigneeId = assignedTo.id;
      t.assignedTeam = assignedTo.role === 'fmo' ? 'Facility' : assignedTo.role === 'it' ? 'IT' : t.group;
      if (t.group === 'Triage' && t.assignedTeam !== 'Triage') t.group = t.assignedTeam;
      audit(`Ticket #${id} ${action === 'assign' ? 'assigned' : 'reassigned'} to ${nm(t.assigneeId)}`, {
        ticketId: id,
      });
      notifyReporter(
        'info',
        `Ticket #${id} was ${action === 'assign' ? 'assigned' : 'reassigned'} to ${nm(t.assigneeId)}.`,
      );
      notify(t.assigneeId, 'info', `Ticket #${id} is now assigned to you.`, { ticketId: id, topic: 'assigned' });
      if (action === 'reassign' && prevAssignee && prevAssignee !== t.assigneeId)
        notify(prevAssignee, 'info', `Ticket #${id} was reassigned to ${nm(t.assigneeId)}.`, {
          ticketId: id,
          topic: 'assigned',
        });
    } else if (action === 'start') {
      audit(`Status changed to In Progress (#${id})`, { ticketId: id });
      notifyReporter('info', `Ticket #${id} is now In Progress.`);
    } else if (action === 'resolve') {
      const note = (payload.note || '').trim();
      if (note.length < 5)
        return fail('A resolution note is required (at least 5 characters).', {
          errors: { note: 'Please describe what was done to fix the problem.' },
        });
      t.resolutionNote = note;
      t.resolvedAt = now;
      audit(`Resolution added to #${id}`, { ticketId: id, details: note });
      notifyReporter('success', `Ticket #${id} has been resolved and requires your verification.`);
    } else if (action === 'verify') {
      t.closedAt = now;
      audit(`Reporter confirmed resolution of #${id}`, { ticketId: id });
      [t.assigneeId, ...admins().map((a) => a.id)].forEach((u) =>
        notify(u, 'success', `Ticket #${id} was verified and closed by the reporter.`, {
          ticketId: id,
          topic: 'status',
        }),
      );
    } else if (action === 'reopen') {
      const fb = (payload.feedback || '').trim();
      if (fb.length < 10)
        return fail('Please tell us what is still wrong (at least 10 characters).', {
          errors: { feedback: 'Feedback needs at least 10 characters.' },
        });
      t.feedback = fb;
      t.reopenCount += 1;
      t.resolvedAt = undefined;
      audit(`Ticket #${id} reopened by reporter`, { ticketId: id, details: fb });
      [t.assigneeId, ...admins().map((a) => a.id)].forEach((u) =>
        notify(u, 'warning', `Ticket #${id} was reopened: the issue still exists.`, { ticketId: id, topic: 'status' }),
      );
    } else if (action === 'reaccept') {
      audit(`Ticket #${id} re-accepted by ${nm(t.assigneeId)}`, { ticketId: id });
      notifyReporter('info', `Ticket #${id} was re-accepted and will be worked on again.`);
    }
    t.status = tr.to;
    t.updatedAt = now;
    t.timeline.push({ status: tr.to, at: now, byId: S().user });
    App.store.commit(['tickets', 'auditLog', 'notifications']);
    const msgs = {
      accept: 'Ticket accepted and assigned to you.',
      assign: 'Ticket assigned successfully.',
      reassign: 'Ticket reassigned successfully.',
      start: 'Status updated.',
      resolve: 'Ticket marked as resolved.',
      verify: 'Thank you! The ticket is now Closed / Verified.',
      reopen: 'Ticket reopened.',
      reaccept: 'Ticket re-accepted.',
    };
    return ok(msgs[action]);
  }

  function addNote(id, text, visibility) {
    const t = App.metrics.ticket(id);
    if (!t) return fail('Ticket not found.');
    text = (text || '').trim();
    if (text.length < 3)
      return fail('Please write a note first.', { errors: { note: 'Notes need at least 3 characters.' } });
    if (!canStaffEditTicket(t)) return fail('Only the assigned staff member or an administrator can add notes.');
    t.notes.push({
      id: App.ids.uid('note'),
      authorId: S().user,
      text,
      visibility: visibility === 'public' ? 'public' : 'internal',
      createdAt: App.clock.now(),
    });
    t.updatedAt = App.clock.now();
    audit(`Note added to #${id} (${visibility === 'public' ? 'visible to reporter' : 'internal'})`, { ticketId: id });
    if (visibility === 'public')
      notify(t.reporterId, 'info', `A new note was added to ticket #${id}.`, { ticketId: id, topic: 'status' });
    App.store.commit(['tickets', 'auditLog', 'notifications']);
    return ok('Note added.');
  }

  function addAttachment(id, meta) {
    const t = App.metrics.ticket(id);
    if (!t) return fail('Ticket not found.');
    if (!canStaffEditTicket(t)) return fail('Only the assigned staff member or an administrator can add attachments.');
    t.attachments.push(Object.assign({ addedById: S().user, addedAt: App.clock.now() }, meta));
    audit(`Attachment added to #${id}: ${meta.name}`, { ticketId: id });
    App.store.commit(['tickets', 'auditLog']);
    return ok('File uploaded.');
  }
  function removeAttachment(id, attId) {
    const t = App.metrics.ticket(id);
    if (!t) return fail('Ticket not found.');
    if (!canStaffEditTicket(t)) return fail('Only the assigned staff member or an administrator can remove attachments.');
    const a = t.attachments.find((x) => x.id === attId);
    t.attachments = t.attachments.filter((x) => x.id !== attId);
    audit(`Attachment removed from #${id}${a ? ': ' + a.name : ''}`, { ticketId: id });
    App.store.commit(['tickets', 'auditLog']);
    return ok('Attachment removed.', { type: 'info' });
  }

  /* ---------- ticket scheduling ---------- */
  const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  // Two ranges conflict when start < other.end && end > other.start (same date and location).
  function findConflicts(locationId, date, start, end, ignoreId) {
    const wd = App.fmt.weekdayOf(date);
    const a = toMin(start),
      b = toMin(end);
    return S()
      .schedules.filter((s) => {
        if (s.id === ignoreId || s.locationId !== locationId) return false;
        if (s.kind === 'class' ? s.weekday !== wd : s.date !== date) return false;
        return a < toMin(s.end) && b > toMin(s.start);
      })
      .map(App.sched.hydrate);
  }

  const affectedStudents = (locationId) => {
    const open = new Set(
      S()
        .tickets.filter((t) => t.locationId === locationId && App.metrics.isActive(t))
        .map((t) => t.reporterId),
    );
    return S().users.filter((u) => u.role === 'student' && (u.usualLocationId === locationId || open.has(u.id)));
  };

  // Gives an open ticket a date and time. The ticket keeps its own status; only the planned slot is stored here.
  function scheduleTicket(f, force) {
    const errs = App.validators.scheduleForm(f);
    const t = f.ticketId && S().tickets.find((x) => x.id === f.ticketId);
    if (f.ticketId && !t) errs.ticketId = 'That ticket no longer exists.';
    if (t && !App.sched.isOpen(t)) errs.ticketId = 'Only open tickets can be scheduled.';
    if (Object.keys(errs).length) return fail('Please fix the highlighted fields.', { errors: errs });
    const conflicts = findConflicts(t.locationId, f.date, f.start, f.end);
    if (conflicts.length && !force)
      return {
        ok: false,
        needsConfirm: true,
        conflicts,
        type: 'warning',
        msg: 'This time conflicts with existing items.',
      };
    const block = {
      id: App.ids.uid('sch'),
      kind: 'ticket',
      ticketId: t.id,
      ticketInternalId: t.ticketId,
      locationId: t.locationId,
      date: f.date,
      start: f.start,
      end: f.end,
      conflict: conflicts.length > 0,
    };
    S().schedules.push(block);
    const where = App.metrics.locName(t.locationId);
    const when = `${App.fmt.dateStrLabel(f.date)}, ${App.fmt.hhmm(f.start)} to ${App.fmt.hhmm(f.end)}`;
    const link = { scheduleId: block.id, ticketId: t.id, topic: 'schedule' };
    notify(t.assigneeId, 'info', `Ticket #${t.id} is scheduled for you at ${where} on ${when}.`, link);
    // Affected users: usual location matches, or an open ticket at that location.
    affectedStudents(t.locationId)
      .filter((u) => u.id !== t.assigneeId)
      .forEach((u) => notify(u.id, 'info', `Ticket #${t.id} is scheduled for ${where}: ${when}.`, link));
    audit(`Ticket #${t.id} scheduled at ${where} (${when})`, { scheduleId: block.id, ticketId: t.id });
    App.store.commit(['schedules', 'notifications', 'auditLog']);
    return ok('Ticket scheduled.', { block });
  }

  /* ---------- notifications ---------- */
  function markNotificationRead(id) {
    const n = S().notifications.find((x) => x.id === id && x.userId === S().user);
    if (n && !n.read) {
      n.read = true;
      App.store.commit(['notifications']);
    }
  }
  function markAllRead() {
    S().notifications.forEach((n) => {
      if (n.userId === S().user) n.read = true;
    });
    App.store.commit(['notifications']);
    return ok('All notifications marked as read.');
  }
  function dismissNotification(id) {
    const list = S().notifications;
    const index = list.findIndex((n) => n.id === id && n.userId === S().user);
    if (index < 0) return fail('Notification not found.');
    const notification = list.splice(index, 1)[0];
    App.store.commit(['notifications']);
    return ok('Notification dismissed.', { notification, index });
  }

  App.actions = {
    setUser,
    setTheme,
    updateSettings,
    resetDemoData,
    runAutomation,
    createTicket,
    transitionTicket,
    can,
    canSee,
    TRANSITIONS,
    addNote,
    addAttachment,
    removeAttachment,
    findConflicts,
    scheduleTicket,
    markNotificationRead,
    markAllRead,
    dismissNotification,
    staffOfGroup,
  };
})();
