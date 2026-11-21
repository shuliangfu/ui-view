/** WRITTEN-UNRUN. Two live BackTop examples: default visibility and custom position. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open } from "./driver.ts";

const route = "/desktop/other/back-top";

async function hostByBottom(page: Page, bottom: string): Promise<Locator> {
  const hosts = page.locator(".back-top-host");
  const n = await hosts.count();
  for (let i = 0; i < n; i++) {
    const el = hosts.nth(i);
    if (
      await el.evaluate(
        (node, b) => (node as HTMLElement).style.bottom === b,
        bottom,
      )
    ) {
      return el;
    }
  }
  throw new Error(`no BackTop host with bottom=${bottom}`);
}

async function scrollMain(page: Page, top: number) {
  await page.evaluate((y) => {
    const main = document.querySelector("main");
    if (main) main.scrollTo({ top: y, behavior: "auto" });
    globalThis.scrollTo({ top: y, behavior: "auto" });
    main?.dispatchEvent(new Event("scroll"));
    globalThis.dispatchEvent(new Event("scroll"));
  }, top);
}

async function scrollTopOf(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    const mainTop = main?.scrollTop ?? 0;
    const win = globalThis.scrollY ?? 0;
    return Math.max(mainTop, win);
  });
}

describe("BackTop physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `BackTop 默认用法 @${width}：滚动超过 200px 后出现，点击回到顶部并隐藏`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const def = await hostByBottom(page, "24px");
        expect(await def.getAttribute("class")).toContain("invisible");
        await scrollMain(page, 400);
        await eventually(async () =>
          (await def.getAttribute("class") ?? "").includes("invisible") ===
            false
        );
        expect(await def.evaluate((n) => (n as HTMLElement).style.right)).toBe(
          "24px",
        );
        await def.getByRole("button", { name: "回到顶部" }).click({
          delay: 180,
        });
        await eventually(async () => await scrollTopOf(page) < 16);
        await eventually(async () =>
          (await def.getAttribute("class") ?? "").includes("invisible")
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `BackTop 自定义位置 @${width}：按钮固定 bottom:80px，点击同样回到顶部`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const custom = await hostByBottom(page, "80px");
        expect(await custom.evaluate((n) => (n as HTMLElement).style.right))
          .toBe(
            "24px",
          );
        expect(await custom.getAttribute("class") ?? "").not.toContain(
          "invisible",
        );
        await scrollMain(page, 400);
        await custom.getByRole("button", { name: "回到顶部" }).click({
          delay: 180,
        });
        await eventually(async () => await scrollTopOf(page) < 16);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
