/**
 * DataPanel／DataView 文档 API：具名类型的属性表。
 * 数据面板页沿用已有的 Column／Search／Form／View／DataSource 章节，
 * 其余类型由 DocsTypeApiSections 追加；数据详情页复用同一份表。
 */
import type { DocsApiTableRow } from "../components/DocsApiTable.tsx";
import {
  MESSAGES_MODAL,
  MESSAGES_PAGINATION,
} from "./component-messages-rows.ts";

export const COLUMNS_API: DocsApiTableRow[] = [
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
    description:
      "页脚合计：由面板根据行数据自动求和，不使用 list()／接口返回的 totals。只传 data（本地源）时对当前过滤结果全集求和；分页接口／自定义源只对当前已加载的行求和，不会为合计偷偷拉全量",
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
    name: "disable",
    type: "boolean | ((row) => boolean)",
    default: "false",
    description:
      '按行禁用，函数接收当前行数据。写在 type:"selection" 上时该行不可勾选（表头全选会跳过），也不能进入批量处理；写在 type:"actions" 上时该行操作按钮全部禁用（可与各 action.disable 叠加）；写在数据列上时禁用该行列内编辑。与面板 isRowDisabled／row.locked 叠加。',
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
    type: '(row) => "success" | "warning" | "danger" | "info" | "default"',
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
  {
    name: "fixed",
    type: '"left"',
    default: "-",
    description: "将列固定在表格左侧，横向滚动时保持可见",
  },
  {
    name: "ellipsis",
    type: "boolean",
    default: "false",
    description:
      "单元格超出宽度时截断并显示省略号；宜同时给出 width 或 maxWidth",
  },
  {
    name: "defaultSortOrder",
    type: '"ascend" | "descend"',
    default: "-",
    description: "该列的默认排序方向",
  },
];

/** Search 字段全表（SearchField） */
/** SearchConfig 段级 */
/** form／search／view 共用的弹层透传 + 自动全屏字段 */
export const CONFIG_MODAL_AND_AUTO_ROWS: DocsApiTableRow[] = [
  {
    name: "modal",
    type: "DataChromeModalConfig",
    default: "-",
    description:
      "透传给 Modal 的参数（width、maxHeight、fullscreenable、centered、draggable、keyboard…）。未写 width 时面板缺省 md。open／onClose／title／children／footer／fullscreen 由面板接管，写入无效。打开是否全屏由下面的 autoFullscreen／mobileAutoFullscreen 决定。类型定义见 DataChromeModalConfig 表。",
  },
  {
    name: "autoFullscreen",
    type: "boolean",
    default: "false",
    description:
      "打开弹层时所有端自动全屏；关闭后重置。与 fullscreenable（写在 modal 上）独立。与 mobileAutoFullscreen 同时为 true 时以本项为准",
  },
  {
    name: "mobileAutoFullscreen",
    type: "boolean",
    default: "false",
    description:
      "打开弹层时仅移动端（视口 ≤639.98px / max-sm）自动全屏；电脑和平板仍为普通弹层。autoFullscreen 为 true 时所有端都全屏，本项不必再写",
  },
];

export const SEARCH_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "title",
    type: "string | () => string",
    default: "-",
    description: "搜索弹层标题",
  },
  {
    name: "props",
    type: "SearchField[]",
    default: "-",
    description: "搜索字段；与列同一套字段配置",
  },
  {
    name: "render",
    type: "(ctx: SearchRenderCtx) => unknown",
    default: "-",
    description:
      "替换搜索弹层字段区。ctx：values／errors／submit／reset／close。底部仍走官方脚（除非 footer:false）",
  },
  {
    name: "actions",
    type: "FooterActionsConfig",
    default: "-",
    description:
      "官方底部按钮 Record。内置 submit／reset（文案为搜索／重置）；自定义键写在它们旁边，reset 靠右最后。ctx：{ values, submit, reset, close }",
  },
  {
    name: "footer",
    type: "false",
    default: "-",
    description: "传 false 时不渲染官方底栏（自管底栏时用）",
  },
  ...CONFIG_MODAL_AND_AUTO_ROWS,
];

export const SEARCH_API: DocsApiTableRow[] = [
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
    type: '"text"|"select"|"multiselect"|"number"|"date"|"datetime"',
    default: '"text"',
    description:
      "控件类型。date／datetime 用 DatePicker／DateTimePicker（非原生 date input）；number 为普通文本输入（非 type=number）；multiselect 值为逗号串",
  },
  {
    name: "options",
    type: "Option[] | ((ctx) => Option[])",
    default: "同 prop 的 column.options",
    description:
      "select／multiselect 选项；缺省从列继承。也可 (ctx)=>… 做级联，ctx 为当前搜索表单值 { values }",
  },
  {
    name: "show",
    type: "boolean | ((ctx) => boolean)",
    default: "true",
    description: "是否显示；false／fn→false 时不渲染、不校验、不提交",
  },
  {
    name: "disabled",
    type: "boolean | ((ctx) => boolean)",
    default: "false",
    description: "是否禁用；仍显示，不可改",
  },
  {
    name: "render",
    type: "(ctx: SearchFieldRenderCtx) => unknown",
    default: "-",
    description:
      "字段级自定义控件。有 search.render 时忽略。ctx 含 value／multiValue／values／disabled／error",
  },
  {
    name: "match",
    type: '"contains"|"eq"|"from"|"to"|"num"',
    default:
      "text→contains；select／date／datetime→eq；number→num；multiselect 为包含全部所选",
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
    description:
      "栅格跨列 1–12；任一字段写 span／cols／width 时容器切 12 列，未写时缺省整行（12）。容器宽 ≤639.98px 时一律整行；同写以 span 为准。容器宽 ≤639.98px 时一律整行",
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
export const FORM_API: DocsApiTableRow[] = [
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
    type: "Option[] | ((ctx) => Option[])",
    default: "同 prop 的 column.options",
    description:
      "select／switch／multiselect 选项；缺省从列继承。也可 (ctx)=>… 做级联，ctx 为 { values, mode, row }",
  },
  {
    name: "show",
    type: "boolean | ((ctx) => boolean)",
    default: "true",
    description:
      "是否显示。false／fn→false 时不渲染、不校验、不提交。仍受 createOnly／editOnly 约束。ctx 为 { values, mode, row }",
  },
  {
    name: "disabled",
    type: "boolean | ((ctx) => boolean)",
    default: "false",
    description:
      "是否禁用；仍显示。ctx 同上，并写入 FormFieldRenderCtx.disabled",
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
    description:
      "栅格跨列 1–12；任一字段写 span／cols／width 时容器切 12 列，未写时缺省整行（12）。容器宽 ≤639.98px 时一律整行",
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
export const FORM_CONFIG_API: DocsApiTableRow[] = [
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
      "替换增改 Modal 主体。优先级高于 FormField.render。ctx：mode／row／id／busy／errors／close／submit／reload…。有 render 且未写 actions 时仍不渲染官方底栏；写了 actions 则官方脚会渲染（可用 footer:false 关掉）",
  },
  {
    name: "actions",
    type: "FooterActionsConfig",
    default: "-",
    description:
      "官方底部按钮 Record。内置 submit／cancel（保存／更新＋取消）；自定义键如 saveMore 可做「保存并继续」。cancel 靠右最后。ctx：{ values, mode, row, busy, submit, close }",
  },
  {
    name: "footer",
    type: "false",
    default: "-",
    description: "传 false 时不渲染官方底栏",
  },
  ...CONFIG_MODAL_AND_AUTO_ROWS,
];

/** ViewConfig 段级 */
export const VIEW_CONFIG_API: DocsApiTableRow[] = [
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
      "详情字段；有 render 时可省略。字段可写 ViewItem.render／click／labelAlign（标签对齐，透传 Descriptions）",
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
  ...CONFIG_MODAL_AND_AUTO_ROWS,
  {
    name: "descriptions",
    type: "ViewDescriptionsProps",
    default: "-",
    description:
      "透传给内置详情 Descriptions 的参数（column、size、bordered、layout、colon、labelAlign、labelColPercent、labelMinWidth…）。items／title 由面板接管：items 由 view.props 生成，title 是弹层／页面标题。本插槽缺省 column=1、size=sm、bordered=true。有 render 或 DataView children 时不生效。详见 ViewDescriptionsProps 表",
  },
];

/** view.descriptions 透传（不含 items／title） */
export const VIEW_DESCRIPTIONS_PROPS_API: DocsApiTableRow[] = [
  {
    name: "column",
    type: "number",
    default: "1（本插槽）",
    description:
      "内置详情 Descriptions 的栅格列数上限。本插槽缺省 1（整行一组标签+内容）；单独使用 Descriptions 时缺省 3。实际列数仍按容器宽度收敛：移动端 1 列，平板最多 2 列，电脑端用本值。有 render 时不生效",
  },
  {
    name: "bordered",
    type: "boolean",
    default: "true（本插槽）",
    description: "内置详情是否带边框。本插槽缺省 true；有 render 时不生效",
  },
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"sm"（本插槽）',
    description: "内置详情尺寸。本插槽缺省 sm；有 render 时不生效",
  },
  {
    name: "layout",
    type: '"horizontal" | "vertical"',
    default: '"horizontal"',
    description: "内置详情布局。有 render 时不生效",
  },
  {
    name: "colon",
    type: "boolean",
    default: "true",
    description: "内置详情标签后是否显示冒号。有 render 时不生效",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description:
      "加在内置详情 Descriptions 根节点上的额外 class。有 render 时不生效",
  },
  {
    name: "labelClass",
    type: "string",
    default: "-",
    description: "内置详情标签列 class。有 render 时不生效",
  },
  {
    name: "contentClass",
    type: "string",
    default: "-",
    description: "内置详情内容列 class。有 render 时不生效",
  },
  {
    name: "labelAlign",
    type: "DescriptionsLabelAlign",
    default: '{ vertical: "top", horizontal: "right" }',
    description:
      "内置详情各行标签的默认对齐，透传 Descriptions。vertical：top／center／bottom；horizontal：left／center／right。单项可用 ViewItem.labelAlign 覆盖。有 render 时不生效",
  },
  {
    name: "labelColPercent",
    type: "number",
    default: "38",
    description:
      "详情 Descriptions 标签列占单列槽位宽度的百分比（12～85），与 labelMinWidth 一起决定左侧标签与右侧内容的比例。有 render 时不生效",
  },
  {
    name: "labelMinWidth",
    type: "string | number",
    default: '"13.5rem"',
    description:
      "详情 Descriptions 标签列最小宽度（CSS 长度或像素数字）；适当减小可让内容区更宽。未指定时，容器宽度 ≤639.98px 自动改为 7rem。有 render 时不生效",
  },
];

