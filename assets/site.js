/* Frameworks Studios — shared behaviour. Loaded on every page.
 *
 * Owns the single requestAnimationFrame loop. Page-specific modules (home.js)
 * register work with FS.onFrame() rather than starting a loop of their own.
 */
(function(){
  const reduced     = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const sm = (e0,e1,x)=>{ const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0))); return t*t*(3-2*t); };

  const hooks = [];
  window.FS = { onFrame(fn){ hooks.push(fn); }, reduced, finePointer, sm, transitioning:false };

  const menuOpen = () => document.body.classList.contains('menu-open');

  function frame(){
    /* Registered hooks run FIRST. The scrub hero reads scroll position here, and
       the smooth scroller writes it below — reverse the order and the film lags
       the page by a frame. */
    for(let i=0;i<hooks.length;i++) hooks[i]();

    /* smooth delayed scroll — the page eases toward the wheel target */
    if(smooth.on && !menuOpen()){
      smooth.cur += (smooth.target - smooth.cur) * 0.07;
      if(Math.abs(smooth.target - smooth.cur) > 0.5){ scrollTo(0, smooth.cur); }
    }

    /* cursor: dot snaps, ring trails behind */
    if(cursor.on){
      cursor.dot.style.transform = 'translate(' + (cursor.mx - 3) + 'px,' + (cursor.my - 3) + 'px)';
      cursor.rx += (cursor.mx - cursor.rx) * 0.14;
      cursor.ry += (cursor.my - cursor.ry) * 0.14;
      cursor.ring.style.transform = 'translate(' + (cursor.rx - 18) + 'px,' + (cursor.ry - 18) + 'px) scale(' + cursor.scale + ')';
    }

    /* sector preview trails the cursor, tilts with motion, recedes when idle */
    if(pv.active){
      pv.cx += (pv.x - pv.cx) * 0.16;
      pv.cy += (pv.y - pv.cy) * 0.16;
      pv.o  += ((pv.on ? 1 : 0) - pv.o) * 0.14;
      const tiltT = Math.max(-8, Math.min(8, pv.vx * 0.45));
      pv.vx *= 0.82;
      pv.tilt += (tiltT - pv.tilt) * 0.12;
      pv.el.style.opacity = pv.o;
      pv.el.style.transform =
        'translate(' + pv.cx + 'px,' + pv.cy + 'px) ' +
        'scale(' + (0.88 + pv.o * 0.12) + ') rotate(' + pv.tilt + 'deg)';
    }

    requestAnimationFrame(frame);
  }

  /* ---------- smooth delayed scroll (desktop wheel only) ---------- */
  const smooth = { on:false, target:scrollY, cur:scrollY };
  if(!reduced && finePointer){
    smooth.on = true;
    const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
    addEventListener('wheel', e => {
      if(menuOpen()) return;                  /* let the mobile overlay scroll itself */
      e.preventDefault();
      const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      smooth.target = Math.max(0, Math.min(maxScroll(), smooth.target + d));
    }, {passive:false});
    /* resync if the user scrolls another way (scrollbar drag, keyboard) */
    addEventListener('scroll', () => {
      if(Math.abs(scrollY - smooth.cur) > 2){ smooth.target = smooth.cur = scrollY; }
    }, {passive:true});
    /* back/forward restores scroll after this script initialises, so resync then too */
    addEventListener('pageshow', () => { smooth.target = smooth.cur = scrollY; });

    /* Same-page fragments glide through the eased scroller. Only "#…" hrefs are
       intercepted — cross-page links like /craft must never be given a bare
       fragment href or they would be swallowed here. */
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if(!a) return;
      const href = a.getAttribute('href');
      if(href.length < 2) return;
      const el = document.getElementById(href.slice(1));   /* no selector-syntax hazard */
      if(!el) return;
      e.preventDefault();
      smooth.target = Math.max(0, Math.min(maxScroll(), el.getBoundingClientRect().top + scrollY));
    });
  }

  /* ---------- sector hover previews ---------- */
  const pv = { on:false, o:0, x:innerWidth/2, y:innerHeight/2, cx:innerWidth/2, cy:innerHeight/2,
               vx:0, tilt:0, el:null, img:null, active:false };
  const sectorRows = document.querySelectorAll('.sector-row[data-img]');
  if(!reduced && finePointer && sectorRows.length){
    pv.el = document.createElement('div');
    pv.el.className = 'sector-preview';
    pv.img = document.createElement('img');
    pv.img.alt = '';
    pv.el.appendChild(pv.img);
    document.body.appendChild(pv.el);
    pv.active = true;
    let lastX = innerWidth/2;
    sectorRows.forEach(row => {
      const src = row.dataset.img;
      const pre = new Image(); pre.src = src;      /* preload */
      row.addEventListener('mouseenter', () => { pv.img.src = src; pv.on = true; });
      row.addEventListener('mouseleave', () => { pv.on = false; });
    });
    addEventListener('mousemove', e => {
      pv.vx = e.clientX - lastX; lastX = e.clientX;
      const w = pv.el.offsetWidth || 360, h = pv.el.offsetHeight || 270;
      let x = e.clientX + 30;
      if(x + w > innerWidth - 16) x = e.clientX - 30 - w;   /* flip to the left near the edge */
      let y = e.clientY - h/2;
      y = Math.max(16, Math.min(innerHeight - h - 16, y));
      pv.x = x; pv.y = y;
    }, {passive:true});
  }

  /* ---------- animated cursor: dot + trailing focus ring ---------- */
  const cursor = { on:false, mx:innerWidth/2, my:innerHeight/2, rx:innerWidth/2, ry:innerHeight/2, scale:1 };
  if(!reduced && finePointer){
    const ring = document.createElement('div');
    ring.className = 'cursor'; ring.id = 'curRing';
    const dot = document.createElement('div');
    dot.className = 'cursor'; dot.id = 'curDot';
    document.body.append(ring, dot);
    cursor.dot = dot; cursor.ring = ring; cursor.on = true;
    addEventListener('mousemove', e => {
      cursor.mx = e.clientX; cursor.my = e.clientY;
      document.body.classList.add('cursor-on');
    }, {passive:true});
    document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));
    document.addEventListener('mouseover', e => {
      cursor.scale = e.target.closest('a, button, .sector-row') ? 1.7 : 1;
    });
  }

  requestAnimationFrame(frame);

  /* ---------- island shrinks into liquid glass once you leave the top ---------- */
  const nav = document.getElementById('nav');
  if(nav){
    /* The nav floats over the page, so it has to invert itself when it crosses
       one of the ink bands or its ink-coloured links land on ink. */
    const darkBands = [...document.querySelectorAll('.contact, .site-foot')];
    const alwaysDark = document.body.dataset.theme === 'dark';
    const navState = () => {
      nav.classList.toggle('scrolled', scrollY > 40);
      if(alwaysDark){ nav.classList.add('on-dark'); return; }
      if(!darkBands.length) return;
      const r = nav.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      nav.classList.toggle('on-dark', darkBands.some(b => {
        const d = b.getBoundingClientRect();
        return d.top < mid && d.bottom > mid;
      }));
    };
    addEventListener('scroll', navState, {passive:true});
    addEventListener('resize', navState, {passive:true});
    navState();
  }

  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.getElementById('mobile-menu');
  if(toggle && drawer){
    const setOpen = open => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      drawer.hidden = !open;
      if(open){
        smooth.target = smooth.cur = scrollY;      /* don't glide while the drawer is up */
        const first = drawer.querySelector('a, button');
        if(first) first.focus();
      } else {
        toggle.focus();
      }
    };
    toggle.addEventListener('click', () => setOpen(drawer.hidden));
    drawer.addEventListener('click', e => { if(e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', e => { if(e.key === 'Escape' && !drawer.hidden) setOpen(false); });
    /* a resize past the breakpoint must not leave the body scroll-locked */
    addEventListener('resize', () => { if(innerWidth >= 900 && !drawer.hidden) setOpen(false); });
  }

  /* ---------- trusted-by marquee ----------
     One track is authored; it is cloned here so the logo list is maintained in a
     single place. Without JS the band stays a static, readable row. */
  document.querySelectorAll('[data-marquee]').forEach(m => {
    const track = m.querySelector('.marquee-track');
    if(!track || track.scrollWidth <= m.clientWidth) return;   /* too few logos to loop */
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.appendChild(clone);
    const speed = Number(m.dataset.marqueeSpeed) || 55;   /* px per second */
    m.style.setProperty('--marq-duration', (track.scrollWidth / speed) + 's');
    m.classList.add('is-looping');
    if('IntersectionObserver' in window){
      /* paused off-screen, so it isn't competing with the film scrub for frames */
      new IntersectionObserver(([e]) => m.classList.toggle('in-view', e.isIntersecting))
        .observe(m);
    } else {
      m.classList.add('in-view');
    }
  });

  /* ---------- page transition ----------
     Bars drop in to cover the page we are leaving, then keep dropping to uncover
     the one we arrive at. The two halves are separate page loads, so a
     sessionStorage flag tells the incoming page it owes the second half — a cold
     load or a bookmarked URL never starts underneath a black cover.

     It runs only on the way into and out of Digital Services; the ivory pages
     navigate between themselves plainly. */
  const BARS = 7, STAGGER = 42, COVER = 520, REVEAL = 620;
  const FLAG = 'fs-transition';
  const DS = '/digital-services';
  const isDS = path => path === DS || path === DS + '.html';

  if(!reduced){
    const curtain = document.createElement('div');
    curtain.className = 'curtain';
    curtain.setAttribute('aria-hidden', 'true');
    for(let i = 0; i < BARS; i++){
      const bar = document.createElement('i');
      bar.style.setProperty('--i', i);      /* the stagger lives in CSS, so no
                                               inline shorthand can wipe it */
      curtain.appendChild(bar);
    }
    document.body.appendChild(curtain);
    const lastBar = (BARS - 1) * STAGGER;
    let timer = 0;

    const STATES = ['is-covering', 'is-revealing', 'is-instant'];
    const reset = () => { clearTimeout(timer); curtain.classList.remove(...STATES); };

    /* Put the bars in a state without animating, so a new move never inherits
       the position — or the leftover classes — of the one before it. is-instant
       zeroes the delay as well as the duration: a zero duration with a delay
       still schedules the change, and that shows as a stutter. */
    const snap = state => {
      reset();
      curtain.classList.add('on', 'is-instant');
      if(state) curtain.classList.add(state);
      curtain.offsetHeight;                     /* flush, so the snap is committed */
      curtain.classList.remove('is-instant');
      curtain.offsetHeight;
    };

    const play = (from, to, ms, done) => {
      clearTimeout(timer);
      if(from){
        snap(from);                 /* arriving: jump to covering, then fall away */
        curtain.classList.remove(from);
      } else {
        /* leaving: the bars are already parked above the fold, so no snap and no
           forced reflow — on a page this heavy a synchronous layout flush costs
           more than the animation it is meant to prepare */
        curtain.classList.remove(...STATES);
        curtain.classList.add('on');
      }
      curtain.classList.add(to);
      timer = setTimeout(done, ms);
    };

    if(sessionStorage.getItem(FLAG)){
      sessionStorage.removeItem(FLAG);
      /* second half: the bars are already covering; let them keep falling */
      play('is-covering', 'is-revealing', REVEAL + lastBar + 80,
           () => { reset(); curtain.classList.remove('on'); });
    }

    const internal = a => {
      if(!a || a.target === '_blank' || a.hasAttribute('download')) return null;
      const href = a.getAttribute('href');
      if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
      const url = new URL(href, location.href);
      if(url.origin !== location.origin) return null;
      if(url.pathname === location.pathname && url.search === location.search) return null;
      return url;
    };

    document.addEventListener('click', e => {
      if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = internal(e.target.closest('a[href]'));
      if(!url) return;
      if(!isDS(location.pathname) && !isDS(url.pathname)) return;   /* entering or leaving only */
      e.preventDefault();
      sessionStorage.setItem(FLAG, '1');
      /* Idle the expensive per-frame work while the bars sweep — on Digital
         Services the canvas repaint otherwise eats the frame budget and the
         stagger arrives late. A flag, not a class: toggling a class on <body>
         invalidates style for every blurred pane on the page. */
      FS.transitioning = true;
      /* first half: from hidden, drop in to cover, then hand over to the next page */
      play(null, 'is-covering', COVER + lastBar - 40, () => { location.href = url.href; });
    });

    /* Returning through the bfcache restores the covered DOM — undo it. */
    addEventListener('pageshow', e => {
      if(!e.persisted) return;
      sessionStorage.removeItem(FLAG);
      reset();
      curtain.classList.remove('on');
    });
  }

  /* ---------- contact form ----------
     The form posts natively and the endpoint redirects back with ?sent=1, so it
     works without JavaScript. Here we upgrade it to submit in place. */
  /* By id, not by action: Digital Services has its own forms posting to the same
     endpoint, and they are driven by digital.js. */
  const form = document.getElementById('contact-form');
  if(form){
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.appendChild(status);
    const say = (state, msg) => { status.dataset.state = state; status.textContent = msg; };

    const q = new URLSearchParams(location.search);
    if(q.get('sent')) say('ok', 'Thank you — your enquiry is on its way. We reply within one working day.');
    else if(q.get('error')) say('error', q.get('error'));   /* textContent: never interpolated as HTML */

    form.addEventListener('submit', async e => {
      e.preventDefault();                 /* before the validity check — returning
                                             early without it lets the browser
                                             submit the form for real */
      if(!form.reportValidity()) return;
      const button = form.querySelector('button[type="submit"]');
      const label = button.textContent;
      button.disabled = true; button.textContent = 'Sending…';
      say('', '');
      try{
        const r = await fetch(form.action, {
          method: 'POST',
          headers: {'Accept':'application/json'},
          body: new URLSearchParams(new FormData(form)),
        });
        const data = await r.json().catch(() => ({}));
        if(r.ok && data.ok){
          form.reset();
          say('ok', data.message || 'Thank you — your enquiry is on its way.');
        } else {
          say('error', data.message || 'We could not send that just now. Please try again shortly.');
        }
      } catch(err){
        say('error', 'That did not send — check your connection and try again.');
      } finally {
        button.disabled = false; button.textContent = label;
      }
    });
  }

  /* =====================================================================
     Shared page components. Each one is a no-op when its markup is absent, so
     every page can load this without paying for what it does not use.
     ===================================================================== */

  /* ---------- revealed text ----------
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

  /* ---------- decoding labels ---------- */
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

  /* ---------- discipline accordion ----------
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

  /* ---------- glass panes ----------
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

  /* ---------- the enquiry / call panel ----------
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

  /* ---------- the 360° tour viewer ----------
     /works lists its sectors as rows; each row opens a full-viewport viewer for
     that sector's tours, with the tours themselves switched in place.

     The tour list is read out of the page rather than declared here, so the
     copy has one home — the <ul> under each row, which is also what a visitor
     without JavaScript is left with. Building the viewer is therefore the last
     thing that happens: only once it exists is the list marked enhanced and
     folded away. */
  const sectorList = document.querySelector('.sector-list[data-tours]');
  if(sectorList){
    const sectors = [...sectorList.querySelectorAll('.sector')].map(sec => {
      const row = sec.querySelector('.sector-row');
      return {
        slug:  sec.id,
        deg:   row.querySelector('.sector-deg').textContent.trim(),
        name:  row.querySelector('.sector-name').textContent.trim(),
        row:   row,
        tours: [...sec.querySelectorAll('.sector-tours a')].map(a => ({
          title: a.textContent.trim(),
          note:  a.dataset.note || '',
          url:   a.href,
        })),
      };
    }).filter(s => s.tours.length);

    if(sectors.length){
      const SVG = 'http://www.w3.org/2000/svg';
      const icon = (d, extra) => {
        const svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '20'); svg.setAttribute('height', '20');
        svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.5'); svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
        (Array.isArray(d) ? d : [d]).forEach(dd => {
          const path = document.createElementNS(SVG, 'path');
          path.setAttribute('d', dd);
          svg.appendChild(path);
        });
        if(extra) svg.setAttribute('width', extra), svg.setAttribute('height', extra);
        return svg;
      };

      const el = (tag, cls, parent) => {
        const node = document.createElement(tag);
        if(cls) node.className = cls;
        if(parent) parent.appendChild(node);
        return node;
      };

      /* --- the viewer, built once and reused for every sector --- */
      const view  = el('div', 'tour-viewer');
      view.hidden = true;
      view.setAttribute('role', 'dialog');
      view.setAttribute('aria-modal', 'true');
      view.setAttribute('aria-labelledby', 'tv-title');

      const head  = el('header', 'tv-head', view);
      const id    = el('div', 'tv-id', head);
      const brow  = el('p', 'tv-eyebrow', id);
      const title = el('h2', 'tv-title', id);
      title.id = 'tv-title';
      const note  = el('p', 'tv-note', id);

      const close = el('button', 'tv-close', head);
      close.type = 'button';
      close.setAttribute('aria-label', 'Close tour');
      close.appendChild(icon(['M6 6l12 12', 'M18 6L6 18'], '22'));
      el('span', '', close).textContent = 'Close';

      const stage = el('div', 'tv-stage', view);
      stage.id = 'tv-stage';
      stage.setAttribute('role', 'tabpanel');
      const frame = document.createElement('iframe');
      frame.className = 'tv-frame';
      frame.setAttribute('allowfullscreen', 'true');
      /* the client's own embed spec for these tours, carried over verbatim */
      frame.setAttribute('allow', 'fullscreen; accelerometer; gyroscope; magnetometer; ' +
        'vr; xr; xr-spatial-tracking; autoplay; camera; microphone');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      stage.appendChild(frame);
      const wait = el('div', 'tv-wait', stage);
      el('i', '', wait);
      el('span', '', wait).textContent = 'Loading the tour';
      frame.addEventListener('load', () => stage.classList.add('is-ready'));

      /* The switcher is the one control a visitor has to notice, so it is
         announced rather than left to be discovered: a label, a running count,
         and buttons sized to be read at a glance. */
      const rail  = el('nav', 'tv-rail', view);
      rail.setAttribute('aria-label', 'Tours in this sector');
      const brief = el('div', 'tv-rail-head', rail);
      el('span', 'tv-rail-label', brief).textContent = 'More tours in this sector';
      const count = el('span', 'tv-rail-count', brief);
      const bar   = el('div', 'tv-rail-nav', rail);
      const prev  = el('button', 'tv-step', bar);
      prev.type = 'button'; prev.setAttribute('aria-label', 'Previous tour');
      prev.appendChild(icon('M15 5l-7 7 7 7', '26'));
      const chips = el('div', 'tv-chips', bar);
      chips.setAttribute('role', 'tablist');
      const next  = el('button', 'tv-step', bar);
      next.type = 'button'; next.setAttribute('aria-label', 'Next tour');
      next.appendChild(icon('M9 5l7 7-7 7', '26'));
      document.body.appendChild(view);

      /* --- state --- */
      let sector = null, index = 0, opener = null, pushed = false, teardown = 0;

      /* The overlay fades out before it is hidden, so the last step of a close is
         deferred. Reopening inside that window has to finish the pending close
         first, or its timer fires afterwards and shuts the viewer the visitor
         has just opened. */
      const finish = () => {
        teardown = 0;
        view.hidden = true;
        frame.removeAttribute('src');
        stage.classList.remove('is-ready');
      };
      const settle = () => { if(teardown){ clearTimeout(teardown); finish(); } };

      const show = i => {
        const tour = sector.tours[i];
        if(!tour) return;
        index = i;
        brow.textContent   = sector.deg + ' · ' + sector.name;
        title.textContent  = tour.title;
        note.textContent   = tour.note;
        note.hidden        = !tour.note;
        if(frame.src !== tour.url){
          stage.classList.remove('is-ready');
          frame.src = tour.url;
        }
        [...chips.children].forEach((chip, n) => {
          const on = n === i;
          chip.setAttribute('aria-selected', String(on));
          chip.tabIndex = on ? 0 : -1;
          if(on) chip.scrollIntoView({block:'nearest', inline:'nearest'});
        });
        count.textContent = (i + 1) + ' / ' + sector.tours.length;
        prev.disabled = i === 0;
        next.disabled = i === sector.tours.length - 1;
      };

      const step = by => {
        const n = index + by;
        if(n >= 0 && n < sector.tours.length) show(n);
      };

      const mount = s => {
        sector = s;
        chips.textContent = '';
        s.tours.forEach((tour, i) => {
          const chip = el('button', 'tv-chip', chips);
          chip.type = 'button';
          chip.setAttribute('role', 'tab');
          chip.setAttribute('aria-controls', 'tv-stage');
          chip.textContent = tour.title;
          press(chip, () => show(i));
        });
        rail.toggleAttribute('data-single', s.tours.length < 2);
      };

      const open = (slug, push) => {
        const s = sectors.find(x => x.slug === slug);
        if(!s) return false;
        settle();
        if(!view.hidden && sector === s) return true;
        mount(s);
        if(view.hidden){
          /* Safari does not focus a button on click, and arriving by hash focuses
             nothing at all, so fall back to the row itself — closing has to land
             somewhere on the list either way. */
          const active = document.activeElement;
          opener = (active && active !== document.body) ? active : s.row;
          view.hidden = false;
          document.body.classList.add('tour-open');
          view.offsetHeight;            /* flush, so the fade has a frame to start from —
                                           rAF is throttled in a background tab and would
                                           leave the overlay transparent but blocking */
          view.classList.add('is-open');
          if(push){ history.pushState({fsTour:slug}, '', '#' + slug); pushed = true; }
        } else if(pushed){
          /* swapping sectors without leaving the viewer — the entry we own moves
             with it rather than gaining a second one */
          history.replaceState({fsTour:slug}, '', '#' + slug);
        }
        show(0);
        close.focus({preventScroll:true});
        return true;
      };

      /* Drops the overlay without touching history — the two callers below own
         that between them, and doing it here as well would fight them. */
      const dismiss = () => {
        if(view.hidden) return;
        view.classList.remove('is-open');
        document.body.classList.remove('tour-open');
        clearTimeout(teardown);
        if(reduced) finish(); else teardown = setTimeout(finish, 420);
        sector = null;
        if(opener && document.contains(opener)) opener.focus({preventScroll:true});
        opener = null;
      };

      /* Opening pushes a history entry, so Back closes the viewer — what a
         full-screen overlay owes a phone. Closing does NOT call history.back():
         that lands on a later turn, by which time the visitor may have opened
         another sector, and the queued move would then unwind an entry that is
         still in use. Instead the entry we pushed is overwritten in place. Every
         history call here is synchronous, so nothing can arrive out of order. */
      const shut = () => {
        if(view.hidden || !view.classList.contains('is-open')) return;
        dismiss();
        pushed = false;
        if(location.hash || history.state){
          history.replaceState(null, '', location.pathname + location.search);
        }
      };

      /* Back off our own entry, or Forward onto it again. */
      addEventListener('popstate', e => {
        if(e.state && e.state.fsTour){ pushed = true; open(e.state.fsTour, false); }
        else { pushed = false; dismiss(); }
      });

      /* Once the visitor has taken hold of the tour, focus is inside a
         cross-origin iframe, and the browser spends the next click bringing
         focus back to this document — the button never hears it, so the control
         appears to need clicking twice. pointerdown lands before that, so the
         first press is the one that counts. click stays on for the keyboard,
         which never fires pointerdown; the short latch keeps a mouse press from
         running the handler twice. */
      const press = (node, fn) => {
        let viaPointer = false;
        node.addEventListener('pointerdown', e => {
          /* Mouse only. On a touch screen pointerdown is also the first move of
             a swipe along the chip row, and firing here would change the tour
             every time someone tried to scroll it — touch keeps the ordinary
             click, which the browser withholds once a scroll has begun. */
          if(e.pointerType !== 'mouse' || e.button !== 0) return;
          viaPointer = true;
          setTimeout(() => { viaPointer = false; }, 700);
          fn();
        });
        node.addEventListener('click', () => { if(!viaPointer) fn(); });
      };

      press(close, shut);
      press(prev, () => step(-1));
      press(next, () => step(1));

      sectors.forEach(s => s.row.addEventListener('click', () => open(s.slug, true)));

      addEventListener('keydown', e => {
        if(view.hidden) return;
        if(e.key === 'Escape'){ e.preventDefault(); shut(); }
        else if(e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
        else if(e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
        else if(e.key === 'Tab'){
          /* the overlay covers the page, so the page must not be tabbable behind it */
          const stops = [close, ...chips.children, prev, next]
            .filter(n => !n.disabled && n.offsetParent);
          if(!stops.length) return;
          const first = stops[0], last = stops[stops.length - 1];
          if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
          else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
      });

      /* Arriving on /works#luxury-real-estate — from the home page's own sector
         list, or a shared link — opens straight into that sector. The hash has
         already scrolled the row into place, so closing lands back on it. */
      const fromHash = () => {
        const slug = decodeURIComponent(location.hash.slice(1));
        if(slug) open(slug, false);
      };
      fromHash();
      addEventListener('hashchange', fromHash);

      sectorList.setAttribute('data-enhanced', '');
    }
  }

  /* ---------- section reveals ---------- */
  if(!reduced && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:.18});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
  }
})();
