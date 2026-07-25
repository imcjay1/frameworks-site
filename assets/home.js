/* Frameworks Studios — the scroll-scrubbed showreel hero. index.html only.
 *
 * Loaded after site.js (both deferred, so order is guaranteed) and registers its
 * per-frame work with FS.onFrame. The tunables here are matched to the encode of
 * assets/showreel.mp4 — see README before changing any of them.
 */
(function(){
  const video    = document.getElementById('scrub');
  const track    = document.getElementById('track');
  const poster   = document.querySelector('.poster');
  const pan      = document.getElementById('pan');
  const heroCopy = document.getElementById('heroCopy');
  const transport = document.getElementById('transport');
  if(!video || !track) return;

  const { reduced, sm } = window.FS;
  const vfs = [...document.querySelectorAll('.vf')];

  /* split caption lines into masked words for the staggered reveal */
  function splitWords(el){
    const process = node => {
      if(node.nodeType === 3){
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if(!part) return;
          if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          const m = document.createElement('span'); m.className = 'wm';
          const w = document.createElement('span'); w.className = 'wi'; w.textContent = part;
          m.appendChild(w); frag.appendChild(m);
        });
        node.parentNode.replaceChild(frag, node);
      } else if(node.nodeType === 1){
        [...node.childNodes].forEach(process);
      }
    };
    [...el.childNodes].forEach(process);
    return [...el.querySelectorAll('.wi')];
  }
  const caps = [...document.querySelectorAll('.cap')].map(el => ({
    el, a:+el.dataset.start, b:+el.dataset.end,
    words: splitWords(el.querySelector('.cap-line'))
  }));
  const GLYPHS = '0123456789#$%&/<>[]*+=?!';
  let fc = 0;                                     /* frame counter for scramble throttling */
  const tcaps = [...document.querySelectorAll('.tcap')].map(el => {
    const main = el.querySelector('.t-main');
    return { el, main, text: main.textContent,
             a:+el.dataset.start, b:+el.dataset.end, live:false, done:false };
  });

  /* transport ticks — one per 15° of pan */
  const TICKS = 24;
  for(let i=0;i<TICKS;i++){ transport.appendChild(document.createElement('i')); }
  const ticks = [...transport.children];

  let duration = 0, target = 0, current = 0, ready = false;

  function armVideo(){
    if(ready || video.readyState < 1) return;   /* HAVE_METADATA or better */
    duration = video.duration; ready = true;
    poster.style.display = 'none';
    video.pause();
    try{ video.currentTime = 0; }catch(e){}
    if(reduced){ video.play(); }                /* reduced motion: just play once */
  }
  video.addEventListener('loadedmetadata', armVideo);
  video.addEventListener('loadeddata', armVideo);
  video.addEventListener('canplay', armVideo);
  video.addEventListener('error', () => { video.style.display='none'; });
  armVideo();

  function progress(){
    const r = track.getBoundingClientRect();
    const total = r.height - innerHeight;
    if(total <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / total));
  }

  FS.onFrame(function(){
    fc++;
    const p = progress();
    ticks.forEach((t,i)=> t.classList.toggle('lit', i/TICKS <= p));
    pan.textContent = 'PAN ' + String(Math.round(p*360)).padStart(3,'0') + '°';

    /* hero text + viewfinder chrome dissolve as the film takes over */
    if(!reduced){
      const fade = Math.max(0, 1 - p / 0.12);       /* fully gone by 12% of the pan */
      heroCopy.style.opacity = fade;
      heroCopy.style.transform = 'translateY(' + ((1 - fade) * -22) + 'px)';
      heroCopy.style.pointerEvents = fade < 0.5 ? 'none' : '';
      vfs.forEach(v => { v.style.opacity = fade; });

      /* captions: words rise in one by one, hold for most of the window,
         then the whole line shrinks + blurs upward — receding into the distance */
      caps.forEach(c => {
        const t = (p - c.a) / (c.b - c.a);
        if(t <= 0 || t >= 1){ c.el.style.opacity = 0; return; }
        const outT = sm(.85, 1, t);
        c.el.style.opacity = sm(0, .04, t) * (1 - outT);
        c.el.style.transform =
          'translateY(' + (-outT * 54) + 'px) ' +
          'scale(' + (1 - outT * 0.2) + ')';
        c.el.style.filter = 'blur(' + (outT * 7) + 'px)';
        const rt = Math.min(1, t / 0.20);           /* words fully in by 20% of window */
        c.words.forEach((w,i) => {
          const wIn = sm(i * 0.06, i * 0.06 + 0.36, rt);
          w.style.transform = 'translateY(' + ((1 - wIn) * 115) + '%)';
        });
      });

      /* final-frame scroll-out: the film eases into a rounded card,
         lifts slightly, and hands the page over to the sections below */
      const outro = sm(0.955, 1, p);
      const vT = 'scale(' + (1 - outro * 0.06) + ') translateY(' + (-outro * 24) + 'px)';
      video.style.transform = vT;
      poster.style.transform = vT;
      video.style.borderRadius = poster.style.borderRadius = (outro * 28) + 'px';

      /* teardown captions: characters scramble to symbols as they appear
         and again as they dissolve; long steady hold in between */
      tcaps.forEach(c => {
        const t = (p - c.a) / (c.b - c.a);
        const inside = t > 0 && t < 1;
        if(inside !== c.live){ c.live = inside; c.el.classList.toggle('live', inside); }
        if(!inside){
          c.el.style.opacity = 0;
          if(!c.done){ c.main.textContent = c.text; c.main.setAttribute('data-text', c.text); c.done = true; }
          return;
        }
        c.done = false;
        const oIn = sm(0, .09, t), oOut = sm(.92, 1, t);
        c.el.style.opacity = oIn * (1 - oOut);
        c.el.style.transform = 'translateX(-50%) translateY(' + ((1 - oIn) * 8 - oOut * 8) + 'px)';
        /* decode wave: resolves left-to-right on entry, re-scrambles right-to-left on exit */
        const reveal = sm(.02, .26, t) * (1 - sm(.80, .97, t));
        if(fc % 2 === 0){
          let s = '';
          for(let i = 0; i < c.text.length; i++){
            const ch = c.text[i];
            if(ch === ' '){ s += ' '; continue; }
            s += (reveal >= (i + 1) / c.text.length)
              ? ch
              : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          c.main.textContent = s;
          c.main.setAttribute('data-text', s);
        }
      });
    }

    if(ready && !reduced){
      target = p * (duration - 0.05);
      current += (target - current) * 0.18;          /* lerp = silky scrub */
      /* seek only when we've moved at least half a source frame (12fps source) —
         issuing a seek every rAF overwhelms the decoder and causes stutter */
      if(Math.abs(current - video.currentTime) > 0.042) video.currentTime = current;
    }
  });
})();
