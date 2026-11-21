/** WRITTEN-UNRUN. Special docs pages: real titles only, fixtures from source, no live-page scraping. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open, section, visible } from "./driver.ts";

const HOME_INSTALL = `// Deno
deno add jsr:@dreamer/ui-view
// Bun
bunx jsr add @dreamer/ui-view

import { Button } from "@dreamer/ui-view/basic";

import { Table } from "@dreamer/ui-view/data-display";

import { Modal } from "@dreamer/ui-view/feedback";
import { BottomSheet } from "@dreamer/ui-view/mobile/feedback";
import { TabBar, NavBar } from "@dreamer/ui-view/mobile/navigation";
`;

const DESKTOP_IMPORT =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import { Button } from "@dreamer/ui-view/basic";
import { IconHome } from "@dreamer/ui-view/icons/Home.tsx";
import { IconFlagCN } from "@dreamer/ui-view/icons/flags/standalone/IconFlagCN.tsx";`;

const DESKTOP_PLUGIN =
  `import { uiViewTailwindContentPlugin } from "@dreamer/ui-view/plugin";
import { tailwindPlugin } from "@dreamer/plugins/tailwindcss";

app.registerPlugin(uiViewTailwindContentPlugin({
  outputPath: "src/assets/ui-view-sources.css",
  scanPath: "src",
}));
app.registerPlugin(tailwindPlugin({ /* ... */ }));`;

const MOBILE_IMPORT =
  `import { BottomSheet } from "@dreamer/ui-view/mobile/feedback";
import { TabBar, NavBar } from "@dreamer/ui-view/mobile/navigation";
import { Button } from "@dreamer/ui-view/mobile/basic";
 // shared 也可从此入口`;

const THEME_CSS = `/* 示例 */
--color-default-500: #14b8a6;
/* 组件 / 页面 */
background: var(--color-default-500);
/* 或 Tailwind */
class="bg-default-500"`;

const NAVBAR_IMPORT = `import { Link } from "@dreamer/ui-view/basic";

<NavBar
  sticky={false}
  brand={<span class="font-semibold">Brand</span>}
  nav={
    <>
      <Link href="#">首页</Link>
      <Link href="#">文档</Link>
    </>
  }
/>`;

const SIDEBAR_IMPORT = `import { Sidebar } from "@dreamer/ui-view/navigation";
import { IconBox } from "@dreamer/ui-view/icons/Box.tsx";
import { IconFileText } from "@dreamer/ui-view/icons/FileText.tsx";
import { IconPanelLeft } from "@dreamer/ui-view/icons/PanelLeft.tsx";
import { IconLink } from "@dreamer/ui-view/icons/Link.tsx";
import { IconMousePointer } from "@dreamer/ui-view/icons/MousePointer.tsx";
import { IconType } from "@dreamer/ui-view/icons/Type.tsx";

<Sidebar
  overview={{ path: "/desktop", label: "概览" }}
  sectionTitle="组件"
  items={items}
  getCurrentPath={() => "/desktop/basic/button"}
/>`;

const SIDEBAR_EXAMPLE = `import { Sidebar } from "@dreamer/ui-view/navigation";
import { IconBox } from "@dreamer/ui-view/icons/Box.tsx";
import { IconPanelLeft } from "@dreamer/ui-view/icons/PanelLeft.tsx";
import { IconMousePointer } from "@dreamer/ui-view/icons/MousePointer.tsx";

const items = [
  { path: "/desktop/navigation/sidebar", label: "侧栏", icon: <IconPanelLeft /> },
  {
    path: "/desktop/basic/button",
    label: "基础",
    icon: <IconBox />,
    children: [
      {
        path: "/desktop/basic/button",
        label: "Button",
        desc: "按钮",
        icon: <IconMousePointer />,
      },
    ],
  },
];

<Sidebar
  overview={{ path: "/desktop", label: "概览" }}
  sectionTitle="组件"
  items={items}
  getCurrentPath={() => "/desktop/basic/button"}
/>`;

