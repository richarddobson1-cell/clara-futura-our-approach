// === Clara Futura — Our Approach Animations ===
// Uses GSAP + ScrollTrigger for standalone scroll-driven builds.
// In cross-origin iframes (WordPress embeds), uses native JS setAttribute
// with CSS transitions for maximum Safari/iOS compatibility.

gsap.registerPlugin(ScrollTrigger);

const SAFETY_TIMEOUT_MS = 4000;
const firedSections = new Set();
function markFired(id) { firedSections.add(id); }

const isIframe = document.body.classList.contains('in-iframe');

// === style.opacity reveal for iframe mode ===
// Removes SVG opacity attribute (which overrides CSS), then uses
// el.style.opacity (CSS property) which CSS transition animates.
// This works in ALL browsers including Safari/iOS, unlike:
//   - GSAP attr:{opacity} (fails in Safari WebKit in cross-origin iframes)
//   - setAttribute('opacity','1') (SVG attribute, CSS transition ignores it)
//   - classList.add('revealed') (no matching CSS rule, doesn't work)
function revealSVG(selector, delayMs) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(el => {
      // 1. Remove SVG presentation attribute so it no longer overrides CSS
      el.removeAttribute('opacity');
      // 2. Set CSS opacity to 0 immediately
      el.style.opacity = '0';
      // 3. Force layout reflow so browser registers the 0 state
      el.getBoundingClientRect();
      // 4. Set CSS opacity to 1 — CSS transition kicks in
      el.style.opacity = '1';
    });
  }, delayMs);
}

// === IntersectionObserver trigger helper ===
// In WordPress iframes (scrolling="no", large fixed height), the iframe
// content doesn't scroll — the parent page does. So we use a hybrid:
//   1. Try IntersectionObserver (works in same-origin, some cross-origin)
//   2. Listen for parent postMessage scroll events
//   3. Safety fallback timeout as last resort
function onVisible(element, callback, threshold = 0.15) {
  if (!element) return;

  // Track whether callback has fired
  let hasFired = false;
  function fire() {
    if (hasFired) return;
    hasFired = true;
    callback();
  }

  if (isIframe) {
    // In iframe mode, IO may still work if the iframe has overflow:auto.
    // But in scrolling="no" iframes, the content is fully visible to IO
    // from the start (everything intersects). So we rely on parent scroll.
    //
    // Listen for parent postMessage with scroll position
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top;

    window.addEventListener('message', function onMsg(e) {
      if (hasFired) { window.removeEventListener('message', onMsg); return; }
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.type === 'cf-scroll' && typeof data.scrollTop === 'number') {
          // Parent tells us how far the iframe has scrolled into view
          // The iframe top edge in the parent viewport = data.iframeTop
          // Element position within iframe = elementTop
          // Element is visible when: data.scrollTop + viewportHeight > elementTop
          const viewportH = data.viewportHeight || 900;
          if (data.scrollTop + viewportH * 0.8 > elementTop) {
            fire();
            window.removeEventListener('message', onMsg);
          }
        }
      } catch(err) {}
    });

    // Also try IO as a backup (works in some iframe configs)
    try {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { fire(); obs.unobserve(element); }
        });
      }, { threshold });
      obs.observe(element);
    } catch(e) {}

    // Estimated scroll timing fallback: assume typical reading speed.
    // User scrolls at ~150-300px/sec through a long-form page.
    // Element at Y offset = elementTop within the iframe.
    // Estimate arrival time = elementTop / 180 (px/sec) * 1000 (ms).
    // Add 1500ms buffer for reading. Cap at 45s for very long pages.
    const estimatedMs = Math.min(elementTop / 180 * 1000 + 1500, 45000);
    setTimeout(() => fire(), estimatedMs);

    return;
  }

  // Standalone mode: standard IntersectionObserver
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
    // Use onVisible to trigger when the user scrolls to the diagram.
    // onVisible has three layers: postMessage from parent, IO, and
    // estimated-scroll-timing fallback — no extra safety timeout needed.
    onVisible(diagram, () => animateLIT_iframe(diagram));
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

// === Emanating wave helper ===
// Fires a single wave from core (r=40) outward to targetR, fading out.
// Uses GSAP attr:{r} (geometric — works in Safari) + style opacity.
function fireLITWave(selector, targetR, duration, delayMs) {
  setTimeout(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.removeAttribute('opacity');
    el.style.opacity = '0';
    el.setAttribute('r', '40');
    // Animate: expand from core to target ring, bright start then fade
    gsap.fromTo(el,
      { attr: { r: 40, 'stroke-width': 4 }, opacity: 1 },
      { attr: { r: targetR, 'stroke-width': 1 }, opacity: 0, duration: duration, ease: 'power2.out' }
    );
  }, delayMs);
}

