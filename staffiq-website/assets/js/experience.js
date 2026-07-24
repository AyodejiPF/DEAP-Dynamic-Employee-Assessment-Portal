/* ============================================================================
   StaffiQ Premium Experience  v2  (2026-07-17)
   Ambient music (faster + more upbeat) with controls, 3D card tilt + zoom,
   frosted header on scroll. Self contained, fail safe, reduced-motion aware.
   Never autoplays audible sound before a user gesture (browser policy + UX).
   Use a licensed track instead by setting window.SQ_AMBIENCE_URL before load.
   ========================================================================== */
(function () {
  "use strict";
  try {
    var docEl = document.documentElement;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && matchMedia('(pointer: fine)').matches;

    if (!document.getElementById('sq-experience-css')) {
      var lk = document.createElement('link');
      lk.id = 'sq-experience-css'; lk.rel = 'stylesheet'; lk.href = (window.SQ_CSS_HREF || '/assets/css/experience.css');
      document.head.appendChild(lk);
    }
    docEl.setAttribute('data-premium', 'on');

    /* frosted header */
    var onScroll = function () { docEl.setAttribute('data-scrolled', window.scrollY > 10 ? 'on' : 'off'); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    /* 3D tilt + zoom on cards */
    if (finePointer && !reduce) {
      var MAX = 6, raf = 0, active = null, px = 0, py = 0;
      var apply = function () {
        raf = 0; if (!active) return;
        var r = active.getBoundingClientRect();
        var rx = ((py - r.top - r.height / 2) / r.height) * -MAX;
        var ry = ((px - r.left - r.width / 2) / r.width) * MAX;
        active.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-5px) scale(1.045)';
      };
      var move = function (e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };
      var enter = function (e) { active = e.currentTarget; active.style.transition = 'transform .07s linear'; active.style.zIndex = '5'; };
      var leave = function (e) { var el = e.currentTarget; el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)'; el.style.transform = ''; el.style.zIndex = ''; if (active === el) active = null; };
      var bind = function () {
        var cards = document.querySelectorAll('.card, .mock-card');
        for (var i = 0; i < cards.length; i++) { var c = cards[i]; if (c.__sqTilt) continue; c.__sqTilt = 1; c.addEventListener('pointerenter', enter); c.addEventListener('pointermove', move); c.addEventListener('pointerleave', leave); }
      };
      bind();
      if (window.MutationObserver) new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
    }

    /* ---- Ambient music: brighter pad + gentle upbeat arpeggio ---- */
    var LS_ON = 'staffiq_amb_on', LS_VOL = 'staffiq_amb_vol';
    var vol = parseFloat(localStorage.getItem(LS_VOL)); if (isNaN(vol)) vol = 0.20;
    var wantOn = localStorage.getItem(LS_ON) === '1';
    var ctx = null, master = null, padGain = null, arpGain = null, padLP = null, arpLP = null, nodes = [], chordTimer = null, arpTimer = null, htmlAudio = null, playing = false, step = 0;
    /* brighter, slightly richer progression, faster movement */
    var CHORDS = [ [146.83,220.00,293.66,369.99], [130.81,196.00,261.63,329.63], [164.81,246.94,329.63,415.30], [110.00,164.81,220.00,277.18] ];
    var ci = 0;

    function reverb(c){ var n=c.sampleRate*1.8,b=c.createBuffer(2,n,c.sampleRate); for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);} var cv=c.createConvolver();cv.buffer=b;return cv; }

    function start() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      var verb = reverb(ctx), wet = ctx.createGain(); wet.gain.value = .42; verb.connect(wet); wet.connect(master);
      /* pad bus */
      padGain = ctx.createGain(); padGain.gain.value = .62; padLP = ctx.createBiquadFilter(); padLP.type='lowpass'; padLP.frequency.value = 1200; padLP.connect(padGain); padGain.connect(master); padGain.connect(verb);
      /* arp bus (brighter) */
      arpGain = ctx.createGain(); arpGain.gain.value = .32; arpLP = ctx.createBiquadFilter(); arpLP.type='lowpass'; arpLP.frequency.value = 3200; arpLP.connect(arpGain); arpGain.connect(master); arpGain.connect(verb);
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .09; lg.gain.value = .05; lfo.connect(lg); lg.connect(master.gain); lfo.start();
      function pad(f,dt){ var o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f; o.detune.value=dt; var g=ctx.createGain(); g.gain.value=.15; o.connect(g); g.connect(padLP); o.start(); return {o:o}; }
      function setChord(c){ var i; for(i=nodes.length-1;i>=0;i--){try{nodes[i].o.stop(ctx.currentTime+3);}catch(e){}} nodes=[]; for(i=0;i<c.length;i++){ nodes.push(pad(c[i],-6)); nodes.push(pad(c[i],6)); } }
      setChord(CHORDS[0]);
      chordTimer = setInterval(function(){ ci=(ci+1)%CHORDS.length; setChord(CHORDS[ci]); }, 7000);
      /* arpeggio: a gentle plucked note about every 300ms, brighter, upbeat */
      arpTimer = setInterval(function(){
        if (!playing) return; var c = CHORDS[ci]; var f = c[step % c.length] * (step % 8 < 4 ? 2 : 1); step++;
        var o = ctx.createOscillator(); o.type='triangle'; o.frequency.value = f;
        var g = ctx.createGain(); var t = ctx.currentTime;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t+.012); g.gain.exponentialRampToValueAtTime(.001, t+.28);
        var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pan) pan.pan.value = (step%2?0.25:-0.25);
        o.connect(g); (pan ? (g.connect(pan), pan.connect(arpLP)) : g.connect(arpLP)); o.start(t); o.stop(t+.32);
      }, 300);
      master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);  /* faster attack */
      playing = true;
    }

    function ensure(){
      if (window.SQ_AMBIENCE_URL){ if(!htmlAudio){htmlAudio=new Audio(window.SQ_AMBIENCE_URL);htmlAudio.loop=true;htmlAudio.volume=vol;} htmlAudio.play().then(function(){playing=true;render();}).catch(function(){}); return; }
      if (!ctx) start(); else if (ctx.state === 'suspended'){ ctx.resume(); master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.4); playing = true; }
    }
    function pause(){ playing=false; if(htmlAudio){htmlAudio.pause();} else if(ctx){ master.gain.linearRampToValueAtTime(.0001, ctx.currentTime + 0.25); setTimeout(function(){ if(!playing && ctx) ctx.suspend(); }, 300); } render(); }
    function setVol(v){ vol=v; localStorage.setItem(LS_VOL,String(v)); if(htmlAudio) htmlAudio.volume=v; else if(ctx && playing) master.gain.setTargetAtTime(v, ctx.currentTime, 0.03); } /* reacts fast */

    /* widget */
    var wrap=document.createElement('div'); wrap.className='sq-audio'+(wantOn?'':' is-idle'); wrap.setAttribute('role','group'); wrap.setAttribute('aria-label','Background music');
    var btn=document.createElement('button'); btn.type='button'; btn.setAttribute('aria-label','Play background music'); btn.textContent='▶';
    var eq=document.createElement('span'); eq.className='sq-eq'; eq.innerHTML='<i></i><i></i><i></i><i></i>';
    var label=document.createElement('span'); label.className='sq-label'; label.textContent='Ambience';
    var range=document.createElement('input'); range.type='range'; range.min='0'; range.max='0.6'; range.step='0.01'; range.value=String(vol); range.setAttribute('aria-label','Music volume');
    function render(){ btn.textContent=playing?'⏸':'▶'; btn.setAttribute('aria-label',playing?'Pause background music':'Play background music'); wrap.classList.toggle('is-idle',!playing); wrap.classList.toggle('is-playing',playing); }
    btn.addEventListener('click',function(){ if(playing){ localStorage.setItem(LS_ON,'0'); pause(); } else { localStorage.setItem(LS_ON,'1'); ensure(); render(); } });
    range.addEventListener('input',function(){ setVol(parseFloat(range.value)); });
    wrap.appendChild(btn); wrap.appendChild(eq); wrap.appendChild(label); wrap.appendChild(range);
    (document.body || docEl).appendChild(wrap);

    if (wantOn){ var resume=function(){ ensure(); render(); window.removeEventListener('pointerdown',resume); window.removeEventListener('keydown',resume); }; window.addEventListener('pointerdown',resume,{once:true}); window.addEventListener('keydown',resume,{once:true}); }
  } catch (e) { /* never break the page for a nicety */ }
})();
/* ===================== END StaffiQ Premium Experience v2 ===================== */
