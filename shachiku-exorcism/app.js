(() => {
  const DURATION_MS = 30000;
  const MAX_SPIRITS = 14;
  const BASE_SPAWN_MS = 2200;
  const MIN_SPAWN_MS = 550;

  const PHRASES = [
    "お世話になっております",
    "なるはやで",
    "一旦持ち帰ります",
    "善処します",
    "検討させてください",
    "認識の齟齬",
    "アジェンダ確認です",
    "シナジーを創出",
    "エビデンスは？",
    "ボールはそちらに",
    "スケジュール感",
    "先出しさせてください",
    "コンセンサス取ります",
    "フィックスします",
    "リスケお願いします",
    "ご確認ください",
    "想定内です",
    "リソースが足りず",
    "本件、クローズで",
    "ウィンウィンで",
  ];

  const RANKS = [
    { min: 0, rate: 0, comment: "浄化失敗。今日も残業の気配…" },
    { min: 3, rate: 18, comment: "微熱気味。まだ悪霊が息をしている。" },
    { min: 6, rate: 35, comment: "社畜見習い級。朝会は乗り越えられそう。" },
    { min: 10, rate: 52, comment: "中堅祓い師。週報の呪いを薄めた。" },
    { min: 15, rate: 68, comment: "デトックス成功。会議の亡霊が遠ざかる。" },
    { min: 22, rate: 84, comment: "上級エクソシスト。定時退社の光が見える。" },
    { min: 30, rate: 96, comment: "伝説の除霊。ストレスはほぼ蒸発。" },
    { min: 40, rate: 100, comment: "完全浄化。明日の自分に花束を。" },
  ];

  const els = {
    hud: document.getElementById("hud"),
    timer: document.getElementById("timer"),
    score: document.getElementById("score"),
    stage: document.getElementById("stage"),
    spirits: document.getElementById("spirits"),
    fx: document.getElementById("fx"),
    start: document.getElementById("screen-start"),
    result: document.getElementById("screen-result"),
    purify: document.getElementById("purify"),
    rank: document.getElementById("rank"),
    resultScore: document.getElementById("result-score"),
    btnStart: document.getElementById("btn-start"),
    btnRetry: document.getElementById("btn-retry"),
  };

  const ctx = els.fx.getContext("2d");

  /** @type {{
   *  id: number,
   *  el: HTMLElement,
   *  hp: number,
   *  maxHp: number,
   *  x: number,
   *  y: number,
   *  vx: number,
   *  vy: number,
   *  phrase: string
   * }[]} */
  let spirits = [];
  /** @type {{ x: number, y: number, vx: number, vy: number, life: number, color: string, size: number }[]} */
  let particles = [];
  let nextId = 1;
  let score = 0;
  let playing = false;
  let targetedId = null;
  let startTime = 0;
  let lastFrame = 0;
  let spawnAcc = 0;
  let spawnInterval = BASE_SPAWN_MS;
  let raf = 0;
  let endTimer = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickPhrase() {
    return PHRASES[(Math.random() * PHRASES.length) | 0];
  }

  function stageSize() {
    return {
      w: els.stage.clientWidth,
      h: els.stage.clientHeight,
    };
  }

  function resizeCanvas() {
    const { w, h } = stageSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.fx.width = Math.max(1, Math.floor(w * dpr));
    els.fx.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setTarget(id) {
    targetedId = id;
    for (const s of spirits) {
      s.el.classList.toggle("targeted", s.id === id);
    }
  }

  function updateHud(remainMs) {
    const sec = Math.max(0, Math.ceil(remainMs / 1000));
    els.timer.textContent = String(sec);
    els.timer.classList.toggle("warn", sec <= 5);
    els.score.textContent = `除霊 ${score}`;
  }

  function hpForPhrase(phrase) {
    const base = 2 + Math.min(3, Math.floor(phrase.length / 6));
    return base + ((Math.random() * 2) | 0);
  }

  function spawnSpirit() {
    if (!playing || spirits.length >= MAX_SPIRITS) return;

    const { w, h } = stageSize();
    const phrase = pickPhrase();
    const maxHp = hpForPhrase(phrase);
    const el = document.createElement("div");
    el.className = "spirit";
    el.setAttribute("role", "button");
    el.tabIndex = -1;
    el.style.animationDelay = `${rand(0, 2.5).toFixed(2)}s`;
    el.innerHTML = `${phrase}<span class="hp" aria-hidden="true"><i></i></span>`;

    const padX = Math.min(120, w * 0.28);
    const padY = Math.min(60, h * 0.18);
    const x = rand(padX, Math.max(padX + 1, w - padX));
    const y = rand(padY + 20, Math.max(padY + 21, h - padY));
    const speed = rand(18, 42);
    const angle = rand(0, Math.PI * 2);

    const spirit = {
      id: nextId++,
      el,
      hp: maxHp,
      maxHp,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      phrase,
    };

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!playing) return;
      hitSpirit(spirit, true);
    });

    els.spirits.appendChild(el);
    spirits.push(spirit);
    if (targetedId == null) setTarget(spirit.id);
    updateHpBar(spirit);
  }

  function updateHpBar(spirit) {
    const bar = spirit.el.querySelector(".hp > i");
    if (bar) {
      bar.style.transform = `scaleX(${Math.max(0, spirit.hp / spirit.maxHp)})`;
    }
  }

  function burst(x, y, kind) {
    const count = kind === "kill" ? 22 + ((Math.random() * 12) | 0) : 6 + ((Math.random() * 4) | 0);
    const hot = kind === "kill";
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = hot ? rand(70, 240) : rand(40, 120);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: hot ? rand(0.35, 0.75) : rand(0.18, 0.35),
        color: hot
          ? `hsla(${rand(38, 52)}, 70%, ${rand(55, 72)}%, 1)`
          : `hsla(${rand(140, 165)}, 45%, ${rand(55, 70)}%, 1)`,
        size: hot ? rand(2, 5.5) : rand(1.5, 3.2),
      });
    }
  }

  function removeSpirit(spirit) {
    spirit.el.remove();
    spirits = spirits.filter((s) => s.id !== spirit.id);
    if (targetedId === spirit.id) {
      targetedId = spirits.length ? spirits[0].id : null;
      setTarget(targetedId);
    }
  }

  function hitSpirit(spirit, fromTap) {
    if (!playing || spirit.hp <= 0) return;
    if (fromTap) setTarget(spirit.id);

    spirit.hp -= 1;
    updateHpBar(spirit);
    spirit.el.style.filter = "brightness(1.45)";
    window.setTimeout(() => {
      if (spirit.el.isConnected) spirit.el.style.filter = "";
    }, 70);

    if (spirit.hp <= 0) {
      burst(spirit.x, spirit.y, "kill");
      score += 1;
      updateHud(DURATION_MS - (performance.now() - startTime));
      removeSpirit(spirit);
    } else {
      burst(spirit.x, spirit.y, "hit");
    }
  }

  function hitTargeted() {
    let spirit = spirits.find((s) => s.id === targetedId);
    if (!spirit && spirits.length) {
      spirit = spirits[0];
      setTarget(spirit.id);
    }
    if (spirit) hitSpirit(spirit, false);
  }

  function moveSpirits(dt) {
    const { w, h } = stageSize();
    const margin = 8;
    for (const s of spirits) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      const halfW = Math.min(s.el.offsetWidth / 2, w * 0.4);
      const halfH = Math.min(s.el.offsetHeight / 2, h * 0.25);
      if (s.x < halfW + margin) {
        s.x = halfW + margin;
        s.vx = Math.abs(s.vx);
      } else if (s.x > w - halfW - margin) {
        s.x = w - halfW - margin;
        s.vx = -Math.abs(s.vx);
      }
      if (s.y < halfH + margin) {
        s.y = halfH + margin;
        s.vy = Math.abs(s.vy);
      } else if (s.y > h - halfH - margin) {
        s.y = h - halfH - margin;
        s.vy = -Math.abs(s.vy);
      }

      if (Math.random() < 0.01) {
        s.vx += rand(-12, 12);
        s.vy += rand(-12, 12);
        const sp = Math.hypot(s.vx, s.vy) || 1;
        const cap = 55;
        if (sp > cap) {
          s.vx = (s.vx / sp) * cap;
          s.vy = (s.vy / sp) * cap;
        }
      }

      s.el.style.left = `${s.x}px`;
      s.el.style.top = `${s.y}px`;
    }
  }

  function drawParticles(dt) {
    const { w, h } = stageSize();
    ctx.clearRect(0, 0, w, h);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.vx *= 0.98;
      ctx.globalAlpha = Math.max(0, p.life * 1.4);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function currentSpawnInterval(elapsed) {
    const t = Math.min(1, elapsed / DURATION_MS);
    return BASE_SPAWN_MS - (BASE_SPAWN_MS - MIN_SPAWN_MS) * (t * t);
  }

  function tick(now) {
    if (!playing) return;
    const elapsed = now - startTime;
    const remain = DURATION_MS - elapsed;
    if (remain <= 0) {
      endGame();
      return;
    }

    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    spawnInterval = currentSpawnInterval(elapsed);
    spawnAcc += dt * 1000;
    while (spawnAcc >= spawnInterval) {
      spawnAcc -= spawnInterval;
      spawnSpirit();
    }

    moveSpirits(dt);
    drawParticles(dt);
    updateHud(remain);
    raf = requestAnimationFrame(tick);
  }

  function clearBoard() {
    cancelAnimationFrame(raf);
    window.clearTimeout(endTimer);
    for (const s of spirits) s.el.remove();
    spirits = [];
    particles = [];
    targetedId = null;
    nextId = 1;
    ctx.clearRect(0, 0, els.stage.clientWidth, els.stage.clientHeight);
  }

  function rankFor(scoreValue) {
    let chosen = RANKS[0];
    for (const r of RANKS) {
      if (scoreValue >= r.min) chosen = r;
    }
    return chosen;
  }

  function endGame() {
    playing = false;
    cancelAnimationFrame(raf);
    window.clearTimeout(endTimer);
    updateHud(0);

    for (const s of spirits) s.el.remove();
    spirits = [];
    targetedId = null;
    particles = [];
    const { w, h } = stageSize();
    ctx.clearRect(0, 0, w, h);

    const rank = rankFor(score);
    els.purify.textContent = `${rank.rate}%`;
    els.rank.textContent = rank.comment;
    els.resultScore.textContent = `除霊数 ${score}`;

    els.hud.hidden = true;
    els.result.hidden = false;
  }

  function startGame() {
    clearBoard();
    score = 0;
    playing = true;
    spawnAcc = 0;
    spawnInterval = BASE_SPAWN_MS;

    els.start.hidden = true;
    els.result.hidden = true;
    els.hud.hidden = false;
    resizeCanvas();
    updateHud(DURATION_MS);

    spawnSpirit();
    spawnSpirit();
    if (stageSize().w > 520) spawnSpirit();

    startTime = performance.now();
    lastFrame = startTime;
    raf = requestAnimationFrame(tick);
    endTimer = window.setTimeout(() => {
      if (playing) endGame();
    }, DURATION_MS + 30);
  }

  function onKey(e) {
    if (!playing) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Tab" || e.key === "Escape") return;
    if (e.repeat) return;
    e.preventDefault();
    hitTargeted();
  }

  els.btnStart.addEventListener("click", startGame);
  els.btnRetry.addEventListener("click", startGame);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (!playing && els.result.hidden && !els.start.hidden) return;
    resizeCanvas();
  });

  resizeCanvas();
})();
