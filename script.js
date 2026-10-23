(function () {
  "use strict";
  /* ================= DATA ================= */
  var SEGS = [
    { h: "Star News Tonight", s: "A Surprising Night at the Music Festival", v: [1, 3] },
    { h: "Thousands attend music festival", s: "Thousands of fans gathered in Lima.", v: [5, 1] },
    { h: "Heavy rain stops main concert", s: "The rain forced organizers to stop the show.", v: [2, 4] },
    { h: "Artists react to unexpected delay", s: "The artists were surprised by the weather.", v: [4, 3] },
    { h: "Concert resumes after 30 minutes", s: "The rain stopped, and the show continued.", v: [3, 1] },
    { h: "From small events to fame", s: "The festival used to be much smaller.", v: [1, 5] },
    { h: "What if safety measures had failed?", s: "Safety measures helped prevent a dangerous situation.", v: [2, 4] },
    { h: "Fans celebrate a successful night", s: "Nobody was injured, and fans want to return next year.", v: [5, 3] },
    { h: "Next year: a safer festival", s: "More security. Better preparation. An unforgettable experience.", v: [3, 1] }
  ];
  var SEG_MS = 8000;

  /* ================= DOM ================= */
  var $ = function (id) { return document.getElementById(id); };
  var wrap = $("wrap"), stage = $("stage"), cv = $("bg");
  var hl = $("hl"), sub = $("sub"), hlBar = $("hlBar"), subBar = $("subBar");
  var bn = $("bn"), wipe = $("wipe"), prog = $("prog");
  var vids = [null, $("v1"), $("v2"), $("v3"), $("v4"), $("v5")];
  var sides = [null, $("s1"), $("s2"), $("s3"), $("s4"), $("s5")];

  SEGS.forEach(function () { prog.appendChild(document.createElement("i")); });

  /* ticker */
  (function () {
    var items = SEGS.map(function (s, i) { return i === 0 ? "Breaking: " + s.s : s.h; });
    var html = items.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    $("tk").innerHTML = html + html;
  })();

  /* clock (Lima) */
  function tickClock() {
    try { $("clock").textContent = "LIMA " + new Date().toLocaleTimeString("en-GB", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { $("clock").textContent = "LIMA"; }
  }
  tickClock(); setInterval(tickClock, 15000);

  /* ================= LAYOUT ================= */
  var scale = 1;
  function layout() {
    var fs = document.fullscreenElement === wrap;
    var gutter = 32;
    var availW = fs ? window.innerWidth : Math.min(document.documentElement.clientWidth - gutter, 1600);
    var availH = fs ? window.innerHeight : window.innerHeight - 78;
    scale = Math.max(.15, Math.min(availW / 1280, availH / 720));
    if (!fs) { wrap.style.width = Math.floor(1280 * scale) + "px"; wrap.style.height = Math.floor(720 * scale) + "px"; }
    var ox = ((fs ? window.innerWidth : wrap.clientWidth) - 1280 * scale) / 2;
    var oy = ((fs ? window.innerHeight : wrap.clientHeight) - 720 * scale) / 2;
    stage.style.transform = "translate(" + ox + "px," + oy + "px) scale(" + scale + ")";
  }
  window.addEventListener("resize", layout);
  document.addEventListener("fullscreenchange", layout);
  layout();

  /* ================= BACKGROUND CANVAS ================= */
  var Q = 1.5;
  cv.width = 1280 * Q; cv.height = 720 * Q;
  var cx = cv.getContext("2d");
  var mix = 1, mixTarget = 1;

  var DOTS = [];
  (function () {
    var N = 2200, ga = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      var lat = Math.asin(y), lon = th % (Math.PI * 2);
      var land = (Math.sin(lat * 3 + 1) * Math.cos(lon * 2) + Math.sin(lon * 5 + lat * 2) * .5 + Math.cos(lat * 7 + lon) * .3) > .3;
      if (!land && i % 3) continue;
      DOTS.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, land: land, hot: land && i % 97 === 0 });
    }
  })();
  var RINGS = [
    { r: 210, w: 26, len: 1.6, sp: .25, c: "28,79,216" },
    { r: 262, w: 9, len: 2.4, sp: -.18, c: "42,107,255" },
    { r: 330, w: 30, len: 1.2, sp: .12, c: "209,17,42" },
    { r: 400, w: 8, len: 3.4, sp: -.3, c: "27,63,160" },
    { r: 480, w: 34, len: 1.9, sp: .08, c: "20,42,122" },
    { r: 560, w: 12, len: 2.8, sp: -.1, c: "196,16,42" }
  ];
  function arc(x, y, r, a0, len, w, rgb, al) {
    cx.beginPath(); cx.arc(x, y, r, a0, a0 + len); cx.lineWidth = w; cx.strokeStyle = "rgba(" + rgb + "," + al + ")"; cx.lineCap = "butt"; cx.stroke();
  }
  function drawBg(ts) {
    var t = ts / 1000;
    mix += (mixTarget - mix) * .07;
    cx.setTransform(Q, 0, 0, Q, 0, 0);
    cx.fillStyle = "#040816"; cx.fillRect(0, 0, 1280, 720);

    var ring = 1 - mix * .62;
    var cX = 760 + mix * 150, cY = 370, k = 1 - mix * .18;
    RINGS.forEach(function (g, i) {
      arc(cX, cY, g.r * k, t * g.sp + i, g.len, g.w * k, g.c, .85 * ring);
      arc(cX, cY, g.r * k, t * g.sp + i + 3.4, g.len * .55, g.w * k * .6, g.c, .6 * ring);
    });
    cx.strokeStyle = "rgba(255,255,255," + (.18 * ring) + ")"; cx.lineWidth = 1.5;
    [250, 365, 520].forEach(function (r) { cx.beginPath(); cx.arc(cX, cY, r * k, 0, 6.2832); cx.stroke(); });

    var g1 = cx.createRadialGradient(40, 30, 0, 40, 30, 420);
    g1.addColorStop(0, "rgba(200,160,255," + (.55 * (1 - mix * .7)) + ")"); g1.addColorStop(1, "rgba(200,160,255,0)");
    cx.fillStyle = g1; cx.fillRect(0, 0, 1280, 720);
    var g2 = cx.createRadialGradient(1280, 720, 0, 1280, 720, 380);
    g2.addColorStop(0, "rgba(227,18,43," + (.28 * (1 - mix * .5)) + ")"); g2.addColorStop(1, "rgba(227,18,43,0)");
    cx.fillStyle = g2; cx.fillRect(0, 0, 1280, 720);

    if (mix > .02) {
      cx.globalAlpha = mix;
      /* grid */
      cx.strokeStyle = "rgba(60,120,255,.13)"; cx.lineWidth = 1;
      for (var gx = 0; gx <= 1280; gx += 64) { cx.beginPath(); cx.moveTo(gx, 0); cx.lineTo(gx, 720); cx.stroke(); }
      for (var gy = 0; gy <= 720; gy += 64) { cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(1280, gy); cx.stroke(); }
      /* globe */
      var gx0 = 900, gy0 = 360, R = 285, ang = t * .22, ca = Math.cos(ang), sa = Math.sin(ang), tilt = .35, ct = Math.cos(tilt), st = Math.sin(tilt);
      var halo = cx.createRadialGradient(gx0, gy0, R * .6, gx0, gy0, R * 1.35);
      halo.addColorStop(0, "rgba(40,100,255,.22)"); halo.addColorStop(1, "rgba(40,100,255,0)");
      cx.fillStyle = halo; cx.fillRect(gx0 - R * 1.5, gy0 - R * 1.5, R * 3, R * 3);
      for (var i = 0; i < DOTS.length; i++) {
        var d = DOTS[i];
        var x1 = d.x * ca + d.z * sa, z1 = -d.x * sa + d.z * ca;
        var y2 = d.y * ct - z1 * st, z2 = d.y * st + z1 * ct;
        var px = gx0 + x1 * R, py = gy0 - y2 * R;
        var front = z2 > 0;
        var a = front ? (d.land ? .95 : .3) : (d.land ? .22 : .08);
        var s = front ? (d.land ? 2.2 : 1.3) : 1.2;
        cx.fillStyle = d.hot && front ? "rgba(255,70,90," + a + ")" : "rgba(" + (d.land ? "130,195,255" : "70,120,255") + "," + a + ")";
        cx.fillRect(px - s / 2, py - s / 2, s, s);
      }
      /* orbit rings */
      cx.lineWidth = 2;
      cx.strokeStyle = "rgba(60,140,255,.85)"; cx.beginPath(); cx.ellipse(gx0, gy0, R * 1.2, R * .34, -.35, 0, 6.2832); cx.stroke();
      cx.strokeStyle = "rgba(227,18,43,.7)"; cx.beginPath(); cx.ellipse(gx0, gy0, R * 1.32, R * .5, .5, t * .4, t * .4 + 2.3); cx.stroke();
      cx.strokeStyle = "rgba(255,255,255,.25)"; cx.lineWidth = 1; cx.beginPath(); cx.arc(gx0, gy0, R * 1.08, 0, 6.2832); cx.stroke();
      /* HUD dials */
      cx.setLineDash([6, 8]);
      cx.strokeStyle = "rgba(60,140,255,.9)"; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(240, 540, 90, t * .6, t * .6 + 5); cx.stroke();
      cx.strokeStyle = "rgba(60,140,255,.5)"; cx.beginPath(); cx.arc(240, 540, 120, -t * .4, -t * .4 + 4); cx.stroke();
      cx.setLineDash([]);
      cx.strokeStyle = "rgba(60,140,255,.9)"; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(150, 150, 34, 0, 6.2832); cx.stroke();
      cx.beginPath(); cx.arc(215, 175, 24, 0, 6.2832); cx.stroke();
      cx.fillStyle = "rgba(160,200,255,.9)"; cx.font = "600 17px Barlow Condensed, Arial Narrow, sans-serif";
      cx.textAlign = "center"; cx.fillText(String(90 + Math.floor((t * 3) % 9)), 150, 156); cx.fillText(String(2 + Math.floor((t * 2) % 7)), 215, 181);
      cx.textAlign = "left";
      /* red bars */
      for (var b = 0; b < 8; b++) {
        var hgt = 30 + 36 * Math.abs(Math.sin(t * 1.3 + b * .9));
        cx.fillStyle = "rgba(227,18,43," + (.35 + b * .06) + ")"; cx.fillRect(330 + b * 12, 330 - hgt, 6, hgt);
      }
      cx.globalAlpha = 1;
    }
    requestAnimationFrame(drawBg);
  }
  requestAnimationFrame(drawBg);

  /* ================= AUDIO ================= */
  var soundOn = true, ac = null;

  /* ---- Música de fondo (archivo: audio/music.mp3) ---- */
  var MUSIC_VOL = 0.28;            /* volumen 0 a 1 */
  var music = document.getElementById("music"), fadeT = null;
  function fadeMusic(to, ms) {
    if (!music) return;
    clearInterval(fadeT);
    var from = music.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    fadeT = setInterval(function () {
      i++; music.volume = Math.max(0, Math.min(1, from + (to - from) * i / steps));
      if (i >= steps) clearInterval(fadeT);
    }, 50);
  }
  function startMusic() {
    if (!music) return;
    try {
      music.muted = !soundOn; music.volume = 0; music.currentTime = 0;
      var p = music.play(); if (p && p.catch) p.catch(function () {});
      fadeMusic(MUSIC_VOL, 2500);
    } catch (e) {}
  }
  function stopMusic(ms) {
    if (!music) return;
    fadeMusic(0, ms || 1500);
    setTimeout(function () { if (music.volume < 0.01) try { music.pause(); } catch (e) {} }, (ms || 1500) + 150);
  }
  function initAudio() {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (e) { ac = null; }
  }
  function jingle() {
    if (!ac || !soundOn) return;
    try {
      var t0 = ac.currentTime + .03, out = ac.createGain(); out.gain.value = .22; out.connect(ac.destination);
      var len = Math.floor(ac.sampleRate * 1.2), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var ns = ac.createBufferSource(); ns.buffer = buf;
      var bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(5000, t0 + .7);
      var ng = ac.createGain(); ng.gain.setValueAtTime(0.0001, t0); ng.gain.linearRampToValueAtTime(.7, t0 + .5); ng.gain.exponentialRampToValueAtTime(.001, t0 + 1.1);
      ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(t0);
      var seq = [[.55, 392, .16], [.75, 392, .16], [.95, 523.25, .3], [1.35, 392, .16], [1.55, 587.33, .3], [1.95, 783.99, 1.1]];
      seq.forEach(function (n) {
        [n[1], n[1] / 2].forEach(function (f, k) {
          var o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
          o.type = k ? "square" : "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = 2200;
          var s = t0 + n[0];
          g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(k ? .16 : .3, s + .015); g.gain.exponentialRampToValueAtTime(.001, s + n[2] + .25);
          o.connect(lp); lp.connect(g); g.connect(out); o.start(s); o.stop(s + n[2] + .3);
        });
      });
      var bo = ac.createOscillator(), bg = ac.createGain(); bo.type = "sine"; bo.frequency.value = 98;
      bg.gain.setValueAtTime(0.0001, t0 + .55); bg.gain.exponentialRampToValueAtTime(.7, t0 + .6); bg.gain.exponentialRampToValueAtTime(.001, t0 + 2.9);
      bo.connect(bg); bg.connect(out); bo.start(t0 + .55); bo.stop(t0 + 3);
    } catch (e) {}
  }

  /* ================= ENGINE ================= */
  var ABORT = {}, runId = 0;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function retrigger(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  var cur = { main: 0, side: 0 };
  function setVid(group, list, n) {
    var old = list[cur[group]], nv = list[n];
    if (cur[group] === n) return;
    try { nv.currentTime = 0; var p = nv.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    nv.classList.add("on");
    if (old) { old.classList.remove("on"); setTimeout(function () { if (list[cur[group]] !== old) try { old.pause(); } catch (e) {} }, 800); }
    cur[group] = n;
  }

  function fitHead() {
    var fs = 56; hl.style.fontSize = fs + "px";
    while (hl.scrollWidth > 770 && fs > 26) { fs -= 2; hl.style.fontSize = fs + "px"; }
    var f2 = 24; sub.style.fontSize = f2 + "px";
    while (sub.scrollWidth > 730 && f2 > 14) { f2 -= 1; sub.style.fontSize = f2 + "px"; }
  }
  function showSeg(s, i) {
    hl.textContent = s.h; sub.textContent = s.s; fitHead();
    retrigger(hlBar, "anim"); retrigger(subBar, "anim");
    $("pRole").textContent = "Story " + (i + 1) + " of " + SEGS.length;
    Array.prototype.forEach.call(prog.children, function (el, k) {
      el.className = k < i ? "done" : k === i ? "now" : "";
      if (k === i) { el.style.setProperty("--d", (SEG_MS / 1000) + "s"); }
    });
  }

  function setScene(which, title, tag) {
    stage.dataset.scene = which;
    mixTarget = which === "bn" ? 1 : 0;
    if (which === "bn") {
      $("bnTitle").textContent = title || "Breaking News";
      $("bnTag").textContent = tag || "";
      bn.classList.remove("play"); void bn.offsetWidth; bn.classList.add("play");
    }
  }
  async function wipeTo(which, title, tag, ok) {
    retrigger(wipe, "go");
    await sleep(480); ok();
    setScene(which, title, tag);
    await sleep(520); ok();
  }

  async function broadcast(opts) {
    opts = opts || {};
    var my = ++runId;
    function ok() { if (my !== runId) throw ABORT; }
    async function wait(ms) { await sleep(ms); ok(); }
    $("endOv").hidden = true; $("startOv").hidden = true;
    if (music) { clearInterval(fadeT); try { music.pause(); } catch (e) {} }
    try {
      if (!opts.skipIntro) {
        setScene("bn", "Breaking News", "Star News Tonight");
        jingle();
        await wait(5200);
        await wipeTo("studio", null, null, ok);
      } else { setScene("studio"); }
      startMusic();
      for (var si = (opts.from || 0); si < SEGS.length; si++) {
        var seg = SEGS[si];
        showSeg(seg, si);
        setVid("main", vids, seg.v[0]); setVid("side", sides, seg.v[1]);
        await wait(SEG_MS / 2);
        setVid("main", vids, seg.v[1]); setVid("side", sides, seg.v[0]);
        await wait(SEG_MS / 2);
      }
      fadeMusic(0.08, 800);
      await wipeTo("bn", "Breaking News", "That's all for tonight", ok);
      jingle();
      stopMusic(3000);
      await wait(2600);
      $("endOv").hidden = false;
    } catch (e) { if (e !== ABORT) console.error(e); }
  }

  /* ================= CONTROLS ================= */
  function syncSound() {
    $("snd").setAttribute("aria-pressed", String(soundOn));
    $("sndTxt").textContent = soundOn ? "Sound on" : "Sound off";
    $("sndIcon").innerHTML = soundOn
      ? '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'
      : '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>';
  }
  $("goVoice").addEventListener("click", function () { initAudio(); broadcast(); });
  $("again").addEventListener("click", function () { initAudio(); broadcast(); });
  $("restart").addEventListener("click", function () { initAudio(); broadcast(); });
  $("snd").addEventListener("click", function () { soundOn = !soundOn; syncSound(); if (soundOn) initAudio();
    if (music) { music.muted = !soundOn; if (soundOn && music.paused && stage.dataset.scene === "studio") startMusic(); } });
  $("fs").addEventListener("click", function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () {});
    } catch (e) {}
  });
  if (!document.fullscreenEnabled) $("fs").hidden = true;

  /* idle state: globe scene behind the start overlay */
  stage.dataset.scene = "bn"; mixTarget = 1;
  window.__news = { start: broadcast, skipTo: function (i) { soundOn = false; broadcast({ skipIntro: true, from: i }); } };
})();