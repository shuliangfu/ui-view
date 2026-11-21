/** WRITTEN-UNRUN. Complementary remaining operations on already partial-verified DataPanel live examples. Does not replace existing physical coverage. */
import { readTextFile } from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open, visible } from "./driver.ts";

const route = "/desktop/data-display/data-panel";

function panelOf(page: Page, key: string) {
  return page.getByTestId("panel-" + key);
}

async function ready(panel: Locator) {
  await eventually(async () =>
    await panel.locator('[data-testid^="dp-row-"]').count() > 0
  );
}

async function rowIds(panel: Locator) {
  return await panel.locator('[data-testid^="dp-row-"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-testid")!.slice(7))
  );
}

function visibleMenu(page: Page, id: string) {
  return page.locator(`[data-testid="${id}"]:visible`);
}

async function openColumnMenu(page: Page, panel: Locator) {
  const menu = visibleMenu(page, "dp-column-menu");
  const columns = panel.getByTestId("dp-columns");
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Escape");
    await visible(menu, false);
    await columns.scrollIntoViewIfNeeded();
    const box = await columns.boundingBox();
    if (box) {
      const y = 220;
      if (Math.abs(box.y - y) > 8) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, box.y - y);
        await eventually(async () => {
          const r = await columns.boundingBox();
          return r !== null && Math.abs(r.y - y) < 8;
        });
      }
    }
    await columns.click({ delay: 160 });
    try {
      await visible(menu);
      const email = menu.getByTestId("dp-col-email");
      await email.waitFor({ state: "visible" });
      await email.scrollIntoViewIfNeeded();
      return menu;
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  return menu;
}