/** ViewItem 字段级（其余写法同 Column） */
export const VIEW_ITEM_API: DocsApiTableRow[] = [
  {
    name: "prop",
    type: "string",
    default: "-",
    description:
      "字段键；也可不写 prop，用 formatter／value 拼接，写法同自定义列",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "标签文案",
  },
  {
    name: "render",
    type: "(ctx: ViewItemRenderCtx) => unknown",
    default: "-",
    description:
      "字段级自定义展示。有 view.render 时忽略。ctx：item／prop／row／raw／defaultNode",
  },
  {
    name: "click",
    type: '"toggle" | (row) => void',
    default: "-",
    description: "字段点击：toggle 在两档 options 间切换；或自定义回调",
  },
  {
    name: "labelAlign",
    type: "DescriptionsLabelAlign",
    default: '{ vertical: "top", horizontal: "right" }',
    description:
      "该行标签对齐，透传 Descriptions。vertical：top 上对齐、center 垂直居中、bottom 下对齐；horizontal：left 左、center 中、right 右",
  },
];

export const SOURCE_API: DocsApiTableRow[] = [
  {
    name: "list(query)",
    type: "ListResult | Promise<…>",
    default: "-",
    description:
      "返回当前页 { rows, total, totals? }；query = { page, pageSize, sort, order: asc|desc, filters }。解析接口时若无 rows 但有 items，仍接受 items。totals 仅为兼容字段：列配置 total: true 时，页脚由面板按行数据自算，不读取此字段",
  },
  {
    name: "view(id) / get(id)",
    type: "Promise<Row | null> | Row | null",
    default: "-",
    description:
      "按主键取单条。打开详情时优先 view，其次 get；失败或空则回落当前行。get 为 view 的别名（API 源二者等价）",
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
      "单条删除（行内／详情）。面板保证只在用户确认后才会调用。官方 API 源默认 POST …/remove（action）或 DELETE 根/:id（restful）。若直接传入多个 id，官方源改走 removeBatch",
  },
  {
    name: "removeBatch(ids)",
    type: "{ removed, failed[] }",
    default: "回落 remove",
    description:
      "批量删除（批量条）。缺省时面板回落 remove。官方 API 源默认 POST …/remote-batch",
  },
  {
    name: "setField(ids, field, value)",
    type: "{ removed, failed[] }",
    default: "-",
    description:
      "行内编辑（也可在自定义批量操作里调用）。无 setField 时回落按 id 调用 update。API 源已实现 POST …/setField",
  },
  {
    name: "importRows(rows)",
    type: "{ created, failed }",
    default: "-",
    description: "导入 CSV / JSON 解析后的行",
  },
];

/** createApiDataSource／ApiDataSource 补充 */
export const API_SOURCE_API: DocsApiTableRow[] = [
  {
    name: "createApiDataSource(opts)",
    type: "(opts) => ApiDataSource",
    default: "-",
    description:
      '工厂。必填 baseRoute；推荐只传 "/api"，未传 resource 时自动拼当前页面路由。返回异步 DataSource（list／view／get／create／update／remove／removeBatch／setField／importRows）',
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
      "action：GET 根；POST 根/create；POST 根/update?id=；POST 根/setField?id=（body { ids, id, field, value }）；单条删除 POST 根/remove?id=；批量删除 POST 根/remote-batch?id=；GET 根/view?id=；importRows→POST 根/create 且 body { rows }。restful：GET/POST 根；PUT／单条 DELETE 根/:id；批量删除 POST 根/remote-batch；GET 根/:id；POST 根/setField（body { ids, field, value }）；importRows→POST 根/import。路径可用 opts.removeAction／opts.batchRemoveAction 覆盖",
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
      "列表请求默认每页条数。list 在 query.pageSize 缺失时用此值；DataPanel 未写 pagination.pageSize 时也用它",
  },
  {
    name: "opts.fetch / headers / credentials / writable",
    type: "typeof fetch / HeadersInit｜fn / RequestCredentials / boolean",
    default: "global fetch / - / - / true",
    description:
      "可注入 fetch；writable:false 时只读（仅 list＋view／get，不挂 create／update／remove／removeBatch／setField／importRows）",
  },
  {
    name: "opts.removeAction",
    type: "string",
    default: '"remove"',
    description:
      "单条删除路径段或绝对路径。action：POST 此路径。restful：缺省仍是 DELETE 根/:id；显式传入后改为 POST 该路径。以 / 开头视为绝对路径，否则拼在资源根后",
  },
  {
    name: "opts.batchRemoveAction",
    type: "string",
    default: '"remote-batch"',
    description:
      "批量删除路径段或绝对路径（action 与 restful 均为 POST）。以 / 开头视为绝对路径，否则拼在资源根后",
  },
  {
    name: "view(id)",
    type: "Promise<Row | null>",
    default: "-",
    description:
      "按主键取单条。action→GET …/view?id=；restful→GET …/:id。点击查看时自动请求，失败或返回空则回落当前行",
  },
  {
    name: "get(id)",
    type: "Promise<Row | null>",
    default: "-",
    description: "view(id) 的别名",
  },
  {
    name: "setField(ids, field, value)",
    type: "Promise<{ removed, failed[] }>",
    default: "-",
    description:
      "writable 不为 false 时挂上。action：POST …/setField?id=，body { ids, id, field, value }；restful：POST …/setField，body { ids, field, value }",
  },
  {
    name: "root / apiMode",
    type: 'string / "action" | "restful"',
    default: "-",
    description: "只读：资源根（如 /api/users）与当前模式",
  },
];

