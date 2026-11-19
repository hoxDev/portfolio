/* Hox — Portfolio interactions */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }
  themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  themeBtn.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('nav-burger');
  var menu = document.getElementById('nav-menu');

  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Active section highlight ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = links
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) {
          var active = l.getAttribute('href') === '#' + entry.target.id;
          l.classList.toggle('is-active', active);
          if (active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  // stagger siblings inside the same parent
  reveals.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains('reveal');
    });
    var i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--delay', Math.min(i * 0.08, 0.4) + 's');
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Carousel ---------- */
  var carousel = document.getElementById('cafe-carousel');
  var track = carousel.querySelector('.carousel__track');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.carousel__slide'));
  var dotsWrap = carousel.querySelector('.carousel__dots');
  var counter = carousel.querySelector('.carousel__counter');
  var current = 0;

  var dots = slides.map(function (slide, i) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Show screen ' + (i + 1));
    dot.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function render(i) {
    current = i;
    counter.textContent = (i + 1) + ' / ' + slides.length;
    dots.forEach(function (d, j) {
      d.setAttribute('aria-selected', String(j === i));
      d.tabIndex = j === i ? 0 : -1;
    });
  }

  function goTo(i) {
    i = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[i].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    render(i);
  }

  carousel.querySelector('.carousel__nav--prev').addEventListener('click', function () { goTo(current - 1); });
  carousel.querySelector('.carousel__nav--next').addEventListener('click', function () { goTo(current + 1); });

  // keep state in sync with native swipe / scroll
  var scrollTimer;
  track.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== current && slides[i]) render(i);
    }, 60);
  }, { passive: true });

  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
  });

  // re-align after resize so we never sit between slides
  window.addEventListener('resize', function () {
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = slides[current].offsetLeft;
    track.style.scrollBehavior = '';
  });

  render(0);

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbImg = lightbox.querySelector('.lightbox__img');
  var lbCaption = lightbox.querySelector('.lightbox__caption');
  var fullSizes = ['home', 'products', 'product', 'cart', 'pay'];
  var lbIndex = 0;

  function showLightbox(i) {
    lbIndex = (i + slides.length) % slides.length;
    var img = slides[lbIndex].querySelector('img');
    var name = fullSizes[lbIndex];
    lbImg.src = 'cafeUi/web/' + name + '-1600.webp';
    lbImg.srcset = 'cafeUi/web/' + name + '-1600.webp 1600w, cafeUi/' + name + '.jpg 2560w';
    lbImg.sizes = '100vw';
    lbImg.alt = img.alt;
    lbCaption.textContent = img.alt + ' — ' + (lbIndex + 1) + ' / ' + slides.length;
  }

  function openLightbox(i) {
    showLightbox(i);
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
  }

  lightbox.addEventListener('close', function () {
    document.body.style.overflow = '';
    goTo(lbIndex);
  });

  slides.forEach(function (slide, i) {
    slide.addEventListener('click', function () { openLightbox(i); });
  });
  document.querySelectorAll('[data-open-gallery]').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(current); });
  });

  lightbox.querySelector('[data-close]').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () { showLightbox(lbIndex - 1); });
  lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () { showLightbox(lbIndex + 1); });

  // click on the dark backdrop (not the image / controls) closes
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox__inner')) closeLightbox();
  });

  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') showLightbox(lbIndex + 1);
    if (e.key === 'ArrowLeft') showLightbox(lbIndex - 1);
  });

  // swipe in lightbox
  var touchX = null;
  lightbox.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showLightbox(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Lazy YouTube embed ---------- */
  document.querySelectorAll('.video[data-yt]').forEach(function (wrap) {
    var btn = wrap.querySelector('.video__poster');
    var poster = btn.querySelector('img');
    function markBroken() { poster.classList.add('is-broken'); }
    if (poster.complete && poster.naturalWidth === 0) markBroken();
    else poster.addEventListener('error', markBroken);
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + wrap.getAttribute('data-yt') + '?autoplay=1&rel=0';
      iframe.title = 'CS50 Questions Web Application demo';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      wrap.replaceChildren(iframe);
      iframe.focus();
    });
  });

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
