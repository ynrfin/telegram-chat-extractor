// === CONFIG: chat container
const CONTAINER_SELECTOR = '.bubbles-inner.has-rights.is-chat';

// Initialize global objects
window.chats = window.chats || {};
window.chatsList = window.chatsList || [];

// Helper: clean up the message DOM before extracting innerHTML
function cleanMessageHTML(messageEl) {
  if (!messageEl) return '';

  const clone = messageEl.cloneNode(true);

  // Remove <span.clearfix> and <span.time>
  clone.querySelectorAll('span.clearfix, span.time').forEach(span => span.remove());

  // Strip <a.anchor-hashtag> but keep text content (e.g. "#fuiyouh")
  clone.querySelectorAll('a.anchor-hashtag').forEach(a => {
    const text = a.textContent || '';
    a.replaceWith(document.createTextNode(text));
  });

  return (clone.innerHTML || '').trim();
}

// Serialize one .bubble -> chat object
function serializeBubble(bubbleEl) {
  const { mid, peerId, timestamp } = bubbleEl.dataset;
  const messageEl = bubbleEl.querySelector('.bubble-content-wrapper .bubble-content .message');
  const message = cleanMessageHTML(messageEl);
  return { mid: mid ?? null, peer_id: peerId ?? null, timestamp: timestamp ?? null, message };
}

// Helper: find date-groups
function getDateGroups() {
  const container = document.querySelector(CONTAINER_SELECTOR);
  if (!container) return [];
  try {
    return container.querySelectorAll(':scope > section.bubbles-date-group');
  } catch {
    return container.querySelectorAll('section.bubbles-date-group');
  }
}

// Walk the DOM and update chats object
function scanAndAppendChats() {
  const dateGroups = getDateGroups();

  dateGroups.forEach(group => {
    const bubblesGroup = group.querySelector('div.bubbles-group');
    if (!bubblesGroup) return;

    const bubbles = bubblesGroup.querySelectorAll('div.bubble');
    bubbles.forEach(bubble => {
      const chat = serializeBubble(bubble);
      if (!chat.timestamp) return;

      // Use timestamp as key
      window.chats[chat.timestamp] = chat;
    });
  });

  // Update sorted array view
  window.chatsList = Object.values(window.chats)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  console.log('🔄 chats updated. Count:', window.chatsList.length);
}

// Initial scan
scanAndAppendChats();
console.log('✅ chats initialized and sorted. Count:', window.chatsList.length);
console.log(window.chatsList);

// MutationObserver: rescan when bubbles change
(function setupObserver() {
  const container = document.querySelector(CONTAINER_SELECTOR);
  if (!container) {
    console.error('❌ Container not found:', CONTAINER_SELECTOR);
    return;
  }

  const observer = new MutationObserver(mutations => {
    let shouldRescan = false;

    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes?.forEach(node => {
          if (node.nodeType === 1 &&
              (node.matches?.('div.bubble, section.bubbles-date-group') ||
               node.querySelector?.('div.bubble, section.bubbles-date-group'))) {
            shouldRescan = true;
          }
        });
        if (m.removedNodes?.length && m.addedNodes?.length) shouldRescan = true;
      } else if (m.type === 'characterData' &&
                 m.target?.parentElement?.closest?.('div.bubble')) {
        shouldRescan = true;
      } else if (m.type === 'attributes' &&
                 m.target?.closest?.('div.bubble')) {
        shouldRescan = true;
      }
    }

    if (shouldRescan) scanAndAppendChats();
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });

  console.log('👀 Observing for new/changed bubbles under', CONTAINER_SELECTOR);
})();

// 🧩 Export command
window.exportChats = function() {
  const blob = new Blob([JSON.stringify(window.chatsList, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chats.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('📦 chats.json downloaded');
};

