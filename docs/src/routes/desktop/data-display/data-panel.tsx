/**
 * DataPanel 数据面板文档页（概述、引入、示例、messages、API）
 * 路由: /desktop/data-display/data-panel
 */

import { Button, Paragraph, Title } from "@dreamer/ui-view/basic";
import { createSignal } from "@dreamer/view";

import { CodeBlock, DataPanel } from "@dreamer/ui-view/data-display";
import type { DataPanelDataSource } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_DATA_PANEL } from "../../../data/component-messages-rows.ts";
import { DocsDemo } from "../../../components/DocsDemo.tsx";
import {
  CELL_COLUMNS,
  CELL_FORM,
  cellDemoState,
  createCellDemoSource,
  createRemoteDemoSource,
  DEMO_COLUMNS,
  DEMO_FORM,
  DEMO_HIDE_CHROME,
  DEMO_SEARCH,
  DEMO_STATUS_VALUES,
  demoCan,
  demoCapGate,
  makeDemoRows,
  type DemoPerms,
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
    type: "DataPanelColumn[]",
    default: "-",
    description:
      "列定义：prop / label / type(text|number|money|datetime|tag|bool|image|link) / sortable / width / options / inline(switch|text|number|textarea|date|datetime|select|multiselect) / total / hidden / noExport（必填）",
  },
  {
    name: "data",
    type: "DataPanelRow[]",
    default: "-",
    description:
      "本地数据：内置本地数据源，过滤 / 排序 / 分页 / 合计 / 增删改全在内存完成，首帧同步渲染（SSR 友好）",
  },
  {
    name: "dataSource",
    type: "DataPanelDataSource",
    default: "-",
    description:
      "自定义数据源（优先于 data）：list(query) 必需；create / update / remove / setField / importRows 按需提供，缺省的能力会自动隐藏对应按钮",
  },
  {
    name: "onDataChange",
    type: "(rows) => void",
    default: "-",
    description: "data 模式下数据变化回调",
  },
  {
    name: "search",
    type: "DataPanelSearchField[]",
    default: "[]",
    description: "搜索项（text / select / date）；为空则不显示搜索按钮",
  },
  {
    name: "form",
    type: "DataPanelFormField[]",
    default: "[]",
    description:
      "新增 / 编辑 Modal 表单项：text / textarea / number / select / multiselect / switch / password / date / datetime，支持 required / min / max / pattern / createOnly / editOnly",
  },
  {
    name: "panelKey",
    type: "string",
    default: '"data-panel"',
    description:
      "面板标识：@dreamer/storage/client 持久化键（列显隐／行高／全屏）、refreshDataPanel(key)；同页多面板须唯一",
  },
  { name: "rowKey", type: "string", default: '"id"', description: "主键字段" },
  {
    name: "pageSize / pageSizes",
    type: "number / number[]",
    default: "10 / [10,20,50,100]",
    description: "默认每页条数与可选项",
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
    type: "DataPanelListResult / Partial<DataPanelQuery>",
    default: "-",
    description: "服务端预取首屏 / 初始查询（有 initial 时挂载后不再请求）",
  },
  {
    name: "statusField / statusValues",
    type: "string / {value,label}[]",
    default: "-",
    description:
      "批量条「设为…」数据（需 setField）。显隐／disable 由 toolbar.batchStatus（TOOLBAR_BUILTIN，未声明→caps.batchStatus）控制；仅选中行时出现在 dp-batch-bar",
  },
  {
    name: "caps",
    type: "Partial<DataPanelCaps>",
    default: "按数据源推断",
    description:
      "能力开关回落：create / update / view / remove / batchStatus / import / export / print / columns / density / fullscreen / copy。batchStatus 亦为 toolbar TOOLBAR_BUILTIN",
  },
  {
    name: "locale",
    type: '"zh-CN" | "en-US"',
    default: '"zh-CN"',
    description:
      "界面语言：选内置文案包（zh-CN→defaultDataPanelMessages，en-US→enDataPanelMessages）；再与 messages 浅合并。组件级 locale，与 ConfigProvider.locale 独立。",
  },
  {
    name: "messages",
    type: "Partial<DataPanelMessages>",
    default: "-",
    description: "覆盖文案；字段见上文「文案（messages）」表，勿将键摊入本表",
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
    type: "(format, ctx) => void",
    default: "-",
    description:
      "接管导出（如调用服务端接口）；缺省时面板分页拉取全部行并在浏览器生成文件",
  },
  {
    name: "onImportRows",
    type: "(rows) => void",
    default: "-",
    description: "接管导入；缺省走 dataSource.importRows",
  },
  {
    name: "renderCell",
    type: "Record<string, (row) => unknown>",
    default: "-",
    description: "按列自定义单元格",
  },
  {
    name: "toolbar",
    type: "false | DataPanelToolbarConfig (Record)",
    default: "{}",
    description:
      "`false`＝整栏工具栏不渲染（data-panel-toolbar 不出现）；省略／{}／Record＝统合 Record（废止 toolbar.extra／order／toolbarExtra／onCreate）。声明项：省略 show→true、省略 disable→false；键级 true|false 简写；对象可 show/disable/icon/label/title/tone/action；title／label 互落：tip=title??label??内置messages??key；无 label 有 title→显示用 title；无 title 有 label→tip 用 label；无 confirm 字段（确认写在 action 自管）；tone=default|primary|secondary|success|warning|danger|ghost（对齐 Button）；自定义必须 action；写入序＝显示序。batchStatus 为 TOOLBAR_BUILTIN：控批量条「设为…」显隐／disable（非工具栏图标）",
  },
  {
    name: "rowActions",
    type: "DataPanelRowActionsConfig (Record)",
    default: "{}",
    description:
      "统合 Record（废止 rowActions.extra／order／rowExtra／onEdit／onView）。同形；tone 同 toolbar；无 confirm 字段（确认写在 action）；title／label 互落同 toolbar（tip=title??label??messages??key；显示=label??title??key）；自定义必须 action(item)；内置 remove 自带 Popconfirm；写入序＝显示序",
  },
  {
    name: "selectable",
    type: "boolean",
    default: "true",
    description: "是否显示选择列与批量条（有删除或批量状态能力时）",
  },
  {
    name: "syncUrl",
    type: "boolean",
    default: "false",
    description: "把查询写入地址栏（history.replaceState）",
  },
  {
    name: "onChanged",
    type: "() => void",
    default: "-",
    description: "任一写操作成功后回调",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "额外 class（加在卡片上）",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "面板根节点内的额外内容",
  },
];