// Iframe mode: use style.opacity with CSS transitions for Safari compatibility
function animateLIT_iframe(diagram) {
  if (firedSections.has('lit-iframe')) return;
  markFired('lit-iframe');

  // Stage the reveal from core outward with staggered delays
  const baseDelay = 200; // short settling time (onVisible already waited)
  const step = 350;      // ms between each ring stage (tighter for snappier build)

  // Ring radii for wave targets
  const ringRadii = [110, 185, 260, 340, 420];

  // 1. Core — Ethics
  revealSVG('.lit-core', baseDelay);
  revealSVG('.lit-core-label', baseDelay + 100);
  revealSVG('.lit-core-sub', baseDelay + 150);
  revealSVG('.lit-core-pulse', baseDelay + 200);

  // 2. Ring 1: Cognitive + wave emanating to ring 1
  fireLITWave('.lit-wave-1', ringRadii[0], 0.8, baseDelay + step - 100);
  revealSVG('.lit-band-1', baseDelay + step);
  revealSVG('.lit-ring-1', baseDelay + step + 50);
  revealSVG('.lit-clabel-1', baseDelay + step + 100);
  revealSVG('.lit-particles-1', baseDelay + step + 150);

  // 3. Ring 2: Emotional + wave emanating to ring 2
  fireLITWave('.lit-wave-2', ringRadii[1], 1.0, baseDelay + step * 2 - 100);
  revealSVG('.lit-band-2, .lit-band-fill-2', baseDelay + step * 2);
  revealSVG('.lit-ring-2', baseDelay + step * 2 + 50);
  revealSVG('.lit-clabel-2', baseDelay + step * 2 + 100);
  revealSVG('.lit-particles-2', baseDelay + step * 2 + 150);

  // 4. Ring 3: Symbolic + wave emanating to ring 3
  fireLITWave('.lit-wave-3', ringRadii[2], 1.2, baseDelay + step * 3 - 100);
  revealSVG('.lit-band-3, .lit-band-fill-3', baseDelay + step * 3);
  revealSVG('.lit-ring-3', baseDelay + step * 3 + 50);
  revealSVG('.lit-clabel-3', baseDelay + step * 3 + 100);
  revealSVG('.lit-particles-3', baseDelay + step * 3 + 150);

  // 5. Ring 4: Strategic + wave emanating to ring 4
  fireLITWave('.lit-wave-4', ringRadii[3], 1.4, baseDelay + step * 4 - 100);
  revealSVG('.lit-band-4, .lit-band-fill-4', baseDelay + step * 4);
  revealSVG('.lit-ring-4', baseDelay + step * 4 + 50);
  revealSVG('.lit-clabel-4', baseDelay + step * 4 + 100);
  revealSVG('.lit-particles-4', baseDelay + step * 4 + 150);

  // 6. Ring 5: Ethical (outermost) + wave emanating to ring 5
  fireLITWave('.lit-wave-5', ringRadii[4], 1.6, baseDelay + step * 5 - 100);
  revealSVG('.lit-band-5', baseDelay + step * 5);
  revealSVG('.lit-ring-5', baseDelay + step * 5 + 50);
  revealSVG('.lit-clabel-5', baseDelay + step * 5 + 100);
  revealSVG('.lit-particles-5', baseDelay + step * 5 + 150);
  revealSVG('.lit-glow-ring', baseDelay + step * 5 + 200);

  // Start continuous animations after full build (iframe-safe version)
  setTimeout(() => startLITContinuousAnimations_iframe(), baseDelay + step * 6);
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

// Continuous looping animations — standalone (GSAP attr:{} is fine outside iframes)
function startLITContinuousAnimations() {
  // Core pulse
  gsap.fromTo('.lit-core-pulse',
    { attr: { r: 40, opacity: 0.4 } },
    { attr: { r: 48, opacity: 0 }, duration: 2, ease: 'sine.inOut', repeat: -1, delay: 0.5 }
  );
  // Outer ring stroke pulse
  gsap.to('.lit-ring-5', {
    attr: { 'stroke-width': 3.5 },
    duration: 2.5,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1
  });
  // Continuous emanating waves from core outward to outermost ring
  // 3 staggered waves creating a constant ripple effect
  ['.lit-wave-cont-1', '.lit-wave-cont-2', '.lit-wave-cont-3'].forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.removeAttribute('opacity');
    gsap.fromTo(el,
      { attr: { r: 40, 'stroke-width': 3.5 }, opacity: 0.9 },
      { attr: { r: 440, 'stroke-width': 0.5 }, opacity: 0,
        duration: 3.5, ease: 'power1.out', repeat: -1, delay: i * 1.2
      }
    );
  });
}

