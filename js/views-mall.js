/* 商城：S1 首页、S1a 装备包、S2 详情、S3 购物车、S4 确认订单、S5 支付（模拟）、S6 支付成功+订单、S7 我的订单 */
(function (PC) {
  'use strict';
  const { $, esc, ic, S, ACT } = PC;
  const V = PC.V, PR = PC.PRODUCTS, SAMPLE = PC.SAMPLE;
  const sample = (big) => '<span class="sample' + (big ? ' big' : '') + '">' + SAMPLE + '</span>';
  const thumb = (pid, w, h, isz) => '<div class="thumb t' + PR[pid].tint + '" style="width:' + w + 'px;height:' + h + 'px;border-radius:' + Math.min(14, w / 4) + 'px">' + ic(PR[pid].icon, isz || 30, 1.5) + '</div>';
  const price = (n, big) => '<span class="b" style="font-size:' + (big ? 24 : 15) + 'px">' + PC.hk(n) + '</span> <span class="sub" style="font-size:' + (big ? 12 : 10) + 'px;font-weight:400">示例价</span>';
  const mhead = (title, back, right) => V.phead(title, { back: back || '/mall', right: right === false ? '' : '<button class="pos-rel circ-btn" data-act="go" data-to="/cart" aria-label="购物车">' + ic('cart', 19, 1.8) + (PC.cartCount() ? '<span class="badge">' + PC.cartCount() + '</span>' : '') + '</button>' });
  const mall = (title, body, o) => Object.assign({ mode: 'page', nav: 'mall', tab: '', title, pageClass: 'mid', fab: null }, o || {}, { page: body });
  const specTxt = pid => PR[pid].opts.map(o => o[1][0]).join(' · ');

  /* ---------- S1 商城首页 ---------- */
  PC.route('/mall', () => {
    const cat = PC.ui.mallCat || '全部';
    const list = Object.values(PR).filter(p => cat === '全部' || p.cat === cat);
    const scenes = ['r1', 'r2', 'r3'].map(rid => {
      const r = PC.ROUTES[rid], pack = PC.PACKS[rid], tot = pack.reduce((n, p) => n + PR[p].price, 0), meta = { r1: '海滨 · 约 2 小时 · 全程牵绳', r2: '咖啡店露台 · 约 90 分钟', r3: '夜景 · 傍晚出发 · 全程户外' }[rid];
      return '<div class="w-280 card" style="scroll-snap-align:start"><div class="row gap6"><span class="tag official">官方优选</span><b class="fs-14">' + esc(r.name) + '</b></div><div class="fs-11-5 sub" style="margin:3px 0 8px">' + meta + '</div><div class="row gap6">' + pack.map(p => thumb(p, 40, 40, 20)).join('') + '<span class="fs-11 sub">共 ' + pack.length + ' 件</span></div><div class="row between mt8"><span>' + price(tot) + '</span><button class="btn prim sm" data-act="openPack" data-id="' + rid + '">看装备包</button></div></div>';
    }).join('');
    const catBtns = (side) => [['全部', 'grid']].concat(PC.CATS).map(c => '<button class="cat ' + (cat === c[0] ? 'on' : '') + '" data-act="mallCat" data-c="' + c[0] + '">' + ic(c[1] === 'grid' ? 'grid' : { leash: 'leash', bowl: 'bowl', roll: 'roll', shield: 'shield' }[c[1]], 22, 1.6) + c[0] + '</button>').join('');
    const mini = () => {
      const sel = S.cart.filter(l => l.checked), sub = PC.sum(sel);
      return '<div class="card stickycol"><div class="row between"><b class="fs-15">购物车</b><span class="sub">' + PC.cartCount() + ' 件</span></div>' + (S.cart.length ? '<div class="mt8">' + S.cart.map((l, i) => '<div class="py-8 bt-line row gap8">' + thumb(l.pid, 44, 44, 20) + '<div class="grow"><div class="fs-12-5 b">' + esc(PR[l.pid].name) + '</div>' + sample() + '<div class="row between mt4"><b class="fs-12-5">' + PC.hk(PR[l.pid].price) + '</b><span class="qty"><button data-act="cartQty" data-i="' + i + '" data-d="-1" aria-label="减少">' + ic('minus', 11, 2.6) + '</button>' + l.qty + '<button data-act="cartQty" data-i="' + i + '" data-d="1" aria-label="增加">' + ic('plus', 11, 2.6) + '</button></span></div></div></div>').join('') + '</div><div class="pt-10 row between hr mt8"><span>合计</span><b class="fs-18">' + PC.hk(sub) + '</b></div><button class="btn prim block mt8" data-act="go" data-to="/cart">去购物车结算</button>' : '<div class="py-20 empty">购物车是空的<br>点商品右下角「+」加入</div>') + '<div class="fs-11 sub center mt8">示例商品，非真实售卖</div></div>';
    };
    const page = mhead('宠物装备商城', '/map') +
      '<div class="split mall"><div class="desk-only stickycol"><div class="mb-8 b">商品分类</div><div class="catgrid side">' + catBtns() + '</div></div><div>' +
      '<div class="callout warn">' + ic('info', 15, 2) + '<span>示例商城：商品与价格仅作演示，示例商品，非真实售卖。</span></div>' +
      '<div class="sec-h">按路线场景推荐</div><div class="hscroll">' + scenes + '</div>' +
      '<div class="sec-h mob-only">商品分类</div><div class="catgrid mob-only">' + PC.CATS.map(c => '<button class="cat ' + (cat === c[0] ? 'on' : '') + '" data-act="mallCat" data-c="' + c[0] + '">' + ic(c[1], 22, 1.6) + c[0] + '</button>').join('') + '</div>' +
      '<div class="sec-h">示例商品 <button class="sub u" data-act="mallCat" data-c="全部">' + (cat === '全部' ? '全部 ' + list.length : cat + ' · 查看全部') + '</button></div>' +
      '<div class="pgrid three">' + list.map(p => '<div class="pcard" role="button" tabindex="0" data-act="go" data-to="/product/' + p.id + '">' + thumb(p.id, 100, 96, 34).replace('width:100px', 'width:100%') + '<b class="fs-13-5">' + esc(p.name) + '</b>' + sample() + '<div class="mb-26">' + price(p.price) + '</div><button class="add" data-act="quickAdd" data-id="' + p.id + '" aria-label="加入购物车：' + esc(p.name) + '">' + ic('plus', 16, 2.6) + '</button></div>').join('') + '</div></div>' +
      '<div class="desk-only">' + mini() + '</div></div>';
    return mall('宠物装备商城', page, { pageClass: '' });
  });
  ACT.mallCat = el => { PC.ui.mallCat = el.dataset.c === PC.ui.mallCat ? '全部' : el.dataset.c; PC.refresh(); };
  ACT.quickAdd = (el, e) => { e.stopPropagation(); PC.addToCart(el.dataset.id, null, 1, null); PC.toast('已加入购物车：' + PR[el.dataset.id].name); PC.refresh(); };

  /* ---------- S1a 路线装备包 ---------- */
  ACT.openPack = el => {
    const rid = el.dataset.id;
    PC.ui.pack = { rid, sel: (PC.PACKS[rid] || PC.PACKS.def).slice() };
    PC.ui.bubble = false; PC.fabUpdate();
    PC.modal(packHtml, { cls: 'wide' });
  };
  function packHtml() {
    const { rid, sel } = PC.ui.pack, r = PC.getRoute(rid), pack = PC.PACKS[rid] || PC.PACKS.def, pet = PC.pet();
    const tot = sel.reduce((n, p) => n + PR[p].price, 0);
    const reasons = { leash: '路线规则「全程牵绳」', bowl: '户外约 2 小时需补水', carrier: '有站点需抱着入店', poop: '随手清理', wipes: '露台咖啡店后擦手', led: '傍晚 / 夜间路线', towel: '玩水或雨天后擦干' };
    return PC.sheetTitle((r ? esc(r.name) : '本路线') + ' · 装备包', '按路线 ' + (r ? r.stops.length : 4) + ' 站、' + esc(pet.name) + '（' + PC.sizeLabel(pet) + '）搭配（示例规则）') +
      '<div class="callout warn">' + ic('info', 14, 2) + '<span>装备包里的商品均为示例商品，价格为示例价，非真实售卖。</span></div><div class="mt8">' +
      pack.map(p => '<button class="w-full py-10 bb-line ta-l row gap10" data-act="packTog" data-p="' + p + '" role="checkbox" aria-checked="' + (sel.indexOf(p) >= 0) + '"><span class="ck ' + (sel.indexOf(p) >= 0 ? 'on' : '') + '">' + (sel.indexOf(p) >= 0 ? ic('check', 13, 3) : '') + '</span>' + thumb(p, 48, 48, 22) + '<span class="grow"><b class="fs-14">' + esc(PR[p].name) + '</b><span class="row gap4 wrap mt4"><span class="chip tiny">' + esc(reasons[p] || PR[p].why) + '</span>' + sample() + '</span></span><span class="ta-r">' + price(PR[p].price) + '</span></button>').join('') + '</div>' +
      '<div class="callout sage mt12">' + ic('sparkle', 14, 2) + '<span>推荐依据：本路线的站点规则（全程牵绳、需抱着等，均为示例）与 ' + esc(pet.name) + ' 的体型。</span></div>' +
      '<div class="row between mt16"><span class="sub">已选 ' + sel.length + ' 件</span><span>合计 ' + price(tot, true) + '</span></div><button class="btn prim block mt8" data-act="packAdd" ' + (sel.length ? '' : 'disabled') + '>' + ic('cart', 16, 2) + '一键加入购物车</button>';
  }
  ACT.packTog = el => { const s = PC.ui.pack.sel, i = s.indexOf(el.dataset.p); if (i >= 0) s.splice(i, 1); else s.push(el.dataset.p); PC.modalUpdate(); };
  ACT.packAdd = () => {
    const { rid, sel } = PC.ui.pack;
    sel.forEach(p => { if (!S.cart.some(l => l.pid === p && l.from === rid)) PC.addToCart(p, null, 1, rid); else S.cart.find(l => l.pid === p && l.from === rid).checked = true; });
    PC.save(); PC.closeModal(true); PC.toast('已加入 ' + sel.length + ' 件装备'); PC.go('/cart');
  };

  /* ---------- S2 商品详情 ---------- */
  PC.route('/product/:id', ({ id }) => {
    const p = PR[id]; if (!p) return mall('商品', '<div class="empty">没有这个商品</div>');
    const sp = (PC.ui.spec = PC.ui.spec || {})[id] || (PC.ui.spec[id] = { o: p.opts.map(() => 0), q: 1 });
    const inCart = S.cart.filter(l => l.pid === id).reduce((n, l) => n + l.qty, 0), pet = PC.pet();
    const info = '<div class="ai-e row between"><div>' + price(p.price, true) + '</div>' + (inCart ? '<span class="sub">已加 ' + inCart + ' 件在购物车</span>' : '') + '</div>' +
      '<h1 class="fs-20 h2 mt8" id="main-h">' + esc(p.name) + '</h1><div class="row gap6 wrap mt8">' + p.tags.map(t => '<span class="chip sm">' + t + '</span>').join('') + '</div>' +
      '<div class="callout sage mt12">' + ic('map', 15, 1.8) + '<span><b>为什么推荐：</b>适用于 ' + esc(p.apply) + ' · ' + esc(pet.name) + '（' + PC.sizeLabel(pet) + '）（示例）</span></div>' +
      p.opts.map((o, k) => '<div class="row gap10 mt12"><span class="w-40 fs-13 muted">' + o[0] + '</span><div class="opts">' + o[1].map((v, j) => '<button class="chip ' + (sp.o[k] === j ? 'sel' : '') + '" data-act="specPick" data-id="' + id + '" data-k="' + k + '" data-j="' + j + '">' + v + '</button>').join('') + '</div></div>').join('') +
      '<div class="row gap10 mt12"><span class="w-40 fs-13 muted">数量</span><span class="qty"><button data-act="specQty" data-id="' + id + '" data-d="-1" aria-label="减少">' + ic('minus', 13, 2.6) + '</button>' + sp.q + '<button data-act="specQty" data-id="' + id + '" data-d="1" aria-label="增加">' + ic('plus', 13, 2.6) + '</button></span></div>' +
      '<button class="w-full ta-l card flat click row between mt12" data-act="demo" data-msg="示例：配送说明在演示版中仅作展示"><span class="row gap8">' + ic('truck', 16, 1.8) + '<span><b>配送</b> 送货上门 / 便利店自取（示例）</span></span>' + ic('right', 16, 2) + '</button>' +
      '<div class="fs-11-5 d-flex gap-6 sub mt12">' + ic('info', 14, 2) + '商品图、评价、价格均为占位示例，非真实售卖。</div>';
    const bar = '<div class="buybar mt16"><button class="pos-rel flex-none circ-btn mob-only" data-act="go" data-to="/cart" aria-label="购物车">' + ic('cart', 20, 1.8) + (PC.cartCount() ? '<span class="badge">' + PC.cartCount() + '</span>' : '') + '</button><button class="btn sec flex1" data-act="addSpec" data-id="' + id + '">加入购物车</button><button class="btn prim flex1" data-act="buyNow" data-id="' + id + '">立即购买</button></div>';
    const page = mhead('商品详情', '/mall') + '<div class="split s2"><div><div class="pos-rel">' + thumb(id, 100, 240, 90).replace('width:100px', 'width:100%') + '<span class="pos-abs left-12 bottom-12 sample big">' + SAMPLE + '</span><span class="pos-abs right-12 top-12 sample">1 / 3 · 占位图</span></div></div><div>' + info + bar + '</div></div>';
    return mall(p.name, page, { pageClass: 'mid' });
  });
  ACT.specPick = el => { PC.ui.spec[el.dataset.id].o[+el.dataset.k] = +el.dataset.j; PC.refresh(); };
  ACT.specQty = el => { const s = PC.ui.spec[el.dataset.id]; s.q = Math.max(1, Math.min(9, s.q + +el.dataset.d)); PC.refresh(); };
  const specOf = id => { const sp = PC.ui.spec && PC.ui.spec[id] || { o: PR[id].opts.map(() => 0), q: 1 }; return { spec: PR[id].opts.map((o, k) => o[1][sp.o[k]]).join(' · '), q: sp.q }; };
  ACT.addSpec = el => { const s = specOf(el.dataset.id); PC.addToCart(el.dataset.id, s.spec, s.q, null); PC.toast('已加入购物车，角标 +' + s.q); PC.refresh(); };
  ACT.buyNow = el => { const s = specOf(el.dataset.id); S.checkout = { items: [{ pid: el.dataset.id, qty: s.q, spec: s.spec }], from: 'buy', delivery: 'home', coupon: true }; PC.save(); PC.go('/checkout'); };

  /* ---------- S3 购物车 ---------- */
  PC.route('/cart', () => {
    const manage = PC.ui.manage, cart = S.cart;
    const groups = {};
    cart.forEach((l, i) => { const k = l.from || '_'; (groups[k] = groups[k] || []).push([l, i]); });
    const order = Object.keys(groups).sort((a, b) => a === '_' ? 1 : b === '_' ? -1 : 0);
    const line = ([l, i]) => '<div class="py-10 bt-line row gap10"><button class="ck ' + (l.checked ? 'on' : '') + '" data-act="cartCk" data-i="' + i + '" role="checkbox" aria-checked="' + l.checked + '" aria-label="选择">' + (l.checked ? ic('check', 13, 3) : '') + '</button><button data-act="go" data-to="/product/' + l.pid + '">' + thumb(l.pid, 56, 56, 24) + '</button><div class="grow"><b class="fs-14">' + esc(PR[l.pid].name) + '</b><div class="fs-11-5 sub">' + esc(l.spec) + '</div>' + sample() + '<div class="row between mt4">' + price(PR[l.pid].price) + (manage ? '<button class="btn xs sec danger" data-act="cartDel" data-i="' + i + '">' + ic('trash', 13, 2) + '删除</button>' : '<span class="qty"><button data-act="cartQty" data-i="' + i + '" data-d="-1" aria-label="减少">' + ic('minus', 12, 2.6) + '</button>' + l.qty + '<button data-act="cartQty" data-i="' + i + '" data-d="1" aria-label="增加">' + ic('plus', 12, 2.6) + '</button></span>') + '</div></div></div>';
    const body = order.map(k => {
      const items = groups[k], all = items.every(x => x[0].checked), r = k === '_' ? null : PC.getRoute(k);
      return '<div class="card mt12"><div class="row gap8"><button class="ck ' + (all ? 'on' : '') + '" data-act="cartGroup" data-k="' + k + '" role="checkbox" aria-checked="' + all + '" aria-label="整组选择">' + (all ? ic('check', 13, 3) : '') + '</button>' + (r ? '<span class="tag official">来自路线</span><b class="fs-13 grow">' + esc(r.name) + ' · 装备包</b>' : '<b class="fs-13 grow">其他商品</b>') + '<span class="sub">' + items.reduce((n, x) => n + x[0].qty, 0) + ' 件</span></div>' + items.map(line).join('') + '</div>';
    }).join('');
    const sel = cart.filter(l => l.checked), sub = PC.sum(sel), n = sel.reduce((a, l) => a + l.qty, 0), allSel = cart.length && cart.every(l => l.checked);
    const hint = sub >= PC.COUPON_MIN ? '已满 ' + PC.hk(PC.COUPON_MIN) + '，结算时可用示例优惠券减 ' + PC.hk(PC.COUPON) : '满 ' + PC.hk(PC.COUPON_MIN) + ' 可用示例优惠券减 ' + PC.hk(PC.COUPON) + '（还差 ' + PC.hk(Math.max(0, PC.COUPON_MIN - sub)) + '）';
    const sumHtml = '<div class="card stickycol"><div class="row between"><span class="muted">商品小计（' + n + ' 件）</span><b>' + PC.hk(sub) + '</b></div><div class="fs-11-5 callout soft mt8">' + ic('ticket', 14, 2) + '<span>' + hint + '</span></div><div class="row between mt12"><span>合计</span><b class="fs-20">' + PC.hk(sub) + '</b></div><div class="fs-11 sub">不含配送费 · 金额均为示例</div><button class="btn prim block mt12" data-act="toCheckout" ' + (n ? '' : 'disabled') + '>去结算（' + n + '）</button></div>';
    const page = mhead('购物车', '/mall', '<button class="fs-13 px-8 h-40 b" data-act="manage">' + (manage ? '完成' : '管理') + '</button>') + (cart.length ?
      '<div class="split side"><div>' + body + '<div class="fs-11-5 callout soft mt12">' + ic('info', 14, 2) + '<span>' + PC.SAMPLE + '；价格为示例价，不含真实优惠。</span></div></div><div><div class="desk-only">' + sumHtml + '</div></div></div>' +
      '<div class="cartbar mob-only mt12"><button class="row gap8" data-act="cartAll" role="checkbox" aria-checked="' + !!allSel + '"><span class="ck ' + (allSel ? 'on' : '') + '">' + (allSel ? ic('check', 13, 3) : '') + '</span>全选</button><span class="ta-r fs-12 grow">合计 <b class="fs-18">' + PC.hk(sub) + '</b><br><span class="fs-10 sub">不含配送费 · 示例</span></span><button class="minw-110 btn prim" data-act="toCheckout" ' + (n ? '' : 'disabled') + '>去结算（' + n + '）</button></div>'
      : '<div class="pt-60 empty"><div class="h2">购物车是空的</div><p class="sub mt8">去商城逛逛，或从路线详情一键加购装备包</p><button class="btn prim mt16" data-act="go" data-to="/mall">去商城</button></div>');
    return mall('购物车', page, { pageClass: 'mid' });
  });
  ACT.manage = () => { PC.ui.manage = !PC.ui.manage; PC.refresh(); };
  ACT.cartCk = el => { const l = S.cart[+el.dataset.i]; l.checked = !l.checked; PC.save(); PC.refresh(); };
  ACT.cartGroup = el => { const k = el.dataset.k === '_' ? null : el.dataset.k, g = S.cart.filter(l => (l.from || null) === k), all = g.every(l => l.checked); g.forEach(l => { l.checked = !all; }); PC.save(); PC.refresh(); };
  ACT.cartAll = () => { const all = S.cart.every(l => l.checked); S.cart.forEach(l => { l.checked = !all; }); PC.save(); PC.refresh(); };
  ACT.cartDel = el => { S.cart.splice(+el.dataset.i, 1); PC.save(); PC.refresh(); PC.toast('已删除'); };
  ACT.cartQty = (el, e) => {
    const l = S.cart[+el.dataset.i], d = +el.dataset.d;
    if (l.qty + d <= 0) { PC.confirm('把「' + esc(PR[l.pid].name) + '」从购物车删除？', () => { S.cart.splice(S.cart.indexOf(l), 1); PC.save(); PC.refresh(); }, '删除'); return; }
    l.qty = Math.min(99, l.qty + d); PC.save(); PC.refresh();
  };
  ACT.toCheckout = () => {
    const sel = S.cart.filter(l => l.checked);
    if (!sel.length) { PC.toast('先勾选要结算的商品'); return; }
    S.checkout = { items: sel.map(l => ({ pid: l.pid, qty: l.qty, spec: l.spec })), from: 'cart', fromRoute: (sel.find(l => l.from) || {}).from || null, delivery: 'home', coupon: true };
    PC.save(); PC.go('/checkout');
  };

  /* ---------- S4 确认订单 ---------- */
  const ADDR = [['宠主小 Z', '+852 ●●●● ●●●●', '香港 九龙 西九龙 示例街 1 号 示例大厦 12 楼（示例地址）'], ['宠主小 Z', '+852 ●●●● ●●●●', '香港 九龙 油尖旺 示例路 8 号 示例中心 5 楼（示例地址）']];
  PC.route('/checkout', () => {
    const c = S.checkout;
    if (!c || !c.items.length) return mall('确认订单', mhead('确认订单', '/cart', false) + '<div class="pt-60 empty"><div class="h2">没有要结算的商品</div><button class="btn prim mt16" data-act="go" data-to="/cart">回到购物车</button></div>');
    const a = ADDR[c.addr || 0], am = PC.orderAmounts(c.items, c.delivery, c.coupon);
    const shown = PC.ui.ckAll ? c.items : c.items.slice(0, 3);
    const dopt = (k, t, sub, fee) => '<button class="w-full py-11 bt-line ta-l row gap10" data-act="ckDeliv" data-k="' + k + '" role="radio" aria-checked="' + (c.delivery === k) + '"><span class="radio ' + (c.delivery === k ? 'on' : '') + '">' + (c.delivery === k ? ic('check', 13, 3) : '') + '</span>' + ic(k === 'home' ? 'truck' : 'pin', 18, 1.8) + '<span class="grow"><b class="fs-14">' + t + '</b><span class="d-block fs-11-5 sub">' + sub + '</span></span><b>' + fee + '</b></button>';
    const amt = '<div class="fs-13 row between"><span>商品小计（' + c.items.reduce((n, i) => n + i.qty, 0) + ' 件）</span><span>' + PC.hk(am.sub) + '</span></div><div class="fs-13 row between mt4"><span>配送费</span><span>' + PC.hk(am.ship) + '</span></div><div class="fs-13 row between mt4"><span>示例优惠券</span><span>−' + PC.hk(am.cp) + '</span></div><div class="hr mt8"></div><div class="row between mt8"><b>合计</b><b class="fs-20">' + PC.hk(am.total) + '</b></div><div class="fs-11 mt-4 sub">金额均为示例，仅供演示，不会扣款</div>';
    const left = '<button class="w-full ta-l card click row gap10" data-act="ckAddr">' + ic('pin', 18, 1.8) + '<span class="grow"><b>' + a[0] + '</b> <span class="fs-12 muted">' + a[1] + '</span> <span class="h-17 fs-10 tag official">默认</span><span class="d-block fs-12 sub">' + a[2] + '</span></span>' + ic('right', 16, 2) + '</button>' +
      '<div class="card mt12"><div class="mb-2 b">配送方式 <span class="fw-4 sub">（示例）</span></div>' + dopt('home', '送货上门', '预计 2–3 天 · 示例', PC.hk(PC.SHIP)) + dopt('pickup', '便利店 / 智能柜自取', '预计 2–3 天 · 示例', '免费') + '</div>' +
      '<div class="card mt12"><div class="mb-4 b">商品清单（共 ' + c.items.reduce((n, i) => n + i.qty, 0) + ' 件）' + (c.fromRoute ? ' · 来自路线「' + esc((PC.getRoute(c.fromRoute) || { name: '本路线' }).name) + '」' : '') + '</div>' +
      shown.map(i => '<div class="py-8 bt-line row gap10">' + thumb(i.pid, 50, 50, 22) + '<div class="grow"><b class="fs-13-5">' + esc(PR[i.pid].name) + '</b><div class="fs-11-5 sub">' + esc(i.spec) + '</div>' + sample() + '</div><div class="ta-r"><b>' + PC.hk(PR[i.pid].price) + '</b><div class="sub">×' + i.qty + '</div></div></div>').join('') + (c.items.length > 3 ? '<button class="u sub mt8" data-act="ckMore">' + (PC.ui.ckAll ? '收起' : '展开其余 ' + (c.items.length - 3) + ' 件') + '</button>' : '') + '</div>' +
      '<button class="w-full ta-l card click row gap10 mt12" data-act="ckCoupon" role="switch" aria-checked="' + !!c.coupon + '">' + ic('ticket', 18, 1.8) + '<span class="grow"><b>优惠券</b><span class="d-block fs-11-5 sub">示例优惠券 · 满 ' + PC.hk(PC.COUPON_MIN) + ' 减 ' + PC.hk(PC.COUPON) + (am.sub < PC.COUPON_MIN ? '（未满足）' : '') + '</span></span><b>' + (c.coupon && am.sub >= PC.COUPON_MIN ? '−' + PC.hk(PC.COUPON) : '不使用') + '</b></button>';
    const page = mhead('确认订单', c.from === 'cart' ? '/cart' : '/mall', false) + '<div class="split side"><div>' + left + '<div class="card mt12 mob-only"><div class="mb-6 b">金额明细</div>' + amt + '</div></div>' +
      '<div class="desk-only"><div class="card stickycol"><div class="mb-10 h2">订单摘要</div>' + amt + '<button class="btn prim block mt16" data-act="ckSubmit">提交订单</button><div class="fs-11 sub center mt8">支付为点击模拟 · ' + SAMPLE + '</div></div></div></div>' +
      '<div class="buybar mob-only mt16"><div><div class="fs-11 sub">应付（示例）</div><b class="fs-21">' + PC.hk(am.total) + '</b></div><button class="btn prim grow" data-act="ckSubmit">提交订单</button></div>';
    return mall('确认订单', page, { pageClass: 'mid' });
  });
  ACT.ckDeliv = el => { S.checkout.delivery = el.dataset.k; PC.save(); PC.refresh(); };
  ACT.ckMore = () => { PC.ui.ckAll = !PC.ui.ckAll; PC.refresh(); };
  ACT.ckCoupon = () => {
    const c = S.checkout, am = PC.orderAmounts(c.items, c.delivery, true);
    if (am.sub < PC.COUPON_MIN) { PC.toast('示例：商品满 ' + PC.hk(PC.COUPON_MIN) + ' 才可使用示例优惠券'); return; }
    c.coupon = !c.coupon; PC.save(); PC.refresh();
  };
  ACT.ckAddr = () => PC.modal(() => PC.sheetTitle('选择收货地址', '示例地址，已打码') + ADDR.map((a, i) => '<button class="paycard ' + ((S.checkout.addr || 0) === i ? 'on' : '') + '" data-act="ckAddrPick" data-i="' + i + '"><span class="grow"><b>' + a[0] + '</b> <span class="fs-12 muted">' + a[1] + '</span><span class="d-block fs-12 sub">' + a[2] + '</span></span><span class="radio ' + ((S.checkout.addr || 0) === i ? 'on' : '') + '">' + ((S.checkout.addr || 0) === i ? ic('check', 13, 3) : '') + '</span></button>').join(''));
  ACT.ckAddrPick = el => { S.checkout.addr = +el.dataset.i; PC.save(); PC.closeModal(true); PC.refresh(); };
  ACT.ckSubmit = () => {
    const c = S.checkout, am = PC.orderAmounts(c.items, c.delivery, c.coupon);
    const id = 'DEMO-' + String(++S.orderSeq).padStart(6, '0');
    S.orders.unshift({ id, status: 'pending', items: c.items.map(i => Object.assign({}, i)), delivery: c.delivery, coupon: !!(c.coupon && am.sub >= PC.COUPON_MIN), addr: c.addr || 0, fromRoute: c.fromRoute || null, time: '示例 · 刚刚' });
    if (c.from === 'cart') S.cart = S.cart.filter(l => !l.checked);
    S.checkout = null; PC.ui.ckAll = false; PC.save();
    PC.go('/pay/' + id, { replace: true });
  };

  /* ---------- S5 支付（模拟） ---------- */
  const orderTotal = o => PC.orderAmounts(o.items, o.delivery, o.coupon).total;
  PC.route('/pay/:id', ({ id }) => {
    const o = S.orders.find(x => x.id === id);
    if (!o) return mall('支付', '<div class="empty">没有这个订单</div>');
    if (o.status !== 'pending') return { mode: 'page', nav: 'mall', tab: '', title: '订单', pageClass: 'narrow', page: '<div class="pt-60 empty"><div class="h2">这个订单已经支付</div><button class="btn prim mt16" data-act="go" data-to="/order/' + id + '" data-replace="1">查看订单</button></div>' };
    const m = PC.ui.payM || 'alipay', total = orderTotal(o);
    const page = '<div class="phead"><button class="circ-btn" data-act="payClose" aria-label="关闭，订单留在待付款">' + ic('x', 18, 2) + '</button><div class="t" id="main-h">收银台（模拟）</div><span class="w-40"></span></div>' +
      '<div class="center" style="margin:8px 0 14px"><div class="fs-12 sub">应付金额（示例）</div><div class="fs-38 fw-7" style="letter-spacing:.02em">' + PC.hk(total) + '</div><div class="fs-11-5 sub">示例订单号 ' + o.id + ' · ' + o.items.reduce((n, i) => n + i.qty, 0) + ' 件示例商品</div></div>' +
      '<div class="mb-8 b">选择支付方式 <span class="fw-4 sub">（全部为模拟）</span></div>' +
      PC.PAYS.map(p => '<button class="paycard ' + (m === p[0] ? 'on' : '') + '" data-act="payPick" data-m="' + p[0] + '" role="radio" aria-checked="' + (m === p[0]) + '"><span class="glyph">' + p[3] + '</span><span class="grow"><b class="fs-14-5">' + p[1] + '</b><span class="fs-12 muted">' + p[2] + '</span><span class="d-block fs-11-5 sub">' + p[4] + '</span></span><span class="radio ' + (m === p[0] ? 'on' : '') + '">' + (m === p[0] ? ic('check', 13, 3) : '') + '</span></button>').join('') +
      '<div class="fs-11-5 callout warn">' + ic('lock', 15, 2) + '<span>这是点击模拟：不产生真实扣款，请勿输入真实卡号或密码。页面不使用任何支付品牌的官方标志。</span></div>' +
      '<button class="btn prim block mt16" data-act="payGo">模拟支付 ' + PC.hk(total) + '</button>';
    return { mode: 'page', nav: 'mall', tab: '', title: '收银台（模拟）', pageClass: 'narrow paydialog', page };
  });
  ACT.payPick = el => { PC.ui.payM = el.dataset.m; PC.refresh(); };
  ACT.payClose = () => { PC.toast('订单已留在「待付款」'); PC.go('/orders?f=pending', { replace: true }); };
  ACT.payGo = () => {
    const id = PC.cur.path.split('/').pop(), o = S.orders.find(x => x.id === id), m = PC.PAYS.find(p => p[0] === (PC.ui.payM || 'alipay'));
    PC.modal(() => '<div class="py-14 dlg center"><div class="spin"></div><div class="b mt16">模拟支付中…（' + m[1] + '）</div><div class="sub mt4">不会产生真实扣款</div></div>', { cls: 'small' });
    setTimeout(() => { o.status = 'paid'; o.method = m[1]; o.time = '示例 · 刚刚'; PC.save(); PC.closeModal(true); PC.go('/order/' + id, { replace: true }); }, 1100);
  };

  /* ---------- S6 支付成功 + 订单详情 ---------- */
  const STEPS = ['已付款', '备货中', '配送中', '已送达'], STI = { paid: 0, prep: 1, ship: 2, done: 3 };
  PC.route('/order/:id', ({ id }) => {
    const o = S.orders.find(x => x.id === id);
    if (!o) return mall('订单', mhead('订单详情', '/orders', false) + '<div class="empty">没有这个订单</div>');
    const am = PC.orderAmounts(o.items, o.delivery, o.coupon), cur = STI[o.status], a = ADDR[o.addr || 0];
    const head = o.status === 'pending' ?
      '<div class="bg-sage card center"><div class="h2">待付款</div><div class="sub mt4">示例订单 · 尚未支付</div><button class="d-iflex btn prim mt12" data-act="go" data-to="/pay/' + o.id + '">去支付</button></div>' :
      '<div class="bg-khaki mx-n2 r-18 center" style="padding:16px 10px"><div class="w-54 h-54 bg-prim c-white d-flex ai-c jc-c" style="border-radius:50%;margin:0 auto">' + ic('check', 30, 3) + '</div><div class="h2 mt8">' + (cur === 0 ? '支付成功（模拟）' : o.status === 'done' ? '订单已送达' : '订单进行中') + '</div><div class="fs-12 sub">已付 ' + PC.hk(am.total) + ' · ' + esc(o.method || '模拟支付') + '（模拟）</div></div>';
    const prog = o.status === 'pending' ? '' : '<div class="card mt12"><div class="prog4">' + STEPS.map((s, i) => '<div class="s ' + (i <= cur ? 'on' : '') + (i === cur ? ' cur' : '') + '"><i>' + (i < cur ? ic('check', 13, 3) : i + 1) + '</i>' + s + '</div>').join('') + '</div><div class="fs-11-5 sub center">预计 2–3 天送达（示例）</div>' + (o.status !== 'done' ? '<div class="center mt8"><button class="chip sm" data-act="advOrder" data-id="' + o.id + '">' + ic('skip', 12, 2) + '演示：模拟推进订单状态</button></div>' : '') + '</div>';
    const det = '<div class="card mt12"><div class="row between"><b>订单详情</b><span class="fs-11-5 sub">示例订单号 ' + o.id + '</span></div>' + o.items.map(i => '<div class="py-8 bt-line row gap10">' + thumb(i.pid, 48, 48, 22) + '<div class="grow"><b class="fs-13-5">' + esc(PR[i.pid].name) + '</b><div class="fs-11-5 sub">' + esc(i.spec) + '</div>' + sample() + '</div><div class="ta-r"><b>' + PC.hk(PR[i.pid].price) + '</b><div class="sub">×' + i.qty + '</div></div></div>').join('') +
      '<div class="hr mt4"></div><div class="fs-13 row between mt8"><span>商品小计</span><span>' + PC.hk(am.sub) + '</span></div><div class="fs-13 row between mt4"><span>配送费</span><span>' + PC.hk(am.ship) + '</span></div><div class="fs-13 row between mt4"><span>示例优惠券</span><span>−' + PC.hk(am.cp) + '</span></div><div class="row between mt8"><b>实付</b><b class="fs-19">' + PC.hk(am.total) + '</b></div></div>' +
      '<div class="card mt12 row gap10">' + ic('pin', 18, 1.8) + '<span class="grow"><b>' + a[0] + ' · ' + (o.delivery === 'home' ? '送货上门' : '便利店 / 智能柜自取') + '</b><span class="d-block fs-12 sub">' + a[2] + '</span></span></div>';
    const btns = '<div class="row gap10 mt16"><button class="btn sec flex1" data-act="go" data-to="/orders" data-replace="1">查看我的订单</button><button class="btn prim flex1" data-act="backRoute" data-id="' + (o.fromRoute || '') + '">回到路线</button></div>';
    const page = mhead('订单详情', '/orders', false) + '<div class="split side"><div class="mob-only">' + head + prog + det + btns + '</div><div class="desk-only">' + det + '</div><div class="desk-only stickycol">' + head + prog + btns + '</div></div><p class="fs-11-5 sub center mt16">' + SAMPLE + ' · 全部为示例订单</p>';
    return mall('订单详情', page, { pageClass: 'mid' });
  });
  ACT.advOrder = el => { const o = S.orders.find(x => x.id === el.dataset.id), seq = ['paid', 'prep', 'ship', 'done']; o.status = seq[Math.min(3, seq.indexOf(o.status) + 1)]; PC.save(); PC.refresh(); };
  ACT.backRoute = el => { PC.go(el.dataset.id ? '/route/' + el.dataset.id : '/map', { replace: true }); };

  /* ---------- S7 我的订单 ---------- */
  PC.route('/orders', (p, q) => {
    if (q.f) { PC.ui.ordF = { pending: '待付款', prep: '备货 / 配送', ship: '备货 / 配送', done: '已完成' }[q.f] || '全部'; }
    const F = PC.ui.ordF || '全部', tabs = ['全部', '待付款', '备货 / 配送', '已完成'];
    const ok = o => F === '全部' || (F === '待付款' && o.status === 'pending') || (F === '备货 / 配送' && ['paid', 'prep', 'ship'].indexOf(o.status) >= 0) || (F === '已完成' && o.status === 'done');
    const list = S.orders.filter(ok);
    const tagCls = { pending: 'ghost', paid: 'official', prep: 'official', ship: 'official', done: 'ghost' };
    const card = o => {
      const am = PC.orderAmounts(o.items, o.delivery, o.coupon), n = o.items.reduce((a, i) => a + i.qty, 0);
      return '<div class="card"><div class="row between"><span class="fs-11-5 sub">示例订单 ' + o.id + '</span><span class="tag ' + tagCls[o.status] + '">' + PC.ORDER_ST[o.status] + '</span></div><div class="ai-c row gap6 mt8">' + o.items.slice(0, 4).map(i => thumb(i.pid, 44, 44, 20)).join('') + '<span class="grow"></span><span class="sub">共 ' + n + ' 件</span></div><div class="mt8">' + sample() + '</div><div class="fw-wrap gap-8 row between mt8"><span>实付 <b class="fs-17">' + PC.hk(am.total) + '</b> <span class="fs-10 sub">示例价</span></span><span class="row gap6">' +
        (o.status === 'pending' ? '<button class="btn xs sec" data-act="orderCancel" data-id="' + o.id + '">取消</button><button class="btn xs prim" data-act="go" data-to="/pay/' + o.id + '">去支付</button>' : '<button class="btn xs sec" data-act="go" data-to="/order/' + o.id + '">查看详情</button><button class="btn xs prim" data-act="reorder" data-id="' + o.id + '">再买一单</button>') + '</span></div></div>';
    };
    const page = mhead('我的订单', '/me', false) + '<div class="opts" role="tablist">' + tabs.map(t => '<button class="chip ' + (F === t ? 'sel' : '') + '" data-act="ordF" data-f="' + t + '" role="tab">' + t + '</button>').join('') + '</div><div class="d-grid gap-12 mt12" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">' +
      (list.length ? list.map(card).join('') : '<div class="empty" style="grid-column:1/-1">这里还没有订单</div>') + '</div><p class="fs-11-5 sub center mt16">以上均为示例订单，' + SAMPLE + '。</p>';
    return mall('我的订单', page, { pageClass: 'mid' });
  });
  // 切换标签时把网址里的 ?f= 去掉，否则每次重绘都会被网址参数改回去
  ACT.ordF = el => { PC.ui.ordF = el.dataset.f; if (PC.cur.q.f) history.replaceState({ d: PC.depth() }, '', '#/orders'); PC.cur.q = {}; PC.refresh(); };
  ACT.orderCancel = el => PC.confirm('取消这个示例订单？', () => { S.orders = S.orders.filter(o => o.id !== el.dataset.id); PC.save(); PC.refresh(); PC.toast('订单已取消（示例）'); }, '取消订单', '再想想');
  ACT.reorder = el => { const o = S.orders.find(x => x.id === el.dataset.id); o.items.forEach(i => PC.addToCart(i.pid, i.spec, i.qty, null)); PC.toast('已把同样的商品加入购物车'); PC.go('/cart'); };
})(window.PC);
