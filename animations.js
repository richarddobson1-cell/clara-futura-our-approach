// === Clara Futura — Our Approach Animations ===
// Uses GSAP + ScrollTrigger for standalone scroll-driven builds.
// In cross-origin iframes (WordPress embeds), uses native JS setAttribute
// with CSS transitions for maximum Safari/iOS compatibility.

gsap.registerPlugin(ScrollTrigger);

const SAFETY_TIMEOUT_MS = 4000;
const firedSections = new Set();
function markFired(id) { firedSections.add(id); }

const isIframe = document.body.classList.contains('in-iframe');

// === CSS transition helper for iframe mode ===
// Safari/WebKit can fail with GSAP attr:{opacity} on SVG elements.
// Direct setAttribute + CSS transition is universally reliable.
function revealSVG(selector, delayMs) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(el => {
      el.setAttribute('opacity', '1');
    });
  }, delayMs);
}

// === IntersectionObserver trigger helper ===
// In iframe mode, fire callback after a delay (IO is unreliable in non-scrolling iframes)
function onVisible(element, callback, threshold = 0.15) {
  if (!element) return;
  if (isIframe) {
    setTimeout(callback, 600);
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

// ============================================================
// LIT DIAGRAM — builds from core outward
// ============================================================
function animateLIT() {
  const diagram = document.getElementById('litDiagram');
  if (!diagram) return;

  if (isIframe) {
    animateLIT_iframe(diagram);
    return;
  }

  // Standalone: GSAP ScrollTrigger scrub
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: diagram,
      start: 'top 80%',
      end: 'bottom 30%',
      scrub: 0.8,
    },
    defaults: { ease: 'none' }
  });

  buildLITTimeline(tl);
  startLITContinuousAnimations();
}

// Iframe mode: use direct setAttribute for Safari compatibility
function animateLIT_iframe(diagram) {
  // Stage the reveal from core outward with staggered delays
  const baseDelay = 800; // wait for page to settle
  const step = 400;      // ms between each ring stage

  // 1. Core — Ethics
  revealSVG('.lit-core', baseDelay);
  revealSVG('.lit-core-label', baseDelay + 100);
  revealSVG('.lit-core-sub', baseDelay + 150);
  revealSVG('.lit-core-pulse', baseDelay + 200);

  // 2. Ring 1: Cognitive
  revealSVG('.lit-band-1', baseDelay + step);
  revealSVG('.lit-ring-1', baseDelay + step + 50);
  revealSVG('.lit-clabel-1', baseDelay + step + 100);
  revealSVG('.lit-particles-1', baseDelay + step + 150);

  // 3. Ring 2: Emotional
  revealSVG('.lit-band-2, .lit-band-fill-2', baseDelay + step * 2);
  revealSVG('.lit-ring-2', baseDelay + step * 2 + 50);
  revealSVG('.lit-clabel-2', baseDelay + step * 2 + 100);
  revealSVG('.lit-particles-2', baseDelay + step * 2 + 150);

  // 4. Ring 3: Symbolic
  revealSVG('.lit-band-3, .lit-band-fill-3', baseDelay + step * 3);
  revealSVG('.lit-ring-3', baseDelay + step * 3 + 50);
  revealSVG('.lit-clabel-3', baseDelay + step * 3 + 100);
  revealSVG('.lit-particles-3', baseDelay + step * 3 + 150);

  // 5. Ring 4: Strategic
  revealSVG('.lit-band-4, .lit-band-fill-4', baseDelay + step * 4);
  revealSVG('.lit-ring-4', baseDelay + step * 4 + 50);
  revealSVG('.lit-clabel-4', baseDelay + step * 4 + 100);
  revealSVG('.lit-particles-4', baseDelay + step * 4 + 150);

  // 6. Ring 5: Ethical (outermost)
  revealSVG('.lit-band-5', baseDelay + step * 5);
  revealSVG('.lit-ring-5', baseDelay + step * 5 + 50);
  revealSVG('.lit-clabel-5', baseDelay + step * 5 + 100);
  revealSVG('.lit-particles-5', baseDelay + step * 5 + 150);
  revealSVG('.lit-glow-ring', baseDelay + step * 5 + 200);

  // Start continuous animations after full build
  setTimeout(() => startLITContinuousAnimations(), baseDelay + step * 6);
}

