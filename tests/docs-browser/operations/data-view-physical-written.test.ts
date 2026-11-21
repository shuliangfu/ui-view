/** WRITTEN-UNRUN. Six live DataView examples plus the imperative API table. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const VIEW_HANDLE_API = [
  [
    "refreshDataPanel(key)",
    "() => Promise<void>",
    "-",
    "重新拉取已挂载的详情（或同 key 的数据面板）；无句柄时回落旧 refreshers",
  ],
  [
    "getDataView(key)",
    "DataViewHandle | undefined",
    "-",
    "句柄：reload／getRecord／openForm(row?)",
  ],
  [
    "getDataViewRecord(key)",
    "Row | null | undefined",
    "-",
    "当前详情记录；未挂载时为 undefined",
  ],
  [
    "openDataViewForm(key, row?)",
    "(key: string, row?: Row) => void",
    "-",
    "打开编辑表单；无 row 则用当前记录",
  ],
];

async function pairs(scope: Locator) {
  const grid = scope.locator("[data-descriptions-columns]").first();
  return await grid.locator(":scope > div").evaluateAll((es) =>
    es.map((e) => {
      const label = e.children[0] as HTMLElement | undefined;
      const value = e.children[1] as HTMLElement | undefined;
      return {
        label: (label?.textContent ?? "").trim(),
        value: (value?.textContent ?? "").trim(),
      };
    }).filter((r) => r.label || r.value)
  );
}

function titlePanel(root: Locator, panelKey: string) {
  return root.locator(`[data-testid='panel-${panelKey}']`);
}

async function headerClass(root: Locator, panelKey: string) {
  return await titlePanel(root, panelKey).locator("[data-testid='data-view']")
    .evaluate((el) => {
      let node: HTMLElement | null = el as HTMLElement;
      while (node) {
        if (/bg-(green|blue|amber|red)-50/.test(node.className)) {
          return node.className;
        }
        node = node.parentElement;
      }
      return "";
    });
}

const adaFields = [
  ["姓名：", "Ada Lovelace"],
  ["邮箱：", "ada@example.com"],
  ["状态：", "启用"],
  ["创建时间：", "2026-11-10 10:30:00"],
];

describe("DataView physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `DataView 基础用法 @${width}：字段展示，更新后写回，全屏与复制`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "基础用法（view.props）");
        const shell = root.locator("[data-testid='dv-shell']");
        expect(
          await shell.locator("[data-testid='data-view']").innerText(),
        ).toContain("用户详情");
        expect(await pairs(shell)).toEqual(
          adaFields.map(([label, value]) => ({ label, value })),
        );
        for (
          const id of [
            "dv-update",
            "dv-remove",
            "dv-refresh",
            "dv-print",
            "dv-import",
            "dv-export",
            "dv-fullscreen",
            "dv-copy",
          ]
        ) {
          expect(await shell.locator(`[data-testid='${id}']`).count()).toBe(1);
        }
        await shell.locator("[data-testid='dv-update']").click();
        const dialog = p.getByRole("dialog");
        await eventually(async () => await dialog.isVisible());
        expect(await dialog.innerText()).toContain("编辑 · Ada Lovelace");
        const nameInput = dialog.locator("[data-testid='dv-fld-name'] input");
        await eventually(async () => await nameInput.isVisible());
        expect(await nameInput.inputValue()).toBe("Ada Lovelace");
        await nameInput.fill("Ada King");
        await dialog.getByRole("button", { name: "更新" }).click();
        await eventually(async () => await dialog.count() === 0);
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "保存成功" }).count()) >
            0
        );
        expect(await pairs(shell)).toEqual([
          { label: "姓名：", value: "Ada King" },
          { label: "邮箱：", value: "ada@example.com" },
          { label: "状态：", value: "启用" },
          { label: "创建时间：", value: "2026-11-10 10:30:00" },
        ]);
        const fs = shell.locator("[data-testid='dv-fullscreen']");
        expect(await fs.getAttribute("aria-label")).toBe("全屏");
        await fs.click();
        await eventually(async () =>
          await shell.getAttribute("data-fullscreen") === "true"
        );
        expect(await fs.getAttribute("aria-label")).toBe("退出全屏");
        await fs.click();
        await eventually(async () =>
          (await shell.getAttribute("data-fullscreen")) == null
        );
        await shell.locator("[data-testid='dv-copy']").click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已复制 1 行" })
            .count()) >
            0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataView 标题栏背景 @${width}：五种 type 配色，默认与 info 同为蓝底`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "标题栏背景");
        expect(await root.locator("[data-testid='dv-shell']").count()).toBe(5);
        const expected: [string, string, string][] = [
          ["demo-dv-title-type-default", "默认（info）", "bg-blue-50"],
          ["demo-dv-title-type-success", "success", "bg-green-50"],
          ["demo-dv-title-type-info", "info", "bg-blue-50"],
          ["demo-dv-title-type-warning", "warning", "bg-amber-50"],
          ["demo-dv-title-type-danger", "danger", "bg-red-50"],
        ];
        for (const [panelKey, _title, cls] of expected) {
          const klass = await headerClass(root, panelKey);
          expect(klass.includes(cls)).toBe(true);
          const shell = titlePanel(root, panelKey).locator(
            "[data-testid='dv-shell']",
          );
          expect(await pairs(shell)).toEqual([
            { label: "姓名：", value: "Ada Lovelace" },
            { label: "邮箱：", value: "ada@example.com" },
          ]);
          expect(await shell.locator("[data-testid='dv-refresh']").count())
            .toBe(
              0,
            );
        }
        const defCls = await headerClass(root, "demo-dv-title-type-default");
        const infoCls = await headerClass(root, "demo-dv-title-type-info");
        expect(defCls.includes("bg-blue-50") && infoCls.includes("bg-blue-50"))
          .toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataView 页面提示条 @${width}：警告可关闭，关闭后出现提示并卸载`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "页面提示条");
        const alert = root.locator("[data-testid='dv-alert']");
        expect(await alert.innerText()).toContain("请先完成实名认证");
        expect(await alert.innerText()).toContain(
          "未认证账号部分功能暂不可用。",
        );
        expect(await pairs(root.locator("[data-testid='dv-shell']"))).toEqual([
          { label: "姓名：", value: "张三" },
          { label: "邮箱：", value: "zhangsan@example.com" },
        ]);
        await alert.getByRole("button", { name: "关闭" }).click();
        await eventually(async () => await alert.count() === 0);
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已关闭提示" })
            .count()) >
            0
        );
        expect(await pairs(root.locator("[data-testid='dv-shell']"))).toEqual([
          { label: "姓名：", value: "张三" },
          { label: "邮箱：", value: "zhangsan@example.com" },
        ]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataView 拼接字段 @${width}：姓/名与 formatter 合成「张三」，无工具栏`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "拼接字段");
        const shell = root.locator("[data-testid='dv-shell']");
        expect(await pairs(shell)).toEqual([
          { label: "姓：", value: "张" },
          { label: "名：", value: "三" },
          { label: "姓名：", value: "张三" },
        ]);
        expect(await shell.locator("[data-testid='dv-refresh']").count()).toBe(
          0,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataView 删除与工具栏上下文 @${width}：读当前记录，取消删除后再确认清空`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "删除与工具栏上下文");
        const shell = root.locator("[data-testid='dv-shell']");
        expect(await pairs(shell)).toEqual(
          adaFields.map(([label, value]) => ({ label, value })),
        );
        const readBtn = shell.getByRole("button", { name: "读当前记录" });
        expect(await readBtn.count()).toBe(1);
        await readBtn.click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "当前：Ada Lovelace" })
            .count()) > 0
        );
        await shell.locator("[data-testid='dv-remove']").click();
        const pop = p.locator("[data-dreamer-popconfirm-panel]:visible").filter(
          {
            hasText: "确定删除Ada Lovelace？",
          },
        );
        await eventually(async () => await pop.isVisible());
        await pop.getByRole("button", { name: "取消" }).click();
        await eventually(async () => await pop.count() === 0);
        expect(await pairs(shell)).toEqual(
          adaFields.map(([label, value]) => ({ label, value })),
        );
        await shell.locator("[data-testid='dv-remove']").click();
        const pop2 = p.locator("[data-dreamer-popconfirm-panel]:visible")
          .filter({
            hasText: "确定删除Ada Lovelace？",
          });
        await eventually(async () => await pop2.isVisible());
        await pop2.getByRole("button", { name: "删除" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已删除" }).count()) > 0
        );
        await eventually(async () =>
          (await shell.innerText()).includes("暂无数据")
        );
        expect(await shell.locator(".descriptions").count()).toBe(0);
        await readBtn.click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "暂无记录" }).count()) >
            0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataView Tab @${width}：基本信息与其他切换，并写入 ?tab=`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "Tab");
        const shell = root.locator("[data-testid='dv-shell']");
        const basic = shell.getByRole("tab", { name: "基本信息" });
        const extra = shell.getByRole("tab", { name: "其他" });
        expect(await basic.getAttribute("aria-selected")).toBe("true");
        expect(await extra.getAttribute("aria-selected")).toBe("false");
        expect(await pairs(shell)).toEqual(
          adaFields.map(([label, value]) => ({ label, value })),
        );
        await extra.click();
        await eventually(async () =>
          await extra.getAttribute("aria-selected") === "true"
        );
        expect(await basic.getAttribute("aria-selected")).toBe("false");
        expect(await shell.getByText("注册来源：后台录入。").isVisible()).toBe(
          true,
        );
        expect(await shell.locator(".descriptions").count()).toBe(0);
        const tab = new URL(p.url()).searchParams.get("tab");
        expect(tab).toBe("extra");
        await basic.click();
        await eventually(async () =>
          await basic.getAttribute("aria-selected") === "true"
        );
        expect(await pairs(shell)).toEqual(
          adaFields.map(([label, value]) => ({ label, value })),
        );
        expect(new URL(p.url()).searchParams.get("tab")).toBe("basic");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataView 命令式 API 表 @${width}：方法列四行与源码逐字一致`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/data-view");
        await p.setViewportSize({ width, height: 900 });
        const heading = p.getByRole("heading", {
          name: "命令式 API（panelKey）",
          exact: true,
        });
        const table = heading.locator("xpath=following::table[1]");
        expect(await table.locator("thead th").allInnerTexts()).toEqual([
          "方法",
          "类型",
          "默认值",
          "说明",
        ]);
        const body = await table.locator("tbody tr").evaluateAll((rows) =>
          rows.map((row) =>
            Array.from(row.querySelectorAll("td")).map((td) =>
              (td.textContent ?? "").trim()
            )
          )
        );
        expect(body).toEqual(VIEW_HANDLE_API);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
