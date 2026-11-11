/* Modal: focus trap, Esc to close, backdrop click (unless destructive), returns focus, role=dialog + aria-modal.
   Stays in the DOM during window resize, so it is simply re-laid out by CSS (bottom sheet on phones, dialog on larger screens). */
(function () {
  const App = (window.App = window.App || {});
  const stack = [];
  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function open(o) {
    const root = document.getElementById('modal-root');
    const returnTo = document.activeElement;
    const id = App.ids.uid('dlg');
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `
      <div class="modal ${o.wide ? 'wide' : ''}" role="${o.alert ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="${id}-t" data-testid="${o.testid || 'modal'}">
        <div class="modal-head"><h2 id="${id}-t"></h2><button type="button" class="icon-btn" data-close aria-label="Close dialog">${App.icon('x')}</button></div>
        <div class="modal-body"></div>
        ${o.footer && o.footer.length ? '<div class="modal-foot"></div>' : ''}
      </div>`;
    back.querySelector('h2').textContent = o.title;
    const body = back.querySelector('.modal-body');
    body.innerHTML = o.body || '';
    const handle = {
      el: back,
      body,
      close,
      setBody(h) {
        body.innerHTML = h;
      },
      setFooter: null,
    };
    const foot = back.querySelector('.modal-foot');
    function buildFooter(list) {
      if (!foot) return;
      foot.innerHTML = '';
      list.forEach((b) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn ${b.cls || ''}`;
        if (/^(cancel|no, keep|discard)/i.test(b.label)) btn.classList.add('cancel');
        btn.textContent = b.label;
        if (b.testid) btn.dataset.testid = b.testid;
        if (b.disabled) btn.disabled = true;
        btn.addEventListener('click', () => {
          try {
            const r = b.onClick ? b.onClick(handle, btn) : undefined;
            if (b.close !== false && r !== false) close();
          } catch (e) {
            // Keep a failed dialog action recoverable instead of leaving an
            // unhandled exception with no feedback.
            App.reportError && App.reportError(e, true);
            App.toast.show('Unable to complete that action. Please try again.', 'error');
          }
        });
        foot.appendChild(btn);
      });
    }
    handle.setFooter = buildFooter;
    buildFooter(o.footer || []);

    function close() {
      const i = stack.indexOf(handle);
      if (i < 0) return;
      stack.splice(i, 1);
      // Exit animation (faster than the entrance); inert so the closing dialog cannot take focus or clicks meanwhile.
      back.setAttribute('inert', '');
      back.setAttribute('aria-hidden', 'true');
      App.leave(back, () => back.remove());
      if (!stack.length) document.body.style.overflow = '';
      if (o.onClose) o.onClose();
      if (returnTo && document.contains(returnTo) && returnTo.focus) returnTo.focus();
    }
    back.addEventListener('mousedown', (e) => {
      if (e.target === back && o.dismissable !== false && !o.destructive) close();
    });
    back.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) close();
    });
    back.addEventListener('keydown', (e) => {
      if (stack[stack.length - 1] !== handle) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (o.dismissable !== false) close();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = [...back.querySelectorAll(FOCUSABLE)].filter(
        (x) => x.offsetParent !== null || x === document.activeElement,
      );
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    root.appendChild(back);
    stack.push(handle);
    document.body.style.overflow = 'hidden';
    if (o.onOpen) o.onOpen(handle);
    const auto =
      back.querySelector('[autofocus]') ||
      back.querySelector('.modal-body input,.modal-body select,.modal-body textarea') ||
      back.querySelector('.modal-foot .btn') ||
      back.querySelector('[data-close]');
    if (auto) auto.focus();
    return handle;
  }

  // Confirmation dialog helper. Destructive ones do not close on backdrop click.
  function confirm(o) {
    return open({
      title: o.title,
      body: o.body,
      destructive: !!o.danger,
      alert: !!o.danger,
      testid: o.testid || 'confirm-modal',
      footer: [
        { label: o.cancelLabel || 'Cancel', cls: 'secondary' },
        {
          label: o.okLabel || 'Confirm',
          cls: o.danger ? 'danger' : o.okCls || '',
          testid: 'confirm-ok',
          onClick: () => {
            o.onOk && o.onOk();
          },
        },
      ],
    });
  }
  const closeAll = () => {
    [...stack].forEach((h) => h.close());
  };
  App.modal = { open, confirm, closeAll, isOpen: () => stack.length > 0 };
})();