const SOURCE_API: DocsApiTableRow[] = [
  {
    name: "list(query)",
    type: "DataPanelListResult | Promise<…>",
    default: "-",
    description:
      "返回当前页 { rows, total, totals? }；query = { page, pageSize, sort, order(1|-1), filters }",
  },
  {
    name: "sync",
    type: "boolean",
    default: "false",
    description: "list 同步返回时置 true：首帧（含 SSR）直接渲染",
  },
  {
    name: "create(values)",
    type: "DataPanelWriteResult",
    default: "-",
    description:
      "返回 void / { ok:true } 表示成功；{ ok:false, message?, fields?, messages? } 把错误回填到表单；抛错也会提示",
  },
  {
    name: "update(id, values)",
    type: "DataPanelWriteResult",
    default: "-",
    description: "编辑保存；行内编辑在没有 setField 时也走它",
  },
  {
    name: "remove(ids)",
    type: "{ removed, failed[] }",
    default: "-",
    description:
      "删除；面板保证只在用户确认后才会调用（行内／批量删除均为按钮上方的小气泡 Popconfirm）",
  },
  {
    name: "setField(ids, field, value)",
    type: "{ removed, failed[] }",
    default: "-",
    description: "批量状态 / 行内编辑",
  },
  {
    name: "importRows(rows)",
    type: "{ created, failed }",
    default: "-",
    description: "导入 CSV / JSON 解析后的行",
  },
];

const importCode = `import { DataPanel } from "@dreamer/ui-view/data-display";

<DataPanel
  title="用户管理"
  panelKey="users"
  data={rows}
  columns={columns}
  search={search}
  form={form}
/>`;

const columnsCode = `const columns: DataPanelColumn[] = [
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "role", label: "角色", type: "tag", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "viewer", label: "访客" },
  ] },
  { prop: "status", label: "状态", type: "tag", inline: "switch", options: [
    { value: "active", label: "启用", tone: "success" },
    { value: "disabled", label: "停用", tone: "warning" },
  ] },
  { prop: "balance", label: "余额", type: "money", sortable: true, total: true },
  { prop: "createdAt", label: "创建时间", type: "datetime", hidden: true },
];`;

