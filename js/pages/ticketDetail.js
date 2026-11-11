/* Ticket detail: header, description, attachments, timeline, activity history, notes, resolution, verification and role-based actions.
   Only the actions valid for the current role AND status are shown (App.actions.can mirrors the store's state-machine rules). */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const S = () => App.store.state;

  const gone = (title, msg) =>
    `<div class="card not-avail"><div class="empty">${App.icon('search')}</div><h1 class="page-title" id="page-h1" tabindex="-1">${title}</h1><p class="muted">${msg}</p><a class="btn" href="#/dashboard">Go to dashboard</a></div>`;

  function actionsHtml(t) {
    const A = App.actions,
      role = S().role,
      me = S().user;
    const isStaff = role === 'fmo' || role === 'it' || role === 'admin';
    const mine = t.assigneeId === me || role === 'admin';
    const b = (act, label, cls, icon, testid, arg) =>
      `<button type="button" class="btn ${cls || ''}" data-tact="${act}" data-id="${esc(t.id)}" ${arg ? `data-arg="${esc(arg)}"` : ''} data-testid="${testid || act + '-ticket'}">${App.icon(icon)}${label}</button>`;
    const out = [];
    if (A.can('accept', t) && role !== 'admin')
      out.push(b('accept', 'Accept (self-assign)', '', 'user', 'accept-ticket'));
    if (A.can('assign', t) || A.can('reassign', t))
      out.push(b('assign', t.assigneeId ? 'Reassign Ticket' : 'Assign Ticket', 'accent', 'users', 'assign-ticket'));
    if (A.can('start', t)) out.push(b('start', 'Start Work (In Progress)', '', 'milestone', 'start-work'));
    if (A.can('reaccept', t)) out.push(b('reaccept', 'Re-accept', '', 'rotate', 'reaccept-ticket'));
    if (A.can('resolve', t)) out.push(b('resolve', 'Mark Resolved', 'success', 'check', 'mark-resolved'));
    if (isStaff && mine && t.status !== 'Closed / Verified') {
      out.push(
        b('note', 'Add Note', 'quiet', 'edit', 'add-note'),
        b('upload', 'Upload Photo', 'quiet', 'camera', 'upload-photo', 'repair-photo'),
        b('upload', 'Upload Video', 'quiet', 'video', 'upload-video', 'repair-video'),
      );
    }
    return out.length
      ? `<div class="row" data-testid="ticket-actions">${out.join('')}</div>`
      : '<p class="muted small m-0">No actions are available for you on this ticket right now.</p>';
  }

  // Room schedule for technicians and admins: what is happening in the ticket's room today and when it is next free,
  // so they know when they may start the repair. Students and Faculty never see this panel.
  function roomHtml(t) {
    const today = App.fmt.ymd(App.clock.now());
    const items = App.sched.itemsOn(today, t.locationId).filter(App.sched.live);
    const free = App.sched.freeSlots(t.locationId, today);
    const nf = App.sched.nextFree(t.locationId, 60, 5);
    const link = `#${S().role === 'admin' ? '/schedules' : '/scheduled'}?room=${encodeURIComponent(t.locationId)}`;
    return `<section class="card" aria-labelledby="rs-h" data-testid="room-schedule"><h2 id="rs-h">Room schedule</h2>
      <p class="muted small">${esc(App.metrics.locName(t.locationId))}, today ${esc(App.fmt.dateStrLabel(today))} ${App.badges.futureTag()}</p>
      ${nf ? `<div class="banner info">${App.icon('sparkle')}<div class="grow"><b>You may start:</b> ${esc(App.fmt.dayLabel(nf.date))}, ${esc(App.fmt.hhmm(nf.slot.start))} to ${esc(App.fmt.hhmm(nf.slot.end))}</div></div>` : '<p class="muted">No free period of an hour or more in the next 5 days.</p>'}
      <h3 class="mt-3">Booked today</h3>${items.length ? `<ul class="feed">${items.map((i) => `<li><b>${esc(App.fmt.hhmm(i.start))} to ${esc(App.fmt.hhmm(i.end))}</b> ${esc(App.sched.describe(i))} <span class="muted small">(${i.kind === 'class' ? 'class' : 'ticket'})</span></li>`).join('')}</ul>` : '<p class="muted">Nothing booked today.</p>'}
      <h3>Free today</h3><div class="room-free">${free.length ? free.map((f) => `<span class="ev ev-avail">${App.icon('check')} ${esc(App.fmt.hhmm(f.start))} to ${esc(App.fmt.hhmm(f.end))}</span>`).join('') : '<span class="muted">Fully booked.</span>'}</div>
      <p class="mt-3 mb-0"><a class="btn sm secondary" href="${link}" data-testid="room-schedule-link">${App.icon('calendar')}Open room schedule</a></p></section>`;
  }

  function verifyHtml(t) {
    if (t.status !== 'Resolved' || t.reporterId !== S().user) return '';
    return `<div class="verify-box" role="region" aria-label="Verify the repair" data-testid="verify-box"><h3>Is your issue resolved?</h3><p>The technician marked this ticket as resolved. Please confirm.</p>
      <div class="row"><button type="button" class="btn success" data-tact="verify" data-id="${esc(t.id)}" data-testid="verify-yes">${App.icon('check')}YES, ISSUE RESOLVED</button><button type="button" class="btn danger" data-tact="reopen" data-id="${esc(t.id)}" data-testid="verify-no">${App.icon('rotate')}NO, ISSUE STILL EXISTS</button></div></div>`;
  }

  App.pages.ticketDetail = {
    title: (ctx) => {
      const t = App.metrics.ticket(ctx.params.id);
      return t ? `Ticket ${t.id}` : 'Ticket not found';
    },
    render(ctx) {
      const t = App.metrics.ticket(ctx.params.id),
        M = App.metrics,
        role = S().role;
      if (!t) return gone('Ticket not found', `There is no ticket "${esc(ctx.params.id)}".`);
      if (role === 'student' && t.reporterId !== S().user)
        return gone('Not available for your role', 'Students and faculty can only open their own tickets.');
      if (!App.actions.canSee(t))
        return gone('Not available for your role', 'This ticket is still with the Administrator for triage. You will see it once it is assigned to you.');
      const staff = role !== 'student';
      const loc = M.loc(t.locationId);
      const notes = t.notes.filter((n) => staff || n.visibility === 'public');
      const activity = S().auditLog.filter((a) => a.ticketId === t.id);
      const recur = staff ? M.recurringCount(t.category, t.locationId) : 0;
      const resp = t.attachments;
      const repairAttachments = resp.filter((attachment) => String(attachment.kind || '').startsWith('repair-'));
      const reporterAttachments = resp.filter((attachment) => !String(attachment.kind || '').startsWith('repair-'));
      const attachmentGroup = (testid, heading, items, emptyMessage) => `<section class="attachment-group" data-testid="${testid}" aria-labelledby="${testid}-heading">
        <h3 id="${testid}-heading">${heading} (${items.length})</h3>
        ${items.length ? `<div class="attach-grid" data-testid="${testid}-grid">${items.map((attachment) => App.uploader.thumb(attachment)).join('')}</div>` : `<p class="muted">${emptyMessage}</p>`}
      </section>`;
      return `
      <div class="page-head"><div class="grow"><h1 class="page-title" id="page-h1" tabindex="-1">Ticket #${esc(t.id)}</h1>
        <div class="row sub-row">${App.badges.statusBadge(t.status)}</div></div></div>
      <div class="detail-grid main-side">
        <div class="stack minw-0">
          <section class="card" aria-labelledby="td-h"><h2 id="td-h">Details</h2>
            <dl class="kv">
              ${t.category ? `<dt>Category</dt><dd>${App.icon(App.badges.catIcon(t.category))} ${esc(t.category)}${t.problemType ? ` <span class="muted">(${esc(t.problemType)})</span>` : ''}</dd>` : ''}
              <dt>Location</dt><dd>${esc(M.locName(t.locationId))} <span class="muted">(${esc(t.locationId)}${loc ? ', ' + esc(loc.building) : ''})</span></dd>
              <dt>Reporter</dt><dd>${esc(M.userName(t.reporterId))}</dd>
              <dt>Assigned to</dt><dd>${t.assigneeId ? esc(M.userName(t.assigneeId)) : '<span class="muted">Unassigned</span>'}</dd>
              <dt>Group</dt><dd>${esc(t.group === 'Triage' ? 'Triage (Administrator assigns)' : t.group || 'Unassigned')}</dd>
              <dt>Submitted</dt><dd>${esc(App.fmt.dateTime(t.createdAt))}</dd>
              <dt>Last updated</dt><dd>${esc(App.fmt.dateTime(t.updatedAt))} <span class="muted">(${esc(App.fmt.ago(t.updatedAt))})</span></dd>
              ${t.reopenCount ? `<dt>Reopened</dt><dd>${t.reopenCount} time(s)</dd>` : ''}
            </dl>
            <h3 class="mt-4">Description</h3><p>${esc(t.description)}</p>
            ${t.feedback ? `<div class="banner warn">${App.icon('rotate')}<div class="grow"><b>Reporter feedback (reopened):</b> ${esc(t.feedback)}</div></div>` : ''}
          </section>
          ${verifyHtml(t)}
          <section class="card" aria-labelledby="tl-h"><h2 id="tl-h">Progress</h2>${App.timeline.html(t)}</section>
          <section class="card" aria-labelledby="at-h" data-testid="attachments"><h2 id="at-h">Attachments (${resp.length})</h2>
            ${attachmentGroup('attachments-reporter', 'Student/report attachments', reporterAttachments, 'No student/report attachments.')}
            ${attachmentGroup('attachments-technician', 'Technician repair attachments', repairAttachments, 'No technician repair attachments.')}
          </section>
          ${t.resolutionNote ? `<section class="card" aria-labelledby="rn-h"><h2 id="rn-h">Resolution note</h2><p data-testid="resolution-text">${esc(t.resolutionNote)}</p></section>` : ''}
          <section class="card" aria-labelledby="nt-h"><h2 id="nt-h">${staff ? 'Technician notes' : 'Notes from the technician'}</h2>
            ${notes.length ? notes.map((n) => `<div class="note ${n.visibility}"><div class="small muted">${esc(M.userName(n.authorId))} &middot; ${esc(App.fmt.dateTime(n.createdAt))} &middot; ${n.visibility === 'public' ? 'Visible to reporter' : 'Internal'}</div>${esc(n.text)}</div>`).join('') : '<p class="muted">No notes yet.</p>'}</section>
        </div>
        <aside class="stack minw-0">
          <section class="card" aria-labelledby="ac-h"><h2 id="ac-h">Actions</h2>${actionsHtml(t)}</section>
          ${staff && t.status !== 'Closed / Verified' ? roomHtml(t) : ''}
          ${staff && t.category ? `<section class="card"><h3>Recurring check</h3><p class="m-0"><b data-testid="recurring-count">${recur}</b> ${esc(t.category)} reports at ${esc(M.locName(t.locationId))} in the last 90 days.</p></section>` : ''}
          <section class="card" aria-labelledby="ah-h"><h2 id="ah-h">Activity history</h2>
            ${activity.length ? `<ul class="feed" data-testid="ticket-activity">${activity.map((a) => `<li class="${a.actorId === 'system' ? 'sys' : ''}"><div>${esc(a.action)}</div><div class="when">${esc(M.userName(a.actorId))} &middot; ${esc(App.fmt.dateTime(a.at))}</div></li>`).join('')}</ul>` : '<p class="muted">No activity.</p>'}</section>
        </aside>
      </div>`;
    },
    mount(el) {
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-tact]');
        if (a) {
          App.ticketActions.run(a.dataset.tact, a.dataset.id, a.dataset.arg);
          return;
        }
        const v = e.target.closest('[data-view-att]');
        if (v) App.uploader.viewAttachment(v.dataset.viewAtt);
      });
    },
  };
})();
