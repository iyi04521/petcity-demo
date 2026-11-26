/* 行程模式：P13 行程中、P13a 到达现场、P13b 进不去、P13c 重排、P14 小结 */
(function (PC) {
  'use strict';
  const { $, esc, ic, S, ACT } = PC;
  const V = PC.V;
  const short = n => n.replace(/（示例）/, '');
  const REPL_R = 600, MANUAL = '手动移出';   // 「进不去」替换站的搜索半径（米，按步行估算距离）

  const userPos = t => {
    const cur = t.stops[t.idx], p = PC.poi(cur.pid);
    if (t.phase === 'arrived') return { x: p.x, y: p.y };
    return { x: t.last.x + (p.x - t.last.x) * 0.35, y: t.last.y + (p.y - t.last.y) * 0.35 };
  };
  PC.tripInfo = t => {
    const counted = t.stops.map((s, i) => i).filter(i => t.stops[i].st !== 'rej');
    const cur = t.stops[t.idx], up = userPos(t);
    let remM = PC.dist(up, PC.poi(cur.pid)), remMin = PC.walkMin(remM), prev = PC.poi(cur.pid), cnt = 1;
    remMin += t.phase === 'arrived' ? Math.max(0, Math.round(t.dwellLeft)) : cur.dwell;
    for (let i = t.idx + 1; i < t.stops.length; i++) {
      const s = t.stops[i]; if (s.st !== 'todo') continue;
      const p = PC.poi(s.pid), m = PC.dist(prev, p); remM += m; remMin += PC.walkMin(m) + s.dwell; prev = p; cnt++;
    }
    return { total: counted.length, n: counted.indexOf(t.idx) + 1, remM, remMin, remStops: cnt, up };
  };
  PC.startTrip = rid => {
    // 已有同一条路线的进行中行程（例如用浏览器「返回」回到了起点页）：直接继续，不重开
    if (S.trip && !S.trip.ended && S.trip.routeId === rid) { PC.toast('这条路线的行程正在进行，已为你继续'); PC.go(S.trip.phase === 'arrived' ? '/trip/arrive' : '/trip', { replace: true }); return; }
    const r = PC.getRoute(rid), p0 = PC.poi(r.stops[0].pid);
    S.trip = { id: 't' + Date.now(), routeId: rid, petId: S.petId, stops: r.stops.map(s => ({ pid: s.pid, dwell: s.dwell, st: 'todo' })), idx: 0, phase: 'moving', last: { x: p0.x - 18, y: p0.y + 14 }, clock: r.start, startClock: r.start, actualM: 0, replaced: 0, skipped: 0, fb: 0, photos: 0, dwellLeft: 0 };
    S.lastSummary = null; PC.save(); PC.go('/trip');
  };
  PC.finishTrip = discard => {
    const t = S.trip; if (!t) return;
    t.ended = true;
    if (!discard) { S.lastSummary = JSON.parse(JSON.stringify(Object.assign({ ratings: {} }, t))); S.tripHistory.unshift({ id: t.id, routeId: t.routeId }); }
    S.trip = null; PC.save();
  };
  ACT.resumeTrip = () => PC.go(S.trip && S.trip.phase === 'arrived' ? '/trip/arrive' : '/trip');

  function nextIdx(t) { for (let i = t.idx + 1; i < t.stops.length; i++) if (t.stops[i].st === 'todo') return i; return -1; }
  function advance() {
    const t = S.trip, n = nextIdx(t);
    if (n < 0) { PC.finishTrip(); PC.go('/trip/summary', { replace: true }); PC.toast('全部站点走完，行程小结已生成'); return false; }
    t.idx = n; t.phase = 'moving'; PC.save(); return true;
  }

  function noTrip() {
    return { mode: 'page', nav: 'map', tab: '', title: '行程', pageClass: 'narrow', page: '<div class="pt-80 empty"><div class="h2">没有进行中的行程</div><p class="sub mt8">从路线详情点「开始路线」就能开始行程。</p><button class="btn prim mt16" data-act="go" data-to="/routes">去看路线</button></div>' };
  }
  function tripMap(t, extra, fitStops) {
    const mk = [], act = [];
    t.stops.forEach((s, i) => { if (s.st !== 'rej') act.push(i); });
    t.stops.forEach((s, i) => {
      const p = PC.poi(s.pid), k = act.indexOf(i) + 1;
      let cls = 'n', html = String(k);
      if (s.st === 'done') { cls += ' done'; html = ic('check', 14, 3); }
      else if (i === t.idx && s.st === 'todo') cls += ' cur';
      else if (s.st === 'rej') { cls += ' rej'; html = ic('x', 14, 2.6); }
      else if (s.st === 'skip') { cls += ' rej'; html = ic('skip', 12, 2.4); }
      mk.push({ x: p.x, y: p.y, cls, html, z: i === t.idx ? 6 : 3, label: p.name });
    });
    (extra || []).forEach(e => mk.push(e));
    const lines = [], A = act.map(i => t.stops[i]);
    for (let i = 0; i < A.length - 1; i++) {
      const a = PC.poi(A[i].pid), b = PC.poi(A[i + 1].pid), solid = A[i].st === 'done' && (A[i + 1].st === 'done' || A[i + 1] === t.stops[t.idx]);
      lines.push({ pts: [[a.x, a.y], [b.x, b.y]], cls: solid ? 'solid' : '' });
    }
    t.stops.forEach((s, i) => { if (s.st === 'rej' && s.reason !== MANUAL && act.length) { const p = PC.poi(s.pid), prev = t.stops.slice(0, i).reverse().find(x => x.st === 'done'); if (prev) { const a = PC.poi(prev.pid); lines.push({ pts: [[a.x, a.y], [p.x, p.y]], cls: 'rej' }); } } });
    const up = userPos(t);
    if (t.phase !== 'arrived') mk.push({ x: up.x, y: up.y, cls: 'user', html: '', z: 5 });
    const pts = (fitStops || [t.stops[t.idx]].concat(t.stops.filter(s => s.st === 'todo'))).map(s => PC.poi(s.pid)).concat([up]);
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { markers: mk, lines, fit: [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)], zfloor: 0.2, fitKey: 'trip' + t.idx + t.phase + t.stops.length + (extra ? 'x' : '') };
  }
  function progCard(t, label) {
    const info = PC.tripInfo(t), act = t.stops.filter(s => s.st !== 'rej');
    const bars = act.map(s => '<i class="' + (s.st === 'done' || s.st === 'skip' ? 'f' : (s === t.stops[t.idx] ? 'h' : '')) + '"></i>').join('');
    return '<div class="prog"><div class="mb-7 row between"><b class="fs-16">第 ' + info.n + ' / ' + info.total + ' 站' + (label || '') + '</b><span class="fs-13 sub">还剩 ' + PC.fmtDist(info.remM) + ' · 约 ' + PC.fmtDur(info.remMin) + '</span></div><div class="pbar">' + bars + '</div></div>';
  }
  const endPill = '<button class="endpill" data-act="tripEnd">' + ic('flag', 14, 2) + '结束行程</button>';

  function stateTxt(t, s, i, pl) {
    if (s.st === 'done') return '已完成';
    if (s.st === 'skip') return '已跳过';
    if (s.st === 'rej') return s.reason === MANUAL ? '已手动移出' : '进不去 · 已移出路线';
    return (pl ? PC.fmtClock(pl) + ' · ' : '') + '停留 ' + s.dwell + ' 分钟' + (i === t.idx ? ' · 当前站' : '');
  }
  function tlList(t) {
    const act = [], todo = t.stops.map((s, i) => i).filter(i => t.stops[i].st === 'todo');
    const pl = PC.plan(todo.map(i => t.stops[i]), t.clock + PC.walkMin(PC.dist(userPos(t), PC.poi(t.stops[todo[0]].pid))));
    t.stops.forEach(s => { if (s.st !== 'rej') act.push(s); });
    return t.stops.map((s, i) => {
      const p = PC.poi(s.pid), k = act.indexOf(s) + 1, ti = todo.indexOf(i);
      const cls = s.st === 'done' ? 'num done' : s.st === 'rej' || s.st === 'skip' ? 'num rej' : i === t.idx ? 'num cur' : 'num';
      const inner = s.st === 'done' ? ic('check', 13, 3) : s.st === 'rej' ? ic('x', 13, 2.4) : s.st === 'skip' ? ic('skip', 12, 2.4) : k;
      return '<div class="tlrow ' + (s.st === 'done' || s.st === 'rej' || s.st === 'skip' ? 'fade' : '') + '"><span class="' + cls + '">' + inner + '</span><div class="grow"><div class="row gap6"><b style="font-size:14px;' + (s.st === 'rej' ? 'text-decoration:line-through' : '') + '">' + esc(p.name) + '</b>' + (s.rep ? '<span class="h-17 fs-10 tag official">替换</span>' : '') + (s.moved ? '<span class="h-17 fs-10 tag ghost">顺序调整</span>' : '') + '</div><div class="fs-11-5 sub">' + stateTxt(t, s, i, ti >= 0 ? pl.arr[ti] : 0) + '</div></div></div>';
    }).join('');
  }

  /* ---------- P13 行程中 ---------- */
  PC.route('/trip', () => {
    const t = S.trip; if (!t || t.ended) return noTrip();
    const cur = t.stops[t.idx], p = PC.poi(cur.pid), info = PC.tripInfo(t), m = PC.dist(info.up, p), arrived = t.phase === 'arrived';
    const act = t.stops.filter(s => s.st !== 'rej');
    const chips = act.map((s, i) => {
      const cls = s.st === 'done' ? 'num done' : s === cur ? 'num big cur' : s.st === 'skip' ? 'num rej' : 'num';
      return '<div class="w-62 ta-c"><div class="' + cls + '" style="margin:0 auto">' + (s.st === 'done' ? ic('check', 13, 3) : i + 1) + '</div><div style="font-size:11px;margin-top:3px;' + (s === cur ? 'font-weight:700' : 'color:var(--muted)') + '">' + esc(short(PC.poi(s.pid).name).slice(0, 5)) + '</div></div>' + (i < act.length - 1 ? '<div style="flex:1;margin-bottom:16px;border-top:2px ' + (s.st === 'done' ? 'solid' : 'dotted') + ' #262626;opacity:.55"></div>' : '');
    }).join('');
    const panel = '<div class="mb-8 row gap6"><span class="tag dark">行程中</span><span class="fs-12 sub">' + esc(PC.getRoute(t.routeId).name) + ' · 示例数据</span></div>' +
      '<div class="card"><div class="ai-s row gap12"><span class="num big cur">' + info.n + '</span><div class="grow"><h1 class="fs-19 h2" id="main-h">' + esc(p.name) + (cur.rep ? ' <span class="tag official" style="vertical-align:middle">替换</span>' : '') + '</h1><div class="fs-12-5 sub mt4">' + (arrived ? '已到达现场' : '步行 ' + PC.walkMin(m) + ' 分钟 · 距你 ' + PC.fmtDist(m) + ' · 预计 ' + PC.fmtClock(t.clock + PC.walkMin(m)) + ' 到') + '</div></div></div>' +
      '<div class="row gap6 wrap mt12">' + p.rules.slice(0, 3).map(V.ruleChip).join('') + '</div>' +
      '<div class="fs-12 row between mt12"><span class="row gap6">' + ic('clock', 14, 2) + '计划停留 ' + cur.dwell + ' 分钟 · 到达后开始倒计时</span><span class="fs-11 muted">示例 · 待核实</span></div></div>' +
      '<div class="row gap10 mt12"><button class="btn sec" style="flex:.9" data-act="tripNav">' + ic('nav', 16, 2) + '去这里</button>' + (arrived ? '<button class="btn prim" style="flex:1.1" data-act="go" data-to="/trip/arrive">回到现场</button>' : '<button class="btn prim" style="flex:1.1" data-act="tripArrive">' + ic('check', 18, 2.8) + '我到了</button>') + '</div>' +
      '<div class="mob-only mt16"><div class="gap-0 row">' + chips + '<button class="fs-12 ml-6 mb-14 nowrap row gap4 b" data-act="tlToggle" aria-expanded="' + !!PC.ui.tlOpen + '">全部' + ic(PC.ui.tlOpen ? 'down' : 'up', 14, 2.4) + '</button></div></div>' +
      '<div class="pt-10 fs-13 fw-7 row between hr mt8"><button class="row gap6" data-act="tripReject">' + ic('ban', 15, 2) + '进不去？换一站</button><button class="row gap6" data-act="tripSkip">' + ic('skip', 15, 2) + '跳过此站</button></div>' +
      '<div class="' + (PC.ui.tlOpen ? '' : 'desk-only') + ' mt12"><div class="row between"><b class="fs-15">全部站点</b></div>' + tlList(t) + '</div>';
    return { mode: 'map', nav: 'map', tab: null, title: '行程中', fab: null, snap: 'half', halfRatio: .56, insetTop: 100, ctlTop: 125, deskTop: 100, overlay: progCard(t) + endPill, panel, map: tripMap(t) };
  });
  ACT.tlToggle = () => { PC.ui.tlOpen = !PC.ui.tlOpen; if (PC.ui.tlOpen) PC.ui.snap = 'full'; PC.refresh(); };
  ACT.tripNav = () => {
    const t = S.trip, p = PC.poi(t.stops[t.idx].pid);
    PC.modal(() => PC.sheetTitle('导航到本站（模拟）', p.name) + '<div class="callout sage"><span>' + ic('nav', 16, 2) + '</span><span>示例：正式版会跳出到地图 App，回来仍停在行程页，当前站不变。演示版不使用真实导航。</span></div><div class="card flat mt12 row gap10"><span class="num">' + ic('walk', 15, 2) + '</span><div class="grow"><b>步行约 ' + PC.walkMin(PC.dist(userPos(t), p)) + ' 分钟</b><div class="sub">目的地：' + esc(p.name) + '</div></div>' + V.sample('示例，非真实') + '</div><button class="btn prim block mt16" data-act="closeModal">返回 PetCity</button>', { cls: 'small' });
  };
  ACT.tripArrive = () => {
    const t = S.trip, cur = t.stops[t.idx], p = PC.poi(cur.pid), m = PC.dist(t.last, p);
    t.actualM += m; t.clock += PC.walkMin(m); t.phase = 'arrived'; t.dwellLeft = cur.dwell; cur.ext = 0; PC.save();
    PC.go('/trip/arrive');
  };
  ACT.tripSkip = () => {
    const snap = JSON.stringify(S.trip), t = S.trip, cur = t.stops[t.idx], name = PC.poi(cur.pid).name;
    cur.st = 'skip'; t.skipped++; t.last = userPos(t);
    if (advance()) {
      PC.refresh();
      PC.toast('已跳过「' + short(name) + '」', { action: '撤销', ms: 3200, onAction: () => { S.trip = JSON.parse(snap); PC.save(); PC.go('/trip', { replace: true }); } });
    }
  };
  ACT.tripEnd = () => PC.confirm('结束行程并查看小结？未走完的站点不会记为到达。', () => { PC.finishTrip(); PC.go('/trip/summary', { replace: true }); }, '结束行程');
  ACT.tripReject = () => { PC.ui.rej = { reason: null, cand: 0 }; PC.go('/trip/reject'); };

  /* ---------- P13a 到达现场 ---------- */
  PC.route('/trip/arrive', () => {
    const t = S.trip; if (!t || t.ended) return noTrip();
    if (t.phase !== 'arrived') { t.phase = 'arrived'; t.dwellLeft = t.stops[t.idx].dwell; }
    const cur = t.stops[t.idx], p = PC.poi(cur.pid), info = PC.tripInfo(t), nxt = nextIdx(t), tot = cur.dwell + (cur.ext || 0);
    const fac = { '饮水点': ['drop', 80], '洗手间': ['wc', 150], '拾便袋': ['bag', 50], '长椅': ['users', 30] };
    const photos = t.photos ? Array.from({ length: Math.min(t.photos, 4) }, () => '<div class="w-50 h-50 r-12 fs-9 c-muted ai-e pb-3 thumb t1">示例图片</div>').join('') : '';
    const panel = '<div class="row gap8"><span class="w-22 h-22 num done">' + ic('check', 13, 3) + '</span><h1 class="fs-19 h2 grow" id="main-h">已到达 · ' + esc(p.name) + '</h1></div>' +
      '<div class="card mt12 row gap12"><div class="ring" id="ring"><div class="in"><b class="fs-20 lh-1" id="ringTxt">--:--</b><span class="fs-10 c-muted">剩余</span></div></div><div class="grow"><div class="fs-13 b">计划停留 ' + tot + ' 分钟</div><div class="fs-11-5 mb-7 sub">' + PC.fmtClock(t.clock) + ' 到达 · 演示加速：1 秒 ≈ 1 分钟</div><div class="row gap6 wrap"><button class="fw-7 chip sm" data-act="dwellExt">' + ic('plus', 12, 2.8) + '延长 10 分钟</button><button class="chip sm" data-act="tripLeave">提前离开</button></div></div></div>' +
      '<div class="d-block callout sage mt12"><b class="fs-12-5">现场小贴士（示例）</b><div class="fs-12 lh-1-55 mt-3">' + esc(p.tip) + '</div></div>' +
      '<div class="row gap8 mt12"><button class="w-50 h-50 r-12 fd-col fs-10 dash thumb" data-act="tripPhoto" aria-label="拍照（示例）">' + ic('camera', 18, 1.8) + '</button>' + photos + '<div class="fs-11-5 grow sub">拍张照留念（示例，不会真的拍照），行程小结里会汇总</div></div>' +
      '<div class="fw-wrap row gap8 mt12 between"><b class="fs-12-5 grow">这里的规则和页面写的一致吗？</b><button class="chip sm" data-act="ruleSame">' + ic('check', 13, 2.6) + '一致</button><button class="chip sm" data-act="ruleDiff">' + ic('flag', 13, 2.2) + '不一样</button></div>' +
      '<div class="fs-11-5 row gap6 wrap mt12"><span class="muted">附近</span>' + p.facilities.filter(f => fac[f]).map(f => '<button class="chip sm" data-act="demo" data-msg="已在地图上定位「' + f + '」（示例）">' + ic(fac[f][0], 12, 2) + f + ' ' + fac[f][1] + ' m</button>').join('') + '</div>';
    const actions = '<button class="btn sec" style="flex:.85" data-act="tripReject">' + ic('ban', 15, 2) + '进不去</button><button class="btn prim" style="flex:1.15" data-act="tripLeave">' + (nxt < 0 ? '完成行程' : '去第 ' + (info.n + 1) + ' 站') + ic('right', 16, 2.6) + '</button>';
    return {
      mode: 'map', nav: 'map', tab: null, title: '到达现场', fab: null, snap: 'half', halfRatio: .6, insetTop: 100, ctlTop: 125, deskTop: 100, overlay: progCard(t, ' · 已到达') + endPill, panel, actions, map: tripMap(t),
      after: () => {
        let warned = t.dwellLeft <= 0;
        const draw = () => {
          const tt = S.trip; if (!tt) return;
          const left = Math.max(0, tt.dwellLeft), mm = Math.floor(left), ss = Math.floor((left - mm) * 60), total = tt.stops[tt.idx].dwell + (tt.stops[tt.idx].ext || 0);
          const rt = $('#ringTxt'), rg = $('#ring'); if (!rt || !rg) return;
          rt.textContent = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
          rg.style.background = 'conic-gradient(var(--prim) 0 ' + Math.min(100, (1 - left / total) * 100).toFixed(1) + '%,#e4dcb0 0 100%)';
        };
        draw();
        // 演示加速：1 秒 = 1 分钟。每秒更新一次（原来每 0.2 秒），浏览器切到后台时暂停
        const iv = setInterval(() => {
          if (document.hidden) return;
          const tt = S.trip; if (!tt || tt.phase !== 'arrived') return;
          if (tt.dwellLeft > 0) { tt.dwellLeft = Math.max(0, tt.dwellLeft - 1); draw(); if (tt.dwellLeft === 0 && !warned) { warned = true; PC.toast('停留时间到了，该去下一站了（示例提醒，不会自动跳站）', { ms: 3500 }); PC.save(); } }
        }, 1000);
        PC.leave(() => { clearInterval(iv); PC.save(); });
      },
    };
  });
  ACT.dwellExt = () => { const t = S.trip, c = t.stops[t.idx]; c.ext = (c.ext || 0) + 10; t.dwellLeft += 10; PC.save(); PC.refresh(); PC.toast('已延长 10 分钟'); };
  ACT.tripPhoto = () => { S.trip.photos++; PC.save(); PC.refresh(); PC.toast('已添加一张示例照片'); };
  ACT.ruleSame = () => { PC.toast('已记录：规则一致（示例，不会提交）'); };
  ACT.ruleDiff = () => {
    const t = S.trip, pid = t.stops[t.idx].pid;
    PC.modal(() => PC.sheetTitle('哪里不一样？', PC.poi(pid).name) + '<div class="opts">' + ['牵绳要求', '体型限制', '禁入区', '已关闭', '其他'].map(r => '<button class="chip" data-act="diffSend" data-r="' + r + '">' + r + '</button>').join('') + '</div><p class="fs-11-5 sub mt12">示例：反馈只记录在本机，同时计入你的「规则反馈记录」。</p>', { cls: 'small' });
  };
  ACT.diffSend = el => { const t = S.trip; S.feedback.unshift({ pid: t.stops[t.idx].pid, reason: el.dataset.r, src: '行程中', time: '刚刚' }); t.fb++; PC.save(); PC.closeModal(true); PC.toast('已记录反馈：' + el.dataset.r + '（示例）'); };
  ACT.tripLeave = () => {
    const t = S.trip, cur = t.stops[t.idx], p = PC.poi(cur.pid);
    t.clock += Math.max(0, cur.dwell + (cur.ext || 0) - Math.max(0, t.dwellLeft));
    cur.st = 'done'; t.last = { x: p.x, y: p.y }; t.phase = 'moving';
    if (advance()) PC.go('/trip', { replace: true });
  };

  /* ---------- P13b 进不去 · 换一站 ---------- */
  function candidates(t) {
    const cur = PC.poi(t.stops[t.idx].pid), pet = S.pets.find(p => p.id === t.petId) || PC.pet(), used = t.stops.map(s => s.pid);
    return Object.values(PC.POIS).filter(p => used.indexOf(p.id) < 0 && p.maxSize >= PC.SIZE_RANK[pet.size] && PC.dist(p, cur) <= REPL_R).sort((a, b) => PC.dist(a, cur) - PC.dist(b, cur));
  }
  PC.route('/trip/reject', () => {
    const t = S.trip; if (!t || t.ended) return noTrip();
    const R = PC.ui.rej || (PC.ui.rej = { reason: null, cand: 0 }), cur = t.stops[t.idx], cp = PC.poi(cur.pid), pet = S.pets.find(p => p.id === t.petId) || PC.pet();
    const all = candidates(t), stops = all.filter(p => !p.rest).slice(0, 3), rest = all.filter(p => p.rest);
    const reasons = ['不让带宠物', '体型限制', '已关门 / 满位', '其他'];
    const L = ['A', 'B', 'C'];
    const rows = stops.map((p, i) => '<button class="card click mt8 row gap10" style="width:100%;text-align:left;' + (R.cand === i ? 'outline:2px solid #262626' : '') + '" data-act="rejCand" data-i="' + i + '" role="radio" aria-checked="' + (R.cand === i) + '"><span class="num cand">' + L[i] + '</span><span class="grow"><span class="row gap6"><b class="fs-14-5">' + esc(p.name) + '</b>' + (i === 0 ? '<span class="h-18 fs-10 tag official">推荐</span>' : '') + '</span><span class="d-block fs-11-5 sub" style="margin:2px 0 4px">步行 ' + PC.walkMin(PC.dist(p, cp)) + ' 分钟 · ' + PC.fmtDist(PC.dist(p, cp)) + ' · ' + p.hoursTxt + ' · 示例 · 待核实</span><span class="row gap4 wrap">' + p.rules.slice(0, 2).map(r => '<span class="chip tiny">' + esc(r[1]) + '</span>').join('') + '</span></span><span class="radio ' + (R.cand === i ? 'on' : '') + '">' + (R.cand === i ? ic('check', 13, 3) : '') + '</span></button>').join('');
    const restTxt = rest.length ? '<div class="fs-11-5 sub mt8">顺路休息点（不算一站）：' + rest.map(p => esc(short(p.name)) + ' ' + PC.fmtDist(PC.dist(p, cp))).join('、') + '</div>' : '';
    const ok = !!R.reason;
    const panel = '<h1 class="fs-21 h2" id="main-h">进不去？换一站吧</h1><div class="sub" style="margin:3px 0 8px">' + esc(cp.name) + ' · 说一下原因，会同时记为规则反馈</div>' +
      '<div class="opts" role="radiogroup" aria-label="原因">' + reasons.map(r => '<button class="chip ' + (R.reason === r ? 'sel' : '') + '" data-act="rejReason" data-r="' + r + '" role="radio" aria-checked="' + (R.reason === r) + '">' + r + '</button>').join('') + '</div>' +
      '<div class="row between mt12"><b class="fs-14">附近替换站</b><span class="fs-11-5 sub">' + REPL_R + ' m 内 · 适合 ' + esc(pet.name) + '（' + PC.sizeLabel(pet) + '）</span></div>' +
      (rows || '<div class="callout soft mt8">' + ic('info', 14, 2) + '<span>附近 ' + REPL_R + ' m 内没有适合 ' + esc(pet.name) + ' 的替换站，可以直接跳过这一站。</span></div>') + restTxt;
    const actions = '<div class="flex-1 d-flex fd-col gap-6">' + (stops.length ? '<button class="btn prim block" data-act="rejGo" ' + (ok ? '' : 'disabled') + '>替换并重排剩余路线' + ic('right', 16, 2.6) + '</button>' : '') + '<button class="fs-13 h-28 u b center" data-act="rejSkip" ' + (ok ? '' : 'disabled style="opacity:.45"') + '>不替换，直接跳过此站</button>' + (ok ? '' : '<div class="fs-11-5 center sub">请先选一个原因</div>') + '</div>';
    const extra = stops.map((p, i) => ({ x: p.x, y: p.y, cls: 'n cand' + (R.cand === i ? ' sel' : ''), html: L[i], z: 5, label: p.name }));
    return {
      mode: 'map', nav: 'map', tab: null, title: '进不去', fab: null, snap: 'half', halfRatio: .66, insetTop: 70, ctlTop: 70, deskTop: 80,
      overlay: '<button class="circ-btn mapback" data-act="back" data-to="/trip" aria-label="返回">' + ic('left', 20, 2) + '</button><div class="maptitle">第 ' + PC.tripInfo(t).n + ' / ' + PC.tripInfo(t).total + ' 站 · 进不去</div>', panel, actions,
      map: tripMap(t, extra, [cur].concat(stops.map(p => ({ pid: p.id })))),
    };
  });
  ACT.rejReason = el => { PC.ui.rej.reason = el.dataset.r; PC.refresh(); };
  ACT.rejCand = el => { PC.ui.rej.cand = +el.dataset.i; PC.refresh(); };
  function logReject(t, reason) { S.feedback.unshift({ pid: t.stops[t.idx].pid, reason: '进不去：' + reason, src: '行程中', time: '刚刚' }); t.fb++; }
  ACT.rejSkip = () => {
    const t = S.trip, R = PC.ui.rej; if (!R.reason) return;
    logReject(t, R.reason); const cur = t.stops[t.idx]; cur.st = 'rej'; t.skipped++; t.last = t.phase === 'arrived' ? PC.poi(cur.pid) : userPos(t);
    if (advance()) { PC.go('/trip', { replace: true }); PC.toast('已跳过，并记为规则反馈（示例）'); }
  };
  ACT.rejGo = () => {
    const t = S.trip, R = PC.ui.rej; if (!R.reason) return;
    const cand = candidates(t).filter(p => !p.rest).slice(0, 3)[R.cand]; if (!cand) return;
    logReject(t, R.reason);
    const idx = t.idx, cur = t.stops[idx], curPos = t.phase === 'arrived' ? PC.poi(cur.pid) : userPos(t);
    cur.st = 'rej'; cur.reason = R.reason;
    const head = t.stops.slice(0, idx + 1), after = t.stops.slice(idx + 1);
    const before = after.filter(s => s.st === 'todo').map(s => s.pid);
    const ordered = PC.nearestOrder(after.filter(s => s.st === 'todo').map(s => PC.poi(s.pid)), cand).map(p => after.find(s => s.pid === p.id));
    ordered.forEach((s, i) => { s.moved = before[i] !== s.pid; });
    const ns = { pid: cand.id, dwell: cand.dwell, st: 'todo', rep: true };
    t.stops = head.concat([ns], ordered, after.filter(s => s.st !== 'todo'));
    t.idx = idx + 1; t.phase = 'moving'; t.last = curPos; t.replaced++; t.replan = { oldPid: cur.pid, newPid: cand.id };
    PC.save(); PC.go('/trip/replan', { replace: true });
  };

  /* ---------- P13c 剩余路线重排 ---------- */
  PC.route('/trip/replan', () => {
    const t = S.trip; if (!t || t.ended) return noTrip();
    const info = PC.tripInfo(t), todo = t.stops.filter(s => s.st === 'todo'), pet = S.pets.find(p => p.id === t.petId) || PC.pet();
    const iss = PC.issues(todo, t.clock + PC.walkMin(PC.dist(info.up, PC.poi(todo[0].pid))), pet).filter(x => x.level === 'warn');
    const panel = '<h1 class="fs-21 h2" id="main-h">剩余路线已重新排好</h1>' +
      '<div class="py-8 statbar mt12"><div><b class="fs-17">' + (info.remM / 1000).toFixed(1) + '</b><span>公里</span></div><div><b class="fs-17">' + PC.fmtDur(info.remMin).replace(' ', '') + '</b><span>含停留</span></div><div><b class="fs-17">' + info.remStops + '</b><span>站</span></div></div>' +
      '<div class="mt8">' + tlList(t) + '</div>' +
      iss.map(x => '<div class="callout alert mt8">' + ic('alert', 14, 2.2) + '<span>' + esc(short(PC.poi(todo[x.i].pid).name)) + '：' + esc(x.text) + '，请联系店家（示例）</span></div>').join('') +
      '<p class="fs-11-5 sub mt8">重排规则（示例）：剩余站总路程最短；有预约的站以时间为准。</p>';
    return { mode: 'map', nav: 'map', tab: null, title: '剩余路线重排', fab: null, snap: 'half', halfRatio: .66, insetTop: 70, ctlTop: 70, deskTop: 80,
      overlay: '<div class="left-14 maptitle">已替换 · 剩余路线重排</div>', panel,
      actions: '<button class="btn sec" style="flex:.8" data-act="rpAdjust">再调整</button><button class="btn prim" style="flex:1.2" data-act="go" data-to="/trip" data-replace="1">继续行程' + ic('right', 16, 2.6) + '</button>', map: tripMap(t) };
  });
  function adjustHtml() {
    const t = S.trip, idxs = t.stops.map((s, i) => i).filter(i => i > t.idx && t.stops[i].st === 'todo');
    return PC.sheetTitle('再调整剩余站', '只能调整本站之后的站点') + (idxs.length ? idxs.map((i, k) => '<div class="card flat mt8 row gap10"><span class="num">' + (k + 1) + '</span><b class="fs-14 grow">' + esc(PC.poi(t.stops[i].pid).name) + '</b><button class="circ-btn sq" data-act="rpMove" data-i="' + i + '" data-d="-1" aria-label="上移" ' + (k === 0 ? 'disabled style="opacity:.35"' : '') + '>' + ic('up', 16, 2) + '</button><button class="circ-btn sq" data-act="rpMove" data-i="' + i + '" data-d="1" aria-label="下移" ' + (k === idxs.length - 1 ? 'disabled style="opacity:.35"' : '') + '>' + ic('down', 16, 2) + '</button><button class="circ-btn sq" data-act="rpDel" data-i="' + i + '" aria-label="移出">' + ic('x', 16, 2) + '</button></div>').join('') : '<div class="empty">本站之后没有可调整的站点</div>') + '<button class="btn prim block mt16" data-act="rpDone">完成调整</button>';
  }
  ACT.rpAdjust = () => PC.modal(adjustHtml, { cls: 'small' });
  ACT.rpMove = el => {
    const t = S.trip, i = +el.dataset.i, d = +el.dataset.d, idxs = t.stops.map((s, k) => k).filter(k => k > t.idx && t.stops[k].st === 'todo'), pos = idxs.indexOf(i), j = idxs[pos + d];
    if (j == null) return;
    const a = t.stops[i]; t.stops[i] = t.stops[j]; t.stops[j] = a; a.moved = true; PC.save(); PC.modalUpdate();
  };
  ACT.rpDel = el => { const t = S.trip, s = t.stops[+el.dataset.i]; s.st = 'rej'; s.reason = MANUAL; PC.save(); PC.modalUpdate(); };
  ACT.rpDone = () => { PC.closeModal(true); PC.refresh(); };

  /* ---------- P14 行程小结 ---------- */
  // 「走完了？写评价」用单独的 S.noTripSum，不会覆盖刚走完、还没发帖的真实行程小结；同一条路线有真实小结时直接显示真实的
  const realSum = rid => S.lastSummary && !S.lastSummary.noTrip && S.lastSummary.routeId === rid ? S.lastSummary : null;
  const curSum = q => { q = q || PC.cur.q || {}; return q.route ? (realSum(q.route) || (S.noTripSum && S.noTripSum.routeId === q.route ? S.noTripSum : null)) : S.lastSummary; };
  PC.route('/trip/summary', (p, q) => {
    if (q.route && !realSum(q.route)) {
      const r = PC.getRoute(q.route);
      if (r && !(S.noTripSum && S.noTripSum.routeId === q.route)) {
        S.noTripSum = { id: 'nt_' + q.route, noTrip: true, routeId: q.route, petId: S.petId, stops: r.stops.map(s => ({ pid: s.pid, dwell: s.dwell, st: 'done' })), ratings: {}, replaced: 0, skipped: 0, fb: 0, photos: 0, actualM: 0, clock: 0, startClock: 0 }; PC.save();
      }
    }
    const sm = curSum(q);   // 路由函数执行时 PC.cur 还没更新，要用本次的 q
    if (!sm) return { mode: 'page', nav: 'map', tab: '', title: '行程小结', pageClass: 'narrow', page: '<div class="pt-80 empty"><div class="h2">还没有行程小结</div><button class="btn prim mt16" data-act="go" data-to="/map">回到地图</button></div>' };
    const r = PC.getRoute(sm.routeId), pet = S.pets.find(x => x.id === sm.petId) || PC.pet();
    const shown = sm.stops.filter(s => s.st !== 'rej'), arrived = shown.filter(s => s.st === 'done').length, rej = sm.stops.filter(s => s.st === 'rej' && s.reason !== MANUAL), manual = sm.stops.filter(s => s.st === 'rej' && s.reason === MANUAL);
    const b = (pid, v, ico, lbl) => '<button data-act="rate" data-pid="' + pid + '" data-v="' + v + '" aria-pressed="' + (sm.ratings[pid] === v) + '" style="width:48px;height:46px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:10px;' + (sm.ratings[pid] === v ? 'background:var(--prim);color:#fff' : 'background:var(--soft);color:var(--muted)') + '">' + ic(ico, 16, 2) + lbl + '</button>';
    const rows = shown.map((s, i) => {
      const p = PC.poi(s.pid), todo = s.st === 'todo' && !sm.noTrip, skip = s.st === 'skip' || todo;   // 提前结束：没走到的站不算到达、不评分
      return '<div class="row gap10" style="padding:9px 0;border-bottom:1px solid var(--line);' + (skip ? 'opacity:.6' : '') + '"><span class="num ' + (skip ? 'rej' : 'done') + '">' + (skip ? ic('skip', 12, 2.4) : ic('check', 13, 3)) + '</span><div class="grow"><div class="row gap6"><b class="fs-14">' + esc(p.name) + '</b>' + (s.rep ? '<span class="h-17 fs-10 tag official">替换站</span>' : '') + '</div><div class="fs-11-5 sub">' + (todo ? '未到达 · 行程已提前结束' : skip ? '已跳过 · 未到达' : sm.noTrip ? '路线站点' : '已到达') + '</div></div>' + (skip ? '<span class="fs-11-5 sub">不评分</span>' : '<div class="gap-5 row">' + b(s.pid, 'up', 'up2', '推荐') + b(s.pid, 'meh', 'meh', '一般') + b(s.pid, 'down', 'sad', '不推荐') + '</div>') + '</div>';
    }).join('');
    const dur = sm.clock - sm.startClock;
    const page = '<div class="bg-khaki h-118 pos-rel" style="margin:-14px -18px 0"><button class="pos-abs left-14 top-14 circ-btn" data-act="back" data-to="/map" aria-label="关闭">' + ic('x', 18, 2) + '</button><div class="pt-42 center">' + PC.dog(70, true) + '</div></div>' +
      '<div class="mt-10 center"><h1 class="fs-24 fw-6 h1 tabtitle" id="main-h" style="letter-spacing:.04em">' + (arrived === shown.length ? '走完啦！' : '行程结束 · ') + esc(r ? r.name : '') + '</h1><div class="sub mt4">' + (sm.noTrip ? '补写评价（未使用行程模式，不显示距离和用时）' : PC.fmtClock(sm.startClock) + ' – ' + PC.fmtClock(sm.clock)) + ' · ' + V.petLabel(pet) + ' · 示例数据</div></div>' +
      (sm.noTrip ? '' : '<div class="statbar mt12"><div><b>' + (sm.actualM / 1000).toFixed(1) + '</b><span>公里</span></div><div><b>' + PC.fmtDur(dur).replace(' ', '') + '</b><span>实际用时</span></div><div><b>' + arrived + ' / ' + shown.length + '</b><span>站到达</span></div></div><div class="jc-c row gap6 mt8"><span class="chip sm">替换 ' + sm.replaced + ' 站</span><span class="chip sm">跳过 ' + sm.skipped + ' 站</span><span class="chip sm">规则反馈 ' + sm.fb + ' 条</span></div>') +
      '<div class="row between mt16"><b class="fs-15">给每一站打个分</b><span class="fs-11-5 sub">可跳过 · 同步到站点评价（示例）</span></div>' + rows +
      (rej.length ? '<div class="callout soft mt12">' + ic('flag', 14, 2) + '<span>' + rej.map(s => esc(PC.poi(s.pid).name)).join('、') + ' 进不去，已记为规则反馈（示例）</span></div>' : '') +
      (manual.length ? '<div class="callout soft mt8">' + ic('info', 14, 2) + '<span>' + manual.map(s => esc(PC.poi(s.pid).name)).join('、') + ' 已手动移出路线（不计为规则反馈）</span></div>' : '') +
      '<div class="pos-sticky bottom-12 row gap10 mt20"><button class="btn sec" style="flex:.8" data-act="sumSave">先保存</button><button class="btn prim" style="flex:1.3" data-act="sumPost">' + ic('send', 16, 2.2) + '发到社区</button></div>';
    return { mode: 'page', nav: 'map', tab: '', title: '行程小结', pageClass: 'narrow', page };
  });
  function syncReviews() {
    const sm = curSum(), lab = { up: '推荐', meh: '一般', down: '不推荐' };
    Object.keys(S.reviews).forEach(k => { S.reviews[k] = S.reviews[k].filter(r => r.tripId !== sm.id); if (!S.reviews[k].length) delete S.reviews[k]; });
    const pet = S.pets.find(x => x.id === sm.petId) || PC.pet();
    Object.keys(sm.ratings).forEach(pid => { (S.reviews[pid] = S.reviews[pid] || []).push({ tripId: sm.id, pet: PC.sizeLabel(pet) + '', t: '行程小结评价：' + lab[sm.ratings[pid]] }); });
    PC.save();
  }
  ACT.rate = el => { const sm = curSum(), pid = el.dataset.pid; if (sm.ratings[pid] === el.dataset.v) delete sm.ratings[pid]; else sm.ratings[pid] = el.dataset.v; syncReviews(); PC.refresh(); };
  ACT.sumSave = () => { PC.toast('行程已保存（示例，保存在本机）'); PC.go('/map', { replace: true }); };
  ACT.sumPost = () => {
    const sm = curSum(), r = PC.getRoute(sm.routeId), pet = S.pets.find(x => x.id === sm.petId) || PC.pet();
    const done = sm.stops.filter(s => s.st === 'done').map(s => s.pid);
    const lab = { up: '推荐', meh: '一般', down: '不推荐' };
    const rt = done.filter(pid => sm.ratings[pid]).map(pid => short(PC.poi(pid).name) + '：' + lab[sm.ratings[pid]]);
    PC.ui.postDraft = { text: '今天和' + pet.name + '走了「' + (r ? r.name : '') + '」' + (sm.noTrip ? '' : '，共 ' + (sm.actualM / 1000).toFixed(1) + ' km。') + (rt.length ? '我的评价：' + rt.join('；') + '。' : '') + '（示例）', route: sm.routeId, place: done[0] || null, photos: sm.photos || 0, tags: ['路线打卡'], pet: pet.id };
    PC.go('/post/new?from=trip');
  };
})(window.PC);