export const ROW_API: DocsApiTableRow[] = [
  {
    name: "(行对象)",
    type: "Record<string, unknown>",
    default: "-",
    description:
      "一行数据的键值对。主键字段默认为 id，可由面板／详情的 rowKey 覆盖。",
  },
];

export const OPTION_API: DocsApiTableRow[] = [
  {
    name: "value",
    type: "string",
    default: "-",
    description: "选项值（写入行数据／筛选／表单）",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "展示文案",
  },
  {
    name: "tone",
    type: '"success" | "warning" | "danger" | "info" | "default"',
    default: "-",
    description: "标签色调，仅 tag 等展示使用",
  },
];

export const FIELD_RULE_API: DocsApiTableRow[] = [
  {
    name: "required",
    type: "boolean",
    default: "-",
    description: "必填",
  },
  {
    name: "min",
    type: "number",
    default: "-",
    description: "下限：number 字段为最小数值，否则为最小长度",
  },
  {
    name: "max",
    type: "number",
    default: "-",
    description: "上限：number 字段为最大数值，否则为最大长度",
  },
  {
    name: "pattern",
    type: "string | RegExp",
    default: "-",
    description: "正则",
  },
  {
    name: "type",
    type: '"string" | "number" | "email" | "url"',
    default: "-",
    description: "内置类型检查",
  },
  {
    name: "validator",
    type: "(value, values) => string | boolean | void",
    default: "-",
    description:
      "同步自定义校验。返回 string 为错误文案；false 用 message 或内置文案；true／void 通过",
  },
  {
    name: "message",
    type: "string",
    default: "-",
    description: "失败文案",
  },
  {
    name: "trigger",
    type: '"blur" | "change" | "submit"',
    default: "-",
    description: "触发时机（面板提交时一律校验；blur／change 预留）",
  },
];

export const ACTION_CTRL_API: DocsApiTableRow[] = [
  {
    name: "(boolean)",
    type: "boolean",
    default: "-",
    description:
      "直接写 true／false 只控制是否显示；disable 默认为 false（可点）",
  },
  {
    name: "show",
    type: "boolean | ((ctx) => boolean)",
    default: "true",
    description:
      "是否显示。省略为 true。ctx 随所在位置变化（工具栏为 PanelActionContext，详情工具栏为 ViewActionContext，表单／搜索底栏为对应 Context）",
  },
  {
    name: "disable",
    type: "boolean | ((ctx) => boolean)",
    default: "false",
    description: "为 true 时仍显示但不可点",
  },
  {
    name: "icon",
    type: "unknown",
    default: "-",
    description: "图标节点",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "无图标时的可见文案／无障碍名。省略则回落 title，再回落键名",
  },
  {
    name: "title",
    type: "string | ((ctx) => string)",
    default: "-",
    description:
      "Tooltip 文案；空串视为省略。最终 tip = title ?? label ?? 内置文案 ?? 键名。未写 label 时也用作显示文案",
  },
  {
    name: "tone",
    type:
      '"default" | "primary" | "secondary" | "success" | "warning" | "danger" | "ghost"',
    default: '"default"',
    description:
      "按钮色调（Button ColorVariant）。工具栏走 variant，行图标走悬停色",
  },
  {
    name: "action",
    type: "(ctx) => void",
    default: "-",
    description:
      "点击回调。内置键可省略（走默认行为）；自定义键必须提供，否则断言失败",
  },
];

export const PANEL_ACTION_CONTEXT_API: DocsApiTableRow[] = [
  {
    name: "selected",
    type: "Row[]",
    default: "-",
    description: "当前页已选中的行对象（不是 id）",
  },
  {
    name: "rows",
    type: "Row[]",
    default: "-",
    description: "当前页列表",
  },
  {
    name: "query",
    type: "Query",
    default: "-",
    description: "当前查询（页码、排序、筛选）",
  },
];

export const VIEW_ACTION_CONTEXT_API: DocsApiTableRow[] = [
  {
    name: "record",
    type: "Row | null",
    default: "-",
    description: "当前详情记录；尚未加载时为 null",
  },
];

export const FORM_ACTION_CONTEXT_API: DocsApiTableRow[] = [
  {
    name: "values",
    type: "Record<string, unknown>",
    default: "-",
    description: "当前表单值",
  },
  {
    name: "mode",
    type: '"create" | "edit"',
    default: "-",
    description: "新增或编辑",
  },
  {
    name: "row",
    type: "Row | null",
    default: "-",
    description: "编辑时为当前行；新增为 null",
  },
  {
    name: "busy",
    type: "boolean",
    default: "-",
    description: "提交中",
  },
  {
    name: "submit",
    type: "() => Promise<void>",
    default: "-",
    description: "走内置校验并提交（create／update）",
  },
  {
    name: "close",
    type: "() => void",
    default: "-",
    description: "关闭弹层",
  },
];

export const SEARCH_ACTION_CONTEXT_API: DocsApiTableRow[] = [
  {
    name: "values",
    type: "Record<string, unknown>",
    default: "-",
    description: "当前搜索表单值",
  },
  {
    name: "submit",
    type: "() => void",
    default: "-",
    description: "按当前值提交筛选",
  },
  {
    name: "reset",
    type: "() => void",
    default: "-",
    description: "清空并重置筛选",
  },
  {
    name: "close",
    type: "() => void",
    default: "-",
    description: "关闭搜索弹层",
  },
];

export const FOOTER_ACTIONS_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "(键)",
    type: "string",
    default: "-",
    description:
      "按钮键。写入序＝显示序。表单内置 submit／cancel；搜索内置 submit／reset",
  },
  {
    name: "(值)",
    type: "ActionCtrl<FormActionContext | SearchActionContext>",
    default: "-",
    description:
      "与工具栏同一套 ActionCtrl，上下文分别为 FormActionContext 或 SearchActionContext。自定义键必须提供 action",
  },
];

export const PANEL_TOOLBAR_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "(键)",
    type: "string",
    default: "-",
    description:
      "按钮键。写入序＝显示序。内置：create、search、refresh、print、import、export、columns、density、fullscreen、copy。省略的内置键回落 caps",
  },
  {
    name: "(值)",
    type: "ActionCtrl<PanelActionContext>",
    default: "-",
    description:
      "true／false 或对象。自定义键必须提供 action(ctx)，ctx 为 PanelActionContext",
  },
];

export const VIEW_TOOLBAR_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "(键)",
    type: "string",
    default: "-",
    description:
      "按钮键。写入序＝显示序。内置：update（可用 edit 别名）、remove、refresh、print、import、export、fullscreen、copy。省略的内置键回落 DataViewCaps",
  },
  {
    name: "(值)",
    type: "ActionCtrl<ViewActionContext>",
    default: "-",
    description:
      "true／false 或对象。show／disable／action 的 ctx 为 { record }。自定义键必须提供 action",
  },
];

export const BATCH_ACTION_CTRL_API: DocsApiTableRow[] = [
  {
    name: "(boolean)",
    type: "boolean",
    default: "-",
    description: "与 ActionCtrl 相同：true／false 只控制显示",
  },
  {
    name: "show / disable / icon / label / title / tone / action",
    type: "同 ActionCtrl",
    default: "-",
    description: "字段含义与 ActionCtrl 相同，ctx 为 PanelActionContext",
  },
  {
    name: "confirm",
    type: "string | ((ctx: PanelActionContext) => string)",
    default: "-",
    description: "非空时用官方 Popconfirm；省略或空串则点击立即执行 action",
  },
];

export const BATCH_BAR_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "(键)",
    type: "string",
    default: "-",
    description:
      "按钮键。写入序＝显示序。默认显示 remove（批量删除，回落 caps.remove）和 clear（取消勾选，靠右最后），不必写入配置。自定义批量操作由用户以自定义键＋action 自行编写",
  },
  {
    name: "(值)",
    type: "BatchActionCtrl",
    default: "-",
    description:
      "true／false 或对象（ActionCtrl 另可写 confirm）。自定义键必须提供 action；可按选中行 disable／confirm",
  },
];

