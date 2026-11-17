(() => {
  "use strict";

  const MAX_ANGLE = 90;
  const SWEET_MIN = 42;
  const SWEET_MAX = 48;
  const IDEAL = 45;
  const BOW_COUNT = 3;
  const RISE_MS = 1100; // 0→90度にかかる時間

  const QUESTIONS = [
    "なぜそのような行為に至ったのか、ご説明ください。",
    "被害を受けた方へのお気持ちをお聞かせください。",
    "同様のことは以前にもあったのですか。",
    "発覚するまで、誰にも相談しなかったのでしょうか。",
    "再発防止策は、具体的に何か考えていらっしゃいますか。",
    "世間の批判について、どのようにお受け止めですか。",
    "その場で謝れば済むと思っていたのでは？",
    "ご家族や周囲の方には、すでに報告済みですか。",
    "「つい」「うっかり」で片付けられる問題だとお考えですか。",
    "本日の会見で、一番伝えたいことは何ですか。",
    "責任の所在について、ご自身はどうお考えですか。",
    "もし同じ立場の人がいたら、何と声をかけますか。",
  ];

  const RANKS = [
    {
      min: 0,
      max: 34,
      label: "炎上",
      cls: "rank-flame",
      blurb: "SNSは怒号の嵐。トレンド入り確実。お辞儀の角度までネタにされています。",
    },
    {
      min: 35,
      max: 54,
      label: "冷たい",
      cls: "rank-cold",
      blurb: "世間の反応は冷え冷え。「形だけ」「誠意が感じられない」との声が目立ちます。",
    },
    {
      min: 55,
      max: 74,
      label: "まあ許す",
      cls: "rank-ok",
      blurb: "「反省は伝わった」「次はないぞ」——条件付きで許す空気が広がりつつあります。",
    },
    {
      min: 75,
      max: 100,
      label: "感動した",
      cls: "rank-moved",
      blurb: "完璧なお辞儀に涙腺崩壊。「人間ってすばらしい」と応援コメントが殺到しています。",
    },
  ];

  const els = {
    setup: document.getElementById("screen-setup"),
    kaiken: document.getElementById("screen-kaiken"),
    result: document.getElementById("screen-result"),
    form: document.getElementById("setup-form"),
    incident: document.getElementById("incident"),
    personName: document.getElementById("person-name"),
    telopText: document.getElementById("telop-text"),
    telopSub: document.getElementById("telop-sub"),
    reporterQ: document.getElementById("reporter-q"),
    bowPanel: document.getElementById("bow-panel"),
    evalPanel: document.getElementById("eval-panel"),
    bowRound: document.getElementById("bow-round"),
    bowBtn: document.getElementById("bow-btn"),
    gaugeFill: document.getElementById("gauge-fill"),
    gaugeNeedle: document.getElementById("gauge-needle"),
    angleReadout: document.getElementById("angle-readout"),
    evalAngle: document.getElementById("eval-angle"),
    evalComment: document.getElementById("eval-comment"),
    evalNext: document.getElementById("eval-next"),
    person: document.getElementById("person"),
    flash: document.getElementById("flash"),
    clock: document.getElementById("clock"),
    resultRank: document.getElementById("result-rank"),
    resultScore: document.getElementById("result-score"),
    resultBlurb: document.getElementById("result-blurb"),
    bowHistory: document.getElementById("bow-history"),
    retryBtn: document.getElementById("retry-btn"),
  };

  const state = {
    name: "",
    incident: "",
    round: 0,
    scores: [],
    angles: [],
    comments: [],
    questions: [],
    holding: false,
    angle: 0,
    raf: 0,
    holdStart: 0,
    lastFlashAt: 0,
    audioCtx: null,
    spaceDown: false,
  };

  function showScreen(id) {
    const map = { setup: els.setup, kaiken: els.kaiken, result: els.result };
    Object.entries(map).forEach(([key, el]) => {
      const on = key === id;
      el.hidden = !on;
      el.classList.toggle("screen-hidden", !on);
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function displayName() {
    return state.name || "関係者";
  }

  function truncate(str, n) {
    const s = String(str).trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  function updateClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    els.clock.textContent = `${hh}:${mm}:${ss}`;
  }

  function ensureAudio() {
    if (!state.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) state.audioCtx = new AC();
    }
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx.resume().catch(() => {});
    }
    return state.audioCtx;
  }

  function playShutter() {
    const ctx = ensureAudio();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2800;
    bp.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
    noise.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t0);
    noise.stop(t0 + 0.07);

    // メカ音のクリック
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.03);
    og.gain.setValueAtTime(0.12, t0);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.045);
  }

  function triggerFlash() {
    els.flash.classList.remove("is-on");
    // reflow to restart animation
    void els.flash.offsetWidth;
    els.flash.classList.add("is-on");
    playShutter();
    window.setTimeout(() => els.flash.classList.remove("is-on"), 300);
  }

  function setAngleVisual(angle) {
    const pct = (angle / MAX_ANGLE) * 100;
    els.gaugeFill.style.width = `${pct}%`;
    els.gaugeNeedle.style.left = `${pct}%`;
    els.angleReadout.textContent = `${Math.round(angle)}°`;
    els.person.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }

  function scoreForAngle(angle) {
    const diff = Math.abs(angle - IDEAL);
    if (angle >= SWEET_MIN && angle <= SWEET_MAX) return 100;
    if (diff <= 8) return 80;
    if (diff <= 15) return 55;
    if (diff <= 25) return 30;
    return 10;
  }

  function commentForAngle(angle) {
    if (angle >= SWEET_MIN && angle <= SWEET_MAX) {
      return {
        text: "完璧な角度！ カメラマンのシャッターが鳴り止まない",
        cls: "is-perfect",
      };
    }
    if (angle < 20) {
      return {
        text: "え、それお辞儀？ 会釈にもなっていない…",
        cls: "is-bad",
      };
    }
    if (angle < SWEET_MIN) {
      const d = Math.round(SWEET_MIN - angle);
      return {
        text: `浅い！ あと${d}度深く。誠意が足りないと見られます`,
        cls: angle >= 35 ? "is-ok" : "is-bad",
      };
    }
    if (angle <= 60) {
      return {
        text: "ちょっと深すぎ。演出感が出て疑われ始めました",
        cls: "is-ok",
      };
    }
    if (angle <= 75) {
      return {
        text: "深すぎるお辞儀。逆に何か隠しているのでは？",
        cls: "is-bad",
      };
    }
    return {
      text: "頭が机に！ 過呼吸寸前の過剰パフォーマンス",
      cls: "is-bad",
    };
  }

  function startRound() {
    state.round += 1;
    state.angle = 0;
    state.holding = false;
    setAngleVisual(0);
    els.person.classList.remove("is-bowing");
    els.bowBtn.classList.remove("is-holding");
    els.bowBtn.disabled = false;

    const q = state.questions[state.round - 1];
    els.reporterQ.textContent = q;
    els.bowRound.textContent = `お辞儀 ${state.round} / ${BOW_COUNT}`;

    els.evalPanel.hidden = true;
    els.evalPanel.classList.add("screen-hidden");
    els.bowPanel.hidden = false;
    els.bowPanel.classList.remove("screen-hidden");
  }

  function beginHold(e) {
    if (e && e.type === "mousedown" && e.button !== 0) return;
    if (state.holding) return;
    if (els.bowPanel.hidden || els.kaiken.hidden) return;
    if (els.bowBtn.disabled) return;

    ensureAudio();
    state.holding = true;
    state.holdStart = performance.now();
    state.lastFlashAt = state.holdStart;
    state.angle = 0;
    els.bowBtn.classList.add("is-holding");
    els.person.classList.add("is-bowing");
    els.bowBtn.textContent = "離すと確定…";
    triggerFlash();

    const tick = (now) => {
      if (!state.holding) return;
      const elapsed = now - state.holdStart;
      const t = Math.min(1, elapsed / RISE_MS);
      state.angle = t * MAX_ANGLE;
      setAngleVisual(state.angle);

      // お辞儀中はシャッター間隔でフラッシュ
      if (now - state.lastFlashAt > 280) {
        state.lastFlashAt = now;
        triggerFlash();
      }

      if (t >= 1) {
        endHold();
        return;
      }
      state.raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(tick);
  }

  function endHold() {
    if (!state.holding) return;
    state.holding = false;
    cancelAnimationFrame(state.raf);
    els.bowBtn.classList.remove("is-holding");
    els.bowBtn.disabled = true;
    els.bowBtn.textContent = "押し続けてお辞儀";

    const angle = Math.min(MAX_ANGLE, Math.max(0, state.angle));
    state.angle = angle;
    setAngleVisual(angle);
    triggerFlash();

    const score = scoreForAngle(angle);
    const { text, cls } = commentForAngle(angle);
    state.scores.push(score);
    state.angles.push(angle);
    state.comments.push(text);

    els.evalAngle.textContent = `${Math.round(angle)}° — 評価 ${score}点`;
    els.evalComment.textContent = text;
    els.evalComment.className = `eval-comment ${cls}`;

    els.bowPanel.hidden = true;
    els.bowPanel.classList.add("screen-hidden");
    els.evalPanel.hidden = false;
    els.evalPanel.classList.remove("screen-hidden");

    els.evalNext.textContent =
      state.round >= BOW_COUNT ? "世間の反応を見る" : "次の質問へ";
  }

  function rankFromAverage(avg) {
    return RANKS.find((r) => avg >= r.min && avg <= r.max) || RANKS[0];
  }

  function showResult() {
    const avg = Math.round(
      state.scores.reduce((a, b) => a + b, 0) / state.scores.length
    );
    const rank = rankFromAverage(avg);

    els.resultRank.textContent = rank.label;
    els.resultRank.className = `breaking-rank ${rank.cls}`;
    els.resultScore.textContent = `納得度スコア ${avg} / 100`;
    els.resultBlurb.textContent = rank.blurb;

    els.bowHistory.innerHTML = "";
    state.angles.forEach((ang, i) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.className = "h-label";
      label.textContent = `${i + 1}回目`;
      const val = document.createElement("span");
      val.className = "h-val";
      val.textContent = `${Math.round(ang)}°（${state.scores[i]}点）`;
      li.append(label, val);
      els.bowHistory.appendChild(li);
    });

    showScreen("result");
  }

  function startKaiken(name, incident) {
    state.name = name;
    state.incident = incident;
    state.round = 0;
    state.scores = [];
    state.angles = [];
    state.comments = [];
    state.questions = shuffle(QUESTIONS).slice(0, BOW_COUNT);

    const who = displayName();
    const short = truncate(incident, 18);
    els.telopText.textContent = `${who}氏、${short}の疑い`;
    els.telopSub.textContent = `GMS NEWS 緊急特番 ／ ${who}氏が陳謝へ`;

    showScreen("kaiken");
    startRound();
  }

  function resetToSetup() {
    state.holding = false;
    cancelAnimationFrame(state.raf);
    setAngleVisual(0);
    els.person.classList.remove("is-bowing");
    els.bowBtn.classList.remove("is-holding");
    els.bowBtn.disabled = false;
    els.bowBtn.textContent = "押し続けてお辞儀";
    showScreen("setup");
    els.incident.focus();
  }

  // —— イベント ——
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const incident = els.incident.value.trim();
    if (!incident) {
      els.incident.focus();
      return;
    }
    const name = els.personName.value.trim();
    startKaiken(name, incident);
  });

  els.evalNext.addEventListener("click", () => {
    if (state.round >= BOW_COUNT) {
      showResult();
    } else {
      startRound();
    }
  });

  els.retryBtn.addEventListener("click", resetToSetup);

  const bowBtn = els.bowBtn;

  bowBtn.addEventListener("mousedown", beginHold);
  bowBtn.addEventListener("mouseup", endHold);
  bowBtn.addEventListener("mouseleave", () => {
    if (state.holding) endHold();
  });

  bowBtn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      beginHold(e);
    },
    { passive: false }
  );
  bowBtn.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      endHold();
    },
    { passive: false }
  );
  bowBtn.addEventListener(
    "touchcancel",
    () => {
      endHold();
    },
    { passive: true }
  );

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.key !== " ") return;
    if (els.kaiken.hidden || els.bowPanel.hidden) return;
    e.preventDefault();
    if (state.spaceDown) return;
    state.spaceDown = true;
    beginHold(e);
  });

  window.addEventListener("keyup", (e) => {
    if (e.code !== "Space" && e.key !== " ") return;
    if (!state.spaceDown) return;
    e.preventDefault();
    state.spaceDown = false;
    endHold();
  });

  // フォーカス喪失時も離した扱いに
  window.addEventListener("blur", () => {
    state.spaceDown = false;
    if (state.holding) endHold();
  });

  updateClock();
  window.setInterval(updateClock, 1000);
  showScreen("setup");
})();
