/* Formatting helpers. All dates use Asia/Manila and en-PH conventions; "now" always comes from App.clock. */
(function () {
  const App = (window.App = window.App || {});
  const TZ = 'Asia/Manila';
  const OFFSET = 8 * 3600 * 1000; // Manila has no DST, so a fixed offset is safe

  const dateFmt = new Intl.DateTimeFormat('en-PH', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat('en-PH', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
  const longFmt = new Intl.DateTimeFormat('en-PH', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fixAmPm = (s) => s.replace(/[  ]/g, ' ').replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());

  // Break a timestamp into Manila calendar parts.
  function parts(ms) {
    const d = new Date(ms + OFFSET);
    return {
      y: d.getUTCFullYear(),
      m: d.getUTCMonth() + 1,
      d: d.getUTCDate(),
      wd: d.getUTCDay(),
      h: d.getUTCHours(),
      min: d.getUTCMinutes(),
    };
  }
  const pad = (n) => String(n).padStart(2, '0');
  function ymd(ms) {
    const p = parts(ms);
    return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
  }
  // Build a timestamp from a Manila date string and an "HH:MM" time.
  function at(dateStr, hhmm) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [h, mi] = (hhmm || '00:00').split(':').map(Number);
    return Date.UTC(y, m - 1, d, h, mi) - OFFSET;
  }
  function addDays(dateStr, n) {
    return ymd(at(dateStr, '12:00') + n * 86400000);
  }
  function weekdayOf(dateStr) {
    return parts(at(dateStr, '12:00')).wd;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  // Display preferences (Preferences page): date style 'mdy' | 'dmy' | 'iso', and 12 / 24 hour clock.
  const dmyFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
  const time24Fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const pref = { dateStyle: 'mdy', hour12: true };
  function setFormat(o) {
    pref.dateStyle = (o && o.dateStyle) || 'mdy';
    pref.hour12 = !(o && o.hour12 === false);
  }
  const date = (ms) =>
    pref.dateStyle === 'dmy' ? dmyFmt.format(ms) : pref.dateStyle === 'iso' ? ymd(ms) : dateFmt.format(ms);
  const time = (ms) => (pref.hour12 ? fixAmPm(timeFmt.format(ms)) : time24Fmt.format(ms));
  const dateTime = (ms) => `${date(ms)}, ${time(ms)}`;
  const longDate = (ms) => (pref.dateStyle === 'mdy' ? longFmt.format(ms) : `${DAYS[parts(ms).wd]}, ${date(ms)}`);
  function hhmm(str) {
    // "14:00" -> "2:00 PM" (or "14:00" on a 24 hour clock)
    const [h, m] = str.split(':').map(Number);
    if (!pref.hour12) return `${pad(h)}:${pad(m)}`;
    return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  function dateStrLabel(dateStr) {
    return date(at(dateStr, '12:00'));
  }

  // "Today", "Tomorrow", "Yesterday" or a date, relative to the current time.
  function dayLabel(dateStr) {
    const today = ymd(App.clock.now());
    if (dateStr === today) return 'Today';
    if (dateStr === addDays(today, 1)) return 'Tomorrow';
    if (dateStr === addDays(today, -1)) return 'Yesterday';
    return dateStrLabel(dateStr);
  }
  function ago(ms) {
    const diff = App.clock.now() - ms;
    const abs = Math.abs(diff);
    const fut = diff < 0;
    const mins = Math.round(abs / 60000);
    let t;
    if (mins < 1) return 'just now';
    if (mins < 60) t = `${mins} minute${mins === 1 ? '' : 's'}`;
    else if (mins < 1440) {
      const h = Math.round(mins / 60);
      t = `${h} hour${h === 1 ? '' : 's'}`;
    } else {
      const d = Math.round(mins / 1440);
      t = `${d} day${d === 1 ? '' : 's'}`;
    }
    return fut ? `in ${t}` : `${t} ago`;
  }
  function size(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  }
  function duration(ms) {
    const h = ms / 3600000;
    if (h < 1) return `${Math.round(ms / 60000)} min`;
    if (h < 48) return `${h.toFixed(1)} h`;
    return `${(h / 24).toFixed(1)} days`;
  }
  // "[Role]-[Year]-[Number]" from a user's stored idNo (E-2013-0009, F-2014-0217, 2023-0145871) and their role, e.g. "Admin-2013-0009". Falls back to the raw idNo.
  function roleId(u, role) {
    const m = /^(?:[A-Z]-)?(\d{4})-(\d+)$/.exec((u && u.idNo) || '');
    const short = App.C && App.C.ROLES[role] ? App.C.ROLES[role].short : '';
    return m && short ? `${short}-${m[1]}-${m[2]}` : (u && u.idNo) || '';
  }
  function slug(s) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Label for a ticket: its stored title, or for tickets without one the start of the description (about 60 characters, cut at a word).
  function ticketTitle(t) {
    const stored = String((t && t.title) || '').trim();
    if (stored) return stored;
    const d = String((t && t.description) || '').replace(/\s+/g, ' ').trim();
    if (d.length <= 60) return d || 'Untitled ticket';
    const cut = d.slice(0, 60);
    const sp = cut.lastIndexOf(' ');
    return (sp > 30 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-]+$/, '') + '…';
  }

  App.fmt = {
    ticketTitle,
    setFormat,
    TZ,
    MONTHS,
    DAYS,
    parts,
    pad,
    ymd,
    at,
    addDays,
    weekdayOf,
    esc,
    date,
    time,
    dateTime,
    longDate,
    hhmm,
    dateStrLabel,
    dayLabel,
    ago,
    size,
    duration,
    roleId,
    slug,
  };
})();
