// === Clara Futura — Our Approach Animations ===
// Uses GSAP + IntersectionObserver for scroll-triggered diagram builds

gsap.registerPlugin(ScrollTrigger);

const SAFETY_TIMEOUT_MS = 4000;
const firedSections = new Set();
function markFired(id) { firedSections.add(id); }

const isIframe = document.body.classList.contains('in-iframe');

// === IntersectionObserver trigger helper ===
// In iframe mode, fire callback immediately (IO is unreliable in tall iframes)
function onVisible(element, callback, threshold = 0.15) {
  if (!element) return;
  if (isIframe) {
    // Delay slightly so DOM is ready, then fire
    setTimeout(callback, 200);
    return;
  }
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

  if (section) onVisible(section, doReveal);
  setTimeout(() => { if (!firedSections.has(sectionId)) doReveal(); }, SAFETY_TIMEOUT_MS + 1000);
}

// === LIT Diagram Animation — builds from core outward ===
function animateLIT() {
  const section = document.getElementById('lit');
  if (!section) return;

  function playLIT() {
    if (firedSections.has('lit')) return;
    markFired('lit');

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // 1. Core appears first — Ethics
    tl.to('.lit-core', { opacity: 1, scale: 1, duration: 0.6 })
      .to('.lit-core-label', { opacity: 1, duration: 0.4 }, '-=0.3')
      .to('.lit-core-sub', { opacity: 1, duration: 0.3 }, '-=0.2')
      .to('.lit-core-pulse', { opacity: 0.4, duration: 0.3 }, '-=0.1')

    // 2. Ring 1: Cognitive — draws outward
      .to('.lit-band-1', { opacity: 1, duration: 0.4 }, '-=0.1')
      .to('.lit-ring-1', { opacity: 1, duration: 0.5 }, '-=0.3')
      .to('.lit-clabel-1', { opacity: 1, duration: 0.35 }, '-=0.2')
      .to('.lit-particles-1', { opacity: 1, duration: 0.3 }, '-=0.15')

    // 3. Ring 2: Emotional
      .to('.lit-band-2, .lit-band-fill-2', { opacity: 1, duration: 0.4 }, '-=0.1')
      .to('.lit-ring-2', { opacity: 1, duration: 0.5 }, '-=0.3')
      .to('.lit-clabel-2', { opacity: 1, duration: 0.35 }, '-=0.2')
      .to('.lit-particles-2', { opacity: 1, duration: 0.3 }, '-=0.15')

    // 4. Ring 3: Symbolic
      .to('.lit-band-3, .lit-band-fill-3', { opacity: 1, duration: 0.4 }, '-=0.1')
      .to('.lit-ring-3', { opacity: 1, duration: 0.5 }, '-=0.3')
      .to('.lit-clabel-3', { opacity: 1, duration: 0.35 }, '-=0.2')
      .to('.lit-particles-3', { opacity: 1, duration: 0.3 }, '-=0.15')

    // 5. Ring 4: Strategic
      .to('.lit-band-4, .lit-band-fill-4', { opacity: 1, duration: 0.4 }, '-=0.1')
      .to('.lit-ring-4', { opacity: 1, duration: 0.5 }, '-=0.3')
      .to('.lit-clabel-4', { opacity: 1, duration: 0.35 }, '-=0.2')
      .to('.lit-particles-4', { opacity: 1, duration: 0.3 }, '-=0.15')

    // 6. Ring 5: Ethical — outermost, the governing constraint
      .to('.lit-band-5', { opacity: 1, duration: 0.4 }, '-=0.1')
      .to('.lit-ring-5', { opacity: 1, duration: 0.6 }, '-=0.3')
      .to('.lit-clabel-5', { opacity: 1, duration: 0.4 }, '-=0.3')
      .to('.lit-particles-5', { opacity: 1, duration: 0.4 }, '-=0.2')
      .to('.lit-glow-ring', { opacity: 1, duration: 0.5 }, '-=0.3');

    // Continuous: pulse the core glow
    gsap.to('.lit-core-pulse', {
      attr: { r: 38 },
      opacity: 0,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      delay: 2
    });

    // Continuous: breathe the ethical ring
    gsap.to('.lit-ring-5', {
      strokeWidth: 3.5,
      duration: 2.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 2.5
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

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Centre builds first
    tl.from('.da-svg .da-centre-label, .da-svg circle[cx=\"350\"][cy=\"250\"][r=\"45\"]', {
        scale: 0, opacity: 0, transformOrigin: 'center', duration: 0.6, ease: 'back.out(1.7)'
      })
      // Main circle draws
      .to('.da-main-circle', { opacity: 0.55, duration: 0.8 }, '-=0.2')
      // Glow ring
      .from('.da-svg circle[r=\"200\"]', { opacity: 0, duration: 0.5 }, '-=0.4')
      // Particles appear
      .from('.da-svg circle[r=\"6\"], .da-svg circle[r=\"4.5\"], .da-svg circle[r=\"5\"], .da-svg circle[r=\"3.5\"][fill=\"#DDE2E7\"], .da-svg circle[r=\"4\"][fill=\"#F2B54D\"], .da-svg circle[r=\"3\"][fill=\"#C8D0D8\"]', {
        opacity: 0, duration: 0.4, stagger: 0.08
      }, '-=0.3')
      // Cross-connection lines
      .from('.da-svg line', { opacity: 0, duration: 0.5, stagger: 0.05 }, '-=0.3')
      // Nodes fly in from their directions
      .from('.da-quad-lit', { y: -30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.da-quad-lir', { x: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.da-quad-vpm', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.da-quad-eri', { x: -30, opacity: 0, duration: 0.6 }, '-=0.4');
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
function animateHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  setTimeout(() => { hero.classList.add('hero-ready'); }, 400);
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  animateHero();
  revealSections();
  animateLIT();
  animateLIR();
  animateDA();

  revealCards('.lit-label-card', 0.1);
  revealCards('.lir-card', 0.12);
  revealCards('.da-card', 0.12);
  revealCards('.practice-card', 0.1);
});
