(() => {
  "use strict";

  const SIZES = {
    square: { w: 1080, h: 1080 },
    wide: { w: 1200, h: 630 },
  };

  const FONT_STACK =
    '"Hiragino Mincho ProN", "Hiragino Mincho Pro", "Yu Mincho", "YuMincho", "MS PMincho", "MS Mincho", "Noto Serif CJK JP", "Noto Serif JP", serif';

  const els = {
    canvas: document.getElementById("preview"),
    textInput: document.getElementById("textInput"),
    charCount: document.getElementById("charCount"),
    speedLines: document.getElementById("speedLines"),
    speedLinesLabel: document.getElementById("speedLinesLabel"),
    fontSize: document.getElementById("fontSize"),
    sizeLabel: document.getElementById("sizeLabel"),
    downloadBtn: document.getElementById("downloadBtn"),
    previewWrap: document.querySelector(".preview-wrap"),
    layoutInputs: document.querySelectorAll('input[name="layout"]'),
    sizeInputs: document.querySelectorAll('input[name="exportSize"]'),
  };

  const ctx = els.canvas.getContext("2d");

  function getState() {
    const layout =
      document.querySelector('input[name="layout"]:checked')?.value || "don";
    const exportSize =
      document.querySelector('input[name="exportSize"]:checked')?.value ||
      "square";
    return {
      text: [...(els.textInput.value || "")].slice(0, 12).join(""),
      layout,
      speedLines: els.speedLines.checked,
      fontScale: Number(els.fontSize.value) / 100,
      exportSize,
    };
  }

  function updateLabels(state) {
    els.charCount.textContent = `${[...state.text].length} / 12`;
    els.speedLinesLabel.textContent = state.speedLines ? "ON" : "OFF";
    els.sizeLabel.textContent = `${Math.round(state.fontScale * 100)}%`;
    els.previewWrap.classList.toggle("is-wide", state.exportSize === "wide");
  }

  function resizeCanvas(state) {
    const size = SIZES[state.exportSize];
    if (els.canvas.width !== size.w || els.canvas.height !== size.h) {
      els.canvas.width = size.w;
      els.canvas.height = size.h;
    }
  }

  function drawSpeedLines(c, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(cx, cy);
    const count = Math.round(Math.max(w, h) / 9);

    c.save();
    c.translate(cx, cy);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (i % 3) * 0.015;
      const inner = maxR * (0.08 + (i % 5) * 0.012);
      const outer = maxR * (0.98 + (i % 7) * 0.004);
      const width = 1.2 + (i % 4) * 0.9;
      const alpha = 0.12 + (i % 5) * 0.05;

      c.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      c.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      c.stroke();
    }
    c.restore();
  }

  function setFont(c, size, weight = "900") {
    c.font = `${weight} ${size}px ${FONT_STACK}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
  }

  function measureMaxFit(c, text, maxW, maxH, startSize) {
    let size = startSize;
    while (size > 24) {
      setFont(c, size);
      const m = c.measureText(text);
      const h =
        (m.actualBoundingBoxAscent || size * 0.8) +
        (m.actualBoundingBoxDescent || size * 0.2);
      if (m.width <= maxW && h <= maxH) return size;
      size -= 4;
    }
    return size;
  }

  function paintGlyph(c, ch, x, y, size, opts = {}) {
    const {
      fill = "#ffffff",
      stroke = "#d62828",
      strokeWidth = size * 0.08,
      shadow = true,
    } = opts;

    setFont(c, size);
    c.save();
    c.translate(x, y);
    if (opts.rotate) c.rotate(opts.rotate);

    if (shadow) {
      c.shadowColor = "rgba(0, 0, 0, 0.85)";
      c.shadowBlur = size * 0.08;
      c.shadowOffsetX = size * 0.03;
      c.shadowOffsetY = size * 0.04;
    }

    c.lineJoin = "round";
    c.miterLimit = 2;
    c.strokeStyle = stroke;
    c.lineWidth = strokeWidth;
    c.strokeText(ch, 0, 0);

    c.shadowColor = "transparent";
    c.fillStyle = fill;
    c.fillText(ch, 0, 0);

    if (opts.innerStroke) {
      c.strokeStyle = opts.innerStroke;
      c.lineWidth = Math.max(2, size * 0.018);
      c.strokeText(ch, 0, 0);
    }

    c.restore();
  }

  function paintWord(c, text, x, y, size, opts = {}) {
    setFont(c, size);
    c.save();
    c.translate(x, y);
    if (opts.rotate) c.rotate(opts.rotate);

    const fill = opts.fill || "#ffffff";
    const stroke = opts.stroke || "#d62828";
    const strokeWidth = opts.strokeWidth ?? size * 0.085;

    if (opts.shadow !== false) {
      c.shadowColor = "rgba(0, 0, 0, 0.9)";
      c.shadowBlur = size * 0.1;
      c.shadowOffsetX = size * 0.035;
      c.shadowOffsetY = size * 0.045;
    }

    c.lineJoin = "round";
    c.miterLimit = 2;
    c.strokeStyle = stroke;
    c.lineWidth = strokeWidth;
    c.strokeText(text, 0, 0);

    c.shadowColor = "transparent";
    c.fillStyle = fill;
    c.fillText(text, 0, 0);

    c.restore();
  }

  function drawAccentSlash(c, w, h, angle = -0.28) {
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(angle);
    const bandH = Math.max(40, Math.min(w, h) * 0.14);
    const grad = c.createLinearGradient(-w, 0, w, 0);
    grad.addColorStop(0, "rgba(214, 40, 40, 0)");
    grad.addColorStop(0.25, "rgba(214, 40, 40, 0.55)");
    grad.addColorStop(0.5, "rgba(255, 60, 60, 0.75)");
    grad.addColorStop(0.75, "rgba(214, 40, 40, 0.55)");
    grad.addColorStop(1, "rgba(214, 40, 40, 0)");
    c.fillStyle = grad;
    c.fillRect(-w, -bandH / 2, w * 2, bandH);
    c.restore();
  }

  function layoutDon(c, text, w, h, fontScale) {
    const chars = [...text];
    if (!chars.length) return;

    const start = Math.min(w, h) * 0.72 * fontScale;
    const size = measureMaxFit(
      c,
      text,
      w * 0.9,
      h * 0.55,
      start
    );

    // red under-glow block
    c.save();
    c.globalAlpha = 0.18;
    c.fillStyle = "#d62828";
    c.fillRect(w * 0.08, h * 0.42, w * 0.84, h * 0.16);
    c.restore();

    paintWord(c, text, w / 2, h / 2, size, {
      fill: "#ffffff",
      stroke: "#c41616",
      strokeWidth: size * 0.1,
    });

    // small red gem on last character vibe: recolor last glyph overlay
    if (chars.length >= 2) {
      setFont(c, size);
      const fullW = c.measureText(text).width;
      let left = w / 2 - fullW / 2;
      for (let i = 0; i < chars.length - 1; i++) {
        left += c.measureText(chars[i]).width;
      }
      const last = chars[chars.length - 1];
      const lastW = c.measureText(last).width;
      paintGlyph(c, last, left + lastW / 2, h / 2, size, {
        fill: "#ff3b3b",
        stroke: "#ffffff",
        strokeWidth: size * 0.07,
        shadow: false,
      });
    }
  }

  function layoutMix(c, text, w, h, fontScale) {
    const chars = [...text];
    if (!chars.length) return;

    const mid = Math.max(1, Math.ceil(chars.length / 2));
    const vertical = chars.slice(0, mid);
    const horizontal = chars.slice(mid);

    const base = Math.min(w, h) * fontScale;
    const vSize = Math.min(
      base * 0.42,
      (h * 0.78) / Math.max(vertical.length, 1)
    );
    const hSize = Math.min(
      base * 0.28,
      w * 0.5 / Math.max(horizontal.length || 1, 1)
    );

    // vertical column on left-center
    const vx = w * 0.36;
    const totalVH = vertical.length * vSize * 0.95;
    let vy = h / 2 - totalVH / 2 + vSize * 0.45;

    vertical.forEach((ch, i) => {
      const fill = i === 0 ? "#ff3b3b" : "#ffffff";
      const stroke = i === 0 ? "#ffffff" : "#c41616";
      paintGlyph(c, ch, vx, vy, vSize, {
        fill,
        stroke,
        strokeWidth: vSize * 0.09,
      });
      vy += vSize * 0.95;
    });

    if (horizontal.length) {
      const hx = w * 0.68;
      const hy = h * 0.58;
      const hText = horizontal.join("");
      const fitted = measureMaxFit(c, hText, w * 0.48, h * 0.3, hSize);
      paintWord(c, hText, hx, hy, fitted, {
        fill: "#ffffff",
        stroke: "#d62828",
        strokeWidth: fitted * 0.08,
      });

      // tiny accent bar
      c.fillStyle = "#d62828";
      c.fillRect(hx - fitted * horizontal.length * 0.28, hy + fitted * 0.55, fitted * horizontal.length * 0.55, Math.max(4, fitted * 0.05));
    } else {
      // single-stack emphasis mark
      paintWord(c, "！", w * 0.7, h * 0.55, vSize * 0.7, {
        fill: "#ff3b3b",
        stroke: "#ffffff",
        strokeWidth: vSize * 0.05,
      });
    }
  }

  function layoutCutin(c, text, w, h, fontScale) {
    const chars = [...text];
    if (!chars.length) return;

    const angle = -0.32;
    drawAccentSlash(c, w, h, angle);

    const start = Math.min(w, h) * 0.55 * fontScale;
    const size = measureMaxFit(c, text, w * 0.86, h * 0.42, start);

    // dual-layer for cut-in punch
    paintWord(c, text, w / 2 + size * 0.04, h / 2 + size * 0.05, size, {
      fill: "#5a0000",
      stroke: "#5a0000",
      strokeWidth: size * 0.04,
      shadow: false,
      rotate: angle,
    });

    paintWord(c, text, w / 2, h / 2, size, {
      fill: "#ffffff",
      stroke: "#d62828",
      strokeWidth: size * 0.1,
      rotate: angle,
    });

    if (chars.length) {
      // leading red character pop
      setFont(c, size);
      const fullW = c.measureText(text).width;
      const first = chars[0];
      const firstW = c.measureText(first).width;
      const fx = -fullW / 2 + firstW / 2;
      c.save();
      c.translate(w / 2, h / 2);
      c.rotate(angle);
      paintGlyph(c, first, fx, 0, size, {
        fill: "#ff3b3b",
        stroke: "#ffffff",
        strokeWidth: size * 0.075,
        shadow: false,
      });
      c.restore();
    }
  }

  function render() {
    const state = getState();
    updateLabels(state);
    resizeCanvas(state);

    const w = els.canvas.width;
    const h = els.canvas.height;
    const text = state.text.trim() || "？";

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    // subtle vignette
    const vig = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.2,
      w / 2,
      h / 2,
      Math.hypot(w, h) / 2
    );
    vig.addColorStop(0, "rgba(40, 0, 0, 0)");
    vig.addColorStop(1, "rgba(40, 0, 0, 0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    if (state.speedLines) {
      drawSpeedLines(ctx, w, h);
    }

    if (state.layout === "mix") {
      layoutMix(ctx, text, w, h, state.fontScale);
    } else if (state.layout === "cutin") {
      layoutCutin(ctx, text, w, h, state.fontScale);
    } else {
      layoutDon(ctx, text, w, h, state.fontScale);
    }
  }

  function downloadPng() {
    const state = getState();
    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const label = state.exportSize === "wide" ? "1200x630" : "1080x1080";
    const safe = (state.text.trim() || "kanjou")
      .replace(/[\\/:*?"<>|]/g, "")
      .slice(0, 12);
    const a = document.createElement("a");
    a.href = els.canvas.toDataURL("image/png");
    a.download = `kusodeka-${safe}-${label}-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function bind() {
    els.textInput.addEventListener("input", () => {
      if ([...els.textInput.value].length > 12) {
        els.textInput.value = [...els.textInput.value].slice(0, 12).join("");
      }
      render();
    });

    els.speedLines.addEventListener("change", render);
    els.fontSize.addEventListener("input", render);
    els.downloadBtn.addEventListener("click", downloadPng);

    els.layoutInputs.forEach((el) => el.addEventListener("change", render));
    els.sizeInputs.forEach((el) => el.addEventListener("change", render));
  }

  bind();
  render();
})();
