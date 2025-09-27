// Tiny helper to show/hide nav on small screens
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('siteNav').classList.toggle('open');
});

// PROJECT-LEVEL toggles
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.project-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.project');
      const isOpen = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.setAttribute('aria-label', isOpen ? 'Hide details' : 'Show details');
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.project-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.project');
      const open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
});

// ===== Read-along without real timings (weighted by punctuation) =====
(() => {
  let player = new Audio();
  let job = null;

  function wrapWords(container){
    if (container.dataset.wrapped === "1") return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    let idx = 0;
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      // split words and keep spaces/punct tokens separate
      const parts = node.nodeValue.match(/[\w’'-]+|[^\s\w]|[\s]+/g) || [node.nodeValue];
      parts.forEach(tok => {
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); }
        else {
          const span = document.createElement('span');
          span.textContent = tok;
          span.className = 'w';
          span.dataset.widx = idx++;
          // mark punctuation for weighting
          if (/^[,;:–—-]$/.test(tok)) span.dataset.punct = 'comma';
          if (/^[.?!]$/.test(tok)) span.dataset.punct = 'stop';
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    container.dataset.wrapped = "1";
  }

  // Build synthetic timings: words=1x, commas=0.5x, stops=1.5x
  function buildTimings(container, duration){
    const words = Array.from(container.querySelectorAll('.w'));
    if (words.length === 0) return [];
    let totalWeight = 0;
    const weights = words.map(w => {
      if (w.dataset.punct === 'comma') return 0.5;
      if (w.dataset.punct === 'stop')  return 1.5;
      return 1; // regular word
    }).map(w => (totalWeight += w, w));

    // normalize
    const norm = words.map((_, i) => weights[i] / totalWeight);
    let t = 0;
    return words.map((_, i) => {
      const dur = norm[i] * duration;
      const start = t; const end = t + dur; t = end;
      return { start, end, w: i };
    });
  }

  function runHighlight(container, cues){
    const words = container.querySelectorAll('.w');
    const clear = () => words.forEach(w => w.classList.remove('hl'));
    function setHL(i){ clear(); const el = words[i]; if (el) el.classList.add('hl'); }
    cancelAnimationFrame(job?.raf); job = null;
    const tick = () => {
      const t = player.currentTime;
      // find cue where start <= t < end (linear is fine here)
      const c = cues.find(c => t >= c.start && t < c.end);
      if (c) setHL(c.w);
      if (!player.paused && !player.ended) job = { raf: requestAnimationFrame(tick) };
    };
    job = { raf: requestAnimationFrame(tick) };
    player.addEventListener('ended', clear, { once:true });
  }

  async function handleSpeak(btn){
    // stop any current playback
    player.pause();
    const card = btn.closest('.project');
    const text = card.querySelector('.readable');
    const src = btn.dataset.audio;

    wrapWords(text);

    player.src = src;
    await player.load?.();
    // wait for duration
    await new Promise(r => player.addEventListener('loadedmetadata', r, { once:true }));

    const cues = buildTimings(text, player.duration || 30);
    runHighlight(text, cues);
    player.currentTime = 0;
    player.play().catch(()=>{ /* user gesture required */ });
  }

  // Hook up speakers
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.speak-btn').forEach(btn => {
      btn.addEventListener('click', () => handleSpeak(btn));
    });
  });
})();

