import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://ant.gqy20.top/species");
  await page.waitForTimeout(2000); // give it time to load
  await page.screenshot({ path: "public/species.png", fullPage: true });
  await browser.close();
})();