// Iframe-safe continuous looping animations for LIT
function startLITContinuousAnimations_iframe() {
  // Remove SVG opacity attr from core pulse so GSAP style.opacity works
  const corePulse = document.querySelector('.lit-core-pulse');
  if (corePulse) corePulse.removeAttribute('opacity');

  // Core pulse
  gsap.fromTo('.lit-core-pulse',
    { attr: { r: 40 }, opacity: 0.4 },
    { attr: { r: 48 }, opacity: 0, duration: 2, ease: 'sine.inOut', repeat: -1, delay: 0.5 }
  );
  // Outer ring stroke pulse
  gsap.to('.lit-ring-5', {
    attr: { 'stroke-width': 3.5 },
    duration: 2.5,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1
  });
  // Continuous emanating waves from core outward to outermost ring
  // 3 staggered waves creating a constant ripple effect
  ['.lit-wave-cont-1', '.lit-wave-cont-2', '.lit-wave-cont-3'].forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.removeAttribute('opacity');
    gsap.fromTo(el,
      { attr: { r: 40, 'stroke-width': 3.5 }, opacity: 0.9 },
      { attr: { r: 440, 'stroke-width': 0.5 }, opacity: 0,
        duration: 3.5, ease: 'power1.out', repeat: -1, delay: i * 1.2
      }
    );
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
      // Safari-safe: use style.opacity with CSS transitions
      const base = 0;
      revealSVG('.lir-actual', base);
      // Also reveal nested pulse circles (they have their own opacity="0")
      revealSVG('.lir-pulse-actual', base + 200);
      revealSVG('.lir-potential', base + 600);
      revealSVG('.lir-pulse-potential', base + 800);
      revealSVG('.lir-tension', base + 1200);
      revealSVG('.lir-centre-group', base + 1500);
      revealSVG('.lir-pendulum', base + 1800);
      setTimeout(() => startLIRContinuousAnimations_iframe(), base + 2200);
    } else {
      // Standalone: GSAP timeline
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: startLIRContinuousAnimations
      });
      tl.to('.lir-actual', { attr: { opacity: 1 }, duration: 0.8, ease: 'power3.out' })
        .to('.lir-potential', { attr: { opacity: 1 }, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .to('.lir-tension', { attr: { opacity: 1 }, duration: 0.7 }, '-=0.2')
        .to('.lir-centre-group', { attr: { opacity: 1 }, duration: 0.6 }, '-=0.3')
        .to('.lir-pendulum', { attr: { opacity: 1 }, duration: 0.7 }, '-=0.2');
    }
  }

  onVisible(diagram, playLIR);
  setTimeout(() => { if (!firedSections.has('lir')) playLIR(); }, SAFETY_TIMEOUT_MS + 500);
}