const basicCode = `<DataPanel
  panelKey="demo-basic"
  title="用户管理"
  data={rows}
  columns={columns}
  search={search}
  form={form}
  statusField="status"
  statusValues={[{ value: "active", label: "启用" }, { value: "disabled", label: "停用" }]}
/>`;

const searchCode = `const search: DataPanelSearchField[] = [
  { name: "name", label: "姓名" },                       // 文本：包含匹配
  { name: "role", label: "角色", type: "select", options: [...] },
];
<DataPanel title="用户" data={rows} columns={columns} search={search}
  initialQuery={{ filters: { role: "admin" } }} />  // 有初始筛选时，打开搜索 Modal 会带出这些值；提交即搜索，重置即清空`;

const tableCode = `// 排序：sortable 列表头点击 升序 → 降序 → 默认排序
// 合计行：total: true；隐藏列：hidden: true（列设置里可打开，偏好保存在 localStorage）
// 行内编辑：inline: "switch" 直接切换；inline: "text" | "number" 双击编辑，Enter/失焦保存，Esc 取消
// 行 locked: true：不可选择、不可删除、不可行内编辑
// 行内编辑需要可写：提供 form（或 onDataChange / dataSource.update）
<DataPanel title="表格" data={rows} columns={columns} form={form}
  defaultSort={{ prop: "balance", order: "desc" }} />`;

const crudCode =
  `// 新增 / 编辑 / 查看都用 Modal；删除／批量设为一律先确认（行内／批量均为小气泡 Popconfirm），确认后才调用；不走 Modal 确认对话框
<DataPanel title="CRUD" data={rows} columns={columns} form={form}
  onDataChange={(next) => console.log(next)} />

const form: DataPanelFormField[] = [
  { name: "name", label: "姓名", required: true },
  { name: "email", label: "邮箱", required: true, pattern: "^[^@\\\\s]+@[^@\\\\s]+$" },
  { name: "balance", label: "余额", type: "number", min: 0 },
  { name: "status", label: "启用", type: "switch", onOff: ["active", "disabled"] },
];`;

const batchCode =
  `// 勾选多行 → 批量条出现：批量设为 / 批量删除（均为小气泡 Popconfirm）/ 取消选择
<DataPanel title="批量" data={rows} columns={columns}
  statusField="status" statusValues={[{ value: "active", label: "启用" }, { value: "disabled", label: "停用" }]} />`;

const pageCode =
  `// 每页条数下拉、上一页 / 下一页、页码（带省略号）、跳页输入框，范围文案「第 a-b 条，共 n 条」
<DataPanel title="分页" data={rows} columns={columns} pageSize={5} pageSizes={[5, 10, 20]} />`;

const exportCode =
  `// 工具栏「导出」：xlsx（原生 OOXML）/ csv / json / xml / html，只导出当前可见列，导出全部匹配行
// 工具栏「行高／全屏／复制」：切密度、面板级全屏（Esc 退出）、复制勾选行（无选中会提示）
// 工具栏「导入」：选择 .csv / .json，表头可为列文案或字段名
<DataPanel title="导出导入" data={rows} columns={columns} exportName="users" />

// 也可只用导出函数
import { buildExportFile } from "@dreamer/ui-view/data-display";
const file = buildExportFile({ format: "xlsx", title: "用户", basename: "users", columns, rows, messages });
// file = { filename, mime, data: Uint8Array | string }`;

const cellCode = `// 单元格编辑：column.inline 指定编辑器类型，双击进入编辑
//   text / number / textarea / date / datetime / select（单选，需 options）/ multiselect（多选，需 options）
//   switch：点击即切换；失焦或 Enter 保存并回到展示态；Esc 取消并恢复原值
//   保存失败（dataSource.setField / update 返回失败）：弹出错误提示并保持原值
const columns: DataPanelColumn[] = [
  { prop: "name", label: "姓名", inline: "text" },
  { prop: "score", label: "积分", type: "number", inline: "number" },
  { prop: "role", label: "角色", type: "tag", inline: "select", options: roleOptions },
  { prop: "tags", label: "标签", type: "tag", inline: "multiselect", options: tagOptions },
  { prop: "status", label: "状态", type: "tag", inline: "switch", options: [on, off] },
  { prop: "birthday", label: "生日", type: "date", inline: "date" },
  { prop: "loginAt", label: "最近登录", type: "datetime", inline: "datetime" },
  { prop: "remark", label: "备注", inline: "textarea" },
];
<DataPanel title="单元格编辑" dataSource={source} columns={columns} />`;

