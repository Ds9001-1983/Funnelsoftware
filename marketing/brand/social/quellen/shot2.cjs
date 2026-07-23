// Größen-flexibler Screenshot-Helfer: node shot2.js <input.html> <output.png> <breite> <hoehe>
const { chromium } = require('/Users/dennissasse/Desktop/DEV/Trichterwerk/Funnelsoftware/node_modules/playwright');

(async () => {
  const [, , htmlPath, outPath, wS, hS] = process.argv;
  if (!htmlPath || !outPath || !wS || !hS) {
    console.error('Usage: node shot2.js <input.html> <output.png> <breite> <hoehe>');
    process.exit(1);
  }
  const width = parseInt(wS, 10), height = parseInt(hS, 10);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log(`OK ${width}x${height} ${outPath}`);
})().catch((e) => { console.error(e); process.exit(1); });
