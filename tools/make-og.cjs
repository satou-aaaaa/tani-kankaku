// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、見本の単位だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const chip = (t) => `<span style="background:#fff;border:4px solid #1f2a44;border-radius:12px;padding:6px 22px;font-size:48px;font-weight:900">${t}</span>`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:60px 80px;background:#f4f1e8;background-image:linear-gradient(#ebe5d3 2px,transparent 2px),linear-gradient(90deg,#ebe5d3 2px,transparent 2px);background-size:40px 40px;color:#1f2a44;display:flex;flex-direction:column;justify-content:center;gap:30px">
    <div style="font-size:34px;color:#86291a;letter-spacing:.06em">長さ・重さ・かさ・広さ・硬貨・お札</div>
    <div style="font-size:124px;font-weight:900;letter-spacing:.08em;color:#142a52;line-height:1">単位の<span style="color:#b8402a">感覚</span></div>
    <div style="display:flex;gap:18px">${["km", "kg", "mL", "ha", "cm³"].map(chip).join("")}</div>
    <div style="font-size:34px;font-weight:700">量の見当、つけられる？　<span style="font-size:28px;color:#4f566a;font-weight:500">計量単位令・日本銀行の資料から・1日5問</span></div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
