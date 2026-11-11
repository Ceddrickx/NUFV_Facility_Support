/* Role-based ticket actions as modals / direct calls. Used by ticket tables, dashboards, assignments and the detail page.
   The store re-checks every transition, so a hidden button is never the only protection. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const toast = (r) => App.toast.fromResult(r);

  // Auto-routed suggestion: the least-loaded active person of the ticket's group (RPA simulation).
  function candidates(t) {
    const S = App.store.state;
    const role = t.group === 'Facility' ? 'fmo' : t.group === 'IT' ? 'it' : null;
    return S.users.filter(
      (u) => u.status === 'Active' && (role ? u.role === role : u.role === 'fmo' || u.role === 'it'),
    );
  }
  function suggestion(t) {
    const w = App.metrics.workload();
    return candidates(t)
      .map((u) => ({ u, n: (w.find((x) => x.user.id === u.id) || { active: 0 }).active }))
      .sort((a, b) => a.n - b.n)[0];
  }

  function assign(id) {
    const t = App.metrics.ticket(id);
    if (!t) return;
    const w = App.metrics.workload();
    const sug = suggestion(t);
    const reassign = !!t.assigneeId;
    const list = candidates(t);
    const body = `<p><b>#${esc(t.id)}</b> ${esc(App.fmt.ticketTitle(t))}</p>
      <div class="banner info mb-4">${App.icon('sparkle')}<div class="grow"><b>Auto-routed suggestion:</b> ${esc(sug ? sug.u.name : 'none')} ${App.badges.simTag('UI Simulation')}<br><span class="small muted">${t.category ? `Routed by category (${esc(t.category)} to ${esc(t.group === 'Triage' ? 'Administrator triage' : t.group)}). ` : 'Sent to the Administrator for assignment. '}Suggestion picks the person with the fewest active tickets. You may change it.</span></div></div>
      ${App.ui.field(
        'as-who',
        reassign ? 'Reassign to' : 'Assign to',
        `<select class="select" id="as-who" data-testid="assign-select">${App.ui.options(
          list.map((u) => ({
            value: u.id,
            label: `${u.name} (${(w.find((x) => x.user.id === u.id) || { active: 0 }).active} active)${sug && u.id === sug.u.id ? ' - suggested' : ''}`,
          })),
          (sug && sug.u.id) || '',
          'Select a person',
        )}</select>`,
        { required: true },
      )}`;
    const h = App.modal.open({
      title: reassign ? 'Reassign Ticket' : 'Assign Ticket',
      body,
      testid: 'assign-modal',
      footer: [
        { label: 'Cancel', cls: 'secondary' },
        {
          label: reassign ? 'Reassign' : 'Assign',
          testid: 'assign-confirm',
          onClick: (hh) => {
            const who = hh.el.querySelector('#as-who').value;
            const r = App.actions.transitionTicket(id, reassign ? 'reassign' : 'assign', { assigneeId: who });
            if (!r.ok) {
              App.ui.showErrors(hh.el, { 'as-who': r.msg });
              return false;
            }
            toast(r);
          },
        },
      ],
    });
    return h;
  }

  function uploadControls(host, kind, o) {
    return App.uploader.create(host, Object.assign({ kind }, o || {}));
  }

  function resolve(id) {
    const t = App.metrics.ticket(id);
    if (!t) return;
    const body = `${App.ui.field('rs-note', 'Resolution note', '<textarea class="textarea" id="rs-note" maxlength="1000" placeholder="What was done to fix the problem?" data-testid="resolution-note"></textarea>', { required: true, help: 'The reporter will see this note.' })}
      <h3>Repair photo <span class="muted small">(optional)</span></h3><div id="rs-photo"></div>
      <h3 class="mt-4">Repair video <span class="muted small">(optional)</span> ${App.badges.futureTag()}</h3><div id="rs-video"></div>`;
    let pc, vc;
    App.modal.open({
      title: 'Mark Resolved',
      body,
      wide: true,
      testid: 'resolve-modal',
      onOpen: (hh) => {
        pc = uploadControls(hh.el.querySelector('#rs-photo'), 'repair-photo');
        vc = uploadControls(hh.el.querySelector('#rs-video'), 'repair-video');
      },
      footer: [
        { label: 'Cancel', cls: 'secondary' },
        {
          label: 'Mark Resolved',
          cls: 'success',
          testid: 'resolve-confirm',
          onClick: (hh) => {
            if (!pc.ready() || !vc.ready()) {
              App.toast.show('Please wait for the upload to finish.', 'warning');
              return false;
            }
            const r = App.actions.transitionTicket(id, 'resolve', { note: hh.el.querySelector('#rs-note').value });
            if (!r.ok) {
              App.ui.showErrors(hh.el, { 'rs-note': (r.errors && r.errors.note) || r.msg });
              return false;
            }
            [...pc.metadata(), ...vc.metadata()].forEach((m) => App.actions.addAttachment(id, m));
            toast(r);
          },
        },
      ],
    });
  }

  function note(id) {
    const body = `${App.ui.field('nt-text', 'Technical note', '<textarea class="textarea" id="nt-text" maxlength="1000" data-testid="note-text"></textarea>', { required: true })}
      <label class="check"><input type="checkbox" id="nt-pub" data-testid="note-visible"> Visible to reporter <span class="muted small">(internal by default)</span></label>`;
    App.modal.open({
      title: 'Add Note',
      body,
      testid: 'note-modal',
      footer: [
        { label: 'Cancel', cls: 'secondary' },
        {
          label: 'Add Note',
          testid: 'note-save',
          onClick: (hh) => {
            const r = App.actions.addNote(
              id,
              hh.el.querySelector('#nt-text').value,
              hh.el.querySelector('#nt-pub').checked ? 'public' : 'internal',
            );
            if (!r.ok) {
              App.ui.showErrors(hh.el, { 'nt-text': (r.errors && r.errors.note) || r.msg });
              return false;
            }
            toast(r);
          },
        },
      ],
    });
  }

  function upload(id, kind) {
    // kind: 'repair-photo' | 'repair-video'
    let c;
    App.modal.open({
      title: kind === 'repair-video' ? 'Upload Repair Video' : 'Upload Repair Photo',
      testid: 'upload-modal',
      wide: true,
      body: `${kind === 'repair-video' ? App.badges.futureTag() : ''}<div id="up-host"></div>`,
      onOpen: (hh) => {
        c = uploadControls(hh.el.querySelector('#up-host'), kind);
      },
      footer: [
        { label: 'Cancel', cls: 'secondary', onClick: () => c.destroy() },
        {
          label: 'Save',
          testid: 'upload-save',
          onClick: () => {
            if (!c.ready()) {
              App.toast.show('Please wait for the upload to finish.', 'warning');
              return false;
            }
            const m = c.metadata();
            if (!m.length) {
              App.toast.show('Please add a file first.', 'warning');
              return false;
            }
            m.forEach((x) => App.actions.addAttachment(id, x));
          },
        },
      ],
    });
  }

  function verify(id) {
    App.modal.confirm({
      title: 'Confirm Resolution',
      testid: 'verify-modal',
      body: '<p>Are you sure the issue is fixed? The ticket will be marked <b>Closed / Verified</b> and added to Ticket History.</p>',
      okLabel: 'Yes, issue resolved',
      okCls: 'success',
      onOk: () => toast(App.actions.transitionTicket(id, 'verify')),
    });
  }
  function reopen(id) {
    const body = `<p>Tell us what is still wrong so the technician can fix it properly.</p>${App.ui.field('ro-fb', 'What is still not working?', '<textarea class="textarea" id="ro-fb" maxlength="500" data-testid="reopen-feedback"></textarea>', { required: true, help: 'At least 10 characters.' })}`;
    App.modal.open({
      title: 'Reopen Ticket',
      body,
      testid: 'reopen-modal',
      footer: [
        { label: 'Cancel', cls: 'secondary' },
        {
          label: 'Reopen ticket',
          cls: 'danger',
          testid: 'reopen-confirm',
          onClick: (hh) => {
            const r = App.actions.transitionTicket(id, 'reopen', { feedback: hh.el.querySelector('#ro-fb').value });
            if (!r.ok) {
              App.ui.showErrors(hh.el, { 'ro-fb': (r.errors && r.errors.feedback) || r.msg });
              return false;
            }
            toast(r);
          },
        },
      ],
    });
  }

  function run(act, id, arg) {
    const direct = { accept: 'accept', start: 'start', reaccept: 'reaccept' };
    if (direct[act]) return toast(App.actions.transitionTicket(id, act));
    const action = ({ assign, reassign: assign, resolve, note, verify, reopen, upload: (i) => upload(i, arg) })[act];
    if (!action) {
      App.toast.show('That ticket action is no longer available. Refresh the page and try again.', 'warning');
      return;
    }
    action(id);
  }

  App.ticketActions = { run, assign, resolve, note, upload, verify, reopen, suggestion };
})();
