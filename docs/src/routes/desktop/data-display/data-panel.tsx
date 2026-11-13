/**
 * DataPanel 数据面板文档页（概述、引入、示例、API、messages）
 * 路由: /desktop/data-display/data-panel
 */

import { Button, Paragraph, Title } from "@dreamer/ui-view/basic";
import { createSignal } from "@dreamer/view";

import {
  CodeBlock,
  DataPanel,
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
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_DATA_PANEL } from "../../../data/component-messages-rows.ts";
import { DocsDemo } from "../../../components/DocsDemo.tsx";
import {
  ALIGN_DEMO_COLUMNS,
  ALIGN_DEMO_COLUMNS_CODE,
  CELL_COLUMNS,
  CELL_FORM,
  cellDemoState,
  createCellDemoSource,
  createRemoteDemoSource,
  DEMO_COLUMNS,
  DEMO_FORM,
  DEMO_FORM_RICH,
  DEMO_HIDE_CHROME,
  DEMO_SEARCH,
  demoCan,
  demoCapGate,
  type DemoPerms,
  makeDemoRows,
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
      "本地行数据；传入则不自动请求列表。优先级：dataSource ＞ data ＞ baseRoute（API）",
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
      '路由前缀或完整资源根（如 "/api" 或 "/api/users"）。去首尾 / 分段：≥2 段直接作根；仅 1 段再拼 resource，未传则自动取当前页面路由（打开 /rbac/admins 且 baseRoute="/api" → /api/rbac/admins）。不要把 index 拼进路径。仅无 data／无 dataSource 时 createApiDataSource 并拉 list',
  },
  {
    name: "resource",
    type: "string",
    default: "-",
    description:
      '资源名／当前资源路由段（如 "users" 或 "rbac/admins"）。仅 baseRoute 为 1 段时生效；≥2 段忽略。不传则自动使用当前页面路由。仅无 data／无 dataSource 时生效',
  },
  {
    name: "apiMode",
    type: '"action" | "restful"',
    default: '"action"',
    description:
      "仅无 data／无 dataSource 且由 baseRoute 生成时生效。action：GET 根／POST …/create｜update｜remove、importRows→create 且 body { rows }；restful：GET/POST 根、PUT/DELETE 根/:id、importRows→POST …/import",
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
    type: "{ title?, props: SearchField[] }",
    default: "—",
    description:
      "搜索弹层：title 为标题（string 或 ()=>string），props 与列同一套字段配置。非空则工具栏搜索＋URL 同步。详见 Search 表。",
  },
  {
    name: "form",
    type: "{ title?, props?, render?, actions? }",
    default: "—",
    description:
      "增改弹层：title 为标题（string 或 (row)=>string；新增时 row 为 {}）；props 为表单项（有 render 时可省）；render(ctx) 整段替换主体（含确定／取消），优先级高于 FormField.render；旁路可用 children＋自定义 action。详见 Form 表。",
  },
  {
    name: "view",
    type: "{ title?, props?, render?, actions? }",
    default: "columns＋form",
    description:
      "详情弹层：title 为查看弹窗标题（string 或 (row)=>string）；props 只放字段（有 render 时可省）；render(ctx) 替换 Descriptions 字段区，actions 底脚仍由面板渲染；字段 ViewItem.render 仅无 view.render 时生效。自定义按钮 action(row) 可开 children 内 Modal（旁路）。不写时回落列＋表单",
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
    default: "20 / [10,20,50,100]",
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
    type: "ListResult / Partial<Query>",
    default: "-",
    description: "服务端预取首屏 / 初始查询（有 initial 时挂载后不再请求）",
  },
  {
    name: "caps",
    type: "Partial<Caps>",
    default: "按数据源推断",
    description:
      "能力开关：create／update／view／remove／batchStatus／import／…。batchStatus 不在 toolbar；默认＝存在 column.batch:true（switch＋两档 options）且有 setField。toolbar／column.actions 声明键请写明确 true｜false｜object",
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
    type: "(format, ctx) => void",
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
      "`false`＝整栏不渲染；省略／{}／Record＝统合 Record（废止 extra／order）。声明项写明确 true｜false｜object（省略键才回落 caps）；对象可 show／disable／icon／label／title／tone／action；写入序＝显示序。批量「设为…」不在 toolbar，见 caps.batchStatus＋column.batch",
  },

  {
    name: "isRowDisabled",
    type: "(row) => boolean",
    default: "!!row.locked",
    description: "行是否禁用选择／删除／行内编辑；缺省回落 row.locked",
  },
  {
    name: "selectable",
    type: "boolean",
    default: "（按需）",
    description:
      '@deprecated 顶层开关。优先在 columns 写 `{ type:"selection", prop:"__select", label:"" }` 控制多选列位置／有无。false＝强制去掉 selection；省略时若 needSelection（caps.remove／batchStatus）且 columns 未声明 selection，仍自动前置多选列。',
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
    description:
      "额外 class（加在卡片上）。移动端（max-width: 639.98px）自带：卡片 margin-top/left/right=0，.dp-table-wrap padding-top/left/right=0（表格贴边）；分页控件居中、条数文案在分页下方并居中（.dp-pg 列布局）；底栏分页尺寸移动 xs／桌面 md；桌面仍左右分布",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description:
      "面板根内额外内容。三级自定义第 1 级（旁路）：放自管 Modal，配合 toolbar／row／view.actions 的 action(row) 打开；保存后可 refreshDataPanel(panelKey)",
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
    type: "line | card",
    default: "line",
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

/** Columns 字段全表（Column） */
const COLUMNS_API: DocsApiTableRow[] = [
  {
    name: "prop",
    type: "string",
    default: "系统列可省",
    description:
      "行字段名。系统列可省（默认 `__select`／`__index`／`__actions`）。用 formatter／value 做的自定义列也可省（或写一个不在行数据上的键，如 `fullName`）。",
  },
  {
    name: "label",
    type: "string",
    default: "系统列可省",
    description:
      "表头文案。数据列建议必填；系统列可省（selection 空／列设置文案；index 默认 `#`；actions 回落 messages.actions）。",
  },
  {
    name: "type",
    type:
      '"text"|"number"|"money"|"date"|"datetime"|"tag"|"bool"|"image"|"link"|"selection"|"index"|"actions"',
    default: '"text"',
    description:
      '展示类型。系统列写 `{ type:"selection" }`／`{ type:"index" }`／`{ type:"actions" }` 即可（prop／label 可省）。操作按钮写在列的 `actions` Record；未声明时兼容自动补。',
  },
  {
    name: "actions",
    type: "RowActionsConfig",
    default: "-",
    description:
      '仅 type:"actions"。行操作 Record（写在本列，勿再顶层配置）：内置 view／edit／remove＋自定义；写入序＝显示序；自定义必须 action(item)；省略键回落 caps。',
  },
  {
    name: "format",
    type: "string",
    default: 'date→"YYYY-MM-DD"；datetime→"YYYY-MM-DD HH:mm:ss"',
    description:
      '日期／时间展示格式，仅 `type:"date"`／`"datetime"`。令牌：`YYYY` `MM` `DD` `HH` `mm` `ss`。例：`"YYYY-MM-DD HH:mm"` → `2026-11-10 10:30`（不要秒）。不覆盖 `formatter`／`value`／`renderCell`。',
  },
  {
    name: "sortable",
    type: "boolean",
    default: "false",
    description: "表头可点排序（走 list(query).sort／order）",
  },
  {
    name: "sortProp",
    type: "string",
    default: "用 prop",
    description:
      '该列排序时发给 list(query).sort 的字段。拼接列请指向源字段（姓名把姓放前面则 sortProp: "lastName"）。未写 prop 的自定义列必须指定才能排序。',
  },
  {
    name: "align",
    type: '"left"|"center"|"right"',
    default: '"center"',
    description:
      "单元格文本对齐。默认居中。系统列 selection／index／actions 固定居中，忽略本字段。",
  },
  {
    name: "headerAlign",
    type: '"left"|"center"|"right"',
    default: "同 align；皆未设则为 center",
    description:
      '表头标题对齐。不传时与 align 一致；二者皆未设则居中。系统列忽略。例：金额单元格右对齐可写 align:"right"；表头单独居中可再写 headerAlign:"center"。',
  },
  {
    name: "width",
    type: "number",
    default: "-",
    description:
      "列宽（px）。与 minWidth／maxWidth 一并写到表头与单元格 style。",
  },
  {
    name: "minWidth",
    type: "number",
    default: "-",
    description:
      "列最小宽度（px）。与 width／maxWidth 一并写到表头与单元格 style。",
  },
  {
    name: "maxWidth",
    type: "number",
    default: "-",
    description:
      "列最大宽度（px）。与 width／minWidth 一并写到表头与单元格 style。",
  },
  {
    name: "options",
    type: "Option[]",
    default: "-",
    description:
      "声明式选项：`{ value, label, tone? }`。tag 色／文案；inline switch／select／multiselect 也用。",
  },
  {
    name: "inline",
    type:
      '"switch"|"select"|"multiselect"|"text"|"number"|"textarea"|"date"|"datetime"',
    default: "-",
    description:
      "列内就地编辑（≠ form Modal）。switch 点即存；其余双击进入，失焦／Enter 存、Esc 取消。",
  },
  {
    name: "edit",
    type: "boolean",
    default: "-",
    description:
      "@deprecated：true 且未写 inline 时 → 两档 options 用 switch，否则 text。请直接写 inline。",
  },
  {
    name: "total",
    type: "boolean",
    default: "-",
    description: "页脚合计：显示 list() 返回的 totals[prop]",
  },
  {
    name: "hidden",
    type: "boolean",
    default: "-",
    description:
      '默认隐藏，可在「列设置」打开；例 `{ prop:"createdAt", type:"datetime", format:"YYYY-MM-DD HH:mm", hidden:true }`',
  },
  {
    name: "noExport",
    type: "boolean",
    default: "-",
    description: "不参与导出／打印列",
  },
  {
    name: "batch",
    type: "boolean",
    default: "-",
    description:
      '批量「设为…」目标列；须 `inline:"switch"`＋恰好两档 options。caps.batchStatus 默认据此推断。',
  },
  {
    name: "value",
    type: "(row) => unknown",
    default: "-",
    description:
      "按行文案／节点。可返回 string／number／JSX／Icon／可信 HTML。与 formatter 并存以 formatter 为准；renderCell[prop] 最优先。",
  },
  {
    name: "color",
    type: "(row) => Tone",
    default: "-",
    description:
      "按行色调。仅当 value／formatter 结果为原始文本时包成 dp-tag。",
  },
  {
    name: "formatter",
    type: "(row, raw) => unknown",
    default: "-",
    description:
      "统一格式化，覆盖默认展示与 value。导出／打印／详情只取可转文本结果；节点／HTML 回落字段原文。比 format 字段更自由，复杂节点用本字段。",
  },
];

/** Search 字段全表（SearchField） */
const SEARCH_API: DocsApiTableRow[] = [
  {
    name: "prop",
    type: "string",
    default: "-",
    description: "字段键（与 columns.prop／URL query key 对齐）；缺省回落 name",
  },
  {
    name: "name",
    type: "string",
    default: "-",
    description: "@deprecated 用 prop；二者都写以 prop 为准",
  },
  {
    name: "label",
    type: "string",
    default: "同 prop 的 column.label",
    description: "标签；缺省从同 prop 列继承",
  },
  {
    name: "type",
    type: '"text"|"select"|"date"',
    default: '"text"',
    description: "控件类型",
  },
  {
    name: "options",
    type: "Option[]",
    default: "同 prop 的 column.options",
    description: "select 选项；缺省从列继承",
  },
  {
    name: "match",
    type: '"contains"|"eq"|"from"|"to"|"num"',
    default: "text→contains；select→eq",
    description: "本地数据源匹配方式",
  },
  {
    name: "field",
    type: "string",
    default: "prop／name",
    description: "行字段名（过滤读行时用）",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "输入占位",
  },
  {
    name: "hint",
    type: "string",
    default: "-",
    description: "下方提示；有校验错误时隐藏",
  },
  {
    name: "rules",
    type: "FieldRule[]",
    default: "-",
    description:
      "校验规则：required／min／max／pattern／type(string|number|email|url)／validator／message／trigger",
  },
  {
    name: "message",
    type: "string",
    default: "-",
    description: "无 rules 时简写 required／pattern 失败文案",
  },
  {
    name: "required",
    type: "boolean",
    default: "-",
    description: "搜索必填（无 rules 简写）",
  },
  {
    name: "pattern",
    type: "string",
    default: "-",
    description: "搜索正则简写",
  },
  {
    name: "span / cols",
    type: "number",
    default: "12",
    description: "栅格跨列 1–12；同写以 span 为准",
  },
  {
    name: "width",
    type: "string | number",
    default: "-",
    description: "控件宽度（CSS 长度或 px 数字）",
  },
  {
    name: "maxlength",
    type: "number",
    default: "-",
    description: "输入最大字符数",
  },
];

/** Form 字段全表（FormField） */
const FORM_API: DocsApiTableRow[] = [
  {
    name: "prop",
    type: "string",
    default: "-",
    description: "字段键（与 columns.prop 对齐）；缺省回落 name",
  },
  {
    name: "name",
    type: "string",
    default: "-",
    description: "@deprecated 用 prop；二者都写以 prop 为准",
  },
  {
    name: "label",
    type: "string",
    default: "同 prop 的 column.label",
    description: "标签；缺省从列继承",
  },
  {
    name: "type",
    type:
      '"text"|"textarea"|"number"|"select"|"multiselect"|"switch"|"password"|"date"|"datetime"',
    default: '"text"',
    description: "控件类型",
  },
  {
    name: "options",
    type: "Option[]",
    default: "同 prop 的 column.options",
    description: "select／switch／multiselect 选项；缺省从列继承",
  },
  {
    name: "required",
    type: "boolean",
    default: "-",
    description: "必填简写（亦可用 rules）",
  },
  {
    name: "min / max",
    type: "number",
    default: "-",
    description: "number→数值界；否则字符串长度界（简写）",
  },
  {
    name: "pattern",
    type: "string",
    default: "-",
    description: "正则简写；复杂用 rules",
  },
  {
    name: "placeholder",
    type: "string",
    default: "-",
    description: "输入占位",
  },
  {
    name: "hint",
    type: "string",
    default: "-",
    description: "下方提示；有校验错误时隐藏",
  },
  {
    name: "rules",
    type: "FieldRule[]",
    default: "-",
    description:
      "校验规则数组：required／min／max／pattern／type／validator／message／trigger；有 rules 优先",
  },
  {
    name: "message",
    type: "string",
    default: "-",
    description: "简写校验失败默认文案",
  },
  {
    name: "initial",
    type: "string | number | boolean",
    default: "-",
    description: "新建时初始值",
  },
  {
    name: "createOnly",
    type: "boolean",
    default: "-",
    description: "仅新建时显示；编辑时不渲染、不校验、不提交（如密码）",
  },
  {
    name: "editOnly",
    type: "boolean",
    default: "-",
    description: "仅编辑时显示；新建时不渲染",
  },
  {
    name: "span / cols",
    type: "number",
    default: "12",
    description: "栅格跨列 1–12；任一字段写 span／cols／width 时容器切 12 列",
  },
  {
    name: "width",
    type: "string | number",
    default: "-",
    description: "项宽度（CSS 长度或 px）",
  },
  {
    name: "maxlength",
    type: "number",
    default: "-",
    description: "输入最大字符数（text／textarea／password）",
  },
  {
    name: "rows",
    type: "number",
    default: "4",
    description: "textarea 行数",
  },
  {
    name: "onOff",
    type: "[string, string]",
    default: '["true","false"]',
    description:
      "@deprecated switch 默认吃同 prop 列两档 options；仅无对应列时再写 onOff",
  },
  {
    name: "render",
    type: "(ctx: FormFieldRenderCtx) => unknown",
    default: "-",
    description:
      "字段级自定义控件。有 form.render 时忽略。ctx 含 value／multiValue／mode／row／disabled／error",
  },
];

/** FormConfig 段级（与 FormField 表分开） */
const FORM_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "title",
    type: "string | (row) => string",
    default: "`${edit|add} · ${panelTitle}`",
    description: "弹层标题；新增时 row 为 {}",
  },
  {
    name: "props",
    type: "FormField[]",
    default: "-",
    description:
      "表单项；有 render 时可省略。仍提供时内置 submit() 可按 props 校验／收集",
  },
  {
    name: "render",
    type: "(ctx: FormRenderCtx) => unknown",
    default: "-",
    description:
      "整段替换增改 Modal 主体（含确定／取消）。优先级高于 FormField.render。ctx：mode／row／id／busy／errors／close／submit／reload…",
  },
  {
    name: "actions",
    type: "RowActionsConfig",
    default: "-",
    description: "可选底部按钮 Record（内置 formBody 仍用确定／取消）",
  },
];

