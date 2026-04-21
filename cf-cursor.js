/* Clara Futura — Custom Amber Cursor (Our Approach) */
(function () {
  'use strict';

  // Enable in iframe too so the circle+dot appears everywhere (no native arrow fallback).
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return;

  // Inject DOM if not present
  var cursor = document.getElementById('cfCursor');
  var cursorOuter = document.getElementById('cfCursorOuter');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = 'cfCursor';
    cursor.className = 'cf-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
  }
  if (!cursorOuter) {
    cursorOuter = document.createElement('div');
    cursorOuter.id = 'cfCursorOuter';
    cursorOuter.className = 'cf-cursor-outer';
    cursorOuter.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorOuter);
  }

  var mouseX = -100, mouseY = -100;
  var outerX = -100, outerY = -100;
  var ready = false;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!ready) {
      ready = true;
      document.body.classList.add('cf-cursor-ready');
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    cursor.style.opacity = '0';
    cursorOuter.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    cursor.style.opacity = '';
    cursorOuter.style.opacity = '';
  });

  function animate() {
    outerX += (mouseX - outerX) * 0.18;
    outerY += (mouseY - outerY) * 0.18;
    cursor.style.transform = 'translate3d(' + (mouseX - 4) + 'px,' + (mouseY - 4) + 'px,0)';
    cursorOuter.style.transform = 'translate3d(' + (outerX - 20) + 'px,' + (outerY - 20) + 'px,0)';
    requestAnimationFrame(animate);
  }
  animate();

  // Hover state for interactive elements
  var hoverSel = 'a,button,[role="button"],.cf-head,.cf-toggle-icon,.ambient-music-btn,input,textarea,summary,.magnetic';
  document.addEventListener('mouseover', function (e) {
    if (e.target && e.target.closest && e.target.closest(hoverSel)) {
      document.body.classList.add('cf-cursor-hover');
    }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target && e.target.closest && e.target.closest(hoverSel)) {
      document.body.classList.remove('cf-cursor-hover');
    }
  });
})();
