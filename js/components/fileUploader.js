/* FileUploader (photo and video) with ImagePreview and VideoPreview. Browser-side only: File API + URL.createObjectURL.
   File contents are NEVER written to localStorage; only metadata is. Object URLs are revoked on remove.
   App.files keeps the blob URLs for this browser session so ticket pages can show real thumbnails until reload. */
(function () {
  const App = (window.App = window.App || {});
  const esc = (s) => App.fmt.esc(s);
  App.files = App.files || {};

  // Live camera dialog for "Take photo": preview, capture, then Use photo / Retake / Cancel. onPhoto receives a real JPEG File.
  function cameraDialog(onPhoto) {
    let stream = null,
      shot = null,
      handle = null,
      closed = false;
    const body = `<div class="cam-dialog"><div class="cam-stage idle" id="cam-stage"><div class="cam-ph" id="cam-ph">${App.camera.placeholder()}</div><video id="cam-live" autoplay playsinline muted hidden></video><img id="cam-shot" alt="Captured photo preview" hidden></div><div id="cam-msg" role="alert"></div></div>`;
    const $ = (id) => handle.el.querySelector(id);
    const msg = (t) => {
      $('#cam-msg').innerHTML = t
        ? `<div class="banner bad mt-2">${App.icon('alert')}<div class="grow">${esc(t)}</div></div>`
        : '';
    };
    const live = (on) => {
      $('#cam-live').hidden = !on;
      $('#cam-shot').hidden = on;
      handle.setFooter(
        on
          ? [
              { label: 'Cancel', cls: 'secondary', testid: 'cam-cancel' },
              { label: 'Capture', testid: 'cam-capture', onClick: capture },
            ]
          : [
              { label: 'Cancel', cls: 'secondary', testid: 'cam-cancel' },
              { label: 'Retake', cls: 'secondary', testid: 'cam-retake', onClick: retake },
              { label: 'Use photo', testid: 'cam-use', onClick: use },
            ],
      );
    };
    function capture() {
      const v = $('#cam-live');
      if (!stream || !v.videoWidth) {
        msg('The camera is not ready yet. Please wait a moment and try again.');
        return false;
      }
      const c = document.createElement('canvas');
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      c.toBlob(
        (b) => {
          if (!b || closed) return;
          shot = new File([b], `photo-${Date.now().toString().slice(-6)}.jpg`, { type: 'image/jpeg' });
          $('#cam-shot').src = URL.createObjectURL(b);
          live(false);
        },
        'image/jpeg',
        0.9,
      );
      return false;
    }
    function retake() {
      shot = null;
      live(true);
      return false;
    }
    function use() {
      const f = shot;
      shot = null;
      onPhoto(f);
    }
    handle = App.modal.open({
      title: 'Take photo',
      body,
      wide: true,
      testid: 'camera-modal',
      footer: [{ label: 'Cancel', cls: 'secondary' }],
      onOpen: (h) => {
        handle = h;
        $('#cam-live').hidden = true;
        handle.setFooter([{ label: 'Cancel', cls: 'secondary', testid: 'cam-cancel' }]);
        App.camera
          .open()
          .then((s) => {
            if (closed) {
              App.camera.stop(s);
              return;
            }
            stream = s;
            const v = $('#cam-live');
            v.srcObject = s;
            v.hidden = false;
            $('#cam-ph').hidden = true;
            $('#cam-stage').classList.remove('idle');
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
            live(true);
          })
          .catch((e) => {
            if (e.denied) {
              $('#cam-ph').innerHTML = App.camera.placeholder(true);
              return;
            }
            msg(e.message);
          });
      },
      onClose: () => {
        closed = true;
        App.camera.stop(stream);
        stream = null;
        const i = handle && handle.el.querySelector('#cam-shot');
        if (i && i.src.startsWith('blob:')) URL.revokeObjectURL(i.src);
      },
    });
  }

  function videoInfo(url) {
    // capture a frame + duration; resolves even if the browser cannot decode the file
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.muted = true;
      v.preload = 'metadata';
      v.src = url;
      const done = (o) => {
        v.removeAttribute('src');
        resolve(o || {});
      };
      const t = setTimeout(() => done({}), 2500);
      v.addEventListener('loadeddata', () => {
        try {
          v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
        } catch (e) {
          clearTimeout(t);
          done({ duration: v.duration });
        }
      });
      v.addEventListener('seeked', () => {
        clearTimeout(t);
        try {
          const c = document.createElement('canvas');
          c.width = 160;
          c.height = 100;
          c.getContext('2d').drawImage(v, 0, 0, 160, 100);
          done({ thumb: c.toDataURL('image/jpeg', 0.6), duration: v.duration });
        } catch (e) {
          done({ duration: v.duration });
        }
      });
      v.addEventListener('error', () => {
        clearTimeout(t);
        done({});
      });
    });
  }

  function previewModal(it) {
    const body = it.kind.includes('video')
      ? `<video controls playsinline class="video-preview" src="${it.url}" aria-label="Video preview of ${esc(it.name)}"></video><p class="muted small">Preview: ${esc(it.name)}${it.duration ? ` (${Math.round(it.duration)} s)` : ''}. Local browser preview only.</p>`
      : `<img src="${it.url}" alt="Preview of ${esc(it.name)}" style="width:100%;max-height:60vh;object-fit:contain">`;
    App.modal.open({
      title: it.kind.includes('video') ? 'Video preview' : 'Photo preview',
      body,
      wide: true,
      footer: [{ label: 'Close', cls: 'secondary' }],
    });
  }

  // create(host, {kind, onChange}) -> controller
  function create(host, o) {
    const isVideo = o.kind.includes('video');
    const base = isVideo ? 'video' : 'photo';
    const items = [];
    const uploadTimers = new Map();
    let errors = [];
    let replaceId = null;
    host.innerHTML = '<div data-up-body></div>';
    const input = document.createElement('input');
    input.type = 'file';
    input.hidden = true;
    input.tabIndex = -1;
    input.accept = isVideo ? 'video/mp4,video/webm,video/quicktime,.mov' : 'image/jpeg,image/png,image/webp';
    input.multiple = !isVideo;
    input.setAttribute('data-testid', `file-input-${o.kind}`);
    host.appendChild(input);
    const body = host.querySelector('[data-up-body]');

    const notify = () => o.onChange && o.onChange(ctrl);

    function render() {
      const okCount = items.filter((i) => i.status === 'ok' || i.status === 'uploading').length;
      const full = okCount >= (isVideo ? 1 : 5);
      body.innerHTML = `
        <div class="dropzone" data-dz tabindex="-1" role="group" aria-label="${isVideo ? 'Video' : 'Photo'} upload area">
          <p class="mb-2">${App.icon(isVideo ? 'video' : 'image')} <b>${isVideo ? 'Drag a short video here' : 'Drag photos here'}</b> <span class="muted">or</span></p>
          <div class="row jc-c">
            <button type="button" class="btn" data-up="browse" ${full ? 'disabled' : ''} data-testid="browse-${o.kind}">${App.icon('upload')}Browse Files</button>
            ${isVideo ? '' : `<button type="button" class="btn secondary" data-up="camera" ${full ? 'disabled' : ''} data-testid="take-photo">${App.icon('camera')}Take photo</button>`}
          </div>
          <p class="help mt-2">${isVideo ? 'MP4, WebM or MOV. Max 25 MB, 1 video.' : 'JPG, PNG or WEBP. Max 5 MB each, up to 5 photos.'}</p>
        </div>
        <div role="alert" aria-live="assertive">${errors.map((e) => `<div class="banner bad mt-2">${App.icon('alert')}<div class="grow">${esc(e)}</div></div>`).join('')}</div>
        <div class="file-list" aria-live="polite">${items.map(itemHtml).join('')}</div>`;
    }
    function itemHtml(it) {
      const thumb = it.kind.includes('video')
        ? it.thumb
          ? `<img src="${it.thumb}" alt="">`
          : `<span class="thumb">${App.icon('video')}</span>`
        : `<img src="${it.url}" alt="Thumbnail of ${esc(it.name)}">`;
      return `<div class="file-item" data-id="${it.id}" data-testid="file-item">${thumb}
        <div class="info"><b>${esc(it.name)}</b><br>${App.fmt.size(it.size)}${it.duration ? ` · ${Math.round(it.duration)} s` : ''}
          ${it.status === 'uploading' ? `<div class="progress" role="progressbar" aria-label="Uploading ${esc(it.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${it.progress}"><i style="transform:scaleX(${it.progress / 100})"></i></div>` : `<div class="dev-online">${App.icon('check')} Added</div>`}</div>
        <div class="btns"><button type="button" class="btn sm secondary" data-up="preview" data-id="${it.id}">${App.icon('eye')}Preview</button>
          <button type="button" class="btn sm secondary" data-up="replace" data-id="${it.id}">Replace</button>
          <button type="button" class="btn sm danger" data-up="remove" data-id="${it.id}" aria-label="Remove ${esc(it.name)}">${App.icon('trash')}Remove</button></div></div>`;
    }

    async function add(fileList) {
      errors = [];
      const files = [...fileList];
      for (const file of files) {
        const existing = items.filter((i) => i.id !== replaceId).length;
        const err = App.validators.file(file, base, existing);
        if (err) {
          errors.push(err);
          continue;
        }
        const it = {
          id: App.ids.uid('att'),
          kind: o.kind,
          name: file.name,
          size: file.size,
          mime: file.type || (isVideo ? 'video/mp4' : 'image/png'),
          url: URL.createObjectURL(file),
          file,
          status: 'uploading',
          progress: 0,
        };
        if (replaceId) {
          remove(replaceId, true);
          replaceId = null;
        }
        items.push(it);
        if (isVideo) Object.assign(it, await videoInfo(it.url));
        simulateUpload(it);
      }
      replaceId = null;
      render();
      notify();
    }
    // Simulated upload progress bar (~1 s) before the file counts as added.
    function simulateUpload(it) {
      let p = 0;
      const t = setInterval(() => {
        p += 20;
        it.progress = Math.min(p, 100);
        if (p >= 100) {
          clearInterval(t);
          uploadTimers.delete(it.id);
          it.status = 'ok';
          App.files[it.id] = { url: it.url, kind: it.kind, thumb: it.thumb };
          App.toast.show('File uploaded.', 'success');
          notify();
        }
        if (document.contains(host)) render();
      }, 200);
      uploadTimers.set(it.id, t);
    }
    function remove(id, silent) {
      const i = items.findIndex((x) => x.id === id);
      if (i < 0) return;
      const timer = uploadTimers.get(id);
      if (timer) {
        clearInterval(timer);
        uploadTimers.delete(id);
      }
      URL.revokeObjectURL(items[i].url);
      delete App.files[id];
      items.splice(i, 1);
      if (!silent) {
        render();
        notify();
      }
    }

    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-up]');
      if (!b || !host.contains(b)) return;
      const a = b.dataset.up;
      if (a === 'browse') {
        replaceId = null;
        input.value = '';
        input.click();
      } else if (a === 'camera') {
        replaceId = null;
        cameraDialog((f) => add([f]));
      } else if (a === 'remove') {
        const item = items.find((x) => x.id === b.dataset.id);
        if (!item) return;
        App.modal.confirm({
          title: 'Remove this file?',
          body: `<p><b>${esc(item.name)}</b> will be removed from this report.</p>`,
          okLabel: 'Remove',
          danger: true,
          onOk: () => remove(item.id),
        });
      }
      else if (a === 'replace') {
        replaceId = b.dataset.id;
        input.value = '';
        input.click();
      } else if (a === 'preview') previewModal(items.find((x) => x.id === b.dataset.id));
    });
    input.addEventListener('change', () => {
      if (input.files.length) add(input.files);
    });
    const dz = () => host.querySelector('[data-dz]');
    host.addEventListener('dragover', (e) => {
      if (e.target.closest('[data-dz]')) {
        e.preventDefault();
        dz().classList.add('drag');
      }
    });
    host.addEventListener('dragleave', () => dz() && dz().classList.remove('drag'));
    host.addEventListener('drop', (e) => {
      if (e.target.closest('[data-dz]')) {
        e.preventDefault();
        dz().classList.remove('drag');
        add(e.dataTransfer.files);
      }
    });

    const ctrl = {
      items,
      ready: () => items.every((i) => i.status === 'ok'),
      metadata: () =>
        items
          .filter((i) => i.status === 'ok')
          .map((i) => ({ id: i.id, kind: i.kind, name: i.name, size: i.size, mime: i.mime })),
      clear: () => {
        [...items].forEach((i) => remove(i.id, true));
        errors = [];
        render();
        notify();
      },
      destroy: () => {
        uploadTimers.forEach((timer) => clearInterval(timer));
        uploadTimers.clear();
        items.forEach((i) => {
          URL.revokeObjectURL(i.url);
          delete App.files[i.id];
        });
        items.length = 0;
      },
      render,
    };
    render();
    return ctrl;
  }

  // Thumbnail for an attachment on a ticket page (real image this session, placeholder otherwise).
  function thumb(a) {
    const f = App.files[a.id];
    const label = `<small>${esc(a.name)}<br>${App.fmt.size(a.size)}</small>`;
    if (f && a.kind.includes('photo'))
      return `<div class="attach"><button type="button" class="ph" style="padding:0;border:0;background:none;width:100%" data-view-att="${a.id}" aria-label="Preview ${esc(a.name)}"><img src="${f.url}" alt="${esc(a.name)}" style="width:100%;aspect-ratio:4/3;object-fit:cover"></button>${label}</div>`;
    if (f && a.kind.includes('video'))
      return `<div class="attach"><button type="button" class="ph" style="padding:0;border:0;width:100%;background:var(--border)" data-view-att="${a.id}" aria-label="Preview video ${esc(a.name)}">${f.thumb ? `<img src="${f.thumb}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover">` : App.icon('video')}</button>${label}</div>`;
    return `<div class="attach"><div class="ph" role="img" aria-label="Placeholder thumbnail for ${esc(a.name)}">${App.icon(a.kind.includes('video') ? 'video' : 'image')}</div>${label}</div>`;
  }
  function viewAttachment(id) {
    const f = App.files[id];
    if (!f) return;
    previewModal({ url: f.url, kind: f.kind, name: 'attachment' });
  }

  App.uploader = { create, thumb, viewAttachment };
})();