/** ViewConfig 段级 */
const VIEW_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "title",
    type: "string | (row) => string",
    default: "`${view} · ${panelTitle}`",
    description: "详情弹层标题",
  },
  {
    name: "props",
    type: "ViewItem[]",
    default: "-",
    description:
      "详情字段；有 render 时可省略。字段可写 ViewItem.render／click",
  },
  {
    name: "render",
    type: "(ctx: ViewRenderCtx) => unknown",
    default: "-",
    description:
      "替换 Descriptions 字段区；actions 底脚仍渲染。有本字段时忽略 ViewItem.render。ctx：row／close／reload",
  },
  {
    name: "actions",
    type: "RowActionsConfig",
    default: "{ close: true }",
    description:
      "底部按钮；内置 close 默认靠右最后。旁路可 action(row) 开 children Modal",
  },
];

const SOURCE_API: DocsApiTableRow[] = [
  {
    name: "list(query)",
    type: "ListResult | Promise<…>",
    default: "-",
    description:
      "返回当前页 { items, total, totals? }；query = { page, pageSize, sort, order: asc|desc, filters }",
  },
  {
    name: "sync",
    type: "boolean",
    default: "false",
    description:
      "默认 false（异步 list／fetch）。仅当 list 同步返回时可置 true，便于首帧（含 SSR）直接渲染",
  },
  {
    name: "create(values)",
    type: "WriteResult",
    default: "-",
    description:
      "返回 void / { ok:true } 表示成功；{ ok:false, message?, fields?, messages? } 把错误回填到表单；抛错也会提示",
  },
  {
    name: "update(id, values)",
    type: "WriteResult",
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

/** createApiDataSource／ApiDataSource 补充 */
const API_SOURCE_API: DocsApiTableRow[] = [
  {
    name: "createApiDataSource(opts)",
    type: "(opts) => ApiDataSource",
    default: "-",
    description:
      '工厂。必填 baseRoute；推荐只传 "/api"，未传 resource 时自动拼当前页面路由。返回异步 DataSource（list／create／update／remove／importRows／view）',
  },
  {
    name: "opts.baseRoute",
    type: "string",
    default: "-",
    description:
      '如 "/api" 或 "/api/users"。去首尾 / 分段：≥2 段直接作资源根；仅 1 段再拼 resource，未传则拼当前页面路由',
  },
  {
    name: "opts.resource",
    type: "string",
    default: "-",
    description:
      '资源名（如 "users" 或 "rbac/admins"）。仅 baseRoute 1 段时生效；≥2 段忽略。不传则自动使用当前页面路由',
  },
  {
    name: "opts.apiMode",
    type: '"action" | "restful"',
    default: '"action"',
    description:
      "action：GET 根；POST 根/create；POST 根/update?id=；POST 根/remove?id=；GET 根/view?id=；importRows→POST 根/create 且 body { rows }。restful：GET/POST 根；PUT/DELETE 根/:id；GET 根/:id；importRows→POST 根/import",
  },
  {
    name: "opts.rowKey",
    type: "string",
    default: '"id"',
    description: "主键字段（action update body／restful URL :id）",
  },
  {
    name: "opts.pageSize",
    type: "number",
    default: "20",
    description:
      "列表请求默认每页条数。list 在 query.pageSize 缺失时用此值；DataPanel 未传 pageSize 时也用它",
  },
  {
    name: "opts.fetch / headers / credentials / writable",
    type: "typeof fetch / HeadersInit｜fn / RequestCredentials / boolean",
    default: "global fetch / - / - / true",
    description: "可注入 fetch；writable:false 时只读（仅 list＋view）",
  },
  {
    name: "view(id)",
    type: "Promise<Row | null>",
    default: "-",
    description:
      "ApiDataSource 扩展。action→GET …/view?id=；restful→GET …/:id。点击查看时自动请求，失败或返回空则回落当前行",
  },
  {
    name: "root / apiMode",
    type: "string / ApiMode",
    default: "-",
    description: "只读：资源根（如 /api/users）与当前模式",
  },
];

const apiActionCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, SearchField } from "@dreamer/ui-view/data-display";

// 推荐：baseRoute 只传 "/api"，自动拼当前页面路由（打开 /rbac/admins → /api/rbac/admins）
// 也可把完整根写在 baseRoute（≥2 段直接作根，不拼 resource／当前路由）
// 默认 apiMode:"action"：GET 根 · POST …/create｜update｜remove
// importRows → POST …/create，body { rows }（单条 create 仍传对象）

const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  { prop: "role", label: "角色", type: "tag", align: "center", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "editor", label: "编辑", tone: "info" },
    { value: "viewer", label: "访客", tone: "default" },
  ] },
  { prop: "status", label: "状态", type: "tag", inline: "switch", batch: true, align: "center", options: [
    { value: "active", label: "启用", tone: "success" },
    { value: "disabled", label: "停用", tone: "warning" },
  ] },
  { prop: "balance", label: "余额", type: "money", sortable: true, total: true, align: "right" },
  { prop: "createdAt", label: "创建时间", type: "datetime", format: "YYYY-MM-DD HH:mm", hidden: true },
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
  title="用户（action）"
  panelKey="demo-api-users-action"
  baseRoute="/api/users"
  // apiMode 默认 "action"
  columns={columns}
  search={search}
  form={form}
  pageSize={20}
