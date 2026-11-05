// ==UserScript==
// @name         Duo Wide: Auto Full Width
// @namespace    https://github.com/duo-wide
// @version      0.6.1
// @description  Expand on load. Swipe left with two fingers to collapse and right to expand.
// @match        *://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.top !== window.self) return;
  // Use the screen size because a page can request a wider layout viewport.
  const shortScreenEdge = Math.min(window.screen.width, window.screen.height);
  if (!window.matchMedia('(pointer: coarse)').matches || shortScreenEdge > 700) return;

  const root = document.documentElement;
  if (root.dataset.duoWideInitialized === '1') return;
  root.dataset.duoWideInitialized = '1';

  const STYLE_ID = 'duo-wide-width-style';
  const style = document.createElement('style');
  style.id = STYLE_ID;
  // `overflow-x: clip` hides the extra 64px without making <body> a scroll
  // container, so `position: sticky` descendants keep working. The `hidden`
  // declaration is a fallback for browsers without `clip` support (Safari < 16).
  style.textContent = 'html{overflow-x:hidden!important}body{width:calc(100% + 64px)!important;max-width:none!important;overflow-x:hidden!important;overflow-x:clip!important;margin-right:0!important}';
  (document.head || root).appendChild(style);

  // Recognize at most one action per two-finger gesture.
  let start = null;
  const midpoint = (touches) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  });
  const distance = (touches) => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );

  document.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 2) {
      start = null;
      return;
    }
    start = {
      point: midpoint(event.touches),
      separation: distance(event.touches)
    };
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (event) => {
    if (!start || event.touches.length !== 2) return;
    const point = midpoint(event.touches);
    const dx = point.x - start.point.x;
    const dy = point.y - start.point.y;
    const pinchDelta = Math.abs(distance(event.touches) - start.separation);
    // Act during movement, before Safari can swallow the final touchend.
    if (Math.abs(dx) >= 85 && Math.abs(dx) > Math.abs(dy) * 1.5 && pinchDelta < 25) {
      start = null;
      if (dx < 0) {
        style.remove();
      } else if (!style.parentNode) {
        (document.head || root).appendChild(style);
      }
    }
  }, { passive: true, capture: true });

  document.addEventListener('touchend', () => { start = null; }, { passive: true, capture: true });
  document.addEventListener('touchcancel', () => { start = null; }, { passive: true, capture: true });
})();
