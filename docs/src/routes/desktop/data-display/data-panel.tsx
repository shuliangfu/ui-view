/**
 * DataPanel 数据面板文档页（概述、引入、示例、API、messages）
 * 路由: /desktop/data-display/data-panel
 */

import { Button, Paragraph, Title } from "@dreamer/ui-view/basic";
import { createSignal } from "@dreamer/view";

import {
  CodeBlock,
  DataPanel,
  getDataPanelQuery,
  getDataPanelSelected,
  openDataPanelForm,
  openDataPanelView,
  refreshDataPanel,
  setDataPanelQuery,
  validateForm,
} from "@dreamer/ui-view/data-display";
import type {
  Column,
  DataSource,
  FormField,
  Row,
} from "@dreamer/ui-view/data-display";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Input } from "@dreamer/ui-view/form/input";
import { Password } from "@dreamer/ui-view/form/password";
import { Modal, toast } from "@dreamer/ui-view/feedback";
import { IconCheck } from "@dreamer/ui-view/icons/Check.tsx";
import { IconBan } from "@dreamer/ui-view/icons/Ban.tsx";
import { IconBell } from "@dreamer/ui-view/icons/Bell.tsx";
import { IconFileSearch } from "@dreamer/ui-view/icons/FileSearch.tsx";
import { IconLock } from "@dreamer/ui-view/icons/Lock.tsx";
import { IconUserPlus } from "@dreamer/ui-view/icons/UserPlus.tsx";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsTypeApiSections } from "../../../components/DocsTypeApiSections.tsx";
import {
  API_SOURCE_API,
  COLUMNS_API,
  DATA_PANEL_EXTRA_TYPE_IDS,
  FORM_API,
  FORM_CONFIG_API,
  SEARCH_API,
  SEARCH_CONFIG_API,
  SOURCE_API,
  VIEW_CONFIG_API,
  VIEW_ITEM_API,
} from "../../../data/data-display-api-types.ts";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_DATA_PANEL } from "../../../data/component-messages-rows.ts";
import {
  DOCS_DEMO_CODE_MAX_HEIGHT,
  DocsDemo,
} from "../../../components/DocsDemo.tsx";
import {
  ALIGN_DEMO_COLUMNS,
  ALIGN_DEMO_COLUMNS_CODE,
  CELL_COLUMNS,
  CELL_FORM,
  cellDemoState,
  createCellDemoSource,
  createRemoteDemoSource,
  DEMO_COLUMNS,
  DEMO_COLUMNS_CODE,
  DEMO_COMMON_SETUP_CODE,
  DEMO_FORM,
  DEMO_FORM_CODE,
  DEMO_FORM_RICH,
  DEMO_FORM_RICH_CODE,
  DEMO_HIDE_CHROME,
  DEMO_HIDE_CHROME_CODE,
  DEMO_SEARCH,
  DEMO_SEARCH_CODE,
  demoCan,
  demoCapGate,
  type DemoPerms,
  MAKE_DEMO_ROWS_CODE,
  makeDemoRows,
  WITH_ROW_ACTIONS_CODE,
  withRowActions,
} from "../../../data/data-panel-demo.ts";

const DATA_PANEL_API: DocsApiTableRow[] = [
  {
    name: "title",
    type: "string",
    default: "-",
    description: "卡片标题（必填）",
  },
  {
    name: "columns",
    type: "Column[]",
    default: "-",
    description:
      "列定义（含 selection／index／actions、date／datetime.format）。详见下方 Columns 表。",
  },
  {
    name: "data",
    type: "Row[]",
    default: "-",
    description:
      "行数据。只传 data 时用本地源、不请求接口。与 baseRoute 同时传入时：首屏用这份数据渲染（挂载不请求 list），刷新／翻页／搜索／排序／切 Tab 再走 API。优先级低于 dataSource",
  },
  {
    name: "dataSource",
    type: "DataSource",
    default: "-",
    description:
      "自定义数据源；传入则走它、勿再自造拉数。优先级最高。list 必需；写方法按需。手写 DataSource 仍是逃生口",
  },
  {
    name: "baseRoute",
    type: "string",
    default: "-",
    description:
      '路由前缀或完整资源根（如 "/api" 或 "/api/users"）。去首尾 / 分段：≥2 段直接作根；仅 1 段再拼 resource，未传则自动取当前页面路由（打开 /rbac/admins 且 baseRoute="/api" → /api/rbac/admins）。不要把 index 拼进路径。未传 dataSource 时 createApiDataSource。只传 baseRoute 时挂载后拉 list；与 data 同时传入时首屏不请求，后续刷新／翻页再请求',
  },
  {
    name: "resource",
    type: "string",
    default: "-",
    description:
      '资源名／当前资源路由段（如 "users" 或 "rbac/admins"）。仅 baseRoute 为 1 段时生效；≥2 段忽略。不传则自动使用当前页面路由。未传 dataSource、由 baseRoute 建源时生效（可与 data 同时传入）',
  },
  {
    name: "apiMode",
    type: '"action" | "restful"',
    default: '"action"',
    description:
      "未传 dataSource、由 baseRoute 生成数据源时生效（可与 data 同时传入）。action：GET 根／POST …/create｜update｜remove（单条删除）｜remote-batch（批量删除）、importRows→create 且 body { rows }；restful：GET/POST 根、PUT／单条 DELETE 根/:id、批量删除 POST …/remote-batch、importRows→POST …/import",
  },
  {
    name: "apiHeaders",
    type: "HeadersInit | (() => HeadersInit | Promise<HeadersInit>)",
    default: "-",
    description:
      '仅 baseRoute 自动建源时生效。传给 createApiDataSource 的请求头（可函数）。用于 CSRF 等，例：() => ({ "X-CSRF-Token": token })。',
  },
  {
    name: "apiCredentials",
    type: "RequestCredentials",
    default: "浏览器默认（一般为 same-origin）",
    description: "仅 baseRoute 自动建源时生效。传给 fetch 的 credentials。",
  },
  {
    name: "onDataChange",
    type: "(rows) => void",
    default: "-",
    description: "data 模式下数据变化回调",
  },
  {
    name: "search",
    type: "SearchConfig",
    default: "—",
    description:
      "搜索弹层：title、props、actions，以及 width（弹层宽度，缺省 md）、fullscreenable（标题栏全屏按钮，缺省 false）、autoFullscreen（所有端打开即全屏，缺省 false）、mobileAutoFullscreen（仅移动端打开即全屏，缺省 false）。非空则工具栏搜索＋URL 同步。详见 Search 表。",
  },
  {
    name: "form",
    type: "FormConfig",
    default: "—",
    description:
      "增改弹层：title、props、render、actions，以及 width（弹层宽度，缺省 md）、fullscreenable（标题栏全屏按钮，缺省 false）、autoFullscreen（所有端打开即全屏，缺省 false）、mobileAutoFullscreen（仅移动端打开即全屏，缺省 false）。详见 Form 表。",
  },
  {
    name: "view",
    type: "ViewConfig",
    default: "columns＋form",
    description:
      "详情弹层：title、props、render、actions，以及 width（弹层宽度，缺省 md）、fullscreenable（标题栏全屏按钮，缺省 false）、autoFullscreen（所有端打开即全屏，缺省 false）、mobileAutoFullscreen（仅移动端打开即全屏，缺省 false）。Descriptions 的参数（除 items、title）可直接写在 view 上，与这些字段混在一起，例如 column（本插槽缺省 1）、size（缺省 sm）、bordered（缺省 true）、layout、colon、labelAlign、labelColPercent、labelMinWidth。title 仍是弹层标题。有 render 时这些参数不生效。不写时回落列＋表单。详见 View 表。",
  },
  {
    name: "panelKey",
    type: "string",
    default: '"data-panel"',
    description:
      "面板标识：持久化键、refreshDataPanel(key)，以及 getDataPanel／getDataPanelQuery／setDataPanelQuery／getDataPanelSelected／openDataPanelForm／openDataPanelView。同页多面板须唯一",
  },
  { name: "rowKey", type: "string", default: '"id"', description: "主键字段" },
  {
    name: "pageSize / pageSizes",
    type: "number / number[]",
    default: "20 / [10,20,50,100]",
    description: "默认每页条数与可选项",
  },
  {
    name: "paginationPreset",
    type: '"full" | "default" | "simple"',
    default: "随断点",
    description:
      "底栏分页能力档的简写，等价于 pagination.preset。与 pagination.preset 同时写时以 pagination.preset 为准。不传时按断点自动选择并带上对应 size：电脑端（min-width: 1280px）full／md，平板（640px–1279.98px）default／sm，移动端（max-width: 639.98px）simple／xs。",
  },
  {
    name: "pagination",
    type: "PanelPaginationConfig",
    default: "随断点",
    description:
      "底栏分页配置，透传 Pagination 的展示参数（preset、size、showFirstLast、showPrevNext、showPageNumbers、showQuickJumper、showTotal、disabled、class、testIdPrefix、messages）。页码、每页条数、总数和 onChange 由面板托管；地址栏同步用 syncUrl，每页条数选项用 pageSizes。未写的键走断点缺省（或 paginationPreset）。本插槽默认关掉 Pagination 自带总条数和跳转（左侧条数文案和 full 档右侧跳转由面板渲染）；显式 showQuickJumper: true 时改用 Pagination 自带跳转。详见 PanelPaginationConfig 表。",
  },
  {
    name: "defaultSort",
    type: "{ prop; order: 'asc'|'desc' }",
    default: "-",
    description: "默认排序；表头第三次点击回到它",
  },
  {
    name: "fixed",
    type: "Record<string,string>",
    default: "-",
    description: "固定过滤，并入每次查询",
  },
  {
    name: "initial / initialQuery",
    type: "ListResult / Partial<Query>",
    default: "-",
    description:
      "服务端预取首屏（ListResult）／初始查询。只配远程源时有 initial 则挂载后不再请求。与 data + baseRoute 同时用时：行仍用 data；initial.total 作为首屏条数。只传当前页 data 时请给出真实 total，否则用 data.length，不会臆造更大的总数。initial.totals 仅为兼容字段，页脚合计由面板按行数据自算，不读取它。data 应与当前页码／查询一致",
  },
  {
    name: "caps",
    type: "Partial<Caps>",
    default: "按数据源推断",
    description:
      "能力开关：create／update／view／remove／import／…。toolbar／column.actions 声明键请写明确 true｜false｜object",
  },
  {
    name: "locale",
    type: '"zh-CN" | "en-US"',
    default: '"zh-CN"',
    description:
      "界面语言 zh-CN／en-US；再与 messages 浅合并（独立于 ConfigProvider.locale）",
  },
  {
    name: "messages",
    type: "Partial<Messages>",
    default: "-",
    description: "覆盖文案；字段见下文「文案（messages）」表，勿将键摊入本表",
  },
  {
    name: "exportName",
    type: "string",
    default: "title",
    description: "导出文件名（不含扩展名，自动追加日期）",
  },
  {
    name: "defaultDensity",
    type: '"compact" | "comfortable" | "loose"',
    default: '"comfortable"',
    description: "初始行高密度；工具栏「行高」菜单可切换（紧凑／舒适／宽松）",
  },
  {
    name: "onExport",
    type: '(format: "xlsx" | "csv" | "json" | "xml" | "html", ctx) => void',
    default: "-",
    description:
      "接管导出（如调用服务端接口）；缺省时面板分页拉取全部行并在浏览器生成文件",
  },
  {
    name: "onImportRows",
    type: "(rows) => void",
    default: "-",
    description:
      "接管导入（xlsx／csv／json／xml）；缺省走 dataSource.importRows",
  },
  {
    name: "renderCell",
    type: "Record<string, (row) => unknown>",
    default: "-",
    description: "按列自定义单元格",
  },
  {
    name: "toolbar",
    type: "false | PanelToolbarConfig (Record)",
    default: "{}",
    description:
      "`false`＝整栏不渲染；省略／{}／Record＝统合 Record。声明项写明确 true｜false｜object（省略键才回落 caps）；对象可 show／disable／icon／label／title／tone／action。show／disable／action 接收 { selected, rows, query }（零参函数仍可用）。写入序＝显示序",
  },

  {
    name: "alert",
    type:
      "string | DataAlertConfig | false | null | (() => string | DataAlertConfig | false | null | undefined)",
    default: "-",
    description:
      '页面提示条，位于工具栏（含工具栏左侧标签）下方、表格上方。字符串简写为 info 提示（如 alert="请先完成实名认证"）。对象为完整 DataAlertConfig：透传 Alert 的 type／message／description／showIcon／closable／onClose／banner／action／class／children／messages，另加 show／key。false／null／省略／show: false 不显示；函数在渲染时求值。本插槽 closable、banner 默认 true。点击关闭会隐藏提示并调用 onClose；更换文案或先置空再传入会重新显示。详见下方 DataAlertConfig 表。',
  },
  {
    name: "batchBar",
    type: "false | BatchBarConfig (Record)",
    default: "{}",
    description:
      "勾选后出现的批量条。默认只显示批量删除和取消勾选，不必把这两项写进配置。写法同 toolbar：内置键 remove／clear；若要别的批量操作，用自定义键自行编写 action。show／disable／action 接收 { selected, rows, query }，可写 confirm。false＝不渲染批量条",
  },
  {
    name: "onSelectionChange",
    type: "(selected: Row[]) => void",
    default: "-",
    description: "勾选变化时回调当前选中行（行对象，非仅 id）",
  },
  {
    name: "isRowDisabled",
    type: "(row) => boolean",
    default: "!!row.locked",
    description: "行是否禁用选择／删除／行内编辑；缺省回落 row.locked",
  },
  {
    name: "autoActions",
    type: "boolean",
    default: "true",
    description:
      '为 false 时不因 caps.view／update／remove 自动补操作列；仍可用 columns 声明 { type:"actions" }',
  },
  {
    name: "onRowClick",
    type: "(row) => void",
    default: "-",
    description:
      "点击行（避开勾选、按钮、链接）时回调。传入则只走此回调，不再打开详情。默认点击行不会打开详情",
  },
  {
    name: "openViewOnRowClick",
    type: "boolean",
    default: "false",
    description:
      "点击行是否打开详情。默认 false，只能通过操作列眼睛打开。为 true 且 caps.view 时，点击行（避开勾选、按钮、链接）打开详情。若同时传了 onRowClick，只走回调",
  },
  {
    name: "selectable",
    type: "boolean",
    default: "（按需）",
    description:
      '@deprecated 顶层开关。多选勾选列只由 columns 里的 `{ type:"selection" }` 决定（prop／label 可省）。false＝仍强制去掉 selection（兼容）；省略／true 以及 caps.remove 都不会再自动前置勾选列。',
  },
  {
    name: "onChanged",
    type: "() => void",
    default: "-",
    description: "任一写操作成功后回调",
  },
  {
    name: "syncUrl",
    type: "boolean | { prefix?: string }",
    default: "true",
    description:
      '分页、排序默认与地址栏双向同步；配置了 search 时搜索字段一并同步。传 false 关闭（抽屉／同页多面板互不抢参数）。传 { prefix: "p1" } 把 page／pageSize／sort／order／搜索字段写成 p1_page 等',
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description:
      "额外 class（加在卡片上）。移动端（max-width: 639.98px）自带：卡片 margin-top/left/right=0，.dp-table-wrap padding-top/left/right=0（表格贴边）；底栏分页各端均为左右一行（左侧条数文案，右侧分页控件）；底栏分页预设与尺寸随断点：电脑端（≥1280px）full／md，平板（640px–1279.98px）default／sm，移动端（≤639.98px）simple／xs；可用 pagination 或 paginationPreset 覆盖",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description:
      "面板根内额外内容（旁路自管 Modal 等），不替换表格。与 DataView 的 children（替换明细正文）不同；明细主体请优先用 view.render",
  },
  {
    name: "tabs",
    type: "DataChromeTab[]",
    default: "-",
    description:
      "工具栏左侧的标签页（复用 layout Tabs）。未写 children 的标签展示默认表格。配置了 tabs 后，当前标签 key 会作为查询参数带到所有 API 请求（列表／刷新／搜索／导入／导出／增删改／详情）；没有 tabs 时不带该参数。切换标签会回到第 1 页并重新拉数，已请求过的相同查询走内存缓存；工具栏刷新只作废当前标签的缓存",
  },
  {
    name: "activeTab",
    type: "string",
    default: "-",
    description: "受控的当前标签 key",
  },
  {
    name: "defaultActiveTab",
    type: "string",
    default: "第一项可用 key",
    description: "非受控时的初始标签 key",
  },
  {
    name: "onTabChange",
    type: "(key: string) => void",
    default: "-",
    description: "切换标签时回调",
  },
  {
    name: "tabType",
    type: '"line" | "card"',
    default: '"line"',
    description: "标签样式，与 Tabs 的 type 相同",
  },
  {
    name: "tabParam",
    type: "string | false",
    default: "tab",
    description:
      "查询参数名，用于地址栏同步，并带到 API 请求里（默认 tab，如 ?tab=12）。false 则不同步地址栏，也不在请求里带该参数",
  },
];

