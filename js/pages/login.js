/* Login. Layout and look follow the Final_Project_G1 login page; sign-in is email + password, plus an optional authenticator code (see README).
   Only the accounts in js/data/accounts.js can sign in; the full email and the password must both match. The password is never stored.
   The Campus list is copied from that page and, like there, is for show: it always opens on NU Fairview and does not change who can sign in. */
(function () {
  const App = (window.App = window.App || {});
  App.pages = App.pages || {};

  const CAMPUSES = [
    'NU Bacolod',
    'NU Baliwag',
    'NU Cebu',
    'NU Clark',
    'NU Dasmariñas',
    'NU Davao',
    'NU East Ortigas',
    'NU Fairview',
    'NU Laguna',
    'NU Las Piñas',
    'NU Lipa',
    'NU Manila',
    'NU MOA',
    'NU Nazareth',
  ];

  App.pages.login = {
    static: true,
    render() {
      return `
      <div class="lg-shell" data-testid="login-form-wrap">
        <section class="lg-brand-panel" aria-label="National University Fairview building"></section>
        <nav class="lg-socials" aria-label="National University social media">
          <a class="lg-social-link" href="https://www.facebook.com/NationalUniversityPhilippines" target="_blank" rel="noopener noreferrer" aria-label="National University on Facebook" data-testid="login-social-facebook"><img src="assets/social/facebook.svg" alt="" aria-hidden="true"></a>
          <a class="lg-social-link" href="https://instagram.com/NationalUPH" target="_blank" rel="noopener noreferrer" aria-label="National University on Instagram" data-testid="login-social-instagram"><img src="assets/social/instagram.svg" alt="" aria-hidden="true"></a>
          <a class="lg-social-link" href="https://x.com/NationalUPhil" target="_blank" rel="noopener noreferrer" aria-label="National University on X" data-testid="login-social-x"><img src="assets/social/x.svg" alt="" aria-hidden="true"></a>
          <a class="lg-social-link" href="https://www.youtube.com/@NationalUniversityPhilippines" target="_blank" rel="noopener noreferrer" aria-label="National University on YouTube" data-testid="login-social-youtube"><img src="assets/social/youtube.svg" alt="" aria-hidden="true"></a>
          <a class="lg-social-link" href="https://www.tiktok.com/@nationaluph" target="_blank" rel="noopener noreferrer" aria-label="National University on TikTok" data-testid="login-social-tiktok"><img src="assets/social/tiktok.svg" alt="" aria-hidden="true"></a>
          <a class="lg-social-link" href="https://www.linkedin.com/company/nationaluph" target="_blank" rel="noopener noreferrer" aria-label="National University on LinkedIn" data-testid="login-social-linkedin"><img src="assets/social/linkedin.png" alt="" aria-hidden="true"></a>
          <a class="lg-social-link" href="https://open.spotify.com/artist/3HyEPPZbwqtVqdamGSMZ3x" target="_blank" rel="noopener noreferrer" aria-label="National University on Spotify" data-testid="login-social-spotify"><img src="assets/social/spotify.svg" alt="" aria-hidden="true"></a>
        </nav>
        <img class="lg-login-wordmark" src="assets/nu-wordmark-login.png" alt="National University" aria-hidden="true">
        <section class="lg-form-panel">
          <div class="lg-brand">
            <span class="lg-brand-mark" aria-hidden="true"><img src="assets/nu-official-logo-cropped.png" alt=""></span>
            <span class="lg-brand-rule" aria-hidden="true"></span>
            <span class="lg-brand-name">National<br>University</span>
          </div>
          <div class="lg-heading"><h1 id="page-h1" tabindex="-1"><span>Facility Support</span> <span class="lg-heading-accent">Portal</span></h1></div>
          <form id="login-form" novalidate data-testid="login-form">
            <label class="lg-label" for="campus-trigger">Campus</label>
            <div class="lg-select-wrap" id="campus-wrap">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>
              <button class="lg-select-trigger" id="campus-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="campus-listbox" data-testid="login-campus-trigger">
                <span id="campus-value">NU Fairview</span>
                <svg class="lg-select-chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <select id="campus" name="campus" tabindex="-1" aria-hidden="true" data-testid="login-campus">${CAMPUSES.map((c) => `<option ${c === 'NU Fairview' ? 'selected' : ''}>${c}</option>`).join('')}</select>
              <div class="lg-campus-menu" id="campus-listbox" role="listbox" aria-label="Select campus" hidden>${CAMPUSES.map((c) => `<button type="button" role="option" data-campus="${c}" ${c === 'NU Fairview' ? 'aria-selected="true"' : ''}>${c}</button>`).join('')}</div>
            </div>
            <button class="lg-ms" type="button" id="lg-ms" data-testid="login-microsoft">
              <span class="lg-ms-logo" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <span class="lg-ms-text">Sign in with Microsoft</span>
            </button>
            <div class="lg-divider" aria-hidden="true"><span></span><p>or continue with email</p><span></span></div>
            <label class="lg-label" for="nu-email">School Email</label>
            <div class="lg-input-wrap">
              <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
              <input id="nu-email" name="nu-email" type="email" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false" aria-describedby="email-error" placeholder="Enter your email address" maxlength="254" enterkeyhint="next" required data-testid="login-email">
            </div>
            <p class="lg-error" id="email-error" aria-live="polite" hidden></p>
            <label class="lg-label" for="password">Password</label>
            <div class="lg-input-wrap">
              <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" aria-describedby="password-error caps-warning" maxlength="128" enterkeyhint="go" required data-testid="login-password">
              <button class="lg-pw-toggle" type="button" aria-label="Show password" aria-pressed="false" data-testid="login-show-password">
                <svg class="lg-eye-open" aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                <svg class="lg-eye-closed" aria-hidden="true" viewBox="0 0 24 24"><path d="m3 3 18 18M10.6 6.2A11.4 11.4 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15 15 0 0 1-3.2 3.5M6.1 6.8A15.1 15.1 0 0 0 2.5 12S5.9 18 12 18c1.3 0 2.5-.3 3.5-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
              </button>
            </div>
            <div class="lg-password-meta">
              <div class="lg-password-feedback">
                <p class="lg-error" id="password-error" aria-live="polite" hidden></p>
                <p class="lg-caps" id="caps-warning" role="status" hidden>Caps Lock is on.</p>
              </div>
              <button type="button" class="lg-forgot" id="lg-forgot" data-testid="login-forgot">Forgot password?</button>
            </div>
            <p class="lg-message" id="form-message" role="alert" data-testid="login-error"></p>
            <button class="lg-submit" type="submit" data-testid="login-submit">Sign in</button>
          </form>
          <form id="mfa-form" class="lg-mfa" novalidate hidden aria-labelledby="mfa-title" data-testid="mfa-form">
            <span class="lg-verification-badge" aria-hidden="true"><img src="assets/fingerprint.png" alt=""></span>
            <p class="lg-verification-eyebrow">TWO-STEP VERIFICATION</p>
            <h2 class="lg-mfa-title" id="mfa-title" tabindex="-1">Verify your sign-in</h2>
            <p class="lg-account-chip" id="mfa-email"></p>
            <p class="lg-mfa-text" id="mfa-copy">Open Google Authenticator and enter the 6-digit code for Facility Support Portal.</p>
            <label class="lg-label" for="mfa-code" id="mfa-label">Authenticator code</label>
            <input id="mfa-code" name="mfa-code" type="text" inputmode="numeric" autocomplete="one-time-code" autocapitalize="none" spellcheck="false" enterkeyhint="done" maxlength="6" pattern="[0-9]{6}" placeholder="000000" aria-describedby="mfa-hint mfa-message" required data-testid="mfa-code">
            <p class="lg-code-hint" id="mfa-hint">Codes refresh every 30 seconds. You can paste all six digits.</p>
            <p class="lg-message" id="mfa-message" role="alert" data-testid="mfa-error"></p>
            <button class="lg-submit" type="submit" data-testid="mfa-submit">Verify and sign in</button>
            <div class="lg-mfa-actions"><button type="button" class="lg-recovery" id="mfa-recovery">Use a recovery code instead</button><button type="button" class="lg-back" id="mfa-back" data-testid="mfa-back">Back to sign in</button></div>
          </form>
          <aside class="lg-support-wrap" id="help" tabindex="-1">
            <strong class="lg-support-title">Need help signing in?</strong>
            <div class="lg-support">
              <img class="lg-support-icon" src="assets/customer-service-headset.png" alt="">
              <p><a href="https://outlook.office.com/mail/deeplink/compose?to=itso%40nu-fairview.edu.ph" target="_blank" rel="noopener noreferrer">IT Support</a><span aria-hidden="true">&bull;</span><a href="https://outlook.office.com/mail/deeplink/compose?to=fmo%40nu-fairview.edu.ph" target="_blank" rel="noopener noreferrer">Facilities Support</a></p>
            </div>
          </aside>
        </section>
      </div>`;
    },
    mount(el) {
      // A direct file:// load can restore the previous document scroll position
      // before the hash route is drawn. Always start the sign-in screen at the
      // top so the hero and form are not opened halfway down on laptops.
      const resetLoginScroll = () => window.scrollTo({left: 0, top: 0, behavior: 'auto'});
      resetLoginScroll();
      requestAnimationFrame(resetLoginScroll);
      const $ = (sel) => el.querySelector(sel);
      const form = $('#login-form'),
        email = $('#nu-email'),
        pass = $('#password'),
        btn = $('.lg-submit'),
        msg = $('#form-message');
      const toggle = $('.lg-pw-toggle'),
        caps = $('#caps-warning');
      let busy = false;
      let csrf = '';
      let localDemoFallback = false;
      const BACKEND_ACCOUNT = String((App.accounts.list.find((a) => a.mfaSecret) || {}).email || '').toLowerCase(); // the account that asks for an authenticator code
      const fileMode = window.location && window.location.protocol === 'file:';
      // The backend MFA flow is available when the optional local server is
      // running. A shared folder opened directly from disk must stay fully
      // usable, so its demo account uses the existing local TOTP verifier.
      const usesBackend = (acc) => !fileMode && !localDemoFallback && acc && acc.email.toLowerCase() === BACKEND_ACCOUNT;
      function transportError(timedOut = false) {
        const error = new Error(timedOut
          ? 'Sign-in is taking longer than expected. Please try again.'
          : 'Sign-in is temporarily unavailable. Please try again.');
        error.transportIssue = true;
        return error;
      }
      function signInFeedback(error, verification = false) {
        if (error.transportIssue) return error.message;
        if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
        if (error.status === 401) return 'Incorrect email or password.';
        if (verification && error.status === 400) return recoveryMode
          ? 'That recovery code is invalid or already used. Try another saved code.'
          : 'That code is incorrect or expired. Try the next code in Google Authenticator.';
        return 'Sign-in is temporarily unavailable. Please try again.';
      }
      function xhrRequest(path, payload) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(payload === undefined ? 'GET' : 'POST', path, true);
          xhr.timeout = 10000;
          xhr.setRequestHeader('Accept', 'application/json');
          if (payload !== undefined) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-CSRF-Token', csrf);
          }
          xhr.onload = () => resolve({ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status,
            headers: {get: name => xhr.getResponseHeader(name)}, json: async () => JSON.parse(xhr.responseText)});
          xhr.onerror = () => reject(transportError());
          xhr.ontimeout = () => reject(transportError(true));
          xhr.send(payload === undefined ? null : JSON.stringify(payload));
        });
      }
      async function authRequest(path, payload) {
        if (window.location && window.location.protocol === 'file:') {
          throw transportError();
        }
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeout = controller ? setTimeout(() => controller.abort(), 10000) : null;
        let response;
        try {
          // Select one transport; never retry a credential or recovery POST automatically.
          response = typeof fetch === 'function' && (controller || typeof XMLHttpRequest !== 'function') ? await fetch(path, {
            method: payload === undefined ? 'GET' : 'POST',
            credentials: 'same-origin', cache: 'no-store', signal: controller ? controller.signal : undefined,
            headers: payload === undefined ? {'Accept': 'application/json'} : {'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrf},
            body: payload === undefined ? undefined : JSON.stringify(payload),
          }) : await xhrRequest(path, payload);
        } catch (error) {
          if (error.transportIssue) throw error;
          throw transportError(Boolean(controller && controller.signal.aborted));
        } finally { if (timeout !== null) clearTimeout(timeout); }
        if (!(response.headers.get('Content-Type') || '').includes('application/json')) {
          throw transportError();
        }
        let data;
        try { data = await response.json(); }
        catch { throw transportError(); }
        if (!data || typeof data !== 'object') throw transportError();
        if (!response.ok) { const error = new Error(data.error || 'Unable to sign in.'); error.status = response.status; throw error; }
        if (data.csrf) csrf = data.csrf;
        return data;
      }
      async function refreshAuth() {
        let session = await authRequest('/api/session');
        if (session.cookieAccepted === false) session = await authRequest('/api/session');
        if (session.cookieAccepted === false) throw transportError();
        return session;
      }
      const setError = (input, target, text) => {
        input.setAttribute('aria-invalid', String(!!text));
        target.textContent = text;
        target.hidden = !text;
      };

      [email, pass].forEach((i) =>
        i.addEventListener('input', () => {
          setError(i, i === email ? $('#email-error') : $('#password-error'), '');
          msg.textContent = '';
        }),
      );
      ['keydown', 'keyup'].forEach((t) =>
        pass.addEventListener(t, (e) => {
          caps.hidden = !(e.getModifierState && e.getModifierState('CapsLock'));
        }),
      );
      pass.addEventListener('blur', () => {
        caps.hidden = true;
      });
      toggle.addEventListener('click', () => {
        const shown = pass.type === 'text';
        pass.type = shown ? 'password' : 'text';
        toggle.classList.toggle('is-visible', !shown);
        toggle.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
        toggle.setAttribute('aria-pressed', String(!shown));
      });
      $('#lg-forgot').addEventListener('click', () => {
        const h = $('#help');
        const support = h.querySelector('.lg-support');
        h.scrollIntoView({ block: 'center' });
        h.focus({ preventScroll: true });
        support.classList.add('is-flash'); // nothing scrolls on a fitted page, so show where the help box is
        setTimeout(() => support.classList.remove('is-flash'), 1400);
      });

      // Spinner + disabled state on the Sign in button (one place instead of three).
      const setBusy = (on) => {
        busy = on;
        btn.disabled = on;
        btn.textContent = on ? 'Signing in…' : 'Sign in';
        btn.toggleAttribute('aria-busy', on);
        email.readOnly = pass.readOnly = on;
        $('#lg-ms').disabled = on;
        if (on) form.setAttribute('aria-busy', 'true');
        else form.removeAttribute('aria-busy');
      };

      // Custom campus list (cosmetic, like the select it replaces).
      const campusSel = $('#campus'),
        campusBtn = $('#campus-trigger'),
        campusMenu = $('#campus-listbox'),
        campusVal = $('#campus-value'),
        campusWrap = $('#campus-wrap');
      const campusOpts = [...campusMenu.querySelectorAll('[role="option"]')];
      const setCampus = (name) => {
        const o = campusOpts.find((x) => x.dataset.campus === name) || campusOpts[0];
        campusSel.value = o.dataset.campus;
        campusVal.textContent = o.dataset.campus;
        campusOpts.forEach((x) => x.setAttribute('aria-selected', String(x === o)));
      };
      const closeCampus = () => {
        campusMenu.hidden = true;
        campusBtn.setAttribute('aria-expanded', 'false');
      };
      const openCampus = () => {
        campusMenu.hidden = false;
        campusBtn.setAttribute('aria-expanded', 'true');
        (campusOpts.find((x) => x.getAttribute('aria-selected') === 'true') || campusOpts[0]).focus();
      };
      campusBtn.addEventListener('click', () => (campusMenu.hidden ? openCampus() : closeCampus()));
      campusBtn.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          openCampus();
        } else if (e.key === 'Escape') closeCampus();
      });
      campusOpts.forEach((o, i) => {
        o.addEventListener('click', () => {
          setCampus(o.dataset.campus);
          closeCampus();
          campusBtn.focus();
        });
        o.addEventListener('keydown', (e) => {
          let next = -1;
          if (e.key === 'ArrowDown') next = (i + 1) % campusOpts.length;
          else if (e.key === 'ArrowUp') next = (i - 1 + campusOpts.length) % campusOpts.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = campusOpts.length - 1;
          else if (e.key === 'Escape') {
            e.preventDefault();
            closeCampus();
            campusBtn.focus();
            return;
          } else if (e.key === 'Tab') {
            closeCampus();
            return;
          } else return;
          e.preventDefault();
          campusOpts[next].focus();
        });
      });
      // Listeners stay on this page's own element, so nothing is left behind after navigating away.
      el.addEventListener('click', (e) => {
        if (!campusWrap.contains(e.target)) closeCampus();
      });
      campusWrap.addEventListener('focusout', (e) => {
        if (e.relatedTarget && !campusWrap.contains(e.relatedTarget)) closeCampus();
      });

      // Continue with Microsoft: a demo shortcut. It does NOT contact Microsoft and checks no password or code; it simply signs in
      // as the default student below. (Real Microsoft sign-in would need an Entra app registration and a served page.)
      const MS_DEMO_EMAIL = App.db.config.microsoftSignInEmail;
      const msBtn = $('#lg-ms');
      msBtn.addEventListener('click', () => {
        if (busy) return;
        const acc = App.accounts.byEmail(MS_DEMO_EMAIL);
        if (!acc) return;
        busy = true;
        msBtn.disabled = btn.disabled = true;
        msBtn.setAttribute('aria-busy', 'true');
        msBtn.querySelector('.lg-ms-text').textContent = 'Continuing…';
        setTimeout(() => finish(acc), 450);
      });

      // Email check when leaving the field.
      email.addEventListener('blur', () => {
        email.value = email.value.trim();
        if (email.value && !email.validity.valid)
          setError(email, $('#email-error'), 'Enter a valid university email address.');
      });

      // Attempt limit: 8 wrong passwords for one typed email in 5 minutes. Browser-only, like the rest of this demo.
      const FAIL_KEY = 'nuf_login_fails',
        FAIL_MAX = 8,
        FAIL_WINDOW = 5 * 60 * 1000;
      let memFails = {};
      const readFails = () => {
        try {
          const v = localStorage.getItem(FAIL_KEY);
          return v ? JSON.parse(v) || {} : {};
        } catch (e) {
          return memFails;
        }
      };
      const writeFails = (o) => {
        memFails = o;
        try {
          localStorage.setItem(FAIL_KEY, JSON.stringify(o));
        } catch (e) {
          /* keep the in-memory copy */
        }
      };
      const failKey = (s) => String(s).trim().toLowerCase();
      const recentFails = (k, now) => ((readFails()[k] || []).filter((t) => now - t < FAIL_WINDOW));
      const lockedSeconds = (k) => {
        const now = Date.now(),
          list = recentFails(k, now);
        return list.length >= FAIL_MAX ? Math.ceil((list[0] + FAIL_WINDOW - now) / 1000) : 0;
      };
      const addFail = (k) => {
        const now = Date.now(),
          all = readFails();
        Object.keys(all).forEach((x) => {
          all[x] = all[x].filter((t) => now - t < FAIL_WINDOW);
          if (!all[x].length) delete all[x];
        });
        all[k] = (all[k] || []).concat(now);
        writeFails(all);
      };
      const clearFails = (k) => {
        const all = readFails();
        delete all[k];
        writeFails(all);
      };

      if (App.auth.expired) {
        App.auth.expired = false;
        msg.textContent = 'Your session expired. Sign in again.';
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (busy) return;
        msg.textContent = '';
        email.value = email.value.trim();
        setError(
          email,
          $('#email-error'),
          email.validity.valid
            ? ''
            : email.value
              ? 'Enter a valid university email address.'
              : 'Enter your university email address.',
        );
        setError(pass, $('#password-error'), pass.value ? '' : 'Enter your password.');
        if (!email.validity.valid || !pass.value) {
          (email.validity.valid ? pass : email).focus();
          return;
        }
        const typedEmail = email.value,
          typedPass = pass.value,
          fk = failKey(typedEmail);
        const wait = lockedSeconds(fk);
        if (wait) {
          msg.textContent = `Too many attempts. Try again in ${wait >= 60 ? `${Math.ceil(wait / 60)} minute${wait > 60 ? 's' : ''}` : `${wait} seconds`}.`;
          return;
        }
        setBusy(true);
        // Keep the loading state visible while starting sign-in.
        setTimeout(async () => {
          // Only use the API when the app is served over HTTP. A ZIP opened
          // directly from disk must authenticate the shared demo account with
          // the local TOTP verifier instead of trying an unavailable server.
          if (!fileMode && fk === BACKEND_ACCOUNT) {
            try {
              await refreshAuth();
              const result = await authRequest('/api/login', {email: typedEmail, password: typedPass});
              const account = App.accounts.byEmail(result.email);
              if (!account || result.state !== 'verify') throw new Error('Unable to start account verification.');
              if (el.isConnected) { setBusy(false); showCode(account, result.expiresAt); }
            } catch (error) {
              // A static preview may be served over HTTP without the optional
              // auth server. Fall back to the local demo verifier only after
              // a transport failure, never after a rejected password.
              if (error.transportIssue) {
                const account = App.accounts.find(typedEmail, typedPass);
                if (account) {
                  localDemoFallback = true;
                  clearFails(fk);
                  pass.value = '';
                  if (el.isConnected) { setBusy(false); showCode(account); }
                  return;
                }
              }
              if (el.isConnected) { setBusy(false); msg.textContent = signInFeedback(error); pass.focus(); }
            }
            return;
          }
          const acc = App.accounts.find(typedEmail, typedPass);
          if (!acc) {
            addFail(fk);
            setBusy(false);
            msg.textContent = 'Invalid email or password';
            email.setAttribute('aria-invalid', 'true');
            pass.setAttribute('aria-invalid', 'true');
            pass.focus();
            return;
          }
          clearFails(fk);
          pass.value = ''; // never kept
          if (App.mfa.isOn(acc.email)) {
            setBusy(false);
            showCode(acc);
            return;
          }
          finish(acc);
        }, 450);
      });

      // Signs the person in and goes to their dashboard (or the page they were sent away from).
      function finish(acc) {
        App.auth.signIn(acc);
        const back = App.store.session.returnTo;
        delete App.store.session.returnTo;
        const m = back && App.routes.match(back);
        const destination = m && m.route.roles.includes(acc.role) ? back : '/dashboard';
        const shell = el.querySelector('.lg-shell');
        const activeButton = mfaForm && !mfaForm.hidden ? $('#mfa-form .lg-submit') : btn;
        if (shell) shell.classList.add('is-signing-in');
        if (activeButton) {
          activeButton.textContent = 'Welcome back';
          activeButton.setAttribute('aria-busy', 'true');
        }
        const go = () => App.router.replace(destination);
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) go();
        else showWelcomeLoader(acc, go);
      }

      // Branded loading screen between a successful sign-in and the dashboard (about 1.6 s), then the dashboard rises in.
      function showWelcomeLoader(acc, go) {
        const first = String(acc.firstName || acc.name || '').split(' ')[0];
        const ov = document.createElement('div');
        ov.className = 'login-loader';
        ov.setAttribute('role', 'status');
        ov.innerHTML = '<div class="ll-orb"><span class="ll-ring"></span><span class="ll-ring ll-ring-2"></span><img src="assets/nu-official-logo-cropped.png" alt=""></div>'
          + '<p class="ll-hello">Welcome back' + (first ? ', ' + App.fmt.esc(first) : '') + '</p>'
          + '<p class="ll-sub">Preparing your dashboard</p>'
          + '<div class="ll-bar" aria-hidden="true"><i></i></div>';
        document.body.appendChild(ov);
        requestAnimationFrame(() => ov.classList.add('is-on'));
        setTimeout(() => {
          go();
          document.body.classList.add('is-entering');
          ov.classList.add('is-off');
          setTimeout(() => ov.remove(), 520);
          setTimeout(() => document.body.classList.remove('is-entering'), 1600);
        }, 1600);
      }

      // Step two for accounts that turned on the Authenticator code in Settings.
      const mfaForm = $('#mfa-form'),
        mfaCode = $('#mfa-code'),
        mfaMsg = $('#mfa-message');
      let pendingAcc = null,
        wrong = 0,
        verifying = false,
        recoveryMode = false,
        challengeDeadline = 0,
        challengeTimer = null;
      const resetPassword = () => {
        pass.value = '';
        pass.type = 'password';
        toggle.classList.remove('is-visible');
        toggle.setAttribute('aria-label', 'Show password');
        toggle.setAttribute('aria-pressed', 'false');
        caps.hidden = true;
      };
      const showPassword = (text) => {
        clearTimeout(challengeTimer);
        pendingAcc = null;
        wrong = 0;
        mfaForm.hidden = true;
        form.hidden = false;
        mfaCode.value = '';
        mfaMsg.textContent = '';
        $('#mfa-email').textContent = '';
        resetPassword();
        msg.textContent = text || '';
        (text ? pass : email).focus();
      };
      function showCode(acc, expiresAt) {
        closeCampus();
        resetPassword();
        pendingAcc = acc;
        wrong = 0;
        recoveryMode = false;
        configureCode();
        challengeDeadline = Number.isFinite(expiresAt) ? expiresAt * 1000 : Date.now() + 10 * 60 * 1000;
        clearTimeout(challengeTimer);
        challengeTimer = setTimeout(() => {
          if (pendingAcc && el.isConnected) showPassword('Your verification session expired. Please sign in again.');
        }, Math.max(0, challengeDeadline - Date.now()));
        mfaMsg.textContent = '';
        mfaCode.value = '';
        mfaCode.removeAttribute('aria-invalid');
        $('#mfa-email').textContent = acc.email;
        form.hidden = true;
        mfaForm.hidden = false;
        mfaCode.focus();
      }
      mfaCode.addEventListener('input', () => {
        if (!recoveryMode) mfaCode.value = mfaCode.value.replace(/[^0-9]/g, '').slice(0, 6);
        else {
          const raw = mfaCode.value.replace(/[^A-Fa-f0-9]/g, '').slice(0, 32).toUpperCase();
          mfaCode.value = raw.match(/.{1,8}/g)?.join('–') || '';
        }
        mfaMsg.textContent = '';
        mfaCode.removeAttribute('aria-invalid');
      });
      mfaCode.addEventListener('paste', (e) => {
        if (!e.clipboardData || mfaCode.readOnly) return;
        e.preventDefault();
        const code = e.clipboardData.getData('text').trim().replace(/[\s–—-]/g, '');
        if (!(recoveryMode ? /^[A-Fa-f0-9]{32}$/ : /^[0-9]{6}$/).test(code)) {
          mfaMsg.textContent = recoveryMode ? 'Paste a complete recovery code.' : 'Paste a complete six-digit code.';
          mfaCode.setAttribute('aria-invalid', 'true');
          return;
        }
        mfaCode.value = recoveryMode ? code.toUpperCase().match(/.{8}/g).join('–') : code;
        mfaMsg.textContent = '';
        mfaCode.removeAttribute('aria-invalid');
      });
      function configureCode() {
        mfaCode.value = '';
        mfaCode.removeAttribute('aria-invalid');
        mfaCode.inputMode = recoveryMode ? 'text' : 'numeric';
        mfaCode.setAttribute('inputmode', recoveryMode ? 'text' : 'numeric');
        mfaCode.maxLength = recoveryMode ? 35 : 6;
        mfaCode.pattern = recoveryMode ? '[A-Fa-f0-9-]{32,35}' : '[0-9]{6}';
        mfaCode.autocomplete = recoveryMode ? 'off' : 'one-time-code';
        mfaCode.placeholder = recoveryMode ? 'XXXXXXXX–XXXXXXXX–XXXXXXXX–XXXXXXXX' : '000000';
        $('#mfa-label').textContent = recoveryMode ? 'Recovery code' : 'Authenticator code';
        $('#mfa-copy').textContent = recoveryMode
          ? 'Enter one of your saved recovery codes to verify this sign-in.'
          : (usesBackend(pendingAcc)
            ? 'Open Google Authenticator and enter the 6-digit code for Facility Support Portal.'
            : 'Enter the current six-digit demo code from the presenter’s registered Google Authenticator.');
        $('#mfa-hint').textContent = recoveryMode ? 'Each saved recovery code works once. Never share it.' : 'Codes refresh every 30 seconds. You can paste all six digits.';
        $('#mfa-recovery').textContent = recoveryMode ? 'Use an authenticator code instead' : 'Use a recovery code instead';
        $('#mfa-recovery').hidden = !usesBackend(pendingAcc);
        mfaMsg.textContent = '';
      }
      $('#mfa-recovery').addEventListener('click', () => {
        if (!usesBackend(pendingAcc) || verifying) return;
        recoveryMode = !recoveryMode;
        configureCode();
        mfaCode.focus();
      });
      $('#mfa-back').addEventListener('click', async () => {
        if (verifying) return;
        if (usesBackend(pendingAcc)) {
          $('#mfa-back').disabled = $('#mfa-recovery').disabled = true;
          try { await authRequest('/api/logout', {}); }
          catch { /* The next login refreshes the session before submitting. */ }
          finally { $('#mfa-back').disabled = $('#mfa-recovery').disabled = false; }
        }
        showPassword('');
      });
      mfaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!pendingAcc || verifying) return;
        if (Date.now() >= challengeDeadline) {
          showPassword('Your verification session expired. Please sign in again.');
          return;
        }
        const submittedCode = recoveryMode ? mfaCode.value.trim().replace(/[–—-]/g, '-') : mfaCode.value.trim();
        if (!(recoveryMode ? /^[A-Fa-f0-9]{8}(-?[A-Fa-f0-9]{8}){3}$/ : /^[0-9]{6}$/).test(submittedCode)) {
          mfaMsg.textContent = recoveryMode ? 'Enter a complete recovery code.' : 'Enter the six-digit code shown in your authenticator.';
          mfaCode.setAttribute('aria-invalid', 'true');
          mfaCode.focus();
          return;
        }
        const wait = usesBackend(pendingAcc) ? 0 : App.mfa.lockedFor(pendingAcc.email);
        if (wait) {
          mfaMsg.textContent = `Too many incorrect codes. Try again in ${wait} seconds.`;
          return;
        }
        const verifyButton = mfaForm.querySelector('[type="submit"]');
        verifying = true;
        verifyButton.disabled = true;
        verifyButton.setAttribute('aria-busy', 'true');
        verifyButton.textContent = 'Verifying…';
        mfaCode.readOnly = true;
        $('#mfa-back').disabled = $('#mfa-recovery').disabled = true;
        let verified = false;
        const verifyingAccount = pendingAcc;
        try {
          if (usesBackend(verifyingAccount)) {
            const result = await authRequest('/api/verify', {code: submittedCode, recovery: recoveryMode});
            verified = result.state === 'authenticated' && result.email.toLowerCase() === verifyingAccount.email.toLowerCase();
          } else verified = App.mfa.verify(verifyingAccount.email, mfaCode.value);
        }
        catch (error) {
          if (error.status === 401) showPassword('Your verification session expired. Please sign in again.');
          else {
            mfaMsg.textContent = signInFeedback(error, true);
            mfaCode.setAttribute('aria-invalid', 'true');
          }
          return;
        } finally {
          verifying = false;
          verifyButton.disabled = false;
          verifyButton.removeAttribute('aria-busy');
          verifyButton.textContent = 'Verify and sign in';
          mfaCode.readOnly = false;
          $('#mfa-back').disabled = $('#mfa-recovery').disabled = false;
        }
        if (verified) {
          if (!el.isConnected || pendingAcc !== verifyingAccount) return;
          clearTimeout(challengeTimer);
          const acc = pendingAcc;
          pendingAcc = null;
          mfaCode.value = '';
          finish(acc);
          return;
        }
        wrong += 1;
        if (wrong >= 5) {
          showPassword('Too many incorrect codes. Sign in again.');
          return;
        }
        mfaCode.setAttribute('aria-invalid', 'true');
        mfaMsg.textContent = /^\s*\d{3}\s?\d{3}\s*$/.test(mfaCode.value)
          ? 'That code is not correct, or it was already used. Wait for a new code and try again.'
          : 'Enter the 6-digit code from Google Authenticator.';
        mfaCode.select();
      });

      App.pages.login.unmount = () => {
        clearTimeout(challengeTimer);
        pendingAcc = null;
        resetPassword();
        mfaCode.value = '';
      };
    },
  };
})();