export const ROW_ACTION_CTRL_API: DocsApiTableRow[] = [
  {
    name: "(boolean)",
    type: "boolean",
    default: "-",
    description: "true／false 只控制是否显示",
  },
  {
    name: "show",
    type: "boolean | ((item: Row) => boolean)",
    default: "true",
    description: "是否显示。item 为当前行",
  },
  {
    name: "disable",
    type: "boolean | ((item: Row) => boolean)",
    default: "false",
    description: "为 true 时仍显示但按钮禁用",
  },
  {
    name: "icon",
    type: "unknown",
    default: "-",
    description: "图标节点",
  },
  {
    name: "label",
    type: "string",
    default: "-",
    description: "可见／无障碍文案。省略则回落 title，再回落键名",
  },
  {
    name: "title",
    type: "string | ((item: Row) => string)",
    default: "-",
    description: "Tooltip。最终 tip = title ?? label ?? 内置文案 ?? 键名",
  },
  {
    name: "confirm",
    type: "string | ((item: Row) => string)",
    default: "-",
    description: "非空时包裹 Popconfirm；省略或空串则点击立即执行",
  },
  {
    name: "tone",
    type:
      '"default" | "primary" | "secondary" | "success" | "warning" | "danger" | "ghost"',
    default: '"default"',
    description: "按钮色调；内置 remove 默认 danger",
  },
  {
    name: "action",
    type: "(item: Row) => void",
    default: "-",
    description: "点击回调。内置键可省略；自定义键必须提供 action 或 href",
  },
  {
    name: "href",
    type: "string | ((item: Row) => string)",
    default: "-",
    description: "打开链接。自定义键可与 action 二选一",
  },
];

export const ROW_ACTIONS_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "(键)",
    type: "string",
    default: "-",
    description:
      '写在 Column.actions（type:"actions"）上。写入序＝显示序。内置：view、edit、remove。省略的内置键回落 caps',
  },
  {
    name: "(值)",
    type: "RowActionCtrl",
    default: "-",
    description:
      "true／false 或对象。show／disable／action／title／confirm 均可 (item)=>…",
  },
];

export const CAPS_API: DocsApiTableRow[] = [
  {
    name: "create",
    type: "boolean",
    default: "按数据源推断",
    description: "新增",
  },
  {
    name: "update",
    type: "boolean",
    default: "按数据源推断",
    description: "编辑",
  },
  {
    name: "view",
    type: "boolean",
    default: "按数据源推断",
    description: "查看详情",
  },
  {
    name: "remove",
    type: "boolean",
    default: "按数据源推断",
    description: "删除",
  },
  {
    name: "import",
    type: "boolean",
    default: "按数据源推断",
    description: "导入",
  },
  {
    name: "export",
    type: "boolean",
    default: "按数据源推断",
    description: "导出",
  },
  {
    name: "print",
    type: "boolean",
    default: "按数据源推断",
    description: "打印",
  },
  {
    name: "columns",
    type: "boolean",
    default: "true",
    description: "列设置",
  },
  {
    name: "density",
    type: "boolean",
    default: "true",
    description: "行高密度",
  },
  {
    name: "fullscreen",
    type: "boolean",
    default: "true",
    description: "面板全屏",
  },
  {
    name: "copy",
    type: "boolean",
    default: "true",
    description: "复制选中行",
  },
];

export const DATA_VIEW_CAPS_API: DocsApiTableRow[] = [
  {
    name: "update",
    type: "boolean",
    default: "按数据源推断",
    description: "工具栏更新／编辑",
  },
  {
    name: "remove",
    type: "boolean",
    default: "存在 dataSource.remove 则为 true",
    description: "工具栏删除当前记录（需确认）",
  },
  {
    name: "import",
    type: "boolean",
    default: "按数据源推断",
    description: "导入",
  },
  {
    name: "export",
    type: "boolean",
    default: "按数据源推断",
    description: "导出",
  },
  {
    name: "print",
    type: "boolean",
    default: "按数据源推断",
    description: "打印",
  },
  {
    name: "fullscreen",
    type: "boolean",
    default: "true",
    description: "全屏",
  },
  {
    name: "copy",
    type: "boolean",
    default: "true",
    description: "复制当前记录",
  },
];

export const QUERY_API: DocsApiTableRow[] = [
  {
    name: "page",
    type: "number",
    default: "1",
    description: "页码，从 1 起",
  },
  {
    name: "pageSize",
    type: "number",
    default: "20",
    description: "每页条数",
  },
  {
    name: "sort",
    type: "string",
    default: '""',
    description: "排序字段 prop；空表示未排序",
  },
  {
    name: "order",
    type: '"asc" | "desc"',
    default: '"asc"',
    description: "排序方向",
  },
  {
    name: "filters",
    type: "Record<string, string>",
    default: "{}",
    description: "搜索字段 → 原始字符串（仅非空）",
  },
];

export const LIST_RESULT_API: DocsApiTableRow[] = [
  {
    name: "rows",
    type: "Row[]",
    default: "-",
    description:
      "当前页行。解析接口时若无 rows 但有 items，仍接受 items；写出只用 rows",
  },
  {
    name: "total",
    type: "number",
    default: "-",
    description: "过滤后的总条数（不是当前页长度）",
  },
  {
    name: "totals",
    type: "Record<string, number>",
    default: "-",
    description:
      "兼容字段（列 prop → 数值）。页脚对 total: true 的列由面板按行数据自算，不读取此字段",
  },
];

export const WRITE_RESULT_API: DocsApiTableRow[] = [
  {
    name: "(成功／空)",
    type: "void | { ok: true }",
    default: "-",
    description: "成功。void 与 { ok: true } 同等对待",
  },
  {
    name: "ok",
    type: "false",
    default: "-",
    description: "失败时必须为 false",
  },
  {
    name: "message",
    type: "string",
    default: "-",
    description: "顶部错误文案",
  },
  {
    name: "fields",
    type: "string[]",
    default: "-",
    description: "出错的字段名",
  },
  {
    name: "messages",
    type: "Record<string, string>",
    default: "-",
    description: "字段名 → 错误文案",
  },
];

export const BULK_RESULT_API: DocsApiTableRow[] = [
  {
    name: "removed",
    type: "number",
    default: "-",
    description: "成功处理条数",
  },
  {
    name: "failed",
    type: "{ id: string; error: string }[]",
    default: "-",
    description: "失败项：主键与错误文案",
  },
];

export const IMPORT_RESULT_API: DocsApiTableRow[] = [
  {
    name: "created",
    type: "number",
    default: "-",
    description: "成功导入条数",
  },
  {
    name: "failed",
    type: "number",
    default: "-",
    description: "失败条数",
  },
];

export const SYNC_URL_API: DocsApiTableRow[] = [
  {
    name: "(boolean)",
    type: "boolean",
    default: "true",
    description:
      "false 关闭工具栏搜索与地址栏的双向同步；true 使用默认参数名（无前缀）",
  },
  {
    name: "prefix",
    type: "string",
    default: "-",
    description:
      '对象形式时给查询参数加前缀，避免同页多面板抢参数。例如 { prefix: "p1" }',
  },
];

export const DATA_CHROME_TAB_API: DocsApiTableRow[] = [
  {
    name: "key",
    type: "string",
    default: "-",
    description: "唯一键，会作为查询参数值并带到请求里",
  },
  {
    name: "label",
    type: "string | unknown",
    default: "-",
    description: "标签文案或自定义节点",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "禁用该标签",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description:
      "标签正文。省略时 DataPanel 展示默认表格，DataView 展示默认明细",
  },
];

