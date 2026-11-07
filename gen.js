// 単位の感覚の問題を作る（ブラウザと node の両方で使う）。
// 1問 = 長さ・重さ・かさ・広さの読みかえや、硬貨・お札の大きさ・重さの問題を4つから選ぶ。
// 単位の決まりは計量単位令（別表第一・第四・第五）、硬貨とお札の値は日本銀行の「現在発行されている銀行券・貨幣」で確かめたことだけ（出典は SRC。README にも同じ一覧）。
// 計算は整数（n×10^e）で正確に行う（小数の誤差を出さない）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ種なら、どの端末でも同じ問題になる。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const SRC = {
    L: ["e-Gov 法令検索 計量単位令（別表第一・第四・第五）", "https://laws.e-gov.go.jp/law/404CO0000000357"],
    B: ["日本銀行 現在発行されている銀行券・貨幣", "https://www.boj.or.jp/note_tfjgs/note/valid/issue.htm"],
  };

  const pickN = (R, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const shuffle = (R, arr) => pickN(R, arr, arr.length);
  const one = (R, arr) => arr[Math.floor(R() * arr.length)];
  const int = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // 答えと、まちがい（重ならないものを順に）を合わせて n 個にし、並びを混ぜる
  function opts(R, ans, wrongs, n = 4) {
    const out = [];
    for (const w of wrongs) { if (w && w !== ans && !out.includes(w)) out.push(w); if (out.length === n - 1) break; }
    return shuffle(R, [ans, ...out]);
  }

  // ---- 単位（計量単位令）。[量, 基の単位, 10の何乗] ----
  // 長さは m、重さは g、かさは L、広さは m² を基にする。
  // L＝立方メートルの千分の一（別表第一）。cm³＝m³の百万分の一（別表第五：接頭語の乗数の三乗）なので、1cm³＝1mL。
  const UNITS = {
    km: ["長さ", "m", 3], m: ["長さ", "m", 0], cm: ["長さ", "m", -2], mm: ["長さ", "m", -3],
    t: ["重さ", "g", 6], kg: ["重さ", "g", 3], g: ["重さ", "g", 0], mg: ["重さ", "g", -3],
    "m³": ["かさ", "L", 3], L: ["かさ", "L", 0], dL: ["かさ", "L", -1], mL: ["かさ", "L", -3], "cm³": ["かさ", "L", -3],
    "km²": ["広さ", "m²", 6], ha: ["広さ", "m²", 4], a: ["広さ", "m²", 2], "m²": ["広さ", "m²", 0], "cm²": ["広さ", "m²", -4],
  };
  const READ = { km: "キロメートル", m: "メートル", cm: "センチメートル", mm: "ミリメートル", t: "トン", kg: "キログラム", g: "グラム", mg: "ミリグラム",
    "m³": "立方メートル", L: "リットル", dL: "デシリットル", mL: "ミリリットル", "cm³": "立方センチメートル", "km²": "平方キロメートル", ha: "ヘクタール", a: "アール", "m²": "平方メートル", "cm²": "平方センチメートル" };
  // 接頭語（別表第四）
  const PREFIX = [["メガ", "M", 6, "100万倍"], ["キロ", "k", 3, "1000倍"], ["ヘクト", "h", 2, "100倍"], ["デシ", "d", -1, "10分の1"], ["センチ", "c", -2, "100分の1"], ["ミリ", "m", -3, "1000分の1"]];
  const PREFIX_WORDS = ["100万倍", "1000倍", "100倍", "10倍", "10分の1", "100分の1", "1000分の1"];
  const PREFIX_USE = { メガ: ["MW", "メガワット", "W（ワット）"], キロ: ["km", "キロメートル", "m（メートル）"], ヘクト: ["hPa", "ヘクトパスカル", "Pa（パスカル）"], デシ: ["dL", "デシリットル", "L（リットル）"], センチ: ["cm", "センチメートル", "m（メートル）"], ミリ: ["mg", "ミリグラム", "g（グラム）"] };

  // ---- 硬貨とお札（日本銀行）。重さは 0.01g、直径は 0.1mm、お札は mm ----
  const COINS = [
    { id: 1, name: "1円玉", w: 100, d: 200, mat: "アルミニウム" },
    { id: 5, name: "5円玉", w: 375, d: 220, mat: "黄銅", hole: true },
    { id: 10, name: "10円玉", w: 450, d: 235, mat: "青銅" },
    { id: 50, name: "50円玉", w: 400, d: 210, mat: "白銅", hole: true },
    { id: 100, name: "100円玉", w: 480, d: 226, mat: "白銅" },
    { id: 500, name: "500円玉", w: 710, d: 265, mat: "ニッケル黄銅などの3層" },
  ];
  const COIN = Object.fromEntries(COINS.map((c) => [c.id, c]));
  const NOTES = [{ id: 1000, name: "千円札", l: 150, s: 76 }, { id: 5000, name: "五千円札", l: 156, s: 76 }, { id: 10000, name: "一万円札", l: 160, s: 76 }];

  // ---- 数の書き方：n×10^s を、むだな0の無い10進の文字にする（3けたごとに「,」）----
  function fmt(n, s) {
    let str = String(n), neg = false;
    if (str[0] === "-") { neg = true; str = str.slice(1); }
    let ip, fp = "";
    if (s >= 0) ip = str + "0".repeat(s);
    else { const k = -s; str = str.padStart(k + 1, "0"); ip = str.slice(0, str.length - k); fp = str.slice(str.length - k).replace(/0+$/, ""); }
    ip = ip.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + ip + (fp ? "." + fp : "");
  }
  // 基の単位で n×10^e の量を、単位 u で書く
  const inU = (n, e, u) => fmt(n, e - UNITS[u][2]) + u;
  const g01 = (w) => fmt(w, -2) + "g"; // 0.01g の整数 → "4.5g"
  const rel = (a, b) => (UNITS[a][2] >= UNITS[b][2] ? `1${a}＝${fmt(1, UNITS[a][2] - UNITS[b][2])}${b}` : `${fmt(1, UNITS[b][2] - UNITS[a][2])}${a}＝1${b}`); // 1km＝1,000m・100cm＝1m

  // n（0で終わらない）と、表に出す小数のけた d から、問題の量を作る
  function amount(R, small) {
    let n; do { n = small ? int(R, 1, 9) : int(R, 2, 99); } while (n % 10 === 0);
    return n;
  }
  // 読みかえの問題（from → to）。量＝n×10^e（基の単位）。まちがいは 10倍・100倍・1000倍ずれた数
  function conv(R, from, to, e, n) {
    const ef = UNITS[from][2], et = UNITS[to][2], q = fmt(n, e - ef) + from;
    const a = fmt(n, e - et) + to, shifts = shuffle(R, [1, -1, 2, -2, 3, -3]);
    return { show: `${q} ＝ ？${to}`, ans: a, opts: opts(R, a, shifts.map((k) => fmt(n, e - et + k) + to)),
      chk: { t: "conv", n, e, from, to }, why: `${rel(from, to)}なので、${q}＝${a}です。` };
  }
  // 大きい単位 big と小さい単位 small の読みかえ。大きい単位の側の数に小数のけたを d だけ付ける（0なら整数）。向きは種で決める
  function convBS(R, big, small, d, n) {
    const e = UNITS[big][2] - d;
    return one(R, [0, 1]) ? conv(R, big, small, e, n) : conv(R, small, big, e, n);
  }
  const convPair = (R, pairs) => { const p = one(R, pairs); return one(R, [0, 1]) ? p : [p[1], p[0]]; };

  // 1問ずつの作り方：id・難しさ・分野・名前・見るところ（ヒント1）・覚えること（単位帳）・作り方
  const KINDS = [
    // ===== やさしい =====
    { id: "prefix", lv: 0, cat: "単位", name: "キロ・センチ・ミリ", look: "キロは1000、ヘクトは100、デシは10分の1、センチは100分の1、ミリは1000分の1です。",
      note: "単位の前の「キロ」は1000倍、「ヘクト」は100倍、「デシ」は10分の1、「センチ」は100分の1、「ミリ」は1000分の1（メガは100万倍）。",
      make(R) {
        const [name, sym, , a] = one(R, PREFIX), [u, read, base] = PREFIX_USE[name];
        return { scene: `${u}（${read}）の「${sym}」は「${name}」。`, show: `${u}`, ask: `${name}は、${base}の何倍？`, ans: a, opts: opts(R, a, shuffle(R, PREFIX_WORDS)),
          chk: { t: "pre", p: name }, why: `${name}は${a}を表す言葉です（計量単位令の接頭語）。1${u}は${base.replace(/（.*/, "")}の${a}。`, src: "L" };
      } },
    { id: "len", lv: 0, cat: "長さ", name: "長さの読みかえ", look: "1km＝1,000m、1m＝100cm、1cm＝10mm です。",
      note: "長さ：1km＝1,000m、1m＝100cm、1cm＝10mm、1m＝1,000mm。",
      make(R) { const [f, t] = convPair(R, [["km", "m"], ["m", "cm"], ["cm", "mm"], ["m", "mm"]]);
        const n = amount(R, true);
        return { scene: "長さを、ちがう単位で書きかえる。", ask: `何${t}？`, ...fixSmall(R, f, t, n), src: "L" }; } },
    { id: "mass", lv: 0, cat: "重さ", name: "重さの読みかえ", look: "1t＝1,000kg、1kg＝1,000g、1g＝1,000mg です。",
      note: "重さ：1t＝1,000kg、1kg＝1,000g、1g＝1,000mg。",
      make(R) { const [f, t] = convPair(R, [["t", "kg"], ["kg", "g"], ["g", "mg"]]), n = amount(R, true);
        return { scene: "重さを、ちがう単位で書きかえる。", ask: `何${t}？`, ...fixSmall(R, f, t, n), src: "L" }; } },
    { id: "vol", lv: 0, cat: "かさ", name: "かさの読みかえ", look: "1L＝10dL＝1,000mL、1dL＝100mL です。",
      note: "かさ：1L＝10dL、1L＝1,000mL、1dL＝100mL。",
      make(R) { const [f, t] = convPair(R, [["L", "dL"], ["L", "mL"], ["dL", "mL"]]), n = amount(R, true);
        return { scene: "かさ（体積）を、ちがう単位で書きかえる。", ask: `何${t}？`, ...fixSmall(R, f, t, n), src: "L" }; } },
    { id: "coin", lv: 0, cat: "硬貨", name: "硬貨の重さ", look: "1円玉は1g。重いのは500円玉（7.1g）、100円玉（4.8g）、10円玉（4.5g）です。",
      note: "硬貨の重さ：1円玉1g、5円玉3.75g、50円玉4g、10円玉4.5g、100円玉4.8g、500円玉7.1g。1円玉はちょうど1gなので、はかりの目安になる。",
      make(R) {
        const v = one(R, ["w2c", "c2w"]), c = one(R, COINS);
        if (v === "w2c") {
          const a = c.name;
          return { scene: "財布から硬貨を1枚出して、はかりにのせた。", show: g01(c.w), ask: `${g01(c.w)}だった。どの硬貨？`, ans: a,
            opts: opts(R, a, shuffle(R, COINS.filter((x) => x !== c).map((x) => x.name))), chk: { t: "w2c", w: c.w },
            why: `${c.name}1枚は${g01(c.w)}です（日本銀行）。`, src: "B" };
        }
        const a = g01(c.w);
        return { scene: `${c.name}を1枚、はかりにのせる。`, coins: [[c.id, 1]], ask: "重さは？", ans: a,
          opts: opts(R, a, shuffle(R, COINS.filter((x) => x !== c).map((x) => g01(x.w)))), chk: { t: "c2w", coin: c.id },
          why: `${c.name}1枚は${a}です（日本銀行）。`, src: "B" };
      } },

    // ===== ふつう =====
    { id: "area", lv: 1, cat: "広さ", name: "広さの単位", look: "1a＝100m²、1ha＝100a＝10,000m²。1m²＝10,000cm²（100cm×100cm）です。",
      note: "広さ：1a（アール）＝100m²（10m×10m）、1ha（ヘクタール）＝100a＝10,000m²（100m×100m）、1km²＝100ha、1m²＝10,000cm²。",
      make(R) { const [f, t] = convPair(R, [["a", "m²"], ["ha", "a"], ["ha", "m²"], ["km²", "ha"], ["m²", "cm²"]]), n = amount(R, true);
        return { scene: "畑や部屋の広さを、ちがう単位で書きかえる。", ask: `何${t}？`, ...fixSmall(R, f, t, n), src: "L" }; } },
    { id: "cc", lv: 1, cat: "かさ", name: "mL と cm³", look: "1L は 1辺10cm の立方体。1L＝1,000cm³ で、1mL＝1cm³ です。",
      note: "1L＝1,000cm³（1辺10cmの立方体）。だから 1mL＝1cm³。1m³＝1,000L。",
      make(R) { const [f, t] = convPair(R, [["mL", "cm³"], ["L", "cm³"], ["m³", "L"]]), n = amount(R, true);
        const P = fixSmall(R, f, t, n);
        if (f === "mL" || f === "cm³") P.why = `1mL＝1cm³なので、${P.show.split(" ")[0]}＝${P.ans}です（1L＝1,000cm³）。`;
        return { scene: "かさ（体積）を、ちがう単位で書きかえる。", ask: `何${t}？`, ...P, src: "L" }; } },
    { id: "csum", lv: 1, cat: "硬貨", name: "硬貨を合わせた重さ", look: "1枚の重さ×枚数を、硬貨ごとに足します。1円玉は1g、10円玉は4.5g、100円玉は4.8gです。",
      note: "硬貨を合わせた重さは、1枚の重さ×枚数を足す。例：100円玉3枚＝4.8g×3＝14.4g。",
      make(R) {
        const [x, y] = pickN(R, COINS, 2), cx = int(R, 1, 6), cy = int(R, 1, 6), tot = x.w * cx + y.w * cy, a = g01(tot);
        const ws = [x.w * cy + y.w * cx, tot + x.w, tot - x.w, tot + y.w, tot - y.w, x.w * cx, y.w * cy, tot * 10].filter((w) => w > 0 && w !== tot).map(g01);
        return { scene: `${x.name}${cx}枚と${y.name}${cy}枚を、はかりにのせる。`, coins: [[x.id, cx], [y.id, cy]], ask: "全部で何g？", ans: a, opts: opts(R, a, shuffle(R, ws)),
          chk: { t: "csum", list: [[x.id, cx], [y.id, cy]] }, why: `${x.name}${g01(x.w)}×${cx}＋${y.name}${g01(y.w)}×${cy}＝${a}です。`, src: "B" };
      } },
    { id: "note", lv: 1, cat: "お札", name: "お札の長さ", look: "お札のたては全部7.6cm。横は千円札15cm、五千円札15.6cm、一万円札16cmです。",
      note: "お札のたては全部76mm。横は千円札150mm（15cm）、五千円札156mm、一万円札160mm。千円札は15cmの物差しの代わりになる。",
      make(R) {
        const b = one(R, NOTES), k = one(R, [1, 1, 2, 3, 4, 5, 10]), cm = (mm) => fmt(mm * k, -1) + "cm";
        const a = cm(b.l), ws = [...NOTES.filter((x) => x !== b).map((x) => cm(x.l)), cm(b.s), cm(b.l * 10)];
        return { scene: k === 1 ? `${b.name}の横の長さをはかる。` : `${b.name}${k}枚を、横に1列にすき間なく並べる。`, notes: [[b.id, k]], ask: k === 1 ? "何cm？" : "端から端まで何cm？", ans: a, opts: opts(R, a, shuffle(R, ws)),
          chk: { t: "note", note: b.id, k }, why: `${b.name}の横は${b.l}mm（${fmt(b.l, -1)}cm）${k > 1 ? `。${k}枚で${a}` : ""}です（日本銀行）。`, src: "B" };
      } },
    { id: "cmp", lv: 1, cat: "くらべる", name: "どれがいちばん？", look: "全部を同じ単位（g や mL など）にそろえてから、くらべます。",
      note: "単位のちがう量をくらべるときは、全部を同じ単位にそろえる。1.2kg＝1,200g、0.95L＝950mL。",
      make(R) {
        const [q, sm, bg, word, low] = one(R, [["長さ", "cm", "m", "長い", "短い"], ["重さ", "g", "kg", "重い", "軽い"], ["かさ", "mL", "L", "多い", "少ない"]]);
        const c = int(R, 16, 60) * 50, ds = pickN(R, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6], 3).map((d) => d * 50);
        const vs = [c, ...ds.map((d) => c + d)]; // 基の小さい単位（mm・g・mL）での量
        const base = q === "長さ" ? "mm" : sm, eb = UNITS[base][2];
        const say = (v, u) => fmt(v, eb - UNITS[u][2]) + u;
        const items = vs.map((v) => [v, one(R, [sm, bg])]), hi = one(R, [true, false]);
        const pickV = hi ? Math.max(...vs) : Math.min(...vs), win = items.find((x) => x[0] === pickV), a = say(win[0], win[1]);
        return { scene: `${q}のちがう4つをくらべる。`, ask: `いちばん${hi ? word : low}のは？`, ans: a, opts: shuffle(R, items.map(([v, u]) => say(v, u))),
          chk: { t: "cmp", hi, items: items.map(([v, u]) => say(v, u)) }, why: `${sm}にそろえると ${items.map(([v]) => say(v, sm)).join("・")}。いちばん${hi ? word : low}のは${a}です。`, src: "L" };
      } },

    // ===== むずかしい =====
    { id: "multi", lv: 2, cat: "単位", name: "小数の読みかえ", look: "1つずつ読みかえます。小数点は、10倍で右へ1つ、100倍で2つ動きます。",
      note: "大きい単位→小さい単位は、かける（小数点が右へ動く）。小さい単位→大きい単位は、わる（小数点が左へ動く）。例：0.25km＝250m＝25,000cm。",
      make(R) { const [b, s] = one(R, [["km", "cm"], ["km", "mm"], ["t", "g"], ["kg", "mg"], ["L", "mL"], ["m³", "mL"], ["m", "mm"], ["kg", "g"], ["km", "m"]]);
        const n = amount(R, false), d = int(R, 1, 2), P = convBS(R, b, s, d, n), t = P.chk.to;
        return { scene: "小数のある量を、ちがう単位で書きかえる。", ask: `何${t}？`, ...P, src: "L" }; } },
    { id: "area2", lv: 2, cat: "広さ", name: "田畑の広さ", look: "1ha＝100a＝10,000m²。広さは長さの2乗なので、100倍ずつ変わります。",
      note: "1ha＝100a＝10,000m²、1km²＝100ha。広さの単位は100倍ずつ（長さの10倍の2乗）。",
      make(R) { const [b, s] = one(R, [["ha", "a"], ["ha", "m²"], ["a", "m²"], ["km²", "ha"], ["km²", "a"]]);
        const n = amount(R, false), d = int(R, 1, 2), P = convBS(R, b, s, d, n), t = P.chk.to;
        return { scene: "田んぼや畑の広さを、ちがう単位で書きかえる。", ask: `何${t}？`, ...P, src: "L" }; } },
    { id: "ccount", lv: 2, cat: "硬貨", name: "重さから枚数", look: "全部の重さ÷1枚の重さ＝枚数。kg は g に直してからわります。",
      note: "枚数は、全部の重さ÷1枚の重さ。1円玉1,000枚はちょうど1kg。",
      make(R) {
        const c = one(R, COINS), k = one(R, [10, 20, 40, 50, 100, 200, 400, 500, 1000, 2000]), tot = c.w * k; // 0.01g
        const kgOk = tot % 10000 === 0 || (tot >= 100000 && one(R, [true, false]));
        const shown = kgOk ? fmt(tot, -5) + "kg" : g01(tot), a = `${fmt(k, 0)}枚`;
        const ws = [k * 10, k / 10, k * 100, k / 100, k * 2, k / 2].filter((x) => Number.isInteger(x) && x >= 1 && x !== k).map((x) => `${fmt(x, 0)}枚`);
        return { scene: `同じ${c.name}だけを集めて、重さをはかった。`, show: shown, coins: [[c.id, 0]], ask: `${shown}だった。何枚ある？`, ans: a, opts: opts(R, a, shuffle(R, ws)),
          chk: { t: "ccount", coin: c.id, shown }, why: `${c.name}1枚は${g01(c.w)}。${shown}${kgOk ? `＝${g01(tot)}` : ""}÷${g01(c.w)}＝${fmt(k, 0)}枚です。`, src: "B" };
      } },
    { id: "box", lv: 2, cat: "かさ", name: "箱に入る水", look: "たて×よこ×深さ で cm³。1L＝1,000cm³ です。",
      note: "直方体に入るかさ＝たて×よこ×深さ。cm で計算したら cm³ になり、1,000cm³＝1L。",
      make(R) {
        const [x, y, z] = [int(R, 1, 12) * 5, int(R, 1, 12) * 5, int(R, 1, 8) * 5], v = x * y * z, a = fmt(v, -3) + "L";
        return { scene: `内側が たて${x}cm・よこ${y}cm・深さ${z}cm の入れ物。`, show: `${x}cm × ${y}cm × ${z}cm`, ask: "いっぱいまで入る水は何L？", ans: a,
          opts: opts(R, a, shuffle(R, [1, -1, 2, -2, 3]).map((k) => fmt(v, k - 3) + "L")), chk: { t: "box", d: [x, y, z] },
          why: `${x}×${y}×${z}＝${fmt(v, 0)}cm³。1L＝1,000cm³なので${a}です。`, src: "L" };
      } },
  ];

  // やさしい・ふつうの読みかえ：大きい単位→小さい単位は 1〜9、小さい単位→大きい単位は答えが 1〜9 になる量にする（小数を出さない）
  function fixSmall(R, f, t, n) {
    const ef = UNITS[f][2], et = UNITS[t][2];
    return conv(R, f, t, Math.max(ef, et), n);
  }

  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1問を作る。tag は「種類|種」（例 "len|2026-11-07:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)));
    return { tag, kind, lv: k.lv, cat: k.cat, name: k.name, look: k.look, note: k.note, ...p };
  }
  // 同じ問題かを見分ける印（場面・量・答えが同じなら、選び肢の並びがちがっても同じ問題）
  const keyOf = (P) => JSON.stringify([P.kind, P.scene, P.show || null, P.ask, P.ans]);

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  // 単位帳の早見
  const TABLE = [
    ["長さ", ["1km＝1,000m", "1m＝100cm", "1cm＝10mm"]],
    ["重さ", ["1t＝1,000kg", "1kg＝1,000g", "1g＝1,000mg"]],
    ["かさ", ["1L＝10dL＝1,000mL", "1L＝1,000cm³", "1mL＝1cm³", "1m³＝1,000L"]],
    ["広さ", ["1km²＝100ha", "1ha＝100a＝10,000m²", "1a＝100m²", "1m²＝10,000cm²"]],
    ["言葉", PREFIX.map((p) => `${p[0]}（${p[1]}）＝${p[3]}`)],
    ["硬貨", COINS.map((c) => `${c.name} ${g01(c.w)}・直径${fmt(c.d, -1)}mm`)],
    ["お札", NOTES.map((b) => `${b.name} ${b.s}×${b.l}mm`)],
  ];

  const TANI = { KINDS, BY, LV, SRC, UNITS, READ, PREFIX, COINS, COIN, NOTES, TABLE, fmt, inU, g01, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = TANI; else root.TANI = TANI;
})(typeof self !== "undefined" ? self : this);