const FEATURES = [
  [
    "桌面 / 移动双端",
    "主入口为桌面组件；`@dreamer/ui-view/mobile` 提供 BottomSheet、TabBar、NavBar 等移动专用实现，并与 shared 对齐设计令牌。",
  ],
  [
    "View + Signal",
    "与 @dreamer/view 协同：`createSignal` 返回 `.value` 读写容器；复杂组件用渲染 getter 订阅状态，表单 props 可传 getter 减少整块更新。",
  ],
  [
    "Tailwind v4 按需扫描",
    "提供 uiViewTailwindPlugin：按引用生成 @source，主 CSS 一次 @import 即可，体积小、theme 不重复。",
  ],
  [
    "深浅色主题",
    "工具类 + `.dark` 策略；文档站内置主题切换（cookie 持久化），可与 ConfigProvider 配合。",
  ],
  [
    "TypeScript & JSR",
    "类型完整；通过 jsr:@dreamer/ui-view 在 Deno / 兼容环境引用，仓库开源在 GitHub。",
  ],
  [
    "组件覆盖面广",
    "基础、表单、反馈、布局、导航、数据展示、Chart.js 图表等，持续与 ANALYSIS 规划对齐。",
  ],
] as const;

const COLOR_GROUPS = [
  ["默认 default", ["default"]],
  ["主要 primary", ["primary"]],
  ["次要 secondary", ["secondary"]],
  ["语义：成功 / 警告 / 危险 / 信息", ["success", "warning", "danger", "info"]],
  ["绿色 / 红色 / 蓝色", ["green", "red", "blue"]],
  ["黄色 / 琥珀 / 紫色 / 灰色", ["yellow", "amber", "purple", "gray"]],
  ["棕色 / 橙色 / 粉色 / 靛蓝", ["brown", "orange", "pink", "indigo"]],
  ["翠绿 / 青 / 柠绿 / 青绿 teal", ["emerald", "cyan", "lime", "teal"]],
] as const;

const SHADES = [
  50,
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  950,
  1000,
] as const;

const QUICK = [
  ["/desktop/basic/button", "基础 · Button", "Button 按钮"],
  [
    "/desktop/form/form-containers",
    "表单 · Form 容器",
    "Form · FormItem · FormList · createForm",
  ],
  ["/desktop/feedback/modal", "反馈 · Modal", "Modal 模态弹窗"],
  ["/desktop/data-display/table", "数据 · Table", "Table 表格"],
  ["/desktop/charts/line", "图表 · 折线图", "ChartLine 折线图"],
] as const;

async function headingReady(page: Page, name: string) {
  await eventually(async () =>
    await page.getByRole("heading", { level: 1, name, exact: true }).count() > 0
  );
  await visible(page.getByRole("heading", { level: 1, name, exact: true }));
}

async function copyIn(
  page: Page,
  root: ReturnType<Page["locator"]>,
  expected: string,
) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const blocks = root.locator(".code-block");
  const count = await blocks.count();
  let index = -1;
  for (let i = 0; i < count; i++) {
    const pre = (await blocks.nth(i).locator("pre code").textContent()) ?? "";
    if (pre === expected) {
      index = i;
      break;
    }
  }
  expect(index >= 0).toBe(true);
  const block = blocks.nth(index);
  await block.scrollIntoViewIfNeeded();
  await page.evaluate(() => navigator.clipboard.writeText("sentinel-not-code"));
  await block.getByRole("button", { name: "复制", exact: true }).click();
  await eventually(async () =>
    await page.evaluate(() => navigator.clipboard.readText()) === expected
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expected,
  );
}