export const DATA_PANEL_HANDLE_API_TYPE: DocsApiTableRow[] = [
  {
    name: "reload",
    type: "() => Promise<void>",
    default: "-",
    description: "重新拉取当前页（不写地址栏；等价 refreshDataPanel）",
  },
  {
    name: "getQuery",
    type: "() => Query",
    default: "-",
    description: "当前查询",
  },
  {
    name: "setQuery",
    type: "(patch: Partial<Query>) => void",
    default: "-",
    description: "合并查询并重新拉数（会按 syncUrl 写地址栏）",
  },
  {
    name: "getSelected",
    type: "() => Row[]",
    default: "-",
    description: "当前页已选中的行对象",
  },
  {
    name: "openForm",
    type: "(row?: Row) => void",
    default: "-",
    description: "打开新增（无参）或编辑表单",
  },
  {
    name: "openView",
    type: "(row: Row | string) => void",
    default: "-",
    description: "打开详情；可传行对象或主键",
  },
];

export const DATA_VIEW_HANDLE_API_TYPE: DocsApiTableRow[] = [
  {
    name: "reload",
    type: "() => Promise<void>",
    default: "-",
    description: "重新拉取当前记录",
  },
  {
    name: "getRecord",
    type: "() => Row | null",
    default: "-",
    description: "当前详情记录",
  },
  {
    name: "openForm",
    type: "(row?: Row) => void",
    default: "-",
    description: "打开编辑表单；无参则用当前记录",
  },
];

export const DESCRIPTIONS_LABEL_ALIGN_API: DocsApiTableRow[] = [
  {
    name: "vertical",
    type: '"top" | "center" | "bottom"',
    default: '"top"',
    description: "垂直方向：上对齐、居中、下对齐",
  },
  {
    name: "horizontal",
    type: '"left" | "center" | "right"',
    default: '"right"',
    description: "水平方向：左、中、右",
  },
];

export const SEARCH_FIELD_CONDITION_CTX_API: DocsApiTableRow[] = [
  {
    name: "values",
    type: "Record<string, unknown>",
    default: "-",
    description: "当前搜索表单值（字段 → 字符串；多选为逗号串）",
  },
];

export const SEARCH_FIELD_RENDER_CTX_API: DocsApiTableRow[] = [
  {
    name: "field",
    type: "SearchField",
    default: "-",
    description: "当前搜索项配置",
  },
  {
    name: "prop",
    type: "string",
    default: "-",
    description: "字段键",
  },
  {
    name: "value",
    type: "Signal<string>",
    default: "-",
    description: "字符串值信号",
  },
  {
    name: "multiValue",
    type: "Signal<string[]>",
    default: "-",
    description: "多选数组镜像信号",
  },
  {
    name: "values",
    type: "Record<string, unknown>",
    default: "-",
    description: "当前全部搜索值",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "-",
    description: "是否禁用",
  },
  {
    name: "error",
    type: "string",
    default: "-",
    description: "当前字段校验错误",
  },
];

export const SEARCH_RENDER_CTX_API: DocsApiTableRow[] = [
  {
    name: "values",
    type: "Record<string, unknown>",
    default: "-",
    description: "当前搜索表单值",
  },
  {
    name: "errors",
    type: "Record<string, string>",
    default: "-",
    description: "字段错误",
  },
  {
    name: "close",
    type: "() => void",
    default: "-",
    description: "关闭弹层",
  },
  {
    name: "submit",
    type: "() => void",
    default: "-",
    description: "走内置校验并提交筛选",
  },
  {
    name: "reset",
    type: "() => void",
    default: "-",
    description: "清空搜索字段并重置筛选",
  },
];

export const FORM_FIELD_CONDITION_CTX_API: DocsApiTableRow[] = [
  {
    name: "values",
    type: "Record<string, unknown>",
    default: "-",
    description: "当前表单值（可见与隐藏字段均包含）",
  },
  {
    name: "mode",
    type: '"create" | "edit"',
    default: "-",
    description: "新增或编辑",
  },
  {
    name: "row",
    type: "Row | null",
    default: "-",
    description: "编辑时为当前行；新增为 null",
  },
];

export const FORM_FIELD_RENDER_CTX_API: DocsApiTableRow[] = [
  {
    name: "field",
    type: "FormField",
    default: "-",
    description: "当前表单项配置",
  },
  {
    name: "prop",
    type: "string",
    default: "-",
    description: "字段键",
  },
  {
    name: "value",
    type: "Signal<string>",
    default: "-",
    description: "字符串值信号（与内置 fields 同源）",
  },
  {
    name: "multiValue",
    type: "Signal<string[]>",
    default: "-",
    description: "多选数组镜像信号",
  },
  {
    name: "mode",
    type: '"create" | "edit"',
    default: "-",
    description: "新增或编辑",
  },
  {
    name: "row",
    type: "Row | null",
    default: "-",
    description: "编辑时为当前行；新增为 null",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "-",
    description: "控件禁用",
  },
  {
    name: "error",
    type: "string",
    default: "-",
    description: "当前字段校验错误",
  },
];

export const FORM_RENDER_CTX_API: DocsApiTableRow[] = [
  {
    name: "mode",
    type: '"create" | "edit"',
    default: "-",
    description: "新增或编辑",
  },
  {
    name: "row",
    type: "Row | null",
    default: "-",
    description: "编辑时为当前行；新增为 null",
  },
  {
    name: "id",
    type: "string",
    default: "-",
    description: "行主键；新增为空串",
  },
  {
    name: "busy",
    type: "boolean",
    default: "-",
    description: "提交中",
  },
  {
    name: "errors",
    type: "Record<string, string>",
    default: "-",
    description: "字段级错误",
  },
  {
    name: "topError",
    type: "string",
    default: "-",
    description: "顶部错误文案",
  },
  {
    name: "close",
    type: "() => void",
    default: "-",
    description: "关闭弹层",
  },
  {
    name: "submit",
    type: "() => Promise<void>",
    default: "-",
    description: "走内置校验 + ds.create／update。完全自管提交时可忽略",
  },
  {
    name: "setBusy",
    type: "(v: boolean) => void",
    default: "-",
    description: "设置提交中状态",
  },
  {
    name: "setErrors",
    type: "(e: Record<string, string>) => void",
    default: "-",
    description: "设置字段错误",
  },
  {
    name: "setTopError",
    type: "(msg: string) => void",
    default: "-",
    description: "设置顶部错误",
  },
  {
    name: "reload",
    type: "() => Promise<void>",
    default: "-",
    description: "重新拉取当前列表页",
  },
];

export const VIEW_RENDER_CTX_API: DocsApiTableRow[] = [
  {
    name: "row",
    type: "Row",
    default: "-",
    description: "当前详情行",
  },
  {
    name: "close",
    type: "() => void",
    default: "-",
    description: "关闭详情弹层",
  },
  {
    name: "reload",
    type: "() => Promise<void>",
    default: "-",
    description: "重新拉取当前列表页（DataView 上为重新拉取当前记录）",
  },
];

export const VIEW_ITEM_RENDER_CTX_API: DocsApiTableRow[] = [
  {
    name: "item",
    type: "ViewItem",
    default: "-",
    description: "当前详情项配置",
  },
  {
    name: "prop",
    type: "string",
    default: "-",
    description: "字段键",
  },
  {
    name: "row",
    type: "Row",
    default: "-",
    description: "当前行",
  },
  {
    name: "raw",
    type: "unknown",
    default: "-",
    description: "原始字段值",
  },
  {
    name: "defaultNode",
    type: "unknown",
    default: "-",
    description: "内置 plainCell 结果，便于包裹或回落",
  },
];

export const API_DATA_SOURCE_API: DocsApiTableRow[] = [
  {
    name: "root",
    type: "string",
    default: "-",
    description: "资源根，如 /api/users",
  },
  {
    name: "apiMode",
    type: '"action" | "restful"',
    default: "-",
    description: "当前模式",
  },
  {
    name: "pageSize",
    type: "number",
    default: "20",
    description: "列表默认每页条数",
  },
  {
    name:
      "list / view / get / create / update / remove / removeBatch / setField / importRows",
    type: "见 DataSource",
    default: "-",
    description: "同时实现 DataSource 的对应方法",
  },
];

