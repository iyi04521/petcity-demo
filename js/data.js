/* PetCity 演示数据：全部为示例，非真实。修改本文件即可换地点 / 路线 / 商品。 */
window.PC = window.PC || {};
(function (PC) {
  PC.SAMPLE = '示例商品，非真实售卖';
  PC.MPU = 6;          // 地图 1 个单位 = 6 米
  PC.DETOUR = 1.15;    // 直线距离 → 步行距离 的系数（示意）
  PC.WALK = 75;        // 步行速度 米/分钟（示意）
  // 地图范围：西九龙到香港岛南岸（经度 114.110–114.262，纬度 22.200–22.338）
  PC.GEO = { lon0: 114.110, lat0: 22.338, lon1: 114.262, lat1: 22.200 };
  PC.ll = function (lat, lon) {   // 纬度 / 经度 → 地图坐标（等距近似，香港范围内误差可忽略）
    return { x: Math.round((lon - PC.GEO.lon0) * 103017 / PC.MPU), y: Math.round((PC.GEO.lat0 - lat) * 110704 / PC.MPU) };
  };
  PC.WORLD = { w: PC.ll(PC.GEO.lat1, PC.GEO.lon1).x, h: PC.ll(PC.GEO.lat1, PC.GEO.lon1).y };
  PC.SIZE_RANK = { '小型': 1, '中型': 2, '大型': 3 };

  PC.DISTRICTS = ['中西区', '西九龙', '湾仔', '油尖旺', '东区', '沙田'];
  PC.DEMO_DISTRICTS = ['西九龙', '油尖旺', '中西区', '湾仔'];

  // maxSize: 1 仅小型 / 2 中型以下 / 3 不限; hours 为分钟; carry 需抱着; reserve 预约时段
  PC.POIS = {
    p1: { id: 'p1', name: '西九海滨长廊', type: '户外', tags: ['户外'], district: '西九龙', lat: 22.3025, lon: 114.155, maxSize: 3, dwell: 20, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '不限体型', 'ok'], ['禁入区', '部分区域不可进入', 'warn']],
      facilities: ['饮水点', '长椅', '拾便袋'], tip: '门口有饮水点 · 请全程牵绳 · 傍晚人较多', verified: '示例 · 待核实' },
    p2: { id: 'p2', name: '宠物用品店（示例）', type: '店铺', tags: ['店铺', '可入店'], district: '西九龙', lat: 22.3062, lon: 114.1652, maxSize: 1, dwell: 30, hours: [600, 1200], hoursTxt: '10:00–20:00',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '小型犬可入', 'ok'], ['店内', '店内勿放下', 'warn']],
      facilities: ['拾便袋'], tip: '门口有水碗 · 请牵绳进店 · 小型犬可入，勿放到货架上', verified: '示例 · 待核实' },
    p3: { id: 'p3', name: '露台咖啡店（示例）', type: '餐饮', tags: ['餐饮', '可入店'], district: '油尖旺', lat: 22.3032, lon: 114.1682, maxSize: 1, carry: true, dwell: 30, hours: [540, 1080], hoursTxt: '09:00–18:00',
      rules: [['区域', '仅露台', 'ok'], ['体型', '仅限小型犬', 'ok'], ['入座', '需抱着，勿上座椅', 'warn']],
      facilities: ['饮水点'], tip: '仅限露台座位 · 小型犬需抱着 · 请自备外出包', verified: '示例 · 待核实' },
    p4: { id: 'p4', name: '宠物美容店（示例）', type: '医疗美容', tags: ['医疗美容', '可入店'], district: '油尖旺', lat: 22.3046, lon: 114.1722, maxSize: 3, reserve: [690, 840], dwell: 20, hours: [660, 1140], hoursTxt: '11:00–19:00 · 需预约',
      rules: [['预约', '需提前预约', 'warn'], ['体型', '不限体型', 'ok'], ['疫苗', '请带疫苗记录', 'ok']],
      facilities: ['洗手间'], tip: '需提前预约 · 请带疫苗记录 · 到店前电话确认', verified: '示例 · 待核实' },
    p5: { id: 'p5', name: '宠物友好超市（示例）', type: '店铺', tags: ['店铺', '可入店'], district: '西九龙', lat: 22.3045, lon: 114.1622, maxSize: 2, dwell: 20, hours: [480, 1320], hoursTxt: '08:00–22:00',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '小 / 中型可入', 'ok'], ['区域', '生鲜区不可入', 'warn']],
      facilities: ['拾便袋'], tip: '入口登记 · 请全程牵绳 · 生鲜区不可入', verified: '示例 · 待核实' },
    p6: { id: 'p6', name: '西九艺术公园草坪（示例）', type: '户外', tags: ['户外'], district: '西九龙', lat: 22.3012, lon: 114.1575, maxSize: 3, dwell: 25, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '人多时请牵绳', 'ok'], ['体型', '不限体型', 'ok'], ['预约', '免预约', 'ok']],
      facilities: ['饮水点', '长椅'], tip: '草坪区可放风（人少时） · 请自备拾便袋', verified: '示例 · 待核实' },
    p7: { id: 'p7', name: '海滨宠物饮水站（示例）', type: '户外', tags: ['户外'], district: '西九龙', lat: 22.306, lon: 114.156, rest: true, maxSize: 3, dwell: 5, hours: [0, 1440], hoursTxt: '全天 · 仅休息点',
      rules: [['用途', '仅休息 / 饮水，不算一站', 'ok']], facilities: ['饮水点', '长椅'], tip: '仅休息点', verified: '示例 · 待核实' },
    p8: { id: 'p8', name: '九龙公园宠物草地（示例）', type: '户外', tags: ['户外'], district: '油尖旺', lat: 22.3002, lon: 114.1706, maxSize: 3, dwell: 20, hours: [360, 1380], hoursTxt: '06:00–23:00',
      rules: [['牵绳', '指定草地可放风', 'ok'], ['体型', '不限体型', 'ok'], ['禁入区', '花圃不可进入', 'warn']],
      facilities: ['饮水点', '拾便袋', '洗手间'], tip: '指定草地区域可放风 · 花圃勿进', verified: '示例 · 待核实' },
    p9: { id: 'p9', name: '尖沙咀海滨步道（示例）', type: '户外', tags: ['户外'], district: '油尖旺', lat: 22.2938, lon: 114.1702, maxSize: 3, dwell: 15, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '不限体型', 'ok']], facilities: ['长椅', '拾便袋'], tip: '夜间灯光较暗，建议佩戴 LED 项圈灯', verified: '示例 · 待核实' },
    p10: { id: 'p10', name: '宠物医院（示例）', type: '医疗美容', tags: ['医疗美容', '可入店'], district: '油尖旺', lat: 22.3088, lon: 114.1702, maxSize: 3, dwell: 30, hours: [540, 1260], hoursTxt: '09:00–21:00',
      rules: [['牵绳', '候诊区需牵绳 / 入包', 'ok'], ['体型', '不限体型', 'ok']], facilities: ['洗手间'], tip: '建议先电话预约', verified: '示例 · 待核实' },
    p11: { id: 'p11', name: '海港观景台（示例）', type: '户外', tags: ['户外'], district: '油尖旺', lat: 22.293, lon: 114.1772, maxSize: 3, dwell: 20, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '不限体型', 'ok']], facilities: ['长椅'], tip: '观景台人多时请抱起小型犬', verified: '示例 · 待核实' },
    p12: { id: 'p12', name: '宠物友好茶室（示例）', type: '餐饮', tags: ['餐饮', '可入店'], district: '油尖旺', lat: 22.2992, lon: 114.1742, maxSize: 1, dwell: 30, hours: [720, 1260], hoursTxt: '12:00–21:00',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '仅限小型犬', 'ok'], ['入座', '宠物不可上桌', 'warn']],
      facilities: ['饮水点'], tip: '12:00 后开放 · 宠物不可上桌', verified: '示例 · 待核实' },
    p13: { id: 'p13', name: '海旁宠物友好小吃店（示例）', type: '餐饮', tags: ['餐饮'], district: '油尖旺', lat: 22.2948, lon: 114.1758, maxSize: 3, dwell: 25, hours: [1020, 1380], hoursTxt: '17:00–23:00',
      rules: [['区域', '仅户外座位', 'ok'], ['体型', '不限体型', 'ok']], facilities: ['饮水点'], tip: '傍晚后营业 · 仅户外座位', verified: '示例 · 待核实' },
    // ---- 香港岛（坐标已对照公开资料核对） ----
    p14: { id: 'p14', name: '中环海滨长廊（示例）', type: '户外', tags: ['户外'], district: '中西区', lat: 22.2840, lon: 114.1622, maxSize: 3, dwell: 20, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '不限体型', 'ok'], ['宠物园', '设宠物公园，可放绳（园内）', 'ok']],
      facilities: ['饮水点', '长椅', '拾便袋'], tip: '近添马公园一段设有宠物公园 · 周末活动多，留意封路', verified: '示例 · 待核实' },
    p15: { id: 'p15', name: '添马公园外围步道（示例）', type: '户外', tags: ['户外'], district: '中西区', lat: 22.2816, lon: 114.1656, maxSize: 3, dwell: 15, hours: [360, 1380], hoursTxt: '06:00–23:00',
      rules: [['牵绳', '全程牵绳', 'ok'], ['草坪', '草坪内不可带宠物，只走外围步道', 'warn']],
      facilities: ['长椅', '洗手间'], tip: '草坪区不可进入 · 外围步道可通往海滨', verified: '示例 · 待核实' },
    p16: { id: 'p16', name: '湾仔海滨宠物空间（示例）', type: '户外', tags: ['户外'], district: '湾仔', lat: 22.2828, lon: 114.1765, maxSize: 3, dwell: 25, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '不限体型', 'ok'], ['预约', '免预约', 'ok']],
      facilities: ['饮水点', '长椅', '拾便袋'], tip: '近湾仔码头 · 有遮阴座位 · 傍晚看海很舒服', verified: '示例 · 待核实' },
    p17: { id: 'p17', name: '宠物友好咖啡馆（湾仔，示例）', type: '餐饮', tags: ['餐饮', '可入店'], district: '湾仔', lat: 22.2790, lon: 114.1748, maxSize: 2, dwell: 30, hours: [600, 1200], hoursTxt: '10:00–20:00',
      rules: [['店内', '可入店，请勿上座椅', 'ok'], ['体型', '小 / 中型可入', 'ok']],
      facilities: ['饮水点'], tip: '店内提供水碗和宠物小食 · 周末建议先订位', verified: '示例 · 待核实' },
    p18: { id: 'p18', name: '铜锣湾避风塘海滨（示例）', type: '户外', tags: ['户外'], district: '湾仔', lat: 22.2850, lon: 114.1875, maxSize: 3, dwell: 20, hours: [0, 1440], hoursTxt: '全天开放',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '不限体型', 'ok']],
      facilities: ['长椅', '拾便袋'], tip: '近维多利亚公园 · 可看避风塘船只 · 夜晚灯光好', verified: '示例 · 待核实' },
    p19: { id: 'p19', name: '宠物用品店（铜锣湾，示例）', type: '店铺', tags: ['店铺', '可入店'], district: '湾仔', lat: 22.2800, lon: 114.1840, maxSize: 2, dwell: 20, hours: [660, 1320], hoursTxt: '11:00–22:00',
      rules: [['牵绳', '全程牵绳', 'ok'], ['体型', '小 / 中型可入', 'ok']],
      facilities: ['拾便袋'], tip: '商场内店铺 · 进商场需抱着或用推车', verified: '示例 · 待核实' },
    p20: { id: 'p20', name: '宠物友好餐厅（中环，示例）', type: '餐饮', tags: ['餐饮'], district: '中西区', lat: 22.2820, lon: 114.1570, maxSize: 1, carry: true, dwell: 40, hours: [720, 1320], hoursTxt: '12:00–22:00',
      rules: [['区域', '仅户外座位', 'ok'], ['体型', '仅限小型犬', 'ok'], ['入座', '需抱着或放外出包', 'warn']],
      facilities: ['饮水点'], tip: '仅户外座位 · 斜路较多，建议带推车', verified: '示例 · 待核实' },
    p21: { id: 'p21', name: '海滨宠物饮水站（湾仔，示例）', type: '户外', tags: ['户外'], district: '湾仔', lat: 22.2838, lon: 114.1720, rest: true, maxSize: 3, dwell: 5, hours: [0, 1440], hoursTxt: '全天 · 仅休息点',
      rules: [['用途', '仅休息 / 饮水，不算一站', 'ok']], facilities: ['饮水点', '长椅'], tip: '仅休息点', verified: '示例 · 待核实' },
  };

  // 地点坐标用真实经纬度（可从地图软件直接复制），这里换算成地图坐标 x / y
  Object.values(PC.POIS).forEach(p => Object.assign(p, PC.ll(p.lat, p.lon)));

  PC.REVIEWS = {
    p1: [['阿柴麻麻', '柴犬 · 中型', '早上人少，饮水点很干净。', '已访问'], ['布丁的家', '比熊 · 小型', '傍晚人多，记得全程牵绳。', '已访问']],
    p2: [['Momo 妈', '柯基 · 小型', '店员很友善，不过要一直抱着或牵好。', '已访问']],
    p3: [['布丁的家', '比熊 · 小型', '露台位置不多，建议先到先得。', '已访问']],
    p14: [['Lucky 爸', '金毛 · 大型', '宠物公园够大，大狗也能跑。周末下午人多。', '已访问']],
    p16: [['Momo 妈', '柯基 · 小型', '傍晚很舒服，记得带水，饮水点有时会排队。', '已访问'], ['阿柴麻麻', '柴犬 · 中型', '从湾仔码头走过来很近。', '已访问']],
  };

  PC.ROUTES = {
    r1: { id: 'r1', name: '周末海滨慢游', official: true, district: '西九龙', start: 600, tags: ['适合小型犬', '有饮水点'], stops: [{ pid: 'p1', dwell: 20 }, { pid: 'p2', dwell: 30 }, { pid: 'p3', dwell: 30 }, { pid: 'p4', dwell: 20 }], theme: '海滨' },
    r2: { id: 'r2', name: '小型犬下午茶线', official: true, district: '油尖旺', start: 840, tags: ['适合小型犬', '咖啡'], stops: [{ pid: 'p3', dwell: 30 }, { pid: 'p8', dwell: 20 }, { pid: 'p12', dwell: 30 }], theme: '下午茶' },
    r3: { id: 'r3', name: '海港夜景散步', official: true, district: '油尖旺', start: 1080, tags: ['夜景', '全程户外'], stops: [{ pid: 'p9', dwell: 15 }, { pid: 'p13', dwell: 25 }, { pid: 'p11', dwell: 20 }], theme: '夜景' },
    r4: { id: 'r4', name: '港岛海滨慢游', official: true, district: '中西区', start: 900, tags: ['海滨', '有宠物公园'], stops: [{ pid: 'p14', dwell: 20 }, { pid: 'p15', dwell: 15 }, { pid: 'p16', dwell: 25 }, { pid: 'p17', dwell: 30 }], theme: '海滨' },
    r5: { id: 'r5', name: '铜锣湾傍晚散步', official: true, district: '湾仔', start: 1050, tags: ['夜景', '可顺路购物'], stops: [{ pid: 'p19', dwell: 20 }, { pid: 'p18', dwell: 25 }], theme: '夜景' },
  };
  PC.SEED_MY_ROUTE = { id: 'm1', name: '豆豆的周末小逛', official: false, district: '西九龙', start: 600, tags: ['我的路线'], stops: [{ pid: 'p6', dwell: 25 }, { pid: 'p5', dwell: 20 }, { pid: 'p1', dwell: 20 }], theme: '我的' };

  PC.PRODUCTS = {
    leash: { id: 'leash', name: '反光牵引绳 1.5 m', cat: '出行', price: 88, icon: 'leash', tint: 0, why: '全程牵绳', apply: '全程牵绳的路线（如周末海滨慢游，站点规则「全程牵绳」）', opts: [['长度', ['1.5 m', '2 m']], ['颜色', ['橙色', '黑色', '绿色']]], tags: ['全程牵绳适用', '小型犬适用', '夜行反光'] },
    bowl: { id: 'bowl', name: '便携折叠水碗', cat: '饮水喂食', price: 38, icon: 'bowl', tint: 3, why: '户外约 2 小时', apply: '户外约 2 小时的路线', opts: [['材质', ['硅胶 · 中号', '硅胶 · 小号']]], tags: ['可折叠', '户外'] },
    carrier: { id: 'carrier', name: '透气外出包（小型犬）', cat: '出行', price: 268, icon: 'carrier', tint: 1, why: '店内需抱着', apply: '需抱着入店的站（如露台咖啡店）', opts: [['尺寸', ['小号', '中号']]], tags: ['透气', '小型犬'] },
    poop: { id: 'poop', name: '可降解拾便袋 6 卷', cat: '清洁', price: 36, icon: 'roll', tint: 1, why: '随手清理', apply: '所有路线', opts: [['规格', ['6 卷装', '12 卷装']]], tags: ['可降解'] },
    mat: { id: 'mat', name: '清凉降温垫（中号）', cat: '安全', price: 128, icon: 'snow', tint: 3, why: '夏日户外', apply: '夏日户外、天气炎热时', opts: [['尺寸', ['中号', '大号']]], tags: ['夏季', '户外'] },
    harness: { id: 'harness', name: '防挣脱胸背带', cat: '出行', price: 158, icon: 'harness', tint: 2, why: '易挣脱', apply: '易挣脱的小型犬 / 新手', opts: [['尺码', ['S 码', 'M 码']]], tags: ['防挣脱'] },
    bottle: { id: 'bottle', name: '随行饮水杯 300 ml', cat: '饮水喂食', price: 79, icon: 'bottle', tint: 0, why: '短途饮水', apply: '短途随行饮水', opts: [['容量', ['300 ml']]], tags: ['随行'] },
    treat: { id: 'treat', name: '训练零食收纳袋', cat: '饮水喂食', price: 59, icon: 'pouch', tint: 2, why: '训练 / 活动', apply: '带宠物参加活动、训练', opts: [['尺寸', ['均码']]], tags: ['活动'] },
    wipes: { id: 'wipes', name: '宠物清洁湿巾 80 片', cat: '清洁', price: 32, icon: 'wipes', tint: 2, why: '露台咖啡店后擦手', apply: '咖啡店露台后擦手', opts: [['规格', ['80 片']]], tags: ['清洁'] },
    led: { id: 'led', name: '夜行 LED 安全项圈灯', cat: '安全', price: 49, icon: 'led', tint: 1, why: '夜间可见', apply: '傍晚 / 夜间路线（如海港夜景散步）', opts: [['款式', ['充电款']]], tags: ['夜行'] },
    towel: { id: 'towel', name: '速干便携毛巾', cat: '清洁', price: 45, icon: 'towel', tint: 3, why: '雨天 / 玩水', apply: '雨天、玩水后', opts: [['尺寸', ['中号']]], tags: ['速干'] },
  };
  PC.CATS = [['出行', 'leash'], ['饮水喂食', 'bowl'], ['清洁', 'roll'], ['安全', 'shield']];
  PC.PACKS = {
    r1: ['leash', 'bowl', 'poop', 'wipes'],
    r2: ['carrier', 'wipes', 'bowl', 'poop'],
    r3: ['led', 'leash', 'poop', 'towel'],
    def: ['leash', 'bowl', 'poop', 'wipes'],
  };
  PC.SHIP = 30; PC.COUPON = 20; PC.COUPON_MIN = 150;

  PC.PAYS = [
    ['alipay', 'Alipay HK', '（支付宝香港）', '支', '模拟 · 点击即视为支付成功'],
    ['wechat', 'WeChat Pay HK', '（微信支付香港）', '微', '模拟 · 点击即视为支付成功'],
    ['octopus', 'Octopus', '（八达通）', '八', '模拟 · 不会读卡，不会扣款'],
    ['card', '信用卡', ' · Visa / Mastercard', '卡', '模拟 · 不需要输入真实卡号'],
  ];

  PC.TAXIS = [
    { id: 'uber', name: 'Uber Pet', sub: '示例 · 是否可带宠物、能否接单，以实际平台为准', fare: 'HK$ 45–60', eta: 5 },
    { id: 'petcab', name: '宠物的士 · 电话预约', sub: '示例 · 需电话预约，尚待核实', fare: 'HK$ 50–70', eta: 12 },
    { id: 'taxi', name: '普通的士', sub: '示例 · 上车前请先向司机确认是否接受宠物', fare: 'HK$ 40–55', eta: 3 },
  ];

  PC.SEED_POSTS = [
    { id: 'post1', user: '阿柴麻麻', pet: '柴犬 · 中型', time: '2 小时前', text: '周末带阿柴去西九，早上人少，饮水点很干净！傍晚人会多一点，建议早点来。', place: 'p1', likes: 128, tint: 0,
      replies: [['布丁的家', '请问周末停车方便吗？'], ['Momo 妈', '同去过，草地那边也可以放风~']] },
    { id: 'post2', user: '布丁的家', pet: '比熊 · 小型', time: '昨天', text: '按官方路线走了一圈，第 3 站要抱着，记得带外出包。', route: 'r1', likes: 56, tint: 1,
      replies: [['阿柴麻麻', '外出包有推荐吗？'], ['布丁的家', '商城里有示例商品，可以看看装备包~']] },
    { id: 'post3', user: 'Momo 妈', pet: '柯基 · 小型', time: '3 天前', text: '九龙公园的宠物草地傍晚很凉快，记得带水碗。', place: 'p8', likes: 34, tint: 2,
      replies: [['阿柴麻麻', '收藏了，周末去。']] },
    { id: 'post4', user: 'Lucky 爸', pet: '金毛 · 大型', time: '4 天前', text: '中环海滨的宠物公园终于让大狗也能放绳跑一下，走到湾仔海滨大概 20 分钟。', place: 'p14', likes: 72, tint: 0,
      replies: [['Momo 妈', '湾仔那边傍晚风很舒服！']] },
  ];
  PC.QUICK_REPLIES = ['好可爱', '求同行', '谢谢分享'];
  PC.EVENTS = {
    e1: { id: 'e1', name: '西九狗狗野餐会（示例）', date: '12 月 5 日（周六）', time: '14:00–16:00', place: 'p6', total: 30, left: 12, fit: '小型犬 · 中型犬', desc: '带上毛毯和野餐垫，一起在海边草坪晒太阳、交朋友。现场有饮水点和拾便袋。（示例文案）' },
    e2: { id: 'e2', name: '海港夜景散步团（示例）', date: '12 月 12 日（周六）', time: '18:30–20:00', place: 'p9', total: 20, left: 8, fit: '各体型 · 需牵绳', desc: '跟着平台领队沿海滨步道慢走，建议佩戴 LED 项圈灯。（示例文案）' },
    e3: { id: 'e3', name: '港岛海滨狗狗聚会（示例）', date: '12 月 19 日（周六）', time: '16:00–18:00', place: 'p16', total: 25, left: 15, fit: '各体型 · 需牵绳', desc: '在湾仔海滨一起散步、交朋友，结束后可沿海滨走到中环。（示例文案）' },
  };
})(window.PC);