async function hideEmailThenReset(page: Page, panel: Locator) {
  for (let i = 0; i < 3; i++) {
    const menu = await openColumnMenu(page, panel);
    const email = page.locator('[data-testid="dp-column-menu"] label').filter({
      hasText: "邮箱",
    });
    await email.click({ delay: 160 });
    await page.keyboard.press("Escape");
    await visible(menu, false);
    try {
      await eventually(async () =>
        !(await panel.locator("thead").textContent())?.includes("邮箱")
      );
      break;
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  const menu2 = await openColumnMenu(page, panel);
  await menu2.locator('[data-testid="dp-col-reset"]').click({ delay: 160 });
  await page.keyboard.press("Escape");
  await visible(menu2, false);
  await eventually(async () =>
    !!(await panel.locator("thead").textContent())?.includes("邮箱")
  );
}

async function sortNameChangesOrder(panel: Locator) {
  const before = await rowIds(panel);
  const sort = panel.getByTestId("dp-sort-name");
  for (let i = 0; i < 3; i++) {
    await sort.click({ delay: 180 });
    try {
      await eventually(async () =>
        JSON.stringify(await rowIds(panel)) !== JSON.stringify(before)
      );
      break;
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  const after = await rowIds(panel);
  expect(after).not.toEqual(before);
  expect(after.length).toBe(before.length);
}

async function exportCsvContains(
  page: Page,
  panel: Locator,
  needle: string,
) {
  await panel.getByTestId("dp-export").click({ delay: 180 });
  const event = page.waitForEvent("download");
  await page.getByTestId("dp-export-csv").click({ delay: 180 });
  const file = await event;
  expect(await file.failure()).toBe(null);
  const path = await file.path();
  if (!path) throw new Error("csv download missing path");
  const text = await readTextFile(path);
  expect(text.includes(needle)).toBe(true);
  return text;
}

async function paginateIfNeeded(panel: Locator) {
  const next = panel.getByTestId("dp-next");
  if (await next.count() === 0 || await next.isDisabled()) return false;
  const before = await rowIds(panel);
  await next.click({ delay: 180 });
  await eventually(async () =>
    JSON.stringify(await rowIds(panel)) !== JSON.stringify(before)
  );
  expect(await rowIds(panel)).not.toEqual(before);
  const prev = panel.getByTestId("dp-prev");
  await prev.click({ delay: 180 });
  await eventually(async () =>
    JSON.stringify(await rowIds(panel)) === JSON.stringify(before)
  );
  return true;
}

function formDialog(page: Page) {
  return page.getByRole("dialog").filter({ has: page.getByTestId("dp-form") });
}

function searchDialog(page: Page) {
  return page.getByRole("dialog").filter({
    has: page.getByTestId("dp-search"),
  });
}

async function createAndView(
  page: Page,
  panel: Locator,
  name: string,
) {
  await panel.getByTestId("dp-create").click({ delay: 180 });
  const form = formDialog(page);
  await visible(form);
  await form.getByTestId("dp-form-cancel").click({ delay: 160 });
  await visible(form, false);
  await panel.getByTestId("dp-create").click({ delay: 180 });
  const again = formDialog(page);
  await visible(again);
  await again.getByTestId("dp-fld-name").locator("input").fill(name);
  await again.getByTestId("dp-fld-email").locator("input").fill(
    "partial-remaining@example.test",
  );
  await again.getByTestId("dp-form-submit").click({ delay: 180 });
  await visible(again, false);
  const rowOf = () =>
    panel.locator('[data-testid^="dp-row-"]').filter({ hasText: name });
  const prev = panel.getByTestId("dp-prev");
  for (let i = 0; i < 10; i++) {
    if (await prev.count() === 0 || await prev.isDisabled()) break;
    await prev.click({ delay: 80 });
  }
  if (await rowOf().count() === 0) {
    const next = panel.getByTestId("dp-next");
    for (let i = 0; i < 20; i++) {
      if (await rowOf().count()) break;
      if (await next.count() === 0 || await next.isDisabled()) break;
      await next.click({ delay: 120 });
    }
  }
  const row = rowOf().first();
  await visible(row);
  const id = (await row.getAttribute("data-testid"))!.slice(7);
  await panel.getByTestId("dp-view-" + id).click({ delay: 180 });
  await visible(page.getByTestId("dp-view"));
  expect((await page.getByTestId("dp-view").textContent()) ?? "").toContain(
    name,
  );
  await page.getByTestId("dp-view-close").click({ delay: 160 });
  await visible(page.getByTestId("dp-view"), false);
  return id;
}

async function selectFirstEnabled(panel: Locator) {
  const boxes = panel.locator(
    'tbody [data-testid^="dp-row-"] input[type="checkbox"]',
  );
  const n = await boxes.count();
  for (let i = 0; i < n; i++) {
    if (await boxes.nth(i).isEnabled()) {
      await boxes.nth(i).check();
      await visible(panel.getByTestId("dp-batch-bar"));
      return;
    }
  }
  throw new Error("no enabled row checkbox");
}

async function inlineNameSaveCancel(panel: Locator, id: string) {
  const cell = panel.getByTestId("dp-edit-name-" + id);
  const editor = panel.getByTestId("dp-inline-name");
  const original = ((await cell.textContent()) ?? "").trim();
  await cell.dblclick({ delay: 150 });
  const input = editor.locator("input");
  await visible(input);
  await input.fill(original + "-keep");
  await input.press("Enter");
  await visible(editor, false);
  await eventually(async () =>
    ((await cell.textContent()) ?? "").trim() === original + "-keep"
  );
  await cell.dblclick({ delay: 150 });
  await input.fill(original + "-drop");
  await input.press("Escape");
  await visible(editor, false);
  await eventually(async () =>
    ((await cell.textContent()) ?? "").trim() === original + "-keep"
  );
}

async function firstName(panel: Locator) {
  const ids = await rowIds(panel);
  if (!ids[0]) throw new Error("no rows");
  return ((await panel.getByTestId("dp-edit-name-" + ids[0]).textContent()) ??
    (await panel.getByTestId("dp-row-" + ids[0]).textContent()) ??
    "").trim();
}

async function present(root: Locator, id: string) {
  return await root.getByTestId(id).count() > 0;
}

/** Cover leftover shared toolbar/row actions that exist on this instance. */
async function coverRemainingChrome(
  page: Page,
  panel: Locator,
  createdId?: string,
) {
  if (await present(panel, "dp-export")) {
    await panel.getByTestId("dp-export").click({ delay: 180 });
    const exportMenu = visibleMenu(page, "dp-export-menu");
    await visible(exportMenu);
    for (const fmt of ["xlsx", "csv", "json", "xml", "html"]) {
      await visible(exportMenu.getByTestId("dp-export-" + fmt));
    }
    const event = page.waitForEvent("download");
    await exportMenu.getByTestId("dp-export-json").click({ delay: 180 });
    const file = await event;
    expect(await file.failure()).toBe(null);
    const path = await file.path();
    if (!path) throw new Error("json download missing path");
    const parsed = JSON.parse(await readTextFile(path));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  }
  if (await present(panel, "dp-import")) {
    await panel.getByTestId("dp-import").click({ delay: 160 });
    const importMenu = visibleMenu(page, "dp-import-menu");
    await visible(importMenu);
    for (const fmt of ["xlsx", "csv", "json", "xml"]) {
      await visible(importMenu.getByTestId("dp-import-" + fmt));
    }
    await page.keyboard.press("Escape");
    await visible(importMenu, false);
  }
  if (await present(panel, "dp-density")) {
    const table = panel.locator("[data-density]").first();
    await panel.getByTestId("dp-density").click({ delay: 160 });
    const densityMenu = visibleMenu(page, "dp-density-menu");
    await visible(densityMenu);
    await densityMenu.getByTestId("dp-density-compact").click({ delay: 160 });
    await eventually(async () =>
      await table.getAttribute("data-density") === "compact"
    );
    await panel.getByTestId("dp-density").click({ delay: 160 });
    await visible(densityMenu);
    await densityMenu.getByTestId("dp-density-comfortable").click({
      delay: 160,
    });
    await eventually(async () =>
      await table.getAttribute("data-density") === "comfortable"
    );
  }
  if (await present(panel, "dp-print")) {
    await panel.getByTestId("dp-print").click({ delay: 160 });
  }
  if (await present(panel, "dp-copy")) {
    await page.context().grantPermissions([
      "clipboard-read",
      "clipboard-write",
    ]);
    const boxes = panel.locator(
      'tbody [data-testid^="dp-row-"] input[type="checkbox"]',
    );
    const n = await boxes.count();
    let picked = false;
    for (let i = 0; i < n; i++) {
      const box = boxes.nth(i);
      if (await box.isEnabled()) {
        if (!await box.isChecked()) await box.check();
        picked = true;
        break;
      }
    }
    if (picked) {
      await page.evaluate(() => navigator.clipboard.writeText("not-table"));
      await panel.getByTestId("dp-copy").click({ delay: 180 });
      await eventually(async () =>
        await page.evaluate(() => navigator.clipboard.readText()) !==
          "not-table"
      );
      expect(
        (await page.evaluate(() => navigator.clipboard.readText())).length,
      ).toBeGreaterThan(0);
    }
  }
  const ids = await rowIds(panel);
  const id = createdId && ids.includes(createdId) ? createdId : ids[0];
  if (id) {
    if (await present(panel, "dp-edit-" + id)) {
      await panel.getByTestId("dp-edit-" + id).click({ delay: 180 });
      const form = formDialog(page);
      await visible(form);
      await form.getByTestId("dp-form-cancel").click({ delay: 160 });
      await visible(form, false);
    }
    if (await present(panel, "dp-delete-" + id)) {
      await panel.getByTestId("dp-delete-" + id).click({ delay: 180 });
      const confirm = page.locator(
        "[data-dreamer-popconfirm-panel]:visible",
      );
      await visible(confirm);
      await confirm.getByRole("button", { name: "取消", exact: true }).click();
      await visible(confirm, false);
      await visible(panel.getByTestId("dp-row-" + id));
    }
  }
}

describe("DataPanel partial remaining written", () => {
  for (const width of [390, 1280]) {
    it(
      `DataPanel 基础用法剩余 @${width}：本例分页/列设置/排序/导出/新增详情`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-basic");
        await ready(panel);
        expect(await paginateIfNeeded(panel)).toBe(true);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        const name = "basic-" + crypto.randomUUID().slice(0, 8);
        const createdId = await createAndView(page, panel, name);
        await exportCsvContains(page, panel, name);
        await selectFirstEnabled(panel);
        await coverRemainingChrome(page, panel, createdId);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 搜索表单剩余 @${width}：本例分页/列设置/排序/导出（无新增）`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-search");
        await ready(panel);
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        expect(await paginateIfNeeded(panel)).toBe(true);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        await exportCsvContains(page, panel, "Alice");
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 展开搜索剩余 @${width}：本例分页/列设置/排序/导出（无新增）`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-search-expand");
        await ready(panel);
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        expect(await paginateIfNeeded(panel)).toBe(true);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        await exportCsvContains(page, panel, "Alice");
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 地址栏剩余 @${width}：本例排序/列设置/新增详情/导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-sync-url");
        await ready(panel);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        const name = "sync-" + crypto.randomUUID().slice(0, 8);
        const createdId = await createAndView(page, panel, name);
        await exportCsvContains(page, panel, name);
        await coverRemainingChrome(page, panel, createdId);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 表格功能剩余 @${width}：本例行内姓名保存/取消，导出与列设置`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-table");
        await ready(panel);
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        await inlineNameSaveCancel(panel, "2");
        const score = panel.getByTestId("dp-edit-score-2");
        const original = ((await score.textContent()) ?? "").trim();
        await score.dblclick({ delay: 150 });
        const editor = panel.getByTestId("dp-inline-score").locator("input");
        await editor.fill("88");
        await editor.press("Enter");
        await eventually(async () =>
          ((await score.textContent()) ?? "").trim() === "88"
        );
        await score.dblclick({ delay: 150 });
        await editor.fill("1");
        await editor.press("Escape");
        await eventually(async () =>
          ((await score.textContent()) ?? "").trim() === "88"
        );
        expect(original).not.toBe("");
        const status = panel.getByTestId("dp-switch-2");
        const input = status.locator("input[type='checkbox']");
        const before = await input.isChecked();
        await status.locator("label").click({ delay: 160 });
        await eventually(async () => await input.isChecked() !== before);
        await hideEmailThenReset(page, panel);
        await exportCsvContains(page, panel, "Bob-keep");
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 单元格编辑剩余 @${width}：本例勾选、详情与编辑弹层（无导入导出新增）`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-cell");
        await ready(panel);
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        expect(await panel.getByTestId("dp-export").count()).toBe(0);
        expect(await panel.getByTestId("dp-columns").count()).toBe(0);
        await selectFirstEnabled(panel);
        await panel.getByTestId("dp-view-1").click({ delay: 180 });
        await visible(page.getByTestId("dp-view"));
        expect((await page.getByTestId("dp-view").textContent()) ?? "")
          .toContain("Alice");
        await page.getByTestId("dp-view-close").click({ delay: 160 });
        await visible(page.getByTestId("dp-view"), false);
        await panel.getByTestId("dp-edit-1").click({ delay: 180 });
        const form = formDialog(page);
        await visible(form);
        await form.getByTestId("dp-form-cancel").click({ delay: 160 });
        await visible(form, false);
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel CRUD 剩余 @${width}：本例列设置、排序、导出与导入菜单`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-crud");
        await ready(panel);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        await exportCsvContains(page, panel, "Alice");
        await panel.getByTestId("dp-import").click({ delay: 160 });
        await visible(page.getByTestId("dp-import-menu"));
        await page.keyboard.press("Escape");
        await panel.getByTestId("dp-print").click({ delay: 160 });
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 批量操作剩余 @${width}：本例新增详情、列设置、排序与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-batch");
        await ready(panel);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        const name = "batch-" + crypto.randomUUID().slice(0, 8);
        const createdId = await createAndView(page, panel, name);
        await exportCsvContains(page, panel, name);
        await coverRemainingChrome(page, panel, createdId);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 分页剩余 @${width}：本例排序、行内、勾选、详情与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-page");
        await ready(panel);
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        const first = (await rowIds(panel))[0]!;
        await sortNameChangesOrder(panel);
        const afterSort = (await rowIds(panel))[0]!;
        const nameTestId = await panel.locator('[data-testid^="dp-edit-name-"]')
          .first()
          .getAttribute("data-testid");
        const inlineId = nameTestId?.slice("dp-edit-name-".length) ?? afterSort;
        await inlineNameSaveCancel(panel, inlineId);
        await selectFirstEnabled(panel);
        await panel.getByTestId("dp-view-" + first).click({ delay: 180 }).catch(
          async () => {
            await panel.getByTestId("dp-view-" + afterSort).click({
              delay: 180,
            });
          },
        );
        // After sort the original first id may still be on page 1 or not.
        if (await page.getByTestId("dp-view").count() === 0) {
          const id = (await rowIds(panel))[0]!;
          await panel.getByTestId("dp-view-" + id).click({ delay: 180 });
        }
        await visible(page.getByTestId("dp-view"));
        await page.getByTestId("dp-view-close").click({ delay: 160 });
        await exportCsvContains(page, panel, "Alice");
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 导入导出剩余 @${width}：本例新增详情、行内、勾选、列设置与密度`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-export");
        await ready(panel);
        await hideEmailThenReset(page, panel);
        const name = "files-" + crypto.randomUUID().slice(0, 8);
        const createdId = await createAndView(page, panel, name);
        await inlineNameSaveCancel(panel, "2");
        await selectFirstEnabled(panel);
        await panel.getByTestId("dp-density").click({ delay: 160 });
        const densityMenu = visibleMenu(page, "dp-density-menu");
        await visible(densityMenu);
        await densityMenu.getByTestId("dp-density-compact").click({
          delay: 160,
        });
        await eventually(async () =>
          await panel.locator("[data-density]").first().getAttribute(
            "data-density",
          ) === "compact"
        );
        const fs = panel.getByTestId("dp-fullscreen");
        await fs.click({ delay: 160 });
        await eventually(async () =>
          await panel.getByTestId("dp-shell").getAttribute(
            "data-fullscreen",
          ) ===
            "true"
        );
        await fs.click({ delay: 160 });
        await eventually(async () =>
          await panel.getByTestId("dp-shell").getAttribute(
            "data-fullscreen",
          ) !==
            "true"
        );
        await page.keyboard.press("Escape");
        await coverRemainingChrome(page, panel, createdId);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel action 列表剩余 @${width}：本例搜索清空、排序分页、列设置与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-api-users-action");
        await ready(panel);
        const needle = await firstName(panel);
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        const form = searchDialog(page);
        await visible(form);
        await form.getByTestId("dp-f-name").locator("input").fill(needle);
        await form.getByTestId("dp-search-submit").click({ delay: 180 });
        await eventually(async () =>
          ((await panel.getByTestId("dp-total-count").textContent()) ?? "")
            .includes("条记录")
        );
        expect(
          (await panel.locator('[data-testid^="dp-row-"]').first()
            .textContent()) ?? "",
        )
          .toContain(needle);
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        const again = searchDialog(page);
        await visible(again);
        await again.getByTestId("dp-search-reset").click({ delay: 180 });
        await page.keyboard.press("Escape");
        await visible(again, false);
        await ready(panel);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        await paginateIfNeeded(panel);
        await panel.getByTestId("dp-select-all").click({ delay: 160 });
        if (await panel.getByTestId("dp-batch-bar").count()) {
          await visible(panel.getByTestId("dp-batch-bar"));
        }
        await exportCsvContains(page, panel, needle);
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel restful 列表剩余 @${width}：本例搜索清空、排序分页、列设置与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-api-orders-restful");
        await ready(panel);
        const needle = await firstName(panel);
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        const form = searchDialog(page);
        await visible(form);
        await form.getByTestId("dp-f-name").locator("input").fill(needle);
        await form.getByTestId("dp-search-submit").click({ delay: 180 });
        await eventually(async () =>
          ((await panel.locator('[data-testid^="dp-row-"]').first()
            .textContent()) ??
            "").includes(needle)
        );
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        const again = searchDialog(page);
        await visible(again);
        await again.getByTestId("dp-search-reset").click({ delay: 180 });
        await page.keyboard.press("Escape");
        await visible(again, false);
        await ready(panel);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        await paginateIfNeeded(panel);
        await exportCsvContains(page, panel, needle);
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 本地 Tab 剩余 @${width}：本例切管理员后新增详情、搜索与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-tabs");
        await ready(panel);
        await panel.getByRole("tab", { name: "管理员", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => (await rowIds(panel)).length === 3);
        const name = "tab-" + crypto.randomUUID().slice(0, 8);
        const createdId = await createAndView(page, panel, name);
        await panel.getByRole("tab", { name: "全部", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => (await rowIds(panel)).length >= 8);
        expect(
          await panel.locator('[data-testid^="dp-row-"]').filter({
            hasText: name,
          })
            .count(),
        ).toBeGreaterThan(0);
        await exportCsvContains(page, panel, name);
        await coverRemainingChrome(page, panel, createdId);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 高级搜索剩余 @${width}：本例搜索取消、排序分页、勾选详情与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-search-adv");
        await ready(panel);
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        const form = searchDialog(page);
        await visible(form);
        await form.getByTestId("dp-f-name").locator("input").fill("DRAFT");
        await page.keyboard.press("Escape");
        await visible(form, false);
        await panel.getByTestId("dp-search-toggle").click({ delay: 180 });
        const reopened = searchDialog(page);
        await visible(reopened);
        expect(
          await reopened.getByTestId("dp-f-name").locator("input").inputValue(),
        ).not.toBe("DRAFT");
        await page.keyboard.press("Escape");
        expect(await paginateIfNeeded(panel)).toBe(true);
        await sortNameChangesOrder(panel);
        await selectFirstEnabled(panel);
        const id = (await rowIds(panel))[0]!;
        await panel.getByTestId("dp-view-" + id).click({ delay: 180 });
        await visible(page.getByTestId("dp-view"));
        await page.getByTestId("dp-view-close").click({ delay: 160 });
        await exportCsvContains(page, panel, "Alice");
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 表单条件剩余 @${width}：本例列设置、排序、行内与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-form-cond");
        await ready(panel);
        await hideEmailThenReset(page, panel);
        await sortNameChangesOrder(panel);
        await inlineNameSaveCancel(panel, "2");
        await exportCsvContains(page, panel, "Bob-keep");
        await coverRemainingChrome(page, panel, undefined);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 命令式 API 剩余 @${width}：本例工具栏新增保存、搜索、排序与导出`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const panel = panelOf(page, "demo-handles");
        await ready(panel);
        const name = "handles-" + crypto.randomUUID().slice(0, 8);
        const createdId = await createAndView(page, panel, name);
        await sortNameChangesOrder(panel);
        await hideEmailThenReset(page, panel);
        await exportCsvContains(page, panel, name);
        await coverRemainingChrome(page, panel, createdId);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
