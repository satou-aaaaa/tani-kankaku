// アプリのアイコン（icon-192.png・icon-512.png）を作る。生成りの地に、物差しの目盛りと「km」、朱の印。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    const ticks = [...Array(11)].map((_, i) => `<line x1="${18 + i * 6.4}" y1="62" x2="${18 + i * 6.4}" y2="${i % 5 === 0 ? 48 : 54}"/>`).join("");
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#f4f1e8"/>
      <rect x="10" y="40" width="80" height="26" rx="4" fill="#fff" stroke="#1f2a44" stroke-width="2.5"/>
      <g stroke="#1f2a44" stroke-width="2" stroke-linecap="round">${ticks}</g>
      <text x="50" y="32" font-size="22" font-weight="900" text-anchor="middle" fill="#1f2a44" font-family="sans-serif">km</text>
      <circle cx="80" cy="80" r="7" fill="#b8402a"/>
      <text x="38" y="86" font-size="16" font-weight="900" text-anchor="middle" fill="#b8402a" font-family="sans-serif">kg L</text></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