const remoteCode = `const source: DataPanelDataSource = {
  async list(q) {
    const r = await fetch("/api/users?" + new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize), sort: q.sort, order: q.order === 1 ? "asc" : "desc", ...q.filters }));
    return await r.json(); // { rows, total, totals? }
  },
  async create(values) { await fetch("/api/users", { method: "POST", body: JSON.stringify(values) }); },
  async update(id, values) { /* ... */ },
  async remove(ids) { return await (await fetch("/api/users/remove", { method: "POST", body: JSON.stringify({ ids }) })).json(); },
};
<DataPanel title="远程数据" dataSource={source} columns={columns} search={search} form={form} />`;

const themeCode =
  `// 浅色 / 深色：跟随根节点 .dark；深色面板主体用 CSS 变量 --dp-panel-body-bg（默认 #18212f）
// 工具栏按钮组：浅色灰白、深色 slate，相邻按钮只有一条淡分割线
<div class="dark"> <DataPanel ... /> </div>`;

const localeCode =
  `<DataPanel locale="en-US" title="Users" data={rows} columns={columns} search={search} form={form} />
// 覆盖部分文案
<DataPanel messages={{ create: "新建", deleteTitle: "删除确认" }} ... />`;

const toolbarOffCode = `// toolbar: false → 整栏工具栏不渲染（省略／Record 行为不变）
<DataPanel
  toolbar={false}
  title="无工具栏"
  data={rows}
  columns={columns}
/>`;

const defaultsCode = `// 默认：省略 show→true、省略 disable→false；声明项不被 caps 藏
// caps.create=false，但声明 create:{} / { disable:true } 仍显示
<DataPanel
  caps={{ create: false, update: false }}
  toolbar={{
    create: {},                 // 声明且未写 show → 显示（无视 caps.create=false）
    refresh: { disable: true }, // 显示但禁用
    // search 未声明 → 若无 search 项则 caps/回落不出现
  }}
  rowActions={{
    edit: { disable: true },    // 声明 → 显示且禁用（无视 caps.update=false）
    // view／remove 未声明 → 按 caps
  }}
/>`;

const boolCode = `// ① true / false 简写控显隐（内置键）；未写的键仍按 caps 回落
<DataPanel
  toolbar={{
    create: true,
    search: true,
    refresh: true,
    print: false,
    import: false,
    export: false,
  }}
  rowActions={{
    view: true,
    edit: true,
    remove: false, // 强制隐藏
  }}
/>`;

const tbFnCode = `// ② toolbar：show / disable 无参函数（常接页面变量）
const pageAllowAudit = () => pageFlags.audit;
<DataPanel
  toolbar={{
    create: true,
    audit: {
      label: "审计",
      show: () => pageAllowAudit(),       // false＝隐藏
      disable: () => !pageAllowAudit(),  // true＝可见但禁用
      action: () => console.log("audit"),
    },
    refresh: true,
    ...hideChrome,
  }}
/>`;

const raFnCode = `// ③ 操作列：show / disable / action 收当前行 item
<DataPanel
  rowActions={{
    view: false,
    edit: false,
    remove: false,
    assign: {
      label: "分配",
      show: (item) => true,                 // 始终可见
      disable: (item) => !!item.locked,     // locked 行禁用
      action: (item) => console.log("assign", item.id),
    },
  }}
/>`;

const tbCustomCode = `// ④a 自定义工具钮：未知 key 必须有 action（缺则校验抛错）
<DataPanel
  toolbar={{
    create: true,
    invite: {
      label: "邀请",
      action: () => console.log("invite"),
    },
    refresh: true,
  }}
/>`;

const raCustomCode = `// ④b 自定义操作列：未知 key 必须有 action(item)
<DataPanel
  rowActions={{
    view: true,
    clone: {
      label: "克隆",
      action: (item) => console.log("clone", item.id),
    },
    edit: true,
    remove: false,
  }}
/>`;

