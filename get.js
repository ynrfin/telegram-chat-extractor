// === CONFIG: set this to the parent whose DIRECT children are section.bubbles-date-group
// If you don't know the parent, leave as 'body' and the script will fall back gracefully.
const CONTAINER_SELECTOR = '.bubbles-inner.has-rights.is-chat';

// Keep a global chats array across runs
window.chats = Array.isArray(window.chats) ? window.chats : [];

// Internal: dedupe set based on a stable key
const _seenKeys = new Set(
  window.chats.map(c => `${c.mid}::${c.peer_id}::${c.timestamp}`)
);

// Helper: find the container and the direct date-group sections
function getDateGroups() {
  const container = document.querySelector(CONTAINER_SELECTOR) || document.body;

  // Prefer direct children: :scope > section.bubbles-date-group
  let groups = [];
  try {
    groups = container.querySelectorAll(':scope > section.bubbles-date-group');
  } catch {
    // Some browsers don’t support :scope in console; fall back to all matches
    groups = container.querySelectorAll('section.bubbles-date-group');
  }
  return groups;
}

// Helper: clean up the message DOM before extracting innerHTML
function cleanMessageHTML(messageEl) {
  if (!messageEl) return '';

  const clone = messageEl.cloneNode(true);

  // 1️⃣ Remove <span.clearfix> and <span.time>
  clone.querySelectorAll('span.clearfix, span.time').forEach(span => {
    span.remove();
  });

  // 2️⃣ Strip <a.anchor-hashtag> but keep text content (#tag stays)
  clone.querySelectorAll('a.anchor-hashtag').forEach(a => {
    const text = a.textContent || '';
    a.replaceWith(document.createTextNode(text));
  });

  return (clone.innerHTML || '').trim();
}

// Serialize one .bubble -> chat object
function serializeBubble(bubbleEl) {
  const { mid, peerId, timestamp } = bubbleEl.dataset;

  // bubble-content-wrapper > .bubble-content > .message
  const messageEl = bubbleEl
    .querySelector('.bubble-content-wrapper .bubble-content .message');

  const message = cleanMessageHTML(messageEl);

  return {
    mid: mid ?? null,
    peer_id: peerId ?? null,
    timestamp: timestamp ?? null,
    message
  };
}

// Walk the DOM per your rules and append new chats
function scanAndAppendChats(root = document) {
  const dateGroups = getDateGroups();

  dateGroups.forEach(group => {
    // inside the bubbles-date-group element, look for div with class bubbles-group
    const bubblesGroup = group.querySelector('div.bubbles-group');
    if (!bubblesGroup) return;

    // inside the bubbles-group, search for div with class bubble
    const bubbles = bubblesGroup.querySelectorAll('div.bubble');
    bubbles.forEach(bubble => {
      const chat = serializeBubble(bubble);
      const key = `${chat.mid}::${chat.peer_id}::${chat.timestamp}`;

      if (!_seenKeys.has(key)) {
        _seenKeys.add(key);
        window.chats.push(chat);
      } else {
        // If you want to update existing entries when content changes, enable this:
        // const idx = window.chats.findIndex(c => `${c.mid}::${c.peer_id}::${c.timestamp}` === key);
        // if (idx !== -1) window.chats[idx] = chat;
      }
    });
  });
}

// Initial scan
scanAndAppendChats();
console.log('✅ chats initialized/updated. Count:', window.chats.length);
console.log(window.chats);

// MutationObserver: append when new bubbles appear or content is replaced
(function setupObserver() {
  const container = document.querySelector(CONTAINER_SELECTOR) || document.body;

  const observer = new MutationObserver((mutations) => {
    let shouldRescan = false;

    for (const m of mutations) {
      if (m.type === 'childList') {
        // If new nodes added that are .bubble or contain .bubble
        m.addedNodes?.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches?.('div.bubble') || node.querySelector?.('div.bubble')) {
              shouldRescan = true;
            }
            // If a new date-group section dropped in
            if (node.matches?.('section.bubbles-date-group') || node.querySelector?.('section.bubbles-date-group')) {
              shouldRescan = true;
            }
          }
        });
        // If bubbles got removed and re-added (replacement), a rescan is still fine
        if (m.removedNodes?.length && m.addedNodes?.length) {
          shouldRescan = true;
        }
      } else if (m.type === 'characterData') {
        // Text inside a .message changed (content replaced/edited)
        if (m.target?.parentElement?.closest?.('div.bubble')) {
          shouldRescan = true;
        }
      } else if (m.type === 'attributes') {
        // Attributes of a bubble changed (e.g., data-* updated)
        if (m.target?.closest?.('div.bubble')) {
          shouldRescan = true;
        }
      }
    }

    if (shouldRescan) {
      scanAndAppendChats();
      console.log('🔄 chats updated. Count:', window.chats.length);
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });

  console.log('👀 Observing DOM for new/changed bubbles under', container);
})();

