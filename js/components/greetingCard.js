/* Greeting card shown at the top of every role's dashboard (Student / Faculty, FMO, IT, Admin).
   App.greetingCard({ name, roleLabel }): time-of-day icon and greeting, "Welcome, <name>", a role pill and the date.
   The name and role label come from the signed-in account, so Faculty keep the "Faculty" label. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);

  App.greetingCard = function (p) {
    const h = App.fmt.parts(App.clock.now()).h;
    const period = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    const hello = `Good ${period}`;
    const icon = period === 'evening' ? 'moon' : 'sun';
    const iconStyle = period === 'morning' ? 'background:#f4c430;color:#3b2b00' : period === 'afternoon' ? 'background:#e9a23b;color:#4a2600' : 'background:#405078;color:#f7e7a9';
    return `<div class="hero-welcome rich" data-testid="welcome"><span class="hw-icon hw-${period}" style="${iconStyle}" aria-label="${hello}">${App.icon(icon)}</span>
      <div class="hw-text"><p class="hw-hello">${hello}</p><h1 class="page-title" id="page-h1" tabindex="-1">Welcome, <span class="hw-name">${esc(p.name)}</span></h1>
      <p class="hw-meta"><span class="hw-pill" data-testid="welcome-role">${esc(p.roleLabel)}</span><span class="hw-pill hw-date">${App.icon('calendar')}${esc(App.fmt.longDate(App.clock.now()))}</span></p></div></div>`;
  };
})();