// GSAP scrub timeline (standalone only)
function buildLITTimeline(tl) {
  tl.to('.lit-core', { attr: { opacity: 1 }, duration: 0.08 })
    .to('.lit-core-label', { attr: { opacity: 1 }, duration: 0.05 }, '-=0.02')
    .to('.lit-core-sub', { attr: { opacity: 1 }, duration: 0.04 }, '-=0.01')
    .to('.lit-core-pulse', { attr: { opacity: 0.4 }, duration: 0.03 })
    .to('.lit-band-1', { attr: { opacity: 1 }, duration: 0.06 })
    .to('.lit-ring-1', { attr: { opacity: 1 }, duration: 0.06 }, '-=0.03')
    .to('.lit-clabel-1', { attr: { opacity: 1 }, duration: 0.05 }, '-=0.02')
    .to('.lit-particles-1', { attr: { opacity: 1 }, duration: 0.04 }, '-=0.01')
    .to('.lit-band-2, .lit-band-fill-2', { attr: { opacity: 1 }, duration: 0.06 })
    .to('.lit-ring-2', { attr: { opacity: 1 }, duration: 0.06 }, '-=0.03')
    .to('.lit-clabel-2', { attr: { opacity: 1 }, duration: 0.05 }, '-=0.02')
    .to('.lit-particles-2', { attr: { opacity: 1 }, duration: 0.04 }, '-=0.01')
    .to('.lit-band-3, .lit-band-fill-3', { attr: { opacity: 1 }, duration: 0.06 })
    .to('.lit-ring-3', { attr: { opacity: 1 }, duration: 0.06 }, '-=0.03')
    .to('.lit-clabel-3', { attr: { opacity: 1 }, duration: 0.05 }, '-=0.02')
    .to('.lit-particles-3', { attr: { opacity: 1 }, duration: 0.04 }, '-=0.01')
    .to('.lit-band-4, .lit-band-fill-4', { attr: { opacity: 1 }, duration: 0.06 })
    .to('.lit-ring-4', { attr: { opacity: 1 }, duration: 0.06 }, '-=0.03')
    .to('.lit-clabel-4', { attr: { opacity: 1 }, duration: 0.05 }, '-=0.02')
    .to('.lit-particles-4', { attr: { opacity: 1 }, duration: 0.04 }, '-=0.01')
    .to('.lit-band-5', { attr: { opacity: 1 }, duration: 0.06 })
    .to('.lit-ring-5', { attr: { opacity: 1 }, duration: 0.08 }, '-=0.04')
    .to('.lit-clabel-5', { attr: { opacity: 1 }, duration: 0.06 }, '-=0.03')
    .to('.lit-particles-5', { attr: { opacity: 1 }, duration: 0.05 }, '-=0.02')
    .to('.lit-glow-ring', { attr: { opacity: 1 }, duration: 0.06 }, '-=0.03');
}

// Continuous looping animations (GSAP is fine for ongoing loops)
function startLITContinuousAnimations() {
  gsap.fromTo('.lit-core-pulse',
    { attr: { r: 40, opacity: 0.4 } },
    { attr: { r: 48, opacity: 0 }, duration: 2, ease: 'sine.inOut', repeat: -1, delay: 0.5 }
  );
  gsap.to('.lit-ring-5', {
    attr: { 'stroke-width': 3.5 },
    duration: 2.5,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1
  });
}

