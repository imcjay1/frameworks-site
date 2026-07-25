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
      glow.addColorStop(0, 'rgba(255,255,255,0.075)');
      glow.addColorStop(0.55, 'rgba(214,220,228,0.022)');
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

  /* ---------- 5 · glass ----------
     The specular highlight on each pane tracks the pointer. Coordinates are
     written as percentages into custom properties, so the gradient itself is
     declared in CSS and nothing here touches layout. */
  const panes = document.querySelectorAll('.pillar, .svc, .method-step');
  if(!reduced && matchMedia('(pointer:fine)').matches){
    panes.forEach(pane => {
      pane.addEventListener('pointermove', e => {
        const r = pane.getBoundingClientRect();
        pane.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        pane.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      }, {passive:true});
    });
  }

  /* ---------- hero parallax ----------
     The headline, the statement and the orb drift by different amounts as the
     pointer moves, which gives the hero depth without anything actually moving
     far. Each layer is eased separately; the orb leads because it is furthest
     back. transform is used here and nowhere else on these elements — the word
     reveals animate their own inner spans, and the orb centres with `translate`
     and breathes with `scale`, so none of them collide. */
  const hero = document.querySelector('.dh');
  if(hero && !reduced && matchMedia('(pointer:fine)').matches){
    const layers = [
      { el: hero.querySelector('.orb'),      x: 30, y: 22 },
      { el: hero.querySelector('.dh-title'), x: -16, y: -11 },
      { el: hero.querySelector('.dh-side'),  x: -9,  y: -6 },
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

  /* the aurora lags the scroll slightly, so the glass has moving light in it */
  const aurora = document.querySelector('.aurora');
  if(aurora && !reduced){
    let current = 0, target = 0;
    addEventListener('scroll', () => { target = scrollY * -0.06; }, {passive:true});
    FS.onFrame(() => {
      if(Math.abs(target - current) < 0.05) return;
      current += (target - current) * 0.06;
      aurora.style.transform = 'translate3d(0,' + current.toFixed(2) + 'px,0)';
    });
  }

  /* ---------- 6 · the conversion panel ----------
     Two paths in one panel: an enquiry form and a call request. Both post to
     /api/contact natively, so they still work with JavaScript off; everything
     below is enhancement — tab switching, the date picker, inline validation
     and the in-place success state. */
  const panel = document.querySelector('.panel');
  if(panel){
    const tabs  = [...panel.querySelectorAll('.tab')];
    const panes = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
    const ink   = panel.querySelector('.tab-ink');
    const done  = panel.querySelector('.panel-done');

    /* --- tabs --- */
    const moveInk = tab => {
      if(!ink) return;
      const t = tab.getBoundingClientRect(), p = panel.querySelector('.panel-tabs').getBoundingClientRect();
      ink.style.width = t.width + 'px';
      ink.style.transform = 'translateX(' + (t.left - p.left - 34) + 'px)';
    };
    const select = index => {
      tabs.forEach((t, i) => {
        const on = i === index;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panes[i].hidden = !on;
      });
      moveInk(tabs[index]);
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if(!dir) return;
        e.preventDefault();
        const next = (i + dir + tabs.length) % tabs.length;
        select(next); tabs[next].focus();
      });
    });
    requestAnimationFrame(() => moveInk(tabs[0]));
    addEventListener('resize', () => {
      const active = tabs.find(t => t.getAttribute('aria-selected') === 'true');
      if(active) moveInk(active);
    }, {passive:true});

    /* Without JavaScript the form posts for real and comes back here with a
       flag; show the same success panel so both paths end the same way. */
    const flag = new URLSearchParams(location.search);
    if(flag.get('sent')){
      const isCall = flag.get('sent') === 'call';
      done.querySelector('[data-done-title]').textContent = isCall ? 'Time requested.' : 'Enquiry received.';
      done.querySelector('[data-done-body]').textContent = isCall
        ? 'We will confirm your call by email within one working day. Nothing is locked in until we do.'
        : 'Thank you — the team will reply within one working day, from the people who would do the work.';
      panel.querySelector('.panel-tabs').hidden = true;
      panes.forEach(p => { if(p) p.hidden = true; });
      done.hidden = false;
    } else if(flag.get('error')){
      const banner = panes[0].querySelector('.form-error');
      banner.textContent = flag.get('error');
      banner.hidden = false;
    }

    /* --- date picker --- */
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const cal = panel.querySelector('[data-calendar]');
    if(cal){
      const grid  = cal.querySelector('[data-cal-grid]');
      const label = cal.querySelector('[data-cal-month]');
      const value = panel.querySelector('[data-cal-value]');
      const prev  = cal.querySelector('[data-cal="prev"]');
      const next  = cal.querySelector('[data-cal="next"]');
      const today = new Date(); today.setHours(0,0,0,0);
      const limit = new Date(today); limit.setDate(limit.getDate() + 90);
      let view = new Date(today.getFullYear(), today.getMonth(), 1);
      let picked = null;

      const iso = d => d.getFullYear() + '-' +
        String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      const pretty = d => d.toLocaleDateString('en-GB',
        { weekday:'long', day:'numeric', month:'long', year:'numeric' });

      function render(){
        grid.textContent = '';
        label.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
        const first = new Date(view.getFullYear(), view.getMonth(), 1);
        const lead = (first.getDay() + 6) % 7;                 /* weeks start Monday */
        const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        for(let i = 0; i < lead; i++){
          const blank = document.createElement('span');
          blank.className = 'cal-day is-empty';
          grid.appendChild(blank);
        }
        for(let d = 1; d <= days; d++){
          const date = new Date(view.getFullYear(), view.getMonth(), d);
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'cal-day';
          b.textContent = d;
          b.disabled = date <= today || date > limit || weekend;
          b.setAttribute('aria-pressed', String(!!picked && iso(picked) === iso(date)));
          b.setAttribute('aria-label', pretty(date));
          b.addEventListener('click', () => {
            picked = date;
            value.value = iso(date);
            clearError(cal.closest('form').querySelector('[data-err-for="slot"]'));
            render();
          });
          grid.appendChild(b);
        }
        prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
        next.disabled = view >= new Date(limit.getFullYear(), limit.getMonth(), 1);
      }
      prev.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); render(); });
      next.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); render(); });
      render();
    }

    /* --- time slots --- */
    const slotWrap = panel.querySelector('[data-slots]');
    if(slotWrap){
      const slotValue = panel.querySelector('[data-slot-value]');
      slotWrap.querySelectorAll('.slot').forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => {
          slotWrap.querySelectorAll('.slot').forEach(o => o.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', 'true');
          slotValue.value = btn.dataset.slot;
        });
      });
    }

    /* --- validation --- */
    const showError = (node, msg) => {
      if(!node) return;
      node.textContent = msg;
      node.classList.add('show');
    };
    const clearError = node => { if(node){ node.textContent = ''; node.classList.remove('show'); } };

    function validate(form){
      let firstBad = null;
      form.querySelectorAll('.f.invalid, .invalid').forEach(el => el.classList.remove('invalid'));
      form.querySelectorAll('.err').forEach(clearError);

      form.querySelectorAll('input[required], textarea[required]').forEach(input => {
        const field = input.closest('.f') || input.closest('.consent');
        const err = form.querySelector('[data-err-for="' + (input.id || 'consent') + '"]');
        let msg = '';
        if(input.type === 'checkbox' && !input.checked) msg = 'Please tick this to continue.';
        else if(input.type !== 'checkbox' && !input.value.trim()) msg = 'This one is needed.';
        else if(input.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim()))
          msg = 'That email address does not look right.';
        if(!msg) return;
        showError(err, msg);
        if(field) field.classList.add('invalid');
        if(!firstBad) firstBad = input;
      });

      if(form.id === 'pane-call'){
        const date = form.querySelector('[data-cal-value]').value;
        const time = form.querySelector('[data-slot-value]').value;
        if(!date || !time){
          showError(form.querySelector('[data-err-for="slot"]'),
                    !date ? 'Choose a date above.' : 'Choose a time above.');
          (date ? form.querySelector('.slots') : form.querySelector('.cal'))?.classList.add('invalid');
          if(!firstBad) firstBad = form.querySelector(date ? '.slot' : '.cal-day:not(:disabled)');
        }
      }
      return firstBad;
    }

    /* --- submit --- */
    panes.forEach(form => {
      if(!form || form.tagName !== 'FORM') return;
      const banner = form.querySelector('.form-error');
      const button = form.querySelector('.submit');
      const label  = button.querySelector('.submit-label');

      /* clear a field's error as soon as the visitor fixes it */
      form.addEventListener('input', e => {
        const field = e.target.closest('.f') || e.target.closest('.consent');
        if(field) field.classList.remove('invalid');
        clearError(form.querySelector('[data-err-for="' + (e.target.id || 'consent') + '"]'));
      });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        banner.hidden = true;

        const bad = validate(form);
        if(bad){
          banner.textContent = 'Just a couple of details missing — they are marked below.';
          banner.hidden = false;
          bad.scrollIntoView({block:'center', behavior: reduced ? 'auto' : 'smooth'});
          bad.focus({preventScroll:true});
          return;
        }

        const original = label.textContent;
        button.disabled = true; label.textContent = 'Sending';

        try{
          const data = new FormData(form);
          const payload = {};
          for(const [k, v] of data.entries()){
            if(k === 'services') (payload.services ||= []).push(v);
            else payload[k] = v;
          }
          const r = await fetch(form.action, {
            method: 'POST',
            headers: {'Content-Type':'application/json', 'Accept':'application/json'},
            body: JSON.stringify(payload),
          });
          const out = await r.json().catch(() => ({}));
          if(!r.ok || !out.ok) throw new Error(out.message || '');

          const isCall = form.id === 'pane-call';
          done.querySelector('[data-done-title]').textContent =
            isCall ? 'Time requested.' : 'Enquiry received.';
          done.querySelector('[data-done-body]').textContent = isCall
            ? 'We will confirm your call by email within one working day. Nothing is locked in until we do.'
            : 'Thank you — the team will reply within one working day, from the people who would do the work.';
          panel.querySelector('.panel-tabs').hidden = true;
          panes.forEach(p => { if(p) p.hidden = true; });
          done.hidden = false;
          done.querySelector('h3').setAttribute('tabindex', '-1');
          done.querySelector('h3').focus({preventScroll:true});
        } catch(err){
          banner.textContent = err.message ||
            'That did not send. Please try again, or email cameron@frameworksstudios.com directly.';
          banner.hidden = false;
        } finally {
          button.disabled = false; label.textContent = original;
        }
      });
    });
  }

  /* ---------- 7 · scroll progress ---------- */
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
