/* Digital Services — page behaviour. Loaded only by digital-services.html.
 *
 *   1. the reactive field behind the page (canvas)
 *   2. word-by-word heading reveals and staggered fades
 *   3. monospace labels that decode into place
 *   4. the services accordion
 *   5. the scroll progress rule
 *
 * Everything degrades: with JavaScript off the text is plain HTML, the field is
 * the CSS gradient underneath it, and the service panels are opened by a
 * <noscript> rule in the page.
 */
(function(){
  const { reduced, sm } = window.FS;

  /* ---------- 1 · the reactive field ----------
     Scan lines that bend away from the pointer. The canvas is created here, so
     a JS-less visitor simply keeps the gradient the .field div already carries. */
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

    const RADIUS = 270;      /* how far the distortion reaches */
    const PUSH   = 52;       /* how hard it pushes at the centre */
    const ROWS   = 30, COLS = 56, VLINES = 9;

    function paint(time){
      if(!p.real){
        p.tx = w * (0.5 + 0.26 * Math.cos(time * 0.00021));
        p.ty = h * (0.5 + 0.20 * Math.sin(time * 0.00017));
      }
      p.x += (p.tx - p.x) * 0.075;
      p.y += (p.ty - p.y) * 0.075;

      ctx.clearRect(0, 0, w, h);

      /* the pointer carries a soft light with it */
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS * 1.7);
      glow.addColorStop(0, 'rgba(227,199,149,0.085)');
      glow.addColorStop(0.55, 'rgba(195,213,230,0.025)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      /* scroll winds the ambient wave forward, so the field moves with the page */
      const phase = time * 0.00042 + scrollY * 0.0017;
      const r2 = 2 * RADIUS * RADIUS;
      ctx.lineWidth = 1;

      const gapY = h / (ROWS - 1), gapX = w / (COLS - 1);
      for(let i = 0; i < ROWS; i++){
        const baseY = i * gapY;
        const near = Math.exp(-Math.pow((baseY - p.y) / 230, 2));
        ctx.strokeStyle = 'rgba(244,241,236,' + (0.042 + near * 0.115).toFixed(4) + ')';
        ctx.beginPath();
        for(let j = 0; j < COLS; j++){
          const x0 = j * gapX;
          const y0 = baseY + Math.sin(x0 * 0.0055 + phase + i * 0.5) * 7;
          const dx = x0 - p.x, dy = y0 - p.y;
          const d2 = dx*dx + dy*dy;
          const push = PUSH * Math.exp(-d2 / r2);
          const d = Math.sqrt(d2) || 1;
          const x = x0 + (dx / d) * push;
          const y = y0 + (dy / d) * push;
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }

      /* a few verticals give the field a sense of depth rather than stripes */
      const gapV = w / (VLINES - 1);
      ctx.strokeStyle = 'rgba(244,241,236,0.035)';
      for(let i = 0; i < VLINES; i++){
        const baseX = i * gapV;
        ctx.beginPath();
        for(let j = 0; j < ROWS; j++){
          const y0 = j * gapY;
          const x0 = baseX + Math.cos(y0 * 0.005 + phase * 0.8 + i * 0.6) * 5;
          const dx = x0 - p.x, dy = y0 - p.y;
          const d2 = dx*dx + dy*dy;
          const push = PUSH * 0.8 * Math.exp(-d2 / r2);
          const d = Math.sqrt(d2) || 1;
          const x = x0 + (dx / d) * push, y = y0 + (dy / d) * push;
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }

    if(reduced){
      paint(0);
      addEventListener('resize', () => paint(0), {passive:true});
    } else {
      FS.onFrame(() => { if(!document.hidden) paint(performance.now()); });
    }
  }

  /* ---------- 2 · text ----------
     Headings are split into words, each masked and lifted into place. The walk
     preserves inline markup (<em>, <br>) instead of flattening to text. */
  function splitWords(el){
    const out = [];
    const walk = node => {
      if(node.nodeType === 3){
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if(!part) return;
          if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          const mask = document.createElement('span'); mask.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part;
          mask.appendChild(inner); frag.appendChild(mask);
          out.push(inner);
        });
        node.parentNode.replaceChild(frag, node);
      } else if(node.nodeType === 1 && !node.classList.contains('w')){
        [...node.childNodes].forEach(walk);
      }
    };
    [...el.childNodes].forEach(walk);
    return out;
  }

  document.querySelectorAll('[data-split]').forEach(el => {
    const step = +el.dataset.step || 55;
    splitWords(el).forEach((word, i) => word.style.setProperty('--d', (i * step) + 'ms'));
  });

  document.querySelectorAll('[data-fade]').forEach(el => {
    if(el.dataset.fade) el.style.setProperty('--d', el.dataset.fade + 'ms');
  });

  /* ---------- 3 · decoding labels ---------- */
  const GLYPHS = '0123456789#$%&/<>[]*+=?!';
  function decode(el){
    const text = el.dataset.text || el.textContent;
    el.dataset.text = text;
    if(reduced){ el.textContent = text; return; }
    const started = performance.now();
    const DURATION = 620;
    const tick = () => {
      const t = Math.min(1, (performance.now() - started) / DURATION);
      const shown = sm(0, 1, t) * text.length;
      let s = '';
      for(let i = 0; i < text.length; i++){
        s += (text[i] === ' ' || i < shown)
          ? text[i]
          : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = s;
      if(t < 1) requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------- reveal on scroll ---------- */
  const targets = document.querySelectorAll('[data-split], [data-fade], [data-decode]');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(!e.isIntersecting) return;
        e.target.classList.add('in');
        if(e.target.hasAttribute('data-decode')) decode(e.target);
        io.unobserve(e.target);
      });
    }, {threshold:0.15, rootMargin:'0px 0px -8% 0px'});
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('in'));
  }

  /* ---------- 4 · services accordion ----------
     One open at a time. Collapsed panels are made inert so their links and text
     stay out of the tab order and out of the accessibility tree. */
  const services = [...document.querySelectorAll('.svc')];
  services.forEach((svc, index) => {
    const head  = svc.querySelector('.svc-head');
    const panel = svc.querySelector('.svc-panel');
    const inner = panel.firstElementChild;
    svc.querySelectorAll('.svc-tags li').forEach((tag, i) =>
      tag.style.setProperty('--d', (140 + i * 55) + 'ms'));

    const set = open => {
      svc.toggleAttribute('data-open', open);
      head.setAttribute('aria-expanded', String(open));
      if('inert' in inner) inner.inert = !open;
      else inner.setAttribute('aria-hidden', String(!open));
    };
    set(index === 0);        /* the first is open, so the pattern is obvious */

    head.addEventListener('click', () => {
      const open = !svc.hasAttribute('data-open');
      services.forEach(other => { if(other !== svc) other.dispatchEvent(new CustomEvent('fs:close')); });
      set(open);
    });
    svc.addEventListener('fs:close', () => set(false));
  });

  /* ---------- 5 · scroll progress ---------- */
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
