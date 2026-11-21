/** WRITTEN-UNRUN. DataPanel section intros plus API tables. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import {
  API_SOURCE_API,
  COLUMNS_API,
  FORM_API,
  FORM_CONFIG_API,
  SEARCH_API,
  SEARCH_CONFIG_API,
  SOURCE_API,
  VIEW_CONFIG_API,
  VIEW_ITEM_API,
} from "../../../docs/src/data/data-display-api-types.ts";
import type { DocsApiTableRow } from "../../../docs/src/components/DocsApiTable.tsx";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { open, visible } from "./driver.ts";

const route = "/desktop/data-display/data-panel";

const PANEL_HANDLE_API: DocsApiTableRow[] = [
  {
    name: "refreshDataPanel(key)",
    type: "() => Promise<void>",
    default: "-",
    description: "重新拉取已挂载面板或详情；无句柄时回落旧 refreshers",
  },
  {
    name: "getDataPanel(key)",
    type: "DataPanelHandle | undefined",
    default: "-",
    description:
      "句柄：reload／getQuery／setQuery(patch)／getSelected／openForm(row?)／openView(row|id)",
  },
  {
    name: "getDataPanelQuery / setDataPanelQuery",
    type: "Query | undefined / (key, patch) => void",
    default: "-",
    description: "读／合并写当前查询（setQuery 会按 syncUrl 配置写地址栏）",
  },
  {
    name: "getDataPanelSelected(key)",
    type: "Row[]",
    default: "[]",
    description: "当前页已选中的行对象；未挂载时为空数组",
  },
  {
    name: "openDataPanelForm / openDataPanelView",
    type: "(key, row?) => void / (key, row|id) => void",
    default: "-",
    description: "打开新增（无 row）或编辑表单；打开详情（行对象或主键）",
  },
  {
    name: "getDataView / getDataViewRecord / openDataViewForm",
    type: "DataViewHandle / Row | null | undefined / (key, row?) => void",
    default: "-",
    description:
      "DataView 句柄：reload／getRecord／openForm。refreshDataPanel 对同一 panelKey 同样生效",
  },
];

function heading(page: Page, name: string): Locator {
  return page.getByRole("heading", { name, exact: true });
}

function apiTable(page: Page, name: string): Locator {
  return heading(page, name).locator("xpath=following::table[1]");
}

function sectionOf(page: Page, name: string): Locator {
  return heading(page, name).locator("xpath=ancestor::section[1]");
}

async function tableRows(table: Locator): Promise<string[][]> {
  return await table.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) =>
      Array.from(row.querySelectorAll("td")).map((td) =>
        (td.textContent ?? "").trim()
      )
    )
  );
}

function expected(rows: readonly DocsApiTableRow[]): string[][] {
  return rows.map((row) => [row.name, row.type, row.default, row.description]);
}

async function expectTable(
  page: Page,
  name: string,
  rows: readonly DocsApiTableRow[],
  firstHeader: string,
): Promise<void> {
  const table = apiTable(page, name);
  await visible(table);
  expect(await table.locator("thead th").allInnerTexts()).toEqual([
    firstHeader,
    "类型",
    "默认值",
    "说明",
  ]);
  expect(await tableRows(table)).toEqual(expected(rows));
}

describe("DataPanel API written", () => {
  for (const width of [390, 1280]) {
    it(
      `DataPanel 章节说明 @${width}：工具栏统合、完整示例、参数总览与进阶配置文案与代码可见`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 1100 });

        const toolbar = sectionOf(page, "工具栏与操作列（统合 Record）");
        await visible(heading(page, "工具栏与操作列（统合 Record）"));
        expect(await toolbar.innerText()).toContain(
          "时整栏工具栏不渲染",
        );
        expect(await toolbar.innerText()).toContain("写入序＝显示序");
        expect(await toolbar.innerText()).toContain("已废止");
        expect(await toolbar.innerText()).toContain("toolbar.extra");

        const full = sectionOf(page, "完整示例");
        await visible(heading(page, "完整示例"));
        await visible(full.getByText("代码示例", { exact: true }));
        expect(await full.innerText()).toContain(
          'import { DataPanel } from "@dreamer/ui-view/data-display"',
        );

        const overview = sectionOf(page, "参数写法总览");
        await visible(heading(page, "参数写法总览"));
        await visible(
          overview.getByText("完整本地示例（含 rows）", { exact: true }),
        );
        expect(await overview.innerText()).toContain("{ title, props }");
        expect(await overview.innerText()).toContain('type:"selection"');
        expect(await overview.innerText()).toContain('type:"actions"');

        const advanced = sectionOf(page, "进阶配置");
        await visible(heading(page, "进阶配置"));
        await visible(
          advanced.getByRole("heading", {
            name: "可配批量条（上下文）",
            exact: true,
          }),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `DataPanel API 表 @${width}：命令式/Column/Search/Form/View/DataSource 各表与源码逐字一致`,
      async (t) => {
        const page = await open(t, route);
        await page.setViewportSize({ width, height: 1100 });

        const searchSec = sectionOf(
          page,
          "Search（SearchConfig / SearchField）",
        );
        expect(await searchSec.innerText()).toContain("search.mode");
        expect(await searchSec.innerText()).toContain("expand");

        const formSec = sectionOf(page, "Form（FormConfig / FormField）");
        expect(await formSec.innerText()).toContain("form.render");
        expect(await formSec.innerText()).toContain("FormField.render");

        const viewSec = sectionOf(page, "View（ViewConfig / ViewItem）");
        expect(await viewSec.innerText()).toContain("descriptions");
        expect(await viewSec.innerText()).toContain("labelColPercent");

        const sourceSec = sectionOf(page, "数据源（DataSource）");
        expect(await sourceSec.innerText()).toContain("dataSource");
        expect(await sourceSec.innerText()).toContain("baseRoute");
        expect(await sourceSec.innerText()).toContain("action");
        expect(await sourceSec.innerText()).toContain("restful");

        await expectTable(
          page,
          "命令式 API（panelKey）",
          PANEL_HANDLE_API,
          "方法",
        );
        await expectTable(page, "Columns（Column）", COLUMNS_API, "属性");
        await expectTable(page, "SearchConfig", SEARCH_CONFIG_API, "属性");
        await expectTable(page, "SearchField", SEARCH_API, "属性");
        await expectTable(page, "FormConfig", FORM_CONFIG_API, "属性");
        await expectTable(page, "FormField", FORM_API, "属性");
        await expectTable(page, "ViewConfig", VIEW_CONFIG_API, "属性");
        await expectTable(page, "ViewItem", VIEW_ITEM_API, "属性");
        await expectTable(page, "数据源（DataSource）", SOURCE_API, "方法");
        await expectTable(page, "createApiDataSource", API_SOURCE_API, "项");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
