/* 简繁切换（简体 ↔ 繁体，台湾常用字形）
   - 只收录本演示用到、简繁写法不同的字，加上少量需要按词判断的词组（公里、一隻、複製、回覆…）
   - 页面上的文字和 aria-label / placeholder / title 在显示时转换；数据本身（地点名、筛选值等）始终是简体，所以筛选、搜索逻辑不受影响
   - 新增文案后如果出现没转换的字：把「简繁」两个字加进下面的 S2T 字符串即可 */
(function (PC) {
  'use strict';
  const S2T = '与與业業东東个個为為么麼买買于於亚亞产產仅僅从從价價优優会會体體余餘关關内內写寫冲衝况況净淨准準凉涼减減几幾击擊划劃则則刚剛删刪办辦务務动動区區医醫单單卖賣占佔卷捲厅廳厦廈参參发發变變叠疊号號后後吗嗎启啟员員周週团團园園围圍图圖坚堅垫墊场場处處备備复複够夠头頭妈媽宝寶实實宠寵对對导導将將岛島峡峽带帶帮幫干乾并並应應开開弃棄张張当當录錄志誌态態总總悬懸户戶护護报報拟擬择擇挂掛挣掙换換据據携攜数數断斷无無旧舊时時显顯晒曬暂暫术術机機条條来來柜櫃标標样樣档檔楼樓气氣汇彙没沒洁潔浅淺浏瀏温溫游遊湾灣湿濕满滿滨濱灯燈点點热熱爱愛牵牽状狀猫貓环環现現电電疗療着著码碼确確离離种種称稱筛篩签籤简簡类類红紅约約纳納线線练練组組细細终終经經结結给給继繼续續绳繩维維绿綠编編缩縮网網联聯胶膠艺藝荐薦营營蓝藍补補装裝见見观觀规規视視览覽计計订訂认認让讓训訓议議记記设設访訪评評识識诊診试試话話该該详詳说說请請读讀课課谁誰调調谢謝货貨质質购購贴貼费費资資车車较較辅輔辑輯输輸边邊达達过過还還这這进進适適选選里裡钟鐘铜銅银銀铺鋪销銷锣鑼键鍵长長门門闭閉问問间間队隊阳陽阴陰际際随隨页頁项項顺順预預领領颜顏额額风風饮飲馆館馈饋马馬驾駕验驗鱼魚鲗鰂鲜鮮鸭鴨龙龍硅矽软軟脱脫黄黃狮獅两兩乐樂侧側儿兒凑湊广廣庙廟恒恆惩懲积積测測滤濾盖蓋罚罰范範误誤辉輝错錯径徑宽寬纬緯专專冻凍块塊奥奧运運铃鈴盘盤饼餅粮糧叶葉尽盡岭嶺弥彌构構桥橋画畫渔漁笔筆聂聶荫蔭虚虛诺諾轮輪连連邮郵针針铁鐵陆陸隐隱顶頂飞飛鲤鯉鹅鵝澜瀾缘緣';
  const PHRASES = {"公里": "公里", "一只": "一隻", "船只": "船隻", "复制": "複製", "回复": "回覆", "系数": "係數", "联系": "聯繫", "头发": "頭髮", "理发": "理髮", "面条": "麵條", "喂食": "餵食", "合并": "合併"};
  const s2t = {}, t2s = {};
  for (let i = 0; i < S2T.length; i += 2) { s2t[S2T[i]] = S2T[i + 1]; t2s[S2T[i + 1]] = S2T[i]; }
  Object.keys(PHRASES).forEach(k => { for (let i = 0; i < k.length; i++) if (PHRASES[k][i] !== k[i]) t2s[PHRASES[k][i]] = k[i]; });
  Object.assign(t2s, { '裏': '里', '臺': '台', '綫': '线', '着': '着', '週': '周' });
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reS2T = new RegExp(Object.keys(PHRASES).map(esc).join('|') + '|[\u4e00-\u9fff]', 'g');
  PC.toHant = s => s && s.replace(reS2T, c => PHRASES[c] || s2t[c] || c);
  PC.toHans = s => s && s.replace(/[\u4e00-\u9fff]/g, c => t2s[c] || c);   // 搜索时把繁体输入转回简体再匹配

  /* ---------- English: dictionary in i18n-en.js / i18n-en-data.js ---------- */
  const CJK = /[\u4e00-\u9fff]/, memo = new Map();
  let enRe = null, enReNum = null;
  const PUNCT = { '，': ', ', '。': '. ', '：': ': ', '；': '; ', '！': '! ', '？': '? ', '、': ', ', '「': '“', '」': '”', '（': ' (', '）': ') ', '～': '~', '　': ' ' };
  const NOCAP = '是的和到被约站有按共次条件个分公';   // 这些字开头的片段多半是句子中间，不要首字母大写
  function enCore(t) {
    const D = PC.EN_DICT || {};
    if (D[t] != null) return D[t];
    if (!enRe) {
      const keys = Object.keys(D).filter(k => CJK.test(k)).sort((a, b) => b.length - a.length), re = ks => new RegExp(ks.map(esc).join('|'), 'g');
      enRe = re(keys); enReNum = re(keys.filter(k => /\d/.test(k)));   // 带数字的完整词条（如「宠物清洁湿巾 80 片」）要在数字模板之前先换
    }
    const wrap = m => '\u0002' + D[m] + '\u0002';
    let r = t.replace(enReNum, wrap);
    (PC.EN_RE || []).forEach(([re, to]) => { r = r.replace(re, to); });
    r = r.replace(enRe, wrap).replace(/[，。：；！？、「」（）～　]/g, c => PUNCT[c]);
    r = r.replace(/\u0002+/g, (m, off, str) => { const a = str[off - 1], b = str[off + m.length]; return a && b && /[\w)%”’.,!?:;]/.test(a) && /[\w(“]/.test(b) ? ' ' : ''; });
    return r.replace(/ {2,}/g, ' ').replace(/ ([,.;:!?)])/g, '$1').replace(/\( /g, '(').replace(/ ’s\b/g, '’s').replace(/\b1 (stop|route|item|reply|spot|place|day|time)s\b/g, '1 $1').replace(/\b1 (replie)s\b/g, '1 reply').replace(/([,.;:]) ?(?=\))/g, '').trim();
  }
  PC.toEn = s => {
    if (!s || !CJK.test(s)) return s;
    let v = memo.get(s); if (v != null) return v;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], t = s.trim();
    v = enCore(t);
    if (NOCAP.indexOf(t[0]) < 0 && CJK.test(t[0])) v = v.replace(/^[a-z]/, c => c.toUpperCase());
    v = lead + v + trail;
    memo.set(s, v); return v;
  };

  /* ---------- 运行时：把页面上的文字转成繁体 / 英文 ---------- */
  PC.lang = () => (PC.S && PC.S.lang) || 'hans';
  const conv = s => PC.lang() === 'en' ? PC.toEn(s) : PC.toHant(s);
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };   // 用户正在写的内容不转换
  function walk(n) {
    if (n.nodeType === 3) { const v = conv(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
    if (n.nodeType === 1) {
      if (n.getAttribute('translate') === 'no') return;   // translate="no"：例如「简」切换按钮本身
      for (const a of ATTRS) { const v = n.getAttribute(a); if (v) { const t = conv(v); if (t !== v) n.setAttribute(a, t); } }   // 输入框的 aria-label / placeholder 也要转
      if (SKIP[n.nodeName]) return;   // 但不转输入框里的内容
    } else if (n.nodeType !== 11 && n.nodeType !== 9) return;
    for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  PC.convertTree = root => { if (PC.lang() !== 'hans' && root) walk(root); };

  // 局部更新（PC.patch）会先转换再比对，所以平时不会重复改动 DOM；
  // 这里的监听只负责兜底：提示、弹窗、地图地名、页面标题等不经过 PC.patch 插入的内容。
  PC.i18nInit = function () {
    const L = PC.lang();
    document.documentElement.lang = L === 'hant' ? 'zh-Hant-TW' : L === 'en' ? 'en' : 'zh-Hans';
    document.documentElement.classList.toggle('lang-en', L === 'en');
    if (L === 'hans') return;
    walk(document);
    new MutationObserver(recs => recs.forEach(r => {
      if (r.type === 'characterData') { const el = r.target.parentNode; if (!el || el.closest('[translate="no"],textarea')) return; walk(r.target); }
      else if (r.type === 'attributes') { const el = r.target, v = el.getAttribute(r.attributeName); if (v && !el.closest('[translate="no"]')) { const t = conv(v); if (t !== v) el.setAttribute(r.attributeName, t); } }
      else r.addedNodes.forEach(n => { const el = n.nodeType === 1 ? n : n.parentNode; if (el && el.closest && el.closest('[translate="no"]')) return; walk(n); });
    })).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };

  // 切换：简 / 繁 / EN 三个小按钮，自己不被转换
  const LANGS = [['hans', '简', '简体中文'], ['hant', '繁', '繁體中文'], ['en', 'EN', 'English']];
  PC.langBtn = cls => '<span class="langsw ' + (cls || '') + '" role="group" aria-label="Language / 语言" translate="no">' + LANGS.map(l => '<button class="chip sm' + (PC.lang() === l[0] ? ' sel' : '') + '" data-act="setLang" data-v="' + l[0] + '" aria-pressed="' + (PC.lang() === l[0]) + '" aria-label="' + l[2] + '" lang="' + (l[0] === 'en' ? 'en' : l[0] === 'hant' ? 'zh-Hant' : 'zh-Hans') + '">' + l[1] + '</button>').join('') + '</span>';
  PC.ACT.setLang = el => { PC.S.lang = el.dataset.v; PC.saveNow(); location.reload(); };
})(window.PC);
