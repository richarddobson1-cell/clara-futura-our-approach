// === Clara Futura — Our Approach Animations ===
// Uses GSAP for timeline animations + IntersectionObserver for scroll triggering
// IntersectionObserver is the primary trigger mechanism (works in all contexts including iframes)
// Timeout safety net ensures animations play even if observer fails

gsap.registerPlugin(ScrollTrigger);

// Always use IntersectionObserver as primary trigger — it works reliably in iframes,
// embedded contexts, and direct viewing alike. ScrollTrigger has known issues in iframes.
const USE_OBSERVER = true;

// Safety net: if animations haven't fired after this delay, force them
const SAFETY_TIMEOUT_MS = 4000;
const firedSections = new Set();

function markFired(id) { firedSections.add(id); }

// === IntersectionObserver trigger helper ===
function onVisible(element, callback, threshold = 0.1) {
  if (!element) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback();
        observer.unobserve(element);
      }
    });
  }, { threshold });
  observer.observe(element);
}

// === Scroll-triggered card reveals ===
function revealCards(selector, stagger = 0.12) {
  const cards = document.querySelectorAll(selector);
  if (!cards.length) return;

  const section = cards[0].closest('.section');
  const sectionId = 'cards-' + selector;

  function doReveal() {
    if (firedSections.has(sectionId)) return;
    markFired(sectionId);
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * (stagger * 1000));
    });
  }

  if (section) {
    onVisible(section, doReveal);
  }

  // Safety net
  setTimeout(() => {
    if (!firedSections.has(sectionId)) doReveal();
  }, SAFETY_TIMEOUT_MS + 1000);
}

// === LIT Diagram Animation ===
function animateLIT() {
  const section = document.getElementById('lit');
  if (!section) return;

  function playLIT() {
    if (firedSections.has('lit')) return;
    markFired('lit');

    const tl = gsap.timeline();
    tl.to('.lit-ring-1', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.lit-ring-2', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to('.lit-ring-3', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to('.lit-ring-4', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to('.lit-ring-5', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .to('.lit-label-5, .lit-sublabel-5', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to('.lit-tension-lines', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.2')
      .to('.lit-particle', { opacity: 0.7, duration: 0.5, stagger: 0.15 }, '-=0.4');

    gsap.to('.lit-ring-5', {
      strokeWidth: 3.5,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 2
    });
  }

  onVisible(section, playLIT);
  setTimeout(() => { if (!firedSections.has('lit')) playLIT(); }, SAFETY_TIMEOUT_MS);
}

// === LIR Diagram Animation ===
function animateLIR() {
  const section = document.getElementById('lir');
  if (!section) return;

  function playLIR() {
    if (firedSections.has('lir')) return;
    markFired('lir');

    const tl = gsap.timeline();
    tl.from('.lir-actual', { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from('.lir-potential', { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.lir-tension', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .from('.lir-centre-label', { opacity: 0, scale: 0.8, transformOrigin: 'center', duration: 0.5, ease: 'power2.out' }, '-=0.2');

    gsap.to('.lir-actual circle:first-child', { r: 85, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to('.lir-potential circle:first-child', { r: 85, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.5 });
  }

  onVisible(section, playLIR);
  setTimeout(() => { if (!firedSections.has('lir')) playLIR(); }, SAFETY_TIMEOUT_MS + 500);
}

// === Dynamic Alignment Animation ===
function animateDA() {
  const section = document.getElementById('alignment');
  if (!section) return;

  function playDA() {
    if (firedSections.has('alignment')) return;
    markFired('alignment');

    // Draw the spiral path in progressively
    const spiralPath = document.querySelector('.da-spiral-path');
    if (spiralPath) {
      const len = spiralPath.getTotalLength();
      spiralPath.style.strokeDasharray = len;
      spiralPath.style.strokeDashoffset = len;
    }

    const tl = gsap.timeline();
    tl.from('.da-svg circle:not(.da-pulse):not(.da-spiral-particle)', {
      scale: 0, transformOrigin: 'center', duration: 0.6, ease: 'back.out(1.7)'
    })
    .from('.da-centre-label', { opacity: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2')
    .to('.da-spiral-path', { strokeDashoffset: 0, opacity: 0.6, duration: 2, ease: 'power2.inOut' }, '-=0.3')
    .from('.da-spiral-particle', { opacity: 0, duration: 0.4 }, '-=0.6')
    .from('.da-quad-lit', { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=1.2')
    .from('.da-quad-lir', { x: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
    .from('.da-quad-eri', { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
    .from('.da-quad-vpm', { x: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5');
  }

  onVisible(section, playDA);
  setTimeout(() => { if (!firedSections.has('alignment')) playDA(); }, SAFETY_TIMEOUT_MS + 1000);
}

// === Section heading reveals ===
function revealSections() {
  document.querySelectorAll('.section').forEach((section, idx) => {
    const label = section.querySelector('.label');
    const h2 = section.querySelector('h2');
    const lead = section.querySelector('.prose .lead');
    const sectionId = 'section-' + idx;

    function playReveal() {
      if (firedSections.has(sectionId)) return;
      markFired(sectionId);

      const tl = gsap.timeline();
      if (label) tl.from(label, { y: 15, opacity: 0, duration: 0.5, ease: 'power3.out' });
      if (h2) tl.from(h2, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
      if (lead) tl.from(lead, { y: 15, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');
    }

    onVisible(section, playReveal);
    setTimeout(() => { if (!firedSections.has(sectionId)) playReveal(); }, SAFETY_TIMEOUT_MS + (idx * 200));
  });
}

// === Hero entrance ===
// Uses CSS class .hero-ready as the primary reveal mechanism.
// GSAP is optional enhancement — if it fails, CSS transitions handle the animation.
function animateHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Reveal hero text after a short delay using CSS class
  // This works regardless of whether GSAP loads
  setTimeout(() => {
    hero.classList.add('hero-ready');
  }, 400);
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  animateHero();
  revealSections();
  animateLIT();
  animateLIR();
  animateDA();

  // Staggered card reveals
  revealCards('.lit-label-card', 0.1);
  revealCards('.lir-card', 0.12);
  revealCards('.da-card', 0.12);
  revealCards('.practice-card', 0.1);
});