/** 按 panelKey 注册的命令式句柄（与 refreshDataPanel 同一套键） */
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

/** Columns 字段全表（Column） */
const apiActionCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COLUMNS_CODE}

${DEMO_SEARCH_CODE}

${DEMO_FORM_CODE}

// 不传 data、不传 dataSource；baseRoute 作为资源根。默认 apiMode:"action"。

<DataPanel
  title="用户（action）"
  panelKey="demo-api-users-action"
  baseRoute="/api/users"
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
  pageSize={20}
/>
`;

const apiRestfulCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COLUMNS_CODE}

${DEMO_SEARCH_CODE}

${DEMO_FORM_CODE}

// 不传 data、不传 dataSource；baseRoute ≥2 段直接作资源根。apiMode:"restful"。

<DataPanel
  title="订单（restful）"
  panelKey="demo-api-orders-restful"
  baseRoute="/api/orders"
  apiMode="restful"
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
  pageSize={20}
/>
`;
const dataBaseRouteCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

// 首屏用这 3 行（刷新浏览器也不会先出空表）。
// 总数 3；若 data 只是当前页、真实总数更大，请再传 initial={{ total: 128 }}。
const rows: Row[] = [
  {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    role: "admin",
    status: "active",
    balance: 120,
    score: 80,
    createdAt: "2026-11-01T01:00:00.000Z",
  },
  {
    id: "2",
    name: "李四",
    email: "lisi@example.com",
    role: "editor",
    status: "active",
    balance: 80,
    score: 60,
    createdAt: "2026-11-02T02:00:00.000Z",
  },
  {
    id: "3",
    name: "王五",
    email: "wangwu@example.com",
    role: "viewer",
    status: "disabled",
    balance: 40,
    score: 30,
    createdAt: "2026-11-03T03:00:00.000Z",
  },
];

<DataPanel
  panelKey="demo-data-base-route"
  title="首屏 data + baseRoute"
  syncUrl={false}
  data={rows}
  baseRoute="/api/users"
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
  pageSize={20}
/>
`;

const importCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(25);

<DataPanel
  panelKey="demo-basic"
  title="用户管理"
  data={rows}
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
  exportName="users"
/>
`;

const columnsCode =
  `import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

// 与下方各示例使用同一份定义。makeDemoRows(n) 按可复现规则生成 n 行。
const rows = makeDemoRows(25);
`;

const colFnRows = [
  { id: "1", name: "Alice", flag: 1, level: 0 },
  { id: "2", name: "Bob", flag: 0, level: 1 },
  { id: "3", name: "Carol", flag: 1, level: 1 },
];
const colFnColumns: Column[] = [
  { type: "index" },
  { prop: "name", label: "姓名" },
  {
    prop: "flag",
    label: "标记（value+color）",
    type: "tag",
    // 0|1 → 文案＋色调（value／color）
    value: (row: Row) => (row.flag === 1 ? "开启" : "关闭"),
    color: (row: Row) => (row.flag === 1 ? "success" : "danger"),
  },
  {
    prop: "level",
    label: "级别（Icon／span）",
    // 返回组件或 span——任意可渲染节点
    value: (row: Row) =>
      row.level === 1
        ? (
          <span class="inline-flex items-center gap-1 text-emerald-600">
            <IconCheck class="h-3.5 w-3.5" />
            高级
          </span>
        )
        : (
          <span class="inline-flex items-center gap-1 text-slate-400">
            <IconBan class="h-3.5 w-3.5" />
            普通
          </span>
        ),
  },
  {
    prop: "flag",
    label: "HTML（formatter）",
    formatter: (_row: Row, raw: unknown) =>
      raw === 1
        ? '<b style="color:#059669">ON</b>'
        : '<span style="color:#94a3b8">OFF</span>',
  },
  {
    type: "actions",
    actions: {
      view: true,
      edit: true,
      remove: false,
    },
  },
];
const colFnCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, Row } from "@dreamer/ui-view/data-display";
import { IconCheck } from "@dreamer/ui-view/icons/Check.tsx";
import { IconBan } from "@dreamer/ui-view/icons/Ban.tsx";

const rows = [
  { id: "1", name: "Alice", flag: 1, level: 0 },
  { id: "2", name: "Bob", flag: 0, level: 1 },
  { id: "3", name: "Carol", flag: 1, level: 1 },
];
const columns: Column[] = [
  { type: "index" },
  { prop: "name", label: "姓名" },
  {
    prop: "flag",
    label: "标记（value+color）",
    type: "tag",
    value: (row: Row) => (row.flag === 1 ? "开启" : "关闭"),
    color: (row: Row) => (row.flag === 1 ? "success" : "danger"),
  },
  {
    prop: "level",
    label: "级别（Icon／span）",
    value: (row: Row) =>
      row.level === 1
        ? (
          <span class="inline-flex items-center gap-1 text-emerald-600">
            <IconCheck class="h-3.5 w-3.5" />
            高级
          </span>
        )
        : (
          <span class="inline-flex items-center gap-1 text-slate-400">
            <IconBan class="h-3.5 w-3.5" />
            普通
          </span>
        ),
  },
  {
    prop: "flag",
    label: "HTML（formatter）",
    formatter: (_row: Row, raw: unknown) =>
      raw === 1
        ? '<b style="color:#059669">ON</b>'
        : '<span style="color:#94a3b8">OFF</span>',
  },
  {
    type: "actions",
    actions: { view: true, edit: true, remove: false },
  },
];

