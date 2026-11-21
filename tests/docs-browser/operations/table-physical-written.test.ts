/** WRITTEN-UNRUN. Eight live Table examples: expand, size/striped/loading, select, empty, title, pagination, fixed, editable. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const tableAt = (root: Locator, index = 0) => root.locator("table").nth(index);

/** Tailwind v4 可能把 slate-100 算成 oklch，用页面里同类名的计算色比对，不断言死 rgb 字面量。 */
async function cssBg(page: Page, className: string) {
  return await page.evaluate((cls) => {
    const el = document.createElement("div");
    el.className = cls;
    document.body.appendChild(el);
    const c = getComputedStyle(el).backgroundColor;
    el.remove();
    return c;
  }, className);
}

async function bodyRows(table: Locator) {
  return await table.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) => ({
      cells: Array.from(row.querySelectorAll("td")).map((td) =>
        (td.textContent ?? "").trim()
      ),
      backgrounds: Array.from(row.querySelectorAll("td")).map((td) =>
        getComputedStyle(td).backgroundColor
      ),
      paddings: Array.from(row.querySelectorAll("td")).map((td) => {
        const c = getComputedStyle(td);
        return [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft];
      }),
      fonts: Array.from(row.querySelectorAll("td")).map((td) =>
        getComputedStyle(td).fontSize
      ),
    }))
  );
}

async function headers(table: Locator) {
  return (await table.locator("thead th").allInnerTexts()).map((t) => t.trim());
}

