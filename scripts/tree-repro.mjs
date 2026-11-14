import { chromium } from "/Users/shuliangfu/worker/deno/dreamer-jsr/ui-view/node_modules/.deno/playwright@1.59.1/node_modules/playwright/index.js";

const BASE = process.env.TREE_DOCS_URL || "http://127.0.0.1:3007";
const outDir = "/tmp/tree-repro";

async function dumpSelected(page, label) {
  return page.evaluate((label) => {
    const root = document.querySelector('[data-tree-demo="cascade"]');
    if (!root) return { label, error: "no cascade" };
    const rows = [...root.querySelectorAll("[data-tree-node-key]")].map((
      el,
    ) => ({
      key: el.getAttribute("data-tree-node-key"),
      selected: el.getAttribute("data-tree-selected"),
      aria: el.getAttribute("aria-selected"),
      checkVisual: el.getAttribute("data-tree-check-visual"),
      bg: getComputedStyle(el).backgroundColor,
      cls: el.className.slice(0, 120),
    }));
    const display =
      root.querySelector("[data-tree-keys-display]")?.textContent ?? "";
    const checks = [...root.querySelectorAll("[data-tree-check-key]")].map((
      el,
    ) => ({
      key: el.getAttribute("data-tree-check-key"),
      checked: el.checked,
      indeterminate: el.indeterminate,
    }));
    return { label, display, rows, checks };
  }, label);
}

async function clickSel(page, sel) {
  const loc = page.locator(`[data-tree-demo="cascade"] ${sel}`).first();
  await loc.scrollIntoViewIfNeeded();
  await loc.click({ force: true });
}

async function ensureExpanded(page) {
  const leaf = page.locator(
    '[data-tree-demo="cascade"] [data-tree-select-key="1-2-1"]',
  );
  if (await leaf.count() === 0) {
    await clickSel(page, '[data-tree-expand-key="1-2"]');
    await page.waitForTimeout(300);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto(`${BASE}/desktop/data-display/tree`, {
  waitUntil: "networkidle",
  timeout: 120000,
});
await page.waitForSelector('[data-tree-demo="cascade"] [data-dreamer-tree]', {
  timeout: 60000,
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/00-initial.png`, fullPage: false });

await ensureExpanded(page);
await page.screenshot({ path: `${outDir}/01-expanded.png` });

// Click leaf TITLE
await clickSel(page, '[data-tree-select-key="1-2-1"]');
await page.waitForTimeout(400);
const afterTitle = await dumpSelected(page, "after-title-1-2-1");
await page.screenshot({ path: `${outDir}/02-after-title-121.png` });
console.log(JSON.stringify(afterTitle, null, 2));

// Reload and click leaf CHECKBOX
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector('[data-tree-demo="cascade"] [data-dreamer-tree]');
await page.waitForTimeout(400);
await ensureExpanded(page);
await clickSel(page, '[data-tree-check-key="1-2-1"]');
await page.waitForTimeout(400);
const afterCheck = await dumpSelected(page, "after-check-1-2-1");
await page.screenshot({ path: `${outDir}/03-after-check-121.png` });
console.log(JSON.stringify(afterCheck, null, 2));

// Click parent title 1-2
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector('[data-tree-demo="cascade"] [data-dreamer-tree]');
await page.waitForTimeout(400);
await clickSel(page, '[data-tree-select-key="1-2"]');
await page.waitForTimeout(400);
const afterParent = await dumpSelected(page, "after-title-1-2");
await page.screenshot({ path: `${outDir}/04-after-title-12.png` });
console.log(JSON.stringify(afterParent, null, 2));

await browser.close();
