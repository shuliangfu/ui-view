/** WRITTEN-UNRUN. Anchor live example: click switches highlight and scrolls the target. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example as demo, open } from "./driver.ts";

const example = (p: Page) => demo(p, "基础用法（左侧锚点 + 右侧内容）");

async function isActive(nav: Locator, name: string) {
  return await nav.getByRole("link", { name, exact: true }).evaluate((el) =>
    el.className.includes("bg-blue-50")
  );
}

describe("Anchor physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Anchor 基础用法 @${width}：默认第一节高亮，点第二节后滚动并切换高亮`,
      async (t) => {
        const p = await open(t, "/desktop/navigation/anchor");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p);
        const nav = root.getByRole("navigation", { name: "锚点导航" });
        expect(await isActive(nav, "第一节")).toBe(true);
        expect(await isActive(nav, "第二节")).toBe(false);
        expect(await isActive(nav, "第三节")).toBe(false);
        expect(
          (await root.locator("#section1").innerText()).includes("内容区域一"),
        )
          .toBe(true);
        await nav.getByRole("link", { name: "第二节", exact: true }).click();
        await eventually(async () => await isActive(nav, "第二节"));
        expect(await isActive(nav, "第一节")).toBe(false);
        expect(await isActive(nav, "第三节")).toBe(false);
        await eventually(async () =>
          await root.locator("#section2").evaluate((el) => {
            const box = el.getBoundingClientRect();
            return box.top < globalThis.innerHeight && box.bottom > 0;
          })
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
