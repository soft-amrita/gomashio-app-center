(() => {
  "use strict";

  /* ========== ユーティリティ ========== */

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pick(seed, arr) {
    return arr[seed % arr.length];
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function mix(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  /* ========== 質問定義 ========== */

  const QUESTIONS = [
    {
      id: "holiday",
      type: "choice",
      title: "休日の過ごし方は？",
      options: [
        { key: "futon", label: "布団と一体化" },
        { key: "out", label: "外へ飛び出す" },
        { key: "oshi", label: "推し活に全振り" },
        { key: "vanish", label: "気づいたら終わってる" },
      ],
    },
    {
      id: "caffeine",
      type: "slider",
      title: "カフェイン依存度は？",
      hint: "コーヒーカップが満ちていくほど依存度アップ",
      min: 0,
      max: 100,
      step: 1,
      default: 42,
      unit: "%",
      visual: "coffee",
    },
    {
      id: "battery",
      type: "slider",
      title: "スマホの充電が何%になると焦る？",
      hint: "残量がこれ以下になると落ち着かないライン",
      min: 5,
      max: 95,
      step: 1,
      default: 30,
      unit: "%",
      visual: "battery",
    },
    {
      id: "night",
      type: "choice",
      title: "夜更かし度は？",
      options: [
        { key: "early", label: "日付が変わる前に寝る" },
        { key: "one", label: "1時くらいまで" },
        { key: "three", label: "3時は余裕" },
        { key: "dawn", label: "朝日とともに寝る" },
      ],
    },
    {
      id: "crowd",
      type: "choice",
      title: "人混みへの耐性は？",
      options: [
        { key: "festival", label: "祭り大好き" },
        { key: "normal", label: "普通" },
        { key: "avoid", label: "できれば避けたい" },
        { key: "home", label: "家から出たくない" },
      ],
    },
  ];

  /* ========== ラベル生成（決定的） ========== */

  const FLAVOR = {
    futon: ["布団まみれ", "昼寝特化", "毛布依存"],
    out: ["青空冒険", "外気もりもり", "ピクニック"],
    oshi: ["推し尊", "応援全開", "沼落ち"],
    vanish: ["時間消失", "ぼんやり", "週末蒸発"],
  };

  const MAIN_INGREDIENT = {
    futon: ["布団への愛（国内製造）", "昼寝の才能", "毛布との共生"],
    out: ["外気吸収力", "靴底の摩耗", "青空へのあこがれ"],
    oshi: ["推しの尊さ", "グッズの堆積", "応援の熱量（濃縮還元）"],
    vanish: ["時間の消失点", "ぼんやり感", "休日蒸発エキス"],
  };

  const NIGHT_ADDITIVE = {
    early: ["夜更かし（検出限界以下）", "早寝の矜持", "日付変更線拒否"],
    one: ["夜更かし（適量）", "深夜番組の残り香", "1時の誘惑"],
    three: ["夜更かし（多め）", "3時の反省", "月光依存"],
    dawn: ["夜更かし（過剰）", "朝日との契約", "昼夜逆転エキス"],
  };

  const EXPIRY = {
    early: [
      "布団の中であれば無期限",
      "翌朝まで鮮度保証",
      "早寝すれば延長可能",
    ],
    one: [
      "深夜番組終了まで有効",
      "1時を過ぎると劣化開始",
      "二度寝で回復可能",
    ],
    three: [
      "3時を超えたら自己責任",
      "翌日の眠気と交換",
      "コーヒーと併用で延長",
    ],
    dawn: [
      "朝日とともにリセット",
      "昼夜逆転モードで無期限",
      "夜が明けたら要冷蔵",
    ],
  };

  const STORAGE = {
    futon: [
      "直射日光および急な電話を避け、布団の中で保存してください",
      "高温多湿・目覚ましを避け、毛布の下で保管",
      "人混みを避け、枕元の暗所で保存",
    ],
    out: [
      "風通しの良い屋外で保管。雨天時は室内へ",
      "スニーカーと一緒に風通しの良い場所へ",
      "直射日光は歓迎。ただし夏の炎天下は避けて",
    ],
    oshi: [
      "グッズと一緒に乾燥した場所で保管。湿気と現実を避けて",
      "推し関連グッズと同梱保存推奨",
      "ライブ会場近辺での一時保管可",
    ],
    vanish: [
      "時間の流れを感じない場所で保存してください",
      "カレンダーを隠した部屋で保管",
      "気づいたら期限切れでも構いません",
    ],
  };

  const CAUTION = {
    festival: [
      "人混みで性能が急上昇します。帰宅後はクールダウンを",
      "祭り会場では蓋を開けないでください（テンション過多）",
    ],
    normal: [
      "適度な人付き合いで品質を保てます",
      "会話が続く場合は水分補給を",
    ],
    avoid: [
      "満員電車では品質が低下します。イヤホン推奨",
      "人混み回避ルートでの輸送を推奨",
    ],
    home: [
      "外出は開封期限切れの原因になります",
      "玄関を開けると鮮度が落ちます。宅配推奨",
    ],
  };

  const EXTRA_INGREDIENTS = [
    "見栄（国内製造）",
    "現実逃避",
    "やる気（微量）",
    "睡眠不足",
    "通知依存",
    "言い訳の素",
    "スマホの熱",
    "未読メッセージ",
    "先延ばし癖",
    "たまに湧く勇気",
    "コンビニ飯の記憶",
    "締め切り前の集中力",
  ];

  const FOOT_NOTES = [
    "※本製品は気分により性能が大きく変動します",
    "※開封後はなるべく早めにお使いください（ただし二度寝可）",
    "※個体差があります。他人と比較しないでください",
    "※本表示はジョークです。栄養指導ではありません",
  ];

  function socialityPercent(crowdKey) {
    const map = { festival: 88, normal: 55, avoid: 28, home: 8 };
    return map[crowdKey] ?? 50;
  }

  function buildLabel(answers) {
    const seedBase = hashString(
      [
        answers.name,
        answers.holiday,
        answers.caffeine,
        answers.battery,
        answers.night,
        answers.crowd,
      ].join("|")
    );

    const s = (n) => (seedBase + n * 9973) >>> 0;

    const flavor = pick(s(1), FLAVOR[answers.holiday]);
    const main = pick(s(2), MAIN_INGREDIENT[answers.holiday]);
    const nightAdd = pick(s(3), NIGHT_ADDITIVE[answers.night]);
    const expiry = pick(s(4), EXPIRY[answers.night]);
    const storage = pick(s(5), STORAGE[answers.holiday]);
    const caution = pick(s(6), CAUTION[answers.crowd]);
    const noteA = pick(s(7), FOOT_NOTES);
    const noteB = pick(s(8), FOOT_NOTES.filter((n) => n !== noteA));

    const caffeine = Number(answers.caffeine);
    const battery = Number(answers.battery);
    const social = socialityPercent(answers.crowd);

    const phoneDep =
      battery >= 50
        ? "スマホ依存（強）"
        : battery >= 25
          ? "スマホ依存（中）"
          : "スマホ依存（軽）";

    const batteryFear =
      battery >= 60
        ? "電池切れ恐怖症（重度）"
        : battery >= 35
          ? "電池切れ恐怖症（中度）"
          : "電池切れ恐怖症（軽度）";

    const additives = [
      `カフェイン（${caffeine}%）`,
      nightAdd,
      phoneDep,
      batteryFear,
    ];

    // 原材料 5〜7個、含有量イメージで並べ替え
    const pool = EXTRA_INGREDIENTS.slice();
    const extras = [];
    let h = s(10);
    const extraCount = 3 + (h % 3); // 3〜5 → 合計5〜7
    while (extras.length < extraCount && pool.length) {
      h = (h * 1103515245 + 12345) >>> 0;
      const idx = h % pool.length;
      extras.push(pool.splice(idx, 1)[0]);
    }

    const ingredients = [main, ...extras];
    // 微量を末尾に寄せる演出
    if (!ingredients.some((x) => x.includes("微量"))) {
      ingredients[ingredients.length - 1] = pick(s(11), [
        "やる気（微量）",
        "計画性（微量）",
        "早起き願望（微量）",
      ]);
    }

    // 栄養成分 0〜100
    const nightFactor = { early: 0.2, one: 0.45, three: 0.7, dawn: 0.95 }[
      answers.night
    ];
    const holidayEnergy = { futon: 25, out: 78, oshi: 90, vanish: 40 }[
      answers.holiday
    ];

    const nutrition = {
      energy: clamp(
        mix(holidayEnergy, 100 - caffeine * 0.15, 0.3) +
          Math.round(((s(20) % 17) - 8) * 0.5),
        0,
        100
      ),
      protein: clamp(
        Math.round(social * 0.55 + (100 - battery) * 0.2 + (s(21) % 11) - 5),
        0,
        100
      ),
      fat: clamp(
        Math.round(
          (answers.holiday === "futon" ? 62 : 35) +
            nightFactor * 20 +
            (s(22) % 9) -
            4
        ),
        0,
        100
      ),
      carb: clamp(
        Math.round(40 + nightFactor * 35 + caffeine * 0.1 + (s(23) % 13) - 6),
        0,
        100
      ),
      salt: clamp(
        Math.round((100 - social) * 0.7 + (s(24) % 15) - 5),
        0,
        100
      ),
      social,
      caffeine,
    };

    // EAN-13 風バーコード数字（チェックディジット付き）
    const barcode = makeBarcode13(seedBase);

    return {
      displayName: answers.name,
      productName: `人生（${flavor}風味）`,
      formalName: "ヒト（成人型）",
      ingredients: ingredients.join(" / "),
      additives: additives.join("、"),
      volume: "1名分",
      expiry,
      storage,
      maker: "株式会社じぶん 本社：あなたの家",
      nutrition,
      caution,
      notes: [noteA, noteB],
      barcode,
    };
  }

  function makeBarcode13(seed) {
    const digits = [];
    let h = seed || 1;
    // 先頭は日本っぽく 4
    digits.push(4);
    for (let i = 0; i < 11; i++) {
      h = (h * 1664525 + 1013904223) >>> 0;
      digits.push(h % 10);
    }
    // EAN-13 チェックディジット
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    digits.push((10 - (sum % 10)) % 10);
    return digits.join("");
  }

  /* ========== EAN-13 バーコード描画 ========== */

  // L/G/R パターン（幅の並び: モジュール単位）
  const EAN_L = [
    "0001101",
    "0011001",
    "0010011",
    "0111101",
    "0100011",
    "0110001",
    "0101111",
    "0111011",
    "0110111",
    "0001011",
  ];
  const EAN_G = [
    "0100111",
    "0110011",
    "0011011",
    "0100001",
    "0011101",
    "0111001",
    "0000101",
    "0010001",
    "0001001",
    "0010111",
  ];
  const EAN_R = [
    "1110010",
    "1100110",
    "1101100",
    "1000010",
    "1011100",
    "1001110",
    "1010000",
    "1000100",
    "1001000",
    "1110100",
  ];
  const EAN_PARITY = [
    "LLLLLL",
    "LLGLGG",
    "LLGGLG",
    "LLGGGL",
    "LGLLGG",
    "LGGLLG",
    "LGGGLL",
    "LGLGLG",
    "LGLGGL",
    "LGGLGL",
  ];

  function drawBarcode(canvas, code) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f7f4ec";
    ctx.fillRect(0, 0, w, h);

    if (!/^\d{13}$/.test(code)) return;

    const first = Number(code[0]);
    const left = code.slice(1, 7);
    const right = code.slice(7, 13);
    const parity = EAN_PARITY[first];

    let pattern = "101";
    for (let i = 0; i < 6; i++) {
      const d = Number(left[i]);
      pattern += parity[i] === "L" ? EAN_L[d] : EAN_G[d];
    }
    pattern += "01010";
    for (let i = 0; i < 6; i++) {
      pattern += EAN_R[Number(right[i])];
    }
    pattern += "101";

    const moduleCount = pattern.length;
    const margin = 8;
    const usable = w - margin * 2;
    const mw = usable / moduleCount;
    const barTop = 4;
    const barH = h - 10;

    ctx.fillStyle = "#111";
    for (let i = 0; i < moduleCount; i++) {
      if (pattern[i] === "1") {
        const x = margin + i * mw;
        ctx.fillRect(Math.floor(x), barTop, Math.ceil(mw) + 0.5, barH);
      }
    }
  }

  /* ========== DOM ========== */

  const screens = {
    title: document.getElementById("screen-title"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };

  const els = {
    name: document.getElementById("input-name"),
    start: document.getElementById("btn-start"),
    quizBody: document.getElementById("quiz-body"),
    progressBar: document.getElementById("progress-bar"),
    progressText: document.getElementById("progress-text"),
    labelContent: document.getElementById("label-content"),
    labelSeal: document.getElementById("label-seal"),
    labelShine: document.getElementById("label-shine"),
    barcode: document.getElementById("barcode-canvas"),
    exportCanvas: document.getElementById("export-canvas"),
    save: document.getElementById("btn-save"),
    share: document.getElementById("btn-share"),
    retry: document.getElementById("btn-retry"),
  };

  const state = {
    step: 0,
    answers: {
      name: "ななしの人生",
      holiday: null,
      caffeine: 42,
      battery: 30,
      night: null,
      crowd: null,
    },
    label: null,
    tempChoice: null,
  };

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      const on = key === name;
      el.classList.toggle("is-active", on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startQuiz() {
    const raw = els.name.value.trim();
    state.answers.name = raw || "ななしの人生";
    state.answers.holiday = null;
    state.answers.caffeine = 42;
    state.answers.battery = 30;
    state.answers.night = null;
    state.answers.crowd = null;
    state.step = 0;
    state.tempChoice = null;
    showScreen("quiz");
    renderQuestion();
  }

  function updateProgress() {
    const total = QUESTIONS.length;
    const current = state.step + 1;
    els.progressBar.style.width = `${(current / total) * 100}%`;
    els.progressText.textContent = `${current} / ${total}`;
  }

  function renderQuestion() {
    updateProgress();
    const q = QUESTIONS[state.step];
    state.tempChoice = null;
    els.quizBody.innerHTML = "";

    const title = document.createElement("h2");
    title.className = "q-title";
    title.textContent = q.title;
    els.quizBody.appendChild(title);

    if (q.hint) {
      const hint = document.createElement("p");
      hint.className = "q-hint";
      hint.textContent = q.hint;
      els.quizBody.appendChild(hint);
    }

    if (q.type === "choice") {
      q.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-choice";
        btn.textContent = opt.label;
        btn.addEventListener("click", () => {
          state.answers[q.id] = opt.key;
          nextStep();
        });
        els.quizBody.appendChild(btn);
      });
      return;
    }

    // slider
    const block = document.createElement("div");
    block.className = "slider-block";

    if (q.visual === "coffee") {
      block.appendChild(buildCoffeeVisual());
    } else if (q.visual === "battery") {
      block.appendChild(buildBatteryVisual());
    }

    const valueEl = document.createElement("div");
    valueEl.className = "slider-value";
    valueEl.innerHTML = `<strong id="slider-val">${q.default}</strong><span>${q.unit}</span>`;
    block.appendChild(valueEl);

    const range = document.createElement("input");
    range.type = "range";
    range.min = String(q.min);
    range.max = String(q.max);
    range.step = String(q.step);
    range.value = String(state.answers[q.id] ?? q.default);
    range.setAttribute("aria-label", q.title);
    block.appendChild(range);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn-primary btn-next";
    next.textContent = state.step === QUESTIONS.length - 1 ? "結果を見る" : "次へ";
    next.addEventListener("click", () => {
      state.answers[q.id] = Number(range.value);
      nextStep();
    });
    block.appendChild(next);

    els.quizBody.appendChild(block);

    const sync = () => {
      const v = Number(range.value);
      valueEl.querySelector("#slider-val").textContent = String(v);
      if (q.visual === "coffee") syncCoffee(v);
      if (q.visual === "battery") syncBattery(v);
    };
    range.addEventListener("input", sync);
    sync();
  }

  function buildCoffeeVisual() {
    const stage = document.createElement("div");
    stage.className = "coffee-stage";
    stage.innerHTML = `
      <div class="coffee-cup" aria-hidden="true">
        <div class="coffee-steam" id="coffee-steam">
          <span></span><span></span><span></span>
        </div>
        <div class="coffee-body">
          <div class="coffee-liquid" id="coffee-liquid"></div>
        </div>
        <div class="coffee-handle"></div>
      </div>
    `;
    return stage;
  }

  function syncCoffee(v) {
    const liquid = document.getElementById("coffee-liquid");
    const steam = document.getElementById("coffee-steam");
    if (liquid) liquid.style.height = `${v}%`;
    if (steam) steam.classList.toggle("is-on", v >= 25);
  }

  function buildBatteryVisual() {
    const stage = document.createElement("div");
    stage.className = "battery-stage";
    stage.innerHTML = `
      <div class="battery" aria-hidden="true">
        <div class="battery-fill" id="battery-fill"></div>
      </div>
    `;
    return stage;
  }

  function syncBattery(v) {
    const fill = document.getElementById("battery-fill");
    if (!fill) return;
    fill.style.width = `${v}%`;
    fill.classList.toggle("is-low", v <= 20);
  }

  function nextStep() {
    if (state.step < QUESTIONS.length - 1) {
      state.step += 1;
      renderQuestion();
      return;
    }
    finishQuiz();
  }

  function finishQuiz() {
    state.label = buildLabel(state.answers);
    renderLabel(state.label);
    showScreen("result");
  }

  function renderLabel(label) {
    const n = label.nutrition;
    els.labelContent.innerHTML = `
      <div class="label-header">
        <p class="product-name">${escapeHtml(label.productName)}</p>
        <p class="person-name">${escapeHtml(label.displayName)}</p>
      </div>
      <dl>
        <div class="label-row"><dt>名称</dt><dd>${escapeHtml(label.formalName)}</dd></div>
        <div class="label-row"><dt>原材料名</dt><dd>${escapeHtml(label.ingredients)}</dd></div>
        <div class="label-row"><dt>添加物</dt><dd>${escapeHtml(label.additives)}</dd></div>
        <div class="label-row"><dt>内容量</dt><dd>${escapeHtml(label.volume)}</dd></div>
        <div class="label-row"><dt>賞味期限</dt><dd>${escapeHtml(label.expiry)}</dd></div>
        <div class="label-row"><dt>保存方法</dt><dd>${escapeHtml(label.storage)}</dd></div>
        <div class="label-row"><dt>製造者</dt><dd>${escapeHtml(label.maker)}</dd></div>
      </dl>
      <div class="nutrition">
        <p class="nutrition-title">栄養成分表示風</p>
        <p class="nutrition-sub">1名分あたり　社交性 ${n.social}%　カフェイン含有率 ${n.caffeine}%</p>
        <table>
          <tr><td>エネルギー（やる気）</td><td>${n.energy} kcal</td></tr>
          <tr><td>たんぱく質（根性）</td><td>${n.protein} g</td></tr>
          <tr><td>脂質（脂肪ではなく蓄え）</td><td>${n.fat} g</td></tr>
          <tr><td>炭水化物（言い訳）</td><td>${n.carb} g</td></tr>
          <tr><td>食塩相当量（周囲への塩対応）</td><td>${n.salt} g</td></tr>
        </table>
      </div>
      <p class="label-notes">${escapeHtml(label.caution)}<br />${label.notes.map(escapeHtml).join("<br />")}</p>
    `;

    drawBarcode(els.barcode, label.barcode);

    // バーコード数字
    let digits = els.labelSeal.querySelector(".barcode-digits");
    if (!digits) {
      digits = document.createElement("p");
      digits.className = "barcode-digits";
      els.labelSeal.appendChild(digits);
    }
    digits.textContent = label.barcode;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ========== 画像エクスポート ========== */

  function exportPng() {
    const label = state.label;
    if (!label) return;

    const canvas = els.exportCanvas;
    const ctx = canvas.getContext("2d");
    const W = 1080;
    const pad = 56;
    const contentW = W - pad * 2;

    // 高さは内容に合わせて後で決めるが、まずは大きめに描画してからトリムしない簡易版
    // 固定キャンバスをクリアして描画
    const H = canvas.height;
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, W, H);

    // シール背景
    const sealX = 70;
    const sealY = 70;
    const sealW = W - 140;
    const sealH = H - 140;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((-0.6 * Math.PI) / 180);
    ctx.translate(-W / 2, -H / 2);

    ctx.fillStyle = "#f7f4ec";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 6;
    ctx.fillRect(sealX, sealY, sealW, sealH);
    ctx.strokeRect(sealX, sealY, sealW, sealH);

    let y = sealY + 48;
    const left = sealX + 48;
    const right = sealX + sealW - 48;
    const maxTextW = sealW - 96;

    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.font = "bold 44px sans-serif";
    wrapText(ctx, label.productName, W / 2, y, maxTextW, 52);
    y += 58;
    ctx.font = "26px sans-serif";
    ctx.fillStyle = "#444";
    ctx.fillText(label.displayName, W / 2, y);
    y += 28;

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    y += 40;

    ctx.textAlign = "left";
    ctx.fillStyle = "#1a1a1a";

    const rows = [
      ["名称", label.formalName],
      ["原材料名", label.ingredients],
      ["添加物", label.additives],
      ["内容量", label.volume],
      ["賞味期限", label.expiry],
      ["保存方法", label.storage],
      ["製造者", label.maker],
    ];

    rows.forEach(([k, v]) => {
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(k, left, y);
      ctx.font = "26px sans-serif";
      const lines = wrapText(ctx, v, left + 160, y, maxTextW - 160, 34);
      y += Math.max(40, lines * 34 + 8);
    });

    y += 12;
    // 栄養枠
    const n = label.nutrition;
    const boxTop = y;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;

    ctx.font = "bold 28px sans-serif";
    ctx.fillText("栄養成分表示風", left + 16, y + 34);
    y += 52;
    ctx.font = "22px sans-serif";
    ctx.fillText(
      `1名分あたり　社交性 ${n.social}%　カフェイン含有率 ${n.caffeine}%`,
      left + 16,
      y
    );
    y += 36;

    const nutRows = [
      [`エネルギー（やる気）`, `${n.energy} kcal`],
      [`たんぱく質（根性）`, `${n.protein} g`],
      [`脂質（脂肪ではなく蓄え）`, `${n.fat} g`],
      [`炭水化物（言い訳）`, `${n.carb} g`],
      [`食塩相当量（周囲への塩対応）`, `${n.salt} g`],
    ];

    nutRows.forEach(([a, b]) => {
      ctx.font = "24px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(a, left + 16, y);
      ctx.textAlign = "right";
      ctx.fillText(b, right - 16, y);
      ctx.textAlign = "left";
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left + 16, y + 10);
      ctx.lineTo(right - 16, y + 10);
      ctx.stroke();
      y += 38;
    });

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.strokeRect(left, boxTop, maxTextW, y - boxTop + 12);
    y += 36;

    ctx.font = "22px sans-serif";
    ctx.fillStyle = "#333";
    const noteText = [label.caution, ...label.notes].join("\n");
    noteText.split("\n").forEach((line) => {
      const lines = wrapText(ctx, line, left, y, maxTextW, 30);
      y += lines * 30 + 4;
    });

    // バーコード
    y += 16;
    const bcW = 520;
    const bcH = 90;
    const bcX = (W - bcW) / 2;
    const tmp = document.createElement("canvas");
    tmp.width = bcW;
    tmp.height = bcH;
    drawBarcode(tmp, label.barcode);
    ctx.drawImage(tmp, bcX, y);
    y += bcH + 28;
    ctx.font = "22px monospace";
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.fillText(label.barcode, W / 2, y);

    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jinsei-seibun.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = String(text).split("");
    let line = "";
    let lines = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y + lines * lineHeight);
        line = chars[i];
        lines += 1;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
    }
    return Math.max(1, lines);
  }

  /* ========== シェア ========== */

  function shareToX() {
    const label = state.label;
    if (!label) return;
    const parts = label.ingredients.split(" / ").slice(0, 2);
    const text = [
      `【${label.productName}】`,
      `原材料: ${parts.join(" / ")}…`,
      `#人生の成分表示`,
    ].join("\n");

    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

    if (navigator.share) {
      navigator
        .share({ title: "人生の成分表示", text })
        .catch(() => {
          window.open(intent, "_blank", "noopener,noreferrer");
        });
    } else {
      window.open(intent, "_blank", "noopener,noreferrer");
    }
  }

  /* ========== ホログラム演出 ========== */

  function setShine(nx, ny) {
    // nx, ny: -0.5〜0.5 程度
    const x = nx * 55;
    const y = ny * 35;
    els.labelShine.style.transform = `translate3d(${x}%, ${y}%, 0)`;
  }

  function onPointerMove(e) {
    if (!screens.result.classList.contains("is-active")) return;
    const rect = els.labelSeal.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / rect.width;
    const ny = (e.clientY - cy) / rect.height;
    setShine(nx, ny);
  }

  function onDeviceOrientation(e) {
    if (!screens.result.classList.contains("is-active")) return;
    const gamma = e.gamma || 0; // -90〜90
    const beta = e.beta || 0;
    setShine(clamp(gamma / 45, -1, 1) * 0.5, clamp((beta - 45) / 45, -1, 1) * 0.5);
  }

  function tryEnableOrientation() {
    const handler = () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", onDeviceOrientation);
            }
          })
          .catch(() => {});
      } else if (typeof DeviceOrientationEvent !== "undefined") {
        window.addEventListener("deviceorientation", onDeviceOrientation);
      }
    };
    // ユーザー操作後に試す（結果画面のタッチ）
    els.labelSeal.addEventListener("pointerdown", handler, { once: true });
  }

  /* ========== イベント ========== */

  els.start.addEventListener("click", startQuiz);
  els.name.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startQuiz();
  });
  els.save.addEventListener("click", exportPng);
  els.share.addEventListener("click", shareToX);
  els.retry.addEventListener("click", () => {
    showScreen("title");
  });

  window.addEventListener("pointermove", onPointerMove);
  tryEnableOrientation();

  // 非タッチ環境向けに初期傾き
  setShine(-0.15, -0.05);
})();
