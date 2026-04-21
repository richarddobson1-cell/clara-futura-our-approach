// === Clara Futura — Ambient Music Player ===
// HTML5 Audio with fade-in/out, looping, and volume control.
// No login required. Plays instantly on first user click.

(function() {
  'use strict';

  // Works in both standalone and iframe (WordPress embed) modes
  const btn = document.getElementById('ambientMusicBtn');
  const audio = document.getElementById('ambientAudio');
  if (!btn || !audio) return;

  const playIcon = btn.querySelector('.ambient-icon-play');
  const pauseIcon = btn.querySelector('.ambient-icon-pause');

  // Config
  const TARGET_VOLUME = 0.35;   // Subtle background level
  const FADE_DURATION = 2000;   // 2s fade in/out
  const FADE_STEPS = 40;

  let isPlaying = false;
  let fadeInterval = null;

  function updateUI() {
    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      btn.classList.add('is-playing');
      btn.setAttribute('aria-label', 'Pause ambient music');
      btn.setAttribute('title', 'Pause ambient music');
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      btn.classList.remove('is-playing');
      btn.setAttribute('aria-label', 'Play ambient music');
      btn.setAttribute('title', 'Play ambient music');
    }
  }

  function clearFade() {
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
  }

  function fadeIn() {
    clearFade();
    audio.volume = 0;
    audio.play().then(function() {
      isPlaying = true;
      updateUI();
      let step = 0;
      const stepTime = FADE_DURATION / FADE_STEPS;
      fadeInterval = setInterval(function() {
        step++;
        // Ease-in curve for natural volume ramp
        const progress = step / FADE_STEPS;
        audio.volume = TARGET_VOLUME * (progress * progress);
        if (step >= FADE_STEPS) {
          audio.volume = TARGET_VOLUME;
          clearFade();
        }
      }, stepTime);
    }).catch(function(err) {
      // Browser blocked playback — shouldn't happen after user click
      console.warn('Ambient audio blocked:', err);
    });
  }

  function fadeOut() {
    clearFade();
    const startVol = audio.volume;
    let step = 0;
    const stepTime = FADE_DURATION / FADE_STEPS;
    fadeInterval = setInterval(function() {
      step++;
      const progress = step / FADE_STEPS;
      audio.volume = Math.max(0, startVol * (1 - progress));
      if (step >= FADE_STEPS) {
        audio.pause();
        audio.volume = 0;
        isPlaying = false;
        updateUI();
        clearFade();
      }
    }, stepTime);
  }

  function togglePlayback() {
    if (isPlaying) {
      fadeOut();
    } else {
      fadeIn();
    }
  }

  // Click handler
  btn.addEventListener('click', togglePlayback);

  // Keyboard accessibility
  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePlayback();
    }
  });

  // Ensure looping works (belt and suspenders)
  audio.addEventListener('ended', function() {
    if (isPlaying) {
      audio.currentTime = 0;
      audio.play();
    }
  });
})();
