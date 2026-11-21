import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, visible } from "./driver.ts";
const route = "/desktop/data-display/data-panel";
describe("DataPanel chrome physical", () => {
  it("物理操作 DataPanel工具栏：三档行高、选中标记及重载持久化", async (t) => {
    const page = await open(t, route),
      panel = page.getByTestId("panel-demo-basic"),
      table = panel.locator("[data-density]"),
      cell = panel.getByTestId("dp-row-2").locator("td").nth(2);
    await visible(cell);
    for (
      const [d, padding] of [["compact", 4], ["loose", 14], [
        "comfortable",
        6,
      ]] as const
    ) {
      await panel.getByTestId("dp-density").click({ delay: 180 });
      await page.getByTestId("dp-density-" + d).click({ delay: 180 });
      await attr(table, "data-density", d);
      expect(
        await cell.evaluate((el) =>
          parseFloat(getComputedStyle(el).paddingTop)
        ),
      ).toBe(padding);
      expect(await page.getByTestId("dp-density-menu").count()).toBe(0);
      await panel.getByTestId("dp-density").click();
      for (const key of ["compact", "comfortable", "loose"]) {
        await attr(
          page.getByTestId("dp-density-" + key),
          "aria-pressed",
          key === d ? "true" : "false",
        );
      }
      await page.keyboard.press("Escape");
    }
    await panel.getByTestId("dp-density").click();
    await page.getByTestId("dp-density-compact").click();
    await page.reload();
    await attr(table, "data-density", "compact");
    expect(
      await cell.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop)),
    ).toBe(4);
    await panel.getByTestId("dp-density").click();
    await attr(page.getByTestId("dp-density-compact"), "aria-pressed", "true");
    await page.keyboard.press("Escape");
  }, DOCS_BROWSER_CONFIG);
  it(
    "物理操作 DataPanel工具栏：全屏进出、窗口尺寸/滚动锁及重载恢复",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-basic"),
        shell = panel.getByTestId("dp-shell"),
        button = panel.getByTestId("dp-fullscreen");
      await visible(button);
      const overflow = await page.locator("body").evaluate((el) =>
        el.style.overflow
      );
      await button.click({ delay: 180 });
      await attr(shell, "data-fullscreen", "true");
      await attr(button, "aria-label", "退出全屏");
      expect(
        await shell.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            position: getComputedStyle(el).position,
          };
        }),
      ).toEqual({
        x: 0,
        y: 0,
        width: page.viewportSize()!.width,
        height: page.viewportSize()!.height,
        position: "fixed",
      });
      expect(await page.locator("body").evaluate((el) => el.style.overflow))
        .toBe(
          "hidden",
        );
      await button.click();
      await attr(shell, "data-fullscreen", null);
      expect(await page.locator("body").evaluate((el) => el.style.overflow))
        .toBe(
          overflow,
        );
      await button.click();
      await page.reload();
      await attr(shell, "data-fullscreen", "true");
      expect(await page.locator("body").evaluate((el) => el.style.overflow))
        .toBe(
          "hidden",
        );
      await button.click();
      await attr(shell, "data-fullscreen", null);
      expect(await page.locator("body").evaluate((el) => el.style.overflow))
        .toBe(
          overflow,
        );
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel工具栏：未选复制警告、选中行精确TSV、隐藏列及翻页清选",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-basic");
      await page.context().grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await page.evaluate(() => navigator.clipboard.writeText("not-table"));
      await panel.getByTestId("dp-copy").click();
      await visible(page.getByText("请先勾选要复制的行", { exact: true }));
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "not-table",
      );
      await visible(
        page.getByText("请先勾选要复制的行", { exact: true }),
        false,
      );
      await panel.getByTestId("dp-select-2").check();
      await panel.getByTestId("dp-select-3").check();
      const matrix = [["姓名", "邮箱", "角色", "状态", "余额", "积分"], [
        "Bob",
        "bob2@example.com",
        "编辑",
        "启用",
        "237.10",
        "7",
      ], ["Carol", "carol3@example.com", "访客", "启用", "374.20", "14"]];
      const expected = () => matrix.map((r) => r.join("\t")).join("\n");
      await panel.getByTestId("dp-copy").click({ delay: 180 });
      await eventually(async () =>
        await page.evaluate(() => navigator.clipboard.readText()) === expected()
      );
      await visible(page.getByText("已复制 2 行", { exact: true }));
      await panel.getByTestId("dp-columns").click();
      await page.getByTestId("dp-col-email").uncheck();
      await page.mouse.click(2, 2);
      for (const row of matrix) row.splice(1, 1);
      await page.evaluate(() => navigator.clipboard.writeText("not-table"));
      await panel.getByTestId("dp-copy").click();
      await eventually(async () =>
        await page.evaluate(() => navigator.clipboard.readText()) === expected()
      );
      await panel.getByTestId("dp-next").click();
      await eventually(async () =>
        await panel.getByTestId("dp-batch-bar").count() === 0
      );
      await panel.getByTestId("dp-copy").click();
      await visible(page.getByText("请先勾选要复制的行", { exact: true }));
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        expected(),
      );
    },
    DOCS_BROWSER_CONFIG,
  );
});
