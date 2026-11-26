/* 社区 P8–P11、我的 P12 */
(function (PC) {
  'use strict';
  const { $, esc, ic, S, ACT, INPUT } = PC;
  const V = PC.V;
  const ME = '宠主小 Z';
  const allPosts = () => S.posts.concat(PC.SEED_POSTS);
  const getPost = id => allPosts().find(p => p.id === id);
  const repliesOf = id => { const p = getPost(id); return (p && p.replies || []).concat((S.replies[id] || []).map(r => [r.u, r.t])); };
  const TINT = ['#c5e1b8', '#f6dcb4', '#dde6c4'];
  const picture = (tint, n) => '<div style="position:relative;height:' + (n || 150) + 'px;border-radius:14px;overflow:hidden;background:' + TINT[tint % 3] + ';display:flex;align-items:center;justify-content:center">' + PC.dog(86, true) + '<span class="pos-abs right-8 bottom-8 sample">示例图片</span></div>';
  const attach = p => {
    if (p.route) { const r = PC.getRoute(p.route); return r ? '<button class="fs-12 row gap6 sub u" data-act="go" data-to="/route/' + r.id + '">' + ic('map', 13, 2) + esc(r.name) + '</button>' : ''; }
    if (p.place) return '<button class="fs-12 row gap6 sub u" data-act="go" data-to="/place/' + p.place + '">' + ic('pin', 13, 2) + esc(PC.poi(p.place).name) + '</button>';
    return '';
  };
  // 帖子 / 活动卡片：用 PC.html 模板，帖子文字、用户名等会自动转义
  const { html, raw } = PC;
  const selStyle = on => 'margin-bottom:12px;' + (on ? 'outline:2px solid var(--prim)' : '');
  function postCard(p, selId) {
    const n = repliesOf(p.id).length, liked = S.likes[p.id];
    return html`<div class="card click" style="${selStyle(selId === p.id)}" role="button" tabindex="0" data-act="go" data-to="/post/${p.id}">
<div class="mb-8 row gap10"><span class="bg-cream no-shadow w-36 h-36 circ-btn">${raw(PC.pawheart(18))}</span>
<div class="grow"><b class="fs-14">${p.user}</b><div class="fs-11-5 sub">${p.pet} · ${p.time}</div></div><span class="sample">示例帖子</span></div>
${raw(picture(p.tint || 0, 128))}<div class="my-8 fs-13-5 lh-1-5">${p.text}</div>
<div class="row between"><span>${raw(attach(p))}</span><span class="fs-12 sub row gap10"><span class="row gap4">${raw(ic('up2', 14, 2))}${p.likes + (liked ? 1 : 0)}</span><span class="row gap4">${raw(ic('msg', 14, 2))}${n}</span></span></div></div>`;
  }
  function eventCard(e, selId) {
    const pl = PC.poi(e.place), on = S.signups.some(s => s.eid === e.id);
    return html`<div class="card click" style="${selStyle(selId === e.id)}" role="button" tabindex="0" data-act="go" data-to="/event/${e.id}">
<div class="row gap6"><span class="tag official">平台活动</span><span class="tag ghost">示例</span>${on && raw('<span class="tag dark">已报名</span>')}</div>
<div class="fs-15-5 b mt8">${e.name}</div><div class="sub mt4">${e.date} ${e.time} · ${pl.name}</div>
<div class="sub">还剩 ${e.left - (on ? 1 : 0)} / ${e.total} 个名额 · 适合 ${e.fit}</div></div>`;
  }

  /* ---------- 社区（含桌面分栏） ---------- */
  function community(kind, id) {
    const desk = PC.isDesktop(), tab = PC.ui.commTab || 'posts';
    const e1 = PC.EVENTS.e1;
    const list = '<div class="phead"><div class="fs-24 t l tabtitle" id="' + (kind ? '' : 'main-h') + '" style="font-weight:300;letter-spacing:.14em">社区</div><button class="bg-soft no-shadow circ-btn" data-act="demo" data-msg="示例：搜索在演示版中仅作展示" aria-label="搜索">' + ic('search', 18, 2) + '</button></div>' +
      '<div class="seg"><button class="' + (tab === 'posts' ? 'on' : '') + '" data-act="commTab" data-t="posts">帖子</button><button class="' + (tab === 'events' ? 'on' : '') + '" data-act="commTab" data-t="events">活动</button></div>' +
      '<button class="w-full ta-l ai-c bg-sage callout mt12" data-act="go" data-to="/event/e1">' + ic('cal', 18, 1.8) + '<span class="grow"><span class="fs-11 d-block">近期平台活动 · 报名中</span><b class="fs-14">' + esc(e1.name) + '</b></span>' + ic('right', 16, 2) + '</button>' +
      '<div class="mt12">' + (tab === 'posts' ? allPosts().map(p => postCard(p, kind === 'post' ? id : null)).join('') : Object.values(PC.EVENTS).map(e => eventCard(e, kind === 'event' ? id : null)).join('')) + '</div>' +
      (tab === 'posts' ? '<div class="pos-sticky bottom-78 d-flex jc-e no-events"><button class="h-46 btn prim" style="pointer-events:auto" data-act="go" data-to="/post/new">' + ic('plus', 16, 2.6) + '发帖</button></div>' : '');
    let detail = '';
    if (kind === 'post') detail = postDetail(id, desk);
    else if (kind === 'new') detail = postNew(desk);
    else if (kind === 'event') detail = eventDetail(id, desk);
    if (!desk) {
      return { mode: 'page', nav: 'community', tab: kind ? '' : 'community', title: '社区', pageClass: 'narrow', page: kind ? detail : list };
    }
    return { mode: 'page', nav: 'community', tab: '', title: '社区', pageClass: '', page: '<div class="split comm"><div>' + list + '</div><div class="stickycol">' + (detail || '<div class="card flat empty" style="padding:60px 20px">' + PC.dog(70) + '<div class="mt8">选一个帖子或活动，在这里查看详情</div></div>') + '</div></div>' };
  }
  PC.route('/community', () => community(null));
  PC.route('/post/new', () => community('new'));
  PC.route('/post/:id', p => community('post', p.id));
  PC.route('/event/:id', p => community('event', p.id));
  ACT.commTab = el => { PC.ui.commTab = el.dataset.t; PC.refresh(); };

  function postDetail(id, desk) {
    const p = getPost(id); if (!p) return '<div class="empty">帖子不存在</div>';
    const liked = S.likes[id], reps = repliesOf(id), fav = S.likes['f' + id];
    return (desk ? '' : V.phead('帖子', { back: '/community' })) + (desk ? '<h1 class="hide" id="main-h">帖子详情</h1>' : '') +
      '<div class="row gap10"><span class="bg-soft no-shadow circ-btn">' + PC.pawheart(18) + '</span><div class="grow"><b>' + esc(p.user) + '</b><div class="fs-11-5 sub">' + esc(p.pet) + ' · ' + esc(p.time) + '</div></div><button class="chip sm" data-act="demo" data-msg="示例：已关注（演示版不保存）">关注</button></div>' +
      '<div class="mt12">' + picture(p.tint || 0, 190) + '</div><p class="my-12 fs-14-5 lh-1-6">' + esc(p.text) + '</p><span class="sample">示例帖子，非真实用户内容</span>' +
      (p.place ? '<button class="w-full ta-l card click mt12 row gap10" data-act="go" data-to="/place/' + p.place + '">' + ic('pin', 18, 1.8) + '<span class="grow"><b class="fs-14">' + esc(PC.poi(p.place).name) + '</b><span class="d-block fs-11-5 sub">' + PC.poi(p.place).type + ' · 被 ' + V.routesOfPoi(p.place).length + ' 条路线收录</span></span>' + ic('right', 16, 2) + '</button>' : '') +
      (p.route ? '<button class="w-full ta-l card click mt12 row gap10" data-act="go" data-to="/route/' + p.route + '">' + ic('map', 18, 1.8) + '<span class="grow"><b class="fs-14">' + esc(PC.getRoute(p.route).name) + '</b><span class="d-block fs-11-5 sub">' + PC.routeStats(PC.getRoute(p.route)).km + ' · ' + PC.getRoute(p.route).stops.length + ' 站</span></span>' + ic('right', 16, 2) + '</button>' : '') +
      '<div class="gap-18 fs-13 row gap16 mt12"><button class="row gap6" data-act="like" data-id="' + id + '" aria-pressed="' + !!liked + '" style="' + (liked ? 'color:var(--prim);font-weight:700' : '') + '">' + ic('up2', 16, 2) + (p.likes + (liked ? 1 : 0)) + '</button><button class="row gap6" data-act="like" data-id="f' + id + '" aria-pressed="' + !!fav + '" style="' + (fav ? 'color:var(--prim);font-weight:700' : '') + '">' + ic('star', 16, 2) + (fav ? '已收藏' : '收藏') + '</button></div>' +
      '<div class="hr mt12"></div><div class="fs-13 b mt12">' + reps.length + ' 条回复</div>' +
      reps.map(r => '<div class="py-10 ai-s bb-line row gap10"><span class="w-30 h-30 no-shadow bg-soft circ-btn">' + PC.pawheart(14) + '</span><div><b class="fs-13">' + esc(r[0]) + '</b><div class="fs-13-5 mt-2">' + esc(r[1]) + '</div></div></div>').join('') +
      '<div class="row gap6 wrap mt12">' + PC.QUICK_REPLIES.map(q => '<button class="chip sm" data-act="quickReply" data-t="' + q + '">' + q + '</button>').join('') + '</div>' +
      '<form class="row gap8 mt8" data-act="noop" onsubmit="return false"><input class="h-42 field" id="replyIn" placeholder="说点什么…" maxlength="80" aria-label="回复内容"><button type="button" class="h-42 btn prim sm" data-act="sendReply" data-id="' + id + '">发送</button></form>';
  }
  ACT.like = el => { const k = el.dataset.id; S.likes[k] = !S.likes[k]; PC.save(); PC.refresh(); };
  ACT.quickReply = el => { const i = $('#replyIn'); i.value = el.dataset.t; i.focus(); };
  ACT.sendReply = el => {
    const i = $('#replyIn'), t = i.value.trim();
    if (!t) { PC.toast('先写点什么再发送'); i.focus(); return; }
    (S.replies[el.dataset.id] = S.replies[el.dataset.id] || []).push({ u: ME, t }); PC.save(); PC.refresh(); PC.toast('回复已发布（示例，仅保存在本机）');
  };

  function postNew(desk) {
    const D = PC.ui.postDraft || (PC.ui.postDraft = { text: '', route: null, place: null, photos: 0, tags: [], pet: S.petId });
    const att = [['p1', 'place'], ['p6', 'place'], ['r1', 'route'], ['r2', 'route']].concat(S.favs.filter(f => f !== 'p1' && f !== 'p6').map(f => [f, 'place'])).concat(S.myRoutes.map(r => [r.id, 'route']));
    const isSel = (id, k) => D[k] === id;
    return (desk ? '<h1 class="hide" id="main-h">发帖</h1>' : V.phead('发帖', { back: '/community' })) + (desk ? '<div class="mb-10 h2">发帖</div>' : '') +
      '<div class="row gap8 wrap">' + Array.from({ length: D.photos }, () => '<div class="w-84 h-84 r-14 ov-h d-flex ai-c jc-c pos-rel" style="background:#c5e1b8">' + PC.dog(54, true) + '<span class="pos-abs bottom-2 left-2 fs-8 h-14 px-4 sample">示例图片</span></div>').join('') + (D.photos < 4 ? '<button class="w-84 h-84 r-14 fd-col gap-2 fs-11 c-muted dash thumb" data-act="postPhoto">' + ic('plus', 20, 1.8) + '加照片</button>' : '') + '</div>' +
      '<textarea class="field mt12" rows="4" data-input="postText" placeholder="分享一下今天去了哪里、好不好玩…" maxlength="200" aria-label="帖子内容">' + esc(D.text) + '</textarea>' +
      '<div class="lbl">挂上地点或路线</div><div class="opts">' + att.map(a => { const nm = a[1] === 'place' ? PC.poi(a[0]).name : PC.getRoute(a[0]).name; return '<button class="chip ' + (isSel(a[0], a[1]) ? 'sel' : '') + '" data-act="postAtt" data-id="' + a[0] + '" data-k="' + a[1] + '">' + esc(nm.replace('（示例）', '')) + '</button>'; }).join('') + '</div>' +
      '<div class="lbl">谁一起去的</div><div class="opts">' + S.pets.map(p => '<button class="chip ' + (D.pet === p.id ? 'sel' : '') + '" data-act="postPet" data-id="' + p.id + '">' + V.petLabel(p) + '</button>').join('') + '</div>' +
      '<div class="lbl">加个标签</div><div class="opts">' + ['萌宠', '探店', '求同行', '路线打卡'].map(t => '<button class="chip ' + (D.tags.indexOf(t) >= 0 ? 'sel' : '') + '" data-act="postTag" data-t="' + t + '">#' + t + '</button>').join('') + '</div>' +
      '<div class="callout soft mt16">' + ic('info', 14, 2) + '<span>示例：帖子只保存在本机，不会发布到任何服务器。</span></div>' +
      '<button class="btn prim block mt16" data-act="postPublish">发布</button>';
  }
  INPUT.postText = el => { PC.ui.postDraft.text = el.value; };
  ACT.postPhoto = () => { PC.ui.postDraft.photos++; PC.refresh(); };
  ACT.postAtt = el => { const D = PC.ui.postDraft, k = el.dataset.k, was = D[k] === el.dataset.id; D.place = null; D.route = null; if (!was) D[k] = el.dataset.id; PC.refresh(); };
  ACT.postPet = el => { PC.ui.postDraft.pet = el.dataset.id; PC.refresh(); };
  ACT.postTag = el => { const a = PC.ui.postDraft.tags, i = a.indexOf(el.dataset.t); if (i >= 0) a.splice(i, 1); else a.push(el.dataset.t); PC.refresh(); };
  ACT.postPublish = () => {
    const D = PC.ui.postDraft, t = (D.text || '').trim();
    if (!t && !D.photos) { PC.toast('写点文字或加张照片再发布吧'); return; }
    const pet = S.pets.find(p => p.id === D.pet) || PC.pet();
    S.posts.unshift({ id: 'u' + Date.now(), user: ME, pet: V.petLabel(pet).replace(esc(pet.name) + ' · ', pet.name + ' · '), time: '刚刚', text: (t || '（只有照片）') + (D.tags.length ? ' ' + D.tags.map(x => '#' + x).join(' ') : ''), place: D.place, route: D.route, likes: 0, tint: 2, replies: [], mine: true });
    PC.ui.postDraft = null; PC.ui.commTab = 'posts'; PC.save();
    PC.toast('已发布（示例，仅保存在本机）'); PC.go('/community', { replace: true });
  };

  function eventDetail(id, desk) {
    const e = PC.EVENTS[id]; if (!e) return '<div class="empty">活动不存在</div>';
    const pl = PC.poi(e.place), on = S.signups.find(s => s.eid === id), pet = S.pets.find(p => p.id === (on ? on.petId : (PC.ui.evPet || S.petId))) || PC.pet();
    return (desk ? '<h1 class="hide" id="main-h">活动详情</h1>' : V.phead('活动详情', { back: '/community' })) +
      '<div class="h-120 r-18 pos-rel d-flex ai-c jc-c ov-h" style="background:#f6e6c8"><div class="pos-abs left-0 right-0 bottom-0 h-46" style="background:#e8b56c;border-radius:50% 50% 0 0/100% 100% 0 0"></div><div class="pos-rel">' + PC.dog(78, true) + '</div></div>' +
      '<div class="row gap6 mt12"><span class="tag official">平台活动</span><span class="tag ghost">示例</span></div><h1 class="fs-22 h1 mt8">' + esc(e.name) + '</h1>' +
      [['cal', '时间', e.date + ' ' + e.time], ['pin', '地点', '<button class="u" data-act="go" data-to="/place/' + e.place + '">' + esc(pl.name) + ' ›</button>'], ['users', '名额', '还剩 ' + (e.left - (on ? 1 : 0)) + ' / ' + e.total], ['heart', '适合', e.fit]].map(r => '<div class="py-10 bb-line fs-14 row gap10">' + (r[0] === 'heart' ? PC.pawheart(18) : ic(r[0], 18, 1.8)) + '<span class="w-40 muted">' + r[1] + '</span><span class="grow">' + r[2] + '</span></div>').join('') +
      '<p class="fs-13-5 lh-1-6 mt12">' + esc(e.desc) + '</p>' +
      '<div class="bg-soft card mt12 row gap10"><span class="w-34 h-34 no-shadow bg-cream circ-btn">' + PC.pawheart(18) + '</span><div class="grow"><div class="fs-11 sub">报名会使用宠物档案</div><b>' + V.petLabel(pet) + '</b></div>' + (S.pets.length > 1 && !on ? '<button class="fs-12 u" data-act="evPet" data-id="' + id + '">换一只</button>' : '') + '</div>' +
      '<button class="btn ' + (on ? 'sec' : 'prim') + ' block mt16" data-act="signup" data-id="' + id + '">' + (on ? '已报名 · 点此取消' : '一键报名') + '</button><p class="fs-11-5 sub center mt8">示例：报名只保存在本机，不会通知任何主办方。</p>';
  }
  ACT.evPet = () => { const i = S.pets.findIndex(p => p.id === (PC.ui.evPet || S.petId)); PC.ui.evPet = S.pets[(i + 1) % S.pets.length].id; PC.refresh(); };
  ACT.signup = el => {
    const id = el.dataset.id, i = S.signups.findIndex(s => s.eid === id);
    if (i >= 0) { S.signups.splice(i, 1); PC.toast('已取消报名'); }
    else { S.signups.push({ eid: id, petId: PC.ui.evPet || S.petId }); PC.toast('报名成功（示例）'); }
    PC.save(); PC.refresh();
  };

  /* ---------- 我的 ---------- */
  PC.route('/me', () => {
    const ord = k => S.orders.filter(o => k === 'pending' ? o.status === 'pending' : k === 'prep' ? (o.status === 'prep' || o.status === 'paid') : o.status === k).length;
    const tile = (ico, name, n, to) => '<button class="ta-l minh-76 card click" data-act="go" data-to="' + to + '">' + ic(ico, 20, 1.8) + '<div class="mt8"><b class="fs-14">' + name + '</b> <span class="sub">' + n + '</span></div></button>';
    const li = (ico, t, to) => '<button class="w-full h-50 bb-line fs-14 ta-l row between" data-act="go" data-to="' + to + '"><span class="row gap12">' + ic(ico, 18, 1.8) + t + '</span>' + ic('right', 16, 1.8) + '</button>';
    const st = (ico, lbl, k) => '<button class="ai-c gap-4 fs-12-5 flex-1 minh-56 pos-rel col" data-act="go" data-to="/orders?f=' + k + '"><span class="pos-rel d-flex">' + ic(ico, 22, 1.7) + (ord(k) ? '<span class="right-n9 top-n7 badge">' + ord(k) + '</span>' : '') + '</span>' + lbl + '</button>';
    const page = '<div class="me-grid"><div>' +
      '<div class="row gap12" style="margin:6px 0 12px"><span class="w-50 h-50 bg-soft no-shadow circ-btn">' + ic('users', 24, 1.6) + '</span><div><h1 class="fs-19 tabtitle" id="main-h" style="font-weight:300;letter-spacing:.14em">' + ME + '</h1><div class="fs-11-5 sub">香港 · 加入 PetCity 第 12 天（示例）</div></div><span class="grow"></span>' + PC.langBtn() + '</div>' +
      (S.trip && !S.trip.ended ? '<div class="mb-12 mb12">' + V.banner() + '</div>' : '') +
      '<div class="mb-6 hscroll">' + S.pets.map(p => '<button class="card click row gap10" style="min-width:210px;text-align:left;' + (p.id === S.petId ? 'outline:2px solid var(--prim)' : '') + '" data-act="setPet" data-id="' + p.id + '">' + PC.dog(40) + '<div><b class="underline">' + esc(p.name) + '</b>' + (p.id === S.petId ? ' <span class="h-17 fs-10 tag dark">当前</span>' : '') + '<div class="fs-11 sub">' + p.species + ' · ' + p.size + ' · 常去' + esc(p.areas[0] || '西九龙') + (p.example ? ' · 示例档案' : '') + '</div></div></button>').join('') + '<button class="minw-84 fd-col fs-10-5 c-muted d-flex ai-c jc-c gap-2 dash" data-act="addPet">' + ic('plus', 16, 1.8) + '添加宠物</button></div>' +
      '<div class="pgrid mt12" style="grid-template-columns:1fr 1fr">' + tile('star', '收藏地点', S.favs.length, '/me/favs') + tile('map', '我的路线', S.myRoutes.length, '/routes/mine') + tile('cal', '我的报名', S.signups.length, '/me/signups') + tile('msg', '我的帖子', S.posts.length, '/me/posts') + '</div></div><div>' +
      '<div class="mt-6 card mt12"><div class="row between"><div class="row gap8">' + ic('box', 18, 1.8) + '<b class="fs-15">我的订单</b><span class="tag official">新</span></div><button class="sub row gap4" data-act="go" data-to="/orders">全部订单 ' + ic('right', 13, 2) + '</button></div><div class="row mt8">' + st('card', '待付款', 'pending') + st('box', '备货中', 'prep') + st('truck', '配送中', 'ship') + st('check', '已完成', 'done') + '</div><div class="fs-11 center sub mt4">' + PC.SAMPLE + '（示例订单）</div></div>' +
      '<div class="mt12">' + li('flag', '规则反馈记录 · ' + S.feedback.length + ' 条', '/me/feedback') + li('gear', '设置', '/me/settings') + li('info', '关于 PetCity 演示', '/me/about') + '<button class="w-full h-50 fs-14 ta-l row between" data-act="reset"><span class="row gap12">' + ic('rot', 18, 1.8) + '重置演示</span>' + ic('right', 16, 1.8) + '</button></div></div></div>';
    return { mode: 'page', nav: 'me', tab: 'me', title: '我的', pageClass: 'mid', page };
  });
  const sub = (title, body, to) => ({ mode: 'page', nav: 'me', tab: '', title, pageClass: 'narrow', page: V.phead(title, { back: to || '/me' }) + body });
  PC.route('/me/:k', ({ k }) => {
    if (k === 'favs') return sub('收藏地点', S.favs.length ? S.favs.map(id => V.poiRow(PC.poi(id)).replace('pickPlace', 'go').replace('data-id="' + id + '"', 'data-to="/place/' + id + '"')).join('') : '<div class="empty">还没有收藏，去点位详情点 ♡</div>');
    if (k === 'signups') return sub('我的报名', S.signups.length ? S.signups.map(s => eventCard(PC.EVENTS[s.eid])).join('') : '<div class="empty">还没有报名活动<br><button class="d-iflex btn prim sm mt12" data-act="go" data-to="/event/e1">看看本周活动</button></div>');
    if (k === 'posts') return sub('我的帖子', S.posts.length ? S.posts.map(p => postCard(p)).join('') : '<div class="empty">还没有发过帖子<br><button class="d-iflex btn prim sm mt12" data-act="go" data-to="/post/new">去发帖</button></div>');
    if (k === 'feedback') return sub('规则反馈记录', '<p class="mb-8 sub">以下反馈只保存在本机（示例）。</p>' + (S.feedback.length ? S.feedback.map(f => '<div class="card flat mt8 row gap10">' + ic('flag', 16, 2) + '<div class="grow"><b class="fs-14">' + esc(PC.poi(f.pid).name) + '</b><div class="fs-12 sub">' + esc(f.reason) + ' · ' + f.src + ' · ' + f.time + '</div></div></div>').join('') : '<div class="empty">还没有反馈</div>'));
    if (k === 'settings') return sub('设置', '<div class="card flat row between mb-10"><div><b>文字</b><div class="fs-12 sub">' + (PC.lang() === 'hant' ? '目前：繁体中文（台湾字形）' : '目前：简体中文') + '</div></div>' + PC.langBtn() + '</div><div class="card flat row between"><div><b>显示悬浮购物入口</b><div class="fs-12 sub">关闭后，地图 / 点位 / 路线页不再显示购物球（商城仍可从导航进入）</div></div><button class="w-60 p-3 seg" data-act="toggleFab" role="switch" aria-label="显示悬浮购物入口" aria-checked="' + !S.hideFab + '"><span class="' + (S.hideFab ? '' : 'on') + '" style="flex:1;height:30px;border-radius:15px;' + (S.hideFab ? '' : 'background:var(--prim)') + '"></span><span class="flex-1"></span></button></div><button class="btn sec block mt16" data-act="reset">' + ic('rot', 16, 2) + '重置演示</button>');
    if (k === 'about') return sub('关于 PetCity 演示', '<div class="lh-1-7 fs-13-5 card flat"><b>这是可点击的网页演示（课程展示用）</b><br>香港宠物友好出行与路线规划小程序的界面原型。所有地点、规则、时间、价格、评价、订单均为<b>示例数据</b>，不代表真实情况，也未经核验。<br><br>地图是示意图；导航、打车、支付、AI 排路线均为模拟，不会调用任何真实服务，也不会收集定位、卡号或个人资料。数据只保存在本机浏览器。</div>');
    return sub('我的', '<div class="empty">没有这一页</div>');
  });
  ACT.toggleFab = () => { S.hideFab = !S.hideFab; PC.save(); PC.refresh(); };
})(window.PC);
