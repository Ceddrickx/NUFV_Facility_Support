/* NotificationItem: small colored icon and left border (not a full colored background). Shared with the topbar dropdown. */
(function () {
  const App = (window.App = window.App || {});
  App.notificationItem = (n) => App.topbar.notifItem(n, 'a');
})();
