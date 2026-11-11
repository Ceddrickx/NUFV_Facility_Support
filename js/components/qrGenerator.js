/* QRCodeGenerator: real QR image encoding only the mock payload "NUF-LOC:<locationId>" (qrcode-generator, vendored locally). */
(function () {
  const App = (window.App = window.App || {});

  function matrix(payload) {
    const q = window.qrcode(0, 'M');
    q.addData(payload);
    q.make();
    return q;
  }
  // Draw black-on-white (with a quiet zone) onto a new canvas.
  function canvas(payload, scale) {
    const q = matrix(payload),
      n = q.getModuleCount(),
      s = scale || 6,
      quiet = 4;
    const c = document.createElement('canvas');
    c.width = c.height = (n + quiet * 2) * s;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#000';
    for (let r = 0; r < n; r++)
      for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + quiet) * s, (r + quiet) * s, s, s);
    return c;
  }
  const dataUrl = (payload, scale) => canvas(payload, scale).toDataURL('image/png');

  // Printable label (building, floor, room under the QR). Shown in a modal; Download saves a PNG; Print uses print.css.
  function labelHtml(loc) {
    return `<div class="qr-box print-qr-area" data-testid="qr-box"><img alt="QR code for ${App.fmt.esc(loc.name)}, payload ${App.fmt.esc(loc.qrPayload)}" src="${dataUrl(loc.qrPayload, 6)}" width="240" height="240">
      <div class="qr-name">${App.fmt.esc(loc.name)}</div>
      <div>${App.fmt.esc(loc.building)}, Floor ${loc.floor}${!['Hallway', 'Restroom'].includes(loc.type) ? `, Room ${App.fmt.esc(loc.room)}` : ''}</div><div class="qr-payload">${App.fmt.esc(loc.qrPayload)}</div></div>`;
  }
  function download(loc) {
    const a = document.createElement('a');
    a.href = dataUrl(loc.qrPayload, 10);
    a.download = `nufairview-qr-${loc.id.toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function print(loc) {
    const host = document.createElement('div');
    host.className = 'print-only print-qr-area';
    host.style.textAlign = 'center';
    host.innerHTML = `<div class="print-header"><h1>NU Fairview</h1><p>Location QR code</p></div>${labelHtml(loc)}`;
    document.getElementById('root').appendChild(host);
    document.body.classList.add('printing-qr');
    const done = () => {
      host.remove();
      document.body.classList.remove('printing-qr');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    const image = host.querySelector('img');
    const printWhenReady = () => {
      // Give the browser one paint cycle after the print-only layout is active
      // so the data-URL QR image is present in the print snapshot.
      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    };
    if (image && typeof image.decode === 'function') image.decode().catch(() => {}).then(printWhenReady);
    else if (!image || image.complete) printWhenReady();
    else image.addEventListener('load', printWhenReady, { once: true });
    setTimeout(() => {
      if (document.contains(host)) done();
    }, 1500);
  }
  function show(loc) {
    App.modal.open({
      title: `QR code: ${loc.name}`,
      body: `<div class="ta-c">${labelHtml(loc)}</div><p class="help ta-c">Location code <code>${App.fmt.esc(loc.qrPayload)}</code>. Black and white for reliable scanning.</p>`,
      footer: [
        {
          label: 'Download PNG',
          cls: 'secondary',
          close: false,
          onClick: () => {
            download(loc);
            App.toast.show('QR image downloaded.', 'success');
          },
        },
        { label: 'Print', cls: 'secondary', close: false, onClick: () => print(loc) },
        { label: 'Close' },
      ],
    });
  }
  App.qr = { canvas, dataUrl, labelHtml, download, print, show };
})();
