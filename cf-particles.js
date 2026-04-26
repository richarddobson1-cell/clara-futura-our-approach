/* Clara Futura particle overlay — matches V3.6 motion layer on deep pages. */
(function(){
  if (window.__cfOAParticles) return;
  window.__cfOAParticles = true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  function init() {
    var canvas = document.querySelector('.hero .cf-particle-canvas');
    if (!canvas) return;
    var hero = canvas.parentElement; // .hero-bg
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h;

    function resize() {
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var N = Math.min(180, Math.floor(w / 9));
    for (var p = 0; p < N; p++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.8,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.1 - Math.random() * 0.45,
        a: 0.65 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        freq: 0.6 + Math.random() * 0.9,
        hue: Math.random() < 0.25 ? 1 : 0
      });
    }

    var comets = [];
    function spawnComet() {
      var fromLeft = Math.random() < 0.5;
      comets.push({
        x: fromLeft ? -40 : w + 40,
        y: h * (0.2 + Math.random() * 0.6),
        vx: (fromLeft ? 1 : -1) * (2.2 + Math.random() * 1.8),
        vy: (Math.random() - 0.5) * 0.6,
        life: 1,
        decay: 0.006 + Math.random() * 0.004,
        len: 60 + Math.random() * 80
      });
    }

    var bursts = [];
    function spawnBurst() {
      bursts.push({
        x: w * (0.12 + Math.random() * 0.76),
        y: h * (0.2 + Math.random() * 0.6),
        r: 0,
        max: 180 + Math.random() * 160,
        life: 1,
        decay: 0.006 + Math.random() * 0.004
      });
    }

    var bt = 0, nba = 80 + Math.random() * 140;
    var ct = 0, nca = 300 + Math.random() * 500;
    var t = 0;

    function frame() {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      // Drifting light wave
      var waveY = h * 0.5 + Math.sin(t * 0.006) * h * 0.18;
      var waveG = ctx.createRadialGradient(
        w * 0.5 + Math.cos(t * 0.004) * w * 0.2, waveY, 0,
        w * 0.5, waveY, w * 0.7
      );
      waveG.addColorStop(0, 'rgba(255,215,130,0.18)');
      waveG.addColorStop(0.4, 'rgba(242,181,77,0.08)');
      waveG.addColorStop(1, 'rgba(242,181,77,0)');
      ctx.fillStyle = waveG;
      ctx.fillRect(0, 0, w, h);

      // Particles
      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        pt.x += pt.vx + Math.sin(t * 0.012 + pt.phase) * 0.22;
        pt.y += pt.vy;
        if (pt.y < -8) { pt.y = h + 8; pt.x = Math.random() * w; }
        if (pt.x < -8) pt.x = w + 8;
        if (pt.x > w + 8) pt.x = -8;

        var tw = 0.55 + 0.45 * Math.sin(t * 0.05 * pt.freq + pt.phase);
        var a = pt.a * tw;
        var core = pt.hue ? 'rgba(255,245,210,' : 'rgba(255,220,140,';
        var mid  = pt.hue ? 'rgba(255,210,140,' : 'rgba(242,181,77,';

        var g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r * 5);
        g.addColorStop(0, core + a + ')');
        g.addColorStop(0.25, mid + (a * 0.75) + ')');
        g.addColorStop(0.6, 'rgba(242,181,77,' + (a * 0.25) + ')');
        g.addColorStop(1, 'rgba(242,181,77,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = core + Math.min(1, a * 1.4) + ')';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bursts
      bt += 1;
      if (bt >= nba) { spawnBurst(); bt = 0; nba = 90 + Math.random() * 200; }
      for (var j = bursts.length - 1; j >= 0; j--) {
        var b = bursts[j];
        b.r += (b.max - b.r) * 0.045;
        b.life -= b.decay;
        if (b.life <= 0) { bursts.splice(j, 1); continue; }
        var la = b.life * 0.85;
        var bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        bg.addColorStop(0, 'rgba(255,245,210,' + la + ')');
        bg.addColorStop(0.15, 'rgba(255,220,140,' + (la * 0.8) + ')');
        bg.addColorStop(0.4, 'rgba(255,190,90,' + (la * 0.45) + ')');
        bg.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        // Rays
        var rays = 8;
        for (var k = 0; k < rays; k++) {
          var ang = (k / rays) * Math.PI * 2 + t * 0.005;
          var rx = b.x + Math.cos(ang) * b.r * 1.15;
          var ry = b.y + Math.sin(ang) * b.r * 1.15;
          var rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, b.r * 0.35);
          rg.addColorStop(0, 'rgba(255,230,160,' + (la * 0.5) + ')');
          rg.addColorStop(1, 'rgba(255,230,160,0)');
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(rx, ry, b.r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Comets
      ct += 1;
      if (ct >= nca) { spawnComet(); ct = 0; nca = 350 + Math.random() * 600; }
      for (var m = comets.length - 1; m >= 0; m--) {
        var c = comets[m];
        c.x += c.vx;
        c.y += c.vy;
        c.life -= c.decay;
        if (c.life <= 0 || c.x < -80 || c.x > w + 80) { comets.splice(m, 1); continue; }
        var tailX = c.x - c.vx * c.len * 0.3;
        var tailY = c.y - c.vy * c.len * 0.3;
        var ca = c.life * 0.9;
        var cg = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        cg.addColorStop(0, 'rgba(255,250,220,' + ca + ')');
        cg.addColorStop(0.3, 'rgba(255,220,140,' + (ca * 0.6) + ')');
        cg.addColorStop(1, 'rgba(242,181,77,0)');
        ctx.strokeStyle = cg;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        var hg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 8);
        hg.addColorStop(0, 'rgba(255,250,220,' + ca + ')');
        hg.addColorStop(1, 'rgba(255,250,220,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }
    // Defer first frame until browser is idle to keep first paint snappy.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(frame, { timeout: 600 });
    } else {
      setTimeout(frame, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
