/* MoveWell — GSAP animations (progressive enhancement).
   If GSAP/ScrollTrigger is missing, or the user prefers reduced motion,
   this file does nothing and the existing CSS reveal + counters keep working. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined' && gsap.registerPlugin) gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('gsap-on');

  // Hero entrance timeline (homepage) / page-hero entrance (inner pages).
  if (document.querySelector('.hero')) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero .badge', { y: 20, opacity: 0, duration: 0.6 })
      .from('.hero h1', { y: 30, opacity: 0, duration: 0.7 }, '-=0.35')
      .from('.hero .lead', { y: 24, opacity: 0, duration: 0.6 }, '-=0.45')
      .from('.hero-actions', { y: 20, opacity: 0, duration: 0.5 }, '-=0.4')
      .from('.hero-visual', { y: 30, opacity: 0, scale: 0.98, duration: 0.8 }, '-=0.4');
  } else if (document.querySelector('.page-hero')) {
    gsap.from('.page-hero h1', { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out' });
    gsap.from('.page-hero p', { y: 18, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 });
  }

  if (typeof ScrollTrigger !== 'undefined') {
    // Scroll-triggered reveals (same .reveal elements the CSS fallback handles).
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    // Non-reveal blocks: section heads, two-column blocks, FAQ, slider, info cards.
    gsap.utils.toArray('.sec-head, .two, .faq-item, .slider, .info, .steps .step').forEach(function (el) {
      gsap.fromTo(el, { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
    // Gentle parallax on the hero panel (scroll only; mouse parallax in script.js is untouched).
    if (document.querySelector('.hero-visual')) {
      gsap.to('.hero-visual', {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  // Micro-interaction: image zoom on card / gallery hover (transforms nothing else uses).
  document.querySelectorAll('.card-img img, .gallery-grid img').forEach(function (img) {
    img.addEventListener('mouseenter', function () { gsap.to(img, { scale: 1.06, duration: 0.45, ease: 'power2.out' }); });
    img.addEventListener('mouseleave', function () { gsap.to(img, { scale: 1, duration: 0.45, ease: 'power2.out' }); });
  });
})();
