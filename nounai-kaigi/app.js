(() => {
  "use strict";

  const PERSONAS = [
    {
      id: "risei",
      name: "理性",
      short: "理",
      className: "risei",
    },
    {
      id: "honnou",
      name: "本能",
      short: "本",
      className: "honnou",
    },
    {
      id: "taida",
      name: "怠惰",
      short: "怠",
      className: "taida",
    },
    {
      id: "saifu",
      name: "財布",
      short: "財",
      className: "saifu",
    },
    {
      id: "chourou",
      name: "謎の長老",
      short: "老",
      className: "chourou",
    },
  ];

  const LINES = {
    risei: {
      for: [
        "「{t}」について整理すると、合理的な利点が複数ある。賛成だ。",
        "感情を排して見ても、{t}はコスト対効果で許容範囲内だ。",
        "長期視点でも、{t}を選ぶ根拠は十分に揃っている。",
        "結論として、{t}は論理的に支持できる。私は賛成票を投じる。",
      ],
      against: [
        "「{t}」を冷静に検証すると、前提が脆い。反対せざるを得ない。",
        "リスクとリターンを秤にかければ、{t}は割に合わない。",
        "再現性のある根拠が薄い。{t}は見送りが妥当だ。",
        "理性の立場から、{t}には反対する。",
      ],
    },
    honnou: {
      for: [
        "体がもう決めてる。{t}、やるしかないだろ！",
        "理屈はあとでいい。今この瞬間、{t}が欲しい。",
        "胸の奥がざわついてる。{t}に逆らうな。",
        "本能はYESだ。{t}、全開で行こう！",
      ],
      against: [
        "なんか嫌な予感がする。{t}は止めとけ。",
        "体が拒否してる。{t}、今じゃない。",
        "ワクワクが足りない。{t}はパスだ。",
        "本能が警鐘鳴らしてる。{t}には反対！",
      ],
    },
    taida: {
      for: [
        "めんどくさい抵抗は疲れる。{t}、流れに乗った方が楽だよ。",
        "考えすぎるとエネルギー減るし、{t}でいいんじゃない？",
        "どうせ後で後悔するなら、早めに{t}して寝たい。",
        "怠惰としては、{t}の方が動作が少ない。賛成。",
      ],
      against: [
        "それ、手間じゃない？ {t}はやめておきたい。",
        "動くのがしんどい。{t}は今の快適さを壊す。",
        "決断も面倒だけど、実行がもっと面倒。{t}は却下。",
        "横になったままで済む案を推す。{t}には反対。",
      ],
    },
    saifu: {
      for: [
        "帳尻は合う。{t}は許容できる出費レンジだ。",
        "機会損失を考えると、{t}は投資に近い。",
        "家計シミュレーション上、{t}は赤字転落まではいかない。",
        "財布としては渋々だが、{t}に賛成しておく。",
      ],
      against: [
        "金が溶ける匂いがする。{t}は絶対ダメ。",
        "将来の自分への借金だ。{t}は却下。",
        "コスパ最悪。{t}に出す価値が見えない。",
        "財布は悲鳴を上げている。{t}には反対だ。",
      ],
    },
    chourou: {
      for: [
        "ふむ…風が{t}の方を向いておる。進め。",
        "月明かりが味方しておる。{t}は吉と出た。",
        "迷いの霧が晴れた。{t}を選ぶがよい。",
        "長老、許可する。{t}にて議を閉じよう。",
      ],
      against: [
        "影が長い…{t}は時ならぬ選択じゃ。",
        "石が沈黙しておる。{t}はまだ早い。",
        "流れが逆じゃ。{t}は退け。",
        "長老は首を横に振る。{t}には反対じゃ。",
      ],
    },
  };

  const PASS_COMMENTS = [
    "脳内多数決により、本件は可決された。あとは実行あるのみ。",
    "議論は白熱したが、賛成が上回った。堂々と進めよ。",
    "五人格の合議の末、青信号が出た。責任は全員で持つ。",
  ];

  const FAIL_COMMENTS = [
    "採決の結果、否決。今日はその衝動を寝かせておけ。",
    "反対が優勢だった。別案を練り直すがよい。",
    "脳内閣は却下した。悔しさは明日の燃料にせよ。",
  ];

  const els = {
    topicInput: document.getElementById("topicInput"),
    startBtn: document.getElementById("startBtn"),
    intakeHint: document.getElementById("intakeHint"),
    gauges: document.getElementById("gauges"),
    forVal: document.getElementById("forVal"),
    againstVal: document.getElementById("againstVal"),
    forBar: document.getElementById("forBar"),
    againstBar: document.getElementById("againstBar"),
    meeting: document.getElementById("meeting"),
    meetingTopic: document.getElementById("meetingTopic"),
    meetingStatus: document.getElementById("meetingStatus"),
    chat: document.getElementById("chat"),
    verdict: document.getElementById("verdict"),
    verdictStamp: document.getElementById("verdictStamp"),
    verdictComment: document.getElementById("verdictComment"),
    dlBtn: document.getElementById("dlBtn"),
    againBtn: document.getElementById("againBtn"),
    canvas: document.getElementById("decreeCanvas"),
  };

  let forScore = 0;
  let againstScore = 0;
  let running = false;
  let lastResult = null;
  let abortToken = 0;

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sleep(ms, token) {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        if (token !== abortToken) reject(new Error("aborted"));
        else resolve();
      }, ms);
    });
  }

  function setGauges() {
    const total = Math.max(forScore + againstScore, 1);
    const forPct = Math.round((forScore / total) * 100);
    const againstPct = Math.round((againstScore / total) * 100);
    els.forVal.textContent = String(forScore);
    els.againstVal.textContent = String(againstScore);
    els.forBar.style.width = `${forPct}%`;
    els.againstBar.style.width = `${againstPct}%`;
  }

  function resetUI() {
    forScore = 0;
    againstScore = 0;
    setGauges();
    els.chat.innerHTML = "";
    els.verdict.hidden = true;
    els.gauges.hidden = true;
    els.meeting.hidden = true;
    els.intakeHint.textContent = "";
    els.meetingStatus.textContent = "開会中…";
    els.startBtn.disabled = false;
    els.topicInput.disabled = false;
  }

  function buildScript(topic) {
    const rounds = 3 + Math.floor(Math.random() * 2); // 3 or 4
    const script = [];
    const leanBias = Math.random() < 0.5 ? "for" : "against";

    for (let r = 0; r < rounds; r++) {
      const order = shuffle(PERSONAS);
      for (const persona of order) {
        const sway = Math.random();
        let side;
        if (sway < 0.55) side = leanBias;
        else if (sway < 0.85) side = leanBias === "for" ? "against" : "for";
        else side = Math.random() < 0.5 ? "for" : "against";

        const pool = LINES[persona.id][side];
        const template = pool[r % pool.length];
        const text = template.replace(/\{t\}/g, topic);
        const delta = 8 + Math.floor(Math.random() * 10);
        script.push({ persona, side, text, delta });
      }
    }

    // ensure each persona appears at least 3 times already via rounds;
    // trim if somehow too long (5 * 4 = 20 max, fine)
    return { script, leanBias };
  }

  function appendMessage(item) {
    const msg = document.createElement("article");
    msg.className = `msg is-${item.side}`;

    const avatar = document.createElement("div");
    avatar.className = `avatar persona-${item.persona.className}`;
    avatar.textContent = item.persona.short;
    avatar.setAttribute("aria-hidden", "true");

    const body = document.createElement("div");
    body.className = "msg-body";

    const name = document.createElement("p");
    name.className = `msg-name ${item.persona.className}`;
    name.textContent = item.persona.name;

    const text = document.createElement("p");
    text.className = "msg-text";
    text.textContent = item.text;

    const stance = document.createElement("span");
    stance.className = `msg-stance ${item.side}`;
    stance.textContent = item.side === "for" ? "賛成" : "反対";

    body.append(name, text, stance);
    msg.append(avatar, body);
    els.chat.appendChild(msg);
    els.chat.scrollTop = els.chat.scrollHeight;
  }

  function applyDelta(side, delta) {
    if (side === "for") forScore += delta;
    else againstScore += delta;
    setGauges();
  }

  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}年${m}月${day}日`;
  }

  function wrapText(ctx, text, maxWidth) {
    const chars = Array.from(text);
    const lines = [];
    let line = "";
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawDecree(result) {
    const canvas = els.canvas;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // paper
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#f6f1e4");
    paper.addColorStop(1, "#ebe3d0");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);

    // subtle fiber
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#6a5a40";
    for (let i = 0; i < 40; i++) {
      const y = ((i * 97) % h) + 0.5;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 40, y + ((i % 5) - 2));
      ctx.stroke();
    }
    ctx.restore();

    // outer frame
    ctx.strokeStyle = "#1f2a30";
    ctx.lineWidth = 8;
    ctx.strokeRect(48, 48, w - 96, h - 96);
    ctx.lineWidth = 2;
    ctx.strokeRect(68, 68, w - 136, h - 136);

    // header bar
    ctx.fillStyle = "#1f3d3a";
    ctx.fillRect(96, 110, w - 192, 92);
    ctx.fillStyle = "#f3f0e8";
    ctx.font = '700 42px "Hiragino Mincho ProN", "Yu Mincho", serif';
    ctx.textAlign = "center";
    ctx.fillText("脳内閣議決定書", w / 2, 170);

    ctx.fillStyle = "#5a5044";
    ctx.font = '28px "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    ctx.fillText(formatDate(result.date), w / 2, 250);

    ctx.fillStyle = "#152028";
    ctx.font = '700 30px "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    ctx.fillText("議　題", w / 2, 330);

    ctx.font = '36px "Hiragino Mincho ProN", "Yu Mincho", serif';
    const topicLines = wrapText(ctx, result.topic, w - 260);
    let ty = 390;
    for (const line of topicLines.slice(0, 3)) {
      ctx.fillText(line, w / 2, ty);
      ty += 52;
    }

    // divider
    ctx.strokeStyle = "#8a7a60";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(160, ty + 20);
    ctx.lineTo(w - 160, ty + 20);
    ctx.stroke();

    const passed = result.passed;
    ctx.fillStyle = passed ? "#1f7a6c" : "#a53d30";
    ctx.font = '700 96px "Hiragino Mincho ProN", "Yu Mincho", serif';
    ctx.fillText(passed ? "可　決" : "否　決", w / 2, ty + 150);

    // stamp circle
    ctx.save();
    ctx.translate(w * 0.78, ty + 140);
    ctx.rotate((-12 * Math.PI) / 180);
    ctx.strokeStyle = passed ? "rgba(31,122,108,0.85)" : "rgba(165,61,48,0.85)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = passed ? "rgba(31,122,108,0.9)" : "rgba(165,61,48,0.9)";
    ctx.font = '700 34px "Hiragino Mincho ProN", "Yu Mincho", serif';
    ctx.fillText(passed ? "決" : "却", 0, 12);
    ctx.restore();

    ctx.fillStyle = "#3a4a55";
    ctx.font = '28px "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    const commentLines = wrapText(ctx, result.comment, w - 280);
    let cy = ty + 250;
    for (const line of commentLines) {
      ctx.fillText(line, w / 2, cy);
      cy += 44;
    }

    ctx.fillStyle = "#5a5044";
    ctx.font = '26px "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    ctx.fillText(
      `賛成 ${result.forScore} ／ 反対 ${result.againstScore}`,
      w / 2,
      cy + 40
    );

    // signature block
    const sigY = h - 220;
    ctx.strokeStyle = "#1f2a30";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 180, sigY);
    ctx.lineTo(w / 2 + 180, sigY);
    ctx.stroke();

    ctx.fillStyle = "#152028";
    ctx.font = 'italic 34px "Hiragino Mincho ProN", "Yu Mincho", serif';
    ctx.fillText("脳内五人格 連署", w / 2, sigY + 55);

    ctx.font = '24px "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
    ctx.fillStyle = "#6a6054";
    ctx.fillText("理性・本能・怠惰・財布・謎の長老", w / 2, sigY + 100);

    return canvas;
  }

  function downloadDecree() {
    if (!lastResult) return;
    drawDecree(lastResult);
    const a = document.createElement("a");
    const stamp = lastResult.passed ? "kaketsu" : "hiketsu";
    a.download = `nounai-kakugi-${stamp}.png`;
    a.href = els.canvas.toDataURL("image/png");
    a.click();
  }

  async function runMeeting(topic) {
    const token = ++abortToken;
    running = true;
    forScore = 0;
    againstScore = 0;
    setGauges();
    els.chat.innerHTML = "";
    els.verdict.hidden = true;
    els.gauges.hidden = false;
    els.meeting.hidden = false;
    els.meetingTopic.textContent = `議題：${topic}`;
    els.meetingStatus.textContent = "討論中…";
    els.startBtn.disabled = true;
    els.topicInput.disabled = true;
    els.intakeHint.textContent = "";

    const { script } = buildScript(topic);

    try {
      for (let i = 0; i < script.length; i++) {
        await sleep(i === 0 ? 450 : 780 + Math.floor(Math.random() * 420), token);
        const item = script[i];
        appendMessage(item);
        applyDelta(item.side, item.delta);
        els.meetingStatus.textContent = `発言 ${i + 1} / ${script.length}`;
      }

      await sleep(700, token);

      const passed = forScore >= againstScore;
      const comment = pick(passed ? PASS_COMMENTS : FAIL_COMMENTS);
      lastResult = {
        topic,
        passed,
        comment,
        forScore,
        againstScore,
        date: new Date(),
      };

      els.meetingStatus.textContent = "採決完了";
      els.verdictStamp.textContent = passed ? "可決" : "否決";
      els.verdictStamp.className =
        "verdict-stamp " + (passed ? "is-pass" : "is-fail");
      els.verdictComment.textContent = comment;
      els.verdict.hidden = false;
      els.verdict.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      if (err && err.message === "aborted") return;
      throw err;
    } finally {
      running = false;
      els.startBtn.disabled = false;
      els.topicInput.disabled = false;
    }
  }

  function onStart() {
    if (running) return;
    const topic = els.topicInput.value.trim();
    if (!topic) {
      els.intakeHint.textContent = "議題を入力してください。";
      els.topicInput.focus();
      return;
    }
    if (topic.length > 40) {
      els.intakeHint.textContent = "議題は40文字以内にしてください。";
      return;
    }
    runMeeting(topic);
  }

  function onAgain() {
    abortToken += 1;
    running = false;
    lastResult = null;
    resetUI();
    els.topicInput.value = "";
    els.topicInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  els.startBtn.addEventListener("click", onStart);
  els.dlBtn.addEventListener("click", downloadDecree);
  els.againBtn.addEventListener("click", onAgain);
  els.topicInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onStart();
    }
  });
})();
