import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, visible } from "./driver.ts";

describe("DataPanel physical", () => {
  it(
    "物理操作 DataPanel：VIP 加新用户按住释放、节点稳定、保存后重开、取消草稿",
    async (t) => {
      const page = await open(t, "/desktop/data-display/data-panel");
      const panel = page.getByTestId("panel-demo-cell");
      const display = panel.getByTestId("dp-edit-tags-1");
      await display.dblclick();
      const editor = panel.getByTestId("dp-inline-tags");
      await visible(editor);
      const originalNode = await editor.elementHandle();
      const vip = page.getByRole("option", { name: "VIP", exact: true });
      const newer = page.getByRole("option", { name: "新用户", exact: true });
      await attr(vip, "aria-selected", "true");
      await attr(newer, "aria-selected", "false");
      await newer.click({ delay: 200 });
      await attr(vip, "aria-selected", "true");
      await attr(newer, "aria-selected", "true");
      expect(
        await editor.evaluate((node, before) => node === before, originalNode),
      ).toBe(true);
      const done = page.getByRole("button", { name: "完成", exact: true });
      expect(
        await done.evaluate((el) => {
          const b = el.getBoundingClientRect();
          return [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [
            b.left + 2,
            b.bottom - 2,
          ], [b.right - 2, b.bottom - 2]].every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit !== null && (el === hit || el.contains(hit));
          });
        }),
      ).toBe(true);
      await done.click();
      // 完成仅关闭选择浮层；外部点击才提交单元格。
      await visible(editor);
      await panel.getByTestId("dp-total-count").click();
      await visible(editor, false);
      expect(await display.textContent()).toContain("VIP");
      expect(await display.textContent()).toContain("新用户");
      await display.dblclick();
      await attr(newer, "aria-selected", "true");
      await newer.click({ delay: 80 });
      await attr(newer, "aria-selected", "false");
      await page.getByRole("button", { name: "完成", exact: true }).click();
      await page.keyboard.press("Escape");
      await visible(editor, false);
      expect(await display.textContent()).toContain("新用户");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 DataPanel：URL管理员筛选后叠加停用状态搜索", async (t) => {
    const page = await open(t, "/desktop/data-display/data-panel?role=admin");
    const panel = page.getByTestId("panel-demo-search");
    const total = panel.getByTestId("dp-total-count");
    await eventually(async () => /9/.test(await total.textContent() ?? ""));
    await panel.getByTestId("dp-search-toggle").click();
    const dialog = page.getByRole("dialog");
    expect(
      await dialog.getByTestId("dp-f-role").locator('input[type="hidden"]')
        .inputValue(),
    ).toBe("admin");
    await dialog.getByTestId("dp-f-status").locator(
      'button[aria-haspopup="listbox"]',
    ).click();
    await page.getByRole("option", { name: "停用", exact: true }).click({
      delay: 100,
    });
    expect(
      await dialog.getByTestId("dp-f-status").locator('input[type="hidden"]')
        .inputValue(),
    ).toBe("disabled");
    await dialog.getByTestId("dp-search-submit").click();
    await visible(dialog, false);
    console.log("search outcome", await total.textContent(), page.url());
    await eventually(async () =>
      /(?:^|\D)2(?:\D|$)/.test(await total.textContent() ?? "")
    );
    const rows = panel.locator('[data-testid^="dp-row-"]');
    expect(await rows.count()).toBe(2);
    for (let i = 0; i < 2; i++) {
      expect(await rows.nth(i).textContent()).toContain("管理员");
      expect(await rows.nth(i).textContent()).toContain("停用");
    }
  }, DOCS_BROWSER_CONFIG);
});
