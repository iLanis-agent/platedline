/* PlateLine engine - reverse-timed multi-dish cooking schedules. */
const PlateEngine = (() => {
  'use strict';

  function parseTime(s) {
    if (typeof s !== 'string') throw new Error('time must be a string');
    const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) throw new Error('bad time format');
    const h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) throw new Error('time out of range');
    return h * 60 + mi;
  }

  function fmtTime(mins) {
    let m = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60), mi = m % 60;
    return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  }

  function normDish(d) {
    if (!d || typeof d.name !== 'string' || !d.name.trim()) throw new Error('dish needs a name');
    const num = (v, label) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 1440) throw new Error(label + ' must be 0-1440 min');
      return Math.round(n);
    };
    const dish = {
      name: d.name.trim(),
      prepMin: num(d.prepMin, 'prep'),
      cookMin: num(d.cookMin, 'cook'),
      restMin: num(d.restMin, 'rest'),
      ovenTempC: null
    };
    if (d.ovenTempC !== null && d.ovenTempC !== undefined && d.ovenTempC !== '') {
      const t = Number(d.ovenTempC);
      if (!Number.isFinite(t) || t < 30 || t > 350) throw new Error('oven temp must be 30-350 C');
      dish.ovenTempC = Math.round(t);
    }
    if (dish.prepMin + dish.cookMin + dish.restMin === 0) throw new Error('dish has zero time');
    return dish;
  }

  function totalMin(dish) { return dish.prepMin + dish.cookMin + dish.restMin; }

  // Windows relative to a serve time (minutes since midnight, may be <0 or >1439 before fmt).
  function windows(dish, serveMin) {
    const start = serveMin - totalMin(dish);
    return {
      prep: [start, start + dish.prepMin],
      cook: [start + dish.prepMin, start + dish.prepMin + dish.cookMin],
      rest: [start + dish.prepMin + dish.cookMin, start + dish.prepMin + dish.cookMin + dish.restMin],
      start: start
    };
  }

  function buildTimeline(dishes, serveMin) {
    const evs = [];
    dishes.forEach(d => {
      const w = windows(d, serveMin);
      evs.push({ t: w.prep[0], kind: 'prep', dish: d.name, label: 'Start prep: ' + d.name });
      if (d.cookMin > 0) evs.push({ t: w.cook[0], kind: 'cook', dish: d.name, label: 'Start cooking: ' + d.name + (d.ovenTempC ? ' (' + d.ovenTempC + ' C)' : '') });
      if (d.restMin > 0) evs.push({ t: w.rest[0], kind: 'rest', dish: d.name, label: 'Rest: ' + d.name });
    });
    evs.push({ t: serveMin, kind: 'serve', dish: null, label: 'Serve everything' });
    evs.sort((a, b) => a.t - b.t || (a.kind === 'serve' ? 1 : b.kind === 'serve' ? -1 : 0));
    return evs.map(e => ({ time: fmtTime(e.t), t: e.t, kind: e.kind, dish: e.dish, label: e.label }));
  }

  function overlap(a, b) { return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])); }

  function ovenConflicts(dishes, serveMin) {
    const out = [];
    const oven = dishes.filter(d => d.ovenTempC !== null && d.cookMin > 0);
    for (let i = 0; i < oven.length; i++) {
      for (let j = i + 1; j < oven.length; j++) {
        const a = oven[i], b = oven[j];
        if (a.ovenTempC === b.ovenTempC) continue;
        const wa = windows(a, serveMin).cook, wb = windows(b, serveMin).cook;
        const ov = overlap(wa, wb);
        if (ov > 0) {
          out.push({
            a: a.name, b: b.name, tempA: a.ovenTempC, tempB: b.ovenTempC,
            overlapMin: ov,
            suggestGapMin: ov
          });
        }
      }
    }
    return out;
  }

  function stats(dishes, serveMin) {
    let earliest = serveMin;
    dishes.forEach(d => { earliest = Math.min(earliest, windows(d, serveMin).start); });
    const busyMin = dishes.reduce((s, d) => s + d.prepMin + d.cookMin, 0);
    return {
      firstStart: fmtTime(earliest),
      spanMin: serveMin - earliest,
      activeMin: busyMin,
      dishCount: dishes.length
    };
  }

  return { parseTime, fmtTime, normDish, totalMin, windows, buildTimeline, ovenConflicts, stats };
})();
if (typeof module !== 'undefined') module.exports = PlateEngine;
