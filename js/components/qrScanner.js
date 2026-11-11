/* QRCodeScanner (spec 12). Scans with the device camera through the browser (getUserMedia) and decodes each frame with jsQR
   (assets/vendor/jsQR.js). "Enter location code" stays as the typed fallback. Payload format: NUF-LOC:<locationId>. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  let stream = null;
  let raf = 0;
  let canvas = null;

  const loc = (id) => App.store.state.locations.find((l) => l.id === id);
  function parsePayload(v) {
    const m = /^NUF-LOC:([A-Za-z0-9-]+)$/.exec((v || '').trim());
    const rawId = m ? m[1].toUpperCase() : '';
    const canonicalId = rawId ? (App.seed.locationRemap[rawId] || rawId) : '';
    return canonicalId && App.metrics.activeLocations().some((l) => l.id === canonicalId) ? canonicalId : null;
  }

  function locCard(l) {
    return `<div class="loc-card" data-testid="location-card"><div class="muted small">${esc(l.building)}</div><div class="muted small">${App.seed.floorLabel(l.floor)}</div>
      <div class="big">${esc(l.name)}</div><div>Location ID: <b>${esc(l.id)}</b></div></div>`;
  }

  // The line under the camera box changes with the scan state.
  function statusText(st, detected) {
    if (detected) return 'QR code scanned successfully';
    if (st.denied) return '';
    if (st.error) return 'Unable to scan the QR code';
    if (st.scanning) return 'Align the QR code inside the frame';
    return '';
  }

  function html(st, form) {
    const S = App.store.state;
    const chosen = form.locationId ? loc(form.locationId) : null;
    // First view: two equal choices. The camera stays off until the reporter picks "Scan a QR code".
    if (st.mode === 'choose') {
      return `<p class="muted small mb-2">How would you like to set the location?</p>
        <div class="loc-choice" data-testid="location-choice">
          <button type="button" class="loc-choice-btn" data-qs="mode-scan" data-testid="choose-scan">${App.icon('qr')}<b>Scan a QR code</b><span>Use the camera on the code posted at the location</span></button>
          <button type="button" class="loc-choice-btn" data-qs="mode-manual" data-testid="choose-manual">${App.icon('pin')}<b>Select location manually</b><span>Pick the building, floor and room from a list</span></button>
        </div>`;
    }
    let inner = '';
    if (st.mode === 'scan') {
      const detected = st.detected && loc(st.detected);
      const status = statusText(st, detected);
      const finderState = [st.camera ? 'is-live' : 'is-idle', st.denied ? 'is-denied' : '', st.error ? 'is-error' : '', detected ? 'is-detected' : ''].filter(Boolean).join(' ');
      inner = `
        <div class="viewfinder ${finderState}" id="vf">${st.camera ? '<video id="cam" autoplay playsinline muted aria-hidden="true"></video><span class="qr-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' : App.camera.placeholder(st.denied)}</div>
        <p class="scan-status ${status ? 'has-status' : ''}" role="status" id="scan-status">${status ? `<span class="scan-status-dot" aria-hidden="true"></span><span>${esc(status)}</span>` : ''}</p>
        ${st.error && !st.denied ? `<div class="banner bad" role="alert">${App.icon('alert')}<div class="grow"><p>${esc(st.error)}</p></div></div>` : ''}
        ${detected ? `<div class="banner good scanner-detected" role="status">${App.icon('check')}<div class="grow"><b>QR Code Detected</b></div></div><div class="mt-2">${locCard(detected)}</div>` : ''}
        <div class="scanner-form-spacer" aria-hidden="true"></div>
        <form data-qs-form class="row ai-end"><div class="grow field m-0" data-field="qr-code"><label for="qr-code">Enter location code</label><input class="input" id="qr-code" placeholder="e.g., Room 402L" autocomplete="off" data-testid="location-code" value="${esc(st.codeText || '')}"></div><button type="submit" class="btn secondary" data-testid="apply-code">Apply</button></form>`;
    } else {
      const m = st.manual;
      const active = App.metrics.activeLocations();
      const rank = (a, b) => App.seed.floorRank(a) - App.seed.floorRank(b);
      const buildings = [...new Set(active.map((l) => l.building))];
      const floors = [...new Set(active.filter((l) => l.building === m.b).map((l) => l.floor))].sort(rank);
      const onFloor = active.filter((l) => l.building === m.b && String(l.floor) === String(m.f));
      // Only the location types that exist on the chosen floor are offered (LG and UG, for example, have no hallway or restroom).
      const kinds = App.seed.LOCATION_KINDS.filter((k) => onFloor.some((l) => App.seed.kindOf(l) === k.value));
      const kind = App.seed.LOCATION_KINDS.find((k) => k.value === m.k);
      const rooms = kind ? onFloor.filter((l) => App.seed.kindOf(l) === kind.value) : [];
      const mLoc = m.r && loc(m.r);
      inner = `<div class="form-grid qs-manual-grid">
        <div class="field" data-field="mb"><label for="mb">Building</label><select class="select" id="mb" data-qs-sel="b" data-testid="sel-building">${App.ui.options(buildings, m.b, 'Select building')}</select></div>
        <div class="field" data-field="mf"><label for="mf">Floor</label><select class="select" id="mf" data-qs-sel="f" ${m.b ? '' : 'disabled'} data-testid="sel-floor">${App.ui.options(
          App.seed.BUILDING_FLOORS[m.b] || floors.map((f) => ({ value: f, label: `Floor ${f}` })),
          m.f,
          'Select floor',
        )}</select></div>
        <div class="field" data-field="mk"><label for="mk">Location type</label><select class="select" id="mk" data-qs-sel="k" ${m.f ? '' : 'disabled'} data-testid="sel-kind">${App.ui.options(
          kinds.map((k) => ({ value: k.value, label: k.label })),
          m.k,
          'Select location type',
        )}</select></div>
        <div class="field" data-field="mr"><label for="mr">${esc(kind ? kind.field : 'Location')}</label><select class="select" id="mr" data-qs-sel="r" ${kind ? '' : 'disabled'} data-testid="sel-room">${App.ui.options(
          rooms.map((l) => ({ value: l.id, label: l.name })),
          m.r,
          `Select ${kind ? kind.label.toLowerCase() : 'location'}`,
        )}</select></div></div>
        ${mLoc ? locCard(mLoc) : ''}`;
    }
    const candidate = st.mode === 'scan' ? st.detected : st.manual.r;
    const hint = st.mode === 'scan' ? '<p class="muted small mb-2">Scan the QR code posted at the location.</p>' : '';
    return `${hint}<div>${inner}</div>
      <div class="mt-4">${chosen ? `<div class="banner good" role="status">${App.icon('check')}<div class="grow">Location confirmed: <b>${esc(chosen.name)}</b> (${esc(chosen.id)})</div></div>` : ''}
        <div class="row mt-2"><button type="button" class="btn success" data-qs="confirm" ${candidate ? '' : 'disabled'} data-testid="confirm-location">${App.icon('check')} Confirm Location</button>
        <button type="button" class="btn secondary" data-qs="again">${st.mode === 'scan' ? 'Scan Again' : 'Clear selection'}</button></div>
</div>`;
  }

  // Shown on the right of the "Step 1" title: one tap switches between the QR scanner and the manual lists.
  function swapHtml(st) {
    if (st.mode === 'manual') return `<button type="button" class="btn sm quiet scanner-fallback" data-qs="mode-scan" data-testid="mode-scan">${App.icon('qr')} Scan QR code instead</button>`;
    if (st.mode === 'scan') return `<button type="button" class="btn sm quiet scanner-fallback" data-qs="mode-manual" data-testid="mode-manual">${App.icon('pin')} Can't scan? Choose location manually</button>`;
    return '';
  }

  function stopCamera() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (stream) {
      App.camera.stop(stream);
      stream = null;
    }
  }
  function destroy() {
    stopCamera();
  }
  // Stops the camera without touching the rest of the state (used when the wizard leaves step 1).
  function pause(st) {
    stopCamera();
    st.camera = false;
    st.scanning = false;
  }
  // A redraw replaces the <video>, so give the live stream back to the new one.
  function attachVideo(st) {
    const v = document.getElementById('cam');
    if (v && stream && st.camera) {
      v.srcObject = stream;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  // Asks for the camera and scans continuously. Runs on entering the screen and on Scan Again, and keeps scanning until a code is read or the user leaves or switches mode.
  function start(st, redraw) {
    stopCamera();
    st.detected = null;
    st.error = '';
    st.denied = false;
    st.scanning = true;
    st.camera = false;
    redraw();
    App.camera
      .open()
      .then((s) => {
        if (!st.scanning) {
          App.camera.stop(s);
          return;
        }
        stream = s;
        st.camera = true;
        redraw();
        const v = document.getElementById('cam');
        if (v) {
          v.srcObject = s;
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        }
        loop(st, redraw);
      })
      .catch((e) => {
        stopCamera();
        st.scanning = false;
        st.camera = false;
        st.denied = !!e.denied;
        st.error = e.message;
        redraw();
      });
  }
  // Starts only if nothing is running and no location is confirmed yet.
  function autoStart(st, form, redraw) {
    if (st.mode !== 'scan' || st.scanning || st.camera || st.detected || form.locationId) return;
    start(st, redraw);
  }

  // Reads one video frame at a time and hands it to jsQR. Wrong QR codes keep the camera running.
  function loop(st, redraw) {
    const v = document.getElementById('cam');
    if (!stream || !v) return;
    if (v.readyState >= 2 && v.videoWidth) {
      const w = Math.min(v.videoWidth, 640),
        h = Math.round((w * v.videoHeight) / v.videoWidth);
      canvas = canvas || document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext('2d', { willReadFrequently: true });
      g.drawImage(v, 0, 0, w, h);
      const hit =
        window.jsQR && window.jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      if (hit && hit.data) {
        const id = parsePayload(hit.data);
        const status = document.getElementById('scan-status');
        if (id) {
          stopCamera();
          st.camera = false;
          st.scanning = false;
          st.error = '';
          st.detected = id;
          redraw();
          return;
        }
        if (status) status.textContent = 'Unable to scan the QR code';
      }
    }
    raf = requestAnimationFrame(() => loop(st, redraw));
  }

  // Handles one data-qs action. redraw() re-renders the step; form is the wizard's data.
  function handle(act, st, form, redraw, target) {
    if (act === 'mode-scan') {
      st.mode = 'scan';
      start(st, redraw);
    } else if (act === 'mode-manual') {
      stopCamera();
      st.camera = false;
      st.scanning = false;
      st.mode = 'manual';
      redraw();
    } else if (act === 'back-choose') {
      // Back to the "scan or select manually" choice.
      stopCamera();
      st.camera = false;
      st.scanning = false;
      st.detected = null;
      st.error = '';
      st.denied = false;
      st.codeText = '';
      st.mode = 'choose';
      redraw();
    } else if (act === 'again') {
      st.codeText = '';
      if (st.mode === 'scan') start(st, redraw);
      else {
        stopCamera();
        st.manual = { b: '', f: '', k: '', r: '' };
        form.locationId = '';
        st.detected = null;
        st.error = '';
        st.denied = false;
        st.scanning = false;
        st.camera = false;
        redraw();
      }
    } else if (act === 'confirm') {
      const id = st.mode === 'scan' ? st.detected : st.manual.r;
      if (!id) {
        App.toast.show('Please select a location.', 'warning');
        return;
      }
      form.locationId = id;
      stopCamera();
      st.camera = false;
      redraw();
      App.toast.show(`Location confirmed: ${App.metrics.locName(id)}.`, 'success');
    }
  }
  function submitCode(st, text, redraw) {
    st.codeText = text;
    const id = parsePayload(text);
    if (!id) {
      st.error = 'This QR code is not an NU Fairview location.';
      st.detected = null;
    } else {
      stopCamera();
      st.camera = false;
      st.scanning = false;
      st.error = '';
      st.detected = id;
    }
    redraw();
    attachVideo(st);
  }
  function selectManual(st, which, value) {
    const m = st.manual;
    m[which] = value;
    // Each select clears the ones below it: Building > Floor > Location type > Location.
    if (which === 'b') {
      m.f = '';
      m.k = '';
      m.r = '';
    }
    if (which === 'f') {
      m.k = '';
      m.r = '';
    }
    if (which === 'k') m.r = '';
  }

  App.qrScanner = {
    swapHtml,
    html,
    handle,
    submitCode,
    selectManual,
    destroy,
    pause,
    autoStart,
    parsePayload,
    newState: (form, scanRequested) => {
      const l0 = form.locationId && loc(form.locationId);
      const l = l0 && !l0.retired ? l0 : null;
      return {
        mode: l ? 'manual' : scanRequested ? 'scan' : 'choose',
        autoStart: !!scanRequested && !l,
        detected: null,
        scanning: false,
        error: '',
        denied: false,
        camera: false,
        codeText: '',
        manual: { b: l ? l.building : '', f: l ? l.floor : '', k: l ? App.seed.kindOf(l) : '', r: l ? l.id : '' },
      };
    },
  };
})();
