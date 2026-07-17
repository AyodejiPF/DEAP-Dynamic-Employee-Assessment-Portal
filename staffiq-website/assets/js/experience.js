/* ============================================================================
   StaffiQ Premium Experience  (added 2026-07-17)
   Ambient music with controls + gentle 3D card tilt + frosted header on scroll.
   Self contained, fail safe, respects prefers-reduced-motion.
   Never autoplays audible sound before a user gesture (browser policy + good UX).
   To use a licensed track instead of the generated ambience, set
   window.SQ_AMBIENCE_URL = 'https://.../track.mp3' before this script runs.
   ========================================================================== */
(function () {
  "use strict";
  try {
    var docEl = document.documentElement;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && matchMedia('(pointer: fine)').matches;

    /* Inject the premium stylesheet once (keeps all 30 pages in sync via main.js) */
    if (!document.getElementById('sq-experience-css')) {
      var l = document.createElement('link');
      l.id = 'sq-experience-css'; l.rel = 'stylesheet'; l.href = '/assets/css/experience.css';
      document.head.appendChild(l);
    }
    docEl.setAttribute('data-premium', 'on');

    /* ---- Frosted header on scroll ---- */
    var onScroll = function () { docEl.setAttribute('data-scrolled', window.scrollY > 10 ? 'on' : 'off'); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    /* ---- Gentle 3D tilt on cards (desktop pointer only, motion allowed) ---- */
    if (finePointer && !reduce) {
      var MAX = 6, raf = 0, active = null, px = 0, py = 0;
      var apply = function () {
        raf = 0; if (!active) return;
        var r = active.getBoundingClientRect();
        var rx = (+(py - r.top - r.height / 2) / r.height) * -MAX;
        var ry = (+(px - r.left - r.width / 2) / r.width) * MAX;
        active.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
      };
      var move = function (e) { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };
      var enter = function (e) { active = e.currentTarget; active.style.transition = 'transform .08s linear'; };
      var leave = function (e) {
        var el = e.currentTarget; el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)';
        el.style.transform = ''; if (active === el) active = null;
      };
      var bind = function () {
        var cards = document.querySelectorAll('.card, .mock-card');
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i]; if (c.__sqTilt) continue; c.__sqTilt = 1;
          c.addEventListener('pointerenter', enter);
          c.addEventListener('pointermove', move);
          c.addEventListener('pointerleave', leave);
        }
      };
      bind();
      if (window.MutationObserver) { new MutationObserver(bind).observe(document.body, { childList: true, subtree: true }); }
    }

    /* ---- Ambient music player ---- */
    var LS_ON = 'staffiq_amb_on', LS_VOL = 'staffiq_amb_vol';
    var savedVol = parseFloat(localStorage.getItem(LS_VOL)); if (isNaN(savedVol)) savedVol = 0.18;
    var wantOn = localStorage.getItem(LS_ON) === '1';

    var ctx = null, master = null, nodes = [], chordTimer = null, htmlAudio = null, playing = false;

    var CHORDS = [ [146.83, 220.00, 293.66], [130.81, 196.00, 261.63], [164.81, 246.94, 329.63], [110.00, 164.81, 220.00] ];
    var chordIx = 0;

    function makeReverb(c) {
      var len = c.sampleRate * 2.2, buf = c.createBuffer(2, len, c.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
      var cv = c.createConvolver(); cv.buffer = buf; return cv;
    }

    function startGenerated() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820; lp.Q.value = 0.6; lp.connect(master);
      var verb = makeReverb(ctx); var wet = ctx.createGain(); wet.gain.value = 0.5; verb.connect(wet); wet.connect(master); lp.connect(verb);
      var lfo = ctx.createOscillator(); var lfoGain = ctx.createGain(); lfo.frequency.value = 0.06; lfoGain.gain.value = 0.04; lfo.connect(lfoGain); lfoGain.connect(master.gain); lfo.start();
      function voice(freq, detune) { var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq; o.detune.value = detune; var g = ctx.createGain(); g.gain.value = 0.16; o.connect(g); g.connect(lp); o.start(); return { o: o, g: g }; }
      function setChord(c) { var i; for (i = nodes.length - 1; i >= 0; i--) { try { nodes[i].o.stop(ctx.currentTime + 4); } catch (e) {} } nodes = []; for (i = 0; i < c.length; i++) { nodes.push(voice(c[i], -6)); nodes.push(voice(c[i], 6)); } }
      setChord(CHORDS[0]);
      chordTimer = setInterval(function () { chordIx = (chordIx + 1) % CHORDS.length; setChord(CHORDS[chordIx]); }, 12000);
      master.gain.linearRampToValueAtTime(savedVol, ctx.currentTime + 2.5);
      playing = true;
    }

    function ensure() {
      if (window.SQ_AMBIENCE_URL) {
        if (!htmlAudio) { htmlAudio = new Audio(window.SQ_AMBIENCE_URL); htmlAudio.loop = true; htmlAudio.volume = savedVol; }
        htmlAudio.play().then(function(){ playing = true; render(); }).catch(function(){});
        return;
      }
      if (!ctx) startGenerated(); else if (ctx.state === 'suspended') { ctx.resume(); master.gain.linearRampToValueAtTime(savedVol, ctx.currentTime + 1.2); playing = true; }
    }
    function pause() {
      playing = false;
      if (htmlAudio) { htmlAudio.pause(); }
      else if (ctx) { master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6); setTimeout(function(){ if(!playing && ctx) ctx.suspend(); }, 700); }
      render();
    }
    function setVol(v) { savedVol = v; localStorage.setItem(LS_VOL, String(v)); if (htmlAudio) htmlAudio.volume = v; else if (ctx && playing) master.gain.setTargetAtTime(v, ctx.currentTime, 0.2); }

    /* Build widget */
    var wrap = document.createElement('div'); wrap.className = 'sq-audio' + (wantOn ? '' : ' is-idle'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', 'Background music');
    var btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', 'Play background music');
    var label = document.createElement('span'); label.className = 'sq-label'; label.textContent = 'Ambience';
    var vol = document.createElement('input'); vol.type = 'range'; vol.min = '0'; vol.max = '0.6'; vol.step = '0.01'; vol.value = String(savedVol); vol.setAttribute('aria-label', 'Music volume');
    var ICON_PLAY = '▶', ICON_PAUSE = '⏸';
    btn.textContent = ICON_PLAY;
    function render() { btn.textContent = playing ? ICON_PAUSE : ICON_PLAY; btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music'); wrap.classList.toggle('is-idle', !playing); }
    btn.addEventListener('click', function () { if (playing) { localStorage.setItem(LS_ON, '0'); pause(); } else { localStorage.setItem(LS_ON, '1'); ensure(); render(); } });
    vol.addEventListener('input', function () { setVol(parseFloat(vol.value)); });
    wrap.appendChild(btn); wrap.appendChild(label); wrap.appendChild(vol);
    (document.body || docEl).appendChild(wrap);

    /* If the user had music on before (previous page), resume on first gesture */
    if (wantOn) {
      var resume = function () { ensure(); render(); window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    }
  } catch (e) { /* never break the page for a nicety */ }
})();
/* ===================== END StaffiQ Premium Experience ===================== */
