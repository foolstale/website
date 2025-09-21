// Theme Toggle + small UX niceties
(function () {
  const html = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  function setTheme(mode) {
    if (mode === 'light') html.classList.remove('theme-dark');
    else html.classList.add('theme-dark');
    try { localStorage.setItem('theme', mode); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('themechange', { detail: { mode } })); } catch (e) {}
  }

  // Initialize from storage or default to dark
  try {
    const stored = localStorage.getItem('theme');
    setTheme(stored === 'light' ? 'light' : 'dark');
  } catch (e) {
    setTheme('dark');
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = html.classList.contains('theme-dark');
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  // Smooth-scroll for same-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${id}`);
      }
    });
  });

  // Mobile nav toggle
  const menuBtn = document.querySelector('.menu-toggle');
  const siteNav = document.getElementById('site-nav');
  if (menuBtn && siteNav) {
    const setExpanded = (on) => {
      menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
      siteNav.classList.toggle('is-open', !!on);
    };
    const toggle = () => setExpanded(menuBtn.getAttribute('aria-expanded') !== 'true');
    const close = () => setExpanded(false);

    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    // Close when clicking a nav link
    siteNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!siteNav.classList.contains('is-open')) return;
      const within = siteNav.contains(e.target) || menuBtn.contains(e.target);
      if (!within) close();
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // Map pan/zoom (Tarris)
  const vp = document.getElementById('tarris-viewport');
  if (vp) {
    const img = vp.querySelector('.map-img');
    let scale = 1, minScale = 0.2, maxScale = 4;
    let origin = { x: 0, y: 0 };
    let start = null;

    function apply() { vp.style.transform = `translate(${origin.x}px, ${origin.y}px) scale(${scale})`; }

    // Fit map to viewport initially
    function fitToWrap() {
      const wrap = vp.closest('.map-wrap') || vp.parentElement;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const iw = (img && img.naturalWidth) || 2500;
      const ih = (img && img.naturalHeight) || 1892;
      if (!iw || !ih || !rect.width || !rect.height) return;
      // Fit entire image in view
      const s = Math.min(rect.width / iw, rect.height / ih);
      scale = s;
      // Center the image
      const scaledW = iw * scale;
      const scaledH = ih * scale;
      origin.x = Math.round((rect.width - scaledW) / 2);
      origin.y = Math.round((rect.height - scaledH) / 2);
      apply();
    }
    // If the image loads later, refit
    if (img) {
      if (img.complete) fitToWrap();
      else img.addEventListener('load', fitToWrap, { once: true });
    } else {
      fitToWrap();
    }
    // Refit on resize (lightweight)
    let rafId = null;
    window.addEventListener('resize', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { fitToWrap(); rafId = null; });
    });

    function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

    // Drag to pan
    vp.addEventListener('mousedown', (e) => {
      start = { x: e.clientX - origin.x, y: e.clientY - origin.y };
      vp.classList.add('dragging');
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!start) return;
      origin.x = e.clientX - start.x;
      origin.y = e.clientY - start.y;
      apply();
    });
    window.addEventListener('mouseup', () => { start = null; vp.classList.remove('dragging'); });

    // Wheel zoom (centered around mouse)
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left; // mouse in viewport coords
      const my = e.clientY - rect.top;
      const delta = -e.deltaY; // up => zoom in
      const factor = delta > 0 ? 1.1 : 0.9;
      const newScale = clamp(scale * factor, minScale, maxScale);
      const ratio = newScale / scale;
      // Keep point under cursor fixed during zoom
      origin.x = mx - ratio * (mx - origin.x);
      origin.y = my - ratio * (my - origin.y);
      scale = newScale;
      apply();
    }, { passive: false });

    // Buttons
    const controls = document.querySelectorAll('.map-controls [data-zoom]');
    controls.forEach(btn => btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-zoom');
      if (action === 'reset') { fitToWrap(); return; }
      if (action === 'in') scale = clamp(scale * 1.1, minScale, maxScale);
      if (action === 'out') scale = clamp(scale / 1.1, minScale, maxScale);
      apply();
    }));
  }
})();

//<!-- MailerLite Universal -->
(function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
.push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
(window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
ml('account', '814796');
//<!-- End MailerLite Universal -->
