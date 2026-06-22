const { chromium } = require("playwright");

(async () => {
  const appUrl = process.env.APP_URL || "http://127.0.0.1:5173/";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.locator("h1").waitFor({ timeout: 15000 });
  await page.locator("canvas").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1200);

  const title = await page.locator("h1").textContent();
  const viewport = await page.locator(".viewport").boundingBox();
  const zoomBefore = await page.evaluate(() => window.devicePixelRatio);
  if (viewport) {
    await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
    await page.mouse.wheel(0, -600);
  }
  const zoomAfter = await page.evaluate(() => window.devicePixelRatio);
  const result = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const dataUrl = canvas.toDataURL("image/png");
    return {
      width: canvas.width,
      height: canvas.height,
      hasWebgl: Boolean(gl),
      imageBytes: dataUrl.length
    };
  });

  if (title !== "Protoverse Lab") {
    throw new Error(`Unexpected title: ${title}`);
  }
  if (zoomBefore !== zoomAfter) {
    throw new Error(`Browser zoom changed during universe wheel zoom: ${zoomBefore} -> ${zoomAfter}`);
  }
  if (result.width <= 0 || result.height <= 0 || !result.hasWebgl || result.imageBytes < 5000) {
    throw new Error(`Canvas smoke failed: ${JSON.stringify(result)}`);
  }

  console.log(`browser smoke passed: ${JSON.stringify(result)}`);
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