<DataPanel
  panelKey="demo-col-fn"
  title="列函数显示"
  data={rows}
  columns={columns}
  search={{ title: "筛选用户", props: [{ prop: "name" }] }}
  form={{
    title: (row) =>
      row.id ? \`修改 · \${String(row.name ?? "")}\` : "添加用户",
    props: [
      { prop: "name", required: true },
      { prop: "flag", type: "number", initial: 0 },
      { prop: "level", type: "number", initial: 0 },
    ],
  }}
  view={{
    title: (row) => \`详情 · \${String(row.name ?? "")}\`,
    props: [
      { prop: "name", label: "姓名" },
      {
        prop: "flag",
        label: "标记",
        value: (row) => row.flag === 1 ? "开启" : "关闭",
      },
      { prop: "level", label: "级别" },
    ],
  }}
  caps={{
    create: true,
    update: true,
    view: true,
    remove: false,
    import: false,
    export: false,
    print: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

const joinNameRows = [
  { id: "1", lastName: "张", firstName: "三" },
  { id: "2", lastName: "李", firstName: "四" },
  { id: "3", lastName: "王", firstName: "五" },
];
const joinNameColumns: Column[] = [
  { type: "index" },
  { prop: "lastName", label: "姓", sortable: true },
  { prop: "firstName", label: "名", sortable: true },
  {
    label: "姓名",
    sortable: true,
    sortProp: "lastName",
    formatter: (row: Row) =>
      `${row.lastName ?? ""}${row.firstName ?? ""}` || "—",
  },
];
const joinNameCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, Row } from "@dreamer/ui-view/data-display";

const rows = [
  { id: "1", lastName: "张", firstName: "三" },
  { id: "2", lastName: "李", firstName: "四" },
  { id: "3", lastName: "王", firstName: "五" },
];
const columns: Column[] = [
  { type: "index" },
  { prop: "lastName", label: "姓", sortable: true },
  { prop: "firstName", label: "名", sortable: true },
  {
    label: "姓名",
    sortable: true,
    sortProp: "lastName",
    formatter: (row: Row) =>
      \`\${row.lastName ?? ""}\${row.firstName ?? ""}\` || "—",
  },
];

<DataPanel
  panelKey="demo-join-name"
  title="拼接列"
  data={rows}
  columns={columns}
  caps={{
    create: false,
    update: false,
    view: false,
    remove: false,
    import: false,
    export: false,
    print: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

const basicCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(25);

<DataPanel
  panelKey="demo-basic"
  title="用户管理"
  data={rows}
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
  exportName="users"
/>
`;

const searchCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(25);
const columnsWithoutInlineStatus = columns.map((c) =>
  c.prop === "status" ? { ...c, inline: undefined } : c
);

<DataPanel
  panelKey="demo-search"
  title="搜索表单"
  data={rows}
  columns={columnsWithoutInlineStatus}
  search={{ title: "筛选条件", props: search }}
  initialQuery={{ filters: { role: "admin" } }}
  caps={{ create: false }}
/>
`;

const syncUrlCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(25);

// 分页、排序默认与地址栏双向同步；配置了 search 后搜索字段一并写入。
// 同页多面板或抽屉里不抢地址栏时设 syncUrl={false}。

<DataPanel
  panelKey="demo-sync-url"
  title="用户管理"
  data={rows}
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
/>
`;

const tableCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(8);

<DataPanel
  panelKey="demo-table"
  title="表格功能"
  data={rows}
  columns={columns}
  defaultSort={{ prop: "balance", order: "desc" }}
  form={{ props: form }}
  caps={{ create: false, remove: false }}
/>
`;

const crudCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(8);

<DataPanel
  panelKey="demo-crud"
  title="CRUD"
  data={rows}
  columns={columns}
  form={{ props: form }}
/>
`;

const batchCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(10);

<DataPanel
  panelKey="demo-batch"
  title="批量操作"
  data={rows}
  columns={columns}
  form={{ props: form }}
/>
`;

const pageCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(40);

<DataPanel
  panelKey="demo-page"
  title="分页"
  data={rows}
  columns={columns}
  pageSize={5}
  pageSizes={[5, 10, 20]}
  caps={{ create: false }}
/>
`;

const exportCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(15);

<DataPanel
  panelKey="demo-export"
  title="导出导入"
  data={rows}
  columns={columns}
  form={{ props: form }}
  exportName="users"
/>
`;

const cellCode =
  `import { DataPanel, createLocalDataSource } from "@dreamer/ui-view/data-display";
import type { Column, DataSource, FormField, Row } from "@dreamer/ui-view/data-display";

${MAKE_DEMO_ROWS_CODE}

const cellDemoState = { fail: false };

const roleOptions = [
  { value: "admin", label: "管理员", tone: "danger" },
  { value: "editor", label: "编辑", tone: "info" },
  { value: "viewer", label: "访客", tone: "default" },
];
const tagOptions = [
  { value: "vip", label: "VIP", tone: "warning" },
  { value: "new", label: "新用户", tone: "success" },
  { value: "beta", label: "内测", tone: "info" },
  { value: "staff", label: "员工", tone: "default" },
];

function makeCellRows(n = 5): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: NAMES[i % NAMES.length],
    score: 10 + i * 15,
    role: ["admin", "editor", "viewer"][i % 3],
    tags: [["vip"], ["new", "beta"], [], ["staff"], ["vip", "staff"]][i % 5],
    status: i % 2 === 0 ? "active" : "disabled",
    birthday: \`199\${i}-0\${i + 1}-1\${i}\`,
    loginAt: new Date(2026, 0, 1 + i, 9 + i, 30).toISOString(),
    remark: \`第 \${i + 1} 位用户的备注\`,
  }));
}

const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名（text）", inline: "text" },
  { prop: "score", label: "积分（number）", type: "number", inline: "number" },
  {
    prop: "role",
    label: "角色（select）",
    type: "tag",
    inline: "select",
    options: roleOptions,
  },
  {
    prop: "tags",
    label: "标签（multiselect）",
    type: "tag",
    inline: "multiselect",
    options: tagOptions,
  },
  {
    prop: "status",
    label: "状态（switch）",
    type: "tag",
    inline: "switch",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  { prop: "birthday", label: "生日（date）", type: "date", inline: "date" },
  {
    prop: "loginAt",
    label: "最近登录（datetime）",
    type: "datetime",
    inline: "datetime",
  },
  { prop: "remark", label: "备注（textarea）", inline: "textarea" },
  { type: "actions", actions: { view: true, edit: true, remove: false } },
];

const form: FormField[] = [
  { prop: "name", label: "姓名（text）", required: true },
  { prop: "score", label: "积分（number）", type: "number", min: 0, initial: 0 },
  { prop: "role", label: "角色（select）", type: "select", required: true, initial: "viewer" },
  { prop: "tags", label: "标签（multiselect）", type: "multiselect" },
  { prop: "status", label: "状态（switch）", type: "switch", initial: "active" },
  { prop: "birthday", label: "生日（date）", type: "date" },
  { prop: "loginAt", label: "最近登录（datetime）", type: "datetime" },
  { prop: "remark", label: "备注（textarea）", type: "textarea" },
];

function createCellDemoSource(): DataSource {
  const inner = createLocalDataSource({
    rows: makeCellRows(5),
    columns,
    form,
    writable: true,
  });
  return {
    ...inner,
    setField: (ids, field, value) => {
      if (cellDemoState.fail) {
        return {
          removed: 0,
          failed: ids.map((id) => ({
            id,
            error: "保存失败（演示：服务端拒绝）",
          })),
        };
      }
      return inner.setField!(ids, field, value);
    },
  } as DataSource;
}

const cellSource = createCellDemoSource();

<label class="mb-2 flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    onChange={(e) => {
      cellDemoState.fail = e.target.checked;
    }}
  />
  模拟保存失败（勾选后再编辑：提示错误并保持原值）
</label>
<DataPanel
  panelKey="demo-cell"
  title="单元格编辑"
  dataSource={cellSource}
  columns={columns}
  form={{ props: form }}
  caps={{
    create: false,
    remove: false,
    import: false,
    export: false,
    print: false,
    columns: false,
  }}
/>
`;

const remoteCode =
  `import { DataPanel, createLocalDataSource } from "@dreamer/ui-view/data-display";
import type { Column, DataSource, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

function createRemoteDemoSource(latency = 400): DataSource {
  const inner = createLocalDataSource({
    rows: makeDemoRows(60),
    columns,
    search,
    form,
  });
  const wait = (v) => new Promise((r) => setTimeout(() => r(v), latency));
  return {
    list: (q) => wait(inner.list(q)),
    create: (v) => wait(inner.create(v)),
    update: (id, v) => wait(inner.update(id, v)),
    remove: (ids) => wait(inner.remove(ids)),
    setField: (ids, f, v) => wait(inner.setField(ids, f, v)),
    importRows: (rows) => wait(inner.importRows(rows)),
  };
}

// 本页演示为内存异步源（60 行 + 延迟 300ms），与面板同一份。
const remote = createRemoteDemoSource(300);

<DataPanel
  panelKey="demo-remote"
  title="远程数据"
  dataSource={remote}
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
/>
`;

const themeCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(6);

// 浅色 / 深色：跟随根节点 .dark。
<div class="dark rounded-lg bg-slate-900 p-3">
  <DataPanel
    panelKey="demo-dark"
    title="深色面板"
    data={rows}
    columns={columns}
    search={{ props: search }}
    form={{ props: form }}
  />
</div>
`;

const localeCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(6).map((r) => ({ ...r }));
const enColumns = columns.map((c) => ({
  ...c,
  label: ({
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    balance: "Balance",
    score: "Score",
    createdAt: "Created",
  } as Record<string, string>)[c.prop!] ?? c.label,
}));

<DataPanel
  panelKey="demo-locale"
  locale="en-US"
  title="Users"
  data={rows}
  columns={enColumns}
  search={{ props: [{ name: "name", label: "Name" }] }}
  form={{ props: form.map((f) => ({ ...f })) }}
  messages={{ create: "New" }}
/>
`;

const toolbarOffCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(5);

<DataPanel
  panelKey="demo-toolbar-off"
  title="无工具栏"
  data={rows}
  columns={columns}
  form={{ props: form }}
  toolbar={false}
/>
<p
  class="mt-2 text-xs text-slate-500"
  data-testid="demo-toolbar-off-hint"
>
  toolbar=false
  时整栏工具栏不出现；表格／分页仍渲染。移动端（≤639.98px）表格卡上／左／右贴边；底栏分页各端均为左右一行（左侧条数、右侧控件）；底栏分页预设与尺寸随断点：电脑端（≥1280px）full／md，平板（640px–1279.98px）default／sm，移动端（≤639.98px）simple／xs，也可用 pagination 或 paginationPreset 覆盖。
</p>
`;

const defaultsCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(5);

${WITH_ROW_ACTIONS_CODE}

<DataPanel
  panelKey="demo-defaults"
  title="声明默认 vs caps"
  data={rows}
  columns={withRowActions({
    edit: { disable: true },
  })}
  form={{ props: form }}
  caps={{
    create: false,
    update: false,
    print: false,
    import: false,
    export: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
  toolbar={{
    create: {},
    refresh: { disable: true },
  }}
/>
<p
  class="mt-2 text-xs text-slate-500"
  data-testid="demo-defaults-hint"
>
  caps 关 create／update，但声明项 create 空对象、edit 仅 disable
  仍显示；refresh 禁用仍可见；未声明 view／remove 按 caps。
</p>
`;

const boolCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(5);

${WITH_ROW_ACTIONS_CODE}

<DataPanel
  panelKey="demo-bool"
  title="true／false 简写"
  data={rows}
  columns={withRowActions({
    view: true,
    edit: true,
    remove: false,
  })}
  search={{ props: search }}
  form={{ props: form }}
  toolbar={{
    create: true,
    search: true,
    refresh: true,
    print: false,
    import: false,
    export: false,
  }}
/>
`;

const tbFnCode = `import { createSignal } from "@dreamer/view";
import { Button } from "@dreamer/ui-view/basic";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { IconFileSearch } from "@dreamer/ui-view/icons/FileSearch.tsx";

${DEMO_COMMON_SETUP_CODE}

${DEMO_HIDE_CHROME_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");
const pageAllowAudit = createSignal(true);

<div class="mb-2 flex flex-wrap items-center gap-2">
  <Button
    type="button"
    size="sm"
    data-testid="demo-tb-fn-toggle"
    onClick={() => {
      pageAllowAudit.value = !pageAllowAudit.value;
    }}
  >
    {() => pageAllowAudit.value
      ? "关闭权限（审计变禁用）"
      : "打开权限（审计可点）"}
  </Button>
  <span class="text-xs text-slate-500" data-testid="demo-tb-fn-flag">
    {() => \`pageAllowAudit=\${String(pageAllowAudit.value)}\`}
  </span>
</div>
<DataPanel
  panelKey="demo-tb-fn"
  title="toolbar 函数 show"
  data={rows}
  columns={columns}
  form={{ props: form }}
  toolbar={{
    create: true,
    audit: {
      icon: <IconFileSearch />,
      title: "审计",
      label: "审计",
      show: () => true,
      disable: () => !pageAllowAudit.value,
      action: ({ selected }) => {
        actionHint.value = \`toolbar:audit selected=\${selected.length}\`;
      },
    },
    refresh: true,
    ...hideChrome,
  }}
/>
<p class="mt-2 text-xs text-slate-500" data-testid="demo-tb-fn-hint">
  {() => actionHint.value ||
    "pageAllowAudit=false 时审计仍可见但 disabled"}
</p>
`;

const raFnCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<DataPanel
  panelKey="demo-ra-fn"
  title="操作列函数"
  data={rows}
  columns={withRowActions({
    view: false,
    edit: false,
    remove: false,
    assign: {
      label: "分配",
      show: () => true,
      disable: (item) => !!item.locked,
      action: (item) => {
        actionHint.value = \`row:assign:\${String(item.id)}\`;
      },
    },
  })}
  caps={{ create: false, update: false, remove: false, view: false }}
/>
<p class="mt-2 text-xs text-slate-500" data-testid="demo-ra-fn-hint">
  {() =>
    actionHint.value ||
    "locked 行「分配」仍可见但 disabled；点击看 item.id"}
</p>
`;

const tbCustomCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { IconUserPlus } from "@dreamer/ui-view/icons/UserPlus.tsx";

${DEMO_COMMON_SETUP_CODE}

${DEMO_HIDE_CHROME_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<DataPanel
  panelKey="demo-tb-custom"
  title="自定义工具钮"
  data={rows}
  columns={columns}
  form={{ props: form }}
  toolbar={{
    create: true,
    invite: {
      icon: <IconUserPlus />,
      title: "邀请",
      label: "邀请",
      action: () => {
        actionHint.value = "toolbar:invite";
      },
    },
    refresh: true,
    ...hideChrome,
  }}
/>
<p
  class="mt-2 text-xs text-slate-500"
  data-testid="demo-tb-custom-hint"
>
  {() => actionHint.value || "点击「邀请」"}
</p>
`;

const raCustomCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<DataPanel
  panelKey="demo-ra-custom"
  title="自定义操作列"
  data={rows}
  columns={withRowActions({
    view: true,
    clone: {
      label: "克隆",
      action: (item) => {
        actionHint.value = \`row:clone:\${String(item.id)}\`;
      },
    },
    edit: true,
    remove: false,
  })}
  form={{ props: form }}
/>
<p
  class="mt-2 text-xs text-slate-500"
  data-testid="demo-ra-custom-hint"
>
  {() =>
    actionHint.value || "写入序：view → clone → edit（无 remove）"}
</p>
`;

const keyOrderCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { IconFileSearch } from "@dreamer/ui-view/icons/FileSearch.tsx";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<DataPanel
  panelKey="demo-key-order"
  title="写入序＝显示序"
  data={rows}
  columns={columns}
  form={{ props: form }}
  toolbar={{
    create: true,
    audit: {
      icon: <IconFileSearch />,
      title: "审计",
      label: "审计",
      action: () => {
        actionHint.value = "order:audit";
      },
    },
    refresh: true,
    export: true,
    print: false,
    import: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
<p
  class="mt-2 text-xs text-slate-500"
  data-testid="demo-key-order-hint"
>
  工具栏从左到右：添加 → 审计 → 刷新 → 导出（与对象键顺序一致）
</p>
`;

const enabledCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { IconLock } from "@dreamer/ui-view/icons/Lock.tsx";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<DataPanel
  panelKey="demo-enabled"
  title="disable 演示"
  data={rows}
  columns={withRowActions({
    view: true,
    edit: { disable: true },
    remove: false,
    assign: {
      label: "分配",
      disable: (item) => !!item.locked,
      action: (item) => {
        actionHint.value = \`disable:assign:\${String(item.id)}\`;
      },
    },
  })}
  form={{ props: form }}
  toolbar={{
    create: { disable: true },
    freeze: {
      icon: <IconLock />,
      title: "冻结",
      label: "冻结",
      disable: () => true,
      action: () => {
        actionHint.value = "should-not-fire";
      },
    },
    refresh: true,
    print: false,
    import: false,
    export: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
<p
  class="mt-2 text-xs text-slate-500"
  data-testid="demo-enabled-hint"
>
  添加／冻结／编辑为 disabled 仍可见；locked
  行「分配」禁用。show:false 才会隐藏。
</p>
`;

const titleCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { IconLock } from "@dreamer/ui-view/icons/Lock.tsx";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<DataPanel
  panelKey="demo-title"
  title="title Tooltip"
  data={rows}
  columns={withRowActions({
    view: true,
    edit: { title: "改资料" },
    remove: false,
    assign: {
      label: "分配",
      action: (item) => {
        actionHint.value = \`title:assign:\${String(item.id)}\`;
      },
    },
  })}
  form={{ props: form }}
  toolbar={{
    create: true,
    refresh: { title: "立刻刷新" },
    freeze: {
      icon: <IconLock />,
      title: "冻结",
      label: "冻结",
      action: () => {
        actionHint.value = "title:freeze";
      },
    },
    print: false,
    import: false,
    export: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
<p class="mt-2 text-xs text-slate-500" data-testid="demo-title-hint">
  不传 title：内置悬停用 messages／label，自定义悬停用 key（如
  freeze／assign）；传了则覆盖（立刻刷新／改资料）。
</p>
`;

const canCode = `import { createSignal } from "@dreamer/view";
import { Button } from "@dreamer/ui-view/basic";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

type DemoPerms = { "demo.view": boolean; "demo.write": boolean };

function demoCan(perms: DemoPerms, code: keyof DemoPerms): boolean {
  return !!perms[code];
}

function demoCapGate(allow: boolean): boolean {
  return allow;
}

const rows = makeDemoRows(5);
const actionHint = createSignal("");
const perms = createSignal<DemoPerms>({
  "demo.view": true,
  "demo.write": false,
});
const pageExport = createSignal(true);
const can = (code: keyof DemoPerms) => demoCan(perms.value, code);

<div class="mb-2 flex flex-wrap items-center gap-2">
  <Button
    type="button"
    size="sm"
    data-testid="demo-can-toggle-write"
    onClick={() => {
      perms.value = {
        ...perms.value,
        "demo.write": !perms.value["demo.write"],
      };
    }}
  >
    {() =>
      perms.value["demo.write"]
        ? "关闭 demo.write"
        : "打开 demo.write"}
  </Button>
  <Button
    type="button"
    size="sm"
    data-testid="demo-can-toggle-export"
    onClick={() => {
      pageExport.value = !pageExport.value;
    }}
  >
    {() => pageExport.value ? "关闭 pageExport" : "打开 pageExport"}
  </Button>
  <span class="text-xs text-slate-500" data-testid="demo-can-flags">
    {() =>
      \`write=\${String(perms.value["demo.write"])} view=\${
        String(perms.value["demo.view"])
      } pageExport=\${String(pageExport.value)}\`}
  </span>
</div>
<DataPanel
  panelKey="demo-can"
  title="can()／页面变量"
  data={rows}
  columns={withRowActions({
    view: demoCapGate(can("demo.view") || can("demo.write")),
    edit: demoCapGate(can("demo.write")),
    remove: demoCapGate(can("demo.write")),
    assign: {
      label: "分配",
      show: () => can("demo.write"),
      action: (item) => {
        actionHint.value = \`can:assign:\${String(item.id)}\`;
      },
    },
  })}
  form={{ props: form }}
  search={{ props: search }}
  toolbar={{
    create: demoCapGate(can("demo.write")),
    search: true,
    refresh: true,
    import: demoCapGate(can("demo.write")),
    export: {
      show: () => can("demo.view"),
      disable: () => !pageExport.value,
    },
    print: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
<p class="mt-2 text-xs text-slate-500" data-testid="demo-can-hint">
  {() => actionHint.value ||
    "默认 write=false：无创建／导入／编辑／删除／分配；export 受 pageExport＆view 控制"}
</p>
`;

const customCode = `import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { IconBell } from "@dreamer/ui-view/icons/Bell.tsx";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(5);
const actionHint = createSignal("");

<div class="flex flex-col gap-2">
  <span
    class="text-sm text-slate-500"
    data-testid="demo-custom-leading"
  >
    面板外提示（原 toolbarExtra 迁此）
  </span>
  <DataPanel
    panelKey="demo-custom"
    title="自定义"
    data={rows}
    columns={withRowActions({
      view: false,
      edit: false,
      remove: false,
      freeze: {
        label: "冻结",
        tone: "danger",
        action: (row) => {
          actionHint.value = \`freeze:\${String(row.id)}\`;
        },
      },
    })}
    caps={{ create: false }}
    renderCell={{
      name: (row) => (
        <b data-testid="demo-custom-name">{String(row.name)}</b>
      ),
    }}
    toolbar={{
      notify: {
        icon: <IconBell />,
        title: "通知",
        label: "通知",
        tone: "primary",
        action: () => {
          actionHint.value = "tb:notify";
        },
      },
    }}
  />
  <p class="text-xs text-slate-500" data-testid="demo-custom-hint">
    {() => actionHint.value ||
      "点工具栏通知图标或行内「冻结」直接跑 action（确认请在 action 自管）"}
  </p>
</div>
`;

/** 单个示例块 */

/** 修改密码表单：与 DataPanel 新增密码字段同一套 FieldRule（必填、6～64 位、两次一致） */
const PWD_FORM: FormField[] = [
  {
    prop: "password",
    type: "password",
    label: "密码",
    rules: [
      { required: true, message: "密码不能为空" },
      { min: 6, max: 64, message: "密码长度 6–64 位" },
    ],
  },
  {
    prop: "confirmPassword",
    type: "password",
    label: "确认密码",
    rules: [
      { required: true, message: "确认密码不能为空" },
      {
        validator: (value, values) =>
          value === values.password ? true : "两次密码不一致",
      },
    ],
  },
];

/** validateForm 回落文案（规则上已写中文 message，一般不会用到） */
const PWD_VALIDATE_MSG = {
  required: "此项必填",
  min: "不能小于 {n}",
  max: "不能大于 {n}",
  patternMismatch: "格式不正确",
};

/** form.render / view.render 示例源码 */
const renderBodyCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { Button } from "@dreamer/ui-view/basic";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(4);

<DataPanel
  panelKey="demo-form-view-render"
  title="自定义主体"
  data={rows}
  columns={columns}
  form={{
    title: (row) => (row.id ? \`编辑 · \${row.name}\` : "新建"),
    render: (ctx) => (
      <div>
        <p>mode={ctx.mode}</p>
        <Button type="button" onClick={() => ctx.close()}>关闭</Button>
      </div>
    ),
  }}
  view={{
    title: (row) => \`详情 · \${row.name}\`,
    render: (ctx) => <div>自定义：{String(ctx.row.name)}</div>,
    actions: { close: true },
  }}
/>
`;

/** FormField.render 示例源码（自定义字段用官方 Input／Password） */
const renderFieldCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { Input } from "@dreamer/ui-view/form/input";
import { Password } from "@dreamer/ui-view/form/password";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(3);

<DataPanel
  panelKey="demo-field-render"
  title="字段级自定义"
  data={rows}
  columns={columns}
  form={{
    props: [
      { prop: "name", label: "姓名", required: true },
      {
        prop: "email",
        label: "邮箱（自定义）",
        render: (ctx) => (
          <Input
            type="email"
            class="w-full"
            value={ctx.value}
            disabled={ctx.disabled}
            placeholder="自定义 email 输入"
          />
        ),
      },
      {
        prop: "password",
        label: "密码",
        type: "password",
        render: (ctx) => (
          <Password
            class="w-full"
            value={ctx.value}
            disabled={ctx.disabled}
            showStrength
            newPassword
            placeholder="请输入密码"
          />
        ),
      },
    ],
  }}
/>
`;

const viewCode = `import { createSignal } from "@dreamer/view";
import { Button } from "@dreamer/ui-view/basic";
import { DataPanel, validateForm } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Password } from "@dreamer/ui-view/form/password";
import { Modal, toast } from "@dreamer/ui-view/feedback";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(8);

const PWD_FORM: FormField[] = [
  {
    prop: "password",
    type: "password",
    label: "密码",
    rules: [
      { required: true, message: "密码不能为空" },
      { min: 6, max: 64, message: "密码长度 6–64 位" },
    ],
  },
  {
    prop: "confirmPassword",
    type: "password",
    label: "确认密码",
    rules: [
      { required: true, message: "确认密码不能为空" },
      {
        validator: (value, values) =>
          value === values.password ? true : "两次密码不一致",
      },
    ],
  },
];
const PWD_VALIDATE_MSG = {
  required: "此项必填",
  min: "不能小于 {n}",
  max: "不能大于 {n}",
  patternMismatch: "格式不正确",
};

const pwd = createSignal<Row | null>(null);
const password = createSignal("");
const confirmPassword = createSignal("");
const pwdErrors = createSignal<Record<string, string>>({});
const openPwd = (row: Row) => {
  pwd.value = row;
  password.value = "";
  confirmPassword.value = "";
  pwdErrors.value = {};
};
const closePwd = () => {
  pwd.value = null;
  password.value = "";
  confirmPassword.value = "";
  pwdErrors.value = {};
};
const submitPwd = () => {
  const errs = validateForm(
    PWD_FORM,
    { password: password.value, confirmPassword: confirmPassword.value },
    false,
    PWD_VALIDATE_MSG,
  );
  if (Object.keys(errs).length) {
    pwdErrors.value = errs;
    return;
  }
  closePwd();
  toast.success("密码已修改");
};

<div data-testid="demo-view">
  <DataPanel
    panelKey="demo-view"
    title="用户管理"
    data={rows}
    columns={withRowActions({
      view: true,
      edit: false,
      remove: false,
    })}
    view={{
      title: (row) => \`详情 · \${String(row.name ?? "")}\`,
      labelColPercent: 28,
      labelMinWidth: "7rem",
      props: [
        { prop: "name", label: "姓名" },
        { prop: "email", label: "邮箱" },
        {
          prop: "status",
          label: "状态",
          type: "tag",
          options: [
            { value: "active", label: "启用", tone: "success" },
            { value: "disabled", label: "停用" },
          ],
          click: "toggle",
        },
        {
          prop: "createdAt",
          label: "创建时间",
          type: "datetime",
          format: "YYYY-MM-DD HH:mm",
        },
      ],
      actions: {
        password: {
          label: "密码",
          action: (row) => openPwd(row),
        },
        site: { label: "主页", href: (row) => \`/u/\${row.id}\` },
        close: true,
      },
    }}
    caps={{
      create: false,
      update: false,
      remove: false,
      import: false,
      export: false,
      print: false,
      columns: false,
      density: false,
      fullscreen: false,
      copy: false,
    }}
  >
    <Modal
      open={() => pwd.value !== null}
      title="修改密码"
      width="xs"
      keyboard
      destroyOnClose
      onClose={closePwd}
      footer={
        <>
          <Button
            type="button"
            variant="primary"
            data-testid="demo-view-pwd-submit"
            onClick={submitPwd}
          >
            确定
          </Button>
          <Button
            type="button"
            variant="default"
            data-testid="demo-view-pwd-cancel"
            onClick={closePwd}
          >
            取消
          </Button>
        </>
      }
    >
      {() => (
        <Form class="w-full" onSubmit={submitPwd}>
          <FormItem
            class="w-full"
            label="密码"
            required
            id="demo-view-pwd"
            error={pwdErrors.value.password}
          >
            <Password
              id="demo-view-pwd"
              class="w-full"
              value={password}
              newPassword
              autoComplete
              placeholder="请输入密码"
            />
          </FormItem>
          <FormItem
            class="w-full"
            label="确认密码"
            required
            id="demo-view-pwd-confirm"
            error={pwdErrors.value.confirmPassword}
          >
            <Password
              id="demo-view-pwd-confirm"
              class="w-full"
              value={confirmPassword}
              newPassword
              autoComplete
              placeholder="请再次输入密码"
            />
          </FormItem>
        </Form>
      )}
    </Modal>
  </DataPanel>
</div>
`;

const rowClickViewCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

${WITH_ROW_ACTIONS_CODE}

const rows = makeDemoRows(8);

<DataPanel
  panelKey="demo-row-click-view"
  title="点击行打开详情"
  syncUrl={false}
  data={rows}
  columns={withRowActions({
    view: true,
    edit: false,
    remove: false,
  })}
  openViewOnRowClick
  caps={{
    create: false,
    update: false,
    remove: false,
    import: false,
    export: false,
    print: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

const exampleDemo = `import { DataPanel } from "@dreamer/ui-view/data-display";

const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "role", label: "角色", type: "tag", align: "center", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "editor", label: "编辑", tone: "info" },
    { value: "viewer", label: "访客" },
  ] },
  { prop: "status", label: "状态", type: "tag", inline: "switch", align: "center", options: [
    { value: "active", label: "启用", tone: "success" },
    { value: "disabled", label: "停用", tone: "warning" },
  ] },
  { prop: "balance", label: "余额", type: "money", sortable: true, total: true, align: "right" },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];
const search = {
  props: [
  { prop: "name" },
  { prop: "role", type: "select" },
  { prop: "status", type: "select" },
  ],
};
const form = {
  props: [
  { prop: "name", required: true },
  { prop: "email", required: true, pattern: "^[^@\\s]+@[^@\\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

<DataPanel
  title="用户管理"
  panelKey="users"
  data={rows}
  columns={columns}
  search={search}
  form={form}
/>`;

const schemasFullCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${MAKE_DEMO_ROWS_CODE}

${DEMO_COLUMNS_CODE}

${DEMO_SEARCH_CODE}

${DEMO_FORM_RICH_CODE}

const rows = makeDemoRows(8);

<DataPanel
  panelKey="demo-schemas-full"
  title="用户管理"
  data={rows}
  columns={columns}
  search={{ title: "筛选用户", props: search }}
  form={{
    title: (row) =>
      row.id ? \`修改 · \${String(row.name ?? "")}\` : "添加用户",
    props: form,
  }}
  view={{
    title: (row) => \`详情 · \${String(row.name ?? "")}\`,
    props: [
      { prop: "name", label: "姓名" },
      { prop: "email", label: "邮箱" },
      { prop: "balance", label: "余额" },
    ],
  }}
  caps={{
    import: false,
    export: false,
    print: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

function readDemoTab() {
  try {
    const k = new URLSearchParams(globalThis.location?.search ?? "").get("tab");
    return k === "admin" || k === "stats" || k === "all" ? k : "all";
  } catch {
    return "all";
  }
}

function DataPanelTabsDemo() {
  const tab = createSignal(readDemoTab());
  const rows = makeDemoRows(8);
  const adminCount = rows.filter((r) => r.role === "admin").length;
  return () => {
    const key = tab.value;
    const data = key === "admin"
      ? rows.filter((r) => r.role === "admin")
      : rows;
    return (
      <DataPanel
        panelKey="demo-tabs"
        title="用户管理"
        data={data}
        columns={DEMO_COLUMNS}
        search={{ props: DEMO_SEARCH }}
        form={{ props: DEMO_FORM }}
        exportName="users"
        activeTab={key}
        onTabChange={(k) => {
          tab.value = k;
        }}
        tabs={[
          { key: "all", label: "全部" },
          { key: "admin", label: "管理员" },
          {
            key: "stats",
            label: "统计",
            children: (
              <div class="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">
                当前共 {rows.length} 人，其中管理员 {adminCount} 人。
              </div>
            ),
          },
        ]}
      />
    );
  };
}

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
const alertCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, Row } from "@dreamer/ui-view/data-display";
import { toast } from "@dreamer/ui-view/feedback";

const rows: Row[] = [
  { id: "1", name: "张三" },
  { id: "2", name: "李四" },
  { id: "3", name: "王五" },
];

const columns: Column[] = [
  { prop: "name", label: "姓名" },
];

<DataPanel
  panelKey="demo-alert"
  title="用户管理"
  data={rows}
  columns={columns}
  alert={{
    type: "warning",
    message: "请先完成实名认证",
    description: "未认证账号部分功能暂不可用。",
    onClose: () => toast.info("已关闭提示"),
  }}
  toolbar={{
    create: false,
    search: false,
    print: false,
    import: false,
    export: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>
`;

export const metadata = {
  title: "DataPanel 数据面板 · ui-view",
};

const batchBarCode = `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { toast } from "@dreamer/ui-view/feedback";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(10);

<DataPanel
  panelKey="demo-batch-bar"
  title="可配批量条"
  syncUrl={false}
  data={rows}
  columns={columns}
  form={{ props: form }}
  batchBar={{
    exportSelected: {
      label: "导出选中",
      disable: ({ selected }) => selected.length === 0,
      action: ({ selected }) => {
        toast.info(\`导出 \${selected.length} 条\`);
      },
    },
  }}
  toolbar={{
    export: {
      disable: ({ selected }) => selected.length === 0,
      action: ({ selected, query }) => {
        toast.info(\`导出选中 \${selected.length} 条，当前页 \${query.page}\`);
      },
    },
  }}
/>
`;

const searchAdvCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";
import { Input } from "@dreamer/ui-view/form/input";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(25);
const advancedSearch = {
  title: "高级筛选",
  props: [
    { prop: "name", placeholder: "姓名关键字" },
    { prop: "role", type: "multiselect" },
    { prop: "status", type: "select" },
    { prop: "score", type: "number", label: "积分", match: "num" },
    { prop: "createdAt", type: "datetime", label: "创建时间", match: "from" },
    {
      prop: "memo",
      label: "备注",
      render: (ctx) => (
        <Input class="w-full" value={ctx.value} placeholder="自定义备注" />
      ),
    },
  ],
  actions: {
    submit: true,
    reset: true,
  },
};

<DataPanel
  panelKey="demo-search-adv"
  title="高级搜索"
  syncUrl={false}
  data={rows}
  columns={columns}
  search={advancedSearch}
/>
`;

const formCondCode =
  `import { DataPanel, openDataPanelForm } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${MAKE_DEMO_ROWS_CODE}

${DEMO_COLUMNS_CODE}

const rows = makeDemoRows(8);
const form = {
  props: [
    { prop: "name", required: true, placeholder: "请输入姓名" },
    {
      prop: "role",
      type: "select",
      required: true,
      initial: "viewer",
    },
    {
      prop: "email",
      required: true,
      pattern: "^[^@\\\\s]+@[^@\\\\s]+$",
      disabled: ({ values }) => values.role === "viewer",
      hint: "访客账号不可改邮箱",
    },
    {
      prop: "score",
      type: "number",
      show: ({ values }) => values.role === "admin",
      hint: "仅管理员显示积分",
    },
    { prop: "balance", type: "number", min: 0, initial: 0 },
    { prop: "status", type: "switch", initial: "active" },
  ],
  actions: {
    saveMore: {
      label: "保存并继续",
      action: async (ctx) => {
        await ctx.submit();
        openDataPanelForm("demo-form-cond");
      },
    },
    submit: true,
    cancel: true,
  },
};

<DataPanel
  panelKey="demo-form-cond"
  title="表单条件"
  syncUrl={false}
  data={rows}
  columns={columns}
  form={form}
/>
`;

const handlesCode = `import {
  DataPanel,
  getDataPanelQuery,
  getDataPanelSelected,
  openDataPanelForm,
  openDataPanelView,
  refreshDataPanel,
  setDataPanelQuery,
} from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

const rows = makeDemoRows(8);

<DataPanel
  panelKey="demo-handles"
  title="命令式 API"
  syncUrl={false}
  data={rows}
  columns={columns}
  search={{ props: search }}
  form={{ props: form }}
/>

setDataPanelQuery("demo-handles", { filters: { role: "admin" }, page: 1 });
openDataPanelForm("demo-handles");
openDataPanelView("demo-handles", "1");
refreshDataPanel("demo-handles");
getDataPanelQuery("demo-handles");
getDataPanelSelected("demo-handles");
`;

export default function DataDisplayDataPanel() {
  const remote: DataSource = createRemoteDemoSource(300);
  const cellSource: DataSource = createCellDemoSource();
  const actionHint = createSignal("");
  const handleHint = createSignal("");
  const pwd = createSignal<Row | null>(null);
  const password = createSignal("");
  const confirmPassword = createSignal("");
  const pwdErrors = createSignal<Record<string, string>>({});
  const openPwd = (row: Row) => {
    pwd.value = row;
    password.value = "";
    confirmPassword.value = "";
    pwdErrors.value = {};
  };
  const closePwd = () => {
    pwd.value = null;
    password.value = "";
    confirmPassword.value = "";
    pwdErrors.value = {};
  };
  const submitPwd = () => {
    const errs = validateForm(
      PWD_FORM,
      { password: password.value, confirmPassword: confirmPassword.value },
      false,
      PWD_VALIDATE_MSG,
    );
    if (Object.keys(errs).length) {
      pwdErrors.value = errs;
      return;
    }
    closePwd();
    toast.success("密码已修改");
  };
  /** Simulated admin perms + page flags (toggle in demo-can). */
  const perms = createSignal<DemoPerms>({
    "demo.view": true,
    "demo.write": false,
  });
  const pageExport = createSignal(true);
  const pageAllowAudit = createSignal(true);
  const can = (code: keyof DemoPerms) => demoCan(perms.value, code);
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>DataPanel 数据面板</Title>
        <Paragraph class="mt-2">
          一块完整的列表管理面板：工具栏按钮组（添加 / 搜索 / 刷新 / 打印 / 导入
          / 导出 / 列设置 / 行高 / 全屏 / 复制，
          相邻按钮之间只有一条淡分割线）、搜索
          Modal（工具栏按钮打开）、表格下方的批量操作条、表格（排序、多选、行内编辑、合计、操作列）、
          分页，以及用 Modal 的新增 / 编辑 / 查看。可用 <code>alert</code>{" "}
          在工具栏下方、表格上方放一条页面提示（支持关闭与 onClose）。<strong>
            任何删除都必须先确认：行内／批量删除均弹出小气泡
            Popconfirm（确定在左、取消在右；点外部也会关闭），不用 Modal
            确认对话框
          </strong>。 支持原生 xlsx 导出／导入（零依赖），支持浅色 / 深色主题与
          zh-CN / en-US。数据通过 <code>data</code> 或 <code>dataSource</code>
          {" "}
          注入，与后端无关。工具栏／操作列用统合 <code>toolbar</code>／
          <code>columns</code> 里 <code>type:&quot;actions&quot;</code> 的{" "}
          <code>actions</code> Record（写入序＝显示序；自定义键必须
          <code>action</code>；已废止 <code>extra</code>／<code>order</code>）。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
        <CodeBlock
          title="列定义"
          code={columnsCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>

      <section class="flex flex-col gap-10">
        <Title level={2}>示例</Title>

        <DocsDemo title="基础用法（全部功能）" code={basicCode}>
          <DataPanel
            panelKey="demo-basic"
            title="用户管理"
            data={makeDemoRows(25)}
            columns={DEMO_COLUMNS}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
            exportName="users"
          />
        </DocsDemo>

        <DocsDemo title="页面提示条" code={alertCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            提示条在工具栏下方、表格上方。对象配置可写 Alert
            的全部参数；默认可关闭，点关闭会隐藏并触发 <code>onClose</code>。
          </Paragraph>
          <DataPanel
            panelKey="demo-alert"
            title="用户管理"
            data={[
              { id: "1", name: "张三" },
              { id: "2", name: "李四" },
              { id: "3", name: "王五" },
            ]}
            columns={[{ prop: "name", label: "姓名" }]}
            alert={{
              type: "warning",
              message: "请先完成实名认证",
              description: "未认证账号部分功能暂不可用。",
              onClose: () => toast.info("已关闭提示"),
            }}
            toolbar={{
              create: false,
              search: false,
              print: false,
              import: false,
              export: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>

        <DocsDemo
          title="列对齐（align / headerAlign）"
          code={`import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, Row } from "@dreamer/ui-view/data-display";

${MAKE_DEMO_ROWS_CODE}

${ALIGN_DEMO_COLUMNS_CODE}

${DEMO_HIDE_CHROME_CODE}

const rows = makeDemoRows(8);

<DataPanel
  panelKey="demo-align"
  title="列对齐"
  data={rows}
  columns={columns}
  caps={{ create: false }}
  toolbar={{
    create: false,
    search: false,
    refresh: false,
    ...hideChrome,
  }}
/>`}
        >
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            <code>align</code> 控制单元格（含合计行，默认居中）；
            <code>headerAlign</code> 控制表头（不传则跟{" "}
            <code>align</code>）。多选／序号／操作列固定居中，无需配置。
          </Paragraph>
          <DataPanel
            panelKey="demo-align"
            title="列对齐"
            data={makeDemoRows(8)}
            columns={ALIGN_DEMO_COLUMNS}
            caps={{ create: false }}
            toolbar={{
              create: false,
              search: false,
              refresh: false,
              ...DEMO_HIDE_CHROME,
            }}
          />
        </DocsDemo>

        <DocsDemo title="搜索表单（Modal）" code={searchCode}>
          <DataPanel
            panelKey="demo-search"
            title="搜索表单"
            data={makeDemoRows(25)}
            columns={DEMO_COLUMNS.map((c) =>
              c.prop === "status" ? { ...c, inline: undefined } : c
            )}
            search={{ title: "筛选条件", props: DEMO_SEARCH }}
            initialQuery={{ filters: { role: "admin" } }}
            caps={{ create: false }}
          />
        </DocsDemo>

        <DocsDemo title="工具栏搜索 ↔ 地址栏" code={syncUrlCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            分页（<code class="text-xs">page</code>／<code class="text-xs">
              pageSize
            </code>）与排序默认与地址栏双向同步，无需开关；配置了{" "}
            <code class="text-xs">search</code>{" "}
            后搜索字段一并写入。点工具栏搜索、提交或改分页／排序，地址栏自动
            {" "}
            <code class="text-xs">replaceState</code> 为{" "}
            <code class="text-xs">?name=…&amp;role=…&amp;page=…</code>
            ；硬刷或打开带 query 的链接会回填。空值删 key；fixed 永不进 URL。
            同页多面板或抽屉里不想抢地址栏时设{" "}
            <code class="text-xs">syncUrl=&#123;false&#125;</code>
            ；需要隔离参数时用{" "}
            <code class="text-xs">
              syncUrl=&#123;&#123; prefix: "u" &#125;&#125;
            </code>
            ，查询键变成 <code class="text-xs">u_page</code>、
            <code class="text-xs">u_name</code> 等。
          </Paragraph>
          <div data-testid="demo-sync-url">
            <DataPanel
              panelKey="demo-sync-url"
              title="用户管理"
              data={makeDemoRows(25)}
              columns={DEMO_COLUMNS}
              search={{ props: DEMO_SEARCH }}
              form={{ props: DEMO_FORM }}
            />
          </div>
        </DocsDemo>

        <DocsDemo
          title="表格：排序 / 合计 / 行内编辑 / 隐藏列"
          code={tableCode}
        >
          <DataPanel
            panelKey="demo-table"
            title="表格功能"
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            defaultSort={{ prop: "balance", order: "desc" }}
            form={{ props: DEMO_FORM }}
            caps={{ create: false, remove: false }}
          />
        </DocsDemo>

        <DocsDemo
          title="列显示函数（value／color／formatter → 任意节点）"
          code={colFnCode}
        >
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            声明式 <code class="text-xs">options</code> 仍可用；复杂按行逻辑用
            {" "}
            <code class="text-xs">value(row)</code>／
            <code class="text-xs">color(row)</code>／
            <code class="text-xs">formatter(row, raw)</code>
            。返回值可为 string、JSX／span、Icon 组件，或以{" "}
            <code class="text-xs">&lt;</code>{" "}
            开头的可信 HTML 字符串。 拼接列可不写{" "}
            <code class="text-xs">prop</code>
            ，用 <code class="text-xs">formatter</code> 组合字段；要排序时加
            {" "}
            <code class="text-xs">sortProp</code>
            （如姓在前则{" "}
            <code class="text-xs">sortProp: &quot;lastName&quot;</code>
            ）。 另：<code class="text-xs">form</code>／
            <code class="text-xs">search</code>／
            <code class="text-xs">view</code> 一律写成{" "}
            <code class="text-xs">{"{ title, props }"}</code>
            ；<code class="text-xs">title</code> 为弹层标题（form／view 为{" "}
            <code class="text-xs">string | (row)=&gt;string</code>；search 为
            {" "}
            <code class="text-xs">string | ()=&gt;string</code>），
            <code class="text-xs">props</code> 与列同一套字段配置。
          </Paragraph>
          <DataPanel
            panelKey="demo-col-fn"
            title="列函数显示"
            data={colFnRows}
            columns={colFnColumns}
            search={{ title: "筛选用户", props: [{ prop: "name" }] }}
            form={{
              title: (row) =>
                row.id ? `修改 · ${String(row.name ?? "")}` : "添加用户",
              props: [
                { prop: "name", required: true },
                { prop: "flag", type: "number", initial: 0 },
                { prop: "level", type: "number", initial: 0 },
              ],
            }}
            view={{
              title: (row) => `详情 · ${String(row.name ?? "")}`,
              props: [
                { prop: "name", label: "姓名" },
                {
                  prop: "flag",
                  label: "标记",
                  value: (row) => row.flag === 1 ? "开启" : "关闭",
                },
                { prop: "level", label: "级别" },
              ],
            }}
            caps={{
              create: true,
              update: true,
              view: true,
              remove: false,
              import: false,
              export: false,
              print: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>

        <DocsDemo title="拼接列" code={joinNameCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            可不写 <code class="text-xs">prop</code>
            ，用 <code class="text-xs">formatter</code>{" "}
            把多个字段拼成一列。排序写 <code class="text-xs">sortProp</code>
            ，这里姓名按前面的姓排。
          </Paragraph>
          <DataPanel
            panelKey="demo-join-name"
            title="拼接列"
            data={joinNameRows}
            columns={joinNameColumns}
            caps={{
              create: false,
              update: false,
              view: false,
              remove: false,
              import: false,
              export: false,
              print: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>

        <DocsDemo title="单元格编辑" code={cellCode}>
          <p class="mb-2 text-sm text-slate-600 dark:text-slate-300">
            <code>
              inline
            </code>＝列内就地编辑（双击进入编辑），区别于工具栏／行操作打开的
            {" "}
            <code>form</code> Modal。
          </p>
          <label class="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="cell-demo-fail"
              onChange={(e: Event) => {
                cellDemoState.fail =
                  (e.target as unknown as { checked: boolean }).checked;
              }}
            />
            模拟保存失败（勾选后再编辑：提示错误并保持原值）
          </label>
          <DataPanel
            panelKey="demo-cell"
            title="单元格编辑"
            dataSource={cellSource}
            columns={CELL_COLUMNS}
            form={{ props: CELL_FORM }}
            caps={{
              create: false,
              remove: false,
              import: false,
              export: false,
              print: false,
              columns: false,
            }}
          />
        </DocsDemo>

        <DocsDemo title="新增 / 编辑 Modal 与删除确认" code={crudCode}>
          <DataPanel
            panelKey="demo-crud"
            title="CRUD"
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
          />
        </DocsDemo>

        <DocsDemo title="批量操作" code={batchCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            勾选后默认只出现批量删除和取消勾选，不必把这两项写进{" "}
            <code class="text-xs">batchBar</code>
            。若要别的批量操作，用自定义键自行编写{" "}
            <code class="text-xs">action</code>。
          </Paragraph>
          <DataPanel
            panelKey="demo-batch"
            title="批量操作"
            data={makeDemoRows(10)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
          />
        </DocsDemo>

        <DocsDemo title="分页" code={pageCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            翻到第 N 页时地址栏出现 <code class="text-xs">page=N</code>
            ；改每页条数写 <code class="text-xs">pageSize</code>
            （与默认相同时省略）。带 query 进入会回填页码／条数。
          </Paragraph>
          <DataPanel
            panelKey="demo-page"
            title="分页"
            data={makeDemoRows(40)}
            columns={DEMO_COLUMNS}
            pageSize={5}
            pageSizes={[5, 10, 20]}
            caps={{ create: false }}
          />
        </DocsDemo>

        <DocsDemo
          title="导出 xlsx / csv / json / xml / html 与导入 xlsx / csv / json / xml"
          code={exportCode}
        >
          <DataPanel
            panelKey="demo-export"
            title="导出导入"
            data={makeDemoRows(15)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
            exportName="users"
          />
        </DocsDemo>

        <DocsDemo
          title="远程 dataSource（list + fetch 后台 API）"
          code={remoteCode}
        >
          <Paragraph class="mb-2 text-sm text-slate-600 dark:text-slate-400">
            前端：<code class="text-xs">list</code>+
            <code class="text-xs">fetch</code> 拼 query，返回{" "}
            <code class="text-xs">{"{ rows, total }"}</code>，
            <code class="text-xs">sync: false</code>。 下方面板为内存异步模拟。
          </Paragraph>
          <DataPanel
            panelKey="demo-remote"
            title="远程数据"
            dataSource={remote}
            columns={DEMO_COLUMNS}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
          />
        </DocsDemo>

        <DocsDemo
          title="自动请求列表 · action（baseRoute=/api/users）"
          code={apiActionCode}
        >
          <Paragraph class="mb-2 text-sm text-slate-600 dark:text-slate-400">
            <strong>不传</strong> <code class="text-xs">data</code>／
            <code class="text-xs">dataSource</code>
            。
            <code class="text-xs">baseRoute=&quot;/api/users&quot;</code>
            （≥2 段，不拼 resource）；默认{" "}
            <code class="text-xs">apiMode=&quot;action&quot;</code>
            。假后端<strong>仅内存</strong>：
            <code class="text-xs">docs/src/routes/api/users.ts</code>
            （
            <code class="text-xs">GET</code> 根／
            <code class="text-xs">
              POST …/create｜update｜remove｜remote-batch
            </code>
            ）。
          </Paragraph>
          <DataPanel
            panelKey="demo-api-users-action"
            title="用户（action）"
            baseRoute="/api/users"
            columns={DEMO_COLUMNS}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
            pageSize={20}
          />
        </DocsDemo>

        <DocsDemo
          title="自动请求列表 · restful（baseRoute=/api/orders）"
          code={apiRestfulCode}
        >
          <Paragraph class="mb-2 text-sm text-slate-600 dark:text-slate-400">
            <strong>不传</strong> <code class="text-xs">data</code>／
            <code class="text-xs">dataSource</code>
            。
            <code class="text-xs">baseRoute=&quot;/api/orders&quot;</code>
            ＋
            <code class="text-xs">apiMode=&quot;restful&quot;</code>
            。假后端<strong>仅内存</strong>：
            <code class="text-xs">docs/src/routes/api/orders.ts</code>
            （
            <code class="text-xs">GET/POST</code> 根／
            <code class="text-xs">PUT/DELETE</code>{" "}
            <code class="text-xs">/:id</code>／
            <code class="text-xs">POST …/remote-batch</code>／
            <code class="text-xs">POST …/import</code>
            ）。余额列配置了 <code class="text-xs">total: true</code>
            ，页脚合计由面板对<strong>
              当前页已加载的行
            </strong>自动求和，不会使用接口返回的{" "}
            <code class="text-xs">totals</code>
            。
          </Paragraph>
          <DataPanel
            panelKey="demo-api-orders-restful"
            title="订单（restful）"
            baseRoute="/api/orders"
            apiMode="restful"
            columns={DEMO_COLUMNS}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
            pageSize={20}
          />
        </DocsDemo>

        <DocsDemo
          title="首屏 data + baseRoute（刷新再请求）"
          code={dataBaseRouteCode}
        >
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            同时传 <code class="text-xs">data</code>
            {" 和 "}
            <code class="text-xs">baseRoute</code>
            时，首屏用传入的张三、李四、王五渲染，挂载时不请求接口，刷新浏览器也不会先闪空表。工具栏刷新、翻页、搜索、排序再走
            {" "}
            <code class="text-xs">/api/users</code>
            。总数优先用 <code class="text-xs">initial.total</code>
            ，未传则用 <code class="text-xs">data.length</code>
            ；只传当前页数据时请给出真实总数，不要让面板去猜。
          </Paragraph>
          <DataPanel
            panelKey="demo-data-base-route"
            title="首屏 data + baseRoute"
            syncUrl={false}
            data={[
              {
                id: "1",
                name: "张三",
                email: "zhangsan@example.com",
                role: "admin",
                status: "active",
                balance: 120,
                score: 80,
                createdAt: "2026-11-01T01:00:00.000Z",
              },
              {
                id: "2",
                name: "李四",
                email: "lisi@example.com",
                role: "editor",
                status: "active",
                balance: 80,
                score: 60,
                createdAt: "2026-11-02T02:00:00.000Z",
              },
              {
                id: "3",
                name: "王五",
                email: "wangwu@example.com",
                role: "viewer",
                status: "disabled",
                balance: 40,
                score: 30,
                createdAt: "2026-11-03T03:00:00.000Z",
              },
            ]}
            baseRoute="/api/users"
            columns={DEMO_COLUMNS}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
            pageSize={20}
          />
        </DocsDemo>

        <DocsDemo title="深色主题" code={themeCode}>
          <div class="dark rounded-lg bg-slate-900 p-3">
            <DataPanel
              panelKey="demo-dark"
              title="深色面板"
              data={makeDemoRows(6)}
              columns={DEMO_COLUMNS}
              search={{ props: DEMO_SEARCH }}
              form={{ props: DEMO_FORM }}
            />
          </div>
        </DocsDemo>

        <DocsDemo title="多语言与文案覆盖" code={localeCode}>
          <DataPanel
            panelKey="demo-locale"
            locale="en-US"
            title="Users"
            data={makeDemoRows(6).map((r) => ({ ...r }))}
            columns={DEMO_COLUMNS.map((c) => ({
              ...c,
              label: ({
                name: "Name",
                email: "Email",
                role: "Role",
                status: "Status",
                balance: "Balance",
                score: "Score",
                createdAt: "Created",
              } as Record<string, string>)[c.prop!] ?? c.label,
            }))}
            search={{ props: [{ name: "name", label: "Name" }] }}
            form={{ props: DEMO_FORM.map((f) => ({ ...f })) }}
            messages={{ create: "New" }}
          />
        </DocsDemo>
      </section>

      <section class="flex flex-col gap-10">
        <div class="space-y-2">
          <Title level={2}>工具栏与操作列（统合 Record）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code>toolbar</code> 与操作列 <code>actions</code> 为统合 Record；
            <code>toolbar</code> 设为 <code>false</code>{" "}
            时整栏工具栏不渲染。 键级 <code>true</code>／<code>false</code>{" "}
            简写控显隐；对象可覆盖
            <code>show</code>／<code>disable</code>／<code>icon</code>／<code>
              label
            </code>／<code>title</code>／<code>tone</code>／<code>action</code>
            （默认 show=true、disable=false）。声明项不再用 caps 藏钮；
            <code>undefined</code>（如 capGate allow）才回落 caps。<code>
              title
            </code>{" "}
            可省：不传时内置用 messages、自定义用
            <code>title ?? label ?? 内置 messages ?? key</code>。无{" "}
            <code>label</code> 有
            <code>title</code> 时显示用 <code>title</code>；无{" "}
            <code>title</code> 有 <code>label</code> 时 tip 用
            <code>label</code>。无 <code>confirm</code> 字段：需要确认时在
            <code>action</code> 内自管（内置 remove 仍自带 Popconfirm）。
            <code>tone</code>：对齐 Button 全档{" "}
            <code>
              default|primary|secondary|success|warning|danger|ghost
            </code>（内置 remove 默认 danger）。未知键＝自定义（必须
            <code>action</code>）。写入序＝显示序。已<strong>废止</strong>
            <code>toolbar.extra</code>／<code>order</code>／<code>
              toolbarExtra
            </code>／<code>rowExtra</code>／旧顶层行操作配置 （前导 chrome
            请放面板外）。
          </Paragraph>
        </div>

        <DocsDemo title="toolbar: false 整栏隐藏" code={toolbarOffCode}>
          <DataPanel
            panelKey="demo-toolbar-off"
            title="无工具栏"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
            toolbar={false}
          />
          <p
            class="mt-2 text-xs text-slate-500"
            data-testid="demo-toolbar-off-hint"
          >
            toolbar=false
            时整栏工具栏不出现；表格／分页仍渲染。移动端（≤639.98px）表格卡上／左／右贴边；底栏分页各端均为左右一行（左侧条数、右侧控件）；底栏分页预设与尺寸随断点：电脑端（≥1280px）full／md，平板（640px–1279.98px）default／sm，移动端（≤639.98px）simple／xs，也可用
            pagination 或 paginationPreset 覆盖。
          </p>
        </DocsDemo>

        <DocsDemo
          title="⓪ 默认：省略 show→显示、省略 disable→可点"
          code={defaultsCode}
        >
          <DataPanel
            panelKey="demo-defaults"
            title="声明默认 vs caps"
            data={makeDemoRows(5)}
            columns={withRowActions({
              edit: { disable: true },
            })}
            form={{ props: DEMO_FORM }}
            caps={{
              create: false,
              update: false,
              print: false,
              import: false,
              export: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
            toolbar={{
              create: {},
              refresh: { disable: true },
            }}
          />
          <p
            class="mt-2 text-xs text-slate-500"
            data-testid="demo-defaults-hint"
          >
            caps 关 create／update，但声明项 create 空对象、edit 仅 disable
            仍显示；refresh 禁用仍可见；未声明 view／remove 按 caps。
          </p>
        </DocsDemo>

        <DocsDemo title="① true／false 简写控显隐" code={boolCode}>
          <DataPanel
            panelKey="demo-bool"
            title="true／false 简写"
            data={makeDemoRows(5)}
            columns={withRowActions({
              view: true,
              edit: true,
              remove: false,
            })}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
            toolbar={{
              create: true,
              search: true,
              refresh: true,
              print: false,
              import: false,
              export: false,
            }}
          />
        </DocsDemo>

        <DocsDemo
          title="② toolbar：show／disable 函数（含上下文）"
          code={tbFnCode}
        >
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="demo-tb-fn-toggle"
              onClick={() => {
                pageAllowAudit.value = !pageAllowAudit.value;
              }}
            >
              {() => pageAllowAudit.value
                ? "关闭权限（审计变禁用）"
                : "打开权限（审计可点）"}
            </Button>
            <span class="text-xs text-slate-500" data-testid="demo-tb-fn-flag">
              {() => `pageAllowAudit=${String(pageAllowAudit.value)}`}
            </span>
          </div>
          <DataPanel
            panelKey="demo-tb-fn"
            title="toolbar 函数 show"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
            toolbar={{
              create: true,
              audit: {
                icon: <IconFileSearch />,
                title: "审计",
                label: "审计",
                show: () => true,
                disable: () => !pageAllowAudit.value,
                action: ({ selected }) => {
                  actionHint.value =
                    `toolbar:audit selected=${selected.length}`;
                },
              },
              refresh: true,
              ...DEMO_HIDE_CHROME,
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-tb-fn-hint">
            {() => actionHint.value ||
              "pageAllowAudit=false 时审计仍可见但 disabled"}
          </p>
        </DocsDemo>

        <DocsDemo title="③ 操作列：show／action(item)" code={raFnCode}>
          <DataPanel
            panelKey="demo-ra-fn"
            title="操作列函数"
            data={makeDemoRows(5)}
            columns={withRowActions({
              view: false,
              edit: false,
              remove: false,
              assign: {
                label: "分配",
                show: () => true,
                disable: (item) => !!item.locked,
                action: (item) => {
                  actionHint.value = `row:assign:${String(item.id)}`;
                },
              },
            })}
            caps={{ create: false, update: false, remove: false, view: false }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-ra-fn-hint">
            {() => actionHint.value ||
              "locked 行「分配」仍可见但 disabled；点击看 item.id"}
          </p>
        </DocsDemo>

        <DocsDemo
          title="④a 自定义工具钮（未知 key＋必 action）"
          code={tbCustomCode}
        >
          <DataPanel
            panelKey="demo-tb-custom"
            title="自定义工具钮"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
            toolbar={{
              create: true,
              invite: {
                icon: <IconUserPlus />,
                title: "邀请",
                label: "邀请",
                action: () => {
                  actionHint.value = "toolbar:invite";
                },
              },
              refresh: true,
              ...DEMO_HIDE_CHROME,
            }}
          />
          <p
            class="mt-2 text-xs text-slate-500"
            data-testid="demo-tb-custom-hint"
          >
            {() => actionHint.value || "点击「邀请」"}
          </p>
        </DocsDemo>

        <DocsDemo
          title="④b 自定义操作列（未知 key＋必 action(item)）"
          code={raCustomCode}
        >
          <DataPanel
            panelKey="demo-ra-custom"
            title="自定义操作列"
            data={makeDemoRows(5)}
            columns={withRowActions({
              view: true,
              clone: {
                label: "克隆",
                action: (item) => {
                  actionHint.value = `row:clone:${String(item.id)}`;
                },
              },
              edit: true,
              remove: false,
            })}
            form={{ props: DEMO_FORM }}
          />
          <p
            class="mt-2 text-xs text-slate-500"
            data-testid="demo-ra-custom-hint"
          >
            {() =>
              actionHint.value || "写入序：view → clone → edit（无 remove）"}
          </p>
        </DocsDemo>

        <DocsDemo title="⑤ 写入序＝显示序" code={keyOrderCode}>
          <DataPanel
            panelKey="demo-key-order"
            title="写入序＝显示序"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
            toolbar={{
              create: true,
              audit: {
                icon: <IconFileSearch />,
                title: "审计",
                label: "审计",
                action: () => {
                  actionHint.value = "order:audit";
                },
              },
              refresh: true,
              export: true,
              print: false,
              import: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
          <p
            class="mt-2 text-xs text-slate-500"
            data-testid="demo-key-order-hint"
          >
            工具栏从左到右：添加 → 审计 → 刷新 → 导出（与对象键顺序一致）
          </p>
        </DocsDemo>

        <DocsDemo
          title="⑦ disable：禁用仍可见（≠ show:false）"
          code={enabledCode}
        >
          <DataPanel
            panelKey="demo-enabled"
            title="disable 演示"
            data={makeDemoRows(5)}
            columns={withRowActions({
              view: true,
              edit: { disable: true },
              remove: false,
              assign: {
                label: "分配",
                disable: (item) => !!item.locked,
                action: (item) => {
                  actionHint.value = `disable:assign:${String(item.id)}`;
                },
              },
            })}
            form={{ props: DEMO_FORM }}
            toolbar={{
              create: { disable: true },
              freeze: {
                icon: <IconLock />,
                title: "冻结",
                label: "冻结",
                disable: () => true,
                action: () => {
                  actionHint.value = "should-not-fire";
                },
              },
              refresh: true,
              print: false,
              import: false,
              export: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
          <p
            class="mt-2 text-xs text-slate-500"
            data-testid="demo-enabled-hint"
          >
            添加／冻结／编辑为 disabled 仍可见；locked
            行「分配」禁用。show:false 才会隐藏。
          </p>
        </DocsDemo>

        <DocsDemo
          title="⑧ title 可省：内置 messages／自定义 label??key／显式覆盖"
          code={titleCode}
        >
          <DataPanel
            panelKey="demo-title"
            title="title Tooltip"
            data={makeDemoRows(5)}
            columns={withRowActions({
              view: true,
              edit: { title: "改资料" },
              remove: false,
              assign: {
                label: "分配",
                action: (item) => {
                  actionHint.value = `title:assign:${String(item.id)}`;
                },
              },
            })}
            form={{ props: DEMO_FORM }}
            toolbar={{
              create: true,
              refresh: { title: "立刻刷新" },
              freeze: {
                icon: <IconLock />,
                title: "冻结",
                label: "冻结",
                action: () => {
                  actionHint.value = "title:freeze";
                },
              },
              print: false,
              import: false,
              export: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-title-hint">
            不传 title：内置悬停用 messages／label，自定义悬停用 key（如
            freeze／assign）；传了则覆盖（立刻刷新／改资料）。
          </p>
        </DocsDemo>

        <DocsDemo title="⑥ can()／页面变量控 show（对齐 admin）" code={canCode}>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="demo-can-toggle-write"
              onClick={() => {
                perms.value = {
                  ...perms.value,
                  "demo.write": !perms.value["demo.write"],
                };
              }}
            >
              {() =>
                perms.value["demo.write"]
                  ? "关闭 demo.write"
                  : "打开 demo.write"}
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="demo-can-toggle-export"
              onClick={() => {
                pageExport.value = !pageExport.value;
              }}
            >
              {() => pageExport.value ? "关闭 pageExport" : "打开 pageExport"}
            </Button>
            <span class="text-xs text-slate-500" data-testid="demo-can-flags">
              {() =>
                `write=${String(perms.value["demo.write"])} view=${
                  String(perms.value["demo.view"])
                } pageExport=${String(pageExport.value)}`}
            </span>
          </div>
          <DataPanel
            panelKey="demo-can"
            title="can()／页面变量"
            data={makeDemoRows(5)}
            columns={withRowActions({
              view: demoCapGate(can("demo.view") || can("demo.write")),
              edit: demoCapGate(can("demo.write")),
              remove: demoCapGate(can("demo.write")),
              assign: {
                label: "分配",
                show: () => can("demo.write"),
                action: (item) => {
                  actionHint.value = `can:assign:${String(item.id)}`;
                },
              },
            })}
            form={{ props: DEMO_FORM }}
            search={{ props: DEMO_SEARCH }}
            toolbar={{
              create: demoCapGate(can("demo.write")),
              search: true,
              refresh: true,
              import: demoCapGate(can("demo.write")),
              export: {
                show: () => can("demo.view"),
                disable: () => !pageExport.value,
              },
              print: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-can-hint">
            {() => actionHint.value ||
              "默认 write=false：无创建／导入／编辑／删除／分配；export 受 pageExport＆view 控制"}
          </p>
        </DocsDemo>

        <DocsDemo
          title="tone／tip=label??key（无 confirm 字段／无双轨插槽）"
          code={customCode}
        >
          <div class="flex flex-col gap-2">
            <span
              class="text-sm text-slate-500"
              data-testid="demo-custom-leading"
            >
              面板外提示（原 toolbarExtra 迁此）
            </span>
            <DataPanel
              panelKey="demo-custom"
              title="自定义"
              data={makeDemoRows(5)}
              columns={withRowActions({
                view: false,
                edit: false,
                remove: false,
                freeze: {
                  label: "冻结",
                  tone: "danger",
                  action: (row) => {
                    actionHint.value = `freeze:${String(row.id)}`;
                  },
                },
              })}
              caps={{ create: false }}
              renderCell={{
                name: (row) => (
                  <b data-testid="demo-custom-name">{String(row.name)}</b>
                ),
              }}
              toolbar={{
                notify: {
                  icon: <IconBell />,
                  title: "通知",
                  label: "通知",
                  tone: "primary",
                  action: () => {
                    actionHint.value = "tb:notify";
                  },
                },
              }}
            />
            <p class="text-xs text-slate-500" data-testid="demo-custom-hint">
              {() => actionHint.value ||
                "点工具栏通知图标或行内「冻结」直接跑 action（确认请在 action 自管）"}
            </p>
          </div>
        </DocsDemo>

        <DocsDemo title="查看详情（view）" code={viewCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            <code class="text-xs">view</code> 与{" "}
            <code class="text-xs">form</code>／
            <code class="text-xs">search</code> 一样写成{" "}
            <code class="text-xs">
              {"{ title, props, actions?, width?, fullscreenable?, autoFullscreen?, mobileAutoFullscreen?, column?, size?, bordered?, ... }"}
            </code>
            。Descriptions 的参数（除 items、title）可直接写在 view 上，例如{" "}
            <code class="text-xs">column</code>（本插槽缺省 1）、
            <code class="text-xs">size</code>（缺省 sm）、
            <code class="text-xs">bordered</code>（缺省 true）。标签与内容比例用{" "}
            <code class="text-xs">labelColPercent</code>
            （12～85，缺省 38）和 <code class="text-xs">labelMinWidth</code>
            （电脑端缺省 13.5rem，移动端容器缺省 7rem）设置。<code class="text-xs">title</code>{" "}
            是查看弹窗标题（
            <code class="text-xs">string</code> 或{" "}
            <code class="text-xs">(row)=&gt;string</code>，如{" "}
            <code class="text-xs">{"详情 · ${row.name}"}</code>
            ）；<code class="text-xs">props</code>{" "}
            只放字段，与列同一套配置，缺省从同 prop 列继承；
            <code class="text-xs">click:&quot;toggle&quot;</code>{" "}
            点击状态会切换并写入（走 setField／update，刷新详情和列表）。{" "}
            <code class="text-xs">actions</code>{" "}
            与 title 平级，是底部按钮（与列操作同一套 Record；内置{" "}
            <code class="text-xs">close</code> 默认靠右最后）。 自定义按钮用
            {" "}
            <code class="text-xs">action(row)</code> 打开另一个 Modal（仍放在
            {" "}
            <code class="text-xs">children</code>）， 或{" "}
            <code class="text-xs">href</code>。不写{" "}
            <code class="text-xs">view</code>{" "}
            时仍按列＋表单回落，底部只留关闭。不写{" "}
            <code class="text-xs">view.actions</code>{" "}
            时底部只留关闭。 本示例同时演示<strong>
              三级自定义第 1 级（旁路）
            </strong>：
            <code class="text-xs">actions.password</code> 打开{" "}
            <code class="text-xs">children</code>{" "}
            里的自管 Modal。
            默认点击行不会打开详情，只能点操作列的眼睛；需要点击行打开时设{" "}
            <code class="text-xs">openViewOnRowClick</code>。
          </Paragraph>
          {/* 本例只演示 view；操作列勿挂 edit（未配 form 会打开空增改弹窗） */}
          <div data-testid="demo-view">
            <DataPanel
              panelKey="demo-view"
              title="用户管理"
              data={makeDemoRows(8)}
              columns={withRowActions({
                view: true,
                edit: false,
                remove: false,
              })}
              view={{
                title: (row) => `详情 · ${String(row.name ?? "")}`,
                labelColPercent: 28,
                labelMinWidth: "7rem",
                props: [
                  { prop: "name", label: "姓名" },
                  { prop: "email", label: "邮箱" },
                  {
                    prop: "status",
                    label: "状态",
                    type: "tag",
                    options: [
                      { value: "active", label: "启用", tone: "success" },
                      { value: "disabled", label: "停用" },
                    ],
                    click: "toggle",
                  },
                  {
                    prop: "createdAt",
                    label: "创建时间",
                    type: "datetime",
                    format: "YYYY-MM-DD HH:mm",
                  },
                ],
                actions: {
                  password: {
                    label: "密码",
                    action: (row) => openPwd(row),
                  },
                  site: { label: "主页", href: (row) => `/u/${row.id}` },
                  close: true,
                },
              }}
              caps={{
                create: false,
                update: false,
                remove: false,
                import: false,
                export: false,
                print: false,
                columns: false,
                density: false,
                fullscreen: false,
                copy: false,
              }}
            >
              <Modal
                open={() => pwd.value !== null}
                title="修改密码"
                width="xs"
                keyboard
                destroyOnClose
                onClose={closePwd}
                footer={
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      data-testid="demo-view-pwd-submit"
                      onClick={submitPwd}
                    >
                      确定
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      data-testid="demo-view-pwd-cancel"
                      onClick={closePwd}
                    >
                      取消
                    </Button>
                  </>
                }
              >
                {() => (
                  <Form class="w-full" onSubmit={submitPwd}>
                    <FormItem
                      class="w-full"
                      label="密码"
                      required
                      id="demo-view-pwd"
                      error={pwdErrors.value.password}
                    >
                      <Password
                        id="demo-view-pwd"
                        class="w-full"
                        value={password}
                        newPassword
                        autoComplete
                        placeholder="请输入密码"
                      />
                    </FormItem>
                    <FormItem
                      class="w-full"
                      label="确认密码"
                      required
                      id="demo-view-pwd-confirm"
                      error={pwdErrors.value.confirmPassword}
                    >
                      <Password
                        id="demo-view-pwd-confirm"
                        class="w-full"
                        value={confirmPassword}
                        newPassword
                        autoComplete
                        placeholder="请再次输入密码"
                      />
                    </FormItem>
                  </Form>
                )}
              </Modal>
            </DataPanel>
          </div>
        </DocsDemo>

        <DocsDemo
          title="点击行打开详情（openViewOnRowClick）"
          code={rowClickViewCode}
        >
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            默认关闭：点击行不会打开详情，只能点操作列的眼睛。设{" "}
            <code class="text-xs">openViewOnRowClick</code>{" "}
            后，点击行（避开勾选、按钮、链接）也会打开详情；行内编辑、排序和链接不受影响。
          </Paragraph>
          <DataPanel
            panelKey="demo-row-click-view"
            title="点击行打开详情"
            syncUrl={false}
            data={makeDemoRows(8)}
            columns={withRowActions({
              view: true,
              edit: false,
              remove: false,
            })}
            openViewOnRowClick
            caps={{
              create: false,
              update: false,
              remove: false,
              import: false,
              export: false,
              print: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>

        <DocsDemo
          title="自定义扩展：form.render / view.render"
          code={renderBodyCode}
        >
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            <strong>第 2 级</strong>：
            <code class="text-xs">form.render</code>{" "}
            整段替换增改主体（含确定／取消）；
            <code class="text-xs">view.render</code>{" "}
            替换详情字段区，底脚 actions 仍由面板渲染。有 body{" "}
            <code class="text-xs">render</code> 时字段级{" "}
            <code class="text-xs">render</code> 无效。
          </Paragraph>
          <div data-testid="demo-form-view-render">
            <DataPanel
              panelKey="demo-form-view-render"
              title="自定义主体"
              data={makeDemoRows(4)}
              columns={withRowActions({
                view: true,
                edit: true,
                remove: false,
              })}
              form={{
                title: (row) => row.id
                  ? `自定义编辑 · ${String(row.name ?? "")}`
                  : "自定义新建",
                render: (ctx) => (
                  <div class="space-y-3" data-testid="demo-form-render-body">
                    <p class="m-0 text-sm text-slate-600 dark:text-slate-400">
                      mode={ctx.mode}
                      {ctx.row
                        ? ` · row=${String(ctx.row.name ?? "")}`
                        : " · 无行"}
                    </p>
                    <div class="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        data-testid="demo-form-render-close"
                        onClick={() =>
                          ctx.close()}
                      >
                        关闭
                      </Button>
                    </div>
                  </div>
                ),
              }}
              view={{
                title: (row) => `自定义详情 · ${String(row.name ?? "")}`,
                render: (ctx) => (
                  <div
                    class="rounded-lg border border-dashed border-slate-300 p-4 text-sm dark:border-slate-600"
                    data-testid="demo-view-render-body"
                  >
                    自定义详情：{String(ctx.row.name ?? "")} /{" "}
                    {String(ctx.row.email ?? "")}
                  </div>
                ),
                actions: { close: true },
              }}
              caps={{
                create: true,
                update: true,
                remove: false,
                import: false,
                export: false,
                print: false,
                columns: false,
                density: false,
                fullscreen: false,
                copy: false,
              }}
            />
          </div>
        </DocsDemo>

        <DocsDemo
          title="自定义扩展：FormField.render"
          code={renderFieldCode}
        >
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            <strong>第 3 级</strong>：无{" "}
            <code class="text-xs">form.render</code> 时，单个字段可用{" "}
            <code class="text-xs">FormField.render</code>{" "}
            替换控件；其余字段仍走内置。
          </Paragraph>
          <div data-testid="demo-field-render">
            <DataPanel
              panelKey="demo-field-render"
              title="字段级自定义"
              data={makeDemoRows(3)}
              columns={withRowActions({
                view: false,
                edit: true,
                remove: false,
              })}
              form={{
                title: "编辑 · 字段 render",
                props: [
                  { prop: "name", label: "姓名", required: true },
                  {
                    prop: "email",
                    label: "邮箱（自定义）",
                    render: (ctx) => (
                      <div
                        class="w-full"
                        data-testid="demo-field-render-email"
                      >
                        <Input
                          type="email"
                          class="w-full"
                          value={ctx.value}
                          disabled={ctx.disabled}
                          placeholder="自定义 email 输入"
                        />
                      </div>
                    ),
                  },
                  {
                    prop: "password",
                    label: "密码",
                    type: "password",
                    render: (ctx) => (
                      <div
                        class="w-full"
                        data-testid="demo-field-render-password"
                      >
                        <Password
                          class="w-full"
                          value={ctx.value}
                          disabled={ctx.disabled}
                          showStrength
                          newPassword
                          placeholder="请输入密码"
                        />
                      </div>
                    ),
                  },
                ],
              }}
              caps={{
                create: false,
                update: true,
                remove: false,
                import: false,
                export: false,
                print: false,
                columns: false,
                density: false,
                fullscreen: false,
                copy: false,
              }}
            />
          </div>
        </DocsDemo>
      </section>

      <section class="flex flex-col gap-6">
        <Title level={2}>完整示例</Title>
        <CodeBlock
          title="代码示例"
          code={exampleDemo}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>

      <section class="flex flex-col gap-6">
        <Title level={2}>参数写法总览</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          下列示例把 <code class="text-xs">form</code>／
          <code class="text-xs">search</code>／
          <code class="text-xs">view</code> 的{" "}
          <code class="text-xs">{"{ title, props }"}</code>、
          <code class="text-xs">rules</code>／message／placeholder／hint、
          span／cols／width／min／max／maxlength、以及列
          <code class="text-xs">value</code>／
          <code class="text-xs">color</code>／
          <code class="text-xs">formatter</code>（可返回 Icon／span／JSX／可信
          HTML）、
          <code class="text-xs">format</code>（date／datetime）、
          <code class="text-xs">type:"selection"</code>／
          <code class="text-xs">type:"index"</code>／
          <code class="text-xs">type:"actions"</code>
          （系统列可省 prop／label；操作配置写在{" "}
          <code class="text-xs">actions</code>） 写在同一份本地定义里（含{" "}
          <code class="text-xs">rows</code>）。服务端场景可去掉{" "}
          <code class="text-xs">data</code>，改用{" "}
          <code class="text-xs">dataSource</code>＋
          <code class="text-xs">initial</code>。
        </Paragraph>
        <CodeBlock
          title="完整本地示例（含 rows）"
          code={schemasFullCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
        <DocsDemo
          title="校验／尺寸／标题（rules · hint · span · form.title）"
          code={schemasFullCode}
        >
          <DataPanel
            panelKey="demo-schemas-full"
            title="用户管理"
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            search={{ title: "筛选用户", props: DEMO_SEARCH }}
            form={{
              title: (row) =>
                row.id ? `修改 · ${String(row.name ?? "")}` : "添加用户",
              props: DEMO_FORM_RICH,
            }}
            view={{
              title: (row) => `详情 · ${String(row.name ?? "")}`,
              props: [
                { prop: "name", label: "姓名" },
                { prop: "email", label: "邮箱" },
                { prop: "balance", label: "余额" },
              ],
            }}
            caps={{
              import: false,
              export: false,
              print: false,
              columns: false,
              density: false,
              fullscreen: false,
              copy: false,
            }}
          />
        </DocsDemo>
      </section>

      <section class="flex flex-col gap-10">
        <div id="tab">
          <DocsDemo
            title="Tab"
            code={`import { createSignal } from "@dreamer/view";
import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, Row, SearchField } from "@dreamer/ui-view/data-display";

${DEMO_COMMON_SETUP_CODE}

function readDemoTab() {
  try {
    const k = new URLSearchParams(globalThis.location?.search ?? "").get("tab");
    return k === "admin" || k === "stats" || k === "all" ? k : "all";
  } catch {
    return "all";
  }
}

function DataPanelTabsDemo() {
  const tab = createSignal(readDemoTab());
  const rows = makeDemoRows(8);
  const adminCount = rows.filter((r) => r.role === "admin").length;
  return () => {
    const key = tab.value;
    const data = key === "admin"
      ? rows.filter((r) => r.role === "admin")
      : rows;
    return (
      <DataPanel
        panelKey="demo-tabs"
        title="用户管理"
        data={data}
        columns={columns}
        search={{ props: search }}
        form={{ props: form }}
        exportName="users"
        activeTab={key}
        onTabChange={(k) => {
          tab.value = k;
        }}
        tabs={[
          { key: "all", label: "全部" },
          { key: "admin", label: "管理员" },
          {
            key: "stats",
            label: "统计",
            children: (
              <div class="px-3 py-4 text-sm text-slate-600 dark:text-slate-400">
                当前共 {rows.length} 人，其中管理员 {adminCount} 人。
              </div>
            ),
          },
        ]}
      />
    );
  };
}
`}
          >
            <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
              标签放在工具栏左边的空位，和右侧按钮同一行。未写{" "}
              <code>children</code>{" "}
              的标签显示原来的表格；「统计」是自定义内容。点击会写入{" "}
              <code>?tab=</code>，用这个地址打开会激活对应标签。
            </Paragraph>
            <DataPanelTabsDemo />
          </DocsDemo>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            配置了 <code>tabs</code> 且走 API（<code>baseRoute</code> 或远程
            {" "}
            <code>dataSource</code>）时，当前标签 key
            会自动加到所有请求的查询参数上（默认 <code>tab</code>）。没有{" "}
            <code>tabs</code> 的面板不会带这个参数。
          </Paragraph>
          <CodeBlock
            title="Tab 请求参数"
            code={`<DataPanel
  title="佩戴过的用户"
  baseRoute="/api"
  tabs={[
    { key: "3", label: "最近 3 个月" },
    { key: "6", label: "最近 6 个月" },
    { key: "12", label: "最近 12 个月" },
  ]}
/>
// 列表、刷新、搜索、导入、导出、增删改、详情都会带 ?tab=3（或当前标签）
// tabParam="months" 可改参数名；tabParam={false} 则不带这个参数`}
            language="tsx"
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
          <CodeBlock
            title="缓存与刷新"
            code={`// 切换标签会回到第 1 页并重新请求。
// 已经请求过的组合（标签 + page / pageSize / 排序 / 搜索）会直接用内存缓存。
// 工具栏刷新、导入或增删改成功后，只作废当前标签的缓存并重新请求。`}
            language="tsx"
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>

      <section class="flex flex-col gap-10">
        <Title level={2}>进阶配置</Title>

        <DocsDemo title="可配批量条（上下文）" code={batchBarCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            批量条与工具栏一样可配。
            <code class="text-xs">show</code>／
            <code class="text-xs">disable</code>／
            <code class="text-xs">action</code> 会收到{" "}
            <code class="text-xs">&#123; selected, rows, query &#125;</code>
            。下面只加了一个「导出选中」，没选中时禁用；批量删除和取消勾选是默认操作，不必再写。
            若要别的批量操作，同样用自定义键编写{" "}
            <code class="text-xs">action</code>。
            本示例关闭了地址栏同步，避免同页多面板抢参数。
          </Paragraph>
          <DataPanel
            panelKey="demo-batch-bar"
            title="可配批量条"
            syncUrl={false}
            data={makeDemoRows(10)}
            columns={DEMO_COLUMNS}
            form={{ props: DEMO_FORM }}
            batchBar={{
              exportSelected: {
                label: "导出选中",
                disable: ({ selected }) => selected.length === 0,
                action: ({ selected }) => {
                  toast.info(`导出 ${selected.length} 条`);
                },
              },
            }}
            toolbar={{
              export: {
                disable: ({ selected }) => selected.length === 0,
              },
            }}
          />
        </DocsDemo>

        <DocsDemo title="搜索字段类型与自定义底栏" code={searchAdvCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            搜索已对齐表单：数字、日期时间、多选，以及字段{" "}
            <code class="text-xs">render</code>。
            <code class="text-xs">search.actions</code>{" "}
            接到官方底栏，可在「搜索／重置」旁加自定义按钮。
          </Paragraph>
          <DataPanel
            panelKey="demo-search-adv"
            title="高级搜索"
            syncUrl={false}
            data={makeDemoRows(25)}
            columns={DEMO_COLUMNS.map((c) =>
              c.prop === "status" ? { ...c, inline: undefined } : c
            )}
            caps={{ create: false }}
            search={{
              title: "高级筛选",
              props: [
                { prop: "name", placeholder: "姓名关键字" },
                { prop: "role", type: "multiselect" },
                { prop: "status", type: "select" },
                {
                  prop: "score",
                  type: "number",
                  label: "积分",
                  match: "num",
                },
                {
                  prop: "createdAt",
                  type: "datetime",
                  label: "创建时间",
                  match: "from",
                },
                {
                  prop: "memo",
                  label: "备注",
                  render: (ctx) => (
                    <Input value={ctx.value} placeholder="字段 render" />
                  ),
                },
              ],
              actions: {
                onlyActive: {
                  label: "只看启用",
                  action: (ctx) => {
                    setDataPanelQuery("demo-search-adv", {
                      filters: { status: "active" },
                      page: 1,
                    });
                    ctx.close();
                  },
                },
                submit: true,
                reset: true,
              },
            }}
          />
        </DocsDemo>

        <DocsDemo title="表单底栏与字段条件" code={formCondCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            <code class="text-xs">form.actions</code>{" "}
            接到官方底栏（如「保存并继续」）。字段的{" "}
            <code class="text-xs">show</code>／
            <code class="text-xs">disabled</code>／
            <code class="text-xs">options</code>{" "}
            可按当前表单值计算：访客禁用邮箱，管理员才显示积分。
          </Paragraph>
          <DataPanel
            panelKey="demo-form-cond"
            title="表单条件"
            syncUrl={false}
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            form={{
              props: [
                { prop: "name", required: true, placeholder: "请输入姓名" },
                {
                  prop: "role",
                  type: "select",
                  required: true,
                  initial: "viewer",
                },
                {
                  prop: "email",
                  required: true,
                  pattern: "^[^@\\s]+@[^@\\s]+$",
                  disabled: ({ values }) => values.role === "viewer",
                  hint: "访客账号不可改邮箱",
                },
                {
                  prop: "score",
                  type: "number",
                  show: ({ values }) => values.role === "admin",
                  hint: "仅管理员显示积分",
                },
                { prop: "balance", type: "number", min: 0, initial: 0 },
                { prop: "status", type: "switch", initial: "active" },
              ],
              actions: {
                saveMore: {
                  label: "保存并继续",
                  action: async (ctx) => {
                    await ctx.submit();
                    openDataPanelForm("demo-form-cond");
                  },
                },
                submit: true,
                cancel: true,
              },
            }}
          />
        </DocsDemo>

        <DocsDemo title="命令式 API 与 syncUrl" code={handlesCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            用 <code class="text-xs">panelKey</code>{" "}
            取／改查询、取选中、打开表单或详情、刷新。 本面板{" "}
            <code class="text-xs">syncUrl=&#123;false&#125;</code>
            ，不会写入地址栏。
          </Paragraph>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="demo-handles-filter"
              onClick={() => {
                setDataPanelQuery("demo-handles", {
                  filters: { role: "admin" },
                  page: 1,
                });
                handleHint.value = "已筛选管理员";
              }}
            >
              筛管理员
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="demo-handles-open-form"
              onClick={() => {
                openDataPanelForm("demo-handles");
                handleHint.value = "打开新增";
              }}
            >
              打开新增
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="demo-handles-open-view"
              onClick={() => {
                openDataPanelView("demo-handles", "1");
                handleHint.value = "打开详情";
              }}
            >
              打开详情
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="demo-handles-reload"
              onClick={() => {
                refreshDataPanel("demo-handles");
                const q = getDataPanelQuery("demo-handles");
                const n = getDataPanelSelected("demo-handles").length;
                handleHint.value = `刷新 · page=${q?.page ?? "-"} · 已选 ${n}`;
              }}
            >
              刷新并读状态
            </Button>
            <span
              class="text-xs text-slate-500"
              data-testid="demo-handles-hint"
            >
              {() => handleHint.value || "点上方按钮调用命令式 API"}
            </span>
          </div>
          <DataPanel
            panelKey="demo-handles"
            title="命令式 API"
            syncUrl={false}
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
          />
        </DocsDemo>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          属性一览。<code class="text-xs">form</code>／
          <code class="text-xs">search</code>／
          <code class="text-xs">view</code> 一律写成{" "}
          <code class="text-xs">{"{ title, props }"}</code>
          。<code class="text-xs">title</code> 为弹层标题（
          <code class="text-xs">string</code> 或函数；增改新增时 row 为{" "}
          <code class="text-xs">{"{}"}</code>
          ）；<code class="text-xs">props</code> 为字段数组。
        </Paragraph>
        <DocsApiTable rows={DATA_PANEL_API} />
        <Title level={3}>命令式 API（panelKey）</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          与 <code class="text-xs">refreshDataPanel</code>{" "}
          同一套键。页面自管 Modal
          保存后、或同页多面板读写查询时用这些方法，不必再包一层{" "}
          <code class="text-xs">list()</code>。
        </Paragraph>
        <DocsApiTable rows={PANEL_HANDLE_API} nameColumnHeader="方法" />
      </section>

      <section class="space-y-3">
        <Title level={2} id="api-type-Column">Columns（Column）</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          序号／多选／操作：
          <code class="text-xs">type:"index"|"selection"|"actions"</code>
          （prop／label 可省；操作按钮写在列的{" "}
          <code class="text-xs">actions</code>）。 日期格式：
          <code class="text-xs">format:"YYYY-MM-DD HH:mm"</code>。
        </Paragraph>
        <DocsApiTable rows={COLUMNS_API} />
      </section>

      <section class="space-y-3">
        <Title level={2} id="api-type-SearchConfig-SearchField">
          Search（SearchConfig / SearchField）
        </Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          搜索弹层可用 <code class="text-xs">width</code>
          （xs／sm／md／lg／xl 或 CSS 长度／像素／getter，缺省 md）和{" "}
          <code class="text-xs">fullscreenable</code>
          （是否显示全屏切换，缺省 false）、
          <code class="text-xs">autoFullscreen</code>
          （打开即全屏，所有端，缺省 false）和{" "}
          <code class="text-xs">mobileAutoFullscreen</code>
          （仅移动端打开即全屏，缺省 false）。字段类型对齐表单：date／datetime
          用选择器，number 为普通文本输入，并支持多选。<code class="text-xs">
            search.actions
          </code>{" "}
          与 <code class="text-xs">search.render</code>{" "}
          走官方底栏（搜索／重置＋自定义键）。
        </Paragraph>
        <Title level={3} id="api-type-SearchConfig">SearchConfig</Title>
        <DocsApiTable rows={SEARCH_CONFIG_API} />
        <Title level={3} id="api-type-SearchField">SearchField</Title>
        <DocsApiTable rows={SEARCH_API} />
      </section>

      <section class="space-y-3">
        <Title level={2} id="api-type-FormConfig-FormField">
          Form（FormConfig / FormField）
        </Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          优先级：
          <code class="text-xs">form.render</code>
          （整页）＞
          <code class="text-xs">FormField.render</code>
          （字段）＞ 内置控件；旁路层用{" "}
          <code class="text-xs">children</code>＋自定义{" "}
          <code class="text-xs">action</code>
          。弹层可用 <code class="text-xs">width</code>
          （xs／sm／md／lg／xl 或 CSS 长度／像素／getter，缺省 md）和{" "}
          <code class="text-xs">fullscreenable</code>
          （是否显示全屏切换，缺省 false）、
          <code class="text-xs">autoFullscreen</code>
          （打开即全屏，所有端，缺省 false）和{" "}
          <code class="text-xs">mobileAutoFullscreen</code>
          （仅移动端打开即全屏，缺省 false）。
        </Paragraph>
        <Title level={3} id="api-type-FormConfig">FormConfig</Title>
        <DocsApiTable rows={FORM_CONFIG_API} />
        <Title level={3} id="api-type-FormField">FormField</Title>
        <DocsApiTable rows={FORM_API} />
      </section>

      <section class="space-y-3">
        <Title level={2} id="api-type-ViewConfig-ViewItem">
          View（ViewConfig / ViewItem）
        </Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          详情字段区用 Descriptions 展示。Descriptions 的参数（除 items、title）可直接写在{" "}
          <code class="text-xs">view</code> 上，与 title／props／actions 混在一起，例如{" "}
          <code class="text-xs">column</code>（本插槽缺省 1）、
          <code class="text-xs">size</code>（缺省 sm）、
          <code class="text-xs">bordered</code>（缺省 true）、
          <code class="text-xs">layout</code>、
          <code class="text-xs">colon</code>、
          <code class="text-xs">labelAlign</code>。
          <code class="text-xs">title</code> 仍是弹层标题，不会传给 Descriptions；有{" "}
          <code class="text-xs">render</code> 时这些参数不生效。单项可写{" "}
          <code class="text-xs">labelAlign</code>
          ，垂直方向 top／center／bottom，水平方向
          left／center／right；未写则标签上对齐、右对齐。弹层可用{" "}
          <code class="text-xs">width</code>
          （xs／sm／md／lg／xl 或 CSS 长度／像素／getter，缺省 md）、
          <code class="text-xs">maxHeight</code>
          （最大高度，数字为像素或 CSS，缺省 90vh）和{" "}
          <code class="text-xs">fullscreenable</code>
          （是否显示全屏切换，缺省 false）、
          <code class="text-xs">autoFullscreen</code>
          （打开即全屏，所有端，缺省 false）和{" "}
          <code class="text-xs">mobileAutoFullscreen</code>
          （仅移动端打开即全屏，缺省 false）。标签与内容的宽度比例用{" "}
          <code class="text-xs">labelColPercent</code>
          （12～85，缺省 38）和 <code class="text-xs">labelMinWidth</code>
          （电脑端缺省 13.5rem，移动端容器缺省 7rem）控制。
        </Paragraph>
        <Title level={3} id="api-type-ViewConfig">ViewConfig</Title>
        <DocsApiTable rows={VIEW_CONFIG_API} />
        <Title level={3} id="api-type-ViewItem">ViewItem</Title>
        <DocsApiTable rows={VIEW_ITEM_API} />
      </section>

      <section class="space-y-3">
        <Title level={2} id="api-type-DataSource">数据源（DataSource）</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          拉数优先级：显式 <code class="text-xs">dataSource</code>
          {" ＞ "}
          <code class="text-xs">baseRoute</code>
          （API 源）＞ 只传 <code class="text-xs">data</code>
          （本地源、不请求接口）。同时传 <code class="text-xs">data</code>
          {" 和 "}
          <code class="text-xs">baseRoute</code>
          时，首屏（含 SSR／刷新浏览器）用传入的{" "}
          <code class="text-xs">data</code>
          渲染，挂载时不请求
          list，避免空表闪动；工具栏刷新、翻页、搜索、排序、切 Tab 再走
          API。总数优先用 <code class="text-xs">initial.total</code>
          ，未传则用 <code class="text-xs">data.length</code>
          ，不会臆造更大的总数（只传当前页数据时请给出真实 total）。
          <code class="text-xs">baseRoute</code>
          ≥2 段直接作根；仅 1 段再拼 <code class="text-xs">resource</code>
          。导入仍可用 <code class="text-xs">onImportRows</code>
          逃生。
        </Paragraph>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          <strong>action</strong>（默认）：资源根{" "}
          <code class="text-xs">GET</code>；
          <code class="text-xs">POST …/create</code>（单条对象）／
          <code class="text-xs">…/update</code>（body 含 id）／
          <code class="text-xs">…/remove</code>（单条删除，
          <code class="text-xs">{"{ ids }"}</code>
          ）／
          <code class="text-xs">…/remote-batch</code>（批量删除，
          <code class="text-xs">{"{ ids }"}</code>
          ）；
          <code class="text-xs">GET …/view?id=</code>。
          <code class="text-xs">importRows</code>
          无单独 import 端点，走 <code class="text-xs">POST …/create</code>
          ，body <code class="text-xs">{"{ rows }"}</code>
          （与单条对象区分）。
        </Paragraph>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          <strong>restful</strong>：
          <code class="text-xs">GET/POST</code> 资源根；
          <code class="text-xs">PUT/DELETE</code>{" "}
          <code class="text-xs">根/:id</code>（单条删除 DELETE）；批量删除{" "}
          <code class="text-xs">POST 根/remote-batch</code>；
          <code class="text-xs">GET 根/:id</code> 明细；
          <code class="text-xs">importRows</code>→
          <code class="text-xs">POST 根/import</code>。
        </Paragraph>
        <DocsApiTable rows={SOURCE_API} nameColumnHeader="方法" />
        <Title level={3} id="api-type-createApiDataSource">
          createApiDataSource
        </Title>
        <DocsApiTable rows={API_SOURCE_API} nameColumnHeader="项" />
        <DocsTypeApiSections ids={DATA_PANEL_EXTRA_TYPE_IDS} />
      </section>

      <DocsMessagesSection
        interfaceName="Messages"
        defaultExportName="defaultDataPanelMessages"
        rows={MESSAGES_DATA_PANEL}
      />
    </div>
  );
}
