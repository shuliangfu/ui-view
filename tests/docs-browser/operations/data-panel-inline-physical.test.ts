import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, value, visible } from "./driver.ts";
import { pickTime } from "./time-driver.ts";
const route = "/desktop/data-display/data-panel";
async function setup(t: Parameters<typeof open>[0]) {
  const page = await open(t, route),
    panel = page.getByTestId("panel-demo-cell");
  await visible(panel.getByTestId("dp-row-1"));
  return { page, panel };
}
async function display(cell: Locator, text: string) {
  await eventually(async () => (await cell.textContent())?.trim() === text);
  expect((await cell.textContent())?.trim()).toBe(text);
}
describe("DataPanel inline physical", () => {
  it(
    "物理操作 DataPanel行内text：Enter/外部/Tab保存、Escape取消及节点焦点稳定",
    async (t) => {
      const { panel } = await setup(t),
        cell = panel.getByTestId("dp-edit-name-1"),
        editor = panel.getByTestId("dp-inline-name");
      await display(cell, "Alice");
      await cell.dblclick({ delay: 150 });
      const input = editor.locator("input"), node = await input.elementHandle();
      await input.fill("Alice-native");
      expect(
        await input.evaluate(
          (el, before) => el === before && el === document.activeElement,
          node,
        ),
      ).toBe(true);
      await input.press("Enter");
      await visible(editor, false);
      await display(cell, "Alice-native");
      await cell.dblclick();
      await value(input, "Alice-native");
      await input.fill("discarded");
      await input.press("Escape");
      await visible(editor, false);
      await display(cell, "Alice-native");
      await cell.dblclick();
      await input.fill("Alice-pointer");
      await panel.getByTestId("dp-total-count").click({ delay: 180 });
      await visible(editor, false);
      await display(cell, "Alice-pointer");
      await cell.dblclick();
      await input.fill("Alice-tab");
      await input.press("Tab");
      await visible(editor, false);
      await display(cell, "Alice-tab");
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel行内number：数值保存、取消和空值拒绝回滚",
    async (t) => {
      const { page, panel } = await setup(t),
        cell = panel.getByTestId("dp-edit-score-1"),
        editor = panel.getByTestId("dp-inline-score"),
        input = editor.locator("input");
      await display(cell, "10");
      await cell.dblclick();
      await input.fill("27.5");
      await input.press("Enter");
      await visible(editor, false);
      await display(cell, "27.5");
      await cell.dblclick();
      await value(input, "27.5");
      await input.fill("99");
      await input.press("Escape");
      await display(cell, "27.5");
      await cell.dblclick();
      await input.fill("");
      await input.press("Enter");
      await visible(editor, false);
      await display(cell, "27.5");
      await visible(
        page.getByText("表单有误，请检查标红的字段", { exact: true }),
      );
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel行内select：物理选择不误保存、外部保存、重开选中和取消",
    async (t) => {
      const { page, panel } = await setup(t),
        cell = panel.getByTestId("dp-edit-role-1"),
        editor = panel.getByTestId("dp-inline-role");
      await display(cell, "管理员");
      await cell.dblclick();
      await visible(editor);
      await page.getByRole("option", { name: "访客", exact: true }).click({
        delay: 200,
      });
      await visible(editor);
      const trigger = editor.locator('button[aria-haspopup="listbox"]');
      await attr(trigger, "aria-expanded", "false");
      await page.keyboard.press("Escape");
      await visible(editor, false);
      await display(cell, "管理员");
      await cell.dblclick();
      await page.getByRole("option", { name: "访客", exact: true }).click({
        delay: 200,
      });
      await panel.getByTestId("dp-total-count").click();
      await visible(editor, false);
      await display(cell, "访客");
      await cell.dblclick();
      await attr(
        page.getByRole("option", { name: "访客", exact: true }),
        "aria-selected",
        "true",
      );
      await page.keyboard.press("Escape");
      await visible(editor);
      await page.keyboard.press("Escape");
      await visible(editor, false);
      await display(cell, "访客");
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel行内textarea：Shift+Enter换行、Enter保存和Escape取消",
    async (t) => {
      const { panel } = await setup(t),
        cell = panel.getByTestId("dp-edit-remark-1"),
        editor = panel.getByTestId("dp-inline-remark"),
        input = editor.locator("textarea");
      await cell.dblclick();
      await input.fill("line one");
      await input.press("Shift+Enter");
      await input.pressSequentially("line two");
      await value(input, "line one\nline two");
      await visible(editor);
      await input.press("Enter");
      await visible(editor, false);
      expect(await cell.textContent()).toBe("line one\nline two");
      await cell.dblclick();
      await value(input, "line one\nline two");
      await input.fill("discarded");
      await input.press("Escape");
      await visible(editor, false);
      expect(await cell.textContent()).toBe("line one\nline two");
    },
    DOCS_BROWSER_CONFIG,
  );
  for (const kind of ["date", "datetime"] as const) {
    it(
      "物理操作 DataPanel行内" + kind +
        "：真实日历/时分、确认后外部保存及取消草稿",
      async (t) => {
        const { page, panel } = await setup(t),
          prop = kind === "date" ? "birthday" : "loginAt",
          cell = panel.getByTestId("dp-edit-" + prop + "-1"),
          editor = panel.getByTestId("dp-inline-" + prop);
        const original = (await cell.textContent())!.trim();
        await cell.dblclick();
        await visible(editor);
        const dialog = page.getByRole("dialog");
        await visible(dialog);
        const day = (n: number) =>
          dialog.locator("[data-ui-calendar-day]").filter({
            hasText: new RegExp("^" + n + "$"),
          });
        await day(15).click({ delay: 180 });
        const box = await dialog.boundingBox();
        if (!box) throw new Error("picker not measurable");
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(
          page.viewportSize()!.width,
        );
        if (kind === "datetime") await pickTime(dialog, { hour: 5, minute: 6 });
        await dialog.getByRole("button", { name: "确定", exact: true }).click({
          delay: 180,
        });
        await visible(dialog, false);
        await visible(editor);
        await panel.getByTestId("dp-total-count").click();
        await visible(editor, false);
        const expected = original.slice(0, 8) + "15" +
          (kind === "datetime" ? " 05:06:00" : "");
        await display(cell, expected);
        await cell.dblclick();
        await day(16).click();
        await dialog.getByRole("button", { name: "取消", exact: true }).click();
        await visible(dialog, false);
        await page.keyboard.press("Escape");
        await visible(editor, false);
        await display(cell, expected);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "物理操作 DataPanel行内保存失败：text和switch拒绝保持原值、恢复后真实保存",
    async (t) => {
      const { page, panel } = await setup(t),
        cell = panel.getByTestId("dp-edit-name-1"),
        editor = panel.getByTestId("dp-inline-name"),
        status = panel.getByTestId("dp-switch-1");
      await page.getByTestId("cell-demo-fail").check();
      await cell.dblclick();
      await editor.locator("input").fill("server-rejected");
      await editor.locator("input").press("Enter");
      await visible(editor, false);
      await display(cell, "Alice");
      await visible(
        page.getByText("保存失败（演示：服务端拒绝）", { exact: true }),
      );
      expect(await status.getByRole("checkbox").isChecked()).toBe(true);
      await status.locator("label").click({ delay: 180 });
      await eventually(async () =>
        await status.getByRole("checkbox").isChecked()
      );
      await page.getByTestId("cell-demo-fail").uncheck();
      await cell.dblclick();
      await editor.locator("input").fill("server-accepted");
      await editor.locator("input").press("Enter");
      await display(cell, "server-accepted");
      await status.locator("label").click({ delay: 180 });
      await eventually(async () =>
        !(await status.getByRole("checkbox").isChecked())
      );
      await attr(status, "title", "停用");
      await panel.getByTestId("dp-refresh").click();
      await display(cell, "server-accepted");
      expect(await status.getByRole("checkbox").isChecked()).toBe(false);
    },
    DOCS_BROWSER_CONFIG,
  );
});
