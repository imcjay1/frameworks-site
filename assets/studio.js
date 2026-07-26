/* Studio — the camera hero. Loaded only by studio.html, after site.js.
 *
 *   1. the looping hero film
 *   2. the headline's rotating second line
 *   3. the camera read-outs: exposure, timecode, focus lock
 *
 * The revealed text, accordion and enquiry panel further down the page are the
 * shared components in site.js.
 */
(function(){
  const { reduced } = window.FS;

  /* ---------- 1 · the film ----------
     Same rule as the other hero film: no src in the markup, and one is only
     attached when it is worth the bytes. Everyone else keeps the poster. */
  const wrap = document.querySelector('.sh-film-wrap');
  if(wrap){
    const film = wrap.querySelector('.sh-film');
    const conn = navigator.connection || {};
    const thrifty = conn.saveData === true || /2g/.test(conn.effectiveType || '');
    if(film && matchMedia('(min-width: 821px)').matches && !thrifty && !reduced){
      film.addEventListener('canplay', () => wrap.classList.add('is-playing'), {once:true});
      film.preload = 'auto';
      film.src = film.dataset.src;
      film.play().catch(() => {});
      /* it loops without pause while on screen, and stops entirely once it is not */
      let onScreen = true, visible = true;
      const sync = () => (onScreen && visible) ? film.play().catch(() => {}) : film.pause();
      document.addEventListener('visibilitychange', () => { visible = !document.hidden; sync(); });
      if('IntersectionObserver' in window){
        new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(wrap);
      }
    }
  }

  /* ---------- 2 · the rotating line ----------
     The <h1> keeps a stable opening clause; only its second line changes, so the
     heading still reads as one sentence to a crawler and to a screen reader.
     Each phrase is pre-split into masked words, then lifted out and in. */
  const rot = document.querySelector('.sh-rot');
  if(rot && !reduced){
    const phrases = [...rot.children];
    if(phrases.length > 1){
      phrases.forEach(phrase => {
        const words = phrase.textContent.trim().split(/\s+/);
        phrase.textContent = '';
        words.forEach((word, i) => {
          const mask = document.createElement('span'); mask.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = word + (i < words.length - 1 ? ' ' : '');
          inner.style.setProperty('--d', (i * 48) + 'ms');
          mask.appendChild(inner); phrase.appendChild(mask);
        });
      });

      /* Reserve the tallest phrase's height, or the lede and buttons below jump
         every time a shorter line comes round. Measured, not guessed, because
         how many lines each phrase takes depends on the viewport. */
      const fit = () => {
        rot.style.minHeight = '';
        const was = phrases.map(p => p.className);
        let tallest = 0;
        phrases.forEach(p => {
          p.classList.add('is-on');
          tallest = Math.max(tallest, p.getBoundingClientRect().height);
          p.className = '';
        });
        phrases.forEach((p, i) => p.className = was[i]);
        rot.style.minHeight = Math.ceil(tallest) + 'px';
      };
      fit();
      addEventListener('resize', fit, {passive:true});

      let at = 0;
      phrases[0].classList.add('is-on');
      setInterval(() => {
        const out = phrases[at];
        at = (at + 1) % phrases.length;
        const next = phrases[at];
        out.classList.add('is-out');
        next.classList.add('is-on');
        /* the outgoing line keeps its slot until the incoming one has arrived,
           so the block never collapses mid-swap */
        setTimeout(() => { out.classList.remove('is-on', 'is-out'); }, 900);
      }, 5000);
    }
  }

  /* ---------- 3 · camera read-outs ----------
     Values step between plausible settings rather than counting smoothly: a
     camera does not interpolate its ISO. */
  const pick = (list, not) => {
    let v = not;
    while(v === not) v = list[(Math.random() * list.length) | 0];
    return v;
  };
  if(!reduced){
    const sets = {
      iso:     ['100', '200', '400', '640', '800'],
      shutter: ['1/60', '1/125', '1/250', '1/400', '1/800'],
      ev:      ['-0.3', '0.0', '+0.3', '+0.7', '+1.0'],
      iris:    ['f/1.4', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6'],
    };
    Object.entries(sets).forEach(([key, list], i) => {
      const el = document.querySelector('[data-tick="' + key + '"]');
      if(!el) return;
      /* offset so the four never change together */
      setTimeout(() => setInterval(() => {
        el.textContent = pick(list, el.textContent);
      }, 2600 + i * 700), i * 900);
    });

    /* timecode at 25fps, the rate the studio shoots at */
    const tc = document.querySelector('[data-timecode]');
    if(tc){
      const started = performance.now();
      const pad = n => String(n).padStart(2, '0');
      let last = 0;
      FS.onFrame(() => {
        const now = performance.now();
        if(now - last < 40 || document.hidden) return;    /* one frame at 25fps */
        last = now;
        const f = Math.floor((now - started) / 40);
        tc.textContent = pad(Math.floor(f / 90000)) + ':' + pad(Math.floor(f / 1500) % 60)
                       + ':' + pad(Math.floor(f / 25) % 60) + ':' + pad(f % 25);
      });
    }

    /* focus hunts, then locks — the one moment of colour on the page */
    const frame = document.querySelector('.focus-frame');
    if(frame){
      const cycle = () => {
        frame.classList.add('is-locked');
        setTimeout(() => frame.classList.remove('is-locked'), 1600);
      };
      setTimeout(() => { cycle(); setInterval(cycle, 6400); }, 2600);
    }
  }
})();
