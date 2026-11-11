/* Shared camera helper: opens the device camera through the browser (getUserMedia) and turns failures into clear messages.
   Used by the QR scanner and the "Take photo" dialog. Nothing is recorded or sent anywhere. */
(function () {
  const App = (window.App = window.App || {});

  const MESSAGES = {
    NotAllowedError: 'Camera permission was denied. Allow camera access in your browser settings, then try again.',
    SecurityError: 'Camera permission was denied. Allow camera access in your browser settings, then try again.',
    NotFoundError: 'No camera was found on this device.',
    OverconstrainedError: 'No camera was found on this device.',
    NotReadableError: 'The camera is being used by another app. Close it and try again.',
    AbortError: 'The camera could not be started. Please try again.',
  };
  const explain = (err) => {
    if (!window.isSecureContext)
      return 'The camera only works on a secure page (https or localhost). Open the site from its https address.';
    return MESSAGES[err && err.name] || 'The camera could not be started. Please try again.';
  };

  // open() resolves with a MediaStream, or rejects with an Error whose .message is ready to show to the user.
  function open() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error(window.isSecureContext ? 'This browser cannot use the camera.' : explain()));
    }
    const tryOpen = (video) => navigator.mediaDevices.getUserMedia({ video, audio: false });
    return tryOpen({ facingMode: { ideal: 'environment' } })
      .catch((e) =>
        e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError') ? tryOpen(true) : Promise.reject(e),
      )
      .catch((e) => {
        const err = new Error(explain(e));
        err.denied = !!(window.isSecureContext && e && (e.name === 'NotAllowedError' || e.name === 'SecurityError'));
        throw err;
      });
  }
  function stop(stream) {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  // Static prompt shown while no camera is open. It is only a graphic: it never scans or triggers anything.
  // denied = true swaps the copy and state class; the camera request remains controlled by QRCodeScanner.
  const placeholder = (denied) =>
    `<div class="cam-prompt ${denied ? 'is-denied' : ''}">
      <span class="cam-prompt-kicker">Camera scanner</span>
      <span class="cam-prompt-icon-wrap"><img class="cam-prompt-icon" src="assets/camera.png" alt="" aria-hidden="true" draggable="false"></span>
      <div class="cam-prompt-copy"><h3 class="cam-prompt-title">${denied ? 'Camera access is blocked' : 'Allow camera access'}</h3><p class="cam-prompt-text">${denied ? 'Reload the page and enable camera access to scan the location QR code.' : 'Camera access is needed to scan the location QR code.'}</p></div>
    </div>`;

  App.camera = { open, stop, explain, placeholder };
})();
