import { hoverCard, selectPlayground } from './audio.js';

const CARD_SELECTOR = '.card, .spotlight-card, .featured-card';

// Track the currently hovered card to avoid double-triggering
// on intra-card mouse movement.
let lastHoveredCard = null;

function attachInteractions(container) {
  if (!container) return;

  // Use pointerover instead of mouseenter so we can delegate.
  container.addEventListener('pointerover', (e) => {
    const card = e.target.closest(CARD_SELECTOR);
    if (!card) {
      lastHoveredCard = null;
      return;
    }
    if (card === lastHoveredCard) return;
    lastHoveredCard = card;
    hoverCard();
  });

  // Clicks fire the selection sound. The link navigation
  // happens via the anchor's default behavior; we just play
  // the sound without preventing default.
  container.addEventListener('click', (e) => {
    const card = e.target.closest(CARD_SELECTOR);
    if (!card) return;
    selectPlayground();
    // No preventDefault, let the link navigate.
  });
}

export function initCardInteractions() {
  // Delegate at all container levels where cards appear.
  // These containers persist across re-renders; cards inside
  // them may come and go.
  attachInteractions(document.querySelector('.card-grid'));
  attachInteractions(document.querySelector('.featured-row'));
  attachInteractions(document.querySelector('.landing-featured'));
  attachInteractions(document.querySelector('.spotlight-card'));
  attachInteractions(document.querySelector('.related-strip'));
}

// Auto-init on DOMContentLoaded. If the containers don't exist
// yet (SPA navigation to a page without them), the calls are
// no-ops.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardInteractions);
} else {
  initCardInteractions();
}

// Expose for manual re-init after navigation if needed
if (typeof window !== 'undefined') {
  window.__initCardInteractions = initCardInteractions;
}
