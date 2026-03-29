import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = process.env.UI_AUDIT_BASE_URL || "http://localhost:3002";
const pages = ["/feed", "/tasks", "/polybot", "/bridget", "/commands"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  for (const path of pages) {
    const url = `${base}${path}`;
    const row = {
      page: path,
      viewport: viewport.name,
      status: "ok",
      hasOverflowX: false,
      scrollWidth: 0,
      viewportWidth: viewport.width,
      issues: [],
    };

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 20000,
      });
      if (!response || !response.ok()) {
        row.status = "error";
        row.issues.push(`HTTP ${response?.status() ?? "NO_RESPONSE"}`);
      }

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const viewportWidth = window.innerWidth;
        return { scrollWidth, viewportWidth };
      });

      row.scrollWidth = metrics.scrollWidth;
      row.viewportWidth = metrics.viewportWidth;
      row.hasOverflowX = metrics.scrollWidth > metrics.viewportWidth + 1;
      if (row.hasOverflowX) {
        row.status = "error";
        row.issues.push(
          `overflow-x ${metrics.scrollWidth} > ${metrics.viewportWidth}`,
        );
      }
    } catch (error) {
      row.status = "error";
      row.issues.push(String(error));
    }

    results.push(row);
  }

  await context.close();
}

await browser.close();

const summary = {
  base,
  totalChecks: results.length,
  failedChecks: results.filter((r) => r.status !== "ok").length,
  checks: results,
};

writeFileSync(
  "/tmp/playwright-ux-audit.json",
  JSON.stringify(summary, null, 2),
);
console.log(
  `Wrote /tmp/playwright-ux-audit.json with ${summary.totalChecks} checks`,
);
