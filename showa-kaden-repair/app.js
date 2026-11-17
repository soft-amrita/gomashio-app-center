(() => {
  "use strict";

  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d", { alpha: false });
  const cabinet = document.getElementById("tv-cabinet");
  const clarityFill = document.getElementById("clarity-fill");
  const clarityValue = document.getElementById("clarity-value");
  const clarityBar = document.getElementById("clarity-bar");
  const hintEl = document.getElementById("hint");
  const clearOverlay = document.getElementById("clear-overlay");
  const retryBtn = document.getElementById("retry-btn");

  const W = canvas.width;
  const H = canvas.height;

  /** スイートスポット（正規化座標）— 右上寄り */
  const SWEET = { x: 0.78, y: 0.22, radius: 0.28 };
  /** 理想の強さレンジ */
  const IDEAL_STRENGTH = { min: 0.35, max: 0.72 };

  const state = {
    clarity: 0,
    cleared: false,
    clearing: false,
    revealUntil: 0,
    revealLen: 400,
    warpUntil: 0,
    warpAmp: 0,
    lastHint: "",
    cmStart: 0,
    pointer: null,
    audioReady: false,
  };

  let audioCtx = null;
  const noiseBuf = new Uint8ClampedArray(W * H * 4);
  const frameBuf = new Uint8ClampedArray(W * H * 4);
  const warpBuf = new Uint8ClampedArray(W * H * 4);
  const frameImage = new ImageData(frameBuf, W, H);
  const warpImage = new ImageData(warpBuf, W, H);
  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const og = offscreen.getContext("2d", { alpha: false });
  let lastFrame = 0;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    state.audioReady = true;
    return audioCtx;
  }

  function playBang(strength) {
    const ac = ensureAudio();
    if (!ac) return;
    const t = ac.currentTime;
    const dur = 0.08 + strength * 0.06;

    const bufferSize = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.2);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400 + strength * 900;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.55 + strength * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(t);
    src.stop(t + dur + 0.02);

    // 低音の「ドン」
    const osc = ac.createOscillator();
    const thump = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90 + strength * 40, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    thump.gain.setValueAtTime(0.35 + strength * 0.2, t);
    thump.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(thump);
    thump.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  function playStatic(duration) {
    const ac = ensureAudio();
    if (!ac) return;
    const t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.6;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  function setClarity(v) {
    state.clarity = clamp(v, 0, 100);
    const pct = Math.round(state.clarity);
    clarityFill.style.width = pct + "%";
    clarityValue.textContent = String(pct);
    clarityBar.setAttribute("aria-valuenow", String(pct));
  }

  function setHint(msg) {
    if (msg === state.lastHint) return;
    state.lastHint = msg;
    hintEl.textContent = msg;
  }

  function distToSweet(nx, ny) {
    const dx = nx - SWEET.x;
    const dy = ny - SWEET.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function scoreHit(nx, ny, strength) {
    const d = distToSweet(nx, ny);
    const spot = clamp(1 - d / SWEET.radius, 0, 1);

    let strengthScore;
    if (strength < 0.18) {
      strengthScore = -0.7;
    } else if (strength > 0.92) {
      strengthScore = -0.85;
    } else if (strength < IDEAL_STRENGTH.min) {
      strengthScore = (strength - 0.18) / (IDEAL_STRENGTH.min - 0.18) * 0.55 - 0.15;
    } else if (strength > IDEAL_STRENGTH.max) {
      strengthScore = 1 - (strength - IDEAL_STRENGTH.max) / (0.92 - IDEAL_STRENGTH.max);
      strengthScore = strengthScore * 0.4 - 0.2;
    } else {
      const mid = (IDEAL_STRENGTH.min + IDEAL_STRENGTH.max) / 2;
      const half = (IDEAL_STRENGTH.max - IDEAL_STRENGTH.min) / 2;
      strengthScore = 1 - Math.abs(strength - mid) / half * 0.25;
    }

    const combo = spot * 0.65 + Math.max(0, strengthScore) * 0.35;
    let delta;

    if (strengthScore < 0 && spot < 0.35) {
      delta = -4 - Math.random() * 4;
      setHint("弱い／強すぎ、位置も外れ気味… 映りが悪化");
    } else if (strengthScore < 0) {
      delta = -2 - Math.random() * 5;
      setHint(strength < 0.18 ? "弱すぎ！もっとしっかり叩いて" : "強すぎ！ブラウン管が悲鳴を上げた");
    } else if (spot < 0.2) {
      delta = -1 + Math.random() * 3;
      setHint("位置が遠い。右上のあたりを狙って");
    } else if (combo > 0.75) {
      delta = 8 + Math.random() * 7 + spot * 4;
      setHint("いい感じ！映像が安定してきた");
    } else if (combo > 0.45) {
      delta = 4 + Math.random() * 5;
      setHint("効いてる。もう少し右上寄りで");
    } else {
      delta = 1 + Math.random() * 3;
      setHint("少し映った。強さと位置を調整して");
    }

    return { delta, spot, strengthScore, combo };
  }

  function revealDurationMs() {
    const c = state.clarity;
    return 180 + c * 18 + (c > 70 ? (c - 70) * 12 : 0);
  }

  function applyHit(nx, ny, strength) {
    if (state.cleared || state.clearing) return;

    ensureAudio();
    playBang(strength);
    playStatic(0.12 + strength * 0.1);

    const { delta } = scoreHit(nx, ny, strength);
    setClarity(state.clarity + delta);

    const now = performance.now();
    state.revealLen = revealDurationMs();
    state.revealUntil = now + state.revealLen;
    state.warpUntil = now + 280 + strength * 200;
    state.warpAmp = 4 + strength * 14;

    cabinet.classList.remove("shake");
    void cabinet.offsetWidth;
    cabinet.classList.add("shake");

    if (state.clarity >= 100) {
      beginClear();
    }
  }

  function beginClear() {
    state.clearing = true;
    state.cmStart = performance.now();
    state.revealUntil = state.cmStart + 5500;
    setHint("映像が完全に戻った！");
    playBang(0.8);
    setTimeout(() => playStatic(0.4), 200);
    setTimeout(() => {
      state.cleared = true;
      state.clearing = false;
      clearOverlay.hidden = false;
    }, 5200);
  }

  function resetGame() {
    state.cleared = false;
    state.clearing = false;
    state.revealUntil = 0;
    state.warpUntil = 0;
    state.warpAmp = 0;
    state.cmStart = 0;
    clearOverlay.hidden = true;
    setClarity(0);
    setHint("右上あたりを、ほどよい強さで叩いてみよう");
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x, y, nx: x / W, ny: y / H };
  }

  function fillNoise() {
    for (let i = 0; i < noiseBuf.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      noiseBuf[i] = v;
      noiseBuf[i + 1] = v;
      noiseBuf[i + 2] = v;
      noiseBuf[i + 3] = 255;
    }
  }

  function drawTestPattern(g, alpha, t) {
    g.save();
    g.globalAlpha = alpha;

    // カラーバー
    const bars = ["#fff", "#ff0", "#0ff", "#0f0", "#f0f", "#f00", "#00f", "#000"];
    const bw = W / bars.length;
    for (let i = 0; i < bars.length; i++) {
      g.fillStyle = bars[i];
      g.fillRect(i * bw, 0, bw + 1, H * 0.55);
    }

    // 下帯グレー
    const greys = [0.9, 0.7, 0.5, 0.3, 0.15, 0.05];
    const gw = W / greys.length;
    for (let i = 0; i < greys.length; i++) {
      const v = (greys[i] * 255) | 0;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(i * gw, H * 0.55, gw + 1, H * 0.2);
    }

    // 円と十字
    g.strokeStyle = "#fff";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(W * 0.5, H * 0.38, H * 0.16, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(W * 0.5 - 40, H * 0.38);
    g.lineTo(W * 0.5 + 40, H * 0.38);
    g.moveTo(W * 0.5, H * 0.38 - 40);
    g.lineTo(W * 0.5, H * 0.38 + 40);
    g.stroke();

    // 架空CMテキスト
    g.fillStyle = "#111";
    g.fillRect(0, H * 0.75, W, H * 0.25);
    g.fillStyle = "#f5e6c8";
    g.font = "bold 22px serif";
    g.textAlign = "center";
    const msgs = [
      "テストパターン · NHKもどき",
      "ごましお電器｜新製品！",
      "ブラウン管に愛を込めて",
      "昭和55年風 · 架空CM",
    ];
    const idx = Math.floor(t / 1800) % msgs.length;
    g.fillText(msgs[idx], W / 2, H * 0.84);
    g.font = "14px sans-serif";
    g.fillStyle = "#c9a227";
    g.fillText("SIGNAL " + Math.round(state.clarity) + "%", W / 2, H * 0.93);

    g.restore();
  }

  function drawRetroScene(g, alpha, t) {
    g.save();
    g.globalAlpha = alpha;

    // 空と山
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a3a5c");
    sky.addColorStop(0.55, "#c45c3a");
    sky.addColorStop(1, "#e8b86d");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    g.fillStyle = "#2a4030";
    g.beginPath();
    g.moveTo(0, H * 0.62);
    g.lineTo(W * 0.25, H * 0.42);
    g.lineTo(W * 0.45, H * 0.58);
    g.lineTo(W * 0.7, H * 0.38);
    g.lineTo(W, H * 0.55);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.closePath();
    g.fill();

    // 太陽
    g.fillStyle = "#f0d060";
    g.beginPath();
    g.arc(W * 0.78, H * 0.28, 28 + Math.sin(t / 400) * 2, 0, Math.PI * 2);
    g.fill();

    // 家
    g.fillStyle = "#6b3a2a";
    g.fillRect(W * 0.18, H * 0.58, 70, 50);
    g.fillStyle = "#3a2018";
    g.beginPath();
    g.moveTo(W * 0.15, H * 0.58);
    g.lineTo(W * 0.18 + 35, H * 0.48);
    g.lineTo(W * 0.18 + 75, H * 0.58);
    g.closePath();
    g.fill();

    g.fillStyle = "#f5e6c8";
    g.font = "bold 20px serif";
    g.textAlign = "center";
    g.fillText("夕焼けテレビ劇場", W / 2, H * 0.18);
    g.font = "13px sans-serif";
    g.fillText("チャンネルは合ってるはず…", W / 2, H * 0.26);

    g.restore();
  }

  function drawClearCM(g, elapsed) {
    const phase = elapsed / 5200;
    g.fillStyle = "#0a0806";
    g.fillRect(0, 0, W, H);

    // ロゴ風図形
    const pulse = 1 + Math.sin(elapsed / 180) * 0.04;
    g.save();
    g.translate(W / 2, H * 0.38);
    g.scale(pulse, pulse);

    g.fillStyle = "#c45c3a";
    g.beginPath();
    g.moveTo(0, -55);
    g.lineTo(60, 35);
    g.lineTo(-60, 35);
    g.closePath();
    g.fill();

    g.fillStyle = "#f5e6c8";
    g.beginPath();
    g.arc(0, 5, 22, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#1a1410";
    g.font = "bold 16px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("昭", 0, 5);
    g.restore();

    g.fillStyle = "#f5e6c8";
    g.font = "bold 28px serif";
    g.textAlign = "center";
    const titleOpacity = clamp((elapsed - 400) / 600, 0, 1);
    g.globalAlpha = titleOpacity;
    g.fillText("ごましお電器プレゼンツ", W / 2, H * 0.62);

    g.font = "18px sans-serif";
    g.fillStyle = "#d4a017";
    const subOpacity = clamp((elapsed - 1200) / 500, 0, 1);
    g.globalAlpha = subOpacity;
    g.fillText("『たたけば映る』新感覚ブラウン管", W / 2, H * 0.72);

    g.font = "14px sans-serif";
    g.fillStyle = "#c4b8a4";
    const tagOpacity = clamp((elapsed - 2200) / 500, 0, 1);
    g.globalAlpha = tagOpacity;
    g.fillText("※架空の昭和風CMです", W / 2, H * 0.82);

    if (phase > 0.72) {
      g.globalAlpha = clamp((phase - 0.72) / 0.15, 0, 1);
      g.fillStyle = "#4ec9a8";
      g.font = "bold 32px serif";
      g.fillText("修理完了", W / 2, H * 0.9);
    }

    g.globalAlpha = 1;

    // 走査線風
    g.fillStyle = "rgba(0,0,0,0.15)";
    for (let y = 0; y < H; y += 3) {
      g.fillRect(0, y, W, 1);
    }
  }

  function applyWarp(src, out, amp, t) {
    const shift = Math.sin(t / 40) * amp;
    for (let y = 0; y < H; y++) {
      const rowShift = (Math.sin(y * 0.08 + t / 30) * amp + shift) | 0;
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const sx = clamp(x + rowShift, 0, W - 1);
        const si = (row + sx) * 4;
        const di = (row + x) * 4;
        out[di] = src[si];
        out[di + 1] = src[si + 1];
        out[di + 2] = src[si + 2];
        out[di + 3] = 255;
      }
    }
  }

  function render(now) {
    const t = now;
    const revealing = t < state.revealUntil;
    const warping = t < state.warpUntil;
    const clarityNorm = state.clarity / 100;

    if (state.clearing) {
      drawClearCM(ctx, t - state.cmStart);
      requestAnimationFrame(render);
      return;
    }

    if (state.cleared) {
      drawClearCM(ctx, 5200);
      requestAnimationFrame(render);
      return;
    }

    if (t - lastFrame > 28) {
      fillNoise();
      lastFrame = t;
      const damp = 1 - clarityNorm * 0.35;
      for (let i = 0; i < noiseBuf.length; i += 4) {
        frameBuf[i] = (noiseBuf[i] * damp) | 0;
        frameBuf[i + 1] = (noiseBuf[i + 1] * damp) | 0;
        frameBuf[i + 2] = (noiseBuf[i + 2] * damp) | 0;
        frameBuf[i + 3] = 255;
      }
    }

    if (warping) {
      const remain = clamp((state.warpUntil - t) / 400, 0, 1);
      applyWarp(frameBuf, warpBuf, state.warpAmp * remain, t);
      ctx.putImageData(warpImage, 0, 0);
    } else {
      ctx.putImageData(frameImage, 0, 0);
    }

    const showScene = revealing || clarityNorm > 0.88;
    if (showScene) {
      if (clarityNorm < 0.45) {
        drawTestPattern(og, 1, t);
      } else {
        drawRetroScene(og, 1, t);
      }

      let alpha;
      if (revealing) {
        const life = clamp(
          (state.revealUntil - t) / Math.max(200, state.revealLen * 0.85),
          0,
          1
        );
        alpha = life * (0.22 + clarityNorm * 0.78);
      } else {
        alpha = ((clarityNorm - 0.88) / 0.12) * 0.22;
      }

      const ox = warping ? Math.sin(t / 25) * state.warpAmp * 0.35 : 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(offscreen, ox, 0);
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  // ポインタ操作
  function onPointerDown(e) {
    if (state.cleared || state.clearing) return;
    e.preventDefault();
    ensureAudio();
    const p = canvasPos(e);
    state.pointer = {
      id: e.pointerId,
      x: p.x,
      y: p.y,
      nx: p.nx,
      ny: p.ny,
      t: performance.now(),
      maxSpeed: 0,
      lastX: p.x,
      lastY: p.y,
      lastT: performance.now(),
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
  }

  function onPointerMove(e) {
    const ptr = state.pointer;
    if (!ptr || ptr.id !== e.pointerId) return;
    e.preventDefault();
    const p = canvasPos(e);
    const now = performance.now();
    const dt = Math.max(1, now - ptr.lastT);
    const dx = p.x - ptr.lastX;
    const dy = p.y - ptr.lastY;
    const speed = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms
    ptr.maxSpeed = Math.max(ptr.maxSpeed, speed);
    ptr.lastX = p.x;
    ptr.lastY = p.y;
    ptr.lastT = now;
    ptr.nx = p.nx;
    ptr.ny = p.ny;
  }

  function onPointerUp(e) {
    const ptr = state.pointer;
    if (!ptr || ptr.id !== e.pointerId) return;
    e.preventDefault();
    const p = canvasPos(e);
    const now = performance.now();
    const hold = now - ptr.t;

    // スワイプ速度 or タップの短さから強さを算出
    let strength;
    if (ptr.maxSpeed > 0.15) {
      strength = clamp(ptr.maxSpeed / 2.2, 0, 1);
    } else {
      // タップ：短く鋭いほどやや強め、長押しは弱め
      strength = clamp(0.55 - (hold - 80) / 600, 0.12, 0.7);
    }

    applyHit(p.nx, p.ny, strength);
    state.pointer = null;
  }

  function onPointerCancel() {
    state.pointer = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  retryBtn.addEventListener("click", () => {
    ensureAudio();
    resetGame();
  });

  setClarity(0);
  setHint("右上あたりを、ほどよい強さで叩いてみよう");
  requestAnimationFrame(render);
})();
