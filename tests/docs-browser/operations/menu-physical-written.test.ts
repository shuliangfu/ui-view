/** WRITTEN-UNRUN. Vertical and horizontal Menu live examples. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const menu = (root: Locator) => root.getByRole("menu").first();

async function isHighlighted(root: Locator, key: string) {
  return await root.locator(`[data-menu-key="${key}"]`).evaluate((el) =>
    el.className.includes("bg-blue-50")
  );
}

describe("Menu physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Menu 垂直 @${width}：默认展开子菜单，点选项一切换选中并可收起`,
      async (t) => {
        const p = await open(t, "/desktop/navigation/menu");
        await p.setViewportSize({ width, height: 900 });
        const nav = menu(example(p, "mode=vertical（垂直）"));
        const sub = nav.locator('[data-menu-key="sub1"]');
        expect(await sub.getAttribute("aria-expanded")).toBe("true");
        expect(await nav.getByRole("button", { name: "选项一" }).isVisible())
          .toBe(true);
        expect(await nav.getByRole("button", { name: "选项二" }).isVisible())
          .toBe(true);
        expect(await nav.getByRole("button", { name: "子项 3" }).isVisible())
          .toBe(true);
        expect(await nav.getByRole("button", { name: "子项 4" }).isVisible())
          .toBe(true);
        expect(await isHighlighted(nav, "1")).toBe(false);
        await nav.getByRole("button", { name: "选项一" }).click();
        await eventually(async () => await isHighlighted(nav, "1"));
        expect(await isHighlighted(nav, "2")).toBe(false);
        await sub.click();
        await eventually(async () =>
          await sub.getAttribute("aria-expanded") === "false"
        );
        expect(await nav.getByRole("button", { name: "子项 3" }).count())
          .toBe(0);
        await sub.click();
        await eventually(async () =>
          await sub.getAttribute("aria-expanded") === "true"
        );
        await nav.getByRole("button", { name: "子项 3" }).click();
        await eventually(async () => await isHighlighted(nav, "3"));
        expect(await isHighlighted(nav, "1")).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Menu 水平弹出子菜单 @${width}：点子菜单弹出子项 4 后关闭并高亮触发器`,
      async (t) => {
        const p = await open(t, "/desktop/navigation/menu");
        await p.setViewportSize({ width, height: 900 });
        const nav = menu(example(p, "mode=horizontal + usePopoverSubmenu"));
        const sub = nav.locator('[data-menu-key="sub1"]');
        expect(await sub.getAttribute("aria-expanded")).toBe("false");
        expect(await nav.getByRole("button", { name: "选项一" }).isVisible())
          .toBe(true);
        expect(await nav.getByRole("button", { name: "子项 3" }).count())
          .toBe(0);
        await sub.click();
        await eventually(async () =>
          await sub.getAttribute("aria-expanded") === "true"
        );
        await eventually(async () =>
          await nav.getByRole("button", { name: "子项 3" }).isVisible()
        );
        await nav.getByRole("button", { name: "子项 4" }).click();
        await eventually(async () =>
          await sub.getAttribute("aria-expanded") === "false"
        );
        expect(await isHighlighted(nav, "sub1")).toBe(true);
        expect(await nav.getByRole("button", { name: "子项 4" }).count())
          .toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
