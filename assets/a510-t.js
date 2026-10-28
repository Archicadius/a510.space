/* A510 site analytics — cookieless, no storage, no fingerprinting.
   Sends: page, referrer, UTM, screen, language, timezone, load time,
   active time, scroll depth, clicks. IP/UA are used by the server only
   transiently (geo + daily-rotating hash) and are never stored.
   Owner opt-out on own device: open any page with #notrack (re-enable: #track). */
(function () {
  'use strict';
  var EP = 'https://a510-hub.vercel.app/api/site/hit';
  var d = document, w = window, L = location;
  if (L.hash === '#notrack' || /[?&]notrack(=|&|$)/.test(L.search)) {
    try { localStorage.setItem('a510_nt', '1'); } catch (e) {}
    return;
  }
  try {
    if (L.hash === '#track') localStorage.removeItem('a510_nt');
    if (localStorage.getItem('a510_nt') === '1') return;
  } catch (e) {}
  if (navigator.webdriver) return;

  var me = d.currentScript || d.querySelector('script[src*="a510-t.js"]');
  var ds = (me && me.dataset) || {};
  var id = '';
  for (var i = 0; i < 16; i++) id += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)];

  function send(o) {
    o.id = id;
    var s = JSON.stringify(o);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(EP, new Blob([s], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(EP, { method: 'POST', body: s, keepalive: true, mode: 'cors', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
  }

  /* query: only utm_* and r */
  var q = {};
  try {
    var sp = new URLSearchParams(L.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'r'].forEach(function (k) {
      var v = sp.get(k); if (v) q[k] = v.slice(0, 80);
    });
  } catch (e) {}

  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var lm = null;
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.domContentLoadedEventEnd > 0) lm = Math.round(nav.domContentLoadedEventEnd);
  } catch (e) {}

  send({
    t: 'pv', site: 'a510.space', p: L.pathname.slice(0, 200), ti: (d.title || '').slice(0, 120),
    tk: ds.t || undefined, q: q, ref: (d.referrer || '').slice(0, 300), tz: tz,
    l: (navigator.language || '').slice(0, 16), sw: screen.width, sh: screen.height,
    vw: w.innerWidth, dpr: Math.round((w.devicePixelRatio || 1) * 100) / 100,
    lm: lm, st: ds.st ? +ds.st : 200
  });

  /* active time: visible tab + interaction within the last 60 s */
  var active = 0, last = Date.now(), lastInput = Date.now(), maxS = 0;
  function tick() {
    var now = Date.now();
    if (d.visibilityState === 'visible' && now - lastInput < 60000) active += Math.min(now - last, 5000);
    last = now;
  }
  setInterval(tick, 1000);
  function input() { lastInput = Date.now(); }
  ['mousemove', 'keydown', 'touchstart', 'wheel', 'click'].forEach(function (e) { addEventListener(e, input, { passive: true }); });
  function scroll() {
    input();
    var h = d.documentElement, b = d.body;
    var full = Math.max(h.scrollHeight, b ? b.scrollHeight : 0) - w.innerHeight;
    var p = full > 0 ? Math.round((w.scrollY || h.scrollTop) / full * 100) : 100;
    if (p > maxS) maxS = Math.min(100, p);
  }
  addEventListener('scroll', scroll, { passive: true });
  addEventListener('load', scroll);

  var lastSent = -1;
  function flush() {
    tick();
    var key = active + ':' + maxS;
    if (key === lastSent) return;
    lastSent = key;
    send({ t: 'en', a: active, s: maxS });
  }
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') flush(); else { last = Date.now(); input(); } });
  addEventListener('pagehide', flush);

  /* clicks */
  function kind(a) {
    if (a.dataset && a.dataset.ev) return ['cta', a.dataset.ev];
    var h = a.getAttribute('href') || '';
    if (/^tel:/i.test(h)) return ['contact-phone'];
    if (/^mailto:/i.test(h)) return ['contact-mail'];
    if (/(^|\/\/)(t\.me|telegram\.me)\//i.test(h)) return ['contact-tg'];
    if (/(wa\.me|whatsapp\.com)/i.test(h)) return ['contact-whatsapp'];
    if (/\.pdf(\?|#|$)/i.test(h)) return ['pdf'];
    if (a.host && a.host !== L.host && /^https?:/i.test(a.href)) return ['outbound'];
    return null;
  }
  d.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== d && !(el.tagName === 'A' || (el.dataset && el.dataset.ev))) el = el.parentNode;
    if (!el || el === d) return;
    var k = kind(el);
    if (!k) return;
    var href = el.href ? String(el.href).split(/[?#]/)[0].slice(0, 200) : '';
    var label = (el.dataset && el.dataset.ev) || (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    send({ t: 'ev', k: 'click', n: k[0] === 'cta' ? ('cta-' + String(k[1]).toLowerCase().replace(/[^a-z0-9-]/g, '')).slice(0, 40) : k[0], h: href, lb: label });
  }, true);
})();
