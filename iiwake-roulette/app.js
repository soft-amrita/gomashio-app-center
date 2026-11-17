(() => {
  const REELS = [
    {
      label: "誰が",
      words: [
        "電車が",
        "上司が",
        "猫が",
        "アラームが",
        "信号が",
        "スマホが",
        "隣の席の人が",
        "天気予報が",
        "エレベーターが",
        "財布が",
      ],
    },
    {
      label: "何をして",
      words: [
        "止まって",
        "捕まって",
        "寝坊して",
        "壊れて",
        "迷子になって",
        "暴走して",
        "消えて",
        "渋滞して",
        "電池切れして",
        "爆発して",
      ],
    },
    {
      label: "どうなった",
      words: [
        "遅れます",
        "行けなくなりました",
        "少し遅れそうです",
        "本日欠席します",
        "到着が遅れます",
        "参加できません",
        "遅刻確定です",
        "明日出社します",
        "至急対応中です",
        "申し訳ありませんが遅れます",
      ],
    },
  ];

  const JACKPOT_EXCUSE =
    "人命救助のため救急隊に協力しており、到着が遅れます。必ず許されます。";

  const ITEM_H = () =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--reel-h")) || 64;

  const strips = REELS.map((_, i) => document.getElementById(`strip${i}`));
  const stopBtns = REELS.map((_, i) => document.getElementById(`stop${i}`));
  const windows = [...document.querySelectorAll(".reel-window")];
  const startBtn = document.getElementById("startBtn");
  const resultEl = document.getElementById("result");
  const excuseEl = document.getElementById("excuse");
  const sincerityEl = document.getElementById("sincerity");
  const apologyEl = document.getElementById("apology");
  const copyBtn = document.getElementById("copyBtn");
  const copyFeedback = document.getElementById("copyFeedback");
  const jackpotEl = document.getElementById("jackpot");
  const jackpotExcuse = document.getElementById("jackpotExcuse");
  const jackpotApology = document.getElementById("jackpotApology");
  const jackpotCopyBtn = document.getElementById("jackpotCopyBtn");
  const jackpotCopyFeedback = document.getElementById("jackpotCopyFeedback");
  const againBtn = document.getElementById("againBtn");
  const flashEl = document.getElementById("flash");

  const state = {
    spinning: [false, false, false],
    offsets: [0, 0, 0],
    speeds: [0, 0, 0],
    results: [0, 0, 0],
    raf: null,
    busy: false,
    settled: false,
  };

  const LOOPS = 12;

  function buildStrips() {
    const h = ITEM_H();
    REELS.forEach((reel, i) => {
      const strip = strips[i];
      strip.innerHTML = "";
      const frag = document.createDocumentFragment();
      for (let loop = 0; loop < LOOPS; loop += 1) {
        reel.words.forEach((word) => {
          const div = document.createElement("div");
          div.className = "reel-item";
          div.textContent = word;
          frag.appendChild(div);
        });
      }
      strip.appendChild(frag);
      const mid = Math.floor(LOOPS / 2) * reel.words.length;
      state.offsets[i] = mid * h;
      strip.style.transform = `translateY(${-state.offsets[i]}px)`;
    });
  }

  function randInt(n) {
    return Math.floor(Math.random() * n);
  }

  function starsText(n) {
    return `誠意レベル ${"★".repeat(n)}${"☆".repeat(5 - n)}`;
  }

  function buildExcuse(a, b, c) {
    return `${a}${b}${c}`;
  }

  function buildApology(excuse) {
    return (
      `関係者の皆様\n\n` +
      `大変申し訳ございません。${excuse}\n` +
      `ご迷惑をおかけし誠に申し訳ございません。` +
      `何卒ご理解いただけますと幸いです。\n\n` +
      `今後ともよろしくお願いいたします。`
    );
  }

  function sincerityFor(indices) {
    const [i0, i1, i2] = indices;
    let score = 2 + randInt(2);

    const reasonableWho = new Set([0, 4, 7]);
    const reasonableAct = new Set([0, 1, 7]);
    const softResult = new Set([0, 2, 4]);
    const absurdWho = new Set([2, 5, 6]);
    const absurdAct = new Set([5, 6, 9]);

    if (reasonableWho.has(i0)) score += 1;
    if (reasonableAct.has(i1)) score += 1;
    if (softResult.has(i2)) score += 1;
    if (absurdWho.has(i0)) score -= 1;
    if (absurdAct.has(i1)) score -= 1;
    if (i0 === 2 && i1 === 2) score -= 1;
    if (i0 === 0 && i1 === 0) score += 1;

    return Math.max(1, Math.min(5, score));
  }

  function setStopEnabled(enabledMask) {
    stopBtns.forEach((btn, i) => {
      btn.disabled = !enabledMask[i];
    });
  }

  function anySpinning() {
    return state.spinning.some(Boolean);
  }

  function tick() {
    const h = ITEM_H();
    let needFrame = false;

    REELS.forEach((reel, i) => {
      if (!state.spinning[i]) return;
      needFrame = true;
      state.offsets[i] += state.speeds[i];
      const cycle = reel.words.length * h;
      const base = Math.floor(LOOPS / 2) * cycle;
      if (state.offsets[i] > base + cycle) {
        state.offsets[i] -= cycle;
      }
      strips[i].style.transform = `translateY(${-state.offsets[i]}px)`;
    });

    if (needFrame) {
      state.raf = requestAnimationFrame(tick);
    } else {
      state.raf = null;
    }
  }

  function startSpinLoop() {
    if (state.raf == null) {
      state.raf = requestAnimationFrame(tick);
    }
  }

  function stopReel(i) {
    if (!state.spinning[i]) return;

    state.spinning[i] = false;
    stopBtns[i].disabled = true;
    windows[i].classList.remove("spinning");
    windows[i].classList.add("stopping");

    const h = ITEM_H();
    const len = REELS[i].words.length;
    const idx = randInt(len);
    state.results[i] = idx;

    const cycle = len * h;
    const base = Math.floor(LOOPS / 2) * cycle;
    const target = base + idx * h;

    strips[i].style.transition = "none";
    strips[i].style.transform = `translateY(${-state.offsets[i]}px)`;
    void strips[i].offsetWidth;
    strips[i].style.transition = "";
    state.offsets[i] = target;
    strips[i].style.transform = `translateY(${-target}px)`;

    const onEnd = (e) => {
      if (e.propertyName !== "transform") return;
      strips[i].removeEventListener("transitionend", onEnd);
      windows[i].classList.remove("stopping");
      if (!anySpinning()) {
        finishRound();
      }
    };
    strips[i].addEventListener("transitionend", onEnd);

    setTimeout(() => {
      if (windows[i].classList.contains("stopping")) {
        windows[i].classList.remove("stopping");
        strips[i].removeEventListener("transitionend", onEnd);
        if (!anySpinning()) finishRound();
      }
    }, 700);
  }

  function showNormalResult() {
    const words = state.results.map((idx, i) => REELS[i].words[idx]);
    const excuse = buildExcuse(words[0], words[1], words[2]);
    const stars = sincerityFor(state.results);
    const apology = buildApology(excuse);

    jackpotEl.hidden = true;
    resultEl.hidden = false;
    excuseEl.textContent = excuse;
    sincerityEl.textContent = starsText(stars);
    apologyEl.textContent = apology;
    copyFeedback.textContent = "";
  }

  function showJackpot() {
    resultEl.hidden = true;
    jackpotEl.hidden = false;
    jackpotExcuse.textContent = JACKPOT_EXCUSE;
    jackpotApology.textContent = buildApology(JACKPOT_EXCUSE);
    jackpotCopyFeedback.textContent = "";

    flashEl.classList.remove("active");
    void flashEl.offsetWidth;
    flashEl.classList.add("active");
  }

  function finishRound() {
    if (state.settled) return;
    state.settled = true;
    state.busy = false;
    startBtn.disabled = false;
    startBtn.textContent = "もう一度";

    if (Math.random() < 0.05) {
      showJackpot();
    } else {
      showNormalResult();
    }
  }

  function start() {
    if (state.busy) return;

    state.busy = true;
    state.settled = false;
    resultEl.hidden = true;
    jackpotEl.hidden = true;
    copyFeedback.textContent = "";
    jackpotCopyFeedback.textContent = "";
    flashEl.classList.remove("active");

    startBtn.disabled = true;
    startBtn.textContent = "回転中…";

    const h = ITEM_H();
    REELS.forEach((reel, i) => {
      windows[i].classList.remove("stopping");
      windows[i].classList.add("spinning");
      state.spinning[i] = true;
      state.speeds[i] = 14 + i * 3 + Math.random() * 4;
      const mid = Math.floor(LOOPS / 2) * reel.words.length;
      state.offsets[i] = mid * h + randInt(reel.words.length) * h;
      strips[i].style.transition = "none";
      strips[i].style.transform = `translateY(${-state.offsets[i]}px)`;
    });

    setStopEnabled([true, true, true]);
    startSpinLoop();
  }

  async function copyText(text, feedbackEl) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      feedbackEl.textContent = "コピーしました";
    } catch {
      feedbackEl.textContent = "コピーに失敗しました";
    }
  }

  stopBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => stopReel(i));
  });

  startBtn.addEventListener("click", start);
  againBtn.addEventListener("click", () => {
    jackpotEl.hidden = true;
    start();
  });

  copyBtn.addEventListener("click", () => {
    copyText(apologyEl.textContent, copyFeedback);
  });

  jackpotCopyBtn.addEventListener("click", () => {
    copyText(jackpotApology.textContent, jackpotCopyFeedback);
  });

  buildStrips();

  window.addEventListener("resize", () => {
    if (anySpinning()) return;
    const h = ITEM_H();
    REELS.forEach((reel, i) => {
      const cycle = reel.words.length * h;
      const base = Math.floor(LOOPS / 2) * cycle;
      const idx = state.results[i] || 0;
      state.offsets[i] = base + idx * h;
      strips[i].style.transform = `translateY(${-state.offsets[i]}px)`;
    });
  });
})();
