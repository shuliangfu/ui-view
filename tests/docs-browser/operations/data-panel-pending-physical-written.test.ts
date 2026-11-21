/** WRITTEN-UNRUN. Pending DataPanel live examples with physical ops. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import type { TestContext } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open, value, visible } from "./driver.ts";

const route = "/desktop/data-display/data-panel";

function panelOf(page: Page, key: string): Locator {
  return page.getByTestId(`panel-${key}`);
}

async function openPage(
  t: TestContext | undefined,
  width: number,
): Promise<Page> {
  const page = await open(t, route);
  await page.setViewportSize({ width, height: 1100 });
  return page;
}

async function headerClass(panel: Locator): Promise<string> {
  return await panel.getByTestId("data-panel").evaluate((el) => {
    let n: Element | null = el;
    while (n) {
      const c = n.getAttribute("class") ?? "";
      if (
        c.includes("bg-blue-50") || c.includes("bg-green-50") ||
        c.includes("bg-amber-50") || c.includes("bg-red-50")
      ) {
        return c;
      }
      n = n.parentElement;
    }
    return "";
  });
}

async function textAlign(el: Locator): Promise<string> {
  return await el.evaluate((node) => getComputedStyle(node).textAlign);
}

async function toolbarKeys(panel: Locator): Promise<string[]> {
  return await panel.getByTestId("data-panel-toolbar").evaluate((root) =>
    Array.from(root.querySelectorAll("[data-testid]"))
      .map((n) => n.getAttribute("data-testid") ?? "")
      .filter((id) =>
        id.startsWith("dp-") && !id.endsWith("-menu") && id !== "dp-total-count"
      )
  );
}

async function rowActionKeys(panel: Locator, id: string): Promise<string[]> {
  return await panel.getByTestId(`dp-row-${id}`).evaluate((row) =>
    Array.from(row.querySelectorAll("[data-testid]"))
      .map((n) => n.getAttribute("data-testid") ?? "")
      .filter((tid) =>
        tid.startsWith("dp-view-") || tid.startsWith("dp-edit-") ||
        tid.startsWith("dp-delete-") || tid.startsWith("dp-row-extra-")
      )
  );
}

const TITLE_TYPES: [string, string, string, string][] = [
  ["demo-title-type-default", "默认（info）", "bg-blue-50", "text-blue-800"],
  ["demo-title-type-success", "success", "bg-green-50", "text-green-800"],
  ["demo-title-type-info", "info", "bg-blue-50", "text-blue-800"],
  ["demo-title-type-warning", "warning", "bg-amber-50", "text-amber-800"],
  ["demo-title-type-danger", "danger", "bg-red-50", "text-red-800"],
];

describe("DataPanel pending physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `DataPanel 标题栏背景 @${width}：默认与四色标题栏 class 与源码一致`,
      async (t) => {
        const page = await openPage(t, width);
        const root = example(page, "标题栏背景");
        await visible(root);
        for (const [key, title, bg, fg] of TITLE_TYPES) {
          const panel = panelOf(page, key);
          await visible(panel.getByText(title, { exact: true }));
          const cls = await headerClass(panel);
          expect(cls).toContain(bg);
          expect(cls).toContain(fg);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 页面提示条 @${width}：关闭后提示消失并弹出已关闭提示`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-alert");
        const alert = panel.getByTestId("dp-alert");
        await visible(alert.getByText("请先完成实名认证", { exact: true }));
        await visible(
          alert.getByText("未认证账号部分功能暂不可用。", { exact: true }),
        );
        await alert.getByRole("button", { name: "关闭" }).click({ delay: 180 });
        await visible(alert, false);
        await visible(page.getByText("已关闭提示", { exact: true }));
        await visible(panel.getByTestId("dp-table"));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 列对齐 @${width}：姓名默认居中，角色居中，余额单元格右对齐表头居中`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-align");
        await visible(panel.getByTestId("dp-table"));
        const head = panel.locator("thead th");
        expect(await textAlign(head.nth(0))).toBe("center");
        expect(await textAlign(head.nth(1))).toBe("center");
        expect(await textAlign(head.filter({ hasText: "姓名" }).first())).toBe(
          "center",
        );
        expect(await textAlign(head.filter({ hasText: "角色" }).first())).toBe(
          "center",
        );
        expect(await textAlign(head.filter({ hasText: "余额" }).first())).toBe(
          "center",
        );
        expect(await textAlign(head.filter({ hasText: "操作" }).first())).toBe(
          "center",
        );
        const row = panel.getByTestId("dp-row-1");
        const cells = row.locator("td");
        expect(await textAlign(cells.nth(2))).toBe("center");
        expect(await textAlign(cells.nth(4))).toBe("center");
        expect(await textAlign(cells.nth(5))).toBe("right");
        const total = panel.getByTestId("dp-total-balance");
        await visible(total);
        expect(await textAlign(total)).toBe("right");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 列显示函数 @${width}：value/color/formatter 渲染并可打开详情`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-col-fn");
        const alice = panel.getByTestId("dp-row-1");
        const bob = panel.getByTestId("dp-row-2");
        const carol = panel.getByTestId("dp-row-3");
        await visible(alice.getByText("Alice", { exact: true }));
        await visible(alice.getByText("开启", { exact: true }));
        await visible(alice.getByText("普通", { exact: true }));
        await visible(alice.getByText("ON", { exact: true }));
        await visible(bob.getByText("关闭", { exact: true }));
        await visible(bob.getByText("高级", { exact: true }));
        await visible(bob.getByText("OFF", { exact: true }));
        await visible(carol.getByText("开启", { exact: true }));
        await visible(carol.getByText("高级", { exact: true }));
        expect(
          await alice.getByText("开启", { exact: true }).evaluate((el) =>
            el.className
          ),
        ).toContain("dp-tag-success");
        expect(
          await bob.getByText("关闭", { exact: true }).evaluate((el) =>
            el.className
          ),
        ).toContain("dp-tag-danger");
        expect(
          await alice.getByText("ON", { exact: true }).evaluate((el) =>
            (el as HTMLElement).style.color
          ),
        ).toBe("rgb(5, 150, 105)");
        await panel.getByTestId("dp-view-1").click({ delay: 180 });
        const view = page.getByTestId("dp-view");
        await visible(view);
        await visible(page.getByText("详情 · Alice", { exact: true }));
        await visible(view.getByText("开启", { exact: true }));
        await page.getByTestId("dp-view-close").click();
        await visible(view, false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 拼接列 @${width}：formatter 拼出张三李四王五，按姓排序可切换`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-join-name");
        const names = async () =>
          await panel.locator('[data-testid^="dp-row-"]').evaluateAll((els) =>
            els.map((el) =>
              (el.querySelectorAll("td")[3]?.textContent ?? "").trim()
            )
          );
        expect(await names()).toEqual(["张三", "李四", "王五"]);
        const sortName = panel.locator("thead").getByRole("button", {
          name: "姓名",
        });
        const initial = await names();
        let after = initial;
        for (let i = 0; i < 3; i++) {
          await sortName.click({ delay: 180 });
          try {
            await eventually(async () =>
              (await names()).join() !== initial.join()
            );
            after = await names();
            break;
          } catch (e) {
            if (i === 2) throw e;
          }
        }
        expect(new Set(after)).toEqual(new Set(["张三", "李四", "王五"]));
        expect(after).not.toEqual(initial);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 远程 dataSource @${width}：异步列表出现 Alice 且合计 60 条`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-remote");
        await eventually(async () =>
          await panel.getByText("Alice", { exact: true }).isVisible()
        );
        await visible(panel.getByText("共 60 条记录", { exact: true }));
        await visible(panel.getByTestId("dp-pagination"));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 首屏 data + baseRoute @${width}：首屏张三李四王五，刷新后改走接口`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-data-base-route");
        await visible(panel.getByText("张三", { exact: true }));
        await visible(panel.getByText("李四", { exact: true }));
        await visible(panel.getByText("王五", { exact: true }));
        await visible(panel.getByText("zhangsan@example.com"));
        await visible(panel.getByText("共 3 条记录", { exact: true }));
        await panel.getByTestId("dp-refresh").click({ delay: 180 });
        await eventually(async () =>
          await panel.getByText("zhangsan@example.com").isVisible() === false
        );
        expect(await panel.getByTestId("dp-total-count").innerText()).not.toBe(
          "共 3 条记录",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 深色主题 @${width}：深色包裹层下标题栏使用深色文字色`,
      async (t) => {
        const page = await openPage(t, width);
        const wrap = example(page, "深色主题").locator(".dark");
        await visible(wrap);
        const panel = panelOf(page, "demo-dark");
        await visible(panel.getByText("深色面板", { exact: true }));
        const color = await panel.getByTestId("data-panel").evaluate((el) =>
          getComputedStyle(el).color
        );
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        expect(m).not.toBeNull();
        const [r, g, b] = [Number(m![1]), Number(m![2]), Number(m![3])];
        expect(r + g + b).toBeGreaterThan(300);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 多语言与文案覆盖 @${width}：英文列标题，添加钮为 New`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-locale");
        await visible(panel.getByText("Users", { exact: true }));
        expect(await panel.getByTestId("dp-create").getAttribute("aria-label"))
          .toBe("New");
        const thead = (await panel.locator("thead").textContent()) ?? "";
        for (
          const label of [
            "Name",
            "Email",
            "Role",
            "Status",
            "Balance",
            "Score",
          ]
        ) {
          expect(thead).toContain(label);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel toolbar:false @${width}：工具栏不渲染，表格与分页仍在`,
      async (t) => {
        const page = await openPage(t, width);
        const root = example(page, "toolbar: false 整栏隐藏");
        const panel = panelOf(page, "demo-toolbar-off");
        await visible(panel.getByText("无工具栏", { exact: true }));
        expect(await panel.getByTestId("data-panel-toolbar").count()).toBe(0);
        await visible(panel.getByTestId("dp-table"));
        await visible(panel.getByTestId("dp-pagination"));
        expect(await panel.locator("[data-testid^='dp-row-']").count()).toBe(5);
        await visible(root.getByTestId("demo-toolbar-off-hint"));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 默认声明 @${width}：caps 关闭后声明项仍显示，refresh/edit 禁用可见`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-defaults");
        await visible(panel.getByTestId("dp-create"));
        await visible(panel.getByTestId("dp-refresh"));
        expect(await panel.getByTestId("dp-refresh").isDisabled()).toBe(true);
        expect(await panel.getByTestId("dp-print").count()).toBe(0);
        await visible(panel.getByTestId("dp-view-1"));
        await visible(panel.getByTestId("dp-edit-1"));
        expect(await panel.getByTestId("dp-edit-1").isDisabled()).toBe(true);
        await visible(panel.getByTestId("dp-delete-1"));
        await visible(page.getByTestId("demo-defaults-hint"));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel true/false 简写 @${width}：打印导入导出隐藏，添加搜索刷新可见`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-bool");
        await visible(panel.getByTestId("dp-create"));
        await visible(panel.getByTestId("dp-search-toggle"));
        await visible(panel.getByTestId("dp-refresh"));
        expect(await panel.getByTestId("dp-print").count()).toBe(0);
        expect(await panel.getByTestId("dp-import").count()).toBe(0);
        expect(await panel.getByTestId("dp-export").count()).toBe(0);
        await visible(panel.getByTestId("dp-view-1"));
        await visible(panel.getByTestId("dp-edit-1"));
        expect(await panel.getByTestId("dp-delete-1").count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel toolbar 函数 @${width}：切换 pageAllowAudit 后审计禁用或可点并写回提示`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-tb-fn");
        const toggle = page.getByTestId("demo-tb-fn-toggle");
        const flag = page.getByTestId("demo-tb-fn-flag");
        const hint = page.getByTestId("demo-tb-fn-hint");
        const audit = panel.getByTestId("dp-tb-extra-audit");
        await visible(flag.getByText("pageAllowAudit=true", { exact: true }));
        expect(await audit.isDisabled()).toBe(false);
        await audit.click({ delay: 180 });
        await visible(
          hint.getByText("toolbar:audit selected=0", { exact: true }),
        );
        await toggle.click({ delay: 180 });
        await visible(flag.getByText("pageAllowAudit=false", { exact: true }));
        expect(await audit.isDisabled()).toBe(true);
        await visible(
          hint.getByText("pageAllowAudit=false 时审计仍可见但 disabled", {
            exact: true,
          }),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 操作列函数 @${width}：locked 行分配禁用，未锁定行点击写回 id`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-ra-fn");
        const hint = page.getByTestId("demo-ra-fn-hint");
        const locked = panel.getByTestId("dp-row-extra-assign-1");
        const openRow = panel.getByTestId("dp-row-extra-assign-2");
        await visible(locked);
        expect(await locked.isDisabled()).toBe(true);
        expect(await openRow.isDisabled()).toBe(false);
        await openRow.click({ delay: 180 });
        await visible(hint.getByText("row:assign:2", { exact: true }));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 自定义工具钮 @${width}：点击邀请写回 toolbar:invite`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-tb-custom");
        const hint = page.getByTestId("demo-tb-custom-hint");
        await visible(hint.getByText("点击「邀请」", { exact: true }));
        await panel.getByTestId("dp-tb-extra-invite").click({
          delay: 180,
        });
        await visible(hint.getByText("toolbar:invite", { exact: true }));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 自定义操作列 @${width}：顺序为查看/克隆/编辑，点击克隆写回 id`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-ra-custom");
        expect(await rowActionKeys(panel, "1")).toEqual([
          "dp-view-1",
          "dp-row-extra-clone-1",
          "dp-edit-1",
        ]);
        await panel.getByTestId("dp-row-extra-clone-2").click({ delay: 180 });
        await visible(
          page.getByTestId("demo-ra-custom-hint").getByText("row:clone:2", {
            exact: true,
          }),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 写入序 @${width}：工具栏为添加/审计/刷新/导出，点击审计写回提示`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-key-order");
        const keys = await toolbarKeys(panel);
        expect(
          keys.filter((k) =>
            [
              "dp-create",
              "dp-tb-extra-audit",
              "dp-refresh",
              "dp-export",
              "dp-print",
            ]
              .includes(k) || k.startsWith("dp-tb-extra-")
          ),
        ).toEqual([
          "dp-create",
          "dp-tb-extra-audit",
          "dp-refresh",
          "dp-export",
        ]);
        await visible(page.getByTestId("demo-key-order-hint"));
        expect(
          await panel.getByTestId("dp-tb-extra-audit")
            .isDisabled(),
        ).toBe(false);
        await panel.getByTestId("dp-tb-extra-audit").click({
          delay: 180,
        });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel disable 仍可见 @${width}：添加/冻结/编辑禁用仍在，未锁定行可分配`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-enabled");
        expect(await panel.getByTestId("dp-create").isDisabled()).toBe(true);
        const freeze = panel.getByTestId("dp-tb-extra-freeze");
        expect(await freeze.isDisabled()).toBe(true);
        expect(await panel.getByTestId("dp-edit-1").isDisabled()).toBe(true);
        await visible(panel.getByTestId("dp-create"));
        await visible(freeze);
        await visible(panel.getByTestId("dp-edit-1"));
        expect(await panel.getByTestId("dp-row-extra-assign-1").isDisabled())
          .toBe(
            true,
          );
        expect(await panel.getByTestId("dp-row-extra-assign-2").isDisabled())
          .toBe(
            false,
          );
        await visible(page.getByTestId("demo-enabled-hint"));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel title 可省 @${width}：自定义悬停覆盖立刻刷新与改资料，冻结可点`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-title");
        const refresh = panel.getByTestId("dp-refresh");
        await refresh.hover();
        await visible(page.getByRole("tooltip", { name: "立刻刷新" }));
        await panel.getByTestId("dp-edit-1").hover();
        await visible(page.getByRole("tooltip", { name: "改资料" }));
        await visible(page.getByTestId("demo-title-hint"));
        expect(
          await panel.getByTestId("dp-tb-extra-freeze")
            .isDisabled(),
        ).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel can()/页面变量 @${width}：默认无写权限，打开 write 后出现添加与分配`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-can");
        const flags = page.getByTestId("demo-can-flags");
        await visible(
          flags.getByText("write=false view=true pageExport=true", {
            exact: true,
          }),
        );
        expect(await panel.getByTestId("dp-create").count()).toBe(0);
        expect(await panel.getByTestId("dp-edit-1").count()).toBe(0);
        expect(await panel.getByTestId("dp-delete-1").count()).toBe(0);
        expect(await panel.getByTestId("dp-row-extra-assign-1").count()).toBe(
          0,
        );
        await visible(panel.getByTestId("dp-view-1"));
        await visible(panel.getByTestId("dp-export"));
        expect(await panel.getByTestId("dp-export").isDisabled()).toBe(false);
        await page.getByTestId("demo-can-toggle-export").click({ delay: 180 });
        await visible(
          flags.getByText("write=false view=true pageExport=false", {
            exact: true,
          }),
        );
        expect(await panel.getByTestId("dp-export").isDisabled()).toBe(true);
        await page.getByTestId("demo-can-toggle-write").click({ delay: 180 });
        await visible(
          flags.getByText("write=true view=true pageExport=false", {
            exact: true,
          }),
        );
        await visible(panel.getByTestId("dp-create"));
        await visible(panel.getByTestId("dp-edit-1"));
        await visible(panel.getByTestId("dp-delete-1"));
        await visible(panel.getByTestId("dp-row-extra-assign-2"));
        await panel.getByTestId("dp-row-extra-assign-2").click({ delay: 180 });
        await visible(
          page.getByTestId("demo-can-hint").getByText("can:assign:2", {
            exact: true,
          }),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel tone/tip @${width}：通知与冻结直接执行 action 并写回提示`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-custom");
        const hint = page.getByTestId("demo-custom-hint");
        await visible(
          hint.getByText(
            "点工具栏通知图标或行内「冻结」直接跑 action（确认请在 action 自管）",
            {
              exact: true,
            },
          ),
        );
        await panel.getByTestId("dp-tb-extra-notify").click({
          delay: 180,
        });
        await visible(hint.getByText("tb:notify", { exact: true }));
        await panel.getByTestId("dp-row-extra-freeze-2").click({ delay: 180 });
        await visible(hint.getByText("freeze:2", { exact: true }));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 查看详情 @${width}：打开 Alice 详情，改密校验失败后再成功`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-view");
        await panel.getByTestId("dp-view-1").click({ delay: 180 });
        const view = page.getByTestId("dp-view");
        await visible(view);
        await visible(page.getByText("详情 · Alice", { exact: true }));
        await visible(view.getByText("Alice", { exact: true }));
        await page.getByTestId("dp-view-action-password").click({ delay: 180 });
        await visible(page.getByTestId("demo-view-pwd-submit"));
        await page.getByTestId("demo-view-pwd-submit").click({ delay: 180 });
        await visible(page.getByText("密码不能为空", { exact: true }));
        await page.locator("#demo-view-pwd").fill("123456");
        await page.locator("#demo-view-pwd-confirm").fill("654321");
        await page.getByTestId("demo-view-pwd-submit").click({ delay: 180 });
        await visible(page.getByText("两次密码不一致", { exact: true }));
        await page.locator("#demo-view-pwd-confirm").fill("123456");
        await page.getByTestId("demo-view-pwd-submit").click({ delay: 180 });
        await visible(page.getByText("密码已修改", { exact: true }));
        await visible(page.getByTestId("demo-view-pwd-submit"), false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 点击行打开详情 @${width}：点击姓名单元格打开详情弹层`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-row-click-view");
        await panel.getByTestId("dp-row-1").locator("td").nth(2).click({
          delay: 180,
        });
        await visible(page.getByTestId("dp-view"));
        await visible(page.getByText("查看 · 点击行打开详情", { exact: true }));
        expect((await page.getByTestId("dp-view").textContent()) ?? "")
          .toContain("Alice");
        await page.getByTestId("dp-view-close").click();
        await visible(page.getByTestId("dp-view"), false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel form/view.render @${width}：自定义新建与编辑主体可关闭，详情走自定义渲染`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-form-view-render");
        await panel.getByTestId("dp-create").click({ delay: 180 });
        await visible(page.getByText("自定义新建", { exact: true }));
        const formBody = page.getByTestId("demo-form-render-body");
        await visible(
          formBody.getByText("mode=create · 无行", { exact: true }),
        );
        await page.getByTestId("demo-form-render-close").click({ delay: 180 });
        await visible(formBody, false);
        await panel.getByTestId("dp-edit-1").click({ delay: 180 });
        await visible(page.getByText("自定义编辑 · Alice", { exact: true }));
        await visible(
          page.getByTestId("demo-form-render-body").getByText(
            "mode=edit · row=Alice",
            { exact: true },
          ),
        );
        await page.getByTestId("demo-form-render-close").click({ delay: 180 });
        await panel.getByTestId("dp-view-1").click({ delay: 180 });
        await visible(page.getByText("自定义详情 · Alice", { exact: true }));
        await visible(
          page.getByTestId("demo-view-render-body").getByText(
            "自定义详情：Alice / alice1@example.com",
            { exact: true },
          ),
        );
        await page.getByTestId("dp-view-close").click();
        await visible(page.getByTestId("demo-view-render-body"), false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel FormField.render @${width}：编辑表单使用自定义邮箱和密码控件并可输入`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-field-render");
        await panel.getByTestId("dp-edit-1").click({ delay: 180 });
        await visible(page.getByText("编辑 · 字段 render", { exact: true }));
        const email = page.getByTestId("demo-field-render-email").locator(
          "input",
        );
        const password = page.getByTestId("demo-field-render-password").locator(
          "input",
        );
        await visible(email);
        expect(await email.getAttribute("placeholder")).toBe(
          "自定义 email 输入",
        );
        await email.fill("new@example.com");
        await value(email, "new@example.com");
        await password.fill("Secret1");
        await value(password, "Secret1");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 校验尺寸标题 @${width}：新建校验失败后通过，编辑标题带姓名`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-schemas-full");
        await panel.getByTestId("dp-create").click({ delay: 180 });
        await visible(page.getByText("添加用户", { exact: true }));
        await visible(page.getByText("2–20 个字符", { exact: true }));
        await visible(page.getByText("行内亦可切换", { exact: true }));
        await page.getByTestId("dp-form-submit").click({ delay: 180 });
        await visible(page.getByText("姓名不能为空", { exact: true }));
        await visible(page.getByText("邮箱不能为空", { exact: true }));
        const name = page.getByTestId("dp-fld-name").locator("input");
        await name.fill("A");
        await page.getByTestId("dp-form-submit").click({ delay: 180 });
        await visible(page.getByText("姓名长度 2–20", { exact: true }));
        await name.fill("Nina");
        await page.getByTestId("dp-fld-email").locator("input").fill(
          "nina@example.com",
        );
        await page.getByTestId("dp-form-submit").click({ delay: 180 });
        await eventually(async () =>
          await page.getByText("添加用户", { exact: true }).isVisible() ===
            false
        );
        await visible(panel.getByText("Nina", { exact: true }));
        await panel.getByTestId("dp-edit-1").click({ delay: 180 });
        await visible(page.getByText("修改 · Alice", { exact: true }));
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel 可配批量条 @${width}：未选中导出禁用，勾选后可点并提示条数`,
      async (t) => {
        const page = await openPage(t, width);
        const panel = panelOf(page, "demo-batch-bar");
        await visible(panel.getByTestId("dp-table"));
        const exportSelected = panel.getByTestId(
          "dp-batch-action-exportSelected",
        );
        expect(await panel.getByTestId("dp-batch-bar").count()).toBe(0);
        expect(await panel.getByTestId("dp-export").isDisabled()).toBe(true);
        await panel.getByTestId("dp-select-2").click({ delay: 180 });
        await visible(panel.getByTestId("dp-batch-bar"));
        await visible(exportSelected);
        expect(await exportSelected.isDisabled()).toBe(false);
        expect(await panel.getByTestId("dp-export").isDisabled()).toBe(false);
        await exportSelected.click({ delay: 180 });
        await visible(page.getByText("导出 1 条", { exact: true }));
        await panel.getByTestId("dp-batch-clear").click({ delay: 180 });
        await visible(panel.getByTestId("dp-batch-bar"), false);
        expect(await panel.getByTestId("dp-export").isDisabled()).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
