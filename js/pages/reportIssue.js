/* Report Issue wizard (5 steps + success screen: Location, Category, Details, Photos, Review, Submitted). All step panels live in the DOM at once and are only shown/hidden, so entered values,
   uploads and the scanner survive step changes AND live window resizes. The draft (without files) autosaves to nuf_draft. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};
  const esc = (s) => App.fmt.esc(s);
  const STEPS = ['Location', 'Category', 'Details', 'Attachments', 'Review', 'Submitted'];
  const FIELD_STEP = { location: 1, category: 2, title: 3, description: 3, photos: 4 };
  const REVIEW = 5,
    DONE = 6;
  const DRAFT_VERSION = 3; // older drafts have a different step order and are never resumed at their old step
  // Step 2 first asks for the kind of problem (three boxes), then shows only that group's categories. "Something Else" stays selected on the three boxes.
  const GROUP_BOX = [
    ['IT', 'Technology / IT Support'],
    ['Facility', 'Building & Facilities'],
    ['Triage', 'Something Else'],
  ];
  let photo = null;
  let video = null;
  const destroyUploads = () => {
    photo && photo.destroy();
    video && video.destroy();
    photo = null;
    video = null;
  };

  const blankForm = () => ({
    locationId: '',
    category: '',
    title: '',
    description: '',
  });
  function draftGet() {
    try {
      return JSON.parse(localStorage.getItem('nuf_draft'));
    } catch (e) {
      return null;
    }
  }
  function draftSet(W) {
    try {
      localStorage.setItem('nuf_draft', JSON.stringify({ v: DRAFT_VERSION, form: W.form, step: W.step, titleEdited: W.titleEdited }));
    } catch (e) {
      /* ignore */
    }
  }
  function draftClear() {
    try {
      localStorage.removeItem('nuf_draft');
    } catch (e) {
      /* ignore */
    }
  }
  const dirty = (W) =>
    !W.submitted &&
    (W.form.locationId ||
      W.form.category ||
      W.form.title ||
      W.form.description ||
      (photo && photo.items.length) ||
      (video && video.items.length));

  function requestLeave(proceed) {
    const W = App.store.session.wizard;
    if (!W || !dirty(W)) return true;
    App.modal.confirm({
      title: 'Discard this report?',
      body: '<p>Your report has not been submitted. The text and attached photos will be lost.</p>',
      okLabel: 'Discard',
      danger: true,
      cancelLabel: 'Keep editing',
      onOk: () => {
        destroyUploads();
        delete App.store.session.wizard;
        draftClear();
        proceed();
      },
    });
    return false;
  }

  // Cancel is an explicit action from inside the wizard. Clear an untouched
  // wizard immediately so the router cannot see a stale draft while changing
  // routes. Edited reports still go through the discard confirmation above.
  function cancelWizard() {
    const W = App.store.session.wizard;
    if (!W || !dirty(W)) {
      destroyUploads();
      delete App.store.session.wizard;
      draftClear();
      App.router.go('/dashboard');
      return;
    }
    requestLeave(() => App.router.go('/dashboard'));
  }

  function fresh(query) {
    const W = { step: 1, form: blankForm(), scan: null, titleEdited: false, submitted: null };
    const d = draftGet();
    if (d && d.form && !(query && (query.location || query.title || query.chat))) {
      // Only the plain text fields are carried over. A draft from the old 6-step wizard (no version, or a
      // different one) is restarted at step 1 so its old step numbers can never point at the wrong panel.
      ['locationId', 'category', 'title', 'description'].forEach((k) => {
        if (typeof d.form[k] === 'string') W.form[k] = d.form[k];
      });
      if (d.v === DRAFT_VERSION) {
        W.step = Math.min(Math.max(Number(d.step) || 1, 1), REVIEW);
        W.titleEdited = !!d.titleEdited;
      } else if (W.form.title) W.titleEdited = true;
      // a saved draft that points at a retired or unknown location starts again at the location step
      const dl = W.form.locationId && App.metrics.loc(W.form.locationId);
      if (W.form.locationId && (!dl || dl.retired)) {
        W.form.locationId = '';
        W.step = 1;
      }
    }
    if (query) {
      if (query.location && App.metrics.activeLocations().some((l) => l.id === query.location)) W.form.locationId = query.location;
      if (query.title) {
        W.form.title = String(query.title).slice(0, 100);
        W.titleEdited = true;
      }
      // Start at the first incomplete step (photos are added in the browser, so never skip past step 4).
      const e = App.validators.ticketStep(W.form, 3);
      W.step = e.location ? 1 : e.category ? 2 : e.description ? 3 : 4;
    }
    W.scan = App.qrScanner.newState(W.form, query && query.scan === '1');
    return W;
  }

  App.pages.reportIssue = {
    static: true,
    title: () => 'Report an Issue',
    requestLeave,
    canLeave(ctx, nextPath) {
      return requestLeave(() => App.router.go(nextPath));
    },
    render(ctx) {
      const old = App.store.session.wizard;
      if (!old || old.submitted || ctx.query.new || ctx.query.title || ctx.query.chat || ctx.query.location) {
        if (ctx.query.new) draftClear();
        destroyUploads();
        App.store.session.wizard = fresh(ctx.query);
      }
      return `${App.ui.pageHead('Report an Issue')}<div class="card" data-wiz data-testid="wizard"></div>`;
    },
    mount(el) {
      const W = App.store.session.wizard;
      const host = el.querySelector('[data-wiz]');
      const F = W.form;
      const reportNav = document.querySelectorAll('a[href="#/report"], a[href="#/report?new=1"]');
      reportNav.forEach((link) => link.addEventListener('click', (e) => {
        e.preventDefault();
        requestLeave(() => {
          if (location.hash === '#/report?new=1') App.router.refresh(true);
          else App.router.go('/report?new=1');
        });
      }));
      host.innerHTML = `
        <ol class="stepper" aria-label="Report progress" data-stepper></ol>
        <div class="step-compact" data-compact aria-live="polite"></div>
        <section data-step="1" aria-labelledby="s1h"><div class="step-head"><h2 id="s1h" tabindex="-1">Step 1: Where is the problem?</h2><div data-scan-tools></div></div><div data-scan></div><div class="field" data-field="location" tabindex="-1"><div class="err" role="alert">${App.icon('alert')} <span></span></div></div></section>
        <section data-step="2" aria-labelledby="s2h"><h2 id="s2h" tabindex="-1">Step 2: What kind of problem is it?</h2>
          <div data-cats></div><div class="field" data-field="category" tabindex="-1"><div class="err" role="alert">${App.icon('alert')} <span></span></div></div></section>
        <section data-step="3" aria-labelledby="s3h"><h2 id="s3h" tabindex="-1">Step 3: Tell us the details</h2>
          ${App.ui.field('rp-desc', 'Short Description', '<textarea class="textarea" id="rp-desc" minlength="10" maxlength="100" data-testid="issue-description"></textarea>', { required: true, counter: true, help: '10 to 100 characters. Describe what you see.' })}
        </section>
        <section data-step="4" aria-labelledby="s4h"><h2 id="s4h" tabindex="-1">Step 4: Add photos or a video</h2>
          <h3 class="up-head">Photos <span class="req" aria-hidden="true">*</span></h3>
          <div class="field" data-field="photos"><div data-photo></div><div class="err" role="alert">${App.icon('alert')} <span></span></div></div>
          <h3 class="up-head">Short video</h3>
          <div data-video></div></section>
        <section data-step="5" aria-labelledby="s5h"><h2 id="s5h" tabindex="-1">Step 5: Review and submit</h2><div data-review></div></section>
        <section data-step="6" aria-labelledby="s6h" data-testid="success-page"></section>
        <div class="sticky-actions" data-actions></div>`;

      const q = (s) => host.querySelector(s);
      photo = App.uploader.create(q('[data-photo]'), {
        kind: 'photo',
        onChange: () => {
          if (photo && photo.metadata().length) clearErr('photos');
          if (W.step === REVIEW) drawReview();
        },
      });
      video = App.uploader.create(q('[data-video]'), {
        kind: 'video',
        onChange: () => {
          if (W.step === REVIEW) drawReview();
        },
      });
      const atts = () => photo.metadata().concat(video.metadata());
      const uploadsReady = () => photo.ready() && video.ready();

      /* ---- painters ---- */
      const drawScan = () => {
        q('[data-scan]').innerHTML = App.qrScanner.html(W.scan, F);
        q('[data-scan-tools]').innerHTML = App.qrScanner.swapHtml(W.scan);
      };
      const redrawScan = () => {
        drawScan();
        if (F.locationId) clearErr('location');
        draftSet(W);
      };
      const catIcon = (g) => (App.C.CATEGORIES.find((c) => c.group === g) || {}).icon || 'help';
      const drawCats = () => {
        const g = F.category ? App.C.groupOf(F.category) : W.catGroup || '';
        const expanded = g === 'IT' || g === 'Facility';
        const box = (key, label, extra = '') =>
          `<button type="button" class="loc-choice-btn cat-type-btn${g === key ? ' selected' : ''}${extra}" data-cat-group="${key}" aria-pressed="${g === key}" data-testid="cat-group-${key}">${App.icon(catIcon(key))}<b>${esc(label)}</b></button>`;
        const label = (key) => (GROUP_BOX.find((x) => x[0] === key) || [key, key])[1];
        let html;
        if (expanded) {
          // Chosen group on the left, its categories in the middle, the other groups on the right.
          const cats = App.C.CATEGORIES.filter((c) => c.group === g);
          const others = GROUP_BOX.filter(([key]) => key !== g);
          html = `<div class="cat-head"><button type="button" class="btn sm quiet" data-cat-clear data-testid="cat-clear">${App.icon('x')} Clear selection</button></div>
            <div class="cat-split" role="group" aria-label="Kind of problem">
              <div class="cat-col cat-col-main">${box(g, label(g))}</div>
              <div class="cat-col cat-col-sub"><p class="cat-col-title">${esc(label(g))} type</p><div class="cat-grid cat-grid-sub">${cats
                .map(
                  (c, i) =>
                    `<button type="button" class="cat-card${F.category === c.id ? ' selected' : ''}" style="--i:${i}" data-cat="${esc(c.id)}" aria-pressed="${F.category === c.id}" data-testid="cat-${esc(c.id)}">${App.icon(c.icon)}<span>${esc(c.label)}</span></button>`,
                )
                .join('')}</div></div>
              <div class="cat-col cat-col-other"><p class="cat-col-title">Other categories</p>${others.map(([key, l]) => box(key, l)).join('')}</div>
            </div>
            <p class="muted small mt-3">Click a selected option again to unselect it.</p>`;
        } else {
          html = `<div class="loc-choice cat-type-grid" role="group" aria-label="Kind of problem">${GROUP_BOX.map(([key, l]) => box(key, l)).join('')}</div>${g ? '<p class="muted small mt-3">Click a selected option again to unselect it.</p>' : ''}`;
        }
        // Animate only when the layout or the chosen group changed, not on every re-render.
        const key = `${expanded ? 'x' : 'c'}:${g}`;
        const el = q('[data-cats]');
        el.innerHTML = html;
        if (W.catKey !== key) {
          el.classList.remove('cat-anim');
          void el.offsetWidth;
          el.classList.add('cat-anim');
          W.catKey = key;
        }
      };
      const drawDetails = () => {
        q('#rp-desc').value = F.description;
        count('rp-desc', 100);
      };
      const count = (id, max) => {
        const e = q(`#${id}-count`),
          v = q(`#${id}`);
        if (e && v) e.textContent = `${v.value.length} / ${max}`;
      };
      const row = (label, val, step) =>
        `<div class="row between review-row"><div><div class="muted small">${label}</div><div>${val}</div></div><button type="button" class="btn sm secondary" data-goto="${step}" aria-label="Edit ${label}">Edit</button></div>`;
      const drawReview = () => {
        const l = App.metrics.loc(F.locationId);
        const att = atts();
        const cat = F.category && App.C.catByName(F.category);
        q('[data-review]').innerHTML =
          `<div data-testid="review">${row('Location', l ? `${esc(l.name)} (${esc(l.id)}), ${esc(l.building)}` : '<i>Not chosen</i>', 1)}
          ${row('Category', cat ? esc(cat.label) : '<i>Not chosen</i>', 2)}
          ${row('Description', esc(F.description), 3)}
          ${row('Attachments', att.length ? att.map((a) => esc(a.name)).join(', ') : '<i>None attached</i>', 4)}
          <p class="muted small mt-3">Your report goes to the Administrator, who will assign it to the right team.</p></div>`;
      };
      const drawStepper = () => {
        q('[data-stepper]').innerHTML = STEPS.slice(0, REVIEW)
          .map(
            (s, i) =>
              `<li class="${i + 1 < W.step ? 'done' : i + 1 === W.step ? 'active' : ''}" ${i + 1 === W.step ? 'aria-current="step"' : ''}>${i + 1}. ${s}</li>`,
          )
          .join('');
        q('[data-compact]').textContent = W.step <= REVIEW ? `Step ${W.step} of ${REVIEW}: ${STEPS[W.step - 1]}` : 'Done';
      };
      const drawActions = () => {
        const a = q('[data-actions]');
        if (W.step === DONE) {
          a.hidden = true;
          return;
        }
        a.hidden = false;
        a.innerHTML = `<div class="row"><button type="button" class="btn ghost" data-nav="cancel" data-testid="wizard-cancel">Cancel</button></div>
          <div class="row wiz-forward">${W.step > 1 || W.scan.mode !== 'choose' ? `<button type="button" class="btn secondary" data-nav="back" data-testid="wizard-back">${App.icon('chevl')}Back</button>` : ''}${W.step < REVIEW ? `<button type="button" class="btn" data-nav="next" data-testid="wizard-next">Next${App.icon('chevr')}</button>` : `<button type="button" class="btn success" data-nav="submit" data-testid="wizard-submit">${App.icon('check')}Submit Report</button>`}</div>`;
      };
      // Step changes slide: Next moves forward (old step leaves left, new one enters from the right), Back reverses.
      let stepTok = 0;
      let stepShown = false;
      const STEP_CLASSES = ['step-out-fwd', 'step-out-back', 'step-in-fwd', 'step-in-back'];
      const switchStep = (n, prev, focus) => {
        const secs = [...host.querySelectorAll('[data-step]')];
        const inn = secs.find((s) => Number(s.dataset.step) === n);
        const out = secs.find((s) => !s.hidden);
        const tok = ++stepTok;
        const settle = () => {
          secs.forEach((s) => {
            s.classList.remove(...STEP_CLASSES);
            s.hidden = s !== inn;
          });
          if (focus) {
            const h = inn.querySelector('h2');
            h && h.focus({ preventScroll: false });
          }
        };
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!stepShown || reduce || !out || out === inn || n >= DONE || prev >= DONE) {
          stepShown = true;
          settle();
          return;
        }
        const dir = n > prev ? 'fwd' : 'back';
        secs.forEach((s) => {
          s.classList.remove(...STEP_CLASSES);
          if (s !== out) s.hidden = true;
        });
        out.classList.add(`step-out-${dir}`);
        setTimeout(() => {
          if (tok !== stepTok) return;
          out.hidden = true;
          out.classList.remove(...STEP_CLASSES);
          inn.hidden = false;
          inn.classList.add(`step-in-${dir}`);
          if (focus) {
            const h = inn.querySelector('h2');
            h && h.focus({ preventScroll: false });
          }
          setTimeout(() => {
            if (tok === stepTok) settle();
          }, 280);
        }, 150);
      };
      const show = (n, focus) => {
        const prev = W.step;
        W.step = n;
        switchStep(n, prev, focus);
        // The camera only starts when the reporter picks "Scan a QR code"; leaving step 1 switches it off.
        if (n !== 1 && (W.scan.scanning || W.scan.camera)) {
          App.qrScanner.pause(W.scan);
          drawScan();
        }
        if (n === 2) drawCats();
        if (n === 3) drawDetails();
        if (n === REVIEW) drawReview();
        drawStepper();
        drawActions();
        if (n < DONE) draftSet(W);
      };
      const clearErr = (id) => App.ui.setError(host, id, '');

      /* ---- validation ---- */
      function validate(step) {
        const errs = App.validators.ticketStep(Object.assign({}, F, { attachments: atts() }), step);
        const cur = {};
        Object.keys(errs)
          .filter((k) => FIELD_STEP[k] === step)
          .forEach((k) => {
            cur[k] = errs[k];
          });
        if (step === 4 && !uploadsReady()) cur.photos = 'Please wait for the upload to finish.';
        const map = { description: 'rp-desc' };
        App.ui.showErrors(host, cur, map);
        if (cur.location) App.toast.show('Please select a location.', 'warning');
        return !Object.keys(cur).length;
      }

      /* ---- events ---- */
      host.addEventListener('click', (e) => {
        const t = e.target;
        const nav = t.closest('[data-nav]');
        if (nav) {
          const a = nav.dataset.nav;
          if (a === 'next') {
            if (validate(W.step)) show(W.step + 1, true);
          } else if (a === 'back') {
            if (W.step === 1) {
              // Location step: Back returns to the scan-or-manual choice.
              App.qrScanner.handle('back-choose', W.scan, F, () => {
                drawScan();
                drawActions();
                draftSet(W);
              });
            } else show(W.step - 1, true);
          }
          else if (a === 'cancel') {
            cancelWizard();
          } else if (a === 'submit') submit();
          return;
        }
        const qs = t.closest('[data-qs]');
        if (qs) {
          App.qrScanner.handle(
            qs.dataset.qs,
            W.scan,
            F,
            () => {
              drawScan();
              drawActions();
              if (F.locationId) clearErr('location');
              draftSet(W);
            },
            qs,
          );
          return;
        }
        const grp = t.closest('[data-cat-group]');
        if (grp) {
          const key = grp.dataset.catGroup;
          if (key === (F.category ? App.C.groupOf(F.category) : W.catGroup || '')) {
            // Clicking the selected group again unselects it.
            W.catGroup = '';
            F.category = '';
            drawCats();
            draftSet(W);
            return;
          }
          if (key === 'Triage') {
            // Something Else: no list to pick from, so take the general category and wait for Next.
            const other = App.C.CATEGORIES.find((c) => c.group === 'Triage');
            F.category = other ? other.id : '';
            W.catGroup = key;
            clearErr('category');
            drawCats();
            draftSet(W);
            return;
          }
          W.catGroup = key;
          if (F.category && App.C.groupOf(F.category) !== key) F.category = '';
          drawCats();
          draftSet(W);
          return;
        }
        if (t.closest('[data-cat-clear]')) {
          W.catGroup = '';
          F.category = '';
          drawCats();
          draftSet(W);
          return;
        }
        const cat = t.closest('[data-cat]');
        if (cat) {
          // Clicking the selected category again unselects it but keeps the group open.
          F.category = F.category === cat.dataset.cat ? '' : cat.dataset.cat;
          W.catGroup = App.C.groupOf(cat.dataset.cat);
          clearErr('category');
          drawCats();
          draftSet(W);
          return;
        }
        const go = t.closest('[data-goto]');
        if (go) {
          show(Number(go.dataset.goto), true);
          return;
        }
        const again = t.closest('[data-again]');
        if (again) {
          destroyUploads();
          delete App.store.session.wizard;
          draftClear();
          App.router.resolve();
        }
      });
      host.addEventListener('submit', (e) => {
        if (e.target.closest('[data-qs-form]')) {
          e.preventDefault();
          App.qrScanner.submitCode(W.scan, host.querySelector('#qr-code').value, () => {
            drawScan();
            const i = q('#qr-code');
            i && i.focus();
          });
        }
      });
      host.addEventListener('change', (e) => {
        const s = e.target.closest('[data-qs-sel]');
        if (s) {
          App.qrScanner.selectManual(W.scan, s.dataset.qsSel, s.value);
          drawScan();
          const n = q(`[data-qs-sel="${s.dataset.qsSel}"]`);
          n && n.focus();
        }
      });
      host.addEventListener('input', (e) => {
        if (e.target.id === 'rp-desc') {
          F.description = e.target.value;
          count('rp-desc', 100);
          clearErr('rp-desc');
          draftSet(W);
        }
      });

      function submit() {
        for (let s = 1; s <= 4; s++) {
          if (!validate(s)) {
            show(s, false);
            validate(s);
            return;
          }
        } // re-validate everything; jump to the first bad step
        if (!uploadsReady()) {
          App.toast.show('Please wait for the upload to finish.', 'warning');
          return;
        }
        const submitButton = q('[data-testid="wizard-submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute('aria-busy', 'true');
          submitButton.innerHTML = `${App.icon('check')}Submitting…`;
        }
        const res = App.actions.createTicket(
          Object.assign({}, F, { attachments: atts() }),
        );
        if (!res.ok) {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            submitButton.innerHTML = `${App.icon('check')}Submit Report`;
          }
          App.toast.show(res.msg, 'error');
          if (res.errors) {
            const k = Object.keys(res.errors)[0];
            show(FIELD_STEP[k] || 3, true);
          }
          return;
        }
        App.toast.show('Ticket submitted successfully.', 'success');
        W.submitted = res.ticket;
        // Let go of the uploaders without destroying them, so the submitted ticket's photos stay viewable (App.files) for the admin this session.
        photo = null;
        video = null;
        draftClear();
        App.qrScanner.destroy();
        const t = res.ticket;
        q('[data-step="6"]').innerHTML =
          `<div class="success-page"><div class="big-check">${App.icon('check')}</div><h2 id="s6h" tabindex="-1">Report Submitted</h2>
          <p>Your ticket number is</p><div class="tid" data-testid="new-ticket-id">#${esc(t.id)}</div>
          <p>${App.badges.statusBadge('Pending')}</p>
          <p class="muted">Your report is now with the Administrator, who will assign it to the right team.</p>
          <div class="row jc-c"><a class="btn" href="#/tickets/${esc(t.id)}" data-testid="view-ticket">${App.icon('eye')}View Ticket</a><button type="button" class="btn secondary" data-again data-testid="report-another">Report Another Issue</button></div></div>`;
        show(DONE, true);
      }

      /* ---- initial paint ---- */
      drawScan();
      if (W.scan.autoStart) {
        App.qrScanner.autoStart(W.scan, F, redrawScan);
      }
      show(W.step, false);
    },
    unmount() {
      App.qrScanner.destroy();
      // The stream is gone, so the saved scanner state must not claim the camera is still on.
      const W = App.store.session.wizard;
      if (W && W.scan) App.qrScanner.pause(W.scan);
    },
  };
})();
