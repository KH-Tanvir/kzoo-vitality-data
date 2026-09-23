/* Small SVG chart toolkit for the vitality data site.
   No dependencies. Every chart redraws on resize and can show its numbers as a
   table, so nothing on the site is readable only as a picture.

   Chart.line(host, cfg)    line / area chart with a crosshair readout
   Chart.column(host, cfg)  grouped or stacked columns, optional reference line
   Chart.spark(host, vals)  tiny trend line for the home page tiles
   Chart.table(fig, head, rows)  wires a figure's "Show table" button
*/
const Chart = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const nf = new Intl.NumberFormat("en-US");
  const fmtN = v => nf.format(Math.round(v));

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, cls, anchor) {
    const t = el("text", { x, y, class: cls || "tick", "text-anchor": anchor || "start" }, parent);
    t.textContent = str;
    return t;
  }
  function ticks(min, max, target) {
    const range = Math.max(1e-9, max - min), raw = range / (target || 4);
    const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  const labelWidth = strs => Math.max(...strs.map(s => s.length)) * 7 + 10;

  /* ---------------- tooltip (one for the whole page) ---------------- */
  let tip;
  function tipEl() {
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "tip";
      tip.setAttribute("role", "status");
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(title, rows, x, y) {
    const t = tipEl();
    t.replaceChildren();
    const h = document.createElement("div");
    h.className = "tt";
    h.textContent = title;
    t.appendChild(h);
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "tr";
      const k = document.createElement("span");
      k.className = "k";
      if (r.key) k.style.background = `var(--${r.key})`;
      row.appendChild(k);
      const v = document.createElement("strong");
      v.textContent = r.value;
      row.appendChild(v);
      const n = document.createElement("span");
      n.className = "n";
      n.textContent = r.name;
      row.appendChild(n);
      t.appendChild(row);
    }
    t.hidden = false;
    const pad = 14, w = t.offsetWidth, ht = t.offsetHeight;
    let left = x + pad, top = y + pad;
    if (left + w > window.innerWidth - 8) left = x - w - pad;
    if (top + ht > window.innerHeight - 8) top = y - ht - pad;
    t.style.left = Math.max(8, left) + "px";
    t.style.top = Math.max(8, top) + "px";
  }
  const hideTip = () => { if (tip) tip.hidden = true; };
  window.addEventListener("scroll", hideTip, { passive: true });

  /* ---------------- line chart ---------------- */
  function line(host, cfg) {
    const W = host.clientWidth || 560, H = cfg.height || 230;
    host.replaceChildren();
    const fmtY = cfg.fmtY || fmtN;
    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: "chart",
                            role: "img", tabindex: 0, "aria-label": cfg.aria || "" }, host);
    const vals = cfg.series.flatMap(s => s.values.filter(v => v != null));
    if (!vals.length) return;
    const yT = ticks(0, Math.max(...vals), 3), yMax = yT[yT.length - 1];
    const m = { l: labelWidth(yT.map(fmtY)), r: 14, t: cfg.band ? 22 : 10, b: 26 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = cfg.labels.length, step = iw / Math.max(1, n - 1);
    const x = i => m.l + i * step, y = v => m.t + ih - (v / yMax) * ih;

    if (cfg.band) {
      const i0 = cfg.labels.indexOf(cfg.band.from), i1 = cfg.labels.indexOf(cfg.band.to);
      if (i0 >= 0 && i1 >= 0) {
        el("rect", { x: x(i0), y: m.t, width: Math.max(2, x(i1) - x(i0)), height: ih,
                     style: "fill:var(--gray);opacity:.12" }, svg);
        text(svg, (x(i0) + x(i1)) / 2, m.t - 7, cfg.band.label, "ann", "middle");
      }
    }
    for (const v of yT) {
      el("line", { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v), class: v === 0 ? "base" : "grid" }, svg);
      text(svg, m.l - 8, y(v) + 4, fmtY(v), "tick", "end");
    }
    cfg.labels.forEach((lab, i) => {
      const t = cfg.xTick ? cfg.xTick(lab, i) : null;
      if (!t) return;
      el("line", { x1: x(i), x2: x(i), y1: m.t + ih, y2: m.t + ih + 4, class: "base" }, svg);
      text(svg, x(i) + 3, m.t + ih + 17, t, "tick", "start");
    });
    for (const s of cfg.series) {
      let d = "", started = false;
      s.values.forEach((v, i) => {
        if (v == null) { started = false; return; }
        d += (started ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1);
        started = true;
      });
      if (!d) continue;
      if (cfg.area && cfg.series.length === 1) {
        el("path", { d: d + `L${x(n - 1)} ${y(0)}L${x(0)} ${y(0)}Z`,
                     style: `fill:var(--${s.key});opacity:.1` }, svg);
      }
      el("path", { d, style: `fill:none;stroke:var(--${s.key});stroke-width:2;stroke-linejoin:round;stroke-linecap:round` }, svg);
      const lastIdx = s.values.reduce((acc, v, i) => (v != null ? i : acc), -1);
      if (lastIdx >= 0) {
        el("circle", { cx: x(lastIdx), cy: y(s.values[lastIdx]), r: 4,
                       style: `fill:var(--${s.key});stroke:var(--surface);stroke-width:2` }, svg);
      }
    }
    const cross = el("line", { y1: m.t, y2: m.t + ih, class: "cross", visibility: "hidden" }, svg);
    const dots = cfg.series.map(s => el("circle", { r: 4, visibility: "hidden",
      style: `fill:var(--${s.key});stroke:var(--surface);stroke-width:2` }, svg));
    const hit = el("rect", { x: m.l - step / 2, y: 0, width: iw + step, height: m.t + ih, class: "hit" }, svg);
    let cur = -1;
    const show = (i, px, py) => {
      cur = i;
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      cfg.series.forEach((s, k) => {
        const v = s.values[i];
        if (v == null) { dots[k].setAttribute("visibility", "hidden"); return; }
        dots[k].setAttribute("cx", x(i)); dots[k].setAttribute("cy", y(v));
        dots[k].setAttribute("visibility", "visible");
      });
      showTip(cfg.tipTitle ? cfg.tipTitle(cfg.labels[i]) : cfg.labels[i],
        cfg.series.filter(s => s.values[i] != null)
          .map(s => ({ key: s.key, name: s.name, value: fmtY(s.values[i]) })), px, py);
    };
    const hide = () => {
      cross.setAttribute("visibility", "hidden");
      dots.forEach(d => d.setAttribute("visibility", "hidden"));
      hideTip();
    };
    hit.addEventListener("pointermove", e => {
      const r = svg.getBoundingClientRect();
      show(Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - m.l) / step))), e.clientX, e.clientY);
    });
    hit.addEventListener("pointerleave", hide);
    const kb = i => { const r = svg.getBoundingClientRect(); show(i, r.left + x(i), r.top + m.t + 10); };
    svg.addEventListener("focus", () => kb(cur < 0 ? n - 1 : cur));
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      kb(Math.max(0, Math.min(n - 1, (cur < 0 ? n - 1 : cur) + (e.key === "ArrowRight" ? 1 : -1))));
    });
  }

  /* ---------------- column chart ---------------- */
  function bar(parent, bx, yb, w, yv, key, round) {
    const ht = Math.abs(yb - yv);
    if (ht < 0.5) return;
    const r = round ? Math.min(4, w / 2, ht) : 0;
    const d = yv < yb
      ? `M${bx} ${yb}V${yv + r}Q${bx} ${yv} ${bx + r} ${yv}H${bx + w - r}Q${bx + w} ${yv} ${bx + w} ${yv + r}V${yb}Z`
      : `M${bx} ${yb}V${yv - r}Q${bx} ${yv} ${bx + r} ${yv}H${bx + w - r}Q${bx + w} ${yv} ${bx + w} ${yv - r}V${yb}Z`;
    el("path", { d, style: `fill:var(--${key})` }, parent);
  }
  function column(host, cfg) {
    const W = host.clientWidth || 560, H = cfg.height || 250;
    host.replaceChildren();
    const fmtY = cfg.fmtY || fmtN;
    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: "chart",
                            role: "group", "aria-label": cfg.aria || "" }, host);
    const nC = cfg.cats.length;
    if (!nC) return;
    const totals = cfg.cats.map((_, i) => cfg.series.reduce((a, s) => a + (s.values[i] || 0), 0));
    let hi = cfg.yMax != null ? cfg.yMax
      : cfg.stacked ? Math.max(...totals) : Math.max(...cfg.series.flatMap(s => s.values.filter(v => v != null)));
    if (cfg.markers) hi = Math.max(hi, ...cfg.markers.map(mk => mk.value));
    const lo = cfg.yMin != null ? cfg.yMin
      : Math.min(0, ...cfg.series.flatMap(s => s.values.filter(v => v != null)));
    const yT = cfg.yTicks || ticks(lo, hi, 4), y0 = yT[0], y1 = yT[yT.length - 1];
    const labels = cfg.cats.map((c, i) => cfg.catLabel ? cfg.catLabel(c, i) : [String(c)]);
    const twoLine = labels.some(l => l.length > 1);
    const m = { l: labelWidth(yT.map(fmtY)), r: 10, t: 12, b: twoLine ? 38 : 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, band = iw / nC;
    const y = v => m.t + ih - ((v - y0) / (y1 - y0)) * ih;

    for (const v of yT) {
      el("line", { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v),
                   class: v === 0 ? (lo < 0 ? "zero" : "base") : "grid" }, svg);
      text(svg, m.l - 8, y(v) + 4, fmtY(v), "tick", "end");
    }
    if (cfg.ref) {
      el("line", { x1: m.l, x2: m.l + iw, y1: y(cfg.ref.value), y2: y(cfg.ref.value), class: "ref" }, svg);
      text(svg, m.l + iw, y(cfg.ref.value) - 6, cfg.ref.label, "ann", "end");
    }
    const nS = cfg.stacked ? 1 : cfg.series.length, gap = 2;
    const bw = Math.max(3, Math.min(24, (band * 0.7 - gap * (nS - 1)) / nS));
    const groups = [];
    cfg.cats.forEach((c, i) => {
      const g = el("g", { class: "cat" }, svg);
      groups.push(g);
      const cx = m.l + band * i + band / 2;
      if (cfg.stacked) {
        let acc = 0;
        cfg.series.forEach((s, k) => {
          const v = s.values[i] || 0;
          bar(g, cx - bw / 2, y(acc) - (k > 0 ? gap : 0), bw, y(acc + v), s.key, k === cfg.series.length - 1);
          acc += v;
        });
      } else {
        const gw = nS * bw + (nS - 1) * gap;
        cfg.series.forEach((s, k) => {
          if (s.values[i] == null) return;
          bar(g, cx - gw / 2 + k * (bw + gap), y(Math.max(y0, 0)), bw, y(s.values[i]), s.key, true);
        });
      }
      labels[i].forEach((ln, j) => text(svg, cx, m.t + ih + 16 + j * 13, ln, "tick", "middle"));
    });
    (cfg.markers || []).forEach(mk => {
      const cx = m.l + band * mk.i + band / 2, half = bw / 2 + 5, my = y(mk.value);
      el("line", { x1: cx - half, x2: cx + half, y1: my, y2: my,
                   style: "stroke:var(--surface);stroke-width:7;stroke-linecap:round" }, svg);
      el("line", { x1: cx - half, x2: cx + half, y1: my, y2: my,
                   style: "stroke:var(--ink);stroke-width:3;stroke-linecap:round" }, svg);
    });
    cfg.cats.forEach((c, i) => {
      const rows = cfg.tipRows ? cfg.tipRows(i)
        : cfg.series.map(s => ({ key: s.key, name: s.name, value: fmtY(s.values[i]) }));
      const hit = el("rect", { x: m.l + band * i, y: m.t, width: band, height: ih, class: "hit",
                               tabindex: 0, "aria-label": `${c}: ${rows.map(r => r.value + " " + r.name).join(", ")}` }, svg);
      const on = (px, py) => {
        svg.classList.add("hovering");
        groups.forEach((g, k) => g.classList.toggle("on", k === i));
        showTip(cfg.tipTitle ? cfg.tipTitle(c) : String(c), rows, px, py);
      };
      const off = () => {
        svg.classList.remove("hovering");
        groups.forEach(g => g.classList.remove("on"));
        hideTip();
      };
      hit.addEventListener("pointermove", e => on(e.clientX, e.clientY));
      hit.addEventListener("pointerleave", off);
      hit.addEventListener("focus", () => { const r = hit.getBoundingClientRect(); on(r.left + r.width / 2, r.top + 10); });
      hit.addEventListener("blur", off);
    });
  }

  /* ---------------- sparkline ---------------- */
  function spark(host, values, key) {
    const W = host.clientWidth || 160, H = host.clientHeight || 38;
    host.replaceChildren();
    const vals = values.filter(v => v != null);
    if (vals.length < 2) return;
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12 || 1;
    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: "chart",
                            role: "img", "aria-hidden": "true" }, host);
    const x = i => (i / (values.length - 1)) * (W - 6) + 3;
    const y = v => H - 3 - ((v - lo + pad) / (hi - lo + 2 * pad)) * (H - 6);
    const d = values.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("");
    el("path", { d: d + `L${x(values.length - 1)} ${H}L${x(0)} ${H}Z`,
                 style: `fill:var(--${key || "s1"});opacity:.10` }, svg);
    el("path", { d, style: `fill:none;stroke:var(--${key || "s1"});stroke-width:2;stroke-linejoin:round` }, svg);
    el("circle", { cx: x(values.length - 1), cy: y(values[values.length - 1]), r: 3,
                   style: `fill:var(--${key || "s1"});stroke:var(--surface);stroke-width:2` }, svg);
  }

  /* ---------------- table view ---------------- */
  function table(fig, head, rows) {
    const btn = fig.querySelector(".tv-btn"), box = fig.querySelector(".tv");
    if (!btn || !box) return;
    box.replaceChildren();
    const t = document.createElement("table");
    const thead = t.createTHead().insertRow();
    head.forEach(h => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = h;
      thead.appendChild(th);
    });
    const tb = t.createTBody();
    rows.forEach(r => {
      const tr = tb.insertRow();
      r.forEach((c, j) => {
        const cell = j === 0 ? document.createElement("th") : document.createElement("td");
        if (j === 0) cell.scope = "row";
        cell.textContent = c;
        tr.appendChild(cell);
      });
    });
    box.appendChild(t);
    btn.onclick = () => {
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Hide table" : "Show table";
    };
  }

  /* ---------------- redraw on resize ----------------
     One entry per host: registering the same host again (after a filter
     changes, say) replaces the previous drawing function. */
  const registry = new Map();
  const ro = "ResizeObserver" in window ? new ResizeObserver(entries => {
    for (const e of entries) {
      const entry = registry.get(e.target);
      const w = Math.round(e.contentRect.width);
      if (entry && w !== entry.w) { entry.w = w; entry.draw(); }
    }
  }) : null;
  function register(host, draw) {
    registry.set(host, { draw, w: host.clientWidth });
    draw();
    if (ro) ro.observe(host);
  }

  return { line, column, spark, table, register, fmtN, showTip, hideTip };
})();
