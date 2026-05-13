/* =============================================================
   LAUSEBENGEL Interactions
   - Scroll reveal (IntersectionObserver)
   - Mobile nav toggle
   - Sticky nav border on scroll
   - Page transition fade on internal links
   ============================================================= */

(() => {
  'use strict';

  /* ---------- 1. Scroll Reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
      // Stagger items within the same parent container
      const parent = el.parentElement;
      const siblings = parent ? Array.from(parent.querySelectorAll(':scope > .reveal')) : [];
      const idx = siblings.indexOf(el);
      if (idx > -1) {
        el.style.setProperty('--reveal-delay', `${idx * 90}ms`);
      }
      io.observe(el);
    });
  } else {
    // Fallback: show everything
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- 2. Sticky nav border on scroll ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 3. Mobile menu ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const list   = document.querySelector('.nav__list');
  if (toggle && list) {
    toggle.addEventListener('click', () => {
      const open = list.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close menu when a link is clicked
    list.addEventListener('click', (e) => {
      if (e.target.matches('a')) {
        list.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- 4. Page transition fade ---------- */
  // Internal links → fade body out, then navigate.
  // Skip: hash links, mailto, target=_blank, modifier keys.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      a.target === '_blank' ||
      a.hasAttribute('download') ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    ) return;

    // Only same-origin links
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    // Same page? let the browser scroll handle it
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { window.location.href = a.href; }, 240);
  });

  // Restore opacity when navigating back
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('is-leaving');
  });

  /* ---------- 5. Mark current nav link ---------- */
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/').toLowerCase();
  document.querySelectorAll('.nav__link').forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname
      .replace(/\/index\.html$/, '/').toLowerCase();
    if (linkPath === currentPath) link.setAttribute('aria-current', 'page');
  });
})();