/>
`;

const apiRestfulCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column, FormField, SearchField } from "@dreamer/ui-view/data-display";

// 不传 data、不传 dataSource；baseRoute ≥2 段直接作资源根
// apiMode:"restful"：GET/POST /api/orders · PUT/DELETE /api/orders/:id · import → POST …/import

const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  { prop: "role", label: "角色", type: "tag", align: "center", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "editor", label: "编辑", tone: "info" },
    { value: "viewer", label: "访客", tone: "default" },
  ] },
  { prop: "status", label: "状态", type: "tag", inline: "switch", batch: true, align: "center", options: [
    { value: "active", label: "启用", tone: "success" },
    { value: "disabled", label: "停用", tone: "warning" },
  ] },
  { prop: "balance", label: "余额", type: "money", sortable: true, total: true, align: "right" },
  { prop: "createdAt", label: "创建时间", type: "datetime", format: "YYYY-MM-DD HH:mm", hidden: true },
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
  title="订单（restful）"
  panelKey="demo-api-orders-restful"
  baseRoute="/api/orders"
  apiMode="restful"
  columns={columns}
  search={search}
  form={form}
  pageSize={20}
/>
`;

const importCode = `import { DataPanel } from "@dreamer/ui-view/data-display";

const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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

const columnsCode = `const rows = [
  { id: "1", name: "Alice", role: "admin", status: "active", balance: 120, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "2", name: "Bob", role: "editor", status: "disabled", balance: 80, createdAt: "2026-01-02T00:00:00.000Z" },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];
