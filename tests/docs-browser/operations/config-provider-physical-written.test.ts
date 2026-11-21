/** WRITTEN-UNRUN. Three ConfigProvider examples: config code, theme toggle, getConfig. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { docsDemo, eventually, example, open } from "./driver.ts";

const route = "/desktop/other/config-provider";

describe("ConfigProvider physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `ConfigProvider config 批量 @${width}：代码示例含 themeMode 与顶层优先说明`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = docsDemo(page, "config（批量 + themeMode）");
        const text = await root.innerText();
        expect(text).toContain('themeMode: "light"');
        expect(text).toContain('locale: "zh-CN"');
        expect(text).toContain('componentSize: "md"');
        expect(text).toContain("顶层优先");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ConfigProvider theme/locale/componentSize @${width}：切换 theme 后子树 data-theme 变为 dark`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = docsDemo(page, "theme / locale / componentSize");
        const toggle = root.getByRole("button", { name: /切换 theme（当前: / });
        await eventually(async () =>
          (await toggle.innerText()).includes("当前: light")
        );
        const tree = root.locator(".config-provider");
        expect(await tree.getAttribute("data-theme")).toBe("light");
        expect(await tree.getAttribute("data-locale")).toBe("zh-CN");
        expect(await tree.getAttribute("class") ?? "").not.toContain("dark");
        await visibleText(
          root,
          "当前 theme=light、locale=zh-CN、componentSize=md",
        );
        await root.getByRole("button", { name: "小按钮", exact: true }).click({
          delay: 180,
        });
        await toggle.click({ delay: 180 });
        await eventually(async () =>
          (await toggle.innerText()).includes("当前: dark")
        );
        expect(await tree.getAttribute("data-theme")).toBe("dark");
        expect(await tree.getAttribute("class") ?? "").toContain("dark");
        await visibleText(
          root,
          "当前 theme=dark、locale=zh-CN、componentSize=md",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ConfigProvider getConfig() @${width}：子树外读数可见，切换 theme 后同步`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "getConfig()");
        const line = root.locator("p");
        await eventually(async () =>
          (await line.innerText()).includes("子树外 getConfig():")
        );
        const before = await line.innerText();
        expect(before).toContain("locale=");
        expect(before).toContain("componentSize=");
        await example(page, "theme / locale / componentSize").getByRole(
          "button",
          { name: /切换 theme（当前: light/ },
        ).click({ delay: 180 });
        await eventually(async () =>
          (await line.innerText()).includes("theme=dark") ||
          (await line.innerText()) !== before
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});

async function visibleText(
  root:
    | ReturnType<Page["locator"]>
    | ReturnType<
      typeof example
    >,
  text: string,
) {
  await eventually(async () =>
    await root.getByText(text, { exact: false }).isVisible()
  );
}
