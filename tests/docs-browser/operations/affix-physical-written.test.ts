/** WRITTEN-UNRUN. Affix live example pins to the viewport top after scrolling main. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { docsDemo, eventually, open } from "./driver.ts";

const BANNER = "向下滚动主内容区，此条会钉在视口顶边（示例 offsetTop=0）";

const example = (p: Page) => docsDemo(p, "视口顶部固钉");

async function pinnedStyle(p: Page) {
  return await p.evaluate((text) => {
    const nodes = Array.from(document.querySelectorAll("body *"));
    for (const el of nodes) {
      if (!(el.textContent ?? "").includes(text)) continue;
      const style = getComputedStyle(el);
      if (style.position !== "fixed") continue;
      const box = el.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) continue;
      return {
        position: style.position,
        top: Math.round(box.top),
        visible: box.bottom > 0 && box.top < globalThis.innerHeight,
      };
    }
    return null;
  }, BANNER);
}

describe("Affix physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Affix 视口顶部固钉 @${width}：滚动 main 后条目标 position:fixed 贴顶`,
      async (t) => {
        const p = await open(t, "/desktop/navigation/affix");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p);
        expect((await root.innerText()).includes(BANNER)).toBe(true);
        expect(await pinnedStyle(p)).toBe(null);
        expect(
          await root.locator("[data-testid='affix-scroll-filler']").count(),
        )
          .toBe(1);
        await p.evaluate((text) => {
          const main = document.querySelector("main");
          const span = Array.from(document.querySelectorAll("span")).find((
            el,
          ) => (el.textContent ?? "").trim() === text);
          const host = span?.closest("div.w-full.min-w-0") as
            | HTMLElement
            | null;
          if (main && host && main.scrollHeight > main.clientHeight + 8) {
            const top = host.getBoundingClientRect().top + main.scrollTop;
            main.scrollTop = Math.max(0, top);
            main.dispatchEvent(new Event("scroll", { bubbles: true }));
          }
          globalThis.scrollBy(0, 480);
        }, BANNER);
        await eventually(async () => await pinnedStyle(p) !== null);
        const pin = await pinnedStyle(p);
        expect(pin != null).toBe(true);
        expect(pin!.position).toBe("fixed");
        expect(pin!.visible).toBe(true);
        expect(pin!.top >= 0 && pin!.top < 200).toBe(true);
        expect(
          await root.locator("div.w-full.min-w-0 [aria-hidden='true']").first()
            .evaluate((el) => parseFloat(getComputedStyle(el).minHeight) > 20),
        ).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