// search／form 键用 prop；label／options／switch 开闭从同 prop 列继承
const search = {
  props: [
  { prop: "name" }, { prop: "role", type: "select" }, { prop: "status", type: "select" },
  ],
};
const form = {
  props: [
  { prop: "name", required: true },
  { prop: "role", type: "select", required: true },
  { prop: "status", type: "switch", initial: "active" },
  ],
};
// 函数式列显示见「列显示函数」示例（value／color／formatter）
<DataPanel title="列定义" data={rows} columns={columns} search={search} form={form} />
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
const colFnCode = `const rows = [
  { id: "1", name: "Alice", flag: 1, level: 1 },
  { id: "2", name: "Bob", flag: 0, level: 0 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名" },
  {
    prop: "flag", label: "标记", type: "tag",
    value: (row) => row.flag === 1 ? "开启" : "关闭",
    color: (row) => row.flag === 1 ? "success" : "danger",
  },
  {
    prop: "level", label: "级别",
    value: (row) => row.level === 1
      ? <span class="inline-flex items-center gap-1 text-emerald-600"><IconCheck /> 高级</span>
      : <span class="inline-flex items-center gap-1 text-slate-400"><IconBan /> 普通</span>,
  },
  {
    prop: "flag", label: "HTML",
    formatter: (_row, raw) => raw === 1
      ? '<b style="color:#059669">ON</b>'
      : '<span style="color:#94a3b8">OFF</span>',
  },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];
<DataPanel title="列函数显示" data={rows} columns={columns}
  search={{ title: "筛选用户", props: [{ prop: "name" }] }}
  form={{
    title: (row) => row.id ? \`修改 · \${row.name}\` : "添加用户",
    props: [
      { prop: "name", required: true },
      { prop: "flag", type: "number", initial: 0 },
      { prop: "level", type: "number", initial: 0 },
    ],
  }}
  view={{
    title: (row) => \`详情 · \${row.name}\`,
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
  caps={{ create: false, remove: false }} />`;

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
const joinNameCode = `const rows = [
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
    formatter: (row) =>
      \`\${row.lastName ?? ""}\${row.firstName ?? ""}\` || "—",
  },
];
<DataPanel title="拼接列" data={rows} columns={columns} />
`;

