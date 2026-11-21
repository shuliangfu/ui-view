/** WRITTEN-UNRUN. Four live Message examples: types, placement, duration, destroy. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const route = "/desktop/message/message";

function alertOf(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function placementBox(page: Page, text: string) {
  return await alertOf(page, text).evaluate((el) => {
    const box = el.closest(".absolute") as HTMLElement | null;
    if (!box) return { top: "", transform: "", bottom: "" };
    return {
      top: box.style.top,
      transform: box.style.transform,
      bottom: box.style.bottom,
    };
  });
}

describe("Message physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Message 类型 @${width}：成功/错误/信息/警告分别弹出对应文案后可全部关闭`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "类型");
        const cases = [
          ["成功", "保存成功", "text-green-600"],
          ["错误", "网络错误", "text-red-600"],
          ["信息", "已复制到剪贴板", "text-blue-600"],
          ["警告", "请先登录", "text-amber-600"],
        ] as const;
        for (const [btn, text, icon] of cases) {
          await root.getByRole("button", { name: btn, exact: true }).click({
            delay: 180,
          });
          await eventually(async () => await alertOf(page, text).isVisible());
          expect(
            await alertOf(page, text).locator("[role='img']").first().evaluate(
              (el) => el.getAttribute("class") ?? "",
            ),
          ).toContain(icon);
        }
        await example(page, "destroy 关闭全部").getByRole("button", {
          name: "message.destroy()",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await page.getByRole("alert").count() === 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Message placement @${width}：顶部默认 top:3rem，居中为视口平移居中`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "placement 显示位置");
        await root.getByRole("button", { name: "顶部", exact: true }).click({
          delay: 180,
        });
        await eventually(async () =>
          await alertOf(page, "顶部（默认）").isVisible()
        );
        expect(await placementBox(page, "顶部（默认）")).toEqual({
          top: "3rem",
          transform: "",
          bottom: "auto",
        });
        await example(page, "destroy 关闭全部").getByRole("button", {
          name: "message.destroy()",
          exact: true,
        }).click();
        await eventually(async () =>
          await page.getByRole("alert").count() === 0
        );
        await root.getByRole("button", { name: "居中", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await alertOf(page, "居中").isVisible());
        expect(await placementBox(page, "居中")).toEqual({
          top: "50%",
          transform: "translate(-50%, -50%)",
          bottom: "auto",
        });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Message duration @${width}：5 秒文案出现后仍保持，destroy 立即清空`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await example(page, "duration 自定义时长").getByRole("button", {
          name: "5 秒后关闭",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "5 秒后关闭").isVisible()
        );
        await new Promise((r) => setTimeout(r, 1000));
        expect(await alertOf(page, "5 秒后关闭").isVisible()).toBe(true);
        await example(page, "destroy 关闭全部").getByRole("button", {
          name: "message.destroy()",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "5 秒后关闭").isVisible() === false
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Message destroy @${width}：先弹出信息再 destroy，提示全部消失`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await example(page, "类型").getByRole("button", {
          name: "信息",
          exact: true,
        })
          .click({ delay: 180 });
        await eventually(async () =>
          await alertOf(page, "已复制到剪贴板").isVisible()
        );
        await example(page, "destroy 关闭全部").getByRole("button", {
          name: "message.destroy()",
          exact: true,
        }).click({ delay: 180 });
        await eventually(async () =>
          await page.getByRole("alert").count() === 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