export interface DataDisplayTypeSection {
  id: string;
  title: string;
  rows: DocsApiTableRow[];
  nameColumnHeader?: string;
  lead?: string;
}

export const DATA_ALERT_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "type",
    type: '"success" | "info" | "warning" | "error"',
    default: '"info"',
    description: "语义类型，决定图标与边框色",
  },
  {
    name: "message",
    type: "string",
    default: "-",
    description:
      '主文案（必填）。也可用 alert="……" 字符串简写，等价于只传 message 的 info 提示',
  },
  {
    name: "description",
    type: "string",
    default: "-",
    description: "补充描述，显示在主文案下方",
  },
  {
    name: "showIcon",
    type: "boolean",
    default: "true",
    description: "是否显示左侧图标",
  },
  {
    name: "closable",
    type: "boolean",
    default: "true（本插槽）",
    description:
      "是否显示关闭按钮。单独使用 Alert 时默认 false；在 DataPanel／DataView 的 alert 插槽里默认 true。传 false 则固定展示、不可关闭",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "-",
    description:
      "点击关闭时回调。Alert 会自行隐藏，面板／详情同时记下已关闭并卸载提示条，然后再调用本回调。只想关掉提示时不必再自己管显隐；若要受控，仍可传 alert={open ? config : false}，在 onClose 里把 open 设为 false",
  },
  {
    name: "banner",
    type: "boolean",
    default: "true（本插槽）",
    description:
      "横幅样式（圆角更小、通栏提示）。单独使用 Alert 时默认 false；在本插槽里默认 true，可传 false 改回普通卡片圆角",
  },
  {
    name: "action",
    type: "unknown",
    default: "-",
    description:
      "自定义操作区（如「查看详情」链接或按钮），渲染在文案右侧或下方",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "加在 Alert 根节点上的额外 class",
  },
  {
    name: "children",
    type: "unknown",
    default: "-",
    description: "若传入则作为主内容，message 作为标题（可选）",
  },
  {
    name: "messages",
    type: "Partial<{ close: string }>",
    default: '{ close: "关闭" }',
    description: "覆盖关闭按钮的 aria-label 等内置文案",
  },
  {
    name: "show",
    type: "boolean | (() => boolean)",
    default: "true",
    description:
      "为 false（或函数返回 false）时不渲染提示条，配置可保留。写法与字段／按钮的 show 一致。函数在渲染时求值",
  },
  {
    name: "key",
    type: "string",
    default: "-",
    description:
      "可选识别键，与 message／type／description 一起构成提示身份。身份变化，或先把 alert 置空再传入，已关闭的提示会再次显示",
  },
];

/** DataPanel 底栏 pagination 配置（透传 Pagination，不含由面板托管的页码／条数／总数／onChange） */
export const PANEL_PAGINATION_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "preset",
    type: '"full" | "default" | "simple"',
    default: "随断点",
    description:
      "能力档，与 Pagination.preset 相同。不写时按断点缺省：电脑端 full，平板 default，移动端 simple",
  },
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: "随断点",
    description: "分页尺寸。不写时随断点：电脑端 md，平板 sm，移动端 xs",
  },
  {
    name: "pageSize",
    type: "number",
    default: "20",
    description:
      "初始每页条数。运行时当前条数由面板托管，不要把 Pagination 的 current／onChange 写在这里。也可由 createApiDataSource({ pageSize }) 或 initialQuery.pageSize 给出",
  },
  {
    name: "pageSizeOptions",
    type: "number[]",
    default: "[10, 20, 50, 100]",
    description: "每页条数下拉选项",
  },
  {
    name: "showFirstLast",
    type: "boolean",
    default: "随 preset",
    description: "是否显示第一页／最后一页。不传时跟随 preset：仅 full 为 true",
  },
  {
    name: "showPrevNext",
    type: "boolean",
    default: "随 preset",
    description: "是否显示上一页／下一页。不传时三档均为 true",
  },
  {
    name: "showPageNumbers",
    type: "boolean",
    default: "随 preset",
    description:
      "是否显示页码。不传时跟随 preset：simple 为 false，其余为 true",
  },
  {
    name: "showQuickJumper",
    type: "boolean",
    default: "false（本插槽）",
    description:
      "是否使用 Pagination 自带快速跳转。本插槽缺省 false（full 档由面板在右侧另画跳转框）。显式传 true 时改用 Pagination 自带跳转，不再另画面板跳转框",
  },
  {
    name: "showTotal",
    type: "boolean | (total, range) => unknown",
    default: "false（本插槽）",
    description:
      "是否显示 Pagination 自带总条数。本插槽缺省 false（左侧条数文案由面板自己渲染）；显式传入时按传入值透传",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用分页控件（含每页条数与跳转）",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "加在 Pagination 根节点上的额外 class",
  },
  {
    name: "testIdPrefix",
    type: "string",
    default: '"dp"',
    description: "测试 id 前缀。本插槽缺省 dp",
  },
  {
    name: "messages",
    type: "Partial<PaginationMessages>",
    default: "-",
    description:
      "覆盖分页文案。first／prev／next／last／simpleCurrent 等未写时走 Pagination 默认；jumpTo／pageUnit／pageSizeUnit 未写时回落到面板 messages 的 jump／page／perPage。详见 PaginationMessages 表",
  },
];

/** form／search／view.modal 可写的 Modal 参数（面板接管的字段除外） */
export const DATA_CHROME_MODAL_CONFIG_API: DocsApiTableRow[] = [
  {
    name: "titleAlign",
    type: '"left" | "center"',
    default: "center",
    description:
      "标题对齐：center 相对弹层居中（关闭等仍贴右）；left 与操作区两端排布",
  },
  {
    name: "closable",
    type: "boolean",
    default: "true",
    description: "是否显示右上角关闭按钮",
  },
  {
    name: "maskClosable",
    type: "boolean",
    default: "true",
    description: "点击遮罩是否关闭",
  },
  {
    name: "mask",
    type: "boolean",
    default: "true",
    description: "是否显示半透明遮罩；false 时不渲染遮罩，maskClosable 无效",
  },
  {
    name: "width",
    type:
      '"xs" | "sm" | "md" | "lg" | "xl" | string | number | (() => string | number | undefined)',
    default: '"md"',
    description:
      "弹层宽度。预设名 xs／sm／md／lg／xl，或 CSS 长度／数字像素，也可零参 getter。未写时面板缺省 md",
  },
  {
    name: "maxHeight",
    type: "string | number | (() => string | number | undefined)",
    default: "90vh",
    description:
      "弹层最大高度。数字为像素，字符串为 CSS（如 80vh／600px），也可零参 getter。全屏时忽略，仍为 100vh",
  },
  {
    name: "centered",
    type: "boolean",
    default: "true",
    description: "是否垂直居中。与 placement 同传时以 placement 为准",
  },
  {
    name: "placement",
    type: '"bottom"',
    default: "-",
    description: "在遮罩中的垂直落位。传 bottom 时自底部对齐（如底部 Sheet）",
  },
  {
    name: "destroyOnClose",
    type: "boolean",
    default: "true（本插槽）",
    description: "关闭后是否销毁子节点。面板缺省 true；可在 modal 里改",
  },
  {
    name: "keyboard",
    type: "boolean",
    default: "true（本插槽）",
    description: "是否支持按 Esc 关闭。面板缺省 true；可在 modal 里改",
  },
  {
    name: "keepInView",
    type: "boolean",
    default: "true",
    description: "拖动时限制在浏览器可视区内；仅 draggable 时生效",
  },
  {
    name: "draggable",
    type: "boolean",
    default: "false",
    description: "传 true 时标题栏可拖动",
  },
  {
    name: "defaultPosition",
    type: "{ x: number; y: number } | (() => 同上)",
    default: "-",
    description: "拖动位移初始值（相对默认落点的 translate，单位 px）",
  },
  {
    name: "onPositionChange",
    type: "(pos: { x: number; y: number }) => void",
    default: "-",
    description: "拖动过程／结束时的位移回调",
  },
  {
    name: "fullscreenable",
    type: "boolean",
    default: "false",
    description:
      "是否在标题栏显示全屏切换按钮；打开是否全屏由 form／search／view 上的 autoFullscreen／mobileAutoFullscreen 决定",
  },
  {
    name: "maskClass",
    type: "string",
    default: "-",
    description: "遮罩 class；仅 mask 为 true（默认）时生效",
  },
  {
    name: "wrapClass",
    type: "string",
    default: "-",
    description: "弹层容器 class",
  },
  {
    name: "bodyClass",
    type: "string",
    default: "-",
    description: "内容区 class",
  },
  {
    name: "footerClass",
    type: "string",
    default: "-",
    description: "底部栏外层 flex 容器的 class",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "弹层盒子 class",
  },
  {
    name: "messages",
    type: "Partial<ModalMessages>",
    default: "-",
    description:
      "弹层文案，透传 Modal.messages（close、enterFullscreen、exitFullscreen、mask）。只覆盖要改的字段，其余走 Modal 默认。详见 ModalMessages 表",
  },
];