const basicCode = `const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  panelKey="demo-basic"
  title="用户管理"
  data={rows}
  columns={columns}
  search={search}
  form={form}
/>`;

const searchCode = `const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];
const search = {
  title: "筛选条件",
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

// 分页／排序默认写地址栏；配置 search → 工具栏搜索字段一并同步（无开关）
<DataPanel title="用户" data={rows} columns={columns} search={search}
  initialQuery={{ filters: { role: "admin" } }} />`;

const syncUrlCode =
  `// 地址栏同步：page／pageSize／sort 默认写；配置 search 后搜索字段一并同步（无开关）
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  panelKey="demo-sync-url"
  title="用户管理"
  data={rows}
  columns={columns}
  search={search}
/>`;

const tableCode =
  `// 排序／合计／行内编辑／隐藏列；禁用行优先 isRowDisabled（兼容 row.locked）
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120, locked: true },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  { prop: "email", required: true, pattern: "^[^@\s]+@[^@\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

<DataPanel title="表格" data={rows} columns={columns} form={form}
  defaultSort={{ prop: "balance", order: "desc" }}
  isRowDisabled={(row) => !!row.locked} />`;

const crudCode = `const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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

// 新增／编辑／查看 Modal；删除／批量设为走 Popconfirm
<DataPanel title="CRUD" data={rows} columns={columns} form={form}
  onDataChange={(next) => console.log(next)} />`;

const batchCode =
  `// 勾选 → 批量条。设为… 来自 column.batch:true（非首个 switch 隐式推导）
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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

<DataPanel title="批量" data={rows} columns={columns} form={form} />`;

const pageCode = `const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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

<DataPanel title="分页" data={rows} columns={columns} pageSize={5} pageSizes={[5, 10, 20]} />
// 翻页／改条数自动写 ?page=／?pageSize=（无 search 也同步；page=1 与默认 pageSize 省略）`;

const exportCode = `const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  { prop: "email", required: true, pattern: "^[^@\s]+@[^@\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

// 工具栏导出 xlsx／csv／json／xml／html；导入下拉 xlsx／csv／json／xml（无 html）再选文件
<DataPanel title="导出导入" data={rows} columns={columns} exportName="users" />

// 也可只用导出函数
import { buildExportFile } from "@dreamer/ui-view/data-display";
const messages = {}; // 可传 DataPanel messages；空对象＝内置 zh-CN 文案
const file = buildExportFile({ format: "xlsx", title: "用户", basename: "users", columns, rows, messages });
// file = { filename, mime, data: Uint8Array | string }`;

const cellCode = `// 单元格编辑（inline）
// inline＝列内就地编辑（双击单元格进入编辑器），区别于工具栏／行操作打开的 form Modal。
// column.inline 指定编辑器类型：
//   text / number / textarea / date / datetime / select（单选，需 options）/ multiselect（多选，需 options）
//   switch：点击即切换；失焦或 Enter 保存并回到展示态；Esc 取消并恢复原值
//   保存失败（dataSource.setField / update 返回失败）：弹出错误提示并保持原值
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
const statusOptions = [
  { value: "active", label: "启用", tone: "success" },
  { value: "disabled", label: "停用", tone: "warning" },
];
const rows = [
  { id: "1", name: "Alice", score: 10, role: "admin", tags: ["vip"], status: "active",
    birthday: "1990-01-10", loginAt: "2026-01-01T09:30:00.000Z", remark: "第 1 位用户的备注" },
  { id: "2", name: "Bob", score: 25, role: "editor", tags: ["new", "beta"], status: "disabled",
    birthday: "1991-02-11", loginAt: "2026-01-02T10:30:00.000Z", remark: "第 2 位用户的备注" },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", inline: "text" },
  { prop: "score", label: "积分", type: "number", inline: "number", align: "right" },
  { prop: "role", label: "角色", type: "tag", inline: "select", options: roleOptions },
  { prop: "tags", label: "标签", type: "tag", inline: "multiselect", options: tagOptions },
  { prop: "status", label: "状态", type: "tag", inline: "switch", options: statusOptions },
  { prop: "birthday", label: "生日", type: "date", inline: "date" },
  { prop: "loginAt", label: "最近登录", type: "datetime", inline: "datetime" },
  { prop: "remark", label: "备注", inline: "textarea" },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];
// 本地：data={rows}；若要拦截保存失败等，可改 dataSource（如 createLocalDataSource）
<DataPanel title="单元格编辑" data={rows} columns={columns} />`;

const remoteCode = `// 前端 list＋fetch（不实现服务端；路径／字段按接口改）
const source: DataSource = {
  sync: false, // 异步 fetch：省略或 false；仅当 list 同步返回时才写 sync: true
  async list(q) {
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    if (q.sort) {
      params.set("sort", q.sort);
      params.set("order", q.order); // "asc" | "desc"
    }
    // 搜索条件：filters 的 key＝search[].prop，值已是字符串
    for (const [k, v] of Object.entries(q.filters)) {
      if (v !== "") params.set(k, v);
    }
    const r = await fetch("/api/users?" + params.toString());
    if (!r.ok) throw new Error(await r.text() || r.statusText);
    const data = await r.json();
    // 约定返回 { items, total }；若后台是 { list, count } 等，在此映射即可
    return { items: data.items, total: data.total };
  },
  // 写操作按需提供；没有的能力面板会隐藏对应按钮
  async create(values) {
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!r.ok) throw new Error(await r.text() || r.statusText);
  },
  async update(id, values) {
    const r = await fetch("/api/users/" + encodeURIComponent(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!r.ok) throw new Error(await r.text() || r.statusText);
  },
  async remove(ids) {
    const r = await fetch("/api/users/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!r.ok) throw new Error(await r.text() || r.statusText);
    return await r.json(); // { removed, failed[] }
  },
};

// columns／search／form 与「基础用法」一致（操作列仅 view＋edit）
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  { prop: "role", label: "角色", type: "tag", align: "center", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "editor", label: "编辑", tone: "info" },
    { value: "viewer", label: "访客", tone: "default" },
  ] },
  { prop: "status", label: "状态", type: "tag", inline: "switch", batch: true, align: "center", options: [
    { value: "active", label: "启用", tone: "success" },
    { value: "disabled", label: "停用", tone: "warning" },
  ] },
  { prop: "balance", label: "余额", type: "money", sortable: true, total: true, align: "right" },
  { prop: "score", label: "积分", type: "number", sortable: true, inline: "number", align: "right" },
  { prop: "createdAt", label: "创建时间", type: "datetime", format: "YYYY-MM-DD HH:mm", sortable: true, hidden: true },
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
  { prop: "email", required: true },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

<DataPanel
  title="远程数据"
  dataSource={source}
  columns={columns}
  search={search}
  form={form}
/>`;

