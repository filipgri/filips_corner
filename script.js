// Tiny helper to show/hide nav on small screens
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('siteNav').classList.toggle('open');
});

// PROJECT-LEVEL toggles

// Project expand/collapse (accordion)

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.project-toggle');
    if (!btn) return;
    const card = btn.closest('.project');

    // OPTIONAL: accordion behavior — close other open cards
    document.querySelectorAll('.project.open').forEach(p => {
      if (p !== card) {
        p.classList.remove('open');
        const b = p.querySelector('.project-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle the clicked card
    const nowOpen = !card.classList.contains('open');
    card.classList.toggle('open', nowOpen);
    btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    btn.setAttribute('aria-label', nowOpen ? 'Hide details' : 'Show details');
  });
});


// ===== Read-along with play/pause (punctuation-weighted timings) =====
(() => {
  let player = new Audio();
  let rafId = 0;
  let activeBtn = null;
  let activeText = null;
  let activeCues = null;

  function wrapWords(container){
    if (container?.dataset.wrapped === "1") return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    let idx = 0;
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      const parts = node.nodeValue.match(/[\w’'-]+|[^\s\w]|[\s]+/g) || [node.nodeValue];
      parts.forEach(tok => {
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); }
        else {
          const span = document.createElement('span');
          span.textContent = tok;
          span.className = 'w';
          span.dataset.widx = idx++;
          if (/^[,;:–—-]$/.test(tok)) span.dataset.punct = 'comma';
          if (/^[.?!]$/.test(tok))  span.dataset.punct = 'stop';
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    container.dataset.wrapped = "1";
  }

  function buildTimings(container, duration){
    const words = Array.from(container.querySelectorAll('.w'));
    if (!words.length) return [];
    let total = 0;
    const weights = words.map(w => {
      if (w.dataset.punct === 'comma') return 0.5;
      if (w.dataset.punct === 'stop')  return 1.5;
      return 1;
    });
    total = weights.reduce((a,b)=>a+b,0);
    let t = 0;
    return words.map((_, i) => {
      const dur = (weights[i] / total) * (duration || 30);
      const start = t; const end = t + dur; t = end;
      return { start, end, w: i };
    });
  }

  function clearHL(container){
    if (!container) return;
    container.querySelectorAll('.w.hl').forEach(w => w.classList.remove('hl'));
  }

  function runHighlight(container, cues){
    const words = container.querySelectorAll('.w');
    cancelAnimationFrame(rafId);
    const tick = () => {
      const t = player.currentTime;
      const c = cues.find(c => t >= c.start && t < c.end);
      if (c){
        words.forEach(w => w.classList.remove('hl'));
        const el = words[c.w];
        if (el) el.classList.add('hl');
      }
      if (!player.paused && !player.ended) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    player.addEventListener('ended', () => {
      clearHL(container);
      if (activeBtn){
        activeBtn.classList.remove('playing');
        activeBtn.setAttribute('aria-pressed','false');
        const ic = activeBtn.querySelector('.icon'); if (ic) ic.textContent = '🔊';
      }
    }, { once: true });
  }

  async function startFor(btn){
    const card = btn.closest('.project');
    const text = card.querySelector('.readable');
    const src  = btn.dataset.audio;

    activeBtn = btn; activeText = text;

    wrapWords(text);
    player.src = src;
    await player.load?.();
    await new Promise(res => player.addEventListener('loadedmetadata', res, { once:true }));
    activeCues = buildTimings(text, player.duration);

    player.currentTime = 0;
    runHighlight(text, activeCues);
    await player.play().catch(()=>{});
    btn.classList.add('playing');
    btn.setAttribute('aria-pressed','true');
    const ic = btn.querySelector('.icon'); if (ic) ic.textContent = '⏸';
  }

  function pause(){
    player.pause();
    if (activeBtn){
      activeBtn.classList.remove('playing');
      activeBtn.setAttribute('aria-pressed','false');
      const ic = activeBtn.querySelector('.icon'); if (ic) ic.textContent = '🔊';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.speak-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        // Same button: toggle
        if (activeBtn === btn){
          if (player.paused){
            btn.classList.add('playing');
            btn.setAttribute('aria-pressed','true');
            const ic = btn.querySelector('.icon'); if (ic) ic.textContent = '⏸';
            runHighlight(activeText, activeCues); // resume RAF
            player.play();
          } else {
            pause();                                // pause
          }
          return;
        }

        // Different button: stop previous, clear, and start new
        pause();
        clearHL(activeText);
        await startFor(btn);
      });
    });
  });
})();