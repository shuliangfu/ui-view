const { chromium } = require(
  "/Users/shuliangfu/worker/deno/dreamer-jsr/ui-view/node_modules/.deno/playwright@1.59.1/node_modules/playwright",
);
const fs = require("fs");
const outDir = "/tmp/tree-repro";
fs.mkdirSync(outDir, { recursive: true });
const BASE = process.env.TREE_DOCS_URL || "http://127.0.0.1:3011";

async function dump(page, label) {
  return page.evaluate((label) => {
    const root = document.querySelector("[data-tree-demo='cascade']");
    if (!root) return { label, error: "no cascade" };
    const rows = [...root.querySelectorAll("[data-tree-node-key]")].map((
      el,
    ) => ({
      key: el.getAttribute("data-tree-node-key"),
      selected: el.getAttribute("data-tree-selected"),
      aria: el.getAttribute("aria-selected"),
      checkVisual: el.getAttribute("data-tree-check-visual"),
      bg: getComputedStyle(el).backgroundColor,
    }));
    const display =
      root.querySelector("[data-tree-keys-display]")?.textContent ?? "";
    const checks = [...root.querySelectorAll("[data-tree-check-key]")].map((
      el,
    ) => ({
      key: el.getAttribute("data-tree-check-key"),
      checked: el.checked,
      indeterminate: el.indeterminate,
      aria: el.getAttribute("aria-checked"),
    }));
    return { label, display, rows, checks };
  }, label);
}

async function click(page, sel) {
  const loc = page.locator(`[data-tree-demo='cascade'] ${sel}`).first();
  await loc.scrollIntoViewIfNeeded();
  await loc.click({ force: true });
}

async function ensureLeafVisible(page) {
  if (
    (await page.locator(
      "[data-tree-demo='cascade'] [data-tree-select-key='1-2-1']",
    ).count()) === 0
  ) {
    await click(page, "[data-tree-expand-key='1-2']");
    await page.waitForTimeout(300);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
  });
  const results = { ok: [], fail: [] };

  await page.goto(`${BASE}/desktop/data-display/tree`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("[data-tree-demo='cascade'] [data-dreamer-tree]", {
    timeout: 60000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/A0-initial.png` });

  // 1) title leaf -> only leaf selected, count 0
  await ensureLeafVisible(page);
  await click(page, "[data-tree-select-key='1-2-1']");
  await page.waitForTimeout(400);
  let d = await dump(page, "title-121");
  await page.screenshot({ path: `${outDir}/A1-title-121.png` });
  const leafSel = d.rows.find((r) => r.key === "1-2-1");
  const parentSel = d.rows.find((r) => r.key === "1-2");
  if (
    leafSel?.selected === "true" && parentSel?.selected == null &&
    /共\s*0/.test(d.display)
  ) {
    results.ok.push("title-121: leaf selected, parent not, count 0");
  } else {
    results.fail.push({ step: "title-121", d });
  }

  // 2) check leaf 1-2-1 -> checked includes leaf; parent 1-2 full check (only child); parent not selected; display count>0
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-tree-demo='cascade'] [data-dreamer-tree]");
  await page.waitForTimeout(500);
  await ensureLeafVisible(page);
  await click(page, "[data-tree-check-key='1-2-1']");
  await page.waitForTimeout(500);
  d = await dump(page, "check-121");
  await page.screenshot({ path: `${outDir}/A2-check-121.png` });
  const leafCb = d.checks.find((c) => c.key === "1-2-1");
  const p12 = d.checks.find((c) => c.key === "1-2");
  const p1 = d.checks.find((c) => c.key === "1");
  const p12row = d.rows.find((r) => r.key === "1-2");
  if (
    leafCb?.checked &&
    p12?.checked &&
    !p12row?.selected &&
    (p1?.indeterminate || p1?.aria === "mixed") &&
    /1-2-1/.test(d.display) &&
    /共\s*[1-9]/.test(d.display)
  ) {
    results.ok.push("check-121: cascade + display sync + parent not selected");
  } else {
    results.fail.push({ step: "check-121", d });
  }

  // 3) check only 1-1 -> parent 1 half; 1-2 not selected
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-tree-demo='cascade'] [data-dreamer-tree]");
  await page.waitForTimeout(500);
  await click(page, "[data-tree-check-key='1-1']");
  await page.waitForTimeout(500);
  d = await dump(page, "check-11-half");
  await page.screenshot({ path: `${outDir}/A3-check-11-half.png` });
  const c11 = d.checks.find((c) => c.key === "1-1");
  const c1 = d.checks.find((c) => c.key === "1");
  const r1 = d.rows.find((r) => r.key === "1");
  if (
    c11?.checked &&
    (c1?.indeterminate || c1?.aria === "mixed") &&
    !c1?.checked &&
    r1?.selected == null &&
    /共\s*1/.test(d.display)
  ) {
    results.ok.push("check-11: parent half, not selected, count 1");
  } else {
    results.fail.push({ step: "check-11-half", d });
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.fail.length) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
