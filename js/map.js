/* 示意地图：SVG 底图 + HTML 标记，可拖动、缩放 */
(function (PC) {
  'use strict';
  const WD = PC.WORLD, B = 300;
  let vp, world, marks, lines, W = 0, H = 0, tx = 0, ty = 0, z = 1, lastBounds = null, lastFloor = 0.4, lastFitKey = null, lastIns = { t: 70, b: 0, l: 0, r: 0 }, dragged = false, zband = '', mkPts = [], geoLbls = null, lastDz = 0;

  /* 底图：香港示意地图（数据在 hkmap.js，经纬度 → 地图坐标） */
  const pt = ll => { const p = PC.ll(ll[0], ll[1]); return p.x + ',' + p.y; };
  const poly = a => 'M' + a.map(pt).join('L') + 'Z';
  const line = a => 'M' + a.map(pt).join('L');
  function baseSvg() {
    const M = PC.HKMAP, X = -B, Y = -B, BW = WD.w + 2 * B, BH = WD.h + 2 * B;
    let s = '<svg id="base" style="position:absolute;left:' + X + 'px;top:' + Y + 'px" width="' + BW + '" height="' + BH + '" viewBox="' + X + ' ' + Y + ' ' + BW + ' ' + BH + '" aria-hidden="true">';
    s += '<rect x="' + X + '" y="' + Y + '" width="' + BW + '" height="' + BH + '" fill="#aed5e7"/>';
    s += '<g fill="#f2f1ea" stroke="#fff" stroke-width="5" stroke-linejoin="round">' + [M.KOWLOON, M.ISLAND, M.AP_LEI_CHAU, M.GREEN_ISLAND].map(a => '<path d="' + poly(a) + '"/>').join('') + '</g>';
    s += '<g fill="#c5e1b8" stroke="#a9cf9b" stroke-width="2" stroke-linejoin="round">' + M.GREEN.map(a => '<path d="' + poly(a) + '"/>').join('') + '</g>';
    s += '<g fill="none" stroke-linecap="round" stroke-linejoin="round">';
    s += '<g stroke="#fff" stroke-width="6">' + M.ROADS.map(a => '<path d="' + line(a) + '"/>').join('') + '</g>';
    s += '<g stroke="#9fb3bd" stroke-width="4" stroke-dasharray="14 10">' + M.TUNNELS.map(a => '<path d="' + line(a) + '"/>').join('') + '</g>';
    s += '<g stroke="#5b8fa8" stroke-width="3" stroke-dasharray="2 9">' + M.FERRIES.map(a => '<path d="' + line(a) + '"/>').join('') + '</g>';
    s += '</g></svg>';
    return s;
  }
  function labelsHtml() {
    return PC.HKMAP.LABELS.map(l => { const p = PC.ll(l[1], l[2]); return '<div class="gl ' + (l[3] || 'minor') + '" style="left:' + p.x + 'px;top:' + p.y + 'px"><span>' + PC.esc(l[0]) + '</span></div>'; }).join('');
  }
  PC.poiBounds = function (filter) {
    const ps = Object.values(PC.POIS).filter(filter || (() => true));
    return [Math.min.apply(null, ps.map(p => p.x)), Math.min.apply(null, ps.map(p => p.y)), Math.max.apply(null, ps.map(p => p.x)), Math.max.apply(null, ps.map(p => p.y))];
  };

  function size() { W = vp.clientWidth; H = vp.clientHeight; }
  function zmin() { return Math.max(W / (WD.w + 2 * B), H / (WD.h + 2 * B), 0.1); }
  function clamp() {
    z = Math.min(2.4, Math.max(zmin(), z));
    tx = Math.min(B * z, Math.max(W - (WD.w + B) * z, tx));
    ty = Math.min(B * z, Math.max(H - (WD.h + B) * z, ty));
  }
  /* 画面写入：拖动 / 滚轮一帧内可能触发多次，这里合并成每帧最多写一次 */
  let raf = 0, shownZ = 0;
  function apply() {
    clamp();
    if (!raf) raf = requestAnimationFrame(flush);
  }
  function flush() {
    raf = 0;
    world.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
    if (z !== shownZ) {   // 只有缩放时才更新 --z（图钉、地名按它反向缩放）；单纯平移不触发重新计算样式
      shownZ = z;
      world.style.setProperty('--z', z.toFixed(4));
      const band = z < 0.3 ? 'far' : z < 0.55 ? 'mid' : 'near';   // 缩小时只显示大区名
      if (band !== zband) { world.classList.remove('z-' + zband); world.classList.add('z-' + band); zband = band; }
    }
    if (z !== lastDz) dodge();
  }
  function fit(b, ins, floor) {
    size();
    if (floor != null) lastFloor = floor;
    lastBounds = b; lastIns = ins;
    const aw = W - ins.l - ins.r, ah = H - ins.t - ins.b, pad = 46;
    const bw = Math.max(b[2] - b[0], 140), bh = Math.max(b[3] - b[1], 140);
    z = Math.max(lastFloor, Math.min((aw - 2 * pad) / bw, (ah - 2 * pad) / bh, 1.5));
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    tx = ins.l + aw / 2 - cx * z; ty = ins.t + ah / 2 - cy * z;
    apply();
  }

  function markHtml(m) {
    const tag = m.act ? 'button' : 'div';
    const attrs = m.act ? ' data-act="' + m.act + '"' + (m.data ? ' ' + m.data : '') + ' aria-label="' + PC.esc(m.label || '地点') + '"' : '';
    return '<' + tag + ' class="mk ' + (m.cls || '') + '" style="left:' + m.x + 'px;top:' + m.y + 'px;z-index:' + (m.z || 1) + '"' + attrs + '><span class="mk-in">' + m.html + '</span></' + tag + '>';
  }

  /* 地名避让：地名和图钉重叠时，先试着移到上方 / 下方，都挡住就暂时隐藏（屏幕像素计算） */
  const LW = { big: 21, sea: 16, hill: 13, minor: 12.5 };
  function dodge() {
    if (!geoLbls) geoLbls = [...world.querySelectorAll('.gl')].map((el, i) => {
      const l = PC.HKMAP.LABELS[i], p = PC.ll(l[1], l[2]);
      return { el, x: p.x, y: p.y, hw: l[0].length * LW[l[3] || 'minor'] / 2 + 4 };
    });
    lastDz = z;
    const R = 20;   // 图钉半径 + 间距（px）
    geoLbls.forEach(g => {
      const free = dy => !mkPts.some(m => Math.abs((m.x - g.x) * z) < g.hw + R && Math.abs((m.y - g.y) * z + -dy) < 9 + R);
      const dy = [0, -30, 30].find(free);
      g.el.classList.toggle('hit', dy == null);
      g.el.style.setProperty('--dy', (dy || 0) + 'px');
    });
  }

  PC.map = {
    init() {
      vp = PC.$('#viewport');
      // 键盘：Tab 聚焦地图后，方向键移动、+ / − 缩放
      vp.tabIndex = 0;
      vp.setAttribute('role', 'region');
      vp.setAttribute('aria-label', '地图：方向键移动，加号 / 减号缩放');
      vp.addEventListener('keydown', e => {
        if (e.target.closest('input,textarea,select')) return;
        const step = e.shiftKey ? 240 : 80, mv = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
        if (mv) { e.preventDefault(); tx += mv[0]; ty += mv[1]; apply(); return; }
        if (e.key === '+' || e.key === '=') { e.preventDefault(); PC.map.zoomBy(1.3); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); PC.map.zoomBy(1 / 1.3); }
      });
      vp.innerHTML = '<div id="world" style="width:' + WD.w + 'px;height:' + WD.h + 'px">' + baseSvg() +
        '<div id="geo" aria-hidden="true">' + labelsHtml() + '</div><svg id="lines" width="' + WD.w + '" height="' + WD.h + '" viewBox="0 0 ' + WD.w + ' ' + WD.h + '"></svg><div id="marks"></div></div>';
      world = PC.$('#world'); marks = PC.$('#marks'); lines = PC.$('#lines');
      const pts = new Map();
      let startDist = 0, startZ = 1, last = null;
      vp.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        last = { x: e.clientX, y: e.clientY }; dragged = false;
        if (pts.size === 2) { const a = Array.from(pts.values()); startDist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); startZ = z; }
      });
      vp.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 2) {
          const a = Array.from(pts.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
          if (startDist) { const r = vp.getBoundingClientRect(); PC.map.zoomTo(startZ * d / startDist, (a[0].x + a[1].x) / 2 - r.left, (a[0].y + a[1].y) / 2 - r.top); dragged = true; }
          return;
        }
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        if (!dragged && Math.hypot(dx, dy) < 5) return;
        if (!dragged) vp.classList.add('panning');
        dragged = true; last = { x: e.clientX, y: e.clientY };
        tx += dx; ty += dy; apply();
      });
      const up = e => { pts.delete(e.pointerId); if (!pts.size) { vp.classList.remove('panning'); setTimeout(() => { dragged = false; }, 0); } };
      vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up); vp.addEventListener('pointerleave', up);
      vp.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
      vp.addEventListener('wheel', e => { e.preventDefault(); const r = vp.getBoundingClientRect(); PC.map.zoomTo(z * (e.deltaY < 0 ? 1.12 : 0.89), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
      PC.onResize(() => { if (lastBounds) { fit(lastBounds, PC.mapInsets ? PC.mapInsets() : lastIns); } });
    },
    zoomTo(nz, cx, cy) {
      size();
      cx = cx == null ? W / 2 : cx; cy = cy == null ? H / 2 : cy;
      const wx = (cx - tx) / z, wy = (cy - ty) / z;
      z = nz; clamp();
      tx = cx - wx * z; ty = cy - wy * z; apply();
    },
    zoomBy(f) { PC.map.zoomTo(z * f); },
    fit(b, ins) { fit(b, ins); },
    refit() { if (lastBounds) fit(lastBounds, PC.mapInsets ? PC.mapInsets() : lastIns); },
    set(m, ins, force) {
      m = m || {};
      // 图钉和路线：内容没变就不动 DOM；变了也只改有差异的图钉
      const mh = (m.markers || []).map(markHtml).join('');
      if (mh !== marks.__h) { PC.patch(marks, mh); mkPts = (m.markers || []).map(k => ({ x: k.x, y: k.y })); lastDz = 0; }
      const lh = (m.lines || []).map(l => '<polyline class="rl ' + (l.cls || '') + '" points="' + l.pts.map(p => p[0] + ',' + p[1]).join(' ') + '" fill="none"/>').join('');
      if (lh !== lines.__h) { lines.__h = lh; lines.innerHTML = lh; }
      let b = m.fit;
      if (b === 'all') b = PC.poiBounds();
      if (b && (force || m.fitKey !== lastFitKey)) { lastFitKey = m.fitKey; fit(b, ins, m.zfloor == null ? 0.4 : m.zfloor); } else { size(); apply(); }
    },
    get z() { return z; },
  };
})(window.PC);
