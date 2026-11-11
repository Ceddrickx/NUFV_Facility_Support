/* Live viewport adaptation. CSS does nearly everything; this sets <html data-bp> and notifies the few components that
   need JS. matchMedia + a debounced ResizeObserver. No polling, no reload, no user-agent sniffing. */
(function () {
  const App = (window.App = window.App || {});
  const listeners = new Set();
  const BPS = [
    ['sm', 0],
    ['md', 640],
    ['lg', 1024],
    ['xl', 1440],
    ['xxl', 1920],
  ];
  let current = '';
  let baseH = 0; // tallest window height seen, to tell an on-screen keyboard from a normal resize

  function bpFor(w) {
    let r = 'sm';
    BPS.forEach(([n, min]) => {
      if (w >= min) r = n;
    });
    return r;
  }
  function update() {
    const w = document.documentElement.clientWidth;
    const scrollbar = Math.max(0, window.innerWidth - w);
    const bp = bpFor(w);
    document.documentElement.dataset.bp = bp;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbar}px`);
    document.documentElement.style.setProperty(
      '--vvh',
      `${window.visualViewport ? window.visualViewport.height : window.innerHeight}px`,
    );
    if (bp !== current) {
      const prev = current;
      current = bp;
      if (prev) listeners.forEach((fn) => fn(bp, prev));
    }
  }
  // On-screen keyboard: mark <body class="kb-open"> and publish how much of the bottom edge it covers (--kb), so pinned panels like the chat can sit above it.
  function syncKeyboard() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    const a = document.activeElement;
    const typing = !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|file)$/.test(a.type)));
    if (!typing) baseH = Math.max(window.innerHeight, h);
    else baseH = Math.max(baseH, window.innerHeight);
    const covered = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    const open = typing && baseH - h > 120;
    document.body.classList.toggle('kb-open', open);
    document.documentElement.style.setProperty('--kb', open ? covered + 'px' : '0px');
    if (open && a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
  }
  let timer;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(update, 120);
  };

  App.viewport = {
    init() {
      update();
      baseH = window.innerHeight;
      if (window.ResizeObserver) new ResizeObserver(debounced).observe(document.documentElement);
      window.addEventListener('resize', debounced);
      window.addEventListener('orientationchange', debounced);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', debounced);
        window.visualViewport.addEventListener('resize', syncKeyboard);
        window.visualViewport.addEventListener('scroll', syncKeyboard);
      }
      window.addEventListener('resize', syncKeyboard);
      document.addEventListener('focusin', () => setTimeout(syncKeyboard, 50));
      document.addEventListener('focusout', () => setTimeout(syncKeyboard, 50));
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    bp: () => current,
    isSmall: () => current === 'sm',
    isLarge: () => current === 'lg' || current === 'xl' || current === 'xxl',
  };
})();
