"""随机生成示例商户（虚构），写进 data.js。用法: python3 gen_biz.py <data.js> <hkmap.js> <每区数量> <种子>"""
import re, sys, random, math, json
data_p, map_p, N, SEED = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
rnd = random.Random(SEED)
src = open(data_p, encoding='utf-8').read(); hk = open(map_p, encoding='utf-8').read()
import subprocess
HK = json.loads(subprocess.check_output(['node', '-e', "global.window={PC:{ll:()=>({x:0,y:0})}};global.PC=window.PC;eval(require('fs').readFileSync(process.argv[1],'utf8'));console.log(JSON.stringify(window.PC.HKMAP))", map_p]))
def arr(name): return HK[name]
LAND = [arr('KOWLOON'), arr('ISLAND'), arr('AP_LEI_CHAU'), arr('TSING_YI')]
WATER = [arr('SHA_TIN_HOI')]; RIVER = arr('RIVERS')[0]
M_LAT, M_LON = 110704, 103017
def xy(p): return (p[1] * M_LON, p[0] * M_LAT)
def inside(pt, poly):
    x, y = xy(pt); c = False; P = [xy(q) for q in poly]
    for i in range(len(P)):
        (x1, y1), (x2, y2) = P[i], P[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
def seg_d(p, a, b):
    (px, py), (ax, ay), (bx, by) = xy(p), xy(a), xy(b); dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy or 1))); return math.hypot(px - ax - t * dx, py - ay - t * dy)
def edge_d(p, poly, closed=True):
    n = len(poly); return min(seg_d(p, poly[i], poly[(i + 1) % n]) for i in range(n if closed else n - 1))
def ok_place(pt):
    if not any(inside(pt, L) for L in LAND) or any(inside(pt, W) for W in WATER): return False
    if min(edge_d(pt, L) for L in LAND + WATER) < 80: return False      # 离海岸 ≥ 80 m
    return edge_d(pt, RIVER, closed=False) > 130                         # 离城门河 ≥ 130 m
POIS = {m.group(1): (float(m.group(2)), float(m.group(3))) for m in re.finditer(r"(p\d+): \{ id: '\1'.*?lat: ([\d.]+), lon: ([\d.]+)", src)}
NAMES = set(re.findall(r"name: '([^']+)'", src))
def far_enough(pt): return all(math.hypot((pt[1] - q[1]) * M_LON, (pt[0] - q[0]) * M_LAT) >= 120 for q in POIS.values())
AREAS = {
 '西九龙': [('柯士甸', 22.3050, 114.1650), ('大角咀', 22.3200, 114.1620), ('奥运', 22.3175, 114.1605)],
 '油尖旺': [('尖沙咀', 22.2985, 114.1720), ('佐敦', 22.3050, 114.1710), ('油麻地', 22.3120, 114.1705), ('旺角', 22.3190, 114.1695), ('太子', 22.3245, 114.1685)],
 '中西区': [('中环', 22.2815, 114.1560), ('上环', 22.2860, 114.1510), ('西营盘', 22.2860, 114.1420), ('坚尼地城', 22.2820, 114.1290)],
 '湾仔':   [('湾仔', 22.2775, 114.1730), ('铜锣湾', 22.2800, 114.1840), ('跑马地', 22.2700, 114.1840)],
 '东区':   [('北角', 22.2900, 114.2000), ('鲗鱼涌', 22.2850, 114.2110), ('太古', 22.2835, 114.2170), ('筲箕湾', 22.2790, 114.2290), ('柴湾', 22.2650, 114.2380)],
 '沙田':   [('大围', 22.3735, 114.1785), ('沙田', 22.3830, 114.1880), ('火炭', 22.3965, 114.1955), ('马鞍山', 22.4230, 114.2330)],
 '南区':   [('香港仔', 22.2500, 114.1560), ('鸭脷洲', 22.2445, 114.1545), ('黄竹坑', 22.2485, 114.1685), ('赤柱', 22.2185, 114.2120), ('浅水湾', 22.2370, 114.1975)],
 '九龙城': [('九龙城', 22.3290, 114.1910), ('土瓜湾', 22.3175, 114.1885), ('何文田', 22.3110, 114.1800), ('启德', 22.3150, 114.2070)],
 '观塘':   [('观塘', 22.3125, 114.2240), ('牛头角', 22.3165, 114.2185), ('蓝田', 22.3080, 114.2360), ('九龙湾', 22.3230, 114.2135)],
 '深水埗': [('深水埗', 22.3305, 114.1625), ('长沙湾', 22.3355, 114.1545), ('石硖尾', 22.3330, 114.1680), ('美孚', 22.3380, 114.1420)],
}
KINDS = [  # (类型, 子类型, 权重)
 ('餐饮', '宠物友好咖啡馆', 4), ('餐饮', '宠物友好餐厅', 3), ('餐饮', '宠物友好甜品店', 2), ('餐饮', '宠物友好茶餐厅', 2), ('餐饮', '宠物友好轻食店', 2), ('餐饮', '宠物友好面包店', 1),
 ('店铺', '宠物用品店', 3), ('店铺', '宠物零食店', 2), ('店铺', '宠物鲜食店', 2), ('店铺', '宠物服饰店', 1), ('店铺', '宠物玩具店', 1),
 ('医疗美容', '宠物医院', 3), ('医疗美容', '宠物诊所', 2), ('医疗美容', '宠物美容店', 3), ('医疗美容', '宠物自助洗澡店', 1), ('医疗美容', '宠物牙科诊所', 1)]
