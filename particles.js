// === Clara Futura World — Enhanced Ambient Particles + Scroll Light Explosions ===
// Contrast rule: silver dots on amber lines, amber dots on silver lines, all brighter

(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let particles = [];
  let explosions = [];
  let width, height;
  let scrollY = 0;
  let lastScrollY = 0;
  let scrollSpeed = 0;
  let animId = null;
  const PARTICLE_COUNT = 300;
  // iOS Safari canvas limit: ~16M pixels (4096x4096). Cap to stay safe at high DPR.
  const MAX_CANVAS_DIM = 4096;

  // Bright, vivid colours
  const AMBER = '#F5C870';
  const AMBER_HOT = '#F2B54D';
  const AMBER_BRIGHT = '#FFD074';
  const SILVER = '#C8D0D8';
  const SILVER_BRIGHT = '#DDE2E7';
  const SILVER_WHITE = '#EEF1F4';
  const CREAM = '#E8E5DD';
  const WHITE = '#FFFFFF';

  function randomColor() {
    const r = Math.random();
    if (r < 0.08) return WHITE;
    if (r < 0.18) return SILVER_WHITE;
    if (r < 0.32) return SILVER_BRIGHT;
    if (r < 0.46) return SILVER;
    if (r < 0.58) return AMBER_BRIGHT;
    if (r < 0.72) return AMBER;
    if (r < 0.84) return AMBER_HOT;
    return CREAM;
  }

  function explosionColor() {
    const r = Math.random();
    if (r < 0.2) return WHITE;
    if (r < 0.45) return AMBER_BRIGHT;
    if (r < 0.65) return AMBER;
    if (r < 0.8) return SILVER_WHITE;
    return SILVER_BRIGHT;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Cap canvas size for iOS Safari (max ~4096px per dimension at device pixels)
    width = w;
    height = h;
    canvas.width = Math.min(w * dpr, MAX_CANVAS_DIM);
    canvas.height = Math.min(h * dpr, MAX_CANVAS_DIM);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const scaleX = canvas.width / w;
    const scaleY = canvas.height / h;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  }

  function createParticle(x, y) {
    const color = randomColor();
    const usePos = (x !== undefined && y !== undefined);
    return {
      x: usePos ? x : Math.random() * width,
      y: usePos ? y : Math.random() * height,
      r: Math.random() * 3.8 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3 - 0.06,
      color: color,
      isAmber: color === AMBER || color === AMBER_HOT || color === AMBER_BRIGHT,
      isSilver: color === SILVER || color === SILVER_BRIGHT || color === SILVER_WHITE,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.015,
      glowSize: Math.random() * 3 + 1,
      life: 1,       // 1 = alive, used for explosion particles that fade
      maxLife: 1,
      isExplosion: false,
    };
  }

  // --- Explosion particle (bright, fast, fades) ---
  function createExplosionParticle(cx, cy) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    const color = explosionColor();
    const life = 0.6 + Math.random() * 0.8; // 0.6–1.4 seconds worth
    return {
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      r: Math.random() * 4 + 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      isAmber: color === AMBER || color === AMBER_HOT || color === AMBER_BRIGHT,
      isSilver: color === SILVER || color === SILVER_BRIGHT || color === SILVER_WHITE,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02,
      glowSize: Math.random() * 5 + 3,
      life: life,
      maxLife: life,
      isExplosion: true,
    };
  }

  // --- Scroll-triggered light explosions ---
  const explodedSections = new Set();
  let heroExplosionTimer = 0;
  const HERO_BURST_INTERVAL = 120; // ~2 seconds at 60fps

  function checkScrollExplosions() {
    const sections = document.querySelectorAll('.section, .hero');
    sections.forEach((sec, idx) => {
      const key = 'sec-' + idx;
      if (explodedSections.has(key)) return;

      const rect = sec.getBoundingClientRect();
      // Trigger when section enters the top 70% of viewport
      if (rect.top < height * 0.7 && rect.bottom > 0) {
        explodedSections.add(key);
        triggerExplosion(
          width * (0.3 + Math.random() * 0.4),
          rect.top + rect.height * 0.3
        );
      }
    });

    // Also trigger small bursts on fast scrolling
    if (Math.abs(scrollSpeed) > 8) {
      triggerMicroBurst(
        width * (0.2 + Math.random() * 0.6),
        height * 0.5
      );
    }

    // Periodic hero-area light bursts (particles exploding near portrait)
    heroExplosionTimer++;
    if (heroExplosionTimer >= HERO_BURST_INTERVAL) {
      heroExplosionTimer = 0;
      const heroEl = document.querySelector('.hero-portrait-wrap');
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < height) {
          // Burst from edge of portrait area
          const angle = Math.random() * Math.PI * 2;
          const radius = 140 + Math.random() * 60;
          const bx = rect.left + rect.width / 2 + Math.cos(angle) * radius;
          const by = rect.top + rect.height / 2 + Math.sin(angle) * radius;
          triggerExplosion(bx, by);
        }
      }
    }
  }

  function triggerExplosion(cx, cy) {
    // Map to canvas coordinates (canvas is fixed, content scrolls)
    const canvasY = cy;
    const count = 50 + Math.floor(Math.random() * 30); // 50–80 particles
    for (let i = 0; i < count; i++) {
      explosions.push(createExplosionParticle(cx, canvasY));
    }
  }

  function triggerMicroBurst(cx, cy) {
    const count = 12 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      explosions.push(createExplosionParticle(cx, cy));
    }
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  // --- Main render loop ---
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Update scroll speed
    scrollY = window.scrollY || window.pageYOffset;
    scrollSpeed = scrollY - lastScrollY;
    lastScrollY = scrollY;

    // Check for section explosions
    checkScrollExplosions();

    const dt = 1 / 60; // assume 60fps

    // --- Draw ambient particles ---
    particles.forEach(p => {
      p.x += p.vx + Math.sin(p.phase) * 0.2;
      p.y += p.vy;
      p.phase += p.pulseSpeed;

      // React to scroll — particles drift with scroll motion
      p.x += scrollSpeed * 0.02 * (p.isAmber ? 1 : -1);
      p.y -= scrollSpeed * 0.01;

      // Wrap around
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      const pulse = 0.5 + 0.5 * Math.sin(p.phase * 3);
      const radius = p.r * (0.85 + pulse * 0.35);

      // Glow for larger particles
      if (p.r > 2.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + p.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.12 + pulse * 0.12;
        ctx.fill();
      }

      // Main particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.65 + pulse * 0.35;
      ctx.fill();
    });
    // Reset alpha after particle loop — prevents WebKit alpha state leak
    ctx.globalAlpha = 1;

    // --- Draw connection lines (nearby particles) ---
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 25600) { // 160px
          const dist = Math.sqrt(distSq);
          const alpha = (1 - (dist / 160)) * 0.22;
          const isAmberLine = particles[i].isAmber;
          const lineColor = isAmberLine
            ? `rgba(242, 181, 77, ${alpha})`
            : `rgba(200, 208, 216, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // --- Draw explosion particles ---
    for (let i = explosions.length - 1; i >= 0; i--) {
      const p = explosions[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97; // friction
      p.vy *= 0.97;
      p.life -= 0.012;
      p.phase += p.pulseSpeed;

      if (p.life <= 0) {
        explosions.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;
      const radius = p.r * lifeRatio;

      // Bright outer glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + p.glowSize * lifeRatio, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.3 * lifeRatio;
      ctx.fill();

      // Extra wide soft glow for explosion brightness
      if (p.r > 3) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + p.glowSize * 2.5 * lifeRatio, 0, Math.PI * 2);
        ctx.fillStyle = WHITE;
        ctx.globalAlpha = 0.08 * lifeRatio;
        ctx.fill();
      }

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = (0.8 + 0.2 * Math.sin(p.phase * 5)) * lifeRatio;
      ctx.fill();
    }
    // Reset alpha after explosion loop
    ctx.globalAlpha = 1;

    animId = requestAnimationFrame(draw);
  }

  // Pause/resume on visibility change — iOS Safari throttles rAF when backgrounded
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    } else {
      if (!animId) { animId = requestAnimationFrame(draw); }
    }
  });

  window.addEventListener('resize', resize);

  init();
  draw();
})();
