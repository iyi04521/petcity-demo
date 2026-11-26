/* 外壳：渲染、底部面板、弹层、提示、悬浮购物入口 */
(function (PC) {
  'use strict';
  const { $, $$, esc, ic, S } = PC;
  const T = PC._table;
  PC.scene = {};

  /* ---------- 提示 ---------- */
  let toastTimer = null;
  PC.toast = function (msg, o) {
    o = o || {};
    const w = $('#toastWrap');
    clearTimeout(toastTimer);
    w.innerHTML = '<div class="toast" role="status"><span>' + esc(msg) + '</span>' + (o.action ? '<button class="toast-act" id="toastAct">' + esc(o.action) + '</button>' : '') + '</div>';
    if (o.action) $('#toastAct').onclick = () => { w.innerHTML = ''; o.onAction && o.onAction(); };
    toastTimer = setTimeout(() => { w.innerHTML = ''; o.onExpire && o.onExpire(); }, o.ms || 2400);
  };

  /* ---------- 弹层 ---------- */
  let modalFn = null, modalEl = null, modalClose = null, lastFocus = null;
  PC.modal = function (fn, o) {
    o = o || {};
    PC.closeModal(true);
    lastFocus = document.activeElement;
    modalFn = fn; modalClose = o.onClose || null;
    modalEl = document.createElement('div');
    modalEl.className = 'modal-layer';
    modalEl.innerHTML = '<div class="backdrop" data-act="closeModal"></div><div class="modal ' + (o.cls || '') + '" role="dialog" aria-modal="true"><div class="modal-handle"><i></i></div><div class="modal-in">' + fn() + '</div></div>';
    document.body.appendChild(modalEl);
    // 读屏软件用弹窗标题作为名称；背景页面设为 inert（不能点、不能聚焦、不会被读到），提示消息区除外
    const dlg = modalEl.querySelector('.modal'), ttl = modalEl.querySelector('.h2');
    if (ttl) { ttl.id = 'modalTitle'; dlg.setAttribute('aria-labelledby', 'modalTitle'); }
    setInert(true);
    modalEl.addEventListener('keydown', trapTab);
    const f = modalEl.querySelector('button,[href],input');
    f && f.focus({ preventScroll: true });
  };
  function setInert(on) { [...$('#app').children].forEach(el => { if (el.id !== 'toastWrap') el.inert = on; }); }
  // Tab / Shift+Tab 只在弹窗内循环
  function trapTab(e) {
    if (e.key !== 'Tab' || !modalEl) return;
    const fs = [...modalEl.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
    if (!fs.length) return;
    const first = fs[0], last = fs[fs.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  PC.modalUpdate = function () {
    if (!modalEl) return;
    const box = modalEl.querySelector('.modal-in'), top = box.scrollTop;
    box.innerHTML = modalFn(); box.scrollTop = top;
  };
  PC.closeModal = function (silent) {
    if (!modalEl) return;
    const cb = modalClose;
    modalEl.remove(); modalEl = null; modalFn = null; modalClose = null;
    setInert(false);
    if (!silent) { lastFocus && lastFocus.focus && lastFocus.isConnected && lastFocus.focus({ preventScroll: true }); cb && cb(); }
  };
  PC.confirm = function (msg, ok, okText, cancelText) {
    PC.modal(() => '<div class="dlg"><div class="mb-8 h2">请确认</div><p class="fs-14 lh-1-6 sub">' + msg + '</p>' +
      '<div class="mt-18 row gap10"><button class="btn sec" data-act="closeModal">' + (cancelText || '取消') + '</button><button class="btn prim" id="cfOk">' + (okText || '确定') + '</button></div></div>', { cls: 'small' });
    $('#cfOk').onclick = () => { PC.closeModal(true); ok && ok(); };
  };
  PC.sheetTitle = (t, sub) => '<div class="mb-10 row between"><div><div class="h2">' + t + '</div>' + (sub ? '<div class="mt-2 sub">' + sub + '</div>' : '') + '</div><button class="circ-btn" data-act="closeModal" aria-label="关闭">' + ic('x', 16, 2.2) + '</button></div>';

  /* ---------- 底部面板（手机）/ 右侧面板（桌面） ---------- */
  const SN = { peek: 0, half: 1, full: 2 };
  function stageH() { return $('#stage').clientHeight; }
  function snapPx(name, sc) {
    const H = stageH();
    if (name === 'peek') return Math.min(sc.peek || 230, Math.round(H * 0.46));
    if (name === 'full') return H - 64;
    return Math.round(H * (sc.halfRatio || 0.52));
  }
  PC.sheetPx = () => PC.isDesktop() ? 0 : snapPx(PC.ui.snap || 'half', PC.scene);
  function applySnap(animate) {
    const p = $('#panel');
    if (PC.isDesktop()) { p.style.removeProperty('--sheet-h'); return; }
    p.classList.toggle('no-anim', !animate);
    p.style.setProperty('--sheet-h', snapPx(PC.ui.snap || 'half', PC.scene) + 'px');
    p.dataset.snap = PC.ui.snap || 'half';
  }
  PC.setSnap = function (name) { PC.ui.snap = name; applySnap(true); fabPos(true); setTimeout(() => PC.map.refit(), 300); };
  PC.mapInsets = function () {
    const sc = PC.scene || {};
    if (PC.isDesktop()) return { t: sc.deskTop || 90, b: 30, l: 30, r: 70 };
    return { t: sc.insetTop || 70, b: PC.sheetPx() + 8, l: 8, r: 54 };
  };
  function initSheetDrag() {
    const h = $('#handle'), p = $('#panel');
    let sy = 0, sh = 0, drag = false, moved = false;
    h.addEventListener('pointerdown', e => { drag = true; moved = false; sy = e.clientY; sh = p.getBoundingClientRect().height; p.classList.add('no-anim'); h.setPointerCapture(e.pointerId); });
    h.addEventListener('pointermove', e => {
      if (!drag) return;
      const dy = sy - e.clientY; if (Math.abs(dy) > 4) moved = true;
      p.style.setProperty('--sheet-h', Math.max(120, Math.min(stageH() - 40, sh + dy)) + 'px');
    });
    const end = e => {
      if (!drag) return; drag = false; p.classList.remove('no-anim');
      if (!moved) { const o = ['peek', 'half', 'full']; PC.setSnap(o[(SN[PC.ui.snap || 'half'] + 1) % 3]); return; }
      const cur = p.getBoundingClientRect().height, sc = PC.scene;
      let best = 'half', bd = 1e9;
      ['peek', 'half', 'full'].forEach(n => { const d = Math.abs(snapPx(n, sc) - cur); if (d < bd) { bd = d; best = n; } });
      PC.setSnap(best);
    };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const o = ['peek', 'half', 'full']; PC.setSnap(o[(SN[PC.ui.snap || 'half'] + 1) % 3]); } });
  }

  /* ---------- 导航条 ---------- */
  function navHtml(active) {
    const items = [['map', '地图', 'map', '/map'], ['community', '社区', 'chat', '/community'], ['mall', '商城', 'cart', '/mall'], ['me', '我的', 'heart', '/me']];
    const pet = PC.pet();
    return '<a class="brand" href="#/map" data-act="go" data-to="/map">PetCity</a><nav class="topnav-links" aria-label="主导航">' +
      items.map(i => '<a href="#' + i[3] + '" data-act="go" data-to="' + i[3] + '" class="' + (active === i[0] ? 'on' : '') + '">' + (i[2] === 'heart' ? PC.pawheart(17) : ic(i[2], 17, 1.8)) + i[1] + '</a>').join('') + '</nav>' +
      '<span class="grow"></span><span class="mr-6 tag ghost nav-sample">示例数据 · 非真实</span>' +
      '<button class="chip pet-chip" data-act="petMenu">' + PC.pawheart(15) + esc(pet.name) + ' · ' + esc(PC.sizeLabel(pet)) + '</button>' +
      PC.langBtn('ml-8') + '<button class="ml-8 chip" data-act="reset">' + ic('rot', 14, 2) + '重置演示</button>' +
      '<button class="circ-btn cart-btn" data-act="go" data-to="/cart" aria-label="购物车">' + ic('cart', 19, 1.8) + (PC.cartCount() ? '<span class="badge">' + PC.cartCount() + '</span>' : '') + '</button>';
  }
  function tabHtml(active) {
    const it = (k, name, label, to) => '<a class="it ' + (active === k ? 'on' : '') + '" href="#' + to + '" data-act="go" data-to="' + to + '">' + (name === 'heart' ? PC.pawheart(22) : ic(name, 21, 1.8)) + '<span>' + label + '</span></a>';
    return it('community', 'chat', '社区', '/community') + '<span class="it" style="visibility:hidden"></span>' + it('me', 'heart', '我的', '/me') +
      '<a class="mid" href="#/map" data-act="go" data-to="/map" aria-label="地图">' + ic('map', 30, 1.8) + '</a><span class="midlbl">地图</span>';
  }

  /* ---------- 悬浮购物入口 ---------- */
  const fab = { timer: null, el: null };
  function fabZone() {
    const sc = PC.scene, d = PC.isDesktop();
    // 手机地图页：购物球固定在底部面板上方，弹出的装备包气泡不会盖住面板标题
    return { top: d ? 70 : (sc.fabTop || 70), bottom: d ? 24 : (sc.mode === 'map' ? Math.max(92, PC.sheetPx() + 12) : 92) };
  }
  function fabPos(animate) {
    const el = fab.el; if (!el) return;
    const layer = $('#fabLayer'), LH = layer.clientHeight, z = fabZone(), d = PC.isDesktop(), sz = d ? 48 : 54;
    let y = S.fab.y;
    if (y == null) y = d ? 0.8 : 0.6;
    let top = Math.round(y * LH - sz / 2);
    top = Math.max(z.top, Math.min(LH - z.bottom - sz, top));
    el.classList.toggle('no-anim', !animate);
    el.style.top = top + 'px';
    el.style.left = S.fab.side === 'left' ? '10px' : 'auto';
    el.style.right = S.fab.side === 'right' ? '10px' : 'auto';
    el.classList.toggle('side-left', S.fab.side === 'left');
  }
  function fabWake() {
    const el = fab.el; if (!el) return;
    el.classList.remove('half');
    clearTimeout(fab.timer);
    fab.timer = setTimeout(() => { if (fab.el && !PC.ui.bubble && !fab.el.classList.contains('dragging')) fab.el.classList.add('half'); }, 3000);
  }
  PC.bubbleHtml = function (rid) {
    const pack = PC.PACKS[rid] || PC.PACKS.def;
    const tot = pack.reduce((n, p) => n + PC.PRODUCTS[p].price, 0);
    return '<div class="fab-bubble" role="dialog" aria-label="本路线装备包"><button class="bubble-x" data-act="bubbleClose" aria-label="关闭提示">' + ic('x', 14, 2.4) + '</button>' +
      '<div class="fs-14 pr-18 b">本路线装备包，一键加购</div>' +
      '<div class="fs-11-5 sub" style="margin:3px 0 6px">' + pack.map(p => PC.PRODUCTS[p].name.split('（')[0]).join(' · ') + '</div>' +
      '<span class="sample">示例商品，非真实售卖</span>' +
      '<div class="mt-8 row between"><span class="b">' + PC.hk(tot) + ' <span class="fs-10 fw-4 sub">示例合计</span></span><button class="btn prim sm" data-act="openPack" data-id="' + rid + '">' + ic('plus', 14, 2.6) + '一键加购</button></div></div>';
  };
  PC.fabUpdate = function () {
    const layer = $('#fabLayer'), sc = PC.scene;
    if (!sc.fab || S.hideFab) { layer.innerHTML = ''; fab.el = null; return; }
    const n = PC.cartCount();
    const bubble = sc.fab === 'p6' && PC.ui.bubble ? PC.bubbleHtml(sc.fabRoute) : '';
    if (!fab.el || !layer.contains(fab.el)) {
      layer.innerHTML = '<div class="fab" id="fab"><div id="fabBubble"></div><button class="fab-btn" id="fabBtn" aria-label="商城与购物车（可拖动）">' + ic('cart', 24, 1.8) + '<span class="badge" id="fabBadge"></span></button></div>';
      fab.el = $('#fab'); bindFab();
    }
    PC.patch($('#fabBubble'), bubble);
    const bd = $('#fabBadge'); if (bd.textContent !== String(n)) bd.textContent = n; bd.style.display = n ? 'flex' : 'none';
    fab.el.classList.toggle('with-bubble', !!bubble);
    fabPos(false); fabWake();
  };
  function bindFab() {
    const el = fab.el, btn = $('#fabBtn');
    let st = null, moved = false, ox = 0, oy = 0;
    btn.addEventListener('pointerdown', e => {
      const r = el.getBoundingClientRect(), lr = $('#fabLayer').getBoundingClientRect();
      st = { x: e.clientX, y: e.clientY, l: r.left - lr.left, t: r.top - lr.top }; moved = false; ox = lr.left; oy = lr.top;
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener('pointermove', e => {
      if (!st) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; el.classList.add('dragging', 'no-anim'); el.classList.remove('half'); }
      el.style.right = 'auto'; el.style.left = (st.l + dx) + 'px'; el.style.top = (st.t + dy) + 'px';
    });
    const end = e => {
      if (!st) return;
      const was = moved; st = null;
      el.classList.remove('dragging');
      if (was) {
        const layer = $('#fabLayer'), r = el.getBoundingClientRect(), lr = layer.getBoundingClientRect();
        const cx = r.left - lr.left + r.width / 2, cy = r.top - lr.top + r.height / 2;
        S.fab = { side: cx < lr.width / 2 ? 'left' : 'right', y: cy / lr.height };
        PC.save(); fabPos(true); fabWake();
      } else if (e.type === 'pointerup') {
        if (el.classList.contains('half')) { fabWake(); return; }
        fabWake(); PC.go('/mall');
      }
    };
    btn.addEventListener('pointerup', end); btn.addEventListener('pointercancel', end);
    btn.addEventListener('click', e => { if (e.detail === 0) PC.go('/mall'); });
    el.addEventListener('pointerenter', fabWake); el.addEventListener('focusin', fabWake);
  }
  PC.ACT.bubbleClose = () => { PC.ui.bubble = false; PC.fabUpdate(); };
  PC.onResize(() => { fabPos(false); if (PC.scene.mode === 'map') applySnap(false); });

  /* ---------- 渲染 ---------- */
  function restart(el) { el.classList.remove('anim-in'); void el.offsetWidth; el.classList.add('anim-in'); }
  PC.render = function (o) {
    o = o || {};
    let { path, q } = PC.parse();
    if (path === '/') { PC.go(S.onboarded ? '/map' : '/onboard', { replace: true }); return; }
    let scene = null;
    for (const r of T) {
      const m = r.re.exec(path);
      if (m) { const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); }); scene = r.fn(params, q, path); break; }
    }
    if (!scene) { PC.go('/map', { replace: true }); return; }
    PC.runLeave();
    const changed = path !== PC.cur.path;
    const prevPath = PC.cur.path;
    PC.cur = { path, q };
    PC.scene = scene;
    if (changed && $('#toastAct')) $('#toastWrap').innerHTML = '';
    if (changed) {
      PC.ui.snap = scene.snap || 'half'; PC.ui.bubble = scene.fab === 'p6';
      // 手机屏幕小：装备包气泡自动弹出 6 秒后收起，免得一直挡住地图上的站点
      if (PC.ui.bubble && !PC.isDesktop()) { const at = path; setTimeout(() => { if (PC.cur.path === at && PC.ui.bubble) { PC.ui.bubble = false; PC.fabUpdate(); } }, 6000); }
    }
    const db = document.body.dataset;   // 只在变化时写，避免无意义的样式重算
    if (db.mode !== scene.mode) db.mode = scene.mode;
    if (db.tab !== (scene.tab || '')) db.tab = scene.tab || '';
    document.body.classList.toggle('desk', PC.isDesktop());
    /* 同一页内刷新：只更新有变化的部分；换页：整块重建 */
    const full = changed;
    PC.patch($('#topnav'), navHtml(scene.nav));
    PC.patch($('#tabbar'), tabHtml(scene.tab));
    document.title = 'PetCity 演示 · ' + (scene.title || '');
    let scroller;
    if (scene.mode === 'map') {
      const ps = $('#panelScroll'), top = ps.scrollTop;
      PC.patch(ps, scene.panel || '', full);
      PC.patch($('#panelActions'), scene.actions || '', full);
      $('#panel').classList.toggle('has-tab', !!scene.tab);
      $('#panel').classList.toggle('has-actions', !!scene.actions);
      PC.patch($('#mapOverlay'), scene.overlay || '', full);
      $('#mapctl').style.setProperty('--ctl-top', (PC.isDesktop() ? 14 : (scene.ctlTop || 70)) + 'px');
      applySnap(false);
      PC.map.set(scene.map, PC.mapInsets());
      ps.scrollTop = changed ? 0 : top;
      scroller = $('#panel');
      if (changed) { restart(ps); }
    } else {
      // 换成整页模式时清空地图面板，避免隐藏的旧标题（同样 id="main-h"）抢走焦点
      if (changed) ['#panelScroll', '#panelActions', '#mapOverlay'].forEach(s => { const el = $(s); if (el.__h) { el.innerHTML = ''; el.__h = ''; } });
      const pg = $('#page'), top = pg.scrollTop;
      $('#pageIn').className = 'page-in ' + (scene.pageClass || '');
      PC.patch($('#pageIn'), scene.page || '', full);
      pg.scrollTop = changed ? 0 : top;
      if (changed) restart($('#pageIn'));
    }
    PC.fabUpdate();
    scene.after && scene.after(changed, prevPath);
    /* 换页后把焦点移到页面标题，读屏软件会读出新页面；首次打开不抢焦点。
       如果用户正在输入框里打字（例如搜索），也不抢。 */
    if (changed && prevPath && o.focus !== false) {
      const h = $(scene.mode === 'map' ? '#panel #main-h' : '#page #main-h'), a = document.activeElement;
      const typing = a && a.matches && a.matches('input,textarea,select') && a.isConnected;
      if (h && !typing) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
  };
  PC.refresh = () => PC.render({ keep: true });

  PC.boot = function () {
    PC.i18nInit();
    PC.map.init();
    initSheetDrag();
    $('#mapctl').addEventListener('click', e => {
      const b = e.target.closest('[data-z]'); if (!b) return;
      if (b.dataset.z === 'in') PC.map.zoomBy(1.3);
      else if (b.dataset.z === 'out') PC.map.zoomBy(1 / 1.3);
      else { PC.map.refit(); PC.toast('示例：演示版不使用真实定位，已回到当前路线 / 区域视图'); }
    });
    PC.render();
    if (PC.dataUpdated) PC.toast('示例数据已更新，已自动清空旧的购物车、订单和行程', { ms: 3500 });
  };
})(window.PC);
