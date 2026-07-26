/* Digital Services — page behaviour. Loaded only by digital-services.html.
 *
 *   1. the backdrop film — the hero only, it scrolls away
 *   2. the page's own dot field below it (canvas)
 *   3. hero pointer parallax
 *   4. the scroll progress rule
 *
 * The revealed text, the discipline accordion, the glass sheen and the enquiry
 * panel are shared with the studio page and live in site.js.
 *
 * Everything degrades: with JavaScript off the text is plain HTML and the field
 * is the CSS gradient and blooms underneath it.
 */
(function(){
  const { reduced } = window.FS;

  /* ---------- 1 · the backdrop film ----------
     11 MB of 1080p is not something to push at every visitor, so the <video>
     ships with no src and gets one only when it is worth it: a wide screen, a
     connection that has not asked us to save data, and motion not suppressed.
     Everyone else keeps the poster, which is also what a JS-less visitor sees. */
  const backdrop = document.querySelector('.backdrop');
  if(backdrop){
    const film = backdrop.querySelector('.backdrop-film');
    const conn = navigator.connection || {};
    const thrifty = conn.saveData === true || /2g/.test(conn.effectiveType || '');
    const roomy = matchMedia('(min-width: 821px)').matches;

    if(film && roomy && !thrifty && !reduced){
      film.addEventListener('canplay', () => backdrop.classList.add('is-playing'), {once:true});
      film.preload = 'auto';
      film.src = film.dataset.src;
      const go = film.play();
      if(go && go.catch) go.catch(() => {});   /* autoplay refused: poster stays */
      /* Nothing should keep decoding 1080p once it cannot be seen — neither a
         hidden tab nor a hero that has been scrolled past. */
      let onScreen = true, visible = true;
      const sync = () => {
        if(onScreen && visible) film.play().catch(() => {});
        else film.pause();
      };
      document.addEventListener('visibilitychange', () => { visible = !document.hidden; sync(); });
      if('IntersectionObserver' in window){
        new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); })
          .observe(backdrop);
      }
    }
  }

  /* ---------- 2 · the page's dot field ----------
     Created here, so a JS-less visitor simply keeps the CSS gradient and blooms
     that the .field and .bloom divs already carry. */
  const field = document.querySelector('.field');
  if(field){
    const c = document.createElement('canvas');
    field.appendChild(c);
    const ctx = c.getContext('2d', { alpha:true });
    let w = 0, h = 0;

    function size(){
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener('resize', size, {passive:true});

    /* p is where the field thinks the pointer is; it eases toward the real one,
       and wanders on its own until there is one (touch, or before first move). */
    const p = { x:innerWidth/2, y:innerHeight*0.45, tx:innerWidth/2, ty:innerHeight*0.45, real:false };
    addEventListener('pointermove', e => { p.tx = e.clientX; p.ty = e.clientY; p.real = true; }, {passive:true});
    addEventListener('pointerdown', e => { p.tx = e.clientX; p.ty = e.clientY; p.real = true; }, {passive:true});

    /* The film's signature is a dot matrix that curves and catches light, so the
       page carries the same thing on canvas below the hero: dots displaced away
       from the pointer, undulating, brighter where the pointer passes. Quiet
       under the hero — the film is doing the work there — and full strength once
       it has scrolled by. */
    const RADIUS = 300;      /* how far the distortion reaches */
    const PUSH   = 44;       /* how hard it pushes at the centre */
    const COLS = 76, ROWS = 44;
    const LEVELS = ['rgba(255,255,255,.075)', 'rgba(255,255,255,.13)',
                    'rgba(255,255,255,.18)', 'rgba(255,255,255,.30)',
                    'rgba(255,255,255,.48)'];
    const buckets = LEVELS.map(() => []);

    function paint(time){
      if(!p.real){
        p.tx = w * (0.5 + 0.26 * Math.cos(time * 0.00021));
        p.ty = h * (0.5 + 0.20 * Math.sin(time * 0.00017));
      }
      p.x += (p.tx - p.x) * 0.075;
      p.y += (p.ty - p.y) * 0.075;

      ctx.clearRect(0, 0, w, h);

      /* fade in as the hero leaves, so the two textures never fight */
      const past = Math.min(1, Math.max(0, (scrollY - h * 0.25) / (h * 0.6)));
      const strength = 0.22 + past * 0.78;

      /* the pointer carries a soft light with it */
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS * 1.8);
      glow.addColorStop(0, 'rgba(255,255,255,' + (0.05 * strength).toFixed(3) + ')');
      glow.addColorStop(0.55, 'rgba(214,220,228,' + (0.016 * strength).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const phase = time * 0.00035 + scrollY * 0.0016;
      const r2 = 2 * RADIUS * RADIUS;
      const gapX = w / (COLS - 1), gapY = h / (ROWS - 1);
      for(const b of buckets) b.length = 0;

      for(let i = 0; i < ROWS; i++){
        const baseY = i * gapY;
        for(let j = 0; j < COLS; j++){
          const x0 = j * gapX;
          /* two crossed waves give the matrix its slow swell */
          const y0 = baseY + Math.sin(x0 * 0.0048 + phase + i * 0.38) * 9
                           + Math.cos(x0 * 0.0016 - phase * 0.6) * 5;
          const dx = x0 - p.x, dy = y0 - p.y;
          const d2 = dx*dx + dy*dy;
          const near = Math.exp(-d2 / r2);
          const push = PUSH * near;
          const d = Math.sqrt(d2) || 1;
          const a = (0.31 + near * 1.45) * strength;
          const level = a < 0.28 ? 0 : a < 0.5 ? 1 : a < 0.8 ? 2 : a < 1.15 ? 3 : 4;
          buckets[level].push(x0 + (dx / d) * push, y0 + (dy / d) * push);
        }
      }

      /* one fillStyle per brightness band rather than per dot */
      for(let l = 0; l < LEVELS.length; l++){
        const pts = buckets[l];
        if(!pts.length) continue;
        ctx.fillStyle = LEVELS[l];
        const size = l > 2 ? 1.7 : 1.2;
        for(let k = 0; k < pts.length; k += 2) ctx.fillRect(pts[k], pts[k+1], size, size);
      }
    }

    if(reduced){
      paint(0);
      addEventListener('resize', () => paint(0), {passive:true});
    } else {
      /* Capped at ~40fps. Every repaint of this canvas invalidates the backdrop
         of every glass pane on screen, so the saving is much larger than the
         canvas work itself, and the drift is far too slow to show the seam. */
      let last = 0;
      FS.onFrame(() => {
        const now = performance.now();
        if(document.hidden || now - last < 25) return;
        if(FS.transitioning) return;              /* leave the frame to the curtain */
        last = now;
        paint(now);
      });
    }
  }

  /* ---------- 3 · hero parallax ----------
     The headline, the statement and the orb drift by different amounts as the
     pointer moves, which gives the hero depth without anything actually moving
     far. Each layer is eased separately; the orb leads because it is furthest
     back. transform is used here and nowhere else on these elements — the word
     reveals animate their own inner spans, and the orb centres with `translate`
     and breathes with `scale`, so none of them collide. */
  const hero = document.querySelector('.dh');
  if(hero && !reduced && matchMedia('(pointer:fine)').matches){
    const layers = [
      { el: document.querySelector('.backdrop-film'), x: 26, y: 18 },
      { el: hero.querySelector('.dh-title'),          x: -16, y: -11 },
      { el: hero.querySelector('.dh-side'),           x: -9,  y: -6 },
    ].filter(l => l.el);
    const aim = { x:0, y:0 }, now = { x:0, y:0 };
    addEventListener('pointermove', e => {
      aim.x = (e.clientX / innerWidth) * 2 - 1;      /* -1 … 1 */
      aim.y = (e.clientY / innerHeight) * 2 - 1;
    }, {passive:true});
    FS.onFrame(() => {
      if(FS.transitioning) return;
      if(Math.abs(aim.x - now.x) < 0.001 && Math.abs(aim.y - now.y) < 0.001) return;
      now.x += (aim.x - now.x) * 0.045;
      now.y += (aim.y - now.y) * 0.045;
      for(const l of layers){
        l.el.style.transform =
          'translate3d(' + (now.x * l.x).toFixed(2) + 'px,' + (now.y * l.y).toFixed(2) + 'px,0)';
      }
    });
  }

  /* ---------- 4 · scroll progress ---------- */
  const progress = document.querySelector('.progress');
  if(progress && !reduced){
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
    };
    addEventListener('scroll', update, {passive:true});
    addEventListener('resize', update, {passive:true});
    update();
  }
})();