const keyOrderCode = `// ⑤ 对象字面量写入序 = 显示序（create → audit → refresh → export）
<DataPanel
  toolbar={{
    create: true,
    audit: { label: "审计", action: () => {} },
    refresh: true,
    export: true,
    // 其余 chrome 关掉，方便看序
    print: false, import: false, columns: false,
    density: false, fullscreen: false, copy: false,
  }}
/>`;

const enabledCode = `// disable：默认 false；true／函数 true＝禁用仍可见（≠ show:false）
<DataPanel
  toolbar={{
    create: { disable: true },          // 可见不可点
    freeze: {
      label: "冻结",
      disable: () => true,              // 无参函数
      action: () => {},
    },
    refresh: true,
  }}
  rowActions={{
    view: true,
    edit: { disable: true },            // 内置：可见禁用
    remove: false,
    assign: {
      label: "分配",
      disable: (item) => !!item.locked, // locked 行禁用
      action: (item) => console.log(item.id),
    },
  }}
/>`;


const titleCode = `// title／label 互落：tip=title??label??messages??key；显示=label??title??key
<DataPanel
  toolbar={{
    create: true,                       // 无 title → Tooltip「新建」等 messages
    refresh: { title: "立刻刷新" },     // 显式覆盖内置默认
    freeze: {
      label: "冻结",
      // 无 title → Tooltip 用 key「freeze」
      action: () => {},
    },
  }}
  rowActions={{
    view: true,                         // 无 title → messages.view
    edit: { title: "改资料" },          // 覆盖
    remove: false,
    assign: {
      label: "分配",
      // 无 title → Tooltip「assign」
      action: (item) => console.log(item.id),
    },
  }}
/>`;

const canCode = `// ⑥ 对齐 admin：can() / capGate + 页面变量控 show
// capGate(allow): allow→undefined（回落 caps）；!allow→false
const perms = { "demo.view": true, "demo.write": false };
const pageExport = true;

function can(code: "demo.view" | "demo.write") {
  return !!perms[code];
}
function capGate(allow: boolean): false | undefined {
  return allow ? undefined : false;
}

<DataPanel
  toolbar={{
    create: capGate(can("demo.write")),
    import: capGate(can("demo.write")),
    export: {
      show: () => can("demo.view"),
      disable: () => !pageExport, // pageExport=false → 可见但禁用
    },
  }}
  rowActions={{
    view: capGate(can("demo.view") || can("demo.write")),
    edit: capGate(can("demo.write")),
    remove: capGate(can("demo.write")),
    assign: {
      label: "分配",
      show: () => can("demo.write"),
      action: (item) => console.log(item.id),
    },
  }}
/>`;

const customCode = `// tone 全档(Button) / tip=label??key；确认写在 action 自管；前导 chrome 放面板外
<div>
  <span className="text-sm text-slate-500">面板外提示</span>
  <DataPanel title="自定义" data={rows} columns={columns} caps={{ create: false }}
    renderCell={{ name: (row) => <b>{String(row.name)}</b> }}
    toolbar={{
      notify: { label: "通知", tone: "primary", action: () => {} },
      batchStatus: true, // TOOLBAR_BUILTIN：控批量条「设为…」
    }}
    rowActions={{
      freeze: {
        label: "冻结", tone: "danger",
        action: (row) => console.log(row.id), // 需确认则在 action 内自开 Popconfirm
      },
    }}
  />
</div>`;

/** 单个示例块 */

const exampleDemo = `import { DataPanel } from "@dreamer/ui-view/data-display";

<DataPanel
  title="用户管理"
  panelKey="users"
  data={rows}
  columns={columns}
  search={search}
  form={form}
/>`;


