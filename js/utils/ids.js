/* ID helpers. Ticket counters live in the store so Reset Demo Data restores them.
   Ticket ids have two meanings in the data model:
   - ticketId is the internal, immutable numeric identity used by the database model.
   - ticketNo is the public, human-readable number shown in the UI.
   The prototype keeps `ticket.id` as an alias of ticketNo so existing routes and
   screens continue to work while the model is ready for a real SQL backend. */
(function () {
  const App = (window.App = window.App || {});
  let seq = 0;
  const TIME_ZONE = 'Asia/Manila';

  // New tickets use the single 'NFV' prefix (NFV-YYYY-NNNNN, one counter per year).
  // Legacy IT / FM / TR numbers are still understood so old tickets and links keep working.
  function ticketPrefix(group) {
    if (group === 'NFV') return 'NFV';
    if (group === 'Facility' || group === 'FM') return 'FM';
    if (group === 'Triage' || group === 'TR') return 'TR';
    return 'IT';
  }

  function ticketYear(value) {
    const date = value instanceof Date ? value : new Date(value == null ? Date.now() : value);
    if (Number.isNaN(date.getTime())) return new Date().getFullYear();
    return Number(
      new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric' }).format(date),
    );
  }

  function ticketNo(group, year, sequence) {
    const n = Math.max(1, Number(sequence) || 1);
    // padStart adds leading zeroes but never truncates a sequence that grows
    // beyond the five-digit display width.
    const displaySequence = n < 100000 ? String(n).padStart(5, '0') : String(n);
    return `${ticketPrefix(group)}-${Number(year) || ticketYear()}-${displaySequence}`;
  }

  function sequenceFromTicketNo(value) {
    const match = String(value || '').match(/^(IT|FM|TR|NFV)-(\d{4})-(\d+)$/);
    return match
      ? { prefix: match[1], year: Number(match[2]), sequence: Number(match[3]) }
      : null;
  }

  function canonicalTicketNo(value) {
    const parsed = sequenceFromTicketNo(value);
    return parsed
      ? ticketNo(parsed.prefix === 'FM' ? 'Facility' : parsed.prefix === 'TR' ? 'Triage' : parsed.prefix === 'NFV' ? 'NFV' : 'IT', parsed.year, parsed.sequence)
      : value;
  }

  App.ids = {
    uid(prefix) {
      seq += 1;
      return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`;
    },
    // Backward-compatible name used by the current UI; it returns a public ticket number.
    ticketId(group, n, year) {
      return ticketNo(group, year || 2026, n);
    },
    ticketNo,
    ticketPrefix,
    ticketYear,
    sequenceFromTicketNo,
    canonicalTicketNo,
    // With a year, the key matches the TicketCounter primary key:
    // (GroupCode, TicketYear). Legacy Triage has an independent TR counter; new tickets use the single NFV-YYYY counter.
    counterKey(group, year) {
      const prefix = ticketPrefix(group);
      return year == null ? prefix : `${prefix}-${Number(year) || ticketYear()}`;
    },
  };
})();
