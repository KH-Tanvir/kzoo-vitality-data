/* Shared data layer for the vitality data site.

   Every page loads the CSV files in /data at run time, so updating a CSV in the
   repository updates the site. Nothing is hard-coded in the pages.

   Quarterly figures are calculated here, the same way the quarterly reports
   calculate them — see data.html for the method notes.
*/
const Site = (() => {
  const nf = new Intl.NumberFormat("en-US");
  const fmtN = v => (v == null || isNaN(v)) ? "—" : nf.format(Math.round(v));
  const fmt1 = v => (v == null || isNaN(v)) ? "—" : v.toFixed(1);
  const pct = (v, d = 1) => (v == null || isNaN(v)) ? "—" : (v * 100).toFixed(d) + "%";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabel = m => MONTHS[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);
  const qOf = m => `${m.slice(0, 4)}-Q${Math.floor((+m.slice(5, 7) - 1) / 3) + 1}`;
  const qLabel = q => q.replace("-", " ");
  const qPrev = q => {
    let [y, n] = [+q.slice(0, 4), +q.slice(6)];
    return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`;
  };
  const qYearAgo = q => `${+q.slice(0, 4) - 1}-Q${q.slice(6)}`;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const mean = a => (a.length ? sum(a) / a.length : null);

  /* ---------------- CSV ---------------- */
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const head = rows.shift().map(h => h.trim());
    return rows.filter(r => r.length > 1 || (r[0] || "").trim() !== "")
      .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
  }
  const numOrNull = v => (v === "" || v == null ? null : +v);

  const cache = {};
  async function load(name) {
    if (!cache[name]) {
      cache[name] = fetch("data/" + name, { cache: "no-cache" }).then(r => {
        if (!r.ok) throw new Error(`${name}: ${r.status}`);
        return r.text();
      }).then(parseCSV);
    }
    return cache[name];
  }
  async function loadAll(names) {
    try {
      const out = await Promise.all(names.map(load));
      return Object.fromEntries(names.map((n, i) => [n.replace("_monthly.csv", "").replace(".csv", ""), out[i]]));
    } catch (err) {
      showLoadError(err);
      throw err;
    }
  }
  function showLoadError(err) {
    const local = location.protocol === "file:";
    document.querySelectorAll(".host, .needs-data").forEach(h => {
      h.innerHTML = "";
      const p = document.createElement("p");
      p.className = "error";
      p.textContent = local
        ? "This page reads data files, which a browser will not load from a local file path. Publish the folder to GitHub Pages, or run a local server: python -m http.server 8000"
        : "Could not load the data files in /data. " + err.message;
      h.appendChild(p);
    });
  }

  /* ---------------- aggregation ---------------- */
  // Traffic: vehicles per day. A quarter is the average of its months.
  function trafficMonthly(rows, opts = {}) {
    const skip = opts.exclude;
    const by = new Map();
    for (const r of rows) {
      if (skip && r.corridor === skip) continue;
      if (opts.only && r.corridor !== opts.only) continue;
      const o = by.get(r.month) || { month: r.month, incoming: 0, outgoing: 0 };
      o[r.direction] += +r.vehicles_per_day;
      by.set(r.month, o);
    }
    return [...by.values()].sort((a, b) => a.month.localeCompare(b.month))
      .map(o => ({ ...o, total: o.incoming + o.outgoing }));
  }
  function trafficQuarterly(rows, opts) {
    const byQ = new Map();
    for (const m of trafficMonthly(rows, opts)) {
      const q = qOf(m.month);
      const a = byQ.get(q) || [];
      a.push(m);
      byQ.set(q, a);
    }
    return [...byQ.entries()].sort().map(([q, ms]) => ({
      q,
      incoming: mean(ms.map(m => m.incoming)),
      outgoing: mean(ms.map(m => m.outgoing)),
      total: mean(ms.map(m => m.total)),
      months: ms.length,
    }));
  }
  function trafficCorridors(rows) {
    return [...new Set(rows.map(r => r.corridor))].sort();
  }
  function trafficByCorridor(rows, quarters) {
    const keep = new Set(quarters);
    const by = new Map();
    for (const r of rows) {
      if (!keep.has(qOf(r.month))) continue;
      const o = by.get(r.corridor) || { corridor: r.corridor, incoming: [], outgoing: [] };
      o[r.direction].push(+r.vehicles_per_day);
      by.set(r.corridor, o);
    }
    return [...by.values()].map(o => ({
      corridor: o.corridor,
      incoming: mean(o.incoming), outgoing: mean(o.outgoing),
      total: (mean(o.incoming) || 0) + (mean(o.outgoing) || 0),
    })).sort((a, b) => b.total - a.total);
  }

  // People: visits add up over a quarter; people and dwell time are averaged.
  function peopleMonthly(rows, segment) {
    return rows.filter(r => r.segment === segment)
      .map(r => ({
        month: r.month,
        visits: numOrNull(r.visits), people: numOrNull(r.people),
        freq: numOrNull(r.visits_per_person), dwell: numOrNull(r.avg_dwell_minutes),
        panel: numOrNull(r.panel_visits), yoy: numOrNull(r.visits_yoy),
        corrected: r.corrected || "",
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
  function peopleQuarterly(rows, segment) {
    const byQ = new Map();
    for (const m of peopleMonthly(rows, segment)) {
      const q = qOf(m.month);
      const a = byQ.get(q) || [];
      a.push(m);
      byQ.set(q, a);
    }
    return [...byQ.entries()].sort().map(([q, ms]) => ({
      q,
      visits: sum(ms.map(m => m.visits || 0)),
      people: mean(ms.filter(m => m.people != null).map(m => m.people)),
      dwell: mean(ms.filter(m => m.dwell != null).map(m => m.dwell)),
      freq: mean(ms.filter(m => m.freq != null).map(m => m.freq)),
      yoy: mean(ms.filter(m => m.yoy != null).map(m => m.yoy)),
      months: ms.length,
    }));
  }

  // Parking: each facility type is occupied spaces / its spaces; the headline
  // figure is the average of the three types, then of the three time windows.
  function parkingMonthly(rows) {
    const acc = new Map();
    for (const r of rows) {
      const k = `${r.month}|${r.time_window}|${r.facility_type}`;
      const o = acc.get(k) || { month: r.month, window: r.time_window, type: r.facility_type, occ: 0, spaces: 0 };
      o.occ += +r.occupied;
      o.spaces += +r.spaces;
      acc.set(k, o);
    }
    const byMW = new Map();
    for (const o of acc.values()) {
      const k = `${o.month}|${o.window}`;
      const m = byMW.get(k) || { month: o.month, window: o.window, types: {} };
      m.types[o.type] = o.occ / o.spaces;
      byMW.set(k, m);
    }
    return [...byMW.values()].map(m => ({
      ...m, all: mean(Object.values(m.types)),
    })).sort((a, b) => a.month.localeCompare(b.month));
  }
  function parkingQuarterly(rows) {
    const mo = parkingMonthly(rows);
    const byQW = new Map();
    for (const m of mo) {
      const k = `${qOf(m.month)}|${m.window}`;
      const a = byQW.get(k) || [];
      a.push(m);
      byQW.set(k, a);
    }
    const byQ = new Map();
    for (const [k, ms] of byQW) {
      const [q, w] = k.split("|");
      const o = byQ.get(q) || { q, windows: {}, types: {} };
      o.windows[w] = mean(ms.map(m => m.all));
      for (const t of Object.keys(ms[0].types)) {
        (o.types[t] = o.types[t] || {})[w] = mean(ms.map(m => m.types[t]).filter(v => v != null));
      }
      byQ.set(q, o);
    }
    return [...byQ.values()].sort((a, b) => a.q.localeCompare(b.q))
      .map(o => ({ ...o, all: mean(Object.values(o.windows)) }));
  }
  function parkingFacilities(rows, quarters) {
    const keep = new Set(quarters);
    const acc = new Map();
    for (const r of rows) {
      if (!keep.has(qOf(r.month))) continue;
      const k = `${r.facility}|${r.time_window}`;
      const o = acc.get(k) || { facility: r.facility, type: r.facility_type, window: r.time_window, occ: 0, spaces: 0 };
      o.occ += +r.occupied;
      o.spaces += +r.spaces;
      acc.set(k, o);
    }
    const by = new Map();
    for (const o of acc.values()) {
      const f = by.get(o.facility) || { facility: o.facility, type: o.type, spaces: 0, windows: {} };
      f.windows[o.window] = o.occ / o.spaces;
      by.set(o.facility, f);
    }
    // inventory: spaces are constant, take them from the newest row per facility
    for (const r of rows) {
      const f = by.get(r.facility);
      if (f) f.spaces = +r.spaces;
    }
    return [...by.values()];
  }
  function parkingInventory(rows) {
    const by = new Map();
    for (const r of rows) by.set(r.facility, { facility: r.facility, type: r.facility_type, spaces: +r.spaces });
    const list = [...by.values()];
    const byType = {};
    for (const f of list) byType[f.type] = (byType[f.type] || 0) + f.spaces;
    return { list, byType, total: sum(list.map(f => f.spaces)) };
  }

  // Transit: boardings + alightings. Stops 1004 and 1011 are the Transit Center.
  const TC_STOPS = new Set(["1004", "1011"]);
  function transitMonthly(rows) {
    const by = new Map();
    for (const r of rows) {
      const v = (+r.boardings || 0) + (+r.alightings || 0);
      const o = by.get(r.month) || { month: r.month, centre: 0, street: 0 };
      o[TC_STOPS.has(r.stop_id) ? "centre" : "street"] += v;
      by.set(r.month, o);
    }
    return [...by.values()].sort((a, b) => a.month.localeCompare(b.month))
      .map(o => ({ ...o, total: o.centre + o.street }));
  }
  function transitQuarterly(rows) {
    const by = new Map();
    for (const m of transitMonthly(rows)) {
      const q = qOf(m.month);
      const o = by.get(q) || { q, centre: 0, street: 0, months: 0 };
      o.centre += m.centre;
      o.street += m.street;
      o.months++;
      by.set(q, o);
    }
    return [...by.values()].sort((a, b) => a.q.localeCompare(b.q))
      .map(o => ({ ...o, total: o.centre + o.street }));
  }
  function transitStops(rows, quarters) {
    const keep = new Set(quarters);
    const by = new Map();
    for (const r of rows) {
      if (!keep.has(qOf(r.month))) continue;
      const o = by.get(r.stop_id) || { stop_id: r.stop_id, name: r.stop_name, boardings: 0, alightings: 0 };
      o.boardings += +r.boardings || 0;
      o.alightings += +r.alightings || 0;
      by.set(r.stop_id, o);
    }
    return [...by.values()].map(o => ({ ...o, total: o.boardings + o.alightings }))
      .sort((a, b) => b.total - a.total);
  }

  /* ---------------- change formatting ---------------- */
  function change(now, then) {
    if (now == null || then == null || !then) return { text: "—", cls: "flat" };
    const d = (now - then) / Math.abs(then);
    const cls = Math.abs(d) < 0.001 ? "flat" : d > 0 ? "up" : "down";
    const sign = d > 0 ? "+" : d < 0 ? "−" : "";
    return { text: sign + (Math.abs(d) * 100).toFixed(1) + "%", cls, value: d };
  }
  function changeCell(td, now, then) {
    const c = change(now, then);
    td.textContent = c.text;
    td.className = "chg " + c.cls;
    return c;
  }

  /* ---------------- page chrome ---------------- */
  function markNav() {
    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll("nav.main a").forEach(a => {
      const target = a.getAttribute("href").toLowerCase();
      if (target === here || (here === "" && target === "index.html")) a.setAttribute("aria-current", "page");
    });
  }
  function stamp(months) {
    const last = months[months.length - 1], first = months[0];
    document.querySelectorAll("[data-coverage]").forEach(e => {
      e.textContent = `Data ${monthLabel(first)} – ${monthLabel(last)}`;
    });
  }
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  return {
    load, loadAll, parseCSV, ready, markNav, stamp, showLoadError,
    fmtN, fmt1, pct, monthLabel, qOf, qLabel, qPrev, qYearAgo, sum, mean, change, changeCell,
    trafficMonthly, trafficQuarterly, trafficCorridors, trafficByCorridor,
    peopleMonthly, peopleQuarterly,
    parkingMonthly, parkingQuarterly, parkingFacilities, parkingInventory,
    transitMonthly, transitQuarterly, transitStops, TC_STOPS,
  };
})();
Site.ready(Site.markNav);
