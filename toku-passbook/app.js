(function () {
  "use strict";

  var STORAGE_KEY = "toku-passbook-v1";

  var PRESETS = [
    { memo: "エレベーターの開ボタンを押した", amount: 50 },
    { memo: "電車で席を譲った（迷わず即決）", amount: 80 },
    { memo: "落ちているゴミを拾って捨てた", amount: 40 },
    { memo: "「お先にどうぞ」が完璧に決まった", amount: 30 },
    { memo: "野良猫に敬意を込めて頭を下げた", amount: 60 },
    { memo: "親に近況報告の電話をした", amount: 100 },
    { memo: "レジ横のチョコを衝動買い", amount: -20 },
    { memo: "満員電車でつり革を片腕独占", amount: -40 },
    { memo: "既読スルーを堂々と遂行した", amount: -50 },
    { memo: "風呂の排水口掃除をまた先送り", amount: -30 },
    { memo: "SNSで盛大に愚痴を投下した", amount: -70 },
    { memo: "「あと5分…」を10回繰り返した", amount: -25 }
  ];

  var RANKS = [
    {
      min: 3000,
      name: "天界エリート",
      desc: "徳が溢れすぎて、来世は雲の上の役員室行き。"
    },
    {
      min: 1000,
      name: "大富豪",
      desc: "来世は資産も徳も厚い。朝から笑顔が止まらない階層。"
    },
    {
      min: 500,
      name: "社長",
      desc: "それなりに立派。来世は肩書付きでリスタート。"
    },
    {
      min: 200,
      name: "平社員",
      desc: "堅実コース。来世も残業はあるが、ご飯は美味い。"
    },
    {
      min: 0,
      name: "一般人",
      desc: "まあまあ普通。来世も今くらいの人生が待っている。"
    },
    {
      min: -200,
      name: "カメ",
      desc: "ペースは遅いが長生き。来世は甲羅ライフ。"
    },
    {
      min: -500,
      name: "ミジンコ",
      desc: "存在感は薄い。来世は水たまりの端っこ。"
    },
    {
      min: -Infinity,
      name: "石ころ",
      desc: "徳が枯渇。来世は道端で踏まれ役。"
    }
  ];

  var state = {
    balance: 0,
    entries: []
  };

  var els = {
    rankName: document.getElementById("rankName"),
    rankDesc: document.getElementById("rankDesc"),
    balanceValue: document.getElementById("balanceValue"),
    ledgerBody: document.getElementById("ledgerBody"),
    emptyRow: document.getElementById("emptyRow"),
    presetGrid: document.getElementById("presetGrid"),
    customForm: document.getElementById("customForm"),
    customMemo: document.getElementById("customMemo"),
    customAmount: document.getElementById("customAmount"),
    clearBtn: document.getElementById("clearBtn")
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      if (typeof data.balance === "number" && Number.isFinite(data.balance)) {
        state.balance = Math.trunc(data.balance);
      }
      if (Array.isArray(data.entries)) {
        state.entries = data.entries
          .filter(function (e) {
            return (
              e &&
              typeof e.memo === "string" &&
              typeof e.amount === "number" &&
              typeof e.balance === "number" &&
              typeof e.date === "string"
            );
          })
          .map(function (e) {
            return {
              date: e.date,
              memo: String(e.memo).slice(0, 40),
              amount: Math.trunc(e.amount),
              balance: Math.trunc(e.balance)
            };
          });
      }
    } catch (err) {
      state.balance = 0;
      state.entries = [];
    }
  }

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        balance: state.balance,
        entries: state.entries
      })
    );
  }

  function getRank(balance) {
    for (var i = 0; i < RANKS.length; i++) {
      if (balance >= RANKS[i].min) return RANKS[i];
    }
    return RANKS[RANKS.length - 1];
  }

  function formatSigned(n) {
    var abs = Math.abs(n).toLocaleString("ja-JP");
    if (n > 0) return "+" + abs;
    if (n < 0) return "-" + abs;
    return "0";
  }

  function formatBalance(n) {
    return n.toLocaleString("ja-JP");
  }

  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "/" + m + "/" + day;
  }

  function updateRankUI() {
    var rank = getRank(state.balance);
    els.rankName.textContent = rank.name;
    els.rankDesc.textContent = rank.desc;
    els.balanceValue.textContent = formatBalance(state.balance);
    els.balanceValue.classList.remove("is-plus", "is-minus");
    if (state.balance > 0) els.balanceValue.classList.add("is-plus");
    if (state.balance < 0) els.balanceValue.classList.add("is-minus");
  }

  function createRow(entry, animate) {
    var tr = document.createElement("tr");
    tr.className = "ledger-row" + (animate ? " is-printing" : "");

    var tdDate = document.createElement("td");
    tdDate.textContent = entry.date;

    var tdMemo = document.createElement("td");
    tdMemo.textContent = entry.memo;

    var tdDelta = document.createElement("td");
    tdDelta.textContent = formatSigned(entry.amount);
    tdDelta.className = entry.amount >= 0 ? "delta-plus" : "delta-minus";

    var tdBalance = document.createElement("td");
    tdBalance.textContent = formatBalance(entry.balance);

    tr.appendChild(tdDate);
    tr.appendChild(tdMemo);
    tr.appendChild(tdDelta);
    tr.appendChild(tdBalance);
    return tr;
  }

  function renderLedger(animateFirst) {
    var body = els.ledgerBody;
    body.innerHTML = "";

    if (state.entries.length === 0) {
      var empty = document.createElement("tr");
      empty.className = "empty-row";
      empty.id = "emptyRow";
      var td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = "まだ記帳がありません。善行か悪行をどうぞ。";
      empty.appendChild(td);
      body.appendChild(empty);
      els.emptyRow = empty;
      return;
    }

    state.entries.forEach(function (entry, index) {
      body.appendChild(createRow(entry, animateFirst && index === 0));
    });
  }

  function addEntry(memo, amount) {
    var trimmed = String(memo || "").trim();
    var value = Math.trunc(Number(amount));
    if (!trimmed) return;
    if (!Number.isFinite(value) || value === 0) return;

    state.balance += value;
    state.entries.unshift({
      date: formatDate(new Date()),
      memo: trimmed.slice(0, 40),
      amount: value,
      balance: state.balance
    });

    save();
    updateRankUI();
    renderLedger(true);
  }

  function clearAll() {
    var ok = window.confirm("通帳の明細と残高をすべて消去しますか？");
    if (!ok) return;
    state.balance = 0;
    state.entries = [];
    save();
    updateRankUI();
    renderLedger(false);
  }

  function renderPresets() {
    var frag = document.createDocumentFragment();
    PRESETS.forEach(function (preset) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "preset-btn " + (preset.amount >= 0 ? "is-good" : "is-bad");

      var memo = document.createElement("span");
      memo.className = "preset-memo";
      memo.textContent = preset.memo;

      var delta = document.createElement("span");
      delta.className = "preset-delta";
      delta.textContent = formatSigned(preset.amount);

      btn.appendChild(memo);
      btn.appendChild(delta);
      btn.addEventListener("click", function () {
        addEntry(preset.memo, preset.amount);
      });
      frag.appendChild(btn);
    });
    els.presetGrid.appendChild(frag);
  }

  function onCustomSubmit(event) {
    event.preventDefault();
    var memo = els.customMemo.value;
    var amount = els.customAmount.value;
    addEntry(memo, amount);
    els.customForm.reset();
    els.customMemo.focus();
  }

  function init() {
    load();
    renderPresets();
    updateRankUI();
    renderLedger(false);
    els.customForm.addEventListener("submit", onCustomSubmit);
    els.clearBtn.addEventListener("click", clearAll);
  }

  init();
})();
