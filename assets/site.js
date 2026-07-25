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
    m.style.setProperty('--marq-duration', (track.scrollWidth / 55) + 's');   /* ~55px per second */
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