export default function DataDisplayDataPanel() {
  const remote: DataPanelDataSource = createRemoteDemoSource(300);
  const cellSource: DataPanelDataSource = createCellDemoSource();
  const actionHint = createSignal("");
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
          / 导出 / 列设置 / 行高 / 全屏 / 复制， 相邻按钮之间只有一条淡分割线）、搜索
          Modal（工具栏按钮打开）、表格下方的批量操作条、表格（排序、多选、行内编辑、合计、操作列）、
          分页，以及用 Modal 的新增 / 编辑 / 查看。<strong>
            任何删除与批量「设为…」都必须先确认：行内／批量删除／批量设为均弹出小气泡 Popconfirm（确定在左、取消在右；点外部也会关闭），不用 Modal 确认对话框
          </strong>。 支持原生 xlsx 导出（零依赖），支持浅色 / 深色主题与 zh-CN
          / en-US。数据通过 <code>data</code> 或 <code>dataSource</code>{" "}
          注入，与后端无关。工具栏／操作列用统合 <code>toolbar</code>／
          <code>rowActions</code> Record 配置（写入序＝显示序；自定义键必须
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
        />
        <CodeBlock
          title="列定义"
          code={columnsCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
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
            search={DEMO_SEARCH}
            form={DEMO_FORM}
            statusField="status"
            statusValues={DEMO_STATUS_VALUES}
            exportName="users"
          />
        </DocsDemo>

        <DocsDemo title="搜索表单（Modal）" code={searchCode}>
          <DataPanel
            panelKey="demo-search"
            title="搜索表单"
            data={makeDemoRows(25)}
            columns={DEMO_COLUMNS}
            search={DEMO_SEARCH}
            initialQuery={{ filters: { role: "admin" } }}
            caps={{ create: false }}
          />
        </DocsDemo>

        <DocsDemo title="表格：排序 / 合计 / 行内编辑 / 隐藏列" code={tableCode}>
          <DataPanel
            panelKey="demo-table"
            title="表格功能"
            data={makeDemoRows(8)}
            columns={DEMO_COLUMNS}
            defaultSort={{ prop: "balance", order: "desc" }}
            form={DEMO_FORM}
            statusField="status"
            caps={{ create: false, remove: false }}
          />
        </DocsDemo>

        <DocsDemo title="单元格编辑" code={cellCode}>
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
            form={CELL_FORM}
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
            form={DEMO_FORM}
          />
        </DocsDemo>

        <DocsDemo title="批量操作" code={batchCode}>
          <DataPanel
            panelKey="demo-batch"
            title="批量操作"
            data={makeDemoRows(10)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            statusField="status"
            statusValues={DEMO_STATUS_VALUES}
          />
        </DocsDemo>

        <DocsDemo title="分页" code={pageCode}>
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
          title="导出 xlsx / csv / json / xml / html 与导入"
          code={exportCode}
        >
          <DataPanel
            panelKey="demo-export"
            title="导出导入"
            data={makeDemoRows(15)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            exportName="users"
          />
        </DocsDemo>

        <DocsDemo title="远程数据源（异步）" code={remoteCode}>
          <DataPanel
            panelKey="demo-remote"
            title="远程数据"
            dataSource={remote}
            columns={DEMO_COLUMNS}
            search={DEMO_SEARCH}
            form={DEMO_FORM}
            statusField="status"
            statusValues={DEMO_STATUS_VALUES}
          />
        </DocsDemo>

        <DocsDemo title="深色主题" code={themeCode}>
          <div class="dark rounded-lg bg-slate-900 p-3">
            <DataPanel
              panelKey="demo-dark"
              title="深色面板"
              data={makeDemoRows(6)}
              columns={DEMO_COLUMNS}
              search={DEMO_SEARCH}
              form={DEMO_FORM}
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
              } as Record<string, string>)[c.prop] ?? c.label,
            }))}
            search={[{ name: "name", label: "Name" }]}
            form={DEMO_FORM.map((f) => ({ ...f }))}
            messages={{ create: "New" }}
          />
        </DocsDemo>


      </section>

      <section class="flex flex-col gap-10">
        <div class="space-y-2">
          <Title level={2}>工具栏与操作列（统合 Record）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            <code>toolbar</code>／<code>rowActions</code> 为统合 Record；
            <code>toolbar</code> 设为 <code>false</code> 时整栏工具栏不渲染。
            键级 <code>true</code>／<code>false</code> 简写控显隐；对象可覆盖
            <code>show</code>／<code>disable</code>／<code>icon</code>／<code>label</code>／<code>title</code>／<code>tone</code>／<code>action</code>
            （默认 show=true、disable=false）。声明项不再用 caps 藏钮；
            <code>undefined</code>（如 capGate allow）才回落 caps。<code>title</code> 可省：不传时内置用 messages、自定义用
            <code>title ?? label ?? 内置 messages ?? key</code>。无 <code>label</code> 有
            <code>title</code> 时显示用 <code>title</code>；无 <code>title</code> 有 <code>label</code> 时 tip 用
            <code>label</code>。无 <code>confirm</code> 字段：需要确认时在
            <code>action</code> 内自管（内置 remove 仍自带 Popconfirm）。
            <code>tone</code>：对齐 Button 全档 <code>default|primary|secondary|success|warning|danger|ghost</code>（内置 remove 默认 danger）。未知键＝自定义（必须
            <code>action</code>）。写入序＝显示序。已<strong>废止</strong>
            <code>toolbar.extra</code>／<code>rowActions.extra</code>／<code>order</code>／<code>toolbarExtra</code>／<code>rowExtra</code>
            （前导 chrome 请放面板外）。<code>batchStatus</code> 是 TOOLBAR_BUILTIN：声明式控批量条「设为…」显隐／disable，UI 仍在选中批量条。
          </Paragraph>
        </div>

        <DocsDemo title="toolbar: false 整栏隐藏" code={toolbarOffCode}>
          <DataPanel
            panelKey="demo-toolbar-off"
            title="无工具栏"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            toolbar={false}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-toolbar-off-hint">
            toolbar=false 时整栏工具栏不出现；表格／分页仍渲染。
          </p>
        </DocsDemo>

        <DocsDemo title="⓪ 默认：省略 show→显示、省略 disable→可点" code={defaultsCode}>
          <DataPanel
            panelKey="demo-defaults"
            title="声明默认 vs caps"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
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
            rowActions={{
              edit: { disable: true },
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-defaults-hint">
            caps 关 create／update，但声明项 create 空对象、edit 仅 disable 仍显示；refresh 禁用仍可见；未声明 view／remove 按 caps。
          </p>
        </DocsDemo>

        <DocsDemo title="① true／false 简写控显隐" code={boolCode}>
          <DataPanel
            panelKey="demo-bool"
            title="true／false 简写"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            search={DEMO_SEARCH}
            form={DEMO_FORM}
            toolbar={{
              create: true,
              search: true,
              refresh: true,
              print: false,
              import: false,
              export: false,
            }}
            rowActions={{
              view: true,
              edit: true,
              remove: false,
            }}
          />
        </DocsDemo>

        <DocsDemo title="② toolbar：show／disable 无参函数" code={tbFnCode}>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="demo-tb-fn-toggle"
              onClick={() => {
                pageAllowAudit.value = !pageAllowAudit.value;
              }}
            >
              {() => pageAllowAudit.value ? "关闭权限（审计变禁用）" : "打开权限（审计可点）"}
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
            form={DEMO_FORM}
            toolbar={{
              create: true,
              audit: {
                label: "审计",
                show: () => true,
                disable: () => !pageAllowAudit.value,
                action: () => {
                  actionHint.value = "toolbar:audit";
                },
              },
              refresh: true,
              ...DEMO_HIDE_CHROME,
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-tb-fn-hint">
            {() => actionHint.value || "pageAllowAudit=false 时审计仍可见但 disabled"}
          </p>
        </DocsDemo>

        <DocsDemo title="③ 操作列：show／action(item)" code={raFnCode}>
          <DataPanel
            panelKey="demo-ra-fn"
            title="操作列函数"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            caps={{ create: false, update: false, remove: false, view: false }}
            rowActions={{
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
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-ra-fn-hint">
            {() => actionHint.value || "locked 行「分配」仍可见但 disabled；点击看 item.id"}
          </p>
        </DocsDemo>

        <DocsDemo title="④a 自定义工具钮（未知 key＋必 action）" code={tbCustomCode}>
          <DataPanel
            panelKey="demo-tb-custom"
            title="自定义工具钮"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            toolbar={{
              create: true,
              invite: {
                label: "邀请",
                action: () => {
                  actionHint.value = "toolbar:invite";
                },
              },
              refresh: true,
              ...DEMO_HIDE_CHROME,
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-tb-custom-hint">
            {() => actionHint.value || "点击「邀请」"}
          </p>
        </DocsDemo>

        <DocsDemo title="④b 自定义操作列（未知 key＋必 action(item)）" code={raCustomCode}>
          <DataPanel
            panelKey="demo-ra-custom"
            title="自定义操作列"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            rowActions={{
              view: true,
              clone: {
                label: "克隆",
                action: (item) => {
                  actionHint.value = `row:clone:${String(item.id)}`;
                },
              },
              edit: true,
              remove: false,
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-ra-custom-hint">
            {() => actionHint.value || "写入序：view → clone → edit（无 remove）"}
          </p>
        </DocsDemo>

        <DocsDemo title="⑤ 写入序＝显示序" code={keyOrderCode}>
          <DataPanel
            panelKey="demo-key-order"
            title="写入序＝显示序"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            toolbar={{
              create: true,
              audit: {
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
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-key-order-hint">
            工具栏从左到右：添加 → 审计 → 刷新 → 导出（与对象键顺序一致）
          </p>
        </DocsDemo>

        <DocsDemo title="⑦ disable：禁用仍可见（≠ show:false）" code={enabledCode}>
          <DataPanel
            panelKey="demo-enabled"
            title="disable 演示"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            toolbar={{
              create: { disable: true },
              freeze: {
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
            rowActions={{
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
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-enabled-hint">
            添加／冻结／编辑为 disabled 仍可见；locked 行「分配」禁用。show:false 才会隐藏。
          </p>
        </DocsDemo>


        <DocsDemo title="⑧ title 可省：内置 messages／自定义 label??key／显式覆盖" code={titleCode}>
          <DataPanel
            panelKey="demo-title"
            title="title Tooltip"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            toolbar={{
              create: true,
              refresh: { title: "立刻刷新" },
              freeze: {
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
            rowActions={{
              view: true,
              edit: { title: "改资料" },
              remove: false,
              assign: {
                label: "分配",
                action: (item) => {
                  actionHint.value = `title:assign:${String(item.id)}`;
                },
              },
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-title-hint">
            不传 title：内置悬停用 messages／label，自定义悬停用 key（如 freeze／assign）；传了则覆盖（立刻刷新／改资料）。
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
              {() => perms.value["demo.write"] ? "关闭 demo.write" : "打开 demo.write"}
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
                `write=${String(perms.value["demo.write"])} view=${String(perms.value["demo.view"])} pageExport=${String(pageExport.value)}`}
            </span>
          </div>
          <DataPanel
            panelKey="demo-can"
            title="can()／页面变量"
            data={makeDemoRows(5)}
            columns={DEMO_COLUMNS}
            form={DEMO_FORM}
            search={DEMO_SEARCH}
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
            rowActions={{
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
            }}
          />
          <p class="mt-2 text-xs text-slate-500" data-testid="demo-can-hint">
            {() =>
              actionHint.value ||
              "默认 write=false：无创建／导入／编辑／删除／分配；export 受 pageExport＆view 控制"}
          </p>
        </DocsDemo>

        <DocsDemo title="tone／tip=label??key（无 confirm 字段／无双轨插槽）" code={customCode}>
          <div class="flex flex-col gap-2">
            <span class="text-sm text-slate-500" data-testid="demo-custom-leading">
              面板外提示（原 toolbarExtra 迁此）
            </span>
            <DataPanel
              panelKey="demo-custom"
              title="自定义"
              data={makeDemoRows(5)}
              columns={DEMO_COLUMNS}
              caps={{ create: false }}
              renderCell={{
                name: (row) => (
                  <b data-testid="demo-custom-name">{String(row.name)}</b>
                ),
              }}
              toolbar={{
                notify: {
                  label: "通知",
                  tone: "primary",
                  action: () => {
                    actionHint.value = "tb:notify";
                  },
                },
              }}
              rowActions={{
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
              }}
            />
            <p class="text-xs text-slate-500" data-testid="demo-custom-hint">
              {() => actionHint.value || "点「通知」／「冻结」直接跑 action（确认请在 action 自管）"}
            </p>
          </div>
        </DocsDemo>

      </section>

      <section class="flex flex-col gap-6">
        <Title level={2}>完整示例</Title>
        <CodeBlock title="代码示例" code={exampleDemo} language="tsx" showLineNumbers copyable wrapLongLines />
      </section>

      <DocsMessagesSection
        interfaceName="DataPanelMessages"
        defaultExportName="defaultDataPanelMessages"
        rows={MESSAGES_DATA_PANEL}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          DataPanel 属性。
        </Paragraph>
        <DocsApiTable rows={DATA_PANEL_API} />
      </section>

      <section class="space-y-3">
        <Title level={2}>数据源（DataPanelDataSource）</Title>
        <DocsApiTable rows={SOURCE_API} nameColumnHeader="方法" />
      </section>
    </div>
  );
}
