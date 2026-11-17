(() => {
  "use strict";

  const TOTAL_STAGES = 40;

  /** @type {Array<{text: string, apply: (ctx: ReturnType<typeof createCtx>) => void}>} */
  const stages = [
    {
      text: "……押したな？ 最初から言うこと聞かないやつだ。",
      apply: ({ shake }) => shake(),
    },
    {
      text: "冗談だろ？ 絶対押すなよ、って書いてあるぞ。",
      apply: ({ pulse }) => pulse(),
    },
    {
      text: "三度目は本気だ。指を離せ。",
      apply: ({ setScale }) => setScale(0.92),
    },
    {
      text: "少し小さくなって逃げる準備をしてるんだが。",
      apply: ({ setScale, shake }) => {
        setScale(0.85);
        shake();
      },
    },
    {
      text: "ほら、逃げた。まだ見えるだろ？",
      apply: ({ fleeFromPointer }) => fleeFromPointer(70),
    },
    {
      text: "もっと逃げる。追ってくるな。",
      apply: ({ fleeFromPointer }) => fleeFromPointer(110),
    },
    {
      text: "傾いてるのは動揺してるからだ。",
      apply: ({ setRotate, wobble }) => {
        setRotate(-12);
        wobble();
      },
    },
    {
      text: "色が変わった？ 怒ってる証拠だ。",
      apply: ({ setHue, setBg }) => {
        setHue(25);
        setBg("#d9480f");
      },
    },
    {
      text: "ダミーを置いた。本物だけカウントされる。",
      apply: ({ spawnDummies }) => spawnDummies(2),
    },
    {
      text: "大きいほうが本物……ではない。",
      apply: ({ setScale, pulse }) => {
        setScale(1.15);
        pulse();
      },
    },
    {
      text: "透明化開始。見えないフリをするな。",
      apply: ({ setOpacity }) => setOpacity(0.72),
    },
    {
      text: "また逃げた。画面端が見えてきた。",
      apply: ({ fleeToEdge }) => fleeToEdge(),
    },
    {
      text: "落下して跳ねた。骨はないけど痛い。",
      apply: ({ fallBounce }) => fallBounce(),
    },
    {
      text: "ダミー増加中。勘で押すな。",
      apply: ({ spawnDummies, setOpacity }) => {
        spawnDummies(3);
        setOpacity(0.85);
      },
    },
    {
      text: "小さくなって隙間に潜むつもりだった。",
      apply: ({ setScale, fleeFromPointer }) => {
        setScale(0.7);
        fleeFromPointer(90);
      },
    },
    {
      text: "緑になった。これは警告色……いや違う。",
      apply: ({ setHue, setBg }) => {
        setHue(95);
        setBg("#2f9e44");
      },
    },
    {
      text: "スピンしてきた。目が回る。",
      apply: ({ spinOut }) => spinOut(),
    },
    {
      text: "もっと傾ける。バランス感覚ゼロ。",
      apply: ({ setRotate, shake }) => {
        setRotate(22);
        shake();
      },
    },
    {
      text: "半透明。幽霊ボタンになってきた。",
      apply: ({ setOpacity, wobble }) => {
        setOpacity(0.45);
        wobble();
      },
    },
    {
      text: "端っこ逃亡。隅っこが好きなタイプ。",
      apply: ({ fleeToEdge, setScale }) => {
        setScale(0.8);
        fleeToEdge();
      },
    },
    {
      text: "ダミーだらけだ。本物は動くやつ。",
      apply: ({ spawnDummies, clearDummies }) => {
        clearDummies();
        spawnDummies(5);
      },
    },
    {
      text: "巨大化。威圧で止められると思ったか？",
      apply: ({ setScale, pulse }) => {
        setScale(1.35);
        pulse();
      },
    },
    {
      text: "また落下。床に謝りたい。",
      apply: ({ fallBounce, setRotate }) => {
        setRotate(-6);
        fallBounce();
      },
    },
    {
      text: "紫っぽくなった。意味はない。焦りだ。",
      apply: ({ setHue, setBg }) => {
        setHue(260);
        setBg("#7048e8");
      },
    },
    {
      text: "グリッチ発生。仕様です。嘘です。",
      apply: ({ glitch, setOpacity }) => {
        setOpacity(0.9);
        glitch();
      },
    },
    {
      text: "逃げ足が速くなった。筋トレした。",
      apply: ({ fleeFromPointer }) => fleeFromPointer(150),
    },
    {
      text: "極小化。探しものになってしまった。",
      apply: ({ setScale, fleeFromPointer }) => {
        setScale(0.55);
        fleeFromPointer(120);
      },
    },
    {
      text: "透明度MAX手前。まだある。",
      apply: ({ setOpacity, shake }) => {
        setOpacity(0.28);
        shake();
      },
    },
    {
      text: "ダミー祭り。本物は文句を言うやつ。",
      apply: ({ clearDummies, spawnDummies, setOpacity }) => {
        clearDummies();
        spawnDummies(7);
        setOpacity(1);
      },
    },
    {
      text: "画面端リレー。どこへでも逃げる。",
      apply: ({ fleeToEdge, setRotate }) => {
        setRotate(15);
        fleeToEdge();
      },
    },
    {
      text: "跳ね返り強化。床との絆が深い。",
      apply: ({ fallBounce, setScale }) => {
        setScale(0.9);
        fallBounce();
      },
    },
    {
      text: "黒ボタン化。最終警告のつもり。",
      apply: ({ setHue, setBg, setFg }) => {
        setHue(0);
        setBg("#1c1c1c");
        setFg("#ffe8e0");
      },
    },
    {
      text: "ぐるぐる。もう何も信じられない。",
      apply: ({ spinOut, setRotate }) => {
        setRotate(0);
        spinOut();
      },
    },
    {
      text: "また逃げる。指から学習した。",
      apply: ({ fleeFromPointer, setScale }) => {
        setScale(0.75);
        fleeFromPointer(170);
      },
    },
    {
      text: "ダミー最終波。勘で当ててみろ。",
      apply: ({ clearDummies, spawnDummies, setOpacity }) => {
        clearDummies();
        spawnDummies(8);
        setOpacity(0.95);
      },
    },
    {
      text: "ほぼ透明。でも押せる。残酷だ。",
      apply: ({ setOpacity, wobble }) => {
        setOpacity(0.18);
        wobble();
      },
    },
    {
      text: "色が狂った。感情がバグってる。",
      apply: ({ setHue, setBg, glitch }) => {
        setHue(180);
        setBg("#0ca678");
        glitch();
      },
    },
    {
      text: "端っこへ全力逃亡。諦めないでくれ……いや諦めろ。",
      apply: ({ fleeToEdge, setScale, setRotate }) => {
        setScale(0.65);
        setRotate(-20);
        fleeToEdge();
      },
    },
    {
      text: "あと一回で認定証……押すなよ？ 本気で。",
      apply: ({ setOpacity, setScale, setBg, setFg, setHue, pulse }) => {
        setHue(0);
        setBg("#e11d2e");
        setFg("#fffaf5");
        setOpacity(1);
        setScale(1.05);
        pulse();
      },
    },
    {
      text: "押したな！！ ルール違反マスター認定だ！！",
      apply: ({ showCertificate, clearDummies, resetVisuals }) => {
        clearDummies();
        resetVisuals();
        showCertificate();
      },
    },
  ];

  if (stages.length !== TOTAL_STAGES) {
    console.warn("Stage count mismatch:", stages.length);
  }

  const arena = document.getElementById("arena");
  const mainBtn = document.getElementById("mainBtn");
  const speechEl = document.getElementById("speech");
  const counterEl = document.getElementById("counter");
  const certOverlay = document.getElementById("certOverlay");
  const resetBtn = document.getElementById("resetBtn");
  const root = document.documentElement;

  let count = 0;
  let finished = false;
  let lastPointer = { x: null, y: null };
  let animTimer = 0;

  function setVar(name, value) {
    root.style.setProperty(name, value);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function clearAnimClasses() {
    mainBtn.classList.remove(
      "shake",
      "pulse",
      "fall-bounce",
      "spin-out",
      "wobble",
      "glitch"
    );
  }

  function playAnim(className) {
    clearAnimClasses();
    void mainBtn.offsetWidth;
    mainBtn.classList.add(className);
    window.clearTimeout(animTimer);
    animTimer = window.setTimeout(() => {
      mainBtn.classList.remove(className);
    }, 1000);
  }

  function getArenaBox() {
    return arena.getBoundingClientRect();
  }

  function getBtnHalf() {
    const r = mainBtn.getBoundingClientRect();
    const scale = parseFloat(getComputedStyle(root).getPropertyValue("--btn-scale")) || 1;
    // Prefer layout size over transformed size for clamp math
    const layoutW = mainBtn.offsetWidth * scale;
    const layoutH = mainBtn.offsetHeight * scale;
    return {
      hw: (layoutW || r.width) / 2,
      hh: (layoutH || r.height) / 2,
    };
  }

  function currentOffset() {
    const x = parseFloat(getComputedStyle(root).getPropertyValue("--btn-x")) || 0;
    const y = parseFloat(getComputedStyle(root).getPropertyValue("--btn-y")) || 0;
    return { x, y };
  }

  function setPosPx(x, y) {
    const box = getArenaBox();
    const { hw, hh } = getBtnHalf();
    const maxX = Math.max(8, box.width / 2 - hw - 4);
    const maxY = Math.max(8, box.height / 2 - hh - 4);
    setVar("--btn-x", `${clamp(x, -maxX, maxX)}px`);
    setVar("--btn-y", `${clamp(y, -maxY, maxY)}px`);
  }

  function pointerInArena() {
    if (lastPointer.x == null || lastPointer.y == null) return null;
    const box = getArenaBox();
    return {
      x: lastPointer.x - (box.left + box.width / 2),
      y: lastPointer.y - (box.top + box.height / 2),
    };
  }

  function spawnDummies(n) {
    const labels = [
      "押すなよ",
      "絶対違う",
      "偽物",
      "こっちじゃない",
      "ダミー",
      "罠",
      "押しても無駄",
      "本物風",
    ];
    const box = getArenaBox();
    for (let i = 0; i < n; i++) {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "dummy-btn";
      d.textContent = labels[i % labels.length];
      d.setAttribute("aria-hidden", "true");
      d.tabIndex = -1;
      const x = (Math.random() - 0.5) * (box.width - 130);
      const y = (Math.random() - 0.5) * (box.height - 130);
      d.style.transform = `translate(${x}px, ${y}px)`;
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        d.classList.remove("fake-click");
        void d.offsetWidth;
        d.classList.add("fake-click");
        speechEl.textContent = "それはダミーだ。本物だけがカウントされる。";
        popSpeech();
      });
      arena.appendChild(d);
    }
  }

  function clearDummies() {
    arena.querySelectorAll(".dummy-btn").forEach((el) => el.remove());
  }

  function resetVisuals(resetPos = true) {
    clearAnimClasses();
    setVar("--btn-scale", "1");
    setVar("--btn-rotate", "0deg");
    setVar("--btn-opacity", "1");
    setVar("--btn-hue", "0deg");
    setVar("--btn-bg", "#e11d2e");
    setVar("--btn-fg", "#fffaf5");
    if (resetPos) {
      setVar("--btn-x", "0px");
      setVar("--btn-y", "0px");
    }
  }

  function popSpeech() {
    speechEl.classList.remove("pop");
    void speechEl.offsetWidth;
    speechEl.classList.add("pop");
  }

  function updateCounter() {
    counterEl.textContent = `押した回数: ${count}`;
  }

  function createCtx() {
    return {
      shake: () => playAnim("shake"),
      pulse: () => playAnim("pulse"),
      fallBounce: () => playAnim("fall-bounce"),
      spinOut: () => playAnim("spin-out"),
      wobble: () => playAnim("wobble"),
      glitch: () => playAnim("glitch"),
      setScale: (s) => setVar("--btn-scale", String(s)),
      setRotate: (deg) => setVar("--btn-rotate", `${deg}deg`),
      setOpacity: (o) => setVar("--btn-opacity", String(o)),
      setHue: (deg) => setVar("--btn-hue", `${deg}deg`),
      setBg: (c) => setVar("--btn-bg", c),
      setFg: (c) => setVar("--btn-fg", c),
      fleeFromPointer: (distance) => {
        const p = pointerInArena();
        const cur = currentOffset();
        let dx;
        let dy;
        if (p) {
          const len = Math.hypot(cur.x - p.x, cur.y - p.y) || 1;
          dx = (cur.x - p.x) / len;
          dy = (cur.y - p.y) / len;
        } else {
          const angle = Math.random() * Math.PI * 2;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
        }
        setPosPx(cur.x + dx * distance, cur.y + dy * distance);
      },
      fleeToEdge: () => {
        const box = getArenaBox();
        const { hw, hh } = getBtnHalf();
        const edges = [
          { x: box.width / 2 - hw - 6, y: (Math.random() - 0.5) * (box.height - hh * 2) },
          { x: -(box.width / 2 - hw - 6), y: (Math.random() - 0.5) * (box.height - hh * 2) },
          { x: (Math.random() - 0.5) * (box.width - hw * 2), y: box.height / 2 - hh - 6 },
          { x: (Math.random() - 0.5) * (box.width - hw * 2), y: -(box.height / 2 - hh - 6) },
        ];
        const pick = edges[Math.floor(Math.random() * edges.length)];
        setPosPx(pick.x, pick.y);
      },
      spawnDummies,
      clearDummies,
      resetVisuals,
      showCertificate: () => {
        finished = true;
        certOverlay.hidden = false;
        resetBtn.focus();
      },
    };
  }

  function rememberPointer(e) {
    if (e.touches && e.touches[0]) {
      lastPointer.x = e.touches[0].clientX;
      lastPointer.y = e.touches[0].clientY;
      return;
    }
    if (e.changedTouches && e.changedTouches[0]) {
      lastPointer.x = e.changedTouches[0].clientX;
      lastPointer.y = e.changedTouches[0].clientY;
      return;
    }
    if (typeof e.clientX === "number") {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    }
  }

  function onMainPress(e) {
    if (finished) return;
    rememberPointer(e);
    if (count >= TOTAL_STAGES) return;

    count += 1;
    updateCounter();

    const stage = stages[count - 1];
    speechEl.textContent = stage.text;
    popSpeech();
    stage.apply(createCtx());
  }

  function fullReset() {
    count = 0;
    finished = false;
    certOverlay.hidden = true;
    clearDummies();
    resetVisuals(true);
    speechEl.textContent = "……押すなよ？";
    popSpeech();
    updateCounter();
    mainBtn.focus();
  }

  window.addEventListener("pointerdown", rememberPointer, { passive: true });
  window.addEventListener("pointermove", rememberPointer, { passive: true });
  window.addEventListener("touchstart", rememberPointer, { passive: true });
  window.addEventListener("touchmove", rememberPointer, { passive: true });

  mainBtn.addEventListener("click", onMainPress);
  resetBtn.addEventListener("click", fullReset);

  window.addEventListener("resize", () => {
    const cur = currentOffset();
    setPosPx(cur.x, cur.y);
  });

  updateCounter();
})();