export const DATA_DISPLAY_TYPE_SECTIONS: DataDisplayTypeSection[] = [
  {
    id: "Column",
    title: "Column",
    rows: COLUMNS_API,
    lead:
      '列定义。系统列写 type:"selection"／"index"／"actions" 即可。固定列、省略号和默认排序直接写在 Column 上。',
  },
  {
    id: "SearchConfig",
    title: "SearchConfig",
    rows: SEARCH_CONFIG_API,
    lead:
      "搜索弹层配置。Modal 参数写在 modal 上（width 缺省 md、maxHeight、fullscreenable 全屏按钮等）。autoFullscreen 为打开即全屏（所有端）；mobileAutoFullscreen 为仅移动端打开即全屏；这两项写在 SearchConfig 上，缺省 false。",
  },
  {
    id: "SearchField",
    title: "SearchField",
    rows: SEARCH_API,
    lead: "搜索项。",
  },
  {
    id: "FormConfig",
    title: "FormConfig",
    rows: FORM_CONFIG_API,
    lead:
      "新增／编辑弹层配置。Modal 参数写在 modal 上（width 缺省 md、maxHeight、fullscreenable 全屏按钮等）。autoFullscreen 为打开即全屏（所有端）；mobileAutoFullscreen 为仅移动端打开即全屏；这两项写在 FormConfig 上，缺省 false。",
  },
  {
    id: "FormField",
    title: "FormField",
    rows: FORM_API,
    lead: "表单项。",
  },
  {
    id: "ViewConfig",
    title: "ViewConfig",
    rows: VIEW_CONFIG_API,
    lead:
      "详情配置（DataPanel 弹层与 DataView 正文共用）。view 透传两块：modal 给弹层，descriptions 给描述列表。autoFullscreen／mobileAutoFullscreen 写在 ViewConfig 上，不是 Modal 参数。modal 与自动全屏只在 DataPanel 详情弹层上生效；DataView 的 view 是页面本身，modal 与自动全屏不生效。title 仍是弹层／页面标题，不会传给 Descriptions。有 render 时 descriptions 不生效。",
  },
  {
    id: "ViewDescriptionsProps",
    title: "ViewDescriptionsProps",
    rows: VIEW_DESCRIPTIONS_PROPS_API,
    lead:
      "view.descriptions 的透传对象：Descriptions 的全部参数，但 items／title 由面板接管。items 由 view.props 生成，title 是弹层／页面标题。本插槽缺省 column=1、size=sm、bordered=true。有 view.render 或 DataView children 时不生效。",
  },
  {
    id: "DataChromeModalConfig",
    title: "DataChromeModalConfig",
    rows: DATA_CHROME_MODAL_CONFIG_API,
    lead:
      "form.modal／search.modal／view.modal 的透传对象：Modal 的全部参数，但 open／onClose／title／children／footer／fullscreen 由面板接管。打开是否全屏由 form／search／view 上的 autoFullscreen／mobileAutoFullscreen 决定。未写 width 时面板缺省 md。面板缺省开启 keyboard 与 destroyOnClose，可在本对象里改。弹层文案写在 messages，见 ModalMessages。",
  },
  {
    id: "ModalMessages",
    title: "ModalMessages",
    rows: MESSAGES_MODAL,
    lead:
      "form.modal／search.modal／view.modal 的 messages：弹层右上角关闭、全屏切换和遮罩的 aria-label。只覆盖要改的字段，其余走 Modal 默认。面板工具栏全屏和详情页脚「关闭」仍用根上的 messages。",
  },
  {
    id: "ViewItem",
    title: "ViewItem",
    rows: VIEW_ITEM_API,
    lead: "详情字段。在 Column 基础上增加 click／render／labelAlign。",
  },
  {
    id: "DataSource",
    title: "DataSource",
    rows: SOURCE_API,
    nameColumnHeader: "方法",
    lead: "所有读写都经过数据源。list 必需，其余按需提供。",
  },
  {
    id: "ApiDataSource",
    title: "ApiDataSource",
    rows: API_DATA_SOURCE_API,
    lead:
      "createApiDataSource 的返回值：在 DataSource 之上额外暴露 root／apiMode／pageSize。工厂参数见 createApiDataSource 表。",
  },
  {
    id: "createApiDataSource",
    title: "createApiDataSource",
    rows: API_SOURCE_API,
    nameColumnHeader: "项",
    lead: "由 baseRoute 创建 API 数据源的工厂与选项。",
  },
  {
    id: "Row",
    title: "Row",
    rows: ROW_API,
    lead: "一行数据。",
  },
  {
    id: "Option",
    title: "Option",
    rows: OPTION_API,
    lead: "tag／select／switch 等共用的选项。",
  },
  {
    id: "FieldRule",
    title: "FieldRule",
    rows: FIELD_RULE_API,
    lead: "表单／搜索字段校验规则。",
  },
  {
    id: "ActionCtrl",
    title: "ActionCtrl",
    rows: ACTION_CTRL_API,
    lead:
      "工具栏、批量条、表单／搜索底栏按钮的统合写法：boolean 或对象。上下文 Ctx 随所在位置变化。",
  },
  {
    id: "PanelActionContext",
    title: "PanelActionContext",
    rows: PANEL_ACTION_CONTEXT_API,
    lead: "DataPanel 工具栏与批量条按钮的 ctx。",
  },
  {
    id: "ViewActionContext",
    title: "ViewActionContext",
    rows: VIEW_ACTION_CONTEXT_API,
    lead: "DataView 工具栏按钮的 ctx。",
  },
  {
    id: "FormActionContext",
    title: "FormActionContext",
    rows: FORM_ACTION_CONTEXT_API,
    lead: "表单底部按钮的 ctx。",
  },
  {
    id: "SearchActionContext",
    title: "SearchActionContext",
    rows: SEARCH_ACTION_CONTEXT_API,
    lead: "搜索底部按钮的 ctx。",
  },
  {
    id: "FooterActionsConfig",
    title: "FooterActionsConfig",
    rows: FOOTER_ACTIONS_CONFIG_API,
    lead: "表单／搜索底部按钮 Record，值为 ActionCtrl。",
  },
  {
    id: "PanelToolbarConfig",
    title: "PanelToolbarConfig",
    rows: PANEL_TOOLBAR_CONFIG_API,
    lead: "DataPanel 工具栏 Record：键的写入序就是显示序。",
  },
  {
    id: "ViewToolbarConfig",
    title: "ViewToolbarConfig",
    rows: VIEW_TOOLBAR_CONFIG_API,
    lead: "DataView 工具栏 Record。",
  },
  {
    id: "BatchActionCtrl",
    title: "BatchActionCtrl",
    rows: BATCH_ACTION_CTRL_API,
    lead: "批量条单项：与 ActionCtrl 同形，另可写 confirm。",
  },
  {
    id: "BatchBarConfig",
    title: "BatchBarConfig",
    rows: BATCH_BAR_CONFIG_API,
    lead: "批量条 Record。这就是 batchBar 除 false 之外的配置对象。",
  },
  {
    id: "RowActionCtrl",
    title: "RowActionCtrl",
    rows: ROW_ACTION_CTRL_API,
    lead: "行操作按钮单项。show／disable／action／title／confirm 可按行计算。",
  },
  {
    id: "RowActionsConfig",
    title: "RowActionsConfig",
    rows: ROW_ACTIONS_CONFIG_API,
    lead: "操作列按钮 Record，写在 Column.actions。",
  },
  {
    id: "Caps",
    title: "Caps",
    rows: CAPS_API,
    lead:
      "DataPanel 能力开关。缺省按数据源方法是否存在推断；调用方可显式覆盖。",
  },
  {
    id: "DataViewCaps",
    title: "DataViewCaps",
    rows: DATA_VIEW_CAPS_API,
    lead: "DataView 能力开关。refresh 始终可用，不在此列。",
  },
  {
    id: "Query",
    title: "Query",
    rows: QUERY_API,
    lead: "列表查询。",
  },
  {
    id: "ListResult",
    title: "ListResult",
    rows: LIST_RESULT_API,
    lead: "list() 的返回值。",
  },
  {
    id: "WriteResult",
    title: "WriteResult",
    rows: WRITE_RESULT_API,
    lead:
      "create／update 的返回：void／{ ok: true } 表示成功，失败时带错误信息。",
  },
  {
    id: "BulkResult",
    title: "BulkResult",
    rows: BULK_RESULT_API,
    lead: "批量删除／setField 的返回。",
  },
  {
    id: "ImportResult",
    title: "ImportResult",
    rows: IMPORT_RESULT_API,
    lead: "importRows 的返回。",
  },
  {
    id: "SyncUrl",
    title: "SyncUrl",
    rows: SYNC_URL_API,
    lead: "boolean 或 { prefix }。false 关闭地址栏同步。",
  },
  {
    id: "DataAlertConfig",
    title: "DataAlertConfig",
    rows: DATA_ALERT_CONFIG_API,
    lead:
      "DataPanel／DataView 的 alert 对象配置：完整透传 Alert 的全部参数，另加 show／key。字符串简写只表示 message。",
  },
  {
    id: "PanelPaginationConfig",
    title: "PanelPaginationConfig",
    rows: PANEL_PAGINATION_CONFIG_API,
    lead:
      "DataPanel 的 pagination 对象配置：透传 Pagination 的展示参数。运行时的页码、当前每页条数、总数和 onChange 由面板托管；初始 pageSize 默认 20，pageSizeOptions 默认 [10, 20, 50, 100]；未写的 preset／size 走断点。地址栏同步仍用根上的 syncUrl。messages 的字段见 PaginationMessages 表。",
  },
  {
    id: "PaginationMessages",
    title: "PaginationMessages",
    rows: MESSAGES_PAGINATION,
    lead:
      "分页文案。写在 pagination.messages 上，只覆盖要改的字段。first／prev／next／last／simpleCurrent 等未写时走 Pagination 默认；jumpTo／pageUnit／pageSizeUnit 未写时回落到面板 messages 的 jump／page／perPage。",
  },
  {
    id: "DataChromeTab",
    title: "DataChromeTab",
    rows: DATA_CHROME_TAB_API,
    lead: "DataPanel／DataView 工具栏左侧标签。",
  },
  {
    id: "DataPanelHandle",
    title: "DataPanelHandle",
    rows: DATA_PANEL_HANDLE_API_TYPE,
    nameColumnHeader: "方法",
    lead: "getDataPanel(panelKey) 返回的命令式句柄。",
  },
  {
    id: "DataViewHandle",
    title: "DataViewHandle",
    rows: DATA_VIEW_HANDLE_API_TYPE,
    nameColumnHeader: "方法",
    lead: "getDataView(panelKey) 返回的命令式句柄。",
  },
  {
    id: "DescriptionsLabelAlign",
    title: "DescriptionsLabelAlign",
    rows: DESCRIPTIONS_LABEL_ALIGN_API,
    lead: "详情标签对齐，透传 Descriptions。",
  },
  {
    id: "SearchFieldConditionCtx",
    title: "SearchFieldConditionCtx",
    rows: SEARCH_FIELD_CONDITION_CTX_API,
    lead: "搜索字段 show／disabled／options 的上下文。",
  },
  {
    id: "SearchFieldRenderCtx",
    title: "SearchFieldRenderCtx",
    rows: SEARCH_FIELD_RENDER_CTX_API,
    lead: "搜索字段级自定义控件的上下文。",
  },
  {
    id: "SearchRenderCtx",
    title: "SearchRenderCtx",
    rows: SEARCH_RENDER_CTX_API,
    lead: "搜索 Modal 主体自定义渲染的上下文。",
  },
  {
    id: "FormFieldConditionCtx",
    title: "FormFieldConditionCtx",
    rows: FORM_FIELD_CONDITION_CTX_API,
    lead: "表单字段 show／disabled／options 的上下文。",
  },
  {
    id: "FormFieldRenderCtx",
    title: "FormFieldRenderCtx",
    rows: FORM_FIELD_RENDER_CTX_API,
    lead: "表单字段级自定义控件的上下文。",
  },
  {
    id: "FormRenderCtx",
    title: "FormRenderCtx",
    rows: FORM_RENDER_CTX_API,
    lead: "新增／编辑 Modal 主体自定义渲染的上下文。",
  },
  {
    id: "ViewRenderCtx",
    title: "ViewRenderCtx",
    rows: VIEW_RENDER_CTX_API,
    lead: "详情字段区自定义渲染的上下文。",
  },
  {
    id: "ViewItemRenderCtx",
    title: "ViewItemRenderCtx",
    rows: VIEW_ITEM_RENDER_CTX_API,
    lead: "详情字段级自定义展示的上下文。",
  },
];

