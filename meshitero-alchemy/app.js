(function () {
  "use strict";

  var INGREDIENTS = [
    { id: "mayo", name: "マヨネーズ", emoji: "🧴", kcal: 720 },
    { id: "garlic", name: "ニンニク", emoji: "🧄", kcal: 150 },
    { id: "cheese", name: "チーズ", emoji: "🧀", kcal: 400 },
    { id: "fat", name: "背脂", emoji: "🥓", kcal: 850 },
    { id: "karaage", name: "唐揚げ", emoji: "🍗", kcal: 520 },
    { id: "choco", name: "チョコ", emoji: "🍫", kcal: 560 },
    { id: "mentaiko", name: "明太子", emoji: "🌶️", kcal: 180 },
    { id: "butter", name: "バター", emoji: "🧈", kcal: 750 },
    { id: "rice", name: "ごはん", emoji: "🍚", kcal: 250 },
    { id: "potato", name: "ポテト", emoji: "🍟", kcal: 380 },
    { id: "midnight", name: "深夜2時の空気", emoji: "🌌", kcal: 0 },
    { id: "guilt", name: "背徳感", emoji: "😈", kcal: 66 }
  ];

  var PREFIXES = [
    "禁断の",
    "深夜限定",
    "伝説の",
    "溶ける",
    "爆熱",
    "罪深き",
    "狂乱の",
    "封印されし",
    "極悪",
    "悶絶"
  ];

  var MIDFIXES = [
    "トリプル",
    "ダブル",
    "メガ",
    "ウルトラ",
    "ハイブリッド",
    "カオス",
    ""
  ];

  var SUFFIXES = [
    "爆弾",
    "盛り",
    "丼",
    "バーガー",
    "鍋",
    "サンド",
    "ラヴァ",
    "デビル",
    "タワー",
    "フィナーレ"
  ];

  var TEMPLATES = [
    "一口噛んだ瞬間、{a}と{b}が舌の上で衝突し、脳内に花火が上がる。翌朝の自分への手紙は「ごめん」の二文字だけで足りる。",
    "じゅわっ、と{c}の香りが部屋を支配する。推定カロリーは数字ではなく覚悟だ。冷蔵庫の扉が、そっと目を逸らした。",
    "夜の帳が降りるころ、{a}仕込みのその一皿は理性を溶かす。{b}の余韻が胃袋に居座るまで、時計は止まっている。",
    "フライパンが悲鳴を上げ、{c}がとろけ落ちる。これは食事ではなく儀式——そして儀式のあとに残るのは、幸せな後悔だけ。",
    "街灯だけが目撃者。{a}の油膜が光を屈折させ、{b}が追い打ちをかける。飯テロという名の錬金術は、今夜も成功した。"
  ];

  var NIGHT_BONUS = 333;
  var MAX_SELECT = 3;

  var selected = [];
  var chipGrid = document.getElementById("chipGrid");
  var selectHint = document.getElementById("selectHint");
  var alchemyBtn = document.getElementById("alchemyBtn");
  var resetBtn = document.getElementById("resetBtn");
  var cauldron = document.getElementById("cauldron");
  var stewEmojis = document.getElementById("stewEmojis");
  var result = document.getElementById("result");
  var conceptArt = document.getElementById("conceptArt");
  var dishName = document.getElementById("dishName");
  var calories = document.getElementById("calories");
  var sizzle = document.getElementById("sizzle");

  function byId(id) {
    for (var i = 0; i < INGREDIENTS.length; i++) {
      if (INGREDIENTS[i].id === id) return INGREDIENTS[i];
    }
    return null;
  }

  function renderChips() {
    chipGrid.innerHTML = "";
    var full = selected.length >= MAX_SELECT;

    for (var i = 0; i < INGREDIENTS.length; i++) {
      var item = INGREDIENTS[i];
      var isOn = selected.indexOf(item.id) !== -1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (isOn ? " is-selected" : "") + (!isOn && full ? " is-disabled" : "");
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");
      btn.disabled = !isOn && full;
      btn.dataset.id = item.id;

      var emo = document.createElement("span");
      emo.className = "chip-emoji";
      emo.setAttribute("aria-hidden", "true");
      emo.textContent = item.emoji;

      var name = document.createElement("span");
      name.className = "chip-name";
      name.textContent = item.name;

      btn.appendChild(emo);
      btn.appendChild(name);
      btn.addEventListener("click", onChipClick);
      chipGrid.appendChild(btn);
    }
  }

  function onChipClick(e) {
    var id = e.currentTarget.dataset.id;
    var idx = selected.indexOf(id);
    if (idx !== -1) {
      selected.splice(idx, 1);
    } else if (selected.length < MAX_SELECT) {
      selected.push(id);
    }
    updateUI();
  }

  function updateStew() {
    stewEmojis.textContent = "";
    for (var i = 0; i < selected.length; i++) {
      var item = byId(selected[i]);
      if (item) {
        var span = document.createElement("span");
        span.textContent = item.emoji;
        stewEmojis.appendChild(span);
      }
    }
  }

  function updateUI() {
    selectHint.textContent = selected.length + " / " + MAX_SELECT;
    alchemyBtn.disabled = selected.length === 0;
    updateStew();
    renderChips();
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shortenName(name) {
    var map = {
      "マヨネーズ": "マヨ",
      "ニンニク": "ニンニク",
      "チーズ": "チーズ",
      "背脂": "背脂",
      "唐揚げ": "唐揚げ",
      "チョコ": "チョコ",
      "明太子": "明太",
      "バター": "バター",
      "ごはん": "ごはん",
      "ポテト": "ポテト",
      "深夜2時の空気": "深夜空気",
      "背徳感": "背徳"
    };
    return map[name] || name;
  }

  function buildDishName(items) {
    var short = [];
    for (var i = 0; i < items.length; i++) {
      short.push(shortenName(items[i].name));
    }
    var core = short.join("");
    var prefix = pick(PREFIXES);
    var mid = items.length >= 3 ? pick(["トリプル", "メガ", "カオス", "ウルトラ", ""]) : pick(MIDFIXES);
    var suffix = pick(SUFFIXES);
    return prefix + mid + core + suffix;
  }

  function calcCalories(items) {
    var total = NIGHT_BONUS;
    for (var i = 0; i < items.length; i++) {
      total += items[i].kcal;
    }
    return total;
  }

  function buildSizzle(items) {
    var a = items[0] ? items[0].name : "謎の食材";
    var b = items[1] ? items[1].name : items[0].name;
    var c = items[2] ? items[2].name : (items[1] ? items[1].name : items[0].name);
    var tpl = pick(TEMPLATES);
    return tpl
      .replace(/\{a\}/g, a)
      .replace(/\{b\}/g, b)
      .replace(/\{c\}/g, c);
  }

  function showResult() {
    var items = [];
    for (var i = 0; i < selected.length; i++) {
      items.push(byId(selected[i]));
    }

    conceptArt.innerHTML = "";
    for (var j = 0; j < items.length; j++) {
      var span = document.createElement("span");
      span.textContent = items[j].emoji;
      conceptArt.appendChild(span);
    }

    dishName.textContent = buildDishName(items);
    var kcal = calcCalories(items);
    calories.textContent = "推定カロリー：約 " + kcal.toLocaleString("ja-JP") + " kcal（深夜ボーナス +" + NIGHT_BONUS + " 込み）";
    sizzle.textContent = buildSizzle(items);

    result.hidden = false;
    resetBtn.hidden = false;
    result.style.animation = "none";
    void result.offsetWidth;
    result.style.animation = "";
  }

  function alchemy() {
    if (selected.length === 0) return;

    alchemyBtn.disabled = true;
    cauldron.classList.add("is-cooking");

    window.setTimeout(function () {
      cauldron.classList.remove("is-cooking");
      showResult();
      alchemyBtn.disabled = selected.length === 0;
    }, 900);
  }

  function reset() {
    selected = [];
    result.hidden = true;
    resetBtn.hidden = true;
    dishName.textContent = "";
    calories.textContent = "";
    sizzle.textContent = "";
    conceptArt.innerHTML = "";
    updateUI();
  }

  alchemyBtn.addEventListener("click", alchemy);
  resetBtn.addEventListener("click", reset);

  updateUI();
})();
