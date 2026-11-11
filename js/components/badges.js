/* StatusBadge, honesty tags. Every badge = icon + text (never colour alone). */
(function () {
  const App = (window.App = window.App || {});
  const ic = (n) => App.icon(n);

  const STATUS = {
    Pending: ['st-pending', 'clock'],
    Assigned: ['st-assigned', 'user'],
    'In Progress': ['st-inprogress', 'progress'],
    Resolved: ['st-resolved', 'check'],
    'Closed / Verified': ['st-closed', 'check2'],
    Reopened: ['st-reopened', 'rotate'],
  };

  const statusBadge = (s) => {
    const [c, i] = STATUS[s] || ['st-pending', 'clock'];
    return `<span class="badge ${c}">${ic(i)}${App.fmt.esc(s)}</span>`;
  };
  // Presentation badges were retired: kept as no-ops so existing call sites render nothing.
  const simTag = () => '';
  const futureTag = () => '';
  const demoTag = () => '';

  const catIcon = (cat) => (App.C.catByName(cat) || { icon: 'help' }).icon;

  App.badges = {
    statusBadge,
    simTag,
    futureTag,
    demoTag,
    catIcon,
  };
})();
