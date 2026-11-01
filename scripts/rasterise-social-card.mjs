// Renders a served 1200 × 630 social-card SVG to the PNG that unfurlers read.
// Usage: node scripts/rasterise-social-card.mjs <served-svg-url> <output.png>
import { chromium } from "@playwright/test";

const [url, output] = process.argv.slice(2);
if (!url || !output) {
  console.error("Usage: node scripts/rasterise-social-card.mjs <served-svg-url> <output.png>");
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: output,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
} finally {
  await browser.close();
}