const themeCode =
  `// 浅色 / 深色：跟随根节点 .dark；深色面板主体用 CSS 变量 --dp-panel-body-bg（默认与 CodeBlock 相同的 slate-800/80）
// 工具栏按钮组：浅色灰白、深色 slate，相邻按钮只有一条淡分割线
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  { prop: "email", required: true, pattern: "^[^@\s]+@[^@\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

<div class="dark">
  <DataPanel title="用户管理" data={rows} columns={columns} search={search} form={form} />
</div>`;

const localeCode = `const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  { prop: "email", required: true, pattern: "^[^@\s]+@[^@\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

<DataPanel locale="en-US" title="Users" data={rows} columns={columns} search={search} form={form} />
// 覆盖部分文案（可叠在同一面板上）
<DataPanel
  locale="zh-CN"
  title="用户"
  data={rows}
  columns={columns}
  search={search}
  form={form}
  messages={{ create: "新建", deleteTitle: "删除确认" }}
/>`;

const toolbarOffCode =
  `// toolbar: false → 整栏工具栏不渲染（省略／Record 行为不变）
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  { prop: "email", required: true, pattern: "^[^@\s]+@[^@\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

<DataPanel
  toolbar={false}
  title="无工具栏"
  data={rows}
  columns={columns}
/>`;

const defaultsCode =
  `// 默认：省略 show→true、省略 disable→false；声明项不被 caps 藏
// caps.create=false，但声明 create:{} / { disable:true } 仍显示
// 节选：rows／columns 同「基础用法」
<DataPanel
  caps={{ create: false, update: false }}
  toolbar={{
    create: {},                 // 声明且未写 show → 显示（无视 caps.create=false）
    refresh: { disable: true }, // 显示但禁用
    // search 未声明 → 若无 search 项则 caps/回落不出现
  }}
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
    edit: { disable: true },    // 声明 → 显示且禁用（无视 caps.update=false）
    // view／remove 未声明 → 按 caps
  } },
  ]}
/>`;

const boolCode = `// ① true / false 简写控显隐（内置键）；未写的键仍按 caps 回落
// 节选：rows／columns 同「基础用法」
<DataPanel
  toolbar={{
    create: true,
    search: true,
    refresh: true,
    print: false,
    import: false,
    export: false,
  }}
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false, // 强制隐藏
  } },
  ]}
/>`;

const tbFnCode = `// ② toolbar：show / disable 无参函数（常接页面变量）
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "admin", status: "active", balance: 120 },
  { id: "2", name: "Bob", email: "bob@example.com", role: "editor", status: "disabled", balance: 80 },
];
const columns: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
    align: "center",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
    align: "right",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
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
  { prop: "email", required: true, pattern: "^[^@\s]+@[^@\s]+$" },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  { prop: "status", type: "switch", initial: "active" },
  ],
};

const pageFlags = { audit: true };
const pageAllowAudit = () => pageFlags.audit;
const hideChrome = {
  print: false, import: false, export: false,
  columns: false, density: false, fullscreen: false, copy: false,
};
<DataPanel
  title="工具栏函数"
  data={rows}
  columns={columns}
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
// 节选：rows／columns 同「基础用法」
<DataPanel
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
    view: false,
    edit: false,
    remove: false,
    assign: {
      label: "分配",
      show: (item) => true,                 // 始终可见
      disable: (item) => !!item.locked,     // locked 行禁用
      action: (item) => console.log("assign", item.id),
    },
  } },
  ]}
/>`;

const tbCustomCode = `// ④a 自定义工具钮：未知 key 必须有 action（缺则校验抛错）
// 节选：rows／columns 同「基础用法」
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
// 节选：rows／columns 同「基础用法」
<DataPanel
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
    view: true,
    clone: {
      label: "克隆",
      action: (item) => console.log("clone", item.id),
    },
    edit: true,
    remove: false,
  } },
  ]}
/>`;

const keyOrderCode =
  `// ⑤ 对象字面量写入序 = 显示序（create → audit → refresh → export）
// 节选：rows／columns 同「基础用法」
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

const enabledCode =
  `// disable：默认 false；true／函数 true＝禁用仍可见（≠ show:false）
// 节选：rows／columns 同「基础用法」
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
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
    view: true,
    edit: { disable: true },            // 内置：可见禁用
    remove: false,
    assign: {
      label: "分配",
      disable: (item) => !!item.locked, // locked 行禁用
      action: (item) => console.log(item.id),
    },
  } },
  ]}
/>`;

const titleCode =
  `// title／label 互落：tip=title??label??messages??key；显示=label??title??key
// 节选：rows／columns 同「基础用法」
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
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
    view: true,                         // 无 title → messages.view
    edit: { title: "改资料" },          // 覆盖
    remove: false,
    assign: {
      label: "分配",
      // 无 title → Tooltip「assign」
      action: (item) => console.log(item.id),
    },
  } },
  ]}
/>`;

const canCode =
  `// ⑥ 对齐 admin：can()＋显式 true｜false（勿 undefined 绕 caps）
// capGate(allow): allow→undefined（回落 caps）；!allow→false
// 节选：rows／search／form 同「基础用法」
const perms = { "demo.view": true, "demo.write": false };
const pageExport = true;

function can(code: "demo.view" | "demo.write") {
  return !!perms[code];
}
function capGate(allow: boolean): false | undefined {
  return allow ? undefined : false;
}

<DataPanel
  title="can()／页面变量"
  data={rows}
  search={search}
  form={form}
  columns={[
    ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
    { type: "actions", actions: {
      view: capGate(can("demo.view") || can("demo.write")),
      edit: capGate(can("demo.write")),
      remove: capGate(can("demo.write")),
      assign: {
        label: "分配",
        show: () => can("demo.write"),
        action: (item) => console.log(item.id),
      },
    } },
  ]}
  toolbar={{
    create: capGate(can("demo.write")),
    search: true,
    refresh: true,
    import: capGate(can("demo.write")),
    export: {
      show: () => can("demo.view"),
      disable: () => !pageExport,
    },
    print: false,
    columns: false,
    density: false,
    fullscreen: false,
    copy: false,
  }}
/>`;

const customCode =
  `// tone 全档(Button) / tip=label??key；确认写在 action 自管；前导 chrome 放面板外
