/** WRITTEN-UNRUN. PageHeader full usage: crumbs, back, extra, footer; back calls history.back. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open } from "./driver.ts";

const example = (p: Page) =>
  p.getByRole("heading", { name: "完整用法", exact: true }).locator("..")
    .locator(":scope > header");

describe("PageHeader physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `PageHeader 完整用法 @${width}：标题/面包屑/操作/页脚，返回回退历史`,
      async (t) => {
        const p = await open(t, "/desktop/navigation/page-header");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p);
        const text = await root.innerText();
        expect(text.includes("页面标题")).toBe(true);
        expect(text.includes("副标题说明")).toBe(true);
        expect(text.includes("底部说明文字")).toBe(true);
        const crumbs = root.getByRole("navigation", { name: "面包屑" });
        expect((await crumbs.innerText()).replace(/\s+/g, "")).toBe(
          "首页/当前页",
        );
        expect(
          await crumbs.getByRole("link", { name: "首页" }).getAttribute("href"),
        )
          .toBe("#");
        expect(await root.getByRole("button", { name: "操作" }).isVisible())
          .toBe(true);
        await p.evaluate(() => {
          const url = `${location.pathname}${location.search}`;
          history.pushState({ ph: 1 }, "", `${url}?ph=1`);
          history.pushState({ ph: 2 }, "", `${url}?ph=2`);
        });
        expect(p.url().includes("ph=2")).toBe(true);
        await root.getByRole("button", { name: "返回" }).click();
        await eventually(() =>
          p.url().includes("ph=1") && !p.url().includes("ph=2")
        );
        expect(await root.getByRole("heading", { name: "页面标题" }).count())
          .toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
