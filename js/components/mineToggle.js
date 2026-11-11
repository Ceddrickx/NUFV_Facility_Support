/* Shared "Show only tickets assigned to me" checkbox: used by Scheduled Tickets and Ticket History so both behave the same.
   Markup is the same <label class="check"> + data-mine hook; the filter is by assigneeId. Default is ticked; state lives in memory only. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  const LABEL = 'Show only tickets assigned to me';
  const mineToggle = (on) => `<label class="check"><input type="checkbox" data-mine ${on ? 'checked' : ''}> ${esc(LABEL)}</label>`;
  const mineFilter = (list, on, getAssignee) =>
    on ? list.filter((x) => (getAssignee ? getAssignee(x) : x.assigneeId) === App.store.state.user) : list;
  App.mineToggle = { LABEL, DEFAULT: true, html: mineToggle, filter: mineFilter };
})();
