/* 核心：工具、状态、计算、路由 */
(function (PC) {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PC.$ = $; PC.$$ = $$; PC.esc = esc;

  /* HTML 模板：PC.html`<b>${name}</b>`
     - 插进去的值默认转义（用户输入的名字、帖子内容不会破坏页面）
     - 已经是 HTML 的片段（图标、另一个模板）用 PC.raw(...) 包起来，或直接插入另一个 PC.html 的结果
     - 数组自动拼接；null / undefined / false 输出空字符串 */
  function Raw(s) { this.s = s; }
  Raw.prototype.toString = function () { return this.s; };
  const part = v => v == null || v === false ? '' : v instanceof Raw ? v.s : Array.isArray(v) ? v.map(part).join('') : esc(v);
  PC.raw = s => new Raw(s == null ? '' : String(s));
  PC.html = function (strs) {
    let out = strs[0];
    for (let i = 1; i < strs.length; i++) out += part(arguments[i]) + strs[i];
    return new Raw(out);
  };

  PC.ic = function (name, size, sw, cls) {
    size = size || 18; sw = sw || 1.9;
    return '<svg class="ic ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PC.ICONS[name] || '') + '</svg>';
  };
  PC.paw = function (size, color) {
    return '<svg class="ic" width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 24 24" fill="' + (color || 'currentColor') + '" aria-hidden="true"><ellipse cx="12" cy="16.2" rx="5.2" ry="4.2"/><ellipse cx="5.2" cy="10.5" rx="2.1" ry="2.8"/><ellipse cx="9.4" cy="5.8" rx="2.1" ry="2.8"/><ellipse cx="14.6" cy="5.8" rx="2.1" ry="2.8"/><ellipse cx="18.8" cy="10.5" rx="2.1" ry="2.8"/></svg>';
  };
  PC.pawheart = function (size) {
    return '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PC.ICONS.heart + '<circle cx="9.5" cy="10" r="1" fill="currentColor"/><circle cx="14.5" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="13" r="1.2" fill="currentColor"/></svg>';
  };
  PC.dog = function (size, happy) {
    size = size || 60;
    const mouth = happy ? '<path d="M42 70 Q50 80 58 70" fill="#f08a8a" stroke="#262626" stroke-width="2"/>' : '<path d="M44 70 Q50 75 56 70" fill="none" stroke="#262626" stroke-width="2" stroke-linecap="round"/>';
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="20" cy="50" rx="12" ry="22" fill="#8a5a33" stroke="#262626" stroke-width="2.2" transform="rotate(12 20 50)"/><ellipse cx="80" cy="50" rx="12" ry="22" fill="#8a5a33" stroke="#262626" stroke-width="2.2" transform="rotate(-12 80 50)"/><ellipse cx="50" cy="52" rx="31" ry="29" fill="#fff" stroke="#262626" stroke-width="2.2"/><circle cx="39" cy="48" r="3.6" fill="#262626"/><circle cx="61" cy="48" r="3.6" fill="#262626"/><ellipse cx="50" cy="60" rx="7" ry="5" fill="#262626"/><path d="M50 65 V69" stroke="#262626" stroke-width="2"/>' + mouth + '</svg>';
  };

  /* ---------- 状态 ---------- */
  const KEY = 'petcity-web-demo-v1';
  function seedOrders() {
    return [
      { id: 'DEMO-000123', status: 'prep', delivery: 'home', coupon: true, fromRoute: 'r1', method: 'Alipay HK', time: '示例 · 2 天前', items: ['leash', 'bowl', 'poop', 'wipes'].map(p => ({ pid: p, qty: 1, spec: PC.PRODUCTS[p].opts[0][1][0] })) },
      { id: 'DEMO-000122', status: 'pending', delivery: 'home', coupon: false, time: '示例 · 昨天', items: [{ pid: 'mat', qty: 1, spec: '中号' }] },
      { id: 'DEMO-000121', status: 'done', delivery: 'home', coupon: false, method: 'Octopus', time: '示例 · 上周', items: [{ pid: 'bottle', qty: 1, spec: '300 ml' }, { pid: 'towel', qty: 1, spec: '中号' }] },
    ];
  }
  function defaults() {
    return {
      onboarded: false,
      lang: 'hans',          // 'hans' 简体 / 'hant' 繁体
      pets: [{ id: 'pet1', name: '豆豆', species: '狗狗', size: '小型', modes: ['走路', '打车'], areas: ['西九龙'], example: true }],
      petId: 'pet1',
      cart: [], orders: seedOrders(), orderSeq: 123,
      favs: ['p1'], myRoutes: [JSON.parse(JSON.stringify(PC.SEED_MY_ROUTE))], draft: null, routeSeq: 1,
      signups: [], posts: [], likes: {}, replies: {}, trip: null, tripHistory: [], reviews: {}, feedback: [],
      fab: { side: 'right', y: null }, hideFab: false, sound: 0, mallFrom: null, checkout: null, planAnswers: null,
    };
  }
  /* 数据版本：按 data.js 内容自动计算。改了 data.js 后，旧的购物车 / 订单 / 路线 / 行程会自动清空，
     宠物档案和界面设置保留，无需再手动「重置演示」。 */
  function dataVersion() {
    const src = JSON.stringify([PC.POIS, PC.ROUTES, PC.SEED_MY_ROUTE, PC.PRODUCTS, PC.PACKS, PC.SEED_POSTS, PC.EVENTS, PC.PAYS, PC.TAXIS, PC.MPU, PC.DETOUR, PC.WALK, PC.SHIP, PC.COUPON, PC.COUPON_MIN]);
    let h = 5381;
    for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
    return 'd' + (h >>> 0).toString(36);
  }
  const VER = dataVersion();
  const KEEP = ['onboarded', 'lang', 'pets', 'petId', 'fab', 'hideFab', 'sound'];
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || typeof S !== 'object') S = defaults();
  else if (S._v !== VER) {
    const d = defaults();
    KEEP.forEach(k => { if (k in S) d[k] = S[k]; });
    PC.dataUpdated = true;
    S = d;
  } else { const d = defaults(); for (const k in d) if (!(k in S)) S[k] = d[k]; }
  S._v = VER;
  PC.S = S;
  /* 存档：连续操作时合并成一次写入（约 300ms 后）；切到后台或关闭页面时立刻补存 */
  let saveTimer = 0;
  PC.saveNow = function () {
    clearTimeout(saveTimer); saveTimer = 0;
    if (PC.resetting) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 隐私模式 */ }
  };
  PC.save = function () { if (!saveTimer) saveTimer = setTimeout(PC.saveNow, 300); };
  const flushSave = () => { if (saveTimer) PC.saveNow(); };
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
  if (PC.dataUpdated) PC.saveNow();

  /* 离开页面时的清理：PC.leave(fn) 可以登记多个（计时器、监听器等），换页或重绘前全部执行。
     旧写法 PC.onLeave = fn 仍然可用，等同于 PC.leave(fn)。 */
  const leaveFns = [];
  PC.leave = fn => { if (typeof fn === 'function') leaveFns.push(fn); };
  PC.runLeave = () => leaveFns.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
  Object.defineProperty(PC, 'onLeave', { set: PC.leave, get: () => (leaveFns.length ? PC.runLeave : null), configurable: true });

  /* 窗口大小变化：统一监听，每帧最多处理一次 */
  const resizeFns = [];
  let resizeRaf = 0;
  PC.onResize = fn => resizeFns.push(fn);
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; resizeFns.forEach(f => f()); });
  });

  /* 局部更新：把新 HTML 和现有 DOM 比对，只改有变化的节点。
     这样输入框、焦点、滚动位置、正在播放的动画都不会被打断。full=true 时整块替换（换页时用）。 */
  PC.patch = function (el, html, full) {
    if (!el) return;
    if (!full && el.__h === html) return;
    el.__h = html;
    if (full) { el.innerHTML = html; PC.convertTree && PC.convertTree(el); return; }
    const t = document.createElement('template');
    t.innerHTML = html;
    PC.convertTree && PC.convertTree(t.content);   // 繁体模式：先转换再比对，避免每次刷新都改动文字
    morphKids(el, t.content);
  };
  function sameNode(a, b) {
    return a.nodeType === b.nodeType && a.nodeName === b.nodeName && (a.nodeType !== 1 || a.id === b.id);
  }
  function morphKids(from, to) {
    let a = from.firstChild, b = to.firstChild;
    while (b) {
      const nb = b.nextSibling;
      if (!a) from.appendChild(b);
      else if (sameNode(a, b)) { morphNode(a, b); a = a.nextSibling; }
      else { from.replaceChild(b, a); a = b.nextSibling; }
      b = nb;
    }
    while (a) { const na = a.nextSibling; from.removeChild(a); a = na; }
  }
  function morphNode(a, b) {
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    const tag = a.nodeName;
    const oldVal = a.getAttribute('value'), oldChk = a.hasAttribute('checked'), oldSel = a.hasAttribute('selected');
    for (let i = a.attributes.length - 1; i >= 0; i--) { const n = a.attributes[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
    for (const at of b.attributes) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    if (tag === 'INPUT') {
      // 只有程序改了 value（例如点「清除」）才覆盖；用户正在输入的内容不动
      const nv = b.getAttribute('value');
      if (nv !== oldVal && a.value !== (nv || '')) a.value = nv || '';
      if (b.hasAttribute('checked') !== oldChk) a.checked = b.hasAttribute('checked');
      return;
    }
    if (tag === 'OPTION' && b.hasAttribute('selected') !== oldSel) a.selected = b.hasAttribute('selected');
    if (tag === 'TEXTAREA') {
      if (a.defaultValue !== b.defaultValue) { a.defaultValue = b.defaultValue; a.value = b.defaultValue; }
      return;
    }
    morphKids(a, b);
  }
  PC.reset = function () {
    PC.resetting = true;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    history.replaceState(null, '', location.pathname + location.search + '#/');
    location.reload();
  };
  PC.pet = () => S.pets.find(p => p.id === S.petId) || S.pets[0];
  // 「小型犬」「小型猫」：按种类显示，不再一律写「犬」
  PC.sizeLabel = p => p ? p.size + (p.species === '狗狗' ? '犬' : p.species === '猫猫' ? '猫' : '宠物') : '';
  // 体型限制文案：猫显示「小型猫」，不写「小型犬」
  PC.sizeLimit = (max, pet) => '限' + (max === 1 ? '小型' + (pet && pet.species === '猫猫' ? '猫' : pet && pet.species !== '狗狗' ? '宠物' : '犬') : '中型以下');
  PC.ui = { snap: null, bubble: false, bubbleRoute: null, filter: '全部', query: '' };

  /* ---------- 计算 ---------- */
  PC.poi = id => PC.POIS[id];
  PC.getRoute = id => PC.ROUTES[id] || S.myRoutes.find(r => r.id === id) || (S.draft && S.draft.id === id ? S.draft : null);
  PC.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * PC.MPU * PC.DETOUR;
  PC.fmtDist = m => m < 1000 ? (Math.max(10, Math.round(m / 10) * 10) + ' m') : ((m / 1000).toFixed(1) + ' km');
  PC.walkMin = m => Math.max(1, Math.ceil(m / PC.WALK));
  PC.fmtDur = min => { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; return h ? (h + ' 小时' + (m ? ' ' + m + ' 分' : '')) : (m + ' 分钟'); };
  PC.fmtClock = min => { min = Math.round(min) % 1440; return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); };
  PC.hk = n => 'HK$ ' + n;
  /* 地点分类：地图图钉和列表图标用同一套颜色 / 图标（样式见 style.css 的 .cat-*） */
  PC.CAT = { '户外': ['out', 'tree'], '餐饮': ['food', 'coffee'], '店铺': ['shop', 'bag'], '医疗美容': ['med', 'medcross'] };
  PC.catOf = p => p.rest ? ['rest', 'drop'] : (PC.CAT[p.type] || ['out', 'tree']);
  PC.catIcon = (p, size) => PC.ic(PC.catOf(p)[1], size || 16, 2);

  PC.plan = function (stops, start) {
    const legs = [], walk = [], arr = [], leave = [];
    let t = start == null ? 600 : start, totalM = 0, walkT = 0;
    stops.forEach((s, i) => {
      if (i > 0) {
        const m = PC.dist(PC.poi(stops[i - 1].pid), PC.poi(s.pid));
        const w = PC.walkMin(m);
        legs.push(m); walk.push(w); totalM += m; walkT += w; t += w;
      } else { legs.push(0); walk.push(0); }
      arr.push(t); t += s.dwell; leave.push(t);
    });
    return { legs, walk, arr, leave, totalM, walkT, total: t - (start == null ? 600 : start), end: t };
  };

  PC.issues = function (stops, start, pet) {
    const pl = PC.plan(stops, start), out = [];
    const rank = pet ? PC.SIZE_RANK[pet.size] : 1;
    stops.forEach((s, i) => {
      const p = PC.poi(s.pid), a = pl.arr[i], l = pl.leave[i];
      // kind：size 体型 / carry 需抱着 / time 营业或预约时间（AI 排路线用它判断要不要调出发时间）
      if (p.maxSize < rank) out.push({ i, kind: 'size', level: 'warn', text: PC.sizeLimit(p.maxSize, pet) + '，' + (pet ? pet.name + '是' + PC.sizeLabel(pet) : '宠物体型不符') + '，可能进不去' });
      else if (p.carry && rank > 1) out.push({ i, kind: 'carry', level: 'warn', text: '需抱着入座，' + PC.sizeLabel(pet) + '不太方便' });   // 已提示体型不符的站不再重复提示
      else if (p.carry) out.push({ i, kind: 'carry', level: 'note', text: '需抱着 / 使用外出包' });
      if (p.reserve) {
        if (a < p.reserve[0] || a > p.reserve[1]) out.push({ i, kind: 'time', level: 'warn', text: '需预约 ' + PC.fmtClock(p.reserve[0]) + '–' + PC.fmtClock(p.reserve[1]) + '，预计 ' + PC.fmtClock(a) + ' 到，需改约' });
        else out.push({ i, kind: 'time', level: 'note', text: '需预约（示例时段 ' + PC.fmtClock(p.reserve[0]) + '–' + PC.fmtClock(p.reserve[1]) + '）' });
      }
      if (p.hours && (a < p.hours[0] || l > p.hours[1] + 1)) out.push({ i, kind: 'time', level: 'warn', text: '营业 ' + p.hoursTxt.split(' ')[0] + '，预计 ' + PC.fmtClock(a) + '–' + PC.fmtClock(l) + ' 在此，时间冲突' });
    });
    return out;
  };

  /* ---------- 购物车 / 订单计算 ---------- */
  PC.cartCount = () => S.cart.reduce((n, l) => n + l.qty, 0);
  PC.addToCart = function (pid, spec, qty, from) {
    spec = spec || PC.PRODUCTS[pid].opts.map(o => o[1][0]).join(' · ');
    const ex = S.cart.find(l => l.pid === pid && l.spec === spec && (l.from || null) === (from || null));
    if (ex) ex.qty += qty || 1; else S.cart.push({ pid, spec, qty: qty || 1, checked: true, from: from || null });
    PC.save();
  };
  PC.sum = items => items.reduce((n, i) => n + PC.PRODUCTS[i.pid].price * i.qty, 0);
  PC.orderAmounts = function (items, delivery, coupon) {
    const sub = PC.sum(items), ship = delivery === 'pickup' ? 0 : PC.SHIP;
    const cp = coupon && sub >= PC.COUPON_MIN ? PC.COUPON : 0;
    return { sub, ship, cp, total: sub + ship - cp };
  };
  PC.ORDER_ST = { pending: '待付款', paid: '已付款', prep: '备货中', ship: '配送中', done: '已完成' };

  /* ---------- 路由 ---------- */
  const table = [];
  PC._table = table;
  PC.route = function (pattern, fn) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (m, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    table.push({ re, keys, fn });
  };
  PC.parse = function () {
    const h = (location.hash || '#/').slice(1) || '/';
    const i = h.indexOf('?');
    const path = i < 0 ? h : h.slice(0, i);
    const q = {};
    if (i >= 0) new URLSearchParams(h.slice(i + 1)).forEach((v, k) => { q[k] = v; });
    return { path: path.replace(/\/+$/, '') || '/', q };
  };
  PC.cur = { path: null, q: {} };
  PC.depth = () => (history.state && history.state.d) || 0;
  PC.go = function (to, opts) {
    opts = opts || {};
    const url = '#' + to;
    if (opts.replace) history.replaceState({ d: PC.depth() }, '', url);
    else history.pushState({ d: PC.depth() + 1 }, '', url);
    PC.render();
  };
  PC.back = function (fallback) {
    if (PC.depth() > 0) history.back();
    else PC.go(fallback || '/map', { replace: true });
  };
  window.addEventListener('popstate', () => PC.render());
  window.addEventListener('hashchange', () => { if (PC.parse().path !== PC.cur.path) PC.render(); });

  /* ---------- 全局交互 ---------- */
  PC.ACT = {};
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = PC.ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  PC.INPUT = {};
  /* 中文输入法（拼音 / 手写等）选字过程中也会触发 input；此时重绘页面会打断选字。
     所以选字中先跳过，选字结束（compositionend）再处理一次。 */
  function onInput(e) {
    const el = e.target.closest && e.target.closest('[data-input]');
    if (el && PC.INPUT[el.dataset.input]) PC.INPUT[el.dataset.input](el, e);
  }
  document.addEventListener('input', function (e) {
    if (e.isComposing || PC.composing) return;
    onInput(e);
  });
  document.addEventListener('compositionstart', function () { PC.composing = true; });
  document.addEventListener('compositionend', function (e) { PC.composing = false; onInput(e); });
  document.addEventListener('focusout', function () { PC.composing = false; });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && PC.closeModal) PC.closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); }
  });
  PC.ACT.go = el => PC.go(el.dataset.to, { replace: el.dataset.replace === '1' });
  PC.ACT.back = el => PC.back(el.dataset.to);
  PC.ACT.demo = el => PC.toast(el.dataset.msg || '示例：此功能在演示版中仅作展示');
  PC.ACT.closeModal = () => PC.closeModal();
  PC.ACT.reset = () => PC.confirm('清除本机上的所有演示数据（购物车、订单、档案、行程），并回到起点？', () => PC.reset(), '重置演示');

  PC.isDesktop = () => window.matchMedia('(min-width:768px)').matches;
  window.matchMedia('(min-width:768px)').addEventListener('change', () => PC.cur.path && PC.render({ keep: true }));
})(window.PC);
