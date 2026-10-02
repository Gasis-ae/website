/* Gas Integrated Solutions — site behaviour (no dependencies) */
(function () {
  'use strict';

  var CONFIG = window.GASIS_CONFIG || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------- Mobile navigation ---------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var menu = $('#primary-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Parent items with sub-menus: tap/click toggles the sub-menu on touch layouts,
    // keyboard users get focus-within behaviour from CSS.
    $$('.menu > li.has-children > .menu-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var isMobileLayout = window.matchMedia('(max-width: 1024px)').matches;
        var li = link.parentNode;
        if (isMobileLayout && !li.classList.contains('is-open')) {
          e.preventDefault();
          $$('.menu > li.is-open').forEach(function (o) { if (o !== li) o.classList.remove('is-open'); });
          li.classList.add('is-open');
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- Hero slideshow (fade + Ken Burns zoom-out) ---------------- */
  function initSlideshow() {
    var wrap = $('[data-slideshow]');
    if (!wrap) return;
    var slides = $$('.slide', wrap);
    if (!slides.length) return;
    var i = 0;
    slides[0].classList.add('is-active');
    if (slides.length < 2) return;
    var duration = parseInt(wrap.getAttribute('data-duration'), 10) || 5000;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      // re-adding the class restarts the CSS zoom animation
      void slides[i].offsetWidth;
      slides[i].classList.add('is-active');
    }, duration);
  }

  /* ---------------- Scroll-triggered entrance animations ---------------- */
  function initAnimations() {
    var items = $$('[data-animate]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('animated'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay'), 10) || 0;
        setTimeout(function () { el.classList.add('animated'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Animated counters (About page) ---------------- */
  function formatNumber(value, decimals) {
    var fixed = value.toFixed(decimals);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  function initCounters() {
    var counters = $$('[data-counter]');
    if (!counters.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-counter')) || 0;
      var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
      var duration = parseInt(el.getAttribute('data-duration'), 10) || 2000;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = prefix + formatNumber(target, decimals) + suffix; return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + formatNumber(target * eased, decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.3 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Tabs (Mission / Vision / Values) ---------------- */
  function initTabs() {
    $$('.tabs').forEach(function (root) {
      var tabs = $$('[role="tab"]', root);
      var panels = $$('[role="tabpanel"]', root);
      function activate(index, focus) {
        tabs.forEach(function (t, i) {
          var on = i === index;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          panels[i].hidden = !on;
          panels[i].classList.toggle('is-animated', on);
        });
        if (focus) tabs[index].focus();
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { activate(i, false); });
        tab.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
          if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
          if (e.key === 'Home') n = 0;
          if (e.key === 'End') n = tabs.length - 1;
          if (n !== null) { e.preventDefault(); activate(n, true); }
        });
      });
      activate(0, false);
    });
  }

  /* ---------------- Timeline carousel (Services page) ---------------- */
  function initTimeline() {
    $$('.timeline').forEach(function (root) {
      var track = $('.timeline-track', root);
      var items = $$('.timeline-item', root);
      var prev = $('.timeline-prev', root);
      var next = $('.timeline-next', root);
      if (!track || !items.length) return;
      var index = 0;
      function perView() {
        var w = window.innerWidth;
        return w <= 767 ? 1 : (w <= 1024 ? 2 : 3);
      }
      function update() {
        var max = Math.max(items.length - perView(), 0);
        if (index > max) index = max;
        var itemWidth = items[0].getBoundingClientRect().width;
        track.style.transform = 'translateX(' + (-index * itemWidth) + 'px)';
        if (prev) prev.disabled = index <= 0;
        if (next) next.disabled = index >= max;
      }
      if (prev) prev.addEventListener('click', function () { index = Math.max(index - 1, 0); update(); });
      if (next) next.addEventListener('click', function () { index += 1; update(); });
      // Basic swipe support
      var startX = null;
      track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) { index += dx < 0 ? 1 : -1; if (index < 0) index = 0; update(); }
        startX = null;
      });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* ---------------- Rotating words ("Order! Refill! Relax!") ---------------- */
  function initAnimatedWords() {
    $$('.anim-words').forEach(function (root) {
      var words = $$('b', root);
      if (!words.length) return;
      var i = 0;
      words[0].classList.add('is-in');
      if (words.length < 2 || reduceMotion) { words[0].style.opacity = 1; return; }
      var hold = parseInt(root.getAttribute('data-hold'), 10) || 2000;
      setInterval(function () {
        var cur = words[i];
        cur.classList.remove('is-in');
        cur.classList.add('is-out');
        i = (i + 1) % words.length;
        var nxt = words[i];
        nxt.classList.remove('is-out');
        void nxt.offsetWidth;
        nxt.classList.add('is-in');
      }, hold);
    });
  }

  /* ---------------- Back to top ---------------- */
  function initBackToTop() {
    var btn = $('.back-to-top');
    if (!btn) return;
    function check() { btn.classList.toggle('is-visible', window.scrollY > 800); }
    window.addEventListener('scroll', check, { passive: true });
    check();
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- Forms (contact + newsletter) ----------------
     If an endpoint is configured in assets/js/config.js the form is POSTed there
     (Formspree / Basin / Netlify Forms / your own script). Otherwise it falls back
     to opening the visitor's email client with the message pre-filled.
  ------------------------------------------------------------------ */
  function setMessage(form, text, isError) {
    var box = $('.form-message', form);
    if (!box) return;
    box.textContent = text;
    box.classList.toggle('is-error', !!isError);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function initForms() {
    $$('form[data-form]').forEach(function (form) {
      var kind = form.getAttribute('data-form');
      var endpoint = kind === 'contact' ? CONFIG.contactEndpoint : CONFIG.newsletterEndpoint;
      var button = $('button[type="submit"]', form);
      var idleLabel = button ? button.textContent : '';

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        setMessage(form, '');
        var data = {};
        $$('input[name], textarea[name]', form).forEach(function (f) { data[f.name] = f.value.trim(); });

        if (!data.email || !validEmail(data.email)) {
          setMessage(form, 'Please enter a valid email address.', true);
          var emailField = $('[name="email"]', form); if (emailField) emailField.focus();
          return;
        }

        if (!endpoint) {
          // Fallback: pre-filled email
          var to = kind === 'contact' ? (CONFIG.contactEmail || 'business@gasis.ae') : (CONFIG.newsletterEmail || 'help@gasis.ae');
          var subject = kind === 'contact' ? 'Website enquiry from ' + (data.name || data.email) : 'Newsletter subscription';
          var body = kind === 'contact'
            ? 'Name: ' + (data.name || '') + '\nEmail: ' + data.email + '\n\n' + (data.message || '')
            : 'Please subscribe ' + data.email + ' to the GASIS newsletter.';
          window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          setMessage(form, kind === 'contact' ? 'Opening your email app to send the message…' : 'Opening your email app to complete the subscription…');
          return;
        }

        if (button) { button.textContent = button.getAttribute('data-loading') || 'Sending…'; button.classList.add('is-loading'); }
        var payload = new FormData();
        Object.keys(data).forEach(function (k) { payload.append(k, data[k]); });
        payload.append('_subject', kind === 'contact' ? 'Website enquiry — gasis.ae' : 'Newsletter subscription — gasis.ae');

        fetch(endpoint, { method: 'POST', body: payload, headers: { 'Accept': 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            setMessage(form, kind === 'contact' ? 'Thank you! Your message has been sent.' : 'You have been successfully subscribed!');
          })
          .catch(function () {
            setMessage(form, 'Oops! Something went wrong, please try again.', true);
          })
          .then(function () {
            if (button) { button.textContent = idleLabel; button.classList.remove('is-loading'); }
          });
      });
    });
  }

  /* ---------------- Footer year ---------------- */
  function initYear() {
    var y = $('[data-year]');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function init() {
    initNav();
    initSlideshow();
    initAnimations();
    initCounters();
    initTabs();
    initTimeline();
    initAnimatedWords();
    initBackToTop();
    initForms();
    initYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