// Continuous looping animations for LIR — MUCH BRIGHTER & MORE DRAMATIC
function startLIRContinuousAnimations() {
  // Actualised pole: dramatic expanding ripple with glow
  gsap.fromTo('.lir-pulse-actual',
    { attr: { r: 82, opacity: 1 } },
    { attr: { r: 160, opacity: 0 }, duration: 1.6, ease: 'sine.out', repeat: -1, delay: 0.2 }
  );
  gsap.to('.lir-actual circle:first-child', {
    attr: { r: 95 },
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });

  // Potential pole: dramatic offset expanding ripple
  gsap.fromTo('.lir-pulse-potential',
    { attr: { r: 82, opacity: 1 } },
    { attr: { r: 160, opacity: 0 }, duration: 1.6, ease: 'sine.out', repeat: -1, delay: 0.8 }
  );
  gsap.to('.lir-potential circle:first-child', {
    attr: { r: 95 },
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 0.8
  });

  // Dynamic Opposition arcs: dramatic stroke-width pulse — much thicker
  gsap.to('.lir-flow-top', {
    attr: { 'stroke-width': 8 },
    duration: 1.2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
  gsap.to('.lir-flow-bottom', {
    attr: { 'stroke-width': 8 },
    duration: 1.2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 0.6
  });

  // Centre label dramatic opacity pulse
  gsap.fromTo('.lir-centre-group',
    { attr: { opacity: 1 } },
    { attr: { opacity: 0.2 }, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.3 }
  );
}

// Iframe-safe continuous animations for LIR — MUCH BRIGHTER & MORE DRAMATIC
// Uses GSAP attr:{} for r/stroke-width (geometric attrs work fine in Safari)
// but uses CSS style.opacity for opacity changes (attr:{opacity} fails in Safari iframes)
function startLIRContinuousAnimations_iframe() {
  // Remove leftover SVG opacity attrs from pulse circles so GSAP style.opacity works
  document.querySelectorAll('.lir-pulse-actual, .lir-pulse-potential').forEach(el => {
    el.removeAttribute('opacity');
  });

  // Actualised pole: dramatic expanding ripple with glow
  gsap.fromTo('.lir-pulse-actual',
    { attr: { r: 82 }, opacity: 1 },
    { attr: { r: 160 }, opacity: 0, duration: 1.6, ease: 'sine.out', repeat: -1, delay: 0.2 }
  );
  gsap.to('.lir-actual circle:first-child', {
    attr: { r: 95 },
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });

  // Potential pole: dramatic offset expanding ripple
  gsap.fromTo('.lir-pulse-potential',
    { attr: { r: 82 }, opacity: 1 },
    { attr: { r: 160 }, opacity: 0, duration: 1.6, ease: 'sine.out', repeat: -1, delay: 0.8 }
  );
  gsap.to('.lir-potential circle:first-child', {
    attr: { r: 95 },
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 0.8
  });

  // Dynamic Opposition arcs: dramatic stroke-width pulse — much thicker
  gsap.to('.lir-flow-top', {
    attr: { 'stroke-width': 8 },
    duration: 1.2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
  gsap.to('.lir-flow-bottom', {
    attr: { 'stroke-width': 8 },
    duration: 1.2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 0.6
  });

  // Centre label dramatic opacity pulse — use CSS style opacity
  const centreGroup = document.querySelector('.lir-centre-group');
  if (centreGroup) {
    centreGroup.removeAttribute('opacity');
    gsap.fromTo(centreGroup,
      { opacity: 1 },
      { opacity: 0.2, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.3 }
    );
  }
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
// MIRROR DIAGRAM — Human ↔ AI symmetry (Block 4)
// Rows reveal top-down; each row fades in silver-left / amber-right
// ============================================================
function animateMirror() {
  const diagram = document.getElementById('mirrorDiagram');
  if (!diagram) return;

  function playMirror() {
    if (firedSections.has('mirror')) return;
    markFired('mirror');

    const base = 0;
    const step = 220;
    if (isIframe) {
      revealSVG('.mirror-col-human', base);
      revealSVG('.mirror-col-ai', base + 120);
      revealSVG('.mirror-col-spine-head', base + 60);
      revealSVG('.mirror-spine', base + 300);
      revealSVG('.mirror-row-1', base + 500);
      revealSVG('.mirror-row-2', base + 500 + step);
      revealSVG('.mirror-row-3', base + 500 + step * 2);
      revealSVG('.mirror-row-4', base + 500 + step * 3);
      revealSVG('.mirror-row-5', base + 500 + step * 4);
      revealSVG('.mirror-caption', base + 500 + step * 5);
    } else {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.to('.mirror-col-human', { attr: { opacity: 1 }, duration: 0.5 })
        .to('.mirror-col-ai', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.3')
        .to('.mirror-col-spine-head', { attr: { opacity: 1 }, duration: 0.4 }, '-=0.3')
        .to('.mirror-spine', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.1')
        .to('.mirror-row-1', { attr: { opacity: 1 }, duration: 0.5 }, '+=0.1')
        .to('.mirror-row-2', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.25')
        .to('.mirror-row-3', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.25')
        .to('.mirror-row-4', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.25')
        .to('.mirror-row-5', { attr: { opacity: 1 }, duration: 0.6 }, '-=0.2')
        .to('.mirror-caption', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.1');
    }
  }

  onVisible(diagram, playMirror);
  setTimeout(() => { if (!firedSections.has('mirror')) playMirror(); }, SAFETY_TIMEOUT_MS + 600);
}

// ============================================================
// LOOP DIAGRAM — Three moves with artefact badges (Block 5)
// ============================================================
function animateLoop() {
  const diagram = document.getElementById('loopDiagram');
  if (!diagram) return;

  function playLoop() {
    if (firedSections.has('loop')) return;
    markFired('loop');

    if (isIframe) {
      revealSVG('.loop-node-1', 0);
      revealSVG('.loop-wave-1', 300);
      revealSVG('.loop-src:nth-of-type(1)', 350);
      revealSVG('.loop-node-2', 500);
      revealSVG('.loop-wave-2', 800);
      revealSVG('.loop-src:nth-of-type(2)', 850);
      revealSVG('.loop-node-3', 1000);
      revealSVG('.loop-wave-return', 1400);
      revealSVG('.loop-eri-label', 1600);
    } else {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.to('.loop-node-1', { attr: { opacity: 1 }, duration: 0.5 })
        .to('.loop-wave-1', { attr: { opacity: 1 }, duration: 0.6 }, '-=0.15')
        .to('.loop-src', { attr: { opacity: 1 }, duration: 0.4, stagger: 0.1 }, '-=0.2')
        .to('.loop-node-2', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.1')
        .to('.loop-wave-2', { attr: { opacity: 1 }, duration: 0.6 }, '-=0.15')
        .to('.loop-node-3', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.1')
        .to('.loop-wave-return', { attr: { opacity: 1 }, duration: 0.6 }, '+=0.1')
        .to('.loop-eri-label', { attr: { opacity: 1 }, duration: 0.5 }, '-=0.2');
    }
  }

  onVisible(diagram, playLoop);
  setTimeout(() => { if (!firedSections.has('loop')) playLoop(); }, SAFETY_TIMEOUT_MS + 800);

  // --- Hover/focus interactivity: pause waves + show tooltips ---
  const nodes = diagram.querySelectorAll('.loop-node');
  const tooltips = {
    1: diagram.querySelector('.loop-tooltip-1'),
    2: diagram.querySelector('.loop-tooltip-2'),
    3: diagram.querySelector('.loop-tooltip-3'),
  };

  function positionTooltip(idx) {
    const tooltip = tooltips[idx];
    const node = diagram.querySelector('.loop-node-' + idx);
    if (!tooltip || !node) return;
    // Find the outer circle (ring). Use the first <circle> in the group as anchor.
    const circle = node.querySelector('circle');
    if (!circle) return;
    const circleRect = circle.getBoundingClientRect();
    const diagramRect = diagram.getBoundingClientRect();
    const cx = circleRect.left + circleRect.width / 2 - diagramRect.left;
    const circleTop = circleRect.top - diagramRect.top; // top edge of the circle
    tooltip.style.left = cx + 'px';
    // Anchor the tooltip’s BOTTOM edge 14px above the circle top so the
    // downward-pointing arrow sits just above the node.
    tooltip.style.top = 'auto';
    tooltip.style.bottom = (diagramRect.height - (circleTop - 14)) + 'px';
  }
  function positionAllTooltips() {
    positionTooltip(1);
    positionTooltip(2);
    positionTooltip(3);
  }
  positionAllTooltips();
  window.addEventListener('resize', positionAllTooltips);
  // Recompute after animation reveal (nodes start at opacity 0)
  setTimeout(positionAllTooltips, 2500);

  function activate(idx) {
    diagram.classList.add('is-paused');
    Object.values(tooltips).forEach(t => t && t.classList.remove('is-visible'));
    const tt = tooltips[idx];
    if (tt) {
      positionTooltip(idx);
      tt.classList.add('is-visible');
    }
  }
  function deactivate() {
    diagram.classList.remove('is-paused');
    Object.values(tooltips).forEach(t => t && t.classList.remove('is-visible'));
  }

  nodes.forEach((node, i) => {
    const idx = i + 1;
    node.addEventListener('mouseenter', () => activate(idx));
    node.addEventListener('mouseleave', deactivate);
    node.addEventListener('focus', () => activate(idx));
    node.addEventListener('blur', deactivate);
    // Touch devices: tap to toggle
    node.addEventListener('click', (e) => {
      e.preventDefault();
      const tt = tooltips[idx];
      if (tt && tt.classList.contains('is-visible')) {
        deactivate();
      } else {
        activate(idx);
      }
    });
  });
  // Dismiss on outside click
  document.addEventListener('click', (e) => {
    if (!diagram.contains(e.target)) deactivate();
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  animateHero();
  revealSections();
  animateLIT();
  animateLIR();
  animateMirror();
  animateDA();
  animateLoop();

  revealCards('.lit-label-card', 0.1);
  revealCards('.lir-card', 0.12);
  revealCards('.da-card', 0.12);
  revealCards('.practice-card', 0.1);
  revealCards('.fm-card', 0.08);
});