describe("Special pages written", () => {
  for (const width of [390, 1280]) {
    it(
      `首页 Hero 入口 @${width}：标题可见，桌面与移动入口进入目标页`,
      async (t) => {
        const page = await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        // 顶栏有隐藏的品牌字与 GitHub 图标链，不能用 DOM 第一个匹配
        await visible(
          page.getByRole("heading", { level: 1, name: "ui-view", exact: true }),
        );
        const github = page.getByRole("link", { name: "GitHub", exact: true })
          .first();
        await visible(github);
        expect(await github.getAttribute("href")).toBe(
          "https://github.com/shuliangfu/ui-view",
        );
        expect(await github.getAttribute("target")).toBe("_blank");
        await page.getByRole("link", { name: "桌面版文档", exact: true })
          .click();
        await eventually(() => new URL(page.url()).pathname === "/desktop");
        await headingReady(page, "桌面版组件");
        // raw page.goto 不等待 Dreamer 句柄，回首页后再点移动入口会改 URL 但正文可能未挂上
        await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        await headingReady(page, "ui-view");
        await page.getByRole("link", { name: "移动版文档", exact: true })
          .click();
        await eventually(() => new URL(page.url()).pathname === "/mobile");
        await headingReady(page, "移动端组件");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `首页 核心特性 @${width}：六张特性卡标题与说明都在`,
      async (t) => {
        const page = await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "核心特性");
        await root.scrollIntoViewIfNeeded();
        for (const [title, desc] of FEATURES) {
          await visible(
            root.getByRole("heading", { name: title, exact: true }),
          );
          await visible(root.getByText(desc, { exact: true }));
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `首页 快速开始 @${width}：安装代码复制后剪贴板等于源码夹具`,
      async (t) => {
        const page = await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "快速开始");
        await root.scrollIntoViewIfNeeded();
        await copyIn(page, root, HOME_INSTALL);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `首页 开始浏览 @${width}：桌面与移动入口进入目标页`,
      async (t) => {
        const page = await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "开始浏览");
        await root.scrollIntoViewIfNeeded();
        await root.getByRole("link", { name: "桌面组件 →", exact: true })
          .click();
        await eventually(() => new URL(page.url()).pathname === "/desktop");
        await headingReady(page, "桌面版组件");
        await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        await headingReady(page, "ui-view");
        const browse = section(page, "开始浏览");
        await browse.scrollIntoViewIfNeeded();
        await browse.getByRole("link", {
          name: "移动组件 →",
          exact: true,
        }).click();
        await eventually(() => new URL(page.url()).pathname === "/mobile");
        await headingReady(page, "移动端组件");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `全局布局 顶栏导航与主题 @${width}：分区链接、主题还原、外链属性`,
      async (t) => {
        const page = await open(t, "/");
        await page.setViewportSize({ width, height: 900 });
        const html = page.locator("html");
        const wasDark = await html.evaluate((n) =>
          n.classList.contains("dark")
        );
        if (width >= 1280) {
          const desktop = page.getByRole("link", {
            name: "桌面版",
            exact: true,
          });
          const mobile = page.getByRole("link", {
            name: "移动版",
            exact: true,
          });
          await visible(desktop);
          await visible(mobile);
          await desktop.click();
          await eventually(() => new URL(page.url()).pathname === "/desktop");
          await headingReady(page, "桌面版组件");
          await page.goBack();
          await eventually(() => new URL(page.url()).pathname === "/");
          await page.getByRole("link", { name: "移动版", exact: true }).click();
          await eventually(() => new URL(page.url()).pathname === "/mobile");
          await headingReady(page, "移动端组件");
          await page.goBack();
          const jsr = page.getByRole("link", { name: "JSR 包页" });
          const gh = page.getByRole("link", { name: "GitHub 仓库" });
          expect(await jsr.getAttribute("href")).toBe(
            "https://jsr.io/@dreamer/ui-view",
          );
          expect(await jsr.getAttribute("target")).toBe("_blank");
          expect(await gh.getAttribute("href")).toBe(
            "https://github.com/shuliangfu/ui-view",
          );
          expect(await gh.getAttribute("target")).toBe("_blank");
          await page.getByRole("button", { name: "切换主题", exact: true })
            .click();
          await eventually(async () =>
            await html.evaluate((n) => n.classList.contains("dark")) !== wasDark
          );
          await page.getByRole("button", { name: "切换主题", exact: true })
            .click();
          await eventually(async () =>
            await html.evaluate((n) => n.classList.contains("dark")) === wasDark
          );
        } else {
          await page.getByRole("button", { name: "打开顶栏菜单", exact: true })
            .click();
          const menu = page.getByRole("menu", {
            name: "站点菜单",
            exact: true,
          });
          await visible(menu);
          await visible(
            menu.getByRole("link", { name: "桌面版", exact: true }),
          );
          await visible(
            menu.getByRole("link", { name: "移动版", exact: true }),
          );
          expect(
            await menu.getByRole("link", { name: "JSR 包页" }).getAttribute(
              "href",
            ),
          )
            .toBe("https://jsr.io/@dreamer/ui-view");
          expect(
            await menu.getByRole("link", { name: "GitHub 仓库" }).getAttribute(
              "href",
            ),
          )
            .toBe("https://github.com/shuliangfu/ui-view");
          await menu.getByRole("button", { name: "切换主题", exact: true })
            .click();
          await eventually(async () =>
            await html.evaluate((n) => n.classList.contains("dark")) !== wasDark
          );
          await menu.getByRole("button", { name: "切换主题", exact: true })
            .click();
          await eventually(async () =>
            await html.evaluate((n) => n.classList.contains("dark")) === wasDark
          );
          await menu.getByRole("link", { name: "桌面版", exact: true }).click();
          await eventually(() => new URL(page.url()).pathname === "/desktop");
          await headingReady(page, "桌面版组件");
          const navBtn = page.getByRole("button", {
            name: "打开文档导航菜单",
            exact: true,
          });
          if (await navBtn.count()) {
            await navBtn.click();
            await eventually(async () =>
              await page.getByRole("navigation").count() > 0 ||
              await page.locator("[data-drawer], aside").count() > 0
            );
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `桌面首页 入口链接 @${width}：五个快捷入口进入目标页并就绪`,
      async (t) => {
        const page = await open(t, "/desktop");
        await page.setViewportSize({ width, height: 900 });
        await headingReady(page, "桌面版组件");
        for (const [href, label, title] of QUICK) {
          await page.goto(new URL("/desktop", page.url()).href);
          await headingReady(page, "桌面版组件");
          await page.getByRole("link", { name: label, exact: true }).click();
          await eventually(() => new URL(page.url()).pathname === href);
          await headingReady(page, title);
        }
        await page.goto(new URL("/desktop", page.url()).href);
        await page.getByRole("link", { name: "/mobile 文档", exact: true })
          .click();
        await eventually(() => new URL(page.url()).pathname === "/mobile");
        await headingReady(page, "移动端组件");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `桌面首页 按需导入 @${width}：代码复制后剪贴板等于源码夹具`,
      async (t) => {
        const page = await open(t, "/desktop");
        await page.setViewportSize({ width, height: 900 });
        await copyIn(
          page,
          section(page, "按需导入（打包最小）"),
          DESKTOP_IMPORT,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `桌面首页 Tailwind 按需插件 @${width}：代码复制后剪贴板等于源码夹具`,
      async (t) => {
        const page = await open(t, "/desktop");
        await page.setViewportSize({ width, height: 900 });
        await copyIn(page, section(page, "Tailwind 按需插件"), DESKTOP_PLUGIN);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `桌面首页 提示 @${width}：列出 initDropdownEsc 与源码路径`,
      async (t) => {
        const page = await open(t, "/desktop");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "提示");
        await root.scrollIntoViewIfNeeded();
        expect((await root.innerText()).includes("initDropdownEsc")).toBe(true);
        expect((await root.innerText()).includes("ui-view/src/desktop/..."))
          .toBe(
            true,
          );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `移动首页 导入示例 @${width}：代码复制后剪贴板等于源码夹具`,
      async (t) => {
        const page = await open(t, "/mobile");
        await page.setViewportSize({ width, height: 900 });
        await headingReady(page, "移动端组件");
        await copyIn(page, section(page, "导入示例"), MOBILE_IMPORT);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `移动首页 侧栏导航 @${width}：返回桌面版文档并就绪`,
      async (t) => {
        const page = await open(t, "/mobile");
        await page.setViewportSize({ width, height: 900 });
        const root = section(page, "侧栏导航");
        await root.scrollIntoViewIfNeeded();
        expect((await root.innerText()).includes("BottomSheet")).toBe(true);
        await root.getByRole("link", { name: "← 返回桌面版文档", exact: true })
          .click();
        await eventually(() => new URL(page.url()).pathname === "/desktop");
        await headingReady(page, "桌面版组件");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `主题颜色 说明 @${width}：变量命名代码复制后剪贴板等于源码夹具`,
      async (t) => {
        const page = await open(t, "/desktop/other/theme-colors");
        await page.setViewportSize({ width, height: 900 });
        await visible(
          page.getByRole("heading", {
            level: 1,
            name: "主题颜色",
            exact: true,
          }),
        );
        await copyIn(page, section(page, "说明"), THEME_CSS);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `主题颜色 分组色板 @${width}：八组标题、色块 aria-label 与非透明背景`,
      async (t) => {
        const page = await open(t, "/desktop/other/theme-colors");
        await page.setViewportSize({ width, height: 900 });
        for (const [title, names] of COLOR_GROUPS) {
          const root = section(page, title);
          await root.scrollIntoViewIfNeeded();
          await visible(
            root.getByRole("heading", { name: title, exact: true }),
          );
          for (const name of names) {
            await visible(root.getByText(name, { exact: true }).first());
            for (const shade of SHADES) {
              const swatch = root.getByRole("img", {
                name: `色块 ${name}-${shade}`,
                exact: true,
              });
              await visible(swatch);
              const bg = await swatch.evaluate((n) =>
                getComputedStyle(n).backgroundColor
              );
              expect(bg === "rgba(0, 0, 0, 0)" || bg === "transparent").toBe(
                false,
              );
              expect(bg.length > 0).toBe(true);
            }
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `NavBar 引入与示例 @${width}：引入代码复制，示例点击不离开本页`,
      async (t) => {
        const page = await open(t, "/desktop/navigation/navbar");
        await page.setViewportSize({ width, height: 900 });
        await headingReady(page, "NavBar 顶栏（桌面）");
        await copyIn(page, section(page, "引入"), NAVBAR_IMPORT);
        const demo = section(page, "示例");
        await visible(demo.getByText("Demo UI", { exact: true }));
        await visible(demo.getByText("end 插槽", { exact: true }));
        await demo.getByRole("link", { name: "首页", exact: true }).click();
        expect(new URL(page.url()).pathname).toBe("/desktop/navigation/navbar");
        await demo.getByRole("link", { name: "组件", exact: true }).click();
        expect(new URL(page.url()).pathname).toBe("/desktop/navigation/navbar");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Sidebar 引入与示例 @${width}：引入代码复制，展开表单并进入 Input`,
      async (t) => {
        const page = await open(t, "/desktop/navigation/sidebar");
        await page.setViewportSize({ width, height: 900 });
        await headingReady(page, "Sidebar 侧栏");
        await copyIn(page, section(page, "引入"), SIDEBAR_IMPORT);
        const demo = section(page, "示例").locator(".max-w-xs, aside").first();
        await visible(demo.getByText("组件概览", { exact: true }));
        await visible(demo.getByText("演示分组", { exact: true }));
        await visible(demo.getByText("侧栏", { exact: true }));
        const formToggle = demo.getByText("表单", { exact: true });
        await formToggle.click({ delay: 160 });
        // 子项按组件约定展示为「label — desc」
        const inputItem = demo.getByRole("link", {
          name: "Input — 输入框",
          exact: true,
        });
        await visible(inputItem);
        await inputItem.click();
        await eventually(() =>
          new URL(page.url()).pathname === "/desktop/form/input"
        );
        await headingReady(page, "Input 单行输入");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Sidebar 示例代码复制 @${width}：代码示例剪贴板等于源码夹具`,
      async (t) => {
        const page = await open(t, "/desktop/navigation/sidebar");
        await page.setViewportSize({ width, height: 900 });
        const blocks = page.locator("main .code-block");
        const count = await blocks.count();
        expect(count >= 2).toBe(true);
        const block = blocks.nth(1);
        await page.context().grantPermissions([
          "clipboard-read",
          "clipboard-write",
        ]);
        expect((await block.locator("pre code").textContent()) ?? "").toBe(
          SIDEBAR_EXAMPLE,
        );
        await page.evaluate(() =>
          navigator.clipboard.writeText("sentinel-not-code")
        );
        await block.getByRole("button", { name: "复制", exact: true }).click();
        await eventually(async () =>
          await page.evaluate(() => navigator.clipboard.readText()) ===
            SIDEBAR_EXAMPLE
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `用户详情 e2e-1 @${width}：演示用户可见，切到用户 1/2/3 后资料更新`,
      async (t) => {
        const page = await open(t, "/desktop/user/e2e-1");
        await page.setViewportSize({ width, height: 900 });
        await visible(
          page.getByRole("heading", { name: "用户详情", exact: true }),
        );
        await visible(
          page.getByRole("heading", { name: "E2E 用户", exact: true }),
        );
        await visible(page.getByText("e2e@example.com", { exact: true }));
        await visible(page.getByText("演示", { exact: true }));
        const profiles = [
          {
            name: "用户 1",
            title: "张三",
            email: "user1@example.com",
            role: "管理员",
          },
          {
            name: "用户 2",
            title: "李四",
            email: "user2@example.com",
            role: "用户",
          },
          {
            name: "用户 3",
            title: "王五",
            email: "user3@example.com",
            role: "访客",
          },
        ];
        for (const p of profiles) {
          await page.getByRole("link", { name: p.name, exact: true }).click();
          await eventually(async () =>
            (await page.getByRole("heading", { name: p.title, exact: true })
              .count()) > 0
          );
          await visible(
            page.getByRole("heading", { name: "用户详情", exact: true }),
          );
          await visible(
            page.getByRole("heading", { name: p.title, exact: true }),
          );
          await visible(page.getByText(p.email, { exact: true }));
          await visible(page.getByText(p.role, { exact: true }));
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
