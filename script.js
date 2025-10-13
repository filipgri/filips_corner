// Tiny helper to show/hide nav on small screens
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
if (navToggle && siteNav){
  const setExpanded = (open) => navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  setExpanded(siteNav.classList.contains('open'));
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    setExpanded(isOpen);
  });
}

// =====================================================================
// Theme laboratory — live theming + CSS variable preview
// =====================================================================
(() => {
  const root = document.documentElement;
  const legacyPatch = document.querySelector('#themePatch, .theme-lab__preview');
  if (legacyPatch){
    legacyPatch.remove();
  }
  const themePicker = document.getElementById('themePicker');
  const fontPicker = document.getElementById('fontPicker');
  const colorInputs = Array.from(document.querySelectorAll('[data-token]'));
  const resetBtn = document.getElementById('themeReset');

  const storageKey = 'filip-theme-lab';
  const defaultThemeKey = 'daylight';
  const defaultFontKey = 'modern';
  const trackedTokens = ['--brand','--brand-soft','--text','--bg','--surface','--surface-alt','--border','--muted','--shadow','--shadow-soft','--shadow-hover','--font-body','--font-heading'];

  const fonts = {
    modern: {
      body: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      heading: '"Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
    },
    tech: {
      body: '"Chivo", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
      heading: '"Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
    },
    humanist: {
      body: '"DM Sans", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
      heading: '"DM Serif Display", "DM Sans", "Inter", serif'
    },
    editorial: {
      body: '"Source Serif 4", "Georgia", "Times New Roman", serif',
      heading: '"DM Sans", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
    }
  };

  const themes = {
    daylight: {
      values: {
        '--brand': '#0b27f4',
        '--text': '#202124',
        '--bg': '#faf9f5',
        '--surface': '#ffffff',
        '--surface-alt': '#f3f4f6',
        '--border': '#e0e0e0',
        '--muted': '#5f6368',
        '--shadow': '0 4px 12px rgba(0,0,0,.08)',
        '--shadow-soft': '0 2px 6px rgba(0,0,0,.06)',
        '--shadow-hover': '0 8px 20px rgba(0,0,0,.12)'
      },
      fontKey: 'modern'
    },
    oceanMist: {
      values: {
        '--brand': '#0f7b9d',
        '--text': '#102a33',
        '--bg': '#f3f7f8',
        '--surface': '#ffffff',
        '--surface-alt': '#e6eef1',
        '--border': '#c9d8de',
        '--muted': '#3f5e68',
        '--shadow': '0 6px 20px rgba(15, 123, 157, 0.16)',
        '--shadow-soft': '0 4px 12px rgba(15, 123, 157, 0.12)',
        '--shadow-hover': '0 10px 24px rgba(15, 123, 157, 0.22)'
      },
      fontKey: 'modern'
    },
    emberSlate: {
      values: {
        '--brand': '#c75000',
        '--text': '#1e1f20',
        '--bg': '#f5f5f5',
        '--surface': '#ffffff',
        '--surface-alt': '#ebe8e4',
        '--border': '#d8d2cc',
        '--muted': '#55504a',
        '--shadow': '0 10px 26px rgba(30, 31, 32, 0.15)',
        '--shadow-soft': '0 4px 14px rgba(30, 31, 32, 0.12)',
        '--shadow-hover': '0 14px 30px rgba(30, 31, 32, 0.22)'
      },
      fontKey: 'humanist'
    },
    moonlight: {
      values: {
        '--brand': '#ffd166',
        '--text': '#f8fbff',
        '--bg': '#041322',
        '--surface': '#0b1f33',
        '--surface-alt': '#12304a',
        '--border': '#214d70',
        '--muted': '#cad9e4',
        '--shadow': '0 18px 42px rgba(4, 19, 34, 0.6)',
        '--shadow-soft': '0 10px 26px rgba(4, 19, 34, 0.45)',
        '--shadow-hover': '0 22px 48px rgba(4, 19, 34, 0.68)'
      },
      fontKey: 'tech'
    }
  };

  let currentThemeKey = defaultThemeKey;
  let currentFontKey = defaultFontKey;
  let suppressSave = false;

  const hexToRgba = (hex, alpha = 0.28) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) return trimmed;
    const clean = trimmed.replace('#','');
    const parts = clean.length === 3 ? clean.split('').map(ch => ch + ch) : clean.match(/.{2}/g);
    if (!parts) return `rgba(0,0,0,${alpha})`;
    const [r,g,b] = parts.map(v => parseInt(v, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const normalizeColorForInput = (value = '') => {
    const trimmed = value.trim();
    if (!trimmed) return '#000000';
    if (trimmed.startsWith('#')){
      if (trimmed.length === 4){
        return '#' + trimmed.slice(1).split('').map(ch => ch + ch).join('');
      }
      return trimmed;
    }
    const nums = trimmed.match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 3) return '#000000';
    const [r,g,b] = nums.map(Number);
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const setToken = (token, value) => {
    if (!token) return;
    root.style.setProperty(token, value);
    if (token === '--brand'){
      root.style.setProperty('--brand-soft', hexToRgba(value, 0.28));
    }
  };

  const updateInputsFromStyles = () => {
    if (!colorInputs.length) return;
    const computed = getComputedStyle(root);
    colorInputs.forEach(input => {
      const token = input.dataset.token;
      const raw = root.style.getPropertyValue(token) || computed.getPropertyValue(token);
      if (raw) input.value = normalizeColorForInput(raw);
    });
  };

  const saveState = () => {
    if (suppressSave || !('localStorage' in window)) return;
    const payload = {
      themeKey: currentThemeKey,
      fontKey: currentFontKey,
      tokens: {}
    };
    trackedTokens.forEach(token => {
      const val = root.style.getPropertyValue(token).trim();
      if (val) payload.tokens[token] = val;
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      /* ignore quota errors */
    }
  };

  const applyFonts = (key, options = {}) => {
    const pair = fonts[key] || fonts[defaultFontKey];
    setToken('--font-body', pair.body);
    setToken('--font-heading', pair.heading || pair.body);
    currentFontKey = key;

    if (!options.fromTheme && currentThemeKey !== 'custom' && themes[currentThemeKey]?.fontKey !== key){
      currentThemeKey = 'custom';
      if (themePicker) themePicker.value = 'custom';
    }

    if (fontPicker && !options.skipPickerUpdate){
      fontPicker.value = key;
    }

    if (!options.silent) saveState();
  };

  const applyTheme = (key, options = {}) => {
    const theme = themes[key] || themes[defaultThemeKey];
    Object.entries(theme.values).forEach(([token, value]) => setToken(token, value));
    currentThemeKey = key;

    if (!options.skipFonts && theme.fontKey){
      applyFonts(theme.fontKey, { skipPickerUpdate: false, silent: true, fromTheme: true });
    }

    if (themePicker && !options.skipPickerUpdate){
      themePicker.value = key;
    }

    updateInputsFromStyles();
    if (!options.silent) saveState();
  };

  const loadState = () => {
    if (!('localStorage' in window)){
      applyTheme(defaultThemeKey, { silent: true });
      applyFonts(defaultFontKey, { silent: true, fromTheme: true });
      updateInputsFromStyles();
      return;
    }

    let stored;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (err) {
      stored = null;
    }

    if (!stored){
      suppressSave = true;
      applyTheme(defaultThemeKey, { silent: true });
      applyFonts(defaultFontKey, { silent: true, fromTheme: true });
      suppressSave = false;
      updateInputsFromStyles();
      saveState();
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (err) {
      parsed = null;
    }

    suppressSave = true;

    if (parsed?.themeKey && themes[parsed.themeKey]){
      applyTheme(parsed.themeKey, { silent: true });
    } else {
      applyTheme(defaultThemeKey, { silent: true });
    }

    if (parsed?.fontKey && fonts[parsed.fontKey]){
      applyFonts(parsed.fontKey, { silent: true, fromTheme: true });
    }

    if (parsed?.tokens){
      Object.entries(parsed.tokens).forEach(([token, value]) => setToken(token, value));
    }

    currentThemeKey = parsed?.themeKey || currentThemeKey;
    currentFontKey = parsed?.fontKey || currentFontKey;

    suppressSave = false;

    if (themePicker) themePicker.value = currentThemeKey;
    if (fontPicker) fontPicker.value = currentFontKey;

    updateInputsFromStyles();
    saveState();
  };

  if (themePicker || colorInputs.length || fontPicker){
    loadState();

    if (themePicker){
      themePicker.addEventListener('change', (event) => {
        const key = event.target.value;
        if (key === 'custom'){
          currentThemeKey = 'custom';
          saveState();
          return;
        }
        applyTheme(key);
      });
    }

    if (fontPicker){
      fontPicker.addEventListener('change', (event) => {
        applyFonts(event.target.value);
      });
    }

    if (colorInputs.length){
      colorInputs.forEach(input => {
        input.addEventListener('input', (event) => {
          const token = event.currentTarget.dataset.token;
          const value = event.currentTarget.value;
          setToken(token, value);
          currentThemeKey = 'custom';
          if (themePicker) themePicker.value = 'custom';
          saveState();
        });
      });
    }

    if (resetBtn){
      resetBtn.addEventListener('click', () => {
        applyTheme(defaultThemeKey);
      });
    }
  } else {
    // pages without controls still honour persisted tokens
    loadState();
  }
})();


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


// ===== Read-along with play/pause (punctuation-weighted timings)
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
   // Prefer explicit target; else look near the button (project or hero)
    const explicit = btn.dataset.target ? document.querySelector(btn.dataset.target) : null;
    const scoped = btn.closest('.project')?.querySelector('.readable')
               || btn.closest('.hero')?.querySelector('.readable');
    const text = explicit || scoped;
    if (!text) { console.warn('No .readable found for speaker'); return; }
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

        // Highlight current page in side-nav
(() => {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.side-nav a').forEach(a => {
    const target = a.getAttribute('href');
    if (target === here) a.classList.add('is-current');
  });
})();


        // Different button: stop previous, clear, and start new
        pause();
        clearHL(activeText);
        await startFor(btn);
      });
    });
  });
})();