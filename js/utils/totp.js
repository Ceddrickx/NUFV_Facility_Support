/* App.mfa: the Google Authenticator style 6-digit code (RFC 6238 TOTP: HMAC-SHA1, 30 s step) for accounts that have an mfaSecret.
   Same method as the reference login project (Final_Project_G1/backend/server.py): the current step and one either side are accepted,
   and a step that was already used is refused. There is no server, so the secret sits in js/data/accounts.js and the used-step and
   lockout record lives in this browser (nuf_mfa). That is a demonstration of the flow, not real security. */
(function () {
  const App = (window.App = window.App || {});
  const KEY = 'nuf_mfa';
  const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const STEP = 30;
  let mem = {};

  const read = () => {
    try {
      const v = localStorage.getItem(KEY);
      return v ? JSON.parse(v) : {};
    } catch (e) {
      return mem;
    }
  };
  const write = (o) => {
    mem = o;
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {
      /* the in-memory copy still works for this visit */
    }
  };

  // SHA-1 and HMAC in plain JavaScript so it works from file:// (the browser's crypto.subtle needs a secure page).
  const rol = (n, s) => (n << s) | (n >>> (32 - s));
  function sha1(msg) {
    const b = msg.slice(),
      bits = msg.length * 8;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    const hi = Math.floor(bits / 0x100000000),
      lo = bits >>> 0;
    for (let i = 3; i >= 0; i--) b.push((hi >>> (i * 8)) & 255);
    for (let i = 3; i >= 0; i--) b.push((lo >>> (i * 8)) & 255);
    let h0 = 0x67452301,
      h1 = 0xefcdab89 | 0,
      h2 = 0x98badcfe | 0,
      h3 = 0x10325476,
      h4 = 0xc3d2e1f0 | 0;
    const w = new Array(80);
    for (let i = 0; i < b.length; i += 64) {
      for (let t = 0; t < 16; t++)
        w[t] = (b[i + t * 4] << 24) | (b[i + t * 4 + 1] << 16) | (b[i + t * 4 + 2] << 8) | b[i + t * 4 + 3];
      for (let t = 16; t < 80; t++) w[t] = rol(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
      let a = h0,
        bb = h1,
        c = h2,
        d = h3,
        e = h4;
      for (let t = 0; t < 80; t++) {
        let f, k;
        if (t < 20) {
          f = (bb & c) | (~bb & d);
          k = 0x5a827999;
        } else if (t < 40) {
          f = bb ^ c ^ d;
          k = 0x6ed9eba1;
        } else if (t < 60) {
          f = (bb & c) | (bb & d) | (c & d);
          k = 0x8f1bbcdc | 0;
        } else {
          f = bb ^ c ^ d;
          k = 0xca62c1d6 | 0;
        }
        const tmp = (rol(a, 5) + f + e + k + w[t]) | 0;
        e = d;
        d = c;
        c = rol(bb, 30);
        bb = a;
        a = tmp;
      }
      h0 = (h0 + a) | 0;
      h1 = (h1 + bb) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
    }
    const out = [];
    [h0, h1, h2, h3, h4].forEach((h) => {
      for (let i = 3; i >= 0; i--) out.push((h >>> (i * 8)) & 255);
    });
    return out;
  }
  function hmac(key, msg) {
    let k = key.length > 64 ? sha1(key) : key.slice();
    while (k.length < 64) k.push(0);
    const inner = sha1(k.map((x) => x ^ 0x36).concat(msg));
    return sha1(k.map((x) => x ^ 0x5c).concat(inner));
  }

  function b32decode(s) {
    let bits = '';
    String(s)
      .toUpperCase()
      .replace(/[^A-Z2-7]/g, '')
      .split('')
      .forEach((ch) => {
        bits += B32.indexOf(ch).toString(2).padStart(5, '0');
      });
    const out = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
    return out;
  }

  // The 6-digit code for one 30-second step.
  function code(secret, counter) {
    const msg = [];
    for (let i = 7; i >= 0; i--) msg.push(Math.floor(counter / Math.pow(2, i * 8)) & 255);
    const h = hmac(b32decode(secret), msg),
      o = h[19] & 0xf;
    const bin = (((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) >>> 0;
    return String(bin % 1000000).padStart(6, '0');
  }
  const step = (ms) => Math.floor((ms === undefined ? Date.now() : ms) / 1000 / STEP);
  // The step the typed code belongs to (current step plus or minus one), or null. A step at or before `last` was already used.
  function match(secret, typed, last, ms) {
    const t = String(typed || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(t)) return null;
    const now = step(ms);
    for (const c of [now, now - 1, now + 1]) if (c > (last || 0) && code(secret, c) === t) return c;
    return null;
  }

  const norm = (e) =>
    String(e || '')
      .trim()
      .toLowerCase();
  const secretOf = (email) => {
    const acc = App.accounts && App.accounts.byEmail(email);
    return (acc && acc.mfaSecret) || null;
  };
  App.mfa = {
    code,
    match,
    step,
    // The code step is always required for an account that has an mfaSecret (see js/data/accounts.js). There is no off switch.
    isOn: (email) => !!secretOf(email),
    // Seconds left on a short demo lockout (5 wrong codes in a row), or 0.
    lockedFor(email) {
      const all = read(),
        rec = all[norm(email)],
        now = Date.now();
      if (!rec || !(rec.lockUntil > now)) return 0;
      // Migrate older one-minute demo lock records to the presentation-safe
      // five-second lockout when an existing browser copy is reopened.
      if (rec.lockUntil - now > 5000) {
        rec.lockUntil = now + 5000;
        all[norm(email)] = rec;
        write(all);
      }
      return Math.ceil((rec.lockUntil - now) / 1000);
    },
    // True for a correct, unused code. The last used step, wrong-code count and lockout are kept in this browser (nuf_mfa).
    verify(email, typed) {
      const e = norm(email),
        secret = secretOf(e);
      if (!secret || App.mfa.lockedFor(e)) return false;
      const all = read(),
        rec = all[e] || {};
      const c = match(secret, typed, rec.last);
      if (!c) {
        rec.fails = (rec.fails || 0) + 1;
        if (rec.fails >= 5) {
          rec.fails = 0;
        // Keep the presentation flow recoverable without weakening the
        // separate production/server verification path.
        rec.lockUntil = Date.now() + 5000;
        }
        all[e] = rec;
        write(all);
        return false;
      }
      rec.last = c;
      rec.fails = 0;
      all[e] = rec;
      write(all);
      return true;
    },
  };
})();
