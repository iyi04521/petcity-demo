/* 简繁切换（简体 ↔ 繁体，台湾常用字形）
   - 只收录本演示用到、简繁写法不同的字，加上少量需要按词判断的词组（公里、一隻、複製、回覆…）
   - 页面上的文字和 aria-label / placeholder / title 在显示时转换；数据本身（地点名、筛选值等）始终是简体，所以筛选、搜索逻辑不受影响
   - 新增文案后如果出现没转换的字：把「简繁」两个字加进下面的 S2T 字符串即可 */
(function (PC) {
  'use strict';
  const S2T = '与與业業东東个個为為么麼买買于於亚亞产產仅僅从從价價优優会會体體余餘关關内內写寫冲衝况況净淨准準凉涼减減几幾击擊划劃则則刚剛删刪办辦务務动動区區医醫单單卖賣占佔卷捲厅廳厦廈参參发發变變叠疊号號后後吗嗎启啟员員周週团團园園围圍图圖坚堅垫墊场場处處备備复複够夠头頭妈媽宝寶实實宠寵对對导導将將岛島峡峽带帶帮幫干乾并並应應开開弃棄张張当當录錄志誌态態总總悬懸户戶护護报報拟擬择擇挂掛挣掙换換据據携攜数數断斷无無旧舊时時显顯晒曬暂暫术術机機条條来來柜櫃标標样樣档檔楼樓气氣汇彙没沒洁潔浅淺浏瀏温溫游遊湾灣湿濕满滿滨濱灯燈点點热熱爱愛牵牽状狀猫貓环環现現电電疗療着著码碼确確离離种種称稱筛篩签籤简簡类類红紅约約纳納线線练練组組细細终終经經结結给給继繼续續绳繩维維绿綠编編缩縮网網联聯胶膠艺藝荐薦营營蓝藍补補装裝见見观觀规規视視览覽计計订訂认認让讓训訓议議记記设設访訪评評识識诊診试試话話该該详詳说說请請读讀课課谁誰调調谢謝货貨质質购購贴貼费費资資车車较較辅輔辑輯输輸边邊达達过過还還这這进進适適选選里裡钟鐘铜銅银銀铺鋪销銷锣鑼键鍵长長门門闭閉问問间間队隊阳陽阴陰际際随隨页頁项項顺順预預领領颜顏额額风風饮飲馆館馈饋马馬驾駕验驗鱼魚鲗鰂鲜鮮鸭鴨龙龍硅矽软軟脱脫';
  const PHRASES = {"公里": "公里", "一只": "一隻", "船只": "船隻", "复制": "複製", "回复": "回覆", "系数": "係數", "联系": "聯繫", "头发": "頭髮", "理发": "理髮", "面条": "麵條", "喂食": "餵食", "合并": "合併"};
  const s2t = {}, t2s = {};
  for (let i = 0; i < S2T.length; i += 2) { s2t[S2T[i]] = S2T[i + 1]; t2s[S2T[i + 1]] = S2T[i]; }
  Object.keys(PHRASES).forEach(k => { for (let i = 0; i < k.length; i++) if (PHRASES[k][i] !== k[i]) t2s[PHRASES[k][i]] = k[i]; });
  Object.assign(t2s, { '裏': '里', '臺': '台', '綫': '线', '着': '着', '週': '周' });
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reS2T = new RegExp(Object.keys(PHRASES).map(esc).join('|') + '|[\u4e00-\u9fff]', 'g');
  PC.toHant = s => s && s.replace(reS2T, c => PHRASES[c] || s2t[c] || c);
  PC.toHans = s => s && s.replace(/[\u4e00-\u9fff]/g, c => t2s[c] || c);   // 搜索时把繁体输入转回简体再匹配

  /* ---------- 运行时：把页面上的文字转成繁体 ---------- */
  PC.lang = () => (PC.S && PC.S.lang) || 'hans';
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };   // 用户正在写的内容不转换
  function walk(n) {
    if (n.nodeType === 3) { const v = PC.toHant(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
    if (n.nodeType === 1) {
      if (n.getAttribute('translate') === 'no') return;   // translate="no"：例如「简」切换按钮本身
      for (const a of ATTRS) { const v = n.getAttribute(a); if (v) { const t = PC.toHant(v); if (t !== v) n.setAttribute(a, t); } }   // 输入框的 aria-label / placeholder 也要转
      if (SKIP[n.nodeName]) return;   // 但不转输入框里的内容
    } else if (n.nodeType !== 11 && n.nodeType !== 9) return;
    for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  PC.convertTree = root => { if (PC.lang() === 'hant' && root) walk(root); };

  // 局部更新（PC.patch）会先转换再比对，所以平时不会重复改动 DOM；
  // 这里的监听只负责兜底：提示、弹窗、地图地名、页面标题等不经过 PC.patch 插入的内容。
  PC.i18nInit = function () {
    const hant = PC.lang() === 'hant';
    document.documentElement.lang = hant ? 'zh-Hant-TW' : 'zh-Hans';
    if (!hant) return;
    walk(document);
    new MutationObserver(recs => recs.forEach(r => {
      if (r.type === 'characterData') { const el = r.target.parentNode; if (!el || el.closest('[translate="no"],textarea')) return; walk(r.target); }
      else if (r.type === 'attributes') { const el = r.target, v = el.getAttribute(r.attributeName); if (v && !el.closest('[translate="no"]')) { const t = PC.toHant(v); if (t !== v) el.setAttribute(r.attributeName, t); } }
      else r.addedNodes.forEach(n => { const el = n.nodeType === 1 ? n : n.parentNode; if (el && el.closest && el.closest('[translate="no"]')) return; walk(n); });
    })).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };

  // 切换按钮：显示「另一种」文字，自己不被转换
  PC.langBtn = cls => PC.lang() === 'hant'
    ? '<button class="chip ' + (cls || '') + '" data-act="setLang" data-v="hans" translate="no" aria-label="切换为简体中文">简</button>'
    : '<button class="chip ' + (cls || '') + '" data-act="setLang" data-v="hant" translate="no" aria-label="切換為繁體中文">繁</button>';
  PC.ACT.setLang = el => { PC.S.lang = el.dataset.v; PC.saveNow(); location.reload(); };
})(window.PC);
