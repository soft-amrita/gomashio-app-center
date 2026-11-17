(() => {
  const COLS = 8;
  const ROWS = 8;
  const TOTAL = COLS * ROWS;
  const REVIVE_MS = 900;
  const RARE_CHANCE = 0.01;
  const RARE_TYPES = ["heart", "gold", "boom"];

  const RANKS = [
    { min: 0, name: "見習い梱包員" },
    { min: 100, name: "梱包職人" },
    { min: 500, name: "気泡ハンター" },
    { min: 1000, name: "気泡の破壊神" },
    { min: 3000, name: "虚無の支配者" },
    { min: 10000, name: "無限梱包の化身" },
  ];

  const gridEl = document.getElementById("grid");
  const countEl = document.getElementById("count");
  const rankEl = document.getElementById("rank");

  /** @type {{ el: HTMLButtonElement, popped: boolean, rare: string|null, timer: number|null }[]} */
  const cells = [];
  let popCount = 0;
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playPop(kind) {
    const ctx = ensureAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = kind === "boom" ? 0.12 : kind === "gold" ? 0.09 : 0.055;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.pow(1 - t, kind === "boom" ? 1.4 : 2.8);
      const noise = (Math.random() * 2 - 1) * envelope;
      const click = Math.sin(2 * Math.PI * (kind === "gold" ? 980 : 620) * t) * envelope * 0.35;
      data[i] = noise * 0.7 + click;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = kind === "boom" ? 420 : kind === "heart" ? 900 : 700;
    filter.Q.value = kind === "boom" ? 0.7 : 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(kind === "boom" ? 0.55 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  function vibrate(kind) {
    if (!navigator.vibrate) return;
    if (kind === "boom") {
      navigator.vibrate([18, 30, 18, 30, 24]);
    } else if (kind === "gold") {
      navigator.vibrate([12, 20, 12]);
    } else {
      navigator.vibrate(10);
    }
  }

  function pickRare() {
    if (Math.random() >= RARE_CHANCE) return null;
    return RARE_TYPES[(Math.random() * RARE_TYPES.length) | 0];
  }

  function applyRareVisual(cell) {
    const { el, rare } = cell;
    el.classList.remove("rare-heart", "rare-gold", "rare-boom");
    const old = el.querySelector(".glyph");
    if (old) old.remove();

    if (rare === "heart") {
      el.classList.add("rare-heart");
      const glyph = document.createElement("span");
      glyph.className = "glyph";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = "❤️";
      el.appendChild(glyph);
    } else if (rare === "gold") {
      el.classList.add("rare-gold");
    } else if (rare === "boom") {
      el.classList.add("rare-boom");
    }
  }

  function resetCell(cell, animate) {
    if (cell.timer != null) {
      clearTimeout(cell.timer);
      cell.timer = null;
    }
    cell.popped = false;
    cell.rare = pickRare();
    cell.el.classList.remove("popped", "flash");
    cell.el.disabled = false;
    cell.el.setAttribute("aria-pressed", "false");
    applyRareVisual(cell);
    if (animate) {
      cell.el.classList.add("reviving");
      window.setTimeout(() => cell.el.classList.remove("reviving"), 360);
    }
  }

  function rankFor(n) {
    let name = RANKS[0].name;
    for (const r of RANKS) {
      if (n >= r.min) name = r.name;
    }
    return name;
  }

  function updateHud() {
    countEl.textContent = String(popCount);
    rankEl.textContent = rankFor(popCount);
  }

  function neighbors(index) {
    const c = index % COLS;
    const r = (index / COLS) | 0;
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        out.push(nr * COLS + nc);
      }
    }
    return out;
  }

  function scheduleRevive(cell) {
    if (cell.timer != null) clearTimeout(cell.timer);
    cell.timer = window.setTimeout(() => {
      cell.timer = null;
      resetCell(cell, true);
    }, REVIVE_MS);
  }

  /**
   * @param {number} index
   * @param {{ fromBoom?: boolean, silent?: boolean }} [opts]
   */
  function popAt(index, opts = {}) {
    const cell = cells[index];
    if (!cell || cell.popped) return false;

    const rare = cell.rare;
    cell.popped = true;
    cell.el.classList.add("popped", "flash");
    cell.el.disabled = true;
    cell.el.setAttribute("aria-pressed", "true");
    cell.el.classList.remove("rare-heart", "rare-gold", "rare-boom", "reviving");
    const glyph = cell.el.querySelector(".glyph");
    if (glyph) glyph.remove();

    popCount += 1;
    updateHud();

    if (!opts.silent) {
      const soundKind = opts.fromBoom ? "normal" : rare || "normal";
      playPop(soundKind === "boom" ? "boom" : soundKind);
      vibrate(rare === "boom" && !opts.fromBoom ? "boom" : rare || "normal");
    }

    scheduleRevive(cell);

    if (rare === "boom" && !opts.fromBoom) {
      for (const ni of neighbors(index)) {
        popAt(ni, { fromBoom: true, silent: true });
      }
      playPop("boom");
      vibrate("boom");
    }

    return true;
  }

  function onActivate(e) {
    const btn = e.target.closest(".bubble");
    if (!btn || !gridEl.contains(btn)) return;
    if (e.type === "pointerdown" && e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    ensureAudio();
    const index = Number(btn.dataset.index);
    popAt(index);
  }

  function build() {
    gridEl.style.setProperty("--cols", String(COLS));
    gridEl.innerHTML = "";
    cells.length = 0;

    for (let i = 0; i < TOTAL; i++) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "bubble";
      el.dataset.index = String(i);
      el.setAttribute("role", "gridcell");
      el.setAttribute("aria-label", `気泡 ${i + 1}`);
      el.setAttribute("aria-pressed", "false");

      const cell = { el, popped: false, rare: null, timer: null };
      resetCell(cell, false);
      cells.push(cell);
      gridEl.appendChild(el);
    }
  }

  // pointerdown: 即反応 / click: キーボード操作（pointer後の二重押しはpoppedで無視）
  gridEl.addEventListener("pointerdown", onActivate);
  gridEl.addEventListener("click", onActivate);
  build();
  updateHud();
})();