describe("Table physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Table 基础边框展开行 @${width}：两行数据，点 + 展开详情后再收起`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const table = tableAt(example(p, "基础 + 边框 + 展开行"));
        expect(await headers(table)).toEqual(["", "姓名", "年龄", "地址"]);
        const className = await table.getAttribute("class") ?? "";
        expect(className.includes("border-0.5")).toBe(true);
        let rows = await bodyRows(table);
        expect(rows.length).toBe(2);
        expect(rows[0].cells.slice(1)).toEqual(["张三", "28", "北京"]);
        expect(rows[1].cells.slice(1)).toEqual(["李四", "32", "上海"]);
        expect(rows[0].paddings[1]).toEqual(["10px", "16px", "10px", "16px"]);
        expect(rows[0].fonts[1]).toBe("14px");
        const expand = table.locator("tbody tr").first().getByRole("button");
        expect(await expand.innerText()).toBe("+");
        expect(await expand.getAttribute("aria-expanded")).toBe("false");
        await expand.click();
        await eventually(async () =>
          await table.getByText("详情：北京").isVisible()
        );
        expect(await expand.getAttribute("aria-expanded")).toBe("true");
        expect(await expand.innerText()).toBe("−");
        rows = await bodyRows(table);
        expect(rows.length).toBe(3);
        expect(rows[1].cells.join("")).toContain("详情：北京");
        await expand.click();
        await eventually(async () =>
          await table.getByText("详情：北京").count() === 0
        );
        expect(await expand.getAttribute("aria-expanded")).toBe("false");
        expect(await expand.innerText()).toBe("+");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table size / striped / loading @${width}：sm 字号与斑马纹，空表显示加载中…`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "size / striped / loading");
        const striped = tableAt(root, 0);
        const rows = await bodyRows(striped);
        expect(rows.map((r) => r.cells)).toEqual([
          ["张三", "28", "北京"],
          ["李四", "32", "上海"],
        ]);
        expect(rows[0].paddings[0]).toEqual(["8px", "12px", "8px", "12px"]);
        expect(rows[0].fonts[0]).toBe("12px");
        expect(rows[0].backgrounds[0]).toBe(await cssBg(p, "bg-white"));
        expect(rows[1].backgrounds[0]).toBe(await cssBg(p, "bg-slate-100"));
        expect(rows[0].backgrounds[0] !== rows[1].backgrounds[0]).toBe(true);
        const loading = tableAt(root, 1);
        expect(await loading.locator("[aria-busy='true']").innerText()).toBe(
          "加载中…",
        );
        expect(
          await loading.locator("[aria-busy='true']").getAttribute("aria-live"),
        ).toBe("polite");
        expect((await bodyRows(loading)).map((r) => r.cells)).toEqual([
          ["加载中…"],
        ]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table 行选择 onSelectChange @${width}：点行勾选并写回已选行，表头再取消全选`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "行选择 onSelectChange");
        const table = tableAt(root);
        const status = root.locator("p").filter({ hasText: "已选行:" });
        expect((await status.innerText()).trim()).toBe("已选行: -");
        const firstBox = table.locator("tbody tr").nth(0).locator("td").nth(0);
        const secondBox = table.locator("tbody tr").nth(1).locator("td").nth(0);
        await firstBox.click();
        await eventually(async () =>
          (await status.innerText()).trim() === "已选行: 张三"
        );
        expect(
          await firstBox.locator("input[type='checkbox']").isChecked(),
        ).toBe(true);
        await secondBox.click();
        await eventually(async () =>
          (await status.innerText()).trim() === "已选行: 张三、李四"
        );
        const headerBox = table.locator("thead th").first();
        expect(
          await headerBox.locator("input[type='checkbox']").isChecked(),
        ).toBe(true);
        await headerBox.click();
        await eventually(async () =>
          (await status.innerText()).trim() === "已选行: -"
        );
        expect(
          await firstBox.locator("input[type='checkbox']").isChecked(),
        ).toBe(false);
        expect(
          await secondBox.locator("input[type='checkbox']").isChecked(),
        ).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table 空状态 locale / renderEmpty @${width}：默认暂无数据与自定义空状态并存`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "空状态 locale / renderEmpty");
        expect((await bodyRows(tableAt(root, 0)))[0].cells).toEqual([
          "暂无数据",
        ]);
        expect((await bodyRows(tableAt(root, 1)))[0].cells).toEqual([
          "自定义空状态",
        ]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table 标题与工具栏 @${width}：用户列表与刷新/导出，点击刷新不改行数据`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "标题与工具栏 title / extra");
        expect(await root.getByText("用户列表", { exact: true }).isVisible())
          .toBe(true);
        const table = tableAt(root);
        expect((await bodyRows(table)).map((r) => r.cells)).toEqual([
          ["张三", "28", "北京"],
          ["李四", "32", "上海"],
        ]);
        await root.getByRole("button", { name: "刷新" }).click();
        await root.getByRole("button", { name: "导出" }).click();
        expect((await bodyRows(table)).map((r) => r.cells)).toEqual([
          ["张三", "28", "北京"],
          ["李四", "32", "上海"],
        ]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table 分页 pagination @${width}：pageSize=2 共 5 条，翻页改行与区间文案`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "分页 pagination");
        const table = tableAt(root);
        const nav = root.getByRole("navigation", { name: "表格分页" });
        expect((await nav.innerText()).replace(/\s+/g, " ")).toContain(
          "第 1–2 条 / 共 5 条",
        );
        expect((await nav.innerText()).replace(/\s+/g, " ")).toContain(
          "第 1 / 3 页",
        );
        expect((await bodyRows(table)).map((r) => r.cells)).toEqual([
          ["张三", "28", "北京"],
          ["李四", "32", "上海"],
        ]);
        expect(await nav.getByRole("button", { name: "上一页" }).isDisabled())
          .toBe(true);
        expect(
          await nav.getByRole("button", { name: "第 1 页" }).getAttribute(
            "aria-current",
          ),
        ).toBe("page");
        await nav.getByRole("button", { name: "下一页" }).click();
        await eventually(async () =>
          (await bodyRows(table)).map((r) => r.cells[0]).join() === "王五,赵六"
        );
        expect((await nav.innerText()).replace(/\s+/g, " ")).toContain(
          "第 3–4 条 / 共 5 条",
        );
        expect((await nav.innerText()).replace(/\s+/g, " ")).toContain(
          "第 2 / 3 页",
        );
        await nav.getByRole("button", { name: "第 3 页" }).click();
        await eventually(async () =>
          (await bodyRows(table)).map((r) => r.cells).toString() ===
            "钱七,22,杭州"
        );
        expect((await bodyRows(table)).map((r) => r.cells)).toEqual([
          ["钱七", "22", "杭州"],
        ]);
        expect((await nav.innerText()).replace(/\s+/g, " ")).toContain(
          "第 5–5 条 / 共 5 条",
        );
        expect((await nav.innerText()).replace(/\s+/g, " ")).toContain(
          "第 3 / 3 页",
        );
        expect(await nav.getByRole("button", { name: "下一页" }).isDisabled())
          .toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table 固定列 fixed @${width}：姓名左固定、操作右固定，横向滚动后位置仍贴边`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "固定列 fixed");
        const table = tableAt(root);
        expect(await headers(table)).toEqual(["姓名", "年龄", "地址", "操作"]);
        const minWidth = await table.evaluate((node) =>
          (node as HTMLElement).style.minWidth
        );
        expect(minWidth).toBe("640px");
        const first = table.locator("tbody tr").first().locator("td");
        expect(await first.nth(0).innerText()).toBe("张三");
        expect(await first.nth(3).innerText()).toBe("查看");
        const before = await first.evaluateAll((cells) =>
          cells.map((cell) => {
            const el = cell as HTMLElement;
            const box = el.getBoundingClientRect();
            return {
              position: el.style.position,
              left: el.style.left,
              right: el.style.right,
              x: box.left,
              rightEdge: box.right,
            };
          })
        );
        expect(before[0].position).toBe("sticky");
        expect(before[0].left).toBe("0px");
        expect(before[3].position).toBe("sticky");
        expect(before[3].right).toBe("0px");
        const wrapper = root.locator(".table-wrapper");
        await wrapper.evaluate((node) => {
          const el = node as HTMLElement;
          const outer = el.parentElement as HTMLElement | null;
          if (el.scrollWidth > el.clientWidth + 1) el.scrollLeft = 180;
          else if (outer && outer.scrollWidth > outer.clientWidth + 1) {
            outer.scrollLeft = 180;
          }
        });
        const after = await first.evaluateAll((cells) =>
          cells.map((cell) => {
            const box = (cell as HTMLElement).getBoundingClientRect();
            return { x: box.left, rightEdge: box.right };
          })
        );
        expect(Math.abs(after[0].x - before[0].x) < 1).toBe(true);
        expect(Math.abs(after[3].rightEdge - before[3].rightEdge) < 1).toBe(
          true,
        );
        expect(after[1].x < before[1].x - 20).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Table 可编辑列 editable + onCellChange @${width}：双击改姓名，失焦后写回`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/table");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "可编辑列 editable + onCellChange");
        const table = tableAt(root);
        const cols = await headers(table);
        expect(cols).toEqual([
          "文本 text",
          "数字 number",
          "email",
          "url",
          "tel",
          "date",
          "time",
          "select",
          "checkbox",
          "radio",
        ]);
        const nameIdx = cols.indexOf("文本 text");
        const checkIdx = cols.indexOf("checkbox");
        const radioIdx = cols.indexOf("radio");
        const first = table.locator("tbody tr").first().locator("td");
        const second = table.locator("tbody tr").nth(1).locator("td");
        expect((await first.nth(nameIdx).innerText()).trim()).toBe("张三");
        expect((await first.nth(checkIdx).innerText()).trim()).toBe("是");
        expect((await second.nth(checkIdx).innerText()).trim()).toBe("否");
        expect((await first.nth(radioIdx).innerText()).trim()).toBe("高");
        expect((await second.nth(radioIdx).innerText()).trim()).toBe("中");
        const nameCell = first.nth(nameIdx);
        const editor = nameCell.locator("[title='双击编辑']");
        expect(await editor.count()).toBe(1);
        await editor.dblclick();
        const input = nameCell.locator("input");
        await eventually(async () => await input.isVisible());
        expect(await input.inputValue()).toBe("张三");
        expect(await input.getAttribute("placeholder")).toBe("姓名");
        await input.fill("王小明");
        // 受控重挂后原 input 节点可能已摘掉，对 locator.blur() 不一定能冒泡 focusout。
        // 点击同行以外的单元格失焦，避免窄视口下标题被顶栏挡住而点不中。
        const otherCell = second.nth(nameIdx);
        await otherCell.scrollIntoViewIfNeeded();
        await otherCell.click();
        await eventually(async () =>
          (await nameCell.innerText()).trim() === "王小明" &&
          await nameCell.locator("input").count() === 0
        );
        expect((await second.nth(nameIdx).innerText()).trim()).toBe("李四");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
