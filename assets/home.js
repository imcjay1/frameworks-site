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
  const caps = [...document.querySelectorAll('.cap')].map(el => {
    const words = splitWords(el.querySelector('.cap-line'));
    /* Each word is held back a little longer than the one before it. The step is
       capped so a short line keeps its leisurely rhythm, and shrunk on a long one
       so the last word still lands inside the window rather than never arriving. */
    return { el, a:+el.dataset.start, b:+el.dataset.end, words,
             step: Math.min(0.06, 0.64 / Math.max(1, words.length - 1)) };
  });
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

  /* ---------- portrait: publish where the film ends ----------
     The film is object-fit:contain, so on a portrait screen it is a band
     across the top and the rest of the stage is an ivory plate. How deep that
     plate is depends on the screen's aspect ratio — it is one depth on a phone
     and quite another on an iPad — so it is measured rather than guessed, and
     site.css positions the captions against it. */
  const stage  = document.querySelector('.stage');
  const FILM_Y = 0.16;             /* matches object-position:center 16% in site.css */

  function plate(){
    if(!stage) return;
    const vw = stage.clientWidth, vh = stage.clientHeight;
    if(!vw || !vh) return;
    if(vw > vh){                   /* landscape: the film fills the frame, no plate */
      stage.style.removeProperty('--plate-top');
      stage.style.removeProperty('--plate-h');
      return;
    }
    const ar = (video.videoWidth && video.videoHeight)
      ? video.videoWidth / video.videoHeight : 16 / 9;
    let h = vw / ar;
    if(h > vh) h = vh;
    const top = (vh - h) * FILM_Y + h;
    stage.style.setProperty('--plate-top', top + 'px');
    stage.style.setProperty('--plate-h', (vh - top) + 'px');
  }
  plate();
  addEventListener('resize', plate, {passive:true});
  addEventListener('orientationchange', plate);

  /* iOS will not paint a seeked frame on a video it has never decoded, so on an
     iPhone and an iPad the hero sat on one still frame for the whole scroll —
     the film never moved. One muted inline play, paused as soon as it starts,
     primes the decoder; if the browser refuses that without a gesture, the
     first touch is a second chance at it. */
  function prime(){
    const started = video.play();
    const settle = () => video.pause();
    if(started && started.then){
      started.then(settle).catch(() => {
        addEventListener('touchstart', prime, {once:true, passive:true});
      });
    } else {
      settle();
    }
  }

  function armVideo(){
    if(ready || video.readyState < 1) return;   /* HAVE_METADATA or better */
    duration = video.duration; ready = true;
    poster.style.display = 'none';
    video.pause();
    try{ video.currentTime = 0; }catch(e){}
    plate();                                    /* the film's real size is known now */
    if(reduced){ video.play(); return; }        /* reduced motion: just play once */
    prime();
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
      /* In portrait the hero copy and the captions share the one plate under the
         film, and the first caption opens at 6.5% of the pan — so the copy has
         to be gone by then rather than at the 12% a wide screen can afford. */
      const fadeEnd = innerHeight >= innerWidth ? 0.052 : 0.12;
      const fade = Math.max(0, 1 - p / fadeEnd);
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
          const wIn = sm(i * c.step, i * c.step + 0.36, rt);
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