SIZE_RULE = {1: ('体型', '仅限小型犬', 'ok'), 2: ('体型', '小 / 中型可入', 'ok'), 3: ('体型', '不限体型', 'ok')}
TIPS = {
 '餐饮': ['有宠物餐单', '店员会送狗狗冰块', '户外座位有遮阴', '周末建议先订位', '提供水碗和宠物小毛巾', '门口有牵绳挂钩', '有宠物可吃的无糖小食', '平日下午比较安静', '店里有店狗，介意可坐户外'],
 '店铺': ['有试吃小包装', '可代订大包装狗粮', '有手作项圈和牵绳', '店内有称重台，可免费称体重', '满额可送货上门（示例）', '会员有积分（示例）', '店面较窄，周末人多'],
 '医疗美容': ['建议先电话预约', '猫狗分开候诊', '有专科门诊（示例）', '有电梯，可带推车', '大型犬洗澡要预留更长时间', '可加购护爪服务', '附近有停车位']}
def clock(m): return '%02d:%02d' % (m // 60, m % 60) if m < 1440 else '24:00'
def pick_kind():
    tot = sum(k[2] for k in KINDS); r = rnd.uniform(0, tot)
    for k in KINDS:
        r -= k[2]
        if r <= 0: return k
    return KINDS[-1]
def make(id, dist):
    for _ in range(400):
        area, la, lo = rnd.choice(AREAS[dist]); typ, sub, _w = pick_kind()
        name = '%s（%s，示例）' % (sub, area)
        if name in NAMES: continue
        a, r = rnd.uniform(0, 2 * math.pi), rnd.uniform(0, 260)
        pt = (round(la + r * math.sin(a) / M_LAT, 4), round(lo + r * math.cos(a) / M_LON, 4))
        if not ok_place(pt) or not far_enough(pt): continue
        tags, rules, extra, carry = [typ], [], '', False
        if typ == '餐饮':
            mx = rnd.choice([1, 2, 2, 3, 3]); indoor = rnd.random() < .5
            if indoor: tags.append('可入店'); rules.append(('店内', '可入店，宠物需坐地上', 'ok'))
            else: rules.append(('区域', '仅户外座位' if mx < 3 else '户外座位，不限体型', 'ok'))
            if mx < 3: rules.append(SIZE_RULE[mx])
            if mx == 1 and rnd.random() < .5: carry = True; rules.append(('入座', '需抱着或放外出包', 'warn'))
            elif rnd.random() < .3: rules.append(rnd.choice([('繁忙', '周末午市不接待宠物', 'warn'), ('入座', '宠物不可上椅子', 'warn')]))
            if sub == '宠物友好茶餐厅': o, c = rnd.choice([420, 450, 480]), rnd.choice([1200, 1260, 1290])
            elif sub == '宠物友好面包店': o, c = rnd.choice([450, 480, 510]), rnd.choice([1140, 1170, 1200])
            else: o, c = rnd.choice([540, 600, 660, 690, 720]), rnd.choice([1200, 1260, 1290, 1320, 1350])
            dwell = rnd.choice([15, 20, 20]) if sub in ('宠物友好面包店', '宠物友好甜品店') else rnd.choice([25, 30, 30, 35, 40]); fac = ['饮水点']
        elif typ == '店铺':
            mx = rnd.choice([2, 2, 3]); tags.append('可入店')
            rules += [('牵绳', '全程牵绳', 'ok'), SIZE_RULE[mx]]
            if rnd.random() < .3: rules.append(('商场', '商场内，进商场需抱着或用推车', 'warn'))
            o, c = rnd.choice([600, 630, 660, 690]), rnd.choice([1200, 1230, 1260, 1290, 1320]); dwell = rnd.choice([15, 20, 20]); fac = ['拾便袋']
        else:
            tags.append('可入店'); mx = 3 if sub != '宠物美容店' else rnd.choice([2, 3, 3]); fac = ['洗手间']
            if sub in ('宠物美容店',):
                o, c = rnd.choice([600, 660]), rnd.choice([1140, 1170, 1200]); dwell = rnd.choice([20, 25, 30])
                rules += [('预约', '需提前预约', 'warn'), SIZE_RULE[mx], ('疫苗', '请带疫苗记录', 'ok')]
                extra = ' reserve: [%d, %d],' % (o + 30, c - 60)
            elif sub == '宠物自助洗澡店':
                o, c = rnd.choice([600, 660]), rnd.choice([1260, 1320]); dwell = 30
                rules += [('用法', '自助洗澡、吹干，按时段收费', 'ok'), SIZE_RULE[mx]]
            else:
                is24 = sub == '宠物医院' and rnd.random() < .2
                o, c = (0, 1440) if is24 else (rnd.choice([540, 570, 600]), rnd.choice([1200, 1260, 1290, 1320]))
                dwell = 30; rules += [('牵绳', '候诊区需牵绳 / 入包', 'ok'), SIZE_RULE[mx]]
                if is24: rules.append(('夜间', '夜间请先致电，按铃入内', 'warn'))
        htxt = '24 小时' if (o, c) == (0, 1440) else clock(o) + '–' + clock(c) + (' · 需预约' if extra else '')
        tip = rnd.choice(TIPS[typ]); NAMES.add(name); POIS[id] = pt
        r = ', '.join("['%s', '%s', '%s']" % x for x in rules); f = ', '.join("'%s'" % x for x in fac); t = ', '.join("'%s'" % x for x in tags)
        return (f"    {id}: {{ id: '{id}', name: '{name}', type: '{typ}', tags: [{t}], district: '{dist}', lat: {pt[0]}, lon: {pt[1]}, maxSize: {mx},"
                + (" carry: true," if carry else '') + f"{extra} dwell: {dwell}, hours: [{o}, {c}], hoursTxt: '{htxt}',\n      rules: [{r}],\n      facilities: [{f}], tip: '{tip}', verified: '示例 · 待核实' }},")
    raise SystemExit('could not place ' + id + ' in ' + dist)
nxt = max(int(k[1:]) for k in POIS) + 1; out = ['    // ---- 随机生成的示例商户（虚构，非真实店铺；tools/gen_biz.py，种子 %d） ----' % SEED]
for dist in AREAS:
    for _ in range(N): out.append(make('p%d' % nxt, dist)); nxt += 1
i = src.index('PC.POIS = {'); j = src.index('\n  };', i)
src = src[:j] + '\n' + '\n'.join(out) + src[j:]
open(data_p, 'w', encoding='utf-8').write(src)
print('added', len(out) - 1, 'places, ids up to p%d' % (nxt - 1))
