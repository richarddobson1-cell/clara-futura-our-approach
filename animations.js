// === Clara Futura — Our Approach Animations ===
// Uses GSAP + ScrollTrigger for scroll-driven reveals

gsap.registerPlugin(ScrollTrigger);

// === Scroll-triggered card reveals ===
function revealCards(selector, stagger = 0.12) {
  const cards = document.querySelectorAll(selector);
  if (!cards.length) return;

  ScrollTrigger.create({
    trigger: cards[0].closest('.section') || cards[0],
    start: 'top 75%',
    once: true,
    onEnter: () => {
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.classList.add('visible');
        }, i * (stagger * 1000));
      });
    }
  });
}

// === LIT Diagram Animation ===
function animateLIT() {
  const section = document.getElementById('lit');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
      once: true
    }
  });

  // Rings appear from centre outward
  tl.to('.lit-ring-1', { opacity: 1, duration: 0.6, ease: 'power2.out' })
    .to('.lit-ring-2', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .to('.lit-ring-3', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .to('.lit-ring-4', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .to('.lit-ring-5', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
    .to('.lit-label-5, .lit-sublabel-5', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .to('.lit-tension-lines', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.2')
    .to('.lit-particle', { opacity: 0.7, duration: 0.5, stagger: 0.15 }, '-=0.4');

  // Pulsing glow on the ethical ring
  gsap.to('.lit-ring-5', {
    strokeWidth: 3.5,
    duration: 2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 2
  });
}

// === LIR Diagram Animation ===
function animateLIR() {
  const section = document.getElementById('lir');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
      once: true
    }
  });

  tl.from('.lir-actual', { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out' })
    .from('.lir-potential', { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
    .from('.lir-tension', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
    .from('.lir-centre-label', { opacity: 0, scale: 0.8, transformOrigin: 'center', duration: 0.5, ease: 'power2.out' }, '-=0.2');

  // Continuous subtle pulse on poles
  gsap.to('.lir-actual circle:first-child', {
    r: 85,
    duration: 3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
  gsap.to('.lir-potential circle:first-child', {
    r: 85,
    duration: 3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1.5
  });
}

// === Dynamic Alignment Animation ===
function animateDA() {
  const section = document.getElementById('alignment');
  if (!section) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
      once: true
    }
  });

  // Centre appears first, then quadrants fly in
  tl.from('.da-svg circle:not(.da-pulse):not(.da-spiral-particle)', {
    scale: 0,
    transformOrigin: 'center',
    duration: 0.6,
    ease: 'back.out(1.7)'
  })
  .from('.da-centre-label', { opacity: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2')
  .from('.da-spiral-path', { opacity: 0, drawSVG: '0%', duration: 1.2, ease: 'power3.out' }, '-=0.3')
  .from('.da-spiral-particle', { opacity: 0, duration: 0.4 }, '-=0.6')
  .from('.da-quad-lit', { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.8')
  .from('.da-quad-lir', { x: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
  .from('.da-quad-eri', { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5')
  .from('.da-quad-vpm', { x: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5');
}

// === Section heading reveals ===
function revealSections() {
  document.querySelectorAll('.section').forEach(section => {
    const label = section.querySelector('.label');
    const h2 = section.querySelector('h2');
    const lead = section.querySelector('.prose .lead');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true
      }
    });

    if (label) tl.from(label, { y: 15, opacity: 0, duration: 0.5, ease: 'power3.out' });
    if (h2) tl.from(h2, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');
    if (lead) tl.from(lead, { y: 15, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');
  });
}

// === Hero entrance ===
function animateHero() {
  const tl = gsap.timeline({ delay: 0.3 });
  tl.from('.hero .label', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
    .from('.hero h1', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
    .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
    .from('.scroll-indicator', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.2');
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