// ============================================================
// LIR DIAGRAM — Actualised → Potential → Dynamic Opposition
// ============================================================
function animateLIR() {
  const diagram = document.getElementById('lirDiagram');
  if (!diagram) return;

  function playLIR() {
    if (firedSections.has('lir')) return;
    markFired('lir');

    if (isIframe) {
      // Safari-safe: use direct setAttribute with CSS transitions
      const base = 0;
      revealSVG('.lir-actual', base);
      revealSVG('.lir-potential', base + 600);
      revealSVG('.lir-tension', base + 1200);
      revealSVG('.lir-centre-group', base + 1500);
      setTimeout(() => startLIRContinuousAnimations(), base + 2200);
    } else {
      // Standalone: GSAP timeline
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: startLIRContinuousAnimations
      });
      tl.to('.lir-actual', { attr: { opacity: 1 }, duration: 0.8, ease: 'power3.out' })
        .to('.lir-potential', { attr: { opacity: 1 }, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .to('.lir-tension', { attr: { opacity: 1 }, duration: 0.7 }, '-=0.2')
        .to('.lir-centre-group', { attr: { opacity: 1 }, duration: 0.6 }, '-=0.3');
    }
  }

  onVisible(diagram, playLIR);
  setTimeout(() => { if (!firedSections.has('lir')) playLIR(); }, SAFETY_TIMEOUT_MS + 500);
}

// Continuous looping animations for LIR
function startLIRContinuousAnimations() {
  // Actualised pole: expanding ripple
  gsap.fromTo('.lir-pulse-actual',
    { attr: { r: 80, opacity: 0.6 } },
    { attr: { r: 100, opacity: 0 }, duration: 2.5, ease: 'sine.out', repeat: -1, delay: 0.3 }
  );
  gsap.to('.lir-actual circle:first-child', {
    attr: { r: 86 },
    duration: 2.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });

  // Potential pole: offset expanding ripple
  gsap.fromTo('.lir-pulse-potential',
    { attr: { r: 80, opacity: 0.5 } },
    { attr: { r: 100, opacity: 0 }, duration: 2.5, ease: 'sine.out', repeat: -1, delay: 1.2 }
  );
  gsap.to('.lir-potential circle:first-child', {
    attr: { r: 86 },
    duration: 2.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1.4
  });

  // Dynamic Opposition arcs: stroke-width pulse
  gsap.to('.lir-flow-top', {
    attr: { 'stroke-width': 3.5 },
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
  gsap.to('.lir-flow-bottom', {
    attr: { 'stroke-width': 3.5 },
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 0.9
  });

  // Centre label gentle opacity pulse
  gsap.fromTo('.lir-centre-group',
    { attr: { opacity: 1 } },
    { attr: { opacity: 0.5 }, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.5 }
  );
}

// ============================================================
// DYNAMIC ALIGNMENT DIAGRAM
// ============================================================
function animateDA() {
  const section = document.getElementById('alignment');
  if (!section) return;

  function playDA() {
    if (firedSections.has('alignment')) return;
    markFired('alignment');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.da-svg .da-centre-label, .da-svg circle[cx=\"350\"][cy=\"250\"][r=\"45\"]', {
        scale: 0, opacity: 0, transformOrigin: 'center', duration: 0.6, ease: 'back.out(1.7)'
      })
      .to('.da-main-circle', { opacity: 0.55, duration: 0.8 }, '-=0.2')
      .from('.da-svg circle[r=\"200\"]', { opacity: 0, duration: 0.5 }, '-=0.4')
      .from('.da-svg circle[r=\"6\"], .da-svg circle[r=\"4.5\"], .da-svg circle[r=\"5\"], .da-svg circle[r=\"3.5\"][fill=\"#DDE2E7\"], .da-svg circle[r=\"4\"][fill=\"#F2B54D\"], .da-svg circle[r=\"3\"][fill=\"#C8D0D8\"]', {
        opacity: 0, duration: 0.4, stagger: 0.08
      }, '-=0.3')
      .from('.da-svg line', { opacity: 0, duration: 0.5, stagger: 0.05 }, '-=0.3')
      .from('.da-quad-lit', { y: -30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.da-quad-lir', { x: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.da-quad-vpm', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.da-quad-eri', { x: -30, opacity: 0, duration: 0.6 }, '-=0.4');
  }

  onVisible(section, playDA);
  setTimeout(() => { if (!firedSections.has('alignment')) playDA(); }, SAFETY_TIMEOUT_MS + 1000);
}

// ============================================================
// SECTION HEADING REVEALS
// ============================================================
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

// ============================================================
// HERO ENTRANCE
// ============================================================
function animateHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  setTimeout(() => { hero.classList.add('hero-ready'); }, 400);
}

// ============================================================
// INIT
// ============================================================
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
