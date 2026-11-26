/* 建档、地图首页、点位、路线列表、帮我排路线、路线编辑、路线详情、怎么去起点 */
(function (PC) {
  'use strict';
  const { $, esc, ic, S, ACT, INPUT } = PC;
  const V = PC.V = {};
  PC.USER = PC.ll(22.3035, 114.1585);   // 示例「我的位置」：西九文化区附近

  V.phead = (title, o) => {
    o = o || {};
    return '<div class="phead"><button class="circ-btn" data-act="back" data-to="' + (o.back || '/map') + '" aria-label="返回">' + ic(o.close ? 'x' : 'left', 20, 2) + '</button><div class="t' + (o.left ? ' l' : '') + '" id="main-h">' + title + '</div>' + (o.right || '<span class="w-40"></span>') + '</div>';
  };
  V.sample = (t, big) => '<span class="sample' + (big ? ' big' : '') + '">' + (t || PC.SAMPLE) + '</span>';
  V.petLabel = p => esc(p.name) + ' · ' + esc(PC.sizeLabel(p));
  V.ruleChip = r => '<span class="chip tiny">' + ic(r[2] === 'ok' ? 'check' : 'alert', 12, 2.6) + esc(r[1]) + '</span>';
  V.routesOfPoi = pid => Object.values(PC.ROUTES).concat(S.myRoutes).filter(r => r.stops.some(s => s.pid === pid));
  PC.routeStats = r => { const pl = PC.plan(r.stops, r.start); return { pl, km: PC.fmtDist(pl.totalM), kmNum: (pl.totalM / 1000).toFixed(1), dur: PC.fmtDur(pl.total), n: r.stops.length }; };
  V.userDist = p => PC.dist(PC.USER, p);

  V.banner = () => {
    const t = S.trip;
    if (!t || t.ended) return '';
    const info = PC.tripInfo(t), r = PC.getRoute(t.routeId);
    return '<button class="banner" data-act="resumeTrip"><span class="dot"></span><span class="grow"><span class="d-block fs-11 op-85">行程进行中 · 第 ' + info.n + ' / ' + info.total + ' 站</span><b class="d-block fs-14-5 nowrap ov-h" style="text-overflow:ellipsis">' + esc(r ? r.name : '行程') + ' · 还剩 ' + PC.fmtDist(info.remM) + '</b></span><span class="go">继续' + ic('right', 13, 2.6) + '</span></button>';
  };

  V.thumb = r => {
    const pts = r.stops.map(s => PC.poi(s.pid));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const sx = (x1 - x0) || 1, sy = (y1 - y0) || 1, k = Math.min(36 / sx, 34 / sy);
    const P = pts.map(p => [(27 + (p.x - (x0 + x1) / 2) * k).toFixed(1), (24 + (p.y - (y0 + y1) / 2) * k).toFixed(1)]);
    return '<svg viewBox="0 0 54 58" width="54" height="58" aria-hidden="true"><rect width="54" height="58" fill="#f2f1ea"/><rect y="42" width="54" height="16" fill="#aed5e7"/><ellipse cx="14" cy="14" rx="11" ry="7" fill="#c5e1b8"/><polyline points="' + P.map(p => p.join(',')).join(' ') + '" fill="none" stroke="#262626" stroke-width="1.6" stroke-dasharray="0.1 3.4" stroke-linecap="round"/>' + P.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="#567f47"/>').join('') + '</svg>';
  };
  V.routeCard = r => {
    const st = PC.routeStats(r);
    return '<div class="card click rcard" role="button" tabindex="0" data-act="go" data-to="/route/' + r.id + '"><div class="rthumb">' + V.thumb(r) + '</div><div class="grow"><div class="fs-14 b">' + esc(r.name) + '</div><div class="fs-11-5 sub" style="margin:2px 0 5px">' + st.km + ' · ' + st.dur + ' · ' + st.n + ' 站</div><div class="row gap4 wrap">' +
      (r.official ? '<span class="tag official">官方优选</span>' : '<span class="tag ghost">我的路线</span>') + '<span class="sample">示例数据</span></div></div></div>';
  };

  V.routeMap = (stops, o) => {
    o = o || {};
    const pts = stops.map(s => PC.poi(s.pid)), mk = [];
    pts.forEach((p, i) => mk.push({ x: p.x, y: p.y, cls: 'n', html: String(i + 1), z: 3, label: p.name }));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { markers: mk, lines: pts.length > 1 ? [{ pts: pts.map(p => [p.x, p.y]) }] : [], fit: pts.length ? [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)] : 'all', zfloor: 0.2, fitKey: (o.key || PC.cur.path) };
  };

  /* ---------- 宠物菜单 ---------- */
  ACT.petMenu = () => {
    PC.modal(() => PC.sheetTitle('选择宠物', '规则冲突提示会按所选宠物的体型计算') + S.pets.map(p => '<button class="paycard ' + (p.id === S.petId ? 'on' : '') + '" data-act="setPet" data-id="' + p.id + '"><span class="glyph" style="border-style:solid">' + PC.dog(30) + '</span><span class="grow"><b>' + esc(p.name) + '</b><span class="d-block sub">' + esc(p.species) + ' · ' + esc(p.size) + (p.example ? ' · 示例档案' : '') + '</span></span><span class="radio ' + (p.id === S.petId ? 'on' : '') + '">' + (p.id === S.petId ? ic('check', 13, 3) : '') + '</span></button>').join('') +
      '<button class="btn sec block" data-act="addPet">' + ic('plus', 16, 2.4) + '添加宠物</button>');
  };
  ACT.setPet = el => { S.petId = el.dataset.id; PC.save(); PC.closeModal(true); PC.refresh(); PC.toast('已切换宠物'); };
  ACT.addPet = () => { PC.closeModal(true); PC.go('/onboard?add=1&back=' + encodeURIComponent(PC.cur.path)); };

  /* ---------- P0 建档 ---------- */
  PC.route('/onboard', (p, q) => {
    const add = q.add === '1';
    if (!PC.ui.ob || PC.ui.obAdd !== add) {
      PC.ui.obAdd = add;
      const cur = PC.pet();
      PC.ui.ob = add ? { name: '', species: '狗狗', size: '小型', modes: ['走路'], areas: ['西九龙'] } : { name: S.onboarded ? cur.name : '豆豆', species: cur.species, size: cur.size, modes: cur.modes.slice(), areas: cur.areas.slice() };
    }
    const o = PC.ui.ob;
    const one = (k, arr) => '<div class="opts">' + arr.map(v => '<button class="chip ' + (o[k] === v ? 'sel' : '') + '" data-act="obOne" data-k="' + k + '" data-v="' + v + '">' + v + '</button>').join('') + '</div>';
    const multi = (k, arr) => '<div class="opts">' + arr.map(v => '<button class="chip ' + (o[k].indexOf(v) >= 0 ? 'sel' : '') + '" data-act="obMulti" data-k="' + k + '" data-v="' + v + '">' + v + '</button>').join('') + '</div>';
    const sky = '<svg viewBox="0 0 400 190" width="100%" preserveAspectRatio="xMidYMax slice" aria-hidden="true" class="d-block" style="border-radius:22px 22px 0 0"><rect width="400" height="190" fill="#aed5e7"/><circle cx="62" cy="52" r="24" fill="#f4a259"/><g fill="#fff"><ellipse cx="320" cy="48" rx="34" ry="12"/><ellipse cx="300" cy="40" rx="20" ry="11"/><ellipse cx="130" cy="36" rx="26" ry="8"/></g><ellipse cx="330" cy="168" rx="46" ry="28" fill="#9dbf8a"/><rect y="150" width="400" height="40" fill="#fbf8e8"/><g transform="translate(142 62)">' + PC.dog(116, true) + '</g></svg>';
    return {
      mode: 'page', nav: null, tab: '', title: '建档', pageClass: 'narrow', fab: null,
      page: (add ? V.phead('添加宠物', { back: q.back || '/me' }) : '') + '<div class="bg-page r-22 ov-h" style="box-shadow:var(--shadow)">' + sky + '<div class="mt-n22 pos-rel bg-page" style="padding:14px 20px 22px;border-radius:22px 22px 0 0">' +
        '<h1 class="fs-22 fw-4 h1 tabtitle" id="main-h">先认识一下你的毛孩子</h1><div class="sub mt4">点选就好，之后会帮你排出它能去的地方（示例档案，仅存在本机）</div>' +
        '<div class="lbl">它叫什么</div><input class="field" data-input="obName" value="' + esc(o.name) + '" placeholder="例如：豆豆" maxlength="12" aria-label="宠物名字">' +
        '<div class="lbl">种类</div>' + one('species', ['狗狗', '猫猫', '其他']) +
        '<div class="lbl">体型</div>' + one('size', ['小型', '中型', '大型']) + '<div class="fs-11-5 sub mt4">体型会用来判断地点规则是否冲突（示例规则）。</div>' +
        '<div class="lbl">平时怎么出门（可多选）</div>' + multi('modes', ['走路', '公共交通', '打车', '自驾']) +
        '<div class="lbl">常去哪个区</div>' + multi('areas', PC.DISTRICTS.concat(['更多'])) +
        '<div class="row gap12 mt20"><button class="btn prim" style="flex:2" data-act="obDone">' + (add ? '保存宠物' : '完成，去看地图') + '</button>' + (add ? '' : '<button class="flex-1 btn sec" data-act="obSkip">先逛逛</button>') + '</div>' +
        (add ? '' : '<div class="fs-11-5 center sub mt12">「先逛逛」会使用示例档案「豆豆 · 小型犬」</div>') +
        '</div></div>',
    };
  });
  INPUT.obName = el => { PC.ui.ob.name = el.value; };
  ACT.obOne = el => { PC.ui.ob[el.dataset.k] = el.dataset.v; PC.refresh(); };
  ACT.obMulti = el => {
    const a = PC.ui.ob[el.dataset.k], v = el.dataset.v, i = a.indexOf(v);
    if (v === '更多') { PC.toast('示例：更多区域在演示版中暂无示例数据'); return; }
    if (i >= 0) a.splice(i, 1); else a.push(v);
    PC.refresh();
  };
  ACT.obSkip = () => { S.onboarded = true; PC.save(); PC.ui.ob = null; PC.toast('已使用示例档案「豆豆 · 小型犬」'); PC.go('/map', { replace: true }); };
  ACT.obDone = () => {
    const o = PC.ui.ob, name = (o.name || '').trim();
    if (!name) { PC.toast('先给毛孩子起个名字吧'); const f = $('.field'); f && f.focus(); return; }
    if (PC.ui.obAdd) {
      const id = 'pet' + (S.pets.length + 1) + '_' + Date.now() % 1000;
      S.pets.push({ id, name, species: o.species, size: o.size, modes: o.modes.slice(), areas: o.areas.slice() });
      S.petId = id;
      const back = PC.cur.q.back;
      PC.ui.ob = null; PC.save(); PC.toast('已添加「' + name + '」');
      PC.back(back ? decodeURIComponent(back) : '/me'); return;
    }
    const cur = S.pets[0];
    Object.assign(cur, { name, species: o.species, size: o.size, modes: o.modes.slice(), areas: o.areas.slice(), example: false });
    S.petId = cur.id; S.onboarded = true; PC.ui.ob = null; PC.save();
    PC.go('/map', { replace: true });
  };

  /* ---------- P1 / P1a 地图首页 ---------- */
  const FILTERS = ['全部', '户外', '餐饮', '可入店', '医疗美容', '更多'];
  function matchPoi(p) {
    const f = PC.ui.filter, q = PC.toHans((PC.ui.query || '').trim());   // 繁体输入也能搜到
    if (f !== '全部' && p.tags.indexOf(f) < 0 && p.type !== f) return false;
    if (q && p.name.indexOf(q) < 0 && p.type.indexOf(q) < 0) return false;
    return true;
  }
  V.poiRow = p => '<button class="poirow" data-act="pickPlace" data-id="' + p.id + '"><span class="catdot cat-' + PC.catOf(p)[0] + '">' + PC.catIcon(p, 17) + '</span><span class="grow"><b class="fs-14">' + esc(p.name) + '</b><span class="d-block fs-11-5 sub">' + p.type + ' · ' + p.hoursTxt + ' · 距你 ' + PC.fmtDist(V.userDist(p)) + '</span></span>' + ic('right', 16, 1.8) + '</button>';
  function searchDropdown() {
    const q = PC.toHans((PC.ui.query || '').trim());
    if (!q) return '';
    const places = Object.values(PC.POIS).filter(p => p.name.indexOf(q) >= 0 || p.type.indexOf(q) >= 0).slice(0, 5);
    const routes = Object.values(PC.ROUTES).concat(S.myRoutes).filter(r => r.name.indexOf(q) >= 0).slice(0, 3);
    let h = '<div class="mt-2 ov-a card" style="padding:6px 10px;max-height:260px">';
    routes.forEach(r => { h += '<button class="poirow" data-act="go" data-to="/route/' + r.id + '"><span class="tag official">路线</span><b class="fs-14 grow">' + esc(r.name) + '</b></button>'; });
    places.forEach(p => { h += '<button class="poirow" data-act="pickPlace" data-id="' + p.id + '"><span class="tag dark">地点</span><b class="fs-14 grow">' + esc(p.name) + '</b></button>'; });
    if (!places.length && !routes.length) h += '<div class="p-12 empty">没有找到「' + esc(q) + '」，示例数据有限</div>';
    return h + '</div>';
  }
  PC.route('/map', () => mapHome(null));
  PC.route('/map/:id', p => mapHome(p.id));
  function mapHome(sel) {
    const pois = Object.values(PC.POIS).filter(matchPoi);
    const mk = pois.map(p => ({ x: p.x, y: p.y, cls: 'pin cat-' + PC.catOf(p)[0] + (p.id === sel ? ' sel' : '') + (p.rest ? ' rest' : ''), html: PC.catIcon(p, p.id === sel ? 20 : 16), act: 'pickPlace', data: 'data-id="' + p.id + '"', label: p.name, z: p.id === sel ? 9 : 2 }));
    if (sel) mk.push({ x: PC.POIS[sel].x, y: PC.POIS[sel].y, cls: 'lbl', html: esc(PC.POIS[sel].name), z: 10 });
    mk.push({ x: PC.USER.x, y: PC.USER.y, cls: 'user', html: '', z: 4 });
    const hasBanner = S.trip && !S.trip.ended;
    const pet = PC.pet();
    const overlay = '<div class="topbar"><div class="searchbar" role="search">' + ic('search', 16, 2) + '<input id="q" data-input="query" placeholder="搜地方、路线、活动" value="' + esc(PC.ui.query) + '" aria-label="搜索">' +
      (PC.ui.query ? '<button class="w-30 h-30 no-shadow bg-none circ-btn" data-act="clearQuery" aria-label="清除">' + ic('x', 15, 2) + '</button>' : '') +
      '<button class="chip pet-chip" data-act="petMenu" aria-label="切换宠物">' + PC.pawheart(16) + esc(pet.name) + ' · ' + esc(PC.sizeLabel(pet)) + '</button></div>' + searchDropdown() +
      '<div class="chips" role="group" aria-label="筛选">' + FILTERS.map(f => '<button class="chip ' + (PC.ui.filter === f ? 'sel' : '') + '" data-act="setFilter" data-v="' + f + '">' + f + '</button>').join('') + '</div>' + (hasBanner ? V.banner() : '') + '</div>';
    let panel, actions = '';
    if (sel) panel = placeCard(PC.POIS[sel]);
    else {
      const rs = Object.values(PC.ROUTES);
      panel = '<div class="mt-0 sec-h">附近的官方路线<button class="sub u" data-act="go" data-to="/routes">全部 ›</button></div><div class="hscroll">' + rs.map(V.routeCard).join('') + '</div>' +
        '<button class="btn sec block mt8" data-act="go" data-to="/plan">' + ic('sparkle', 16, 2) + '帮我排一条路线</button>' +
        '<div class="desk-only"><div class="sec-h">附近地点（示例）</div>' + pois.map(V.poiRow).join('') + '</div><p class="fs-11-5 sub mt12">地图为示意图，地点、规则、时间均为示例数据，不代表真实情况。</p>';
    }
    return {
      mode: 'map', nav: 'map', tab: 'map', title: '地图', fab: 'p1', snap: 'peek', peek: 300, insetTop: hasBanner ? 190 : 126, ctlTop: hasBanner ? 200 : 140, fabTop: hasBanner ? 190 : 130, deskTop: hasBanner ? 160 : 130,
      overlay, panel, actions, map: { markers: mk, fit: sel ? [PC.POIS[sel].x - 80, PC.POIS[sel].y - 80, PC.POIS[sel].x + 80, PC.POIS[sel].y + 80] : PC.poiBounds().map((n, i) => n + (i < 2 ? -110 : 110)), fitKey: (PC.isDesktop() ? 'd' : 'm') + (sel ? 'sel' + sel : 'home' + (hasBanner ? 'b' : '')) },
    };
  }
  // 搜索框在局部更新里会保留（不再被重建），所以不用再手动把焦点和光标放回去
  INPUT.query = el => { PC.ui.query = el.value; PC.refresh(); };
  ACT.clearQuery = () => { PC.ui.query = ''; PC.refresh(); };
  ACT.setFilter = el => { if (el.dataset.v === '更多') { PC.toast('示例：更多筛选在演示版中仅作展示'); return; } PC.ui.filter = el.dataset.v; PC.refresh(); };
  ACT.pickPlace = el => { PC.ui.query = ''; PC.go('/map/' + el.dataset.id, { replace: /^\/map\//.test(PC.cur.path) }); };

  function placeCard(p) {
    const n = V.routesOfPoi(p.id).length, pet = PC.pet();
    return '<div class="ai-s row between"><div><div class="fs-20 h2" id="main-h">' + esc(p.name) + '</div><div class="sub mt4">' + p.type + ' · ' + p.hoursTxt + ' · 距你 ' + PC.fmtDist(V.userDist(p)) + '</div></div><button class="bg-soft no-shadow circ-btn" data-act="back" data-to="/map" aria-label="关闭">' + ic('x', 16, 2.2) + '</button></div>' +
      '<div class="row gap6 wrap mt12">' + p.rules.map(V.ruleChip).join('') + '</div>' +
      '<div class="d-flex gap-6 ai-c sub mt8">' + ic('star', 14, 2) + '被 ' + n + ' 条路线收录 · <span class="sample">示例 · 待核实</span></div>' +
      (p.maxSize < PC.SIZE_RANK[pet.size] ? '<div class="callout alert mt12">' + ic('alert', 15, 2.2) + '<span>示例规则：限' + (p.maxSize === 1 ? '小型犬' : '中型以下') + '，' + esc(pet.name) + '是' + PC.sizeLabel(pet) + '，可能进不去。</span></div>' : '') +
      '<div class="row gap10 mt16"><button class="btn sec flex1" data-act="go" data-to="/place/' + p.id + '">看详情</button><button class="btn prim flex1" data-act="addToRoute" data-id="' + p.id + '">' + ic('plus', 16, 2.6) + '加入路线</button></div>';
  }

  /* ---------- P2 点位详情 ---------- */
  PC.route('/place/:id', ({ id }) => {
    const p = PC.POIS[id];
    if (!p) return { mode: 'page', page: '<div class="empty">没有这个地点</div>' };
    const pet = PC.pet(), rs = V.routesOfPoi(id), fav = S.favs.indexOf(id) >= 0;
    const revs = (PC.REVIEWS[id] || []).map(r => ({ u: r[0], pet: r[1], t: r[2], tag: '示例评价' })).concat((S.reviews[id] || []).map(r => ({ u: '我', pet: r.pet, t: r.t, tag: '我的评价（示例）' })));
    const small = PC.ui.onlySmall;
    const list = revs.filter(r => !small || /小型/.test(r.pet) || r.u === '我');
    const fbs = S.feedback.filter(f => f.pid === id);
    const panel = '<div class="ai-s row between"><div><h1 class="fs-22 h1" id="main-h">' + esc(p.name) + '</h1><div class="sub mt4">' + p.type + ' · ' + p.hoursTxt + ' · 距你 ' + PC.fmtDist(V.userDist(p)) + '</div></div><span class="tag ghost">示例 · 待核实</span></div>' +
      (p.maxSize < PC.SIZE_RANK[pet.size] ? '<div class="callout alert mt12">' + ic('alert', 15, 2.2) + '<span>示例规则：限' + (p.maxSize === 1 ? '小型犬' : '中型以下') + '，' + esc(pet.name) + '是' + PC.sizeLabel(pet) + '，可能进不去。</span></div>' : '') +
      '<div class="bg-sage no-shadow card mt12"><div class="d-flex gap-6 ai-c mb-8 b">' + ic('star', 15, 2) + '被 ' + rs.length + ' 条路线收录</div>' +
      (rs.length ? rs.map(r => '<button class="w-full ta-l mt-6 bg-cream card flat click" style="padding:9px 12px" data-act="go" data-to="/route/' + r.id + '"><div class="row between"><div><b class="fs-13-5">' + esc(r.name) + '</b><div class="fs-11-5 sub">' + PC.routeStats(r).km + ' · 约 ' + PC.routeStats(r).dur + ' · ' + r.stops.length + ' 站</div></div>' + (r.official ? '<span class="tag official">官方优选</span>' : '<span class="tag ghost">我的路线</span>') + '</div></button>').join('') : '<div class="sub">暂无路线收录</div>') + '</div>' +
      '<div class="sec-h">入场规则 <span class="sample">示例，非核验结果</span></div>' + p.rules.map(r => '<div class="rule"><span class="ico ' + (r[2] === 'ok' ? '' : 'warn') + '">' + ic(r[2] === 'ok' ? 'check' : 'alert', 13, 2.8) + '</span><b>' + r[0] + '</b><span>' + esc(r[1]) + '</span></div>').join('') +
      '<div class="fs-12 sub mt8">核验日期、来源：<b>示例 · 待核实</b>' + (fbs.length ? ' · 你已反馈 ' + fbs.length + ' 次' : '') + ' · <button class="u" data-act="ruleFb" data-id="' + id + '">规则不对？点这里反馈</button></div>' +
      '<div class="row gap6 wrap mt12">' + p.facilities.map(f => '<span class="chip soft sm">' + f + '</span>').join('') + '</div>' +
      '<div class="sec-h">宠主评价 <button class="chip sm ' + (small ? 'sel' : '') + '" data-act="toggleSmall">只看小型犬</button></div>' +
      (list.length ? list.map(r => '<div class="card flat mt8" style="padding:10px 12px"><div class="row between"><div><b class="fs-13-5">' + esc(r.u) + '</b> <span class="fs-11-5 sub">' + esc(r.pet) + '</span></div><span class="h-18 fs-10 tag ghost">' + r.tag + '</span></div><div class="fs-13 mt-4">' + esc(r.t) + '（示例评价）</div></div>').join('') : '<div class="empty">暂无评价</div>');
    const actions = '<button class="bg-page no-shadow flex-none circ-btn" style="border:1.5px solid #262626" data-act="fav" data-id="' + id + '" aria-label="' + (fav ? '取消收藏' : '收藏') + '" aria-pressed="' + fav + '">' + '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="' + (fav ? '#c0392b' : 'none') + '" stroke="' + (fav ? '#c0392b' : 'currentColor') + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + PC.ICONS.heart + '</svg></button><button class="btn prim" data-act="addToRoute" data-id="' + id + '">' + ic('plus', 16, 2.6) + '加入我的路线</button>';
    return {
      mode: 'map', nav: 'map', tab: null, title: p.name, fab: 'p2', snap: 'half', fabTop: 70, insetTop: 70, ctlTop: 70,
      overlay: '<button class="circ-btn mapback" data-act="back" data-to="/map" aria-label="返回">' + ic('left', 20, 2) + '</button>', panel, actions,
      map: { markers: Object.values(PC.POIS).map(q => ({ x: q.x, y: q.y, cls: 'pin cat-' + PC.catOf(q)[0] + (q.id === id ? ' sel' : ' dim') + (q.rest ? ' rest' : ''), html: PC.catIcon(q, q.id === id ? 20 : 15), act: 'pickPlace', data: 'data-id="' + q.id + '"', label: q.name, z: q.id === id ? 9 : 2 })), fit: [p.x - 180, p.y - 150, p.x + 180, p.y + 150], fitKey: 'place' + id },
    };
  });
  ACT.toggleSmall = () => { PC.ui.onlySmall = !PC.ui.onlySmall; PC.refresh(); };
  ACT.fav = el => {
    const id = el.dataset.id, i = S.favs.indexOf(id);
    if (i >= 0) S.favs.splice(i, 1); else S.favs.push(id);
    PC.save(); PC.refresh(); PC.toast(i >= 0 ? '已取消收藏' : '已收藏（保存在本机）');
  };
  ACT.ruleFb = el => {
    const id = el.dataset.id;
    PC.modal(() => PC.sheetTitle('规则和页面写的不一样？', PC.poi(id).name) + '<div class="opts">' + ['牵绳要求', '体型限制', '禁入区', '已关闭', '其他'].map(r => '<button class="chip" data-act="fbSend" data-id="' + id + '" data-r="' + r + '">' + r + '</button>').join('') + '</div><p class="fs-11-5 sub mt12">示例：反馈只记录在本机，不会提交给任何人。</p>', { cls: 'small' });
  };
  ACT.fbSend = el => {
    S.feedback.unshift({ pid: el.dataset.id, reason: el.dataset.r, src: '点位页', time: '刚刚' }); PC.save();
    PC.closeModal(true); PC.toast('已记录反馈：' + el.dataset.r + '（示例，不会提交）'); PC.refresh();
  };
  ACT.addToRoute = el => {
    const p = PC.poi(el.dataset.id);
    if (!S.draft) S.draft = { id: 'draft', name: '我的新路线', official: false, district: p.district, start: 600, tags: ['我的路线'], stops: [] };
    if (S.draft.stops.some(s => s.pid === p.id)) PC.toast('这一站已经在路线里了');
    else { S.draft.stops.push({ pid: p.id, dwell: p.dwell }); PC.toast('已加入「' + S.draft.name + '」'); }
    PC.save(); PC.go('/edit/draft');
  };

  /* ---------- P3 路线列表 ---------- */
  PC.route('/routes', () => routesPage('official'));
  PC.route('/routes/:tab', p => routesPage(p.tab));
  function routesPage(tab) {
    const F = PC.ui.rf || (PC.ui.rf = { area: '全部', dur: '全部', size: '全部' });
    let list = tab === 'mine' ? S.myRoutes.slice() : Object.values(PC.ROUTES);
    list = list.filter(r => {
      const st = PC.routeStats(r);
      if (F.area !== '全部' && r.district !== F.area) return false;
      if (F.dur === '≤ 1.5 小时' && st.pl.total > 90) return false;
      if (F.dur === '≥ 2 小时' && st.pl.total < 120) return false;
      if (F.size !== '全部' && r.stops.some(s => PC.poi(s.pid).maxSize < PC.SIZE_RANK[F.size])) return false;
      return true;
    });
    const LBL = { area: '区域', dur: '时长', size: '体型' };
    const sel = (k, arr) => '<label class="chip selchip">' + LBL[k] + '：<select data-input="rf" data-k="' + k + '" aria-label="' + LBL[k] + '">' + arr.map(v => '<option ' + (F[k] === v ? 'selected' : '') + '>' + v + '</option>').join('') + '</select></label>';
    const dr = S.draft ? '<div class="no-shadow card mt12 row gap10" style="border:1.5px dashed var(--muted)"><div class="grow"><b>草稿 · ' + esc(S.draft.name) + '</b><div class="sub">' + S.draft.stops.length + ' 站 · 未保存</div></div><button class="btn sm sec" data-act="go" data-to="/edit/draft">继续编辑</button></div>' : '';
    return {
      mode: 'page', nav: 'map', tab: '', title: '路线', pageClass: 'mid', fab: null,
      page: V.phead('路线', { back: '/map' }) + '<div class="seg" role="tablist"><button class="' + (tab !== 'mine' ? 'on' : '') + '" data-act="go" data-to="/routes" data-replace="1" role="tab">官方优选</button><button class="' + (tab === 'mine' ? 'on' : '') + '" data-act="go" data-to="/routes/mine" data-replace="1" role="tab">我的路线</button></div>' +
        '<div class="row gap8 mt12 wrap">' + sel('area', ['全部'].concat(PC.DEMO_DISTRICTS)) + sel('dur', ['全部', '≤ 1.5 小时', '≥ 2 小时']) + sel('size', ['全部', '小型', '中型', '大型']) + '</div>' + (tab === 'mine' ? dr : '') +
        '<p class="fs-11-5 sub mt8">路线与距离、时间均为示例估算（直线距离 × 系数），不代表真实步行。</p>' +
        '<div class="d-grid gap-12 rlist mt12" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">' + (list.length ? list.map(r => { const c = V.routeCard(r).replace('rcard', 'rcard wide'); return c.replace('<div class="row gap4 wrap">', '<div class="row gap4 wrap">' + r.tags.map(t => '<span class="chip tiny">' + t + '</span>').join('')); }).join('') : '<div class="empty">' + (tab === 'mine' ? '还没有路线，点「帮我排一条路线」试试' : '没有符合筛选的路线') + '</div>') + '</div>' +
        '<div class="pos-sticky bottom-12 mt20"><button class="btn prim block" data-act="go" data-to="/plan">' + ic('sparkle', 16, 2) + '帮我排一条路线</button></div>',
    };
  }
  INPUT.rf = el => { PC.ui.rf[el.dataset.k] = el.value; PC.refresh(); };

  /* ---------- P4 帮我排路线 ---------- */
  PC.route('/plan', () => {
    const A = PC.ui.plan || (PC.ui.plan = { district: '西九龙', dur: '2 小时', acts: ['散步', '喝咖啡'], pets: [S.petId] });
    A.pets = A.pets.filter(id => S.pets.some(p => p.id === id)); if (!A.pets.length) A.pets = [S.petId];
    const one = (k, arr) => '<div class="opts">' + arr.map(v => '<button class="chip ' + (A[k] === v ? 'sel' : '') + '" data-act="planOne" data-k="' + k + '" data-v="' + v + '">' + v + '</button>').join('') + '</div>';
    const step = (n, t, sub, body) => '<div class="mt16"><div class="mb-8 row gap8"><span class="num">' + n + '</span><b>' + t + '</b>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>' + body + '</div>';
    return {
      mode: 'page', nav: 'map', tab: '', title: '帮我排路线', pageClass: 'narrow', fab: null,
      page: V.phead('帮我排路线', { back: '/map' }) + '<div class="ai-s row gap10"><span class="w-54 h-54 bg-cream thumb t1" style="border-radius:50%">' + PC.dog(44) + '</span><div class="mt-4 card" style="border-radius:16px 16px 16px 4px">点几下就好，我来帮你排一条适合 ' + esc(PC.pet().name) + ' 的路线。<div class="fs-11-5 mt-2 sub">AI 辅助（示例）：演示版用预设规则排路线，不调用真实 AI。</div></div></div>' +
        step(1, '去哪里', '', one('district', PC.DISTRICTS)) + (PC.DEMO_DISTRICTS.indexOf(A.district) < 0 ? '<div class="callout sage mt8">' + ic('info', 14, 2) + '<span>示例：「' + A.district + '」暂无示例点位，将用附近的「' + PC.planDistrict(A.district) + '」演示。</span></div>' : '') +
        step(2, '玩多久', '', one('dur', ['1 小时', '2 小时', '半天'])) +
        step(3, '想做什么', '可多选', '<div class="opts">' + ['散步', '喝咖啡', '买用品', '洗护', '交朋友'].map(v => '<button class="chip ' + (A.acts.indexOf(v) >= 0 ? 'sel' : '') + '" data-act="planAct" data-v="' + v + '">' + v + '</button>').join('') + '</div>') +
        step(4, '带谁出门', '', '<div class="opts">' + S.pets.map(p => '<button class="chip ' + (A.pets.indexOf(p.id) >= 0 ? 'sel' : '') + '" data-act="planPet" data-id="' + p.id + '">' + V.petLabel(p) + '</button>').join('') + '<button class="chip" data-act="addPet" style="border-style:dashed">' + ic('plus', 13, 2.4) + '其他宠物</button></div>') +
        '<div class="callout soft mt16" style="border:1px solid var(--line)">' + ic('info', 14, 2) + '<span>会自动避开不让 ' + esc(PC.sizeLabel(PC.pet())) + '进入的地方；路线由示例规则生成，可在下一步修改。</span></div>' +
        '<div class="mt20"><button class="btn prim block" data-act="planGo">' + ic('sparkle', 16, 2) + '生成路线</button></div><div class="center mt12"><button class="u sub" data-act="planManual">不用 AI，自己在地图上点选</button></div>',
    };
  });
  ACT.planOne = el => { PC.ui.plan[el.dataset.k] = el.dataset.v; PC.refresh(); };
  ACT.planAct = el => { const a = PC.ui.plan.acts, i = a.indexOf(el.dataset.v); if (i >= 0) a.splice(i, 1); else a.push(el.dataset.v); PC.refresh(); };
  ACT.planPet = el => { const a = PC.ui.plan.pets, i = a.indexOf(el.dataset.id); if (i >= 0 && a.length > 1) a.splice(i, 1); else if (i < 0) a.push(el.dataset.id); PC.refresh(); };
  ACT.planManual = () => {
    S.draft = { id: 'draft', name: '我的新路线', official: false, district: '西九龙', start: 600, tags: ['我的路线'], stops: [] };
    PC.save(); PC.go('/edit/draft');
  };
  function nearestOrder(items, from) {
    const out = [], rest = items.slice();
    let cur = from;
    while (rest.length) {
      let bi = 0, bd = 1e12;
      rest.forEach((p, i) => { const d = cur ? Math.hypot(p.x - cur.x, p.y - cur.y) : p.x; if (d < bd) { bd = d; bi = i; } });
      cur = rest.splice(bi, 1)[0]; out.push(cur);
    }
    return out;
  }
  PC.nearestOrder = nearestOrder;
  /* AI 排路线（示例规则，没有调用真实 AI）：
     1. 候选池：按宠物体型过滤，只用所选区域的点；不足 3 个时，只从同一侧（九龙 / 港岛）离该区最近的点补，不跨海
     2. 按所选活动各挑一个点：优先本区、离上一站近、上午就开门的；本区没有就找同侧 1.2 km 内的；都没有就记下来提示用户
     3. 不足两站补户外 / 餐饮点（再不够才补店铺），按就近顺序排好；超出时长预算去掉末站，太短再补站（最多 5 站）
     4. 按营业时间 / 预约时段找最早可行的出发时间（10:00 起，每 15 分钟试一次）；实在排不开就去掉冲突的站 */
  const WANT = { '散步': p => p.type === '户外', '喝咖啡': p => p.type === '餐饮', '买用品': p => p.type === '店铺', '洗护': p => p.type === '医疗美容', '交朋友': p => ['p6', 'p8', 'p14', 'p16'].indexOf(p.id) >= 0 };
  const BUDGET = { '1 小时': 60, '2 小时': 120, '半天': 240 };
  const ISLAND = ['中西区', '湾仔', '东区'];
  const side = d => ISLAND.indexOf(d) >= 0 ? '港岛' : '九龙';
  // 没有示例点位的区：用同一侧（九龙 / 港岛）的示例区代替
  PC.planDistrict = d => PC.DEMO_DISTRICTS.indexOf(d) >= 0 ? d : (side(d) === '港岛' ? '湾仔' : '油尖旺');
  const NEAR_R = 1200, DAY0 = 600, LATEST = 1140;
  const toStop = p => ({ pid: p.id, dwell: p.dwell });
  const centerOf = ps => ({ x: ps.reduce((n, p) => n + p.x, 0) / ps.length, y: ps.reduce((n, p) => n + p.y, 0) / ps.length });
  // 上午 10:30 后才开门的点加一点「距离惩罚」，让默认上午出发的路线少排傍晚才开的店
  const cost = (ref, p) => (ref ? PC.dist(ref, p) : p.x * PC.MPU) + (p.hours && p.hours[0] > DAY0 + 30 ? 1000 : 0);
  const nearestTo = (ref, list) => list.slice().sort((a, b) => cost(ref, a) - cost(ref, b))[0];
  function areaOf(rank, district) {
    const all = Object.values(PC.POIS).filter(p => !p.rest && p.maxSize >= rank);
    if (!district) return { pool: all, near: [], center: null };
    const center = centerOf(Object.values(PC.POIS).filter(p => p.district === district));
    const same = all.filter(p => p.district !== district && side(p.district) === side(district)).sort((a, b) => PC.dist(center, a) - PC.dist(center, b));
    let pool = all.filter(p => p.district === district);
    if (pool.length < 3) pool = pool.concat(same.slice(0, 3 - pool.length));
    return { district, pool, near: same.filter(p => pool.indexOf(p) < 0 && PC.dist(center, p) <= NEAR_R), center };
  }
  function pickByActivity(A, acts, info) {
    const chosen = [];
    acts.forEach(act => {
      const ok = q => WANT[act](q) && chosen.indexOf(q) < 0, ref = chosen[chosen.length - 1] || A.center;   // 第一站：离所选区域中心最近
      let p = nearestTo(ref, A.pool.filter(ok));
      if (!p && A.near.length) { p = nearestTo(ref, A.near.filter(ok)); if (p) info.borrowed.push([act, p]); }
      if (p) chosen.push(p); else info.unmet.push(act);
    });
    return chosen;
  }
  // 补站：先找户外 / 餐饮，再找店铺；默认要在末站 1.2 km 内（凑够 2 站时放宽到 2 km，候选池已限定同一侧，不会跨海）
  function nextFiller(A, chosen, r) {
    const ref = chosen[chosen.length - 1] || A.center, list = A.pool.concat(A.near).filter(q => chosen.indexOf(q) < 0 && (!ref || PC.dist(ref, q) < (r || NEAR_R)));
    const best = l => l.slice().sort((x, y) => cost(ref, x) + (x.district !== A.district ? 600 : 0) - cost(ref, y) - (y.district !== A.district ? 600 : 0))[0];   // 同区优先
    return best(list.filter(q => q.type === '户外' || q.type === '餐饮')) || best(list.filter(q => q.type === '店铺')) || null;
  }
  const timeWarns = (stops, st) => PC.issues(stops, st, null).filter(x => x.kind === 'time' && x.level === 'warn');
  function fitStart(stops) {
    for (let st = DAY0; st <= LATEST; st += 15) if (!timeWarns(stops, st).length) return st;
    return null;
  }
  function genRoute(a) {
    const pets = a.pets.map(id => S.pets.find(p => p.id === id)).filter(Boolean);
    const rank = Math.max.apply(null, [1].concat(pets.map(p => PC.SIZE_RANK[p.size])));
    const dist = PC.planDistrict(a.district), stand = dist !== a.district;
    const A = areaOf(rank, dist), info = { borrowed: [], unmet: [], dropped: [] };
    const budget = BUDGET[a.dur] || 120;
    const chosen = pickByActivity(A, a.acts.length ? a.acts : ['散步', '喝咖啡'], info);
    while (chosen.length < 2) { const p = nextFiller(A, chosen, 2000); if (!p) break; chosen.push(p); }
    let stops = PC.nearestOrder(chosen).map(toStop);
    while (PC.plan(stops).total > budget * 1.2 && stops.length > 2) stops.pop();
    while (PC.plan(stops).total < budget * 0.75 && stops.length < 5) {
      const p = nextFiller(A, stops.map(s => PC.poi(s.pid)));
      if (!p) break;
      const more = stops.concat(toStop(p));
      if (PC.plan(more).total > budget * 1.3) break;
      stops = more;
    }
    // 营业时间：找最早可行的出发时间；排不开就去掉最先冲突的站再试
    let start = fitStart(stops);
    while (start == null && stops.length > 2) {
      const w = timeWarns(stops, DAY0)[0];
      info.dropped.push(PC.poi(stops[w.i].pid)); stops.splice(w.i, 1);
      start = fitStart(stops);
    }
    if (start == null) start = DAY0;
    const area = dist;
    const total = PC.plan(stops, start).total;
    const nm = p => short(p.name);
    const note = (stand ? ['「' + a.district + '」暂无示例点位，先用同在' + side(a.district) + '的' + dist + '演示。'] : []).concat(['已按 ' + (pets.map(p => p.name).join('、') || '宠物') + ' 的体型避开不适合的地点，按就近顺序排了 ' + stops.length + ' 站，约 ' + PC.fmtDur(total) + '（含停留）。'])
      .concat(start !== DAY0 ? ['按各站营业 / 预约时间，出发时间调到 ' + PC.fmtClock(start) + '。'] : [])
      .concat(info.borrowed.map(b => '「' + b[0] + '」本区暂无合适的示例点，已选附近的' + nm(b[1]) + '（' + b[1].district + '）。'))
      .concat(info.unmet.length ? ['「' + info.unmet.join('」「') + '」附近暂无合适的示例点，已略过。'] : [])
      .concat(info.dropped.length ? [info.dropped.map(nm).join('、') + ' 营业时间排不开，已去掉。'] : [])
      .concat(total < budget * 0.6 ? ['示例点位有限，路线比「' + a.dur + '」短，可以再「添加一站」。'] : [])
      .concat(['（示例规则，未调用真实 AI）']);
    return { id: 'draft', name: 'AI 排的路线 · ' + area + ' ' + a.dur, official: false, district: area, start, tags: ['AI 辅助（示例）'], stops, aiNote: note.join('') };
  }
  PC.genRoute = genRoute;   // 方便在控制台测试
  const short = n => n.replace(/（示例）|（[^）]*，示例）/, '');
  ACT.planGo = () => {
    PC.modal(() => '<div class="py-14 dlg center"><div class="spin"></div><div class="b mt16">AI 正在排路线…</div><div class="sub mt4">示例：用预设规则生成，未调用真实 AI</div></div>', { cls: 'small' });
    setTimeout(() => {
      if (PC.cur.path !== '/plan') return;
      S.draft = genRoute(PC.ui.plan); PC.save(); PC.closeModal(true);
      PC.go('/edit/draft');
      PC.toast('已排好 ' + S.draft.stops.length + ' 站，可以继续调整');
    }, 1300);
  };

  /* ---------- P5 路线编辑 ---------- */
  PC.route('/edit/:id', ({ id }) => {
    if (!S.draft || (id !== 'draft' && S.draft.id !== id)) {
      const src = PC.getRoute(id);
      if (!src) return { mode: 'page', page: '<div class="empty">没有这条路线</div>' };
      S.draft = JSON.parse(JSON.stringify(src)); S.draft.origin = src.official ? null : src.id; S.draft.id = 'draft'; S.draft.official = false; PC.save();
    }
    const d = S.draft, pet = PC.pet();
    const pl = PC.plan(d.stops, d.start), iss = PC.issues(d.stops, d.start, pet);
    const warns = iss.filter(i => i.level === 'warn');
    const rows = d.stops.map((s, i) => {
      const p = PC.poi(s.pid), my = iss.filter(x => x.i === i);
      return '<div class="card flat mt8" style="padding:10px 12px"><div class="row gap10"><span class="num">' + (i + 1) + '</span><div class="fs-14-5 b grow" style="min-width:0">' + esc(p.name) + '</div>' +
        '<div class="row gap6"><button class="circ-btn sq" data-act="edMove" data-i="' + i + '" data-d="-1" aria-label="上移" ' + (i === 0 ? 'disabled style="opacity:.35"' : '') + '>' + ic('up', 16, 2) + '</button><button class="circ-btn sq" data-act="edMove" data-i="' + i + '" data-d="1" aria-label="下移" ' + (i === d.stops.length - 1 ? 'disabled style="opacity:.35"' : '') + '>' + ic('down', 16, 2) + '</button><button class="circ-btn sq" data-act="edDel" data-i="' + i + '" aria-label="移除">' + ic('x', 16, 2) + '</button></div></div>' +
        '<div class="fs-12 pl-38 row gap8 mt8 wrap"><span class="muted nowrap">停留</span><div class="qty"><button data-act="edStep" data-i="' + i + '" data-d="-10" aria-label="减少 10 分钟">' + ic('minus', 12, 2.6) + '</button><span class="minw-48 ta-c">' + s.dwell + ' 分钟</span><button data-act="edStep" data-i="' + i + '" data-d="10" aria-label="增加 10 分钟">' + ic('plus', 12, 2.6) + '</button></div><span class="muted nowrap">预计 ' + PC.fmtClock(pl.arr[i]) + ' 到</span></div>' +
        (my.length ? '<div class="row gap6 wrap mt8">' + my.map(m => '<span class="minh-20 tag ' + (m.level === 'warn' ? 'official' : 'ghost') + '" style="height:auto;padding:2px 9px;white-space:normal">' + (m.level === 'warn' ? '! ' : '') + esc(m.text) + '</span>').join('') + '</div>' : '') + '</div>';
    }).join('');
    const panel = '<div class="ai-e row between"><h1 class="fs-20 h2" id="main-h">编辑路线</h1><span class="ta-r sub" id="edSum">约 ' + PC.fmtDist(pl.totalM) + ' · ' + PC.fmtDur(pl.total) + '</span></div>' +
      '<input class="field mt8" data-input="edName" value="' + esc(d.name) + '" maxlength="24" aria-label="路线名称" placeholder="路线名称">' +
      (d.aiNote ? '<div class="callout sage mt8">' + ic('sparkle', 14, 2) + '<span>' + esc(d.aiNote) + ' 点箭头可调整顺序。</span></div>' : '') +
      (warns.length ? '<div class="callout alert mt8">' + ic('alert', 14, 2.2) + '<span>有 ' + warns.length + ' 处规则 / 时间冲突提示（按 ' + esc(pet.name) + ' · ' + PC.sizeLabel(pet) + '估算，示例规则）。</span></div>' : (d.stops.length ? '<div class="callout sage mt8">' + ic('check', 14, 2.6) + '<span>暂未发现规则冲突（示例规则，出发前请以现场为准）。</span></div>' : '')) +
      (rows || '<div class="empty">还没有站点，点下面的「添加一站」</div>') +
      '<div class="row gap8 mt12 wrap"><button class="chip" data-act="edAdd" data-tab="fav" style="border-style:dashed">' + ic('plus', 13, 2.4) + '添加一站</button><button class="chip sm soft" data-act="edAdd" data-tab="fav">从收藏</button><button class="chip sm soft" data-act="edAdd" data-tab="near">附近推荐</button></div>';
    const actions = '<button class="btn sec" style="flex:.7" data-act="edCancel">放弃</button><button class="btn prim" style="flex:1.3" data-act="edSave">保存并查看路线</button>';
    return {
      mode: 'map', nav: 'map', tab: null, title: '路线编辑', fab: null, snap: 'half', insetTop: 70, ctlTop: 70,
      overlay: '<button class="circ-btn mapback" data-act="edBack" aria-label="返回">' + ic('left', 20, 2) + '</button>', panel, actions,
      map: V.routeMap(d.stops, { key: 'edit' + d.stops.length }),
    };
  });
  INPUT.edName = el => { S.draft.name = el.value; PC.save(); };
  ACT.edBack = () => PC.back('/routes/mine');
  ACT.edCancel = () => PC.confirm('放弃这次编辑？草稿会被清除。', () => { S.draft = null; PC.save(); PC.go('/routes/mine', { replace: true }); }, '放弃');
  ACT.edStep = el => { const s = S.draft.stops[+el.dataset.i]; s.dwell = Math.max(10, Math.min(120, s.dwell + +el.dataset.d)); PC.save(); PC.refresh(); };
  ACT.edMove = el => { const a = S.draft.stops, i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; PC.save(); PC.refresh(); };
  ACT.edDel = el => { S.draft.stops.splice(+el.dataset.i, 1); PC.save(); PC.refresh(); };
  ACT.edAdd = el => { PC.ui.pickTab = el.dataset.tab || 'fav'; PC.modal(pickerHtml, { cls: 'wide' }); };
  function pickerHtml() {
    const d = S.draft, have = d.stops.map(s => s.pid), last = d.stops.length ? PC.poi(d.stops[d.stops.length - 1].pid) : PC.USER;
    let list = Object.values(PC.POIS).filter(p => !p.rest && have.indexOf(p.id) < 0);
    if (PC.ui.pickTab === 'fav') list = list.filter(p => S.favs.indexOf(p.id) >= 0);
    else list.sort((a, b) => PC.dist(last, a) - PC.dist(last, b));
    return PC.sheetTitle('添加一站', '示例地点 · 按距离排序') + '<div class="seg"><button class="' + (PC.ui.pickTab === 'fav' ? 'on' : '') + '" data-act="pickTab" data-tab="fav">从收藏</button><button class="' + (PC.ui.pickTab === 'near' ? 'on' : '') + '" data-act="pickTab" data-tab="near">附近推荐</button></div><div class="mt8">' +
      (list.length ? list.map(p => '<button class="poirow" data-act="edPick" data-id="' + p.id + '"><span class="grow"><b class="fs-14">' + esc(p.name) + '</b><span class="d-block fs-11-5 sub">' + p.type + ' · ' + p.hoursTxt + ' · 距上一站 ' + PC.fmtDist(PC.dist(last, p)) + '</span></span><span class="tag dark">添加</span></button>').join('') : '<div class="empty">收藏里没有可添加的地点，试试「附近推荐」</div>') + '</div>';
  }
  ACT.pickTab = el => { PC.ui.pickTab = el.dataset.tab; PC.modalUpdate(); };
  ACT.edPick = el => { const p = PC.poi(el.dataset.id); S.draft.stops.push({ pid: p.id, dwell: p.dwell }); PC.save(); PC.closeModal(true); PC.refresh(); };
  ACT.edSave = () => {
    const d = S.draft;
    if (d.stops.length < 2) { PC.toast('至少需要 2 站才能保存路线'); return; }
    d.name = (d.name || '').trim() || '我的新路线';
    const copy = JSON.parse(JSON.stringify(d));
    if (d.origin) { copy.id = d.origin; const i = S.myRoutes.findIndex(r => r.id === d.origin); if (i >= 0) S.myRoutes[i] = copy; else S.myRoutes.push(copy); }
    else { copy.id = 'm' + (++S.routeSeq); S.myRoutes.push(copy); }
    delete copy.origin; delete copy.aiNote;
    S.draft = null; PC.save();
    PC.toast('路线已保存到「我的路线」');
    PC.go('/route/' + copy.id, { replace: true });
  };

  /* ---------- P6 路线详情 ---------- */
  PC.route('/route/:id', ({ id }) => {
    const r = PC.getRoute(id);
    if (!r) return { mode: 'page', page: '<div class="empty">没有这条路线</div>', nav: 'map' };
    const pet = PC.pet(), st = PC.routeStats(r), iss = PC.issues(r.stops, r.start, pet);
    const carry = r.stops.map((s, i) => PC.poi(s.pid).carry ? i + 1 : 0).filter(Boolean);
    const warnN = iss.filter(i => i.level === 'warn').length;
    const trip = S.trip && !S.trip.ended && S.trip.routeId === id;
    const rows = r.stops.map((s, i) => {
      const p = PC.poi(s.pid), my = iss.filter(x => x.i === i);
      const tg = p.reserve ? '<span class="chip tiny" style="background:#fdeccf">需预约</span>' : p.carry ? '<span class="chip tiny" style="background:#fdeccf">需抱着</span>' : '';
      return '<div class="tlrow"><span class="num">' + (i + 1) + '</span><div class="grow"><div class="row gap6"><button class="fs-14-5 ta-l b" data-act="go" data-to="/place/' + p.id + '">' + esc(p.name) + '</button>' + tg + '</div><div class="fs-11-5 sub">' + PC.fmtClock(st.pl.arr[i]) + ' · ' + (i ? '步行 ' + st.pl.walk[i] + ' 分钟 · ' : '') + esc(p.rules[0][1]) + '</div>' +
        (my.filter(m => m.level === 'warn').map(m => '<div class="fs-11-5 mt-2 sub" style="color:#a3561a">! ' + esc(m.text) + '</div>').join('')) + '</div><button class="btn xs sec" data-act="navStop" data-id="' + p.id + '">' + ic('nav', 12, 2) + '去这里</button></div>';
    }).join('');
    const panel = '<div class="row gap6"><span class="tag ' + (r.official ? 'official' : 'ghost') + '">' + (r.official ? '官方优选' : '我的路线') + '</span><span class="sub">示例数据</span></div><h1 class="h1 mt4" id="main-h">' + esc(r.name) + '</h1>' +
      '<div class="statbar mt12"><div><b>' + st.kmNum + '</b><span>公里（估算）</span></div><div><b>' + PC.fmtDur(st.pl.total).replace(' ', '') + '</b><span>含停留</span></div><div><b>' + st.n + '</b><span>站</span></div></div>' +
      (carry.length ? '<div class="callout warn mt12">' + ic('alert', 14, 2.2) + '<span>第 ' + carry.join('、') + ' 站需抱着或使用推车（示例规则）</span></div>' : '') +
      (warnN ? '<div class="callout alert mt8">' + ic('alert', 14, 2.2) + '<span>按 ' + esc(pet.name) + ' · ' + PC.sizeLabel(pet) + '估算，有 ' + warnN + ' 处冲突提示，建议先编辑路线。</span></div>' : '') +
      '<div class="mt8">' + rows + '</div>' +
      '<button class="w-full ta-l ai-c callout soft mt8" data-act="go" data-to="/trip/summary?route=' + id + '">' + ic('flag', 15, 2) + '<span class="grow">走完了？写评价、分享到社区</span>' + ic('right', 15, 2) + '</button><p class="fs-11-5 sub mt8">时间、距离、规则均为示例估算，非核验信息。</p>';
    const actions = r.official ? '<button class="btn sec" data-act="copyRoute" data-id="' + id + '">复制后修改</button>' : '<button class="btn sec" data-act="editRoute" data-id="' + id + '">编辑</button>';
    return {
      mode: 'map', nav: 'map', tab: null, title: r.name, fab: 'p6', fabRoute: id, snap: 'half', insetTop: 70, ctlTop: 70,
      overlay: '<button class="circ-btn mapback" data-act="back" data-to="/routes" aria-label="返回">' + ic('left', 20, 2) + '</button>', panel,
      actions: actions + (trip ? '<button class="btn prim" data-act="go" data-to="/trip">继续行程</button>' : '<button class="btn prim" data-act="startRoute" data-id="' + id + '">开始路线</button>'),
      map: V.routeMap(r.stops, { key: 'route' + id }),
    };
  });
  ACT.copyRoute = el => {
    const r = PC.getRoute(el.dataset.id);
    S.draft = JSON.parse(JSON.stringify(r)); S.draft.id = 'draft'; S.draft.origin = null; S.draft.official = false; S.draft.name = r.name + '（我的副本）'; S.draft.tags = ['复制自官方（示例）'];
    PC.save(); PC.go('/edit/draft'); PC.toast('已复制为草稿，可以随意修改');
  };
  ACT.editRoute = el => {
    const r = PC.getRoute(el.dataset.id);
    S.draft = JSON.parse(JSON.stringify(r)); S.draft.origin = r.id; S.draft.id = 'draft'; PC.save(); PC.go('/edit/draft');
  };
  ACT.startRoute = el => {
    const go = () => PC.go('/route/' + el.dataset.id + '/start');
    if (S.trip && !S.trip.ended && S.trip.routeId !== el.dataset.id) PC.confirm('已有一条进行中的行程（同时只能有 1 条）。结束它并开始新的路线？', () => { PC.finishTrip(true); go(); }, '结束旧行程');
    else go();
  };
  ACT.navStop = el => {
    const p = PC.poi(el.dataset.id);
    PC.modal(() => PC.sheetTitle('导航（模拟）', p.name) + navBody(p.name, PC.dist(PC.USER, p)) + '<button class="btn prim block mt16" data-act="closeModal">返回 PetCity</button>', { cls: 'small' });
  };
  function navBody(name, m) {
    return '<div class="callout sage"><span>' + ic('nav', 16, 2) + '</span><span>示例：正式版会在这里跳出到地图 App 导航。演示版不使用真实定位或导航。</span></div><div class="card flat mt12 row gap10"><span class="num">' + ic('walk', 15, 2) + '</span><div class="grow"><b>步行约 ' + PC.walkMin(m) + ' 分钟 · ' + PC.fmtDist(m) + '</b><div class="sub">目的地：' + esc(name) + '</div></div>' + V.sample('示例，非真实', 0) + '</div>';
  }

  /* ---------- P7 怎么去起点 / P7a 到起点了吗 ---------- */
  PC.route('/route/:id/start', ({ id }) => {
    const r = PC.getRoute(id), p0 = PC.poi(r.stops[0].pid), m = PC.dist(PC.USER, p0);
    const opt = (ico, t, s, act, extra) => '<button class="w-full ta-l minh-64 card click mt12 row gap12" data-act="' + act + '" data-id="' + id + '"><span class="bg-cream no-shadow circ-btn">' + ic(ico, 20, 1.8) + '</span><span class="grow"><b class="fs-15">' + t + '</b><span class="d-block sub">' + s + '</span></span>' + ic('right', 18, 2) + '</button>' + (extra || '');
    const taxi = PC.ui.taxiOpen ? '<div class="card flat mt8" style="background:var(--sagesoft)"><div class="row between"><b class="fs-13">可以带宠物的叫车方式</b>' + V.sample('示例 · 待核实') + '</div>' + PC.TAXIS.map(t => '<button class="poirow" style="padding:9px 6px" data-act="taxiPick" data-id="' + id + '" data-t="' + t.id + '"><span class="grow"><b class="fs-13-5">' + t.name + '</b><span class="d-block fs-11 sub">' + t.sub + '</span></span><span class="tag dark">选择</span></button>').join('') +
      '<button class="chip sm mt8" data-act="copyAddr" data-id="' + id + '">' + ic('send', 12, 2) + '复制起点地址</button></div>' : '';
    const panel = '<div class="ai-s row between"><div><h1 class="h1" id="main-h">怎么去起点？</h1><div class="sub mt4">起点：' + esc(p0.name) + ' · 距你约 ' + PC.fmtDist(m) + '（示例位置）</div></div><button class="bg-soft no-shadow circ-btn" data-act="back" data-to="/route/' + id + '" aria-label="关闭">' + ic('x', 16, 2.2) + '</button></div>' +
      opt('nav', '我要导航', '打开地图，步行或公共交通到起点', 'goNav') + opt('car', '我要打车', '选择可以带宠物的叫车方式（示例）', 'toggleTaxi', taxi) + opt('walk', '我已在起点', '直接看第一站', 'atStart') +
      '<p class="fs-11-5 sub center mt16">路线上每一站都能再点「去这里」选择导航或打车。导航与打车均为模拟，不会调用真实服务。</p>';
    return { mode: 'map', nav: 'map', tab: null, title: '怎么去起点', fab: null, snap: 'half', halfRatio: .62, insetTop: 70, ctlTop: 70, overlay: '<button class="circ-btn mapback" data-act="back" data-to="/route/' + id + '" aria-label="返回">' + ic('left', 20, 2) + '</button>', panel, map: V.routeMap(r.stops, { key: 'route' + id }) };
  });
  ACT.toggleTaxi = () => { PC.ui.taxiOpen = !PC.ui.taxiOpen; PC.refresh(); };
  ACT.goNav = el => {
    const r = PC.getRoute(el.dataset.id), p0 = PC.poi(r.stops[0].pid);
    PC.modal(() => PC.sheetTitle('导航到起点（模拟）', p0.name) + navBody(p0.name, PC.dist(PC.USER, p0)) + '<button class="btn prim block mt16" id="navBack">我走到了，返回 PetCity</button>', { cls: 'small' });
    $('#navBack').onclick = () => { PC.closeModal(true); S.arriveMode = '导航'; PC.go('/route/' + el.dataset.id + '/arrive'); };
  };
  ACT.copyAddr = el => {
    const p0 = PC.poi(PC.getRoute(el.dataset.id).stops[0].pid), txt = '香港 ' + p0.district + ' ' + p0.name + '（示例地址）';
    try { navigator.clipboard.writeText(txt).then(() => PC.toast('起点地址已复制（示例）'), () => PC.toast('起点：' + txt + '（示例）')); } catch (e) { PC.toast('起点：' + txt + '（示例）'); }
  };
  ACT.taxiPick = el => {
    const r = PC.getRoute(el.dataset.id), p0 = PC.poi(r.stops[0].pid), t = PC.TAXIS.find(x => x.id === el.dataset.t);
    PC.ui.taxi = { step: 0, t, rid: el.dataset.id, p0 };
    PC.modal(taxiHtml, { cls: 'small' });
  };
  function taxiHtml() {
    const tx = PC.ui.taxi, t = tx.t;
    const steps = ['确认', '呼叫中', '已接单'];
    const bar = '<div class="mb-10 prog4">' + steps.map((s, i) => '<div class="s ' + (i <= tx.step ? 'on' : '') + (i === tx.step ? ' cur' : '') + '"><i>' + (i < tx.step ? ic('check', 13, 3) : i + 1) + '</i>' + s + '</div>').join('') + '</div>';
    let body;
    if (tx.step === 0) body = '<div class="card flat"><div class="row between"><b>' + t.name + '</b>' + V.sample('示例，非真实') + '</div><div class="sub mt4">' + t.sub + '</div><div class="hr mt8"></div><div class="row between mt8"><span class="muted">上车点</span><span>当前位置（示例）</span></div><div class="row between mt4"><span class="muted">目的地</span><span>' + esc(tx.p0.name) + '</span></div><div class="row between mt4"><span class="muted">示例估价</span><b>' + t.fare + '（非真实报价）</b></div></div><button class="btn prim block mt16" data-act="taxiNext">呼叫（模拟）</button>';
    else if (tx.step === 1) body = '<div class="py-16 center"><div class="spin"></div><div class="b mt16">正在为你呼叫…</div><div class="sub mt4">模拟中 · 不会联系任何司机或平台</div></div>';
    else body = '<div class="callout sage"><span>' + ic('check', 16, 2.6) + '</span><span><b>司机已接单（模拟）</b><br>示例车牌 ZZ 0000 · 约 ' + t.eta + ' 分钟后到达上车点</span></div><div class="card flat mt12"><div class="sub">温馨提示（示例）：上车前请与司机确认宠物是否可以同乘，并准备好外出包或牵引绳。</div></div><button class="btn prim block mt16" data-act="taxiArrive">模拟：已到达起点</button><div class="center mt8">' + V.sample('示例，非真实叫车') + '</div>';
    return PC.sheetTitle('打车到起点（模拟）', '全部为示例，不会产生真实订单') + bar + body;
  }
  ACT.taxiNext = () => {
    const tx = PC.ui.taxi; tx.step = 1; PC.modalUpdate();
    setTimeout(() => { if (PC.ui.taxi === tx && tx.step === 1) { tx.step = 2; PC.modalUpdate(); } }, 1300);
  };
  ACT.taxiArrive = () => { const rid = PC.ui.taxi.rid; PC.closeModal(true); S.arriveMode = '打车'; PC.go('/route/' + rid + '/arrive'); };
  ACT.atStart = el => PC.startTrip(el.dataset.id);

  PC.route('/route/:id/arrive', ({ id }) => {
    const r = PC.getRoute(id), p0 = PC.poi(r.stops[0].pid), mode = S.arriveMode || '导航';
    const panel = '<div class="ai-s row between"><div><h1 class="h1" id="main-h">到起点了吗？</h1><div class="sub mt4">起点：' + esc(p0.name) + ' · 距你约 80 m（示例）</div></div><button class="bg-soft no-shadow circ-btn" data-act="back" data-to="/route/' + id + '" aria-label="关闭">' + ic('x', 16, 2.2) + '</button></div>' +
      '<div class="ai-c callout sage mt12"><span class="w-30 h-30 no-shadow circ-btn">' + ic(mode === '打车' ? 'car' : 'nav', 15, 2) + '</span><div class="grow"><b class="fs-13">刚才选了「我要' + mode + '」</b><div class="fs-11-5 sub">定位显示你已在起点附近（模拟，演示版不使用真实定位）</div></div><button class="fs-12 nowrap u" data-act="go" data-to="/route/' + id + '/start" data-replace="1">改用' + (mode === '打车' ? '导航' : '打车') + '</button></div>' +
      '<button class="w-full ta-l bg-soft minh-68 card click mt12 row gap12" data-act="atStart" data-id="' + id + '"><span class="bg-prim c-white no-shadow w-42 h-42 circ-btn">' + ic('check', 22, 2.8) + '</span><span class="grow"><b class="fs-16">我到了，开始行程</b><span class="d-block sub">从第 1 站开始，进入行程页</span></span>' + ic('right', 18, 2) + '</button>' +
      '<button class="w-full ta-l minh-64 card click mt12 row gap12" data-act="go" data-to="/route/' + id + '/start" data-replace="1"><span class="bg-cream no-shadow circ-btn">' + ic('walk', 20, 1.8) + '</span><span class="grow"><b class="fs-15">还没到</b><span class="d-block sub">回到上一步，继续导航 / 重新打车</span></span>' + ic('right', 18, 2) + '</button>' +
      '<p class="fs-11-5 sub center mt16">行程开始后，地图首页和「我的」会一直显示进行中的提示。</p>';
    return { mode: 'map', nav: 'map', tab: null, title: '到起点了吗', fab: null, snap: 'half', halfRatio: .62, insetTop: 70, ctlTop: 70, overlay: '', panel, map: V.routeMap(r.stops, { key: 'route' + id }) };
  });
})(window.PC);