export const DATA_PANEL_EXTRA_TYPE_IDS: string[] = [
  "ApiDataSource",
  "Row",
  "Option",
  "FieldRule",
  "ActionCtrl",
  "PanelActionContext",
  "ViewActionContext",
  "FormActionContext",
  "SearchActionContext",
  "FooterActionsConfig",
  "PanelToolbarConfig",
  "ViewToolbarConfig",
  "BatchActionCtrl",
  "BatchBarConfig",
  "RowActionCtrl",
  "RowActionsConfig",
  "Caps",
  "DataViewCaps",
  "Query",
  "ListResult",
  "WriteResult",
  "BulkResult",
  "ImportResult",
  "SyncUrl",
  "DataAlertConfig",
  "PanelPaginationConfig",
  "PaginationMessages",
  "DataChromeTab",
  "DataPanelHandle",
  "DataViewHandle",
  "DescriptionsLabelAlign",
  "DataChromeModalConfig",
  "ModalMessages",
  "ViewDescriptionsProps",
  "SearchFieldConditionCtx",
  "SearchFieldRenderCtx",
  "SearchRenderCtx",
  "FormFieldConditionCtx",
  "FormFieldRenderCtx",
  "FormRenderCtx",
  "ViewRenderCtx",
  "ViewItemRenderCtx",
];

export const DATA_VIEW_TYPE_IDS: string[] = [
  "ViewConfig",
  "ViewItem",
  "FormConfig",
  "FormField",
  "Column",
  "DataSource",
  "createApiDataSource",
  "ApiDataSource",
  "Row",
  "Option",
  "FieldRule",
  "ActionCtrl",
  "ViewActionContext",
  "FormActionContext",
  "SearchActionContext",
  "FooterActionsConfig",
  "ViewToolbarConfig",
  "RowActionCtrl",
  "RowActionsConfig",
  "DataViewCaps",
  "ListResult",
  "WriteResult",
  "BulkResult",
  "ImportResult",
  "DataAlertConfig",
  "DataChromeTab",
  "DataViewHandle",
  "DescriptionsLabelAlign",
  "DataChromeModalConfig",
  "ModalMessages",
  "ViewDescriptionsProps",
  "FormFieldConditionCtx",
  "FormFieldRenderCtx",
  "FormRenderCtx",
  "ViewRenderCtx",
  "ViewItemRenderCtx",
];
