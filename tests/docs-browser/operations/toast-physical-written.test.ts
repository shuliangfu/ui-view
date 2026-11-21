/** WRITTEN-UNRUN. Two live Toast examples: types plus placement/duration/destroy. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const route = "/desktop/message/toast";

function alertOf(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function boxStyle(page: Page, text: string) {
  return await alertOf(page, text).evaluate((el) => {
    const box = el.closest(".absolute") as HTMLElement | null;
    if (!box) return { top: "", bottom: "", transform: "", cls: "" };
    return {
      top: box.style.top,
      bottom: box.style.bottom,
      transform: box.style.transform,
      cls: box.className,
    };
  });
}

describe("Toast physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Toast 类型 @${width}：success/error/info/warning 弹出对应色块文案`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "类型");
        const cases = [
          ["success", "操作成功", "bg-green-600"],
          ["error", "操作失败", "bg-red-600"],
          ["info", "这是一条信息", "bg-blue-600"],
          ["warning", "请注意", "bg-amber-500"],
        ] as const;
        for (const [btn, text, cls] of cases) {
          await example(page, "placement 与 duration").getByRole("button", {
            name: "toast.destroy()",
            exact: true,
          }).click();
          await eventually(async () =>
            await page.getByRole("alert").count() === 0
          );
          await root.getByRole("button", { name: btn, exact: true }).click({
            delay: 180,
          });
          await eventually(async () => await alertOf(page, text).isVisible());
          expect(await alertOf(page, text).getAttribute("class")).toContain(
            cls,
          );
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Toast placement 与 duration @${width}：上/下位置不同，duration=0 需 destroy 才关`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "placement 与 duration");
        const destroy = root.getByRole("button", {
          name: "toast.destroy()",
          exact: true,
        });
        await root.getByRole("button", { name: "上（默认）", exact: true })
          .click(
            {
              delay: 180,
            },
          );
        await eventually(async () =>
          await alertOf(page, "上方（默认）").isVisible()
        );
        const topBox = await boxStyle(page, "上方（默认）");
        expect(topBox.top).toBe("3rem");
        expect(topBox.bottom).toBe("auto");
        await destroy.click();
        await eventually(async () =>
          await page.getByRole("alert").count() === 0
        );
        await root.getByRole("button", { name: "下 5s", exact: true }).click({
          delay: 180,
        });
        await eventually(async () =>
          await alertOf(page, "下方 5 秒").isVisible()
        );
        expect((await boxStyle(page, "下方 5 秒")).bottom).toBe("1rem");
        expect((await boxStyle(page, "下方 5 秒")).top).toBe("auto");
        await destroy.click();
        await eventually(async () =>
          await page.getByRole("alert").count() === 0
        );
        await root.getByRole("button", {
          name: "duration=0 不自动关闭",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "不自动关闭").isVisible()
        );
        await new Promise((r) => setTimeout(r, 1200));
        expect(await alertOf(page, "不自动关闭").isVisible()).toBe(true);
        await destroy.click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "不自动关闭").isVisible() === false
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
