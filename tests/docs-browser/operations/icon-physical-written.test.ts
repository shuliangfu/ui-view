/** WRITTEN-UNRUN. Icon container/size/theme/color plus eight gallery groups that copy usage. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const route = "/desktop/basic/icon";

function section(page: Page, name: string) {
  return page.getByRole("heading", { name, exact: true }).locator(
    "xpath=ancestor::section[1]",
  );
}

async function box(el: Locator) {
  return await el.evaluate((node) => {
    const r = (node as HTMLElement).getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
}

async function color(el: Locator) {
  return await el.evaluate((node) => getComputedStyle(node).color);
}

async function copyIcon(page: Page, root: Locator, exportName: string) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("not-icon"));
  const btn = root.getByRole("button", {
    name: `复制：<${exportName} size="md" />`,
    exact: true,
  });
  await btn.click({ delay: 180 });
  await eventually(async () =>
    await page.getByRole("alert").filter({ hasText: "复制成功" }).isVisible()
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `<${exportName} size="md" />`,
  );
}

describe("Icon physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Icon 容器 + 自定义 SVG @${width}：xs/sm/md/lg 外框为 16/20/24/32`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "Icon 容器 + 自定义 SVG");
        // 外框是 Icon 的 span[role=img]；内层装饰 SVG 在 includeHidden 下也会匹配 img，不能一起数。
        const icons = root.locator(":scope > span[role='img']");
        expect(await icons.count()).toBe(4);
        expect(await box(icons.nth(0))).toEqual({ w: 16, h: 16 });
        expect(await box(icons.nth(1))).toEqual({ w: 20, h: 20 });
        expect(await box(icons.nth(2))).toEqual({ w: 24, h: 24 });
        expect(await box(icons.nth(3))).toEqual({ w: 32, h: 32 });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 内置 size/class @${width}：五个 md 图标使用文档中的语义色`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "内置图标 size / class");
        // class（语义色）写在 Icon 容器 span 上，不是内层 svg 的 w-full h-full。
        const icons = root.locator("span[role='img']");
        expect(await icons.count()).toBeGreaterThanOrEqual(5);
        const classes: string[] = [];
        for (let i = 0; i < 5; i++) {
          classes.push(await icons.nth(i).getAttribute("class") ?? "");
        }
        const joined = classes.join(" | ");
        expect(joined).toContain("text-red-500");
        expect(joined).toContain("text-green-500");
        expect(joined).toContain("text-blue-500");
        expect(joined).toContain("text-pink-500");
        expect(joined).toContain("text-amber-500");
        for (let i = 0; i < 5; i++) {
          expect(await box(icons.nth(i))).toEqual({
            w: 24,
            h: 24,
          });
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 主题图标 @${width}：Sun/CircleSplit/MonitorSplit/Moon 标签可见且为 lg`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "主题图标（浅色 / 自动 / 深色）");
        for (const name of ["Sun", "CircleSplit", "MonitorSplit", "Moon"]) {
          await eventually(async () =>
            await root.getByText(name, { exact: true }).isVisible()
          );
        }
        // has 必须相对当前节点；root.locator("svg") 从示例根起查，过滤结果会是 0。
        const wraps = root.locator(
          "div.flex.flex-col.items-center.gap-2 span[role='img']",
        );
        expect(await wraps.count()).toBeGreaterThanOrEqual(4);
        for (let i = 0; i < 4; i++) {
          const r = await wraps.nth(i).evaluate((el) => {
            const n = el as HTMLElement;
            const b = n.getBoundingClientRect();
            return { w: Math.round(b.width), h: Math.round(b.height) };
          });
          expect(r).toEqual({ w: 32, h: 32 });
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 继承文字颜色 @${width}：保存与删除图标颜色与相邻文字一致`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        const root = example(page, "继承文字颜色");
        // 文档把图标和文案放在同一个着色 span 里，getByText 命中该 span，「保存」没有 preceding-sibling。
        const save = root.getByText("保存", { exact: true });
        const remove = root.getByText("删除", { exact: true });
        const saveIcon = save.locator("span[role='img']");
        const removeIcon = remove.locator("span[role='img']");
        expect(await color(saveIcon)).toBe(await color(save));
        expect(await color(removeIcon)).toBe(await color(remove));
        expect(await color(save)).not.toBe(await color(remove));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 图标一览 @${width}：点击 IconInfo 复制用法并出现复制成功`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(page, section(page, "图标一览"), "IconInfo");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 一、操作与导航 @${width}：点击 IconClose 复制 <IconClose size="md" />`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(page, section(page, "一、操作与导航"), "IconClose");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 二、内容媒体表情 @${width}：点击 IconSearch 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "二、内容、媒体与表情"),
          "IconSearch",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 三、门户常见图标 @${width}：点击 IconRss 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "三、大型门户网站常见图标"),
          "IconRss",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 四、用户状态视图 @${width}：点击 IconCheck 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "四、用户、状态与视图"),
          "IconCheck",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 五、设备自然场景 @${width}：点击 IconLaptop 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "五、设备、自然与其它场景"),
          "IconLaptop",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 六、国家地区国旗 @${width}：点击 IconFlagCN 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "六、国家 / 地区国旗"),
          "IconFlagCN",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 七、品牌与 App Logo @${width}：点击 IconBrandApple 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "七、品牌与 App Logo"),
          "IconBrandApple",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Icon 八、常见代币 Logo @${width}：点击 IconTokenBtc 复制用法`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 900 });
        await copyIcon(
          page,
          section(page, "八、常见代币 Logo"),
          "IconTokenBtc",
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