// 节选：rows 同「基础用法」；本示例关掉内置操作，只留自定义「冻结」
<div>
  <span className="text-sm text-slate-500">面板外提示</span>
  <DataPanel
    title="自定义"
    data={rows}
    caps={{ create: false }}
    renderCell={{ name: (row) => <b>{String(row.name)}</b> }}
    toolbar={{
      notify: { label: "通知", tone: "primary", action: () => {} },
    }}
    columns={[
      ...DEMO_COLUMNS.filter((c) => c.type !== "actions"),
      { type: "actions", actions: {
        view: false,
        edit: false,
        remove: false,
        freeze: {
          label: "冻结",
          tone: "danger",
          action: (row) => console.log(row.id), // 需确认则在 action 内自开 Popconfirm
        },
      } },
    ]}
  />
</div>`;

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
import { Button } from "@dreamer/ui-view/basic";

<DataPanel
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
/>`;

/** FormField.render 示例源码（自定义字段用官方 Input／Password） */
const renderFieldCode =
  `import { DataPanel } from "@dreamer/ui-view/data-display";
import { Input } from "@dreamer/ui-view/form/input";
import { Password } from "@dreamer/ui-view/form/password";

<DataPanel
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
/>`;

const viewCode = `import { createSignal } from "@dreamer/view";
import { DataPanel, validateForm } from "@dreamer/ui-view/data-display";
import type { FormField } from "@dreamer/ui-view/data-display";
import { Form } from "@dreamer/ui-view/form/form";
import { FormItem } from "@dreamer/ui-view/form/form-item";
import { Password } from "@dreamer/ui-view/form/password";
import { Button } from "@dreamer/ui-view/basic";
import { Modal, toast } from "@dreamer/ui-view/feedback";

const pwd = createSignal(null);
const password = createSignal("");
const confirmPassword = createSignal("");
const pwdErrors = createSignal({});

const pwdForm: FormField[] = [
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

function openPwd(row) {
  pwd.value = row;
  password.value = "";
  confirmPassword.value = "";
  pwdErrors.value = {};
}

function closePwd() {
  pwd.value = null;
  password.value = "";
  confirmPassword.value = "";
  pwdErrors.value = {};
}

function submitPwd() {
  const errs = validateForm(
    pwdForm,
    { password: password.value, confirmPassword: confirmPassword.value },
    false,
    { required: "此项必填", min: "不能小于 {n}", max: "不能大于 {n}", patternMismatch: "格式不正确" },
  );
  if (Object.keys(errs).length) {
    pwdErrors.value = errs;
    return;
  }
  closePwd();
  toast.success("密码已修改");
}

<DataPanel
  title="用户管理"
  data={rows}
  columns={columnsWithViewOnly} // 操作列仅 view；勿挂 edit（本例未配 form）
  caps={{ create: false, update: false, remove: false }}
  view={{
    title: (row) => \`详情 · \${row.name}\`,
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
      { prop: "createdAt", label: "创建时间", type: "datetime", format: "YYYY-MM-DD HH:mm" },
    ],
    actions: {
      password: { label: "密码", action: (row) => openPwd(row) },
      site: { label: "主页", href: (row) => \`/u/\${row.id}\` },
      close: true,
    },
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
        <Button type="button" variant="primary" onClick={submitPwd}>确定</Button>
        <Button type="button" variant="default" onClick={closePwd}>取消</Button>
      </>
    }
  >
    <Form class="w-full" onSubmit={submitPwd}>
      <FormItem class="w-full" label="密码" required error={pwdErrors.value.password}>
        <Password class="w-full" value={password} newPassword autoComplete={true} placeholder="请输入密码" />
      </FormItem>
      <FormItem class="w-full" label="确认密码" required error={pwdErrors.value.confirmPassword}>
        <Password class="w-full" value={confirmPassword} newPassword autoComplete={true} placeholder="请再次输入密码" />
      </FormItem>
    </Form>
  </Modal>
</DataPanel>`;

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
  { prop: "status", label: "状态", type: "tag", inline: "switch", batch: true, align: "center", options: [
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
  `// —— 本地完整定义（含 rows）；服务端可省 data／用 dataSource + initial ——
const rows = [
  { id: "1", name: "Alice", email: "a@ex.com", role: "admin", status: "active", balance: 120, flag: 1, level: 1 },
  { id: "2", name: "Bob", email: "b@ex.com", role: "editor", status: "disabled", balance: 80, flag: 0, level: 0 },
];

const columns: Column[] = [
  { type: "selection" }, // 多选列（写入 columns）
  { type: "index" },     // 序号列
  { prop: "name", label: "姓名", sortable: true },
  // 声明式 options 仍可用
  { prop: "role", label: "角色", type: "tag", align: "center", options: [
    { value: "admin", label: "管理员", tone: "danger" },
    { value: "editor", label: "编辑", tone: "info" },
  ]},
  // 日期／时间 format（不要秒）；hidden 默认藏，列设置可开
  { prop: "createdAt", label: "创建时间", type: "datetime", format: "YYYY-MM-DD HH:mm", hidden: true },
  // 函数式：value／color／formatter → string｜Icon｜span｜JSX｜可信 HTML
  {
    prop: "flag", label: "标记", type: "tag",
    value: (row) => row.flag === 1 ? "开启" : "关闭",
    color: (row) => row.flag === 1 ? "success" : "danger",
  },
  {
    prop: "level", label: "级别",
    value: (row) => row.level === 1
      ? <span class="text-emerald-600"><IconCheck /> 高级</span>
      : <span class="text-slate-400">普通</span>,
  },
  {
    prop: "flag", label: "HTML",
    formatter: (_row, raw) => raw === 1
      ? '<b style="color:#059669">ON</b>'
      : '<span style="color:#94a3b8">OFF</span>',
  },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];

const search = {
  title: "筛选用户",
  props: [
    { prop: "name", placeholder: "姓名关键字", hint: "模糊匹配", maxlength: 40, span: 6 },
    { prop: "role", type: "select", span: 6 },
  ],
};

const form = {
  title: (row) => row.id ? \`修改 · \${row.name}\` : "添加用户",
  props: [
  {
    prop: "name", span: 6, maxlength: 20, placeholder: "请输入姓名", hint: "2–20 字",
    rules: [
      { required: true, message: "姓名不能为空" },
      { min: 2, max: 20, message: "长度 2–20" },
    ],
  },
  {
    prop: "email", span: 6, placeholder: "name@example.com",
    rules: [
      { required: true, message: "邮箱不能为空" },
      { type: "email", message: "邮箱格式不正确" },
    ],
  },
  { prop: "balance", type: "number", min: 0, max: 99999, span: 6, width: "100%" },
  { prop: "status", type: "switch", initial: "active", span: 6 },
  { prop: "note", type: "textarea", rows: 3, maxlength: 200, span: 12, cols: 12,
    placeholder: "备注", hint: "选填" },
  ],
};

<DataPanel
  title="用户管理"
  data={rows}                 // 本地：写全 rows；远程可改 dataSource + initial
  columns={columns}
  search={search}
  form={form}
  view={{
    title: (row) => \`详情 · \${row.name}\`,
    props: [
      { prop: "name", label: "姓名" },
      { prop: "email", label: "邮箱" },
    ],
  }}
/>`;

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
export const metadata = {
  title: "DataPanel 数据面板 · ui-view",
};

export default function DataDisplayDataPanel() {
  const remote: DataSource = createRemoteDemoSource(300);
  const cellSource: DataSource = createCellDemoSource();
  const actionHint = createSignal("");
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
          分页，以及用 Modal 的新增 / 编辑 / 查看。<strong>
            任何删除与批量「设为…」都必须先确认：行内／批量删除／批量设为均弹出小气泡
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
            search={{ props: DEMO_SEARCH }}
            form={{ props: DEMO_FORM }}
            exportName="users"
          />
        </DocsDemo>

        <DocsDemo
          title="列对齐（align / headerAlign）"
          code={`import { DataPanel } from "@dreamer/ui-view/data-display";
import type { Column } from "@dreamer/ui-view/data-display";

${ALIGN_DEMO_COLUMNS_CODE}

<DataPanel
  panelKey="demo-align"
  title="列对齐"
  data={rows}
  columns={columns}
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
            <code class="text-xs">{"{ items, total }"}</code>，
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
            <code class="text-xs">POST …/create｜update｜remove</code>
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
            <code class="text-xs">POST …/import</code>
            ）。
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
            请放面板外）。批量「设为…」由 <code>caps.batchStatus</code>＋列{" "}
            <code>batch:true</code> 控制，不在 toolbar。
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
            时整栏工具栏不出现；表格／分页仍渲染。移动端（≤639.98px）表格卡上／左／右贴边；分页控件居中，条数文案在分页下方并居中；底栏分页尺寸移动
            xs／桌面 md；桌面仍左右分布。
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
            {() =>
              actionHint.value ||
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
                "点「通知」／「冻结」直接跑 action（确认请在 action 自管）"}
            </p>
          </div>
        </DocsDemo>

        <DocsDemo title="查看详情（view）" code={viewCode}>
          <Paragraph class="mb-3 text-sm text-slate-600 dark:text-slate-400">
            <code class="text-xs">view</code> 与{" "}
            <code class="text-xs">form</code>／
            <code class="text-xs">search</code> 一样写成{" "}
            <code class="text-xs">{"{ title, props, actions? }"}</code>
            。<code class="text-xs">title</code> 是查看弹窗标题（
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
            <code class="text-xs">children</code> 里的自管 Modal。
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

const tab = createSignal("all");

{() => (
  <DataPanel
    panelKey="demo-tabs"
    title="用户管理"
    data={tab.value === "admin" ? admins : rows}
    columns={columns}
    search={{ props: search }}
    form={{ props: form }}
    exportName="users"
    activeTab={tab.value}
    onTabChange={(key) => (tab.value = key)}
    tabs={[
      { key: "all", label: "全部" },
      { key: "admin", label: "管理员" },
      {
        key: "stats",
        label: "统计",
        children: <p>当前共 {rows.length} 人</p>,
      },
    ]}
  />
)}`}
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
          />
          <CodeBlock
            title="缓存与刷新"
            code={`// 切换标签会回到第 1 页并重新请求。
// 已经请求过的组合（标签 + page / pageSize / 排序 / 搜索）会直接用内存缓存。
// 工具栏刷新、导入或增删改成功后，只作废当前标签的缓存并重新请求。`}
            language="tsx"
            wrapLongLines
          />
        </div>
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
      </section>

      <section class="space-y-3">
        <Title level={2}>Columns（Column）</Title>
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
        <Title level={2}>Search（SearchField）</Title>
        <DocsApiTable rows={SEARCH_API} />
      </section>

      <section class="space-y-3">
        <Title level={2}>Form（FormConfig / FormField）</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          优先级：
          <code class="text-xs">form.render</code>
          （整页）＞
          <code class="text-xs">FormField.render</code>
          （字段）＞ 内置控件；旁路层用{" "}
          <code class="text-xs">children</code>＋自定义{" "}
          <code class="text-xs">action</code>。
        </Paragraph>
        <Title level={3}>FormConfig</Title>
        <DocsApiTable rows={FORM_CONFIG_API} />
        <Title level={3}>FormField</Title>
        <DocsApiTable rows={FORM_API} />
      </section>

      <section class="space-y-3">
        <Title level={2}>View（ViewConfig）</Title>
        <DocsApiTable rows={VIEW_CONFIG_API} />
      </section>

      <section class="space-y-3">
        <Title level={2}>数据源（DataSource）</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          拉数优先级：显式 <code class="text-xs">dataSource</code>
          {" ＞ 传入 "}
          <code class="text-xs">data</code>
          （本地源、不自动请求）＞ 二者皆无且给了{" "}
          <code class="text-xs">baseRoute</code>
          时才 <code class="text-xs">createApiDataSource</code>
          拉 list（
          <code class="text-xs">baseRoute</code>
          ≥2 段直接作根；仅 1 段再拼 <code class="text-xs">resource</code>
          ）。导入仍可用 <code class="text-xs">onImportRows</code>
          逃生。
        </Paragraph>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          <strong>action</strong>（默认）：资源根{" "}
          <code class="text-xs">GET</code>；
          <code class="text-xs">POST …/create</code>（单条对象）／
          <code class="text-xs">…/update</code>（body 含 id）／
          <code class="text-xs">…/remove</code>（
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
          <code class="text-xs">根/:id</code>（批量 remove 逐条 DELETE）；
          <code class="text-xs">GET 根/:id</code> 明细；
          <code class="text-xs">importRows</code>→
          <code class="text-xs">POST 根/import</code>。
        </Paragraph>
        <DocsApiTable rows={SOURCE_API} nameColumnHeader="方法" />
        <Title level={3}>createApiDataSource</Title>
        <DocsApiTable rows={API_SOURCE_API} nameColumnHeader="项" />
      </section>

      <DocsMessagesSection
        interfaceName="Messages"
        defaultExportName="defaultDataPanelMessages"
        rows={MESSAGES_DATA_PANEL}
      />
    </div>
  );
}
