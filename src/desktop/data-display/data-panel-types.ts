/**
 * DataPanel 公共类型：列、搜索项、表单项、查询、数据源与文案。
 * 与具体后端无关：所有数据读写通过 {@link DataSource} 注入。
 */

import type { Signal } from "@dreamer/view";
import type { DescriptionsLabelAlign } from "./Descriptions.tsx";

/** 数据行：键值对；主键字段默认为 `id`（见 `PanelProps.rowKey`）。 */
export type Row = Record<string, unknown>;

/** 标签 / 提示色调 */
export type Tone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

/** 列展示类型 */
export type ColumnType =
  | "text"
  | "number"
  | "money"
  | "date"
  | "datetime"
  | "tag"
  | "bool"
  | "image"
  | "link"
  /** 多选勾选列（只由 columns 声明驱动；旧顶层 selectable／caps 不再单独打开） */
  | "selection"
  /** 行号／序号列（columns 驱动；label 可省，默认 "#"） */
  | "index"
  /** 行操作列（columns 驱动；按钮配置写在列的 `actions`；label 可省，回落 messages.actions） */
  | "actions";

/** 选项（tag 列、select 搜索 / 表单项共用） */
export interface Option {
  value: string;
  label: string;
  tone?: Tone;
}

/** 列定义 */
export interface Column {
  /**
   * 行字段名。系统列可省：`selection`→`__select`，`index`→`__index`，`actions`→`__actions`（仍可显式覆盖）。
   * 自定义列（用 `formatter`／`value` 拼接或计算）也可省；面板会分配稳定键。也可自己写一个不在行数据上的键（如 `fullName`）。
   */
  prop?: string;
  /**
   * 表头文案（数据列建议必填）。
   * 系统列可省：`selection`→`""`（列设置用 messages.colSelect）；`index`→`"#"`；`actions`→`""`（表头回落 messages.actions）。
   * 仍可显式传自定义文案；空串按上列默认处理。
   */
  label?: string;
  /** 展示类型，默认 text；`selection`／`index`／`actions` 为系统列 */
  type?: ColumnType;
  /**
   * 日期／时间展示格式（优先于默认切片）。
   * 仅对 `type:"date"`／`type:"datetime"`（及未声明 type 但 raw 为日期时经 formatter 除外）生效。
   * 支持令牌：`YYYY` `MM` `DD` `HH` `mm` `ss`。
   * 例：`"YYYY-MM-DD HH:mm"` → `2026-11-10 10:30`（不要秒）；date 缺省等同 `YYYY-MM-DD`，datetime 缺省 `YYYY-MM-DD HH:mm:ss`。
   * 更复杂节点请用 `formatter`／`value`（本字段不覆盖它们）。
   */
  format?: string;
  /** 是否可点击表头排序（服务端 / 本地数据源均走 `list(query)`） */
  sortable?: boolean;
  /**
   * 点击该列排序时发给 `list(query).sort` 的字段。
   * 自定义拼接列请指向用于排序的源字段（如姓名列把姓放在前，则 `sortProp: "lastName"`）。
   * 缺省用 `prop`；合成键（未写 prop 的自定义列）必须指定本字段才能排序。
   */
  sortProp?: string;
  /**
   * 单元格文本对齐（数据列）。默认 `center`。
   * 系统列 `selection`／`index`／`actions` 固定居中，忽略本字段。
   */
  align?: "left" | "center" | "right";
  /**
   * 表头标题对齐（数据列）。**不传**时与 `align` 一致；二者皆未设则为 `center`。
   * 用于「表头居中、单元格仍左／右」等；系统列忽略本字段。
   */
  headerAlign?: "left" | "center" | "right";
  /**
   * 列宽。默认 `"auto"`，按表头和单元格内容撑开，不均分剩余宽度。
   * 传数字为像素。
   */
  width?: number | "auto";
  /**
   * 列最小宽度（px）。
   * 与 `width`／`maxWidth` 一并写到表头与单元格 style。
   */
  minWidth?: number;
  /**
   * 列最大宽度（px）。
   * 与 `width`／`minWidth` 一并写到表头与单元格 style。
   */
  maxWidth?: number;
  /** tag 列：值 → 文案 / 色调；switch/select 行内编辑也用 */
  options?: Option[];
  /**
   * 行内编辑（单元格编辑）：
   * - `switch`：两个 options 的开关，点击即切换并保存；
   * - 其余类型双击进入编辑：`text` / `number` / `textarea` / `date` / `datetime` / `select`（单选，需 options）/
   *   `multiselect`（多选，需 options，值为数组）；
   * - 失焦或 Enter 保存并回到展示态；Esc 取消并恢复原值；保存失败提示错误并保持原值。
   */
  inline?:
    | "switch"
    | "select"
    | "multiselect"
    | "text"
    | "number"
    | "textarea"
    | "date"
    | "datetime";
  /**
   * 对齐旧 `columns[].edit`：为 true 且未写 `inline` 时，自动启用行内编辑
   * （两档 options → `switch`，否则 `text`）。新代码请直接写 `inline`。
   */
  edit?: boolean;
  /** 页脚合计行：显示 `list()` 返回 `totals[prop]` */
  total?: boolean;
  /** 默认隐藏，可在「列设置」里打开 */
  hidden?: boolean;
  /** 不参与导出 */
  noExport?: boolean;
  /**
   * 显式标记为批量「设为…」目标列（须配合 `inline:"switch"` 与恰好两档 `options`）。
   * 不再用「首个 switch 列」隐式推导。
   */
  batch?: boolean;
  /**
   * 仅 `type:"actions"`：行操作 Record（原顶层 rowActions）。
   * 内置 view／edit／remove＋自定义 key；写入序＝显示序；自定义必须 `action(item)`。
   * 省略键回落 caps；声明键请写明确 true｜false｜object。
   */
  actions?: RowActionsConfig;
  /**
   * 按行文案／节点（对齐旧 `options.value(row)`）。
   * 可返回：**任意可渲染节点**——string／number、JSX／VNode、组件（如 Icon）、DOM Node，
   * 或以 `<` 开头的**可信 HTML 字符串**（经面板注入；勿传入不可信用户输入）。
   * 声明式 `options[{value,label,tone}]` 仍保留；复杂按行逻辑走本函数。
   * 与 `formatter` 并存时以 `formatter` 为准；面板级 `renderCell[prop]` 最优先。
   */
  value?: (row: Row) => unknown;
  /**
   * 按行色调（对齐旧 `options.color(row)`）。返回 {@link Tone}。
   * 仅当 `value`／`formatter` 结果为原始文本（string／number／boolean）时包成 `dp-tag`；
   * 若返回自定义节点／HTML，由调用方自行上色，本字段忽略。
   */
  color?: (row: Row) => Tone;
  /**
   * 统一格式化：`(row, raw) =>` **任意可渲染节点**（同 {@link Column.value}）。
   * 覆盖默认展示与 `value`；导出／打印／详情只取可转文本的结果，节点／HTML 回落字段原文。
   */
  formatter?: (row: Row, raw: unknown) => unknown;
}

/**
 * 详情项（`PanelProps.view.props` 数组，写法同列字段）。
 * 与列同一套字段配置；另可 `click`。底部按钮写在与 title 平级的 `view.actions`，不要写在 props 里。
 */
export type ViewClick = "toggle" | ((row: Row) => void);

/**
 * 详情字段级自定义渲染上下文（仅当未设 `view.render` 时生效）。
 */
export interface ViewItemRenderCtx {
  /** 当前详情项配置 */
  item: ViewItem;
  /** 字段键 */
  prop: string;
  /** 当前行 */
  row: Row;
  /** 原始字段值 */
  raw: unknown;
  /** 内置 plainCell 结果，便于包裹或回落 */
  defaultNode: unknown;
}

export interface ViewItem extends Column {
  /**
   * 详情字段点击：`toggle` 在两档 options 间切换并走 setField／update；
   * 或自定义 `(row)=>…`。
   */
  click?: ViewClick;
  /**
   * 字段级自定义展示节点。有 {@link ViewConfig.render} 时忽略本字段。
   */
  render?: (ctx: ViewItemRenderCtx) => unknown;
  /**
   * 该行标签对齐，传给 Descriptions。
   * vertical：top 上对齐／center 垂直居中／bottom 下对齐；
   * horizontal：left 左／center 中／right 右。
   * 未写时沿用 Descriptions 默认（上对齐、右对齐）。
   */
  labelAlign?: DescriptionsLabelAlign;
}

/** 搜索项（键统一 `prop`；旧 `name` 等同 prop，兼容保留） */
/** 表单／搜索字段校验规则（对齐旧 schemas.rules；简单＋复杂） */
export interface FieldRule {
  /** 必填 */
  required?: boolean;
  /**
   * 下限：`type:"number"`／字段 type number → 数值最小；
   * 否则按字符串最小长度。
   */
  min?: number;
  /**
   * 上限：数值最大或字符串最大长度（同上）。
   */
  max?: number;
  /** 正则（string 或 RegExp） */
  pattern?: string | RegExp;
  /** 内置类型检查 */
  type?: "string" | "number" | "email" | "url";
  /**
   * 同步自定义校验。返回：
   * - `string` → 错误文案；
   * - `false` → 失败，用 `message` 或内置文案；
   * - `true`／`void` → 通过。
   */
  validator?: (
    value: unknown,
    values: Record<string, unknown>,
  ) => string | boolean | void;
  /** 失败文案（对齐旧 `rules[].message`） */
  message?: string;
  /** 触发时机（面板提交时一律校验；预留 blur／change） */
  trigger?: "blur" | "change" | "submit";
}

export interface SearchField {
  /** 字段键（与 columns.prop／URL query key 对齐）；缺省回落 `name` */
  prop?: string;
  /** @deprecated 用 `prop`；二者都写时以 `prop` 为准 */
  name?: string;
  /** 缺省时从同 prop 的 column.label 继承 */
  label?: string;
  type?: "text" | "select" | "date";
  /** 缺省时从同 prop 的 column.options 继承 */
  options?: Option[];
  /** 本地数据源匹配方式：contains（text 默认）/ eq（select 默认）/ from / to / num */
  match?: "contains" | "eq" | "from" | "to" | "num";
  /** 行字段名，缺省与 prop／name 相同 */
  field?: string;
  /** 输入占位（对齐旧 search.schemas.placeholder） */
  placeholder?: string;
  /** 下方提示；有校验错误时隐藏（对齐旧 hint） */
  hint?: string;
  /** 校验规则（提交搜索时执行；对齐旧 schemas.rules） */
  rules?: FieldRule[];
  /** 无 rules 时，简写 required／pattern 失败的默认文案 */
  message?: string;
  /** 搜索必填（无 rules 时的简写） */
  required?: boolean;
  /** 搜索正则简写 */
  pattern?: string;
  /**
   * 栅格跨列（1–12）。表单／搜索容器为 12 列时生效；与 `cols` 同义，二者同写以 `span` 为准。
   */
  span?: number;
  /** @see span */
  cols?: number;
  /** 控件／项宽度（CSS 长度或 px 数字），对齐旧 schemas.width（如 `"50%"`／200） */
  width?: string | number;
  /** 输入最大字符数（对齐 maxlength；传给 Input） */
  maxlength?: number;
}

/** 表单控件类型 */
export type FormType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "switch"
  | "password"
  | "date"
  | "datetime";

/**
 * 增改表单字段级自定义控件上下文（仅当未设 `form.render` 时生效）。
 */
export interface FormFieldRenderCtx {
  /** 当前表单项配置 */
  field: FormField;
  /** 字段键 */
  prop: string;
  /** 字符串值信号（与内置 fields 同源） */
  value: Signal<string>;
  /** 多选数组镜像信号（与内置 mfields 同源） */
  multiValue: Signal<string[]>;
  /** 新增／编辑 */
  mode: "create" | "edit";
  /** 编辑时为当前行；新增为 null */
  row: Row | null;
  /** 控件禁用（如字段级自定义 render） */
  disabled: boolean;
  /** 当前字段校验错误 */
  error?: string;
}

/** 新增 / 编辑 Modal 里的表单项（键统一 `prop`；旧 `name` 等同 prop） */
export interface FormField {
  /** 字段键（与 columns.prop 对齐）；缺省回落 `name` */
  prop?: string;
  /** @deprecated 用 `prop`；二者都写时以 `prop` 为准 */
  name?: string;
  /** 缺省时从同 prop 的 column.label 继承 */
  label?: string;
  type?: FormType;
  /** 缺省时从同 prop 的 column.options 继承（select／switch 等） */
  options?: Option[];
  required?: boolean;
  min?: number;
  max?: number;
  /** 正则（字符串）；复杂场景请用 `rules` */
  pattern?: string;
  placeholder?: string;
  /** 下方提示；有校验错误时隐藏（对齐旧 form.schemas.hint） */
  hint?: string;
  /**
   * 校验规则数组（对齐旧 `rules:[{ required, message, min, max, pattern, type, validator }]`）。
   * 有 `rules` 时优先走规则；仍兼容字段级 required／min／max／pattern 简写。
   */
  rules?: FieldRule[];
  /** 简写校验失败时的默认文案（无 rules[].message 时回落） */
  message?: string;
  /** 新建时的初始值 */
  initial?: string | number | boolean;
  /** 仅新建时显示（编辑时不渲染、不校验、不提交；如密码） */
  createOnly?: boolean;
  /** 仅编辑时显示（新建时不渲染） */
  editOnly?: boolean;
  /**
   * 栅格跨列（1–12）。有任一字段写 span／cols／width 时容器切 12 列；缺省整行（12）。
   * 与 `cols` 同义，同写以 `span` 为准。
   */
  span?: number;
  /** @see span */
  cols?: number;
  /** 项宽度（CSS 长度或 px 数字），对齐旧 form.schemas.width */
  width?: string | number;
  /** 输入最大字符数（text／textarea／password）；校验亦作字符串上限 */
  maxlength?: number;
  /** textarea 行数，默认 4 */
  rows?: number;
  /**
   * @deprecated switch 默认吃同 prop 列的两档 options（[0]=开，[1]=关）；
   * 仅无对应列时再写 onOff，默认 ["true","false"]。
   */
  onOff?: [string, string];
  /**
   * 字段级自定义控件。有 {@link FormConfig.render} 时忽略本字段。
   */
  render?: (ctx: FormFieldRenderCtx) => unknown;
}

/**
 * 增改 Modal 主体自定义渲染上下文。
 * 有 `form.render` 时整段替换内置 formBody（含确定／取消）；调用方自管底栏或调用 submit／close。
 */
export interface FormRenderCtx {
  /** 新增／编辑 */
  mode: "create" | "edit";
  /** 编辑时为当前行；新增为 null */
  row: Row | null;
  /** 行主键；新增为空串 */
  id: string;
  /** 提交中 */
  busy: boolean;
  /** 字段级错误 */
  errors: Record<string, string>;
  /** 顶部错误文案 */
  topError: string;
  /** 关闭弹窗 */
  close: () => void;
  /**
   * 走内置 validateForm + ds.create／update（依赖 `form.props` 字段信号）。
   * 完全自管提交时可忽略，自行写数后 close／reload。
   */
  submit: () => Promise<void>;
  /** 设置提交中状态 */
  setBusy: (v: boolean) => void;
  /** 设置字段错误 */
  setErrors: (e: Record<string, string>) => void;
  /** 设置顶部错误 */
  setTopError: (msg: string) => void;
  /** 重新拉取当前列表页 */
  reload: () => Promise<void>;
}

/**
 * 详情 Modal 字段区自定义渲染上下文。
 * 有 `view.render` 时替换 Descriptions 字段区；底部 `view.actions` 脚仍由面板渲染。
 */
export interface ViewRenderCtx {
  /** 当前详情行 */
  row: Row;
  /** 关闭详情弹窗 */
  close: () => void;
  /** 重新拉取当前列表页 */
  reload: () => Promise<void>;
}

/**
 * 弹层宽度：预设名 xs/sm/md/lg/xl，或 CSS 长度 / 数字像素；也可零参 getter。缺省 md。
 */
export type ModalShellWidth =
  | string
  | number
  | (() => string | number | undefined);

/**
 * form / search / view 的统一段配置：`title` 为弹层标题，`props` 为字段数组
 * （与列同一套字段配置）；底部按钮写在与 title 平级的 `actions`（不要写在 props 末项）。
 *
 * 扩展优先级：`form.render`（整页）＞ `FormField.render`（字段）＞ 内置控件；
 * 旁路层仍可用 DataPanel `children` + 自定义 `action` 自管 Modal。
 */
export interface FormConfig {
  title?: string | ((row: Row) => string);
  /**
   * 表单项数组。有 {@link FormConfig.render} 时可省略或留空。
   * 若仍提供 props，内置 `submit()` 可按 props 校验／收集值。
   */
  props?: FormField[];
  /** 可选底部按钮（与列操作同一套 Record）。表单确定／取消仍走官方 Modal 脚（内置 formBody）。 */
  actions?: RowActionsConfig;
  /**
   * 整段替换增改 Modal 主体（含确定／取消）。
   * 有本字段时忽略各 {@link FormField.render}。
   */
  render?: (ctx: FormRenderCtx) => unknown;
  /** 增改弹层宽度，传给 Modal；缺省 md */
  width?: ModalShellWidth;
  /** 增改弹层是否显示全屏切换，传给 Modal */
  fullscreenable?: boolean;
}

export interface SearchConfig {
  title?: string | (() => string);
  props: SearchField[];
  /** 可选底部按钮（与列操作同一套 Record）。搜索确定／取消仍走官方 Modal 脚。 */
  actions?: RowActionsConfig;
  /** 搜索弹层宽度，传给 Modal；缺省 md */
  width?: ModalShellWidth;
  /** 搜索弹层是否显示全屏切换，传给 Modal */
  fullscreenable?: boolean;
}

export interface ViewConfig {
  /** 详情弹层标题；支持 `(row)=>string`，如 `` `详情 · ${row.name}` `` */
  title?: string | ((row: Row) => string);
  /**
   * 详情字段数组。有 {@link ViewConfig.render} 时可省略或留空（字段区完全自定义）。
   */
  props?: ViewItem[];
  /**
   * 底部按钮（与列操作同一套 Record）。内置只有 close（默认显示、靠右最后）。
   * 自定义：`action(row)` 或 `href`。不写时底部只留关闭。
   * 有 {@link ViewConfig.render} 时本脚仍渲染；连底栏一起自管可设 `close: false` 并在 render 内画按钮。
   */
  actions?: RowActionsConfig;
  /**
   * 替换详情 Descriptions 字段区；底部 actions 脚仍由面板渲染。
   * 有本字段时忽略各 {@link ViewItem.render}。
   */
  render?: (ctx: ViewRenderCtx) => unknown;
  /** 详情弹层宽度，传给 Modal；缺省 md */
  width?: ModalShellWidth;
  /** 详情弹层是否显示全屏切换，传给 Modal */
  fullscreenable?: boolean;
  /**
   * 详情 Descriptions 标签列占「单列槽位」宽度的百分比（12～85），缺省 38。
   * 与 {@link ViewConfig.labelMinWidth} 组成标签／内容比例。
   */
  labelColPercent?: number;
  /**
   * 详情 Descriptions 标签列最小宽度（CSS 长度或像素数字），缺省 `"13.5rem"`。
   */
  labelMinWidth?: string | number;
}

/** 列表查询（page 从 1 起；order 对外统一 asc｜desc） */
export interface Query {
  page: number;
  pageSize: number;
  sort: string;
  order: "asc" | "desc";
  /** 搜索字段 → 原始字符串（仅非空） */
  filters: Record<string, string>;
}

/** `list()` 返回 */
export interface ListResult {
  items: Row[];
  total: number;
  /** 合计行数据：列 prop → 数值 */
  totals?: Record<string, number>;
}

/** 新增 / 编辑结果；失败时可带整体或字段级错误 */
export type WriteResult =
  | void
  | { ok: true }
  | {
    ok: false;
    /** 顶部错误文案 */
    message?: string;
    /** 出错的字段名 */
    fields?: string[];
    /** 字段名 → 错误文案 */
    messages?: Record<string, string>;
  };

/** 批量操作结果 */
export interface BulkResult {
  /** 成功处理条数 */
  removed: number;
  failed: { id: string; error: string }[];
}

/** 导入结果 */
export interface ImportResult {
  created: number;
  failed: number;
}

type MaybePromise<T> = T | Promise<T>;

/**
 * 数据源：所有读写都经过它。`list` 必需，其余按需提供，缺省的能力对应按钮 / 列会自动隐藏。
 * `list` 同步返回时首屏可 SSR 直出（`createLocalDataSource` 即如此）。
 */
export interface DataSource {
  /** 为 true 表示 `list` 同步返回：首帧（含 SSR）直接渲染，无需挂载后再请求 */
  sync?: boolean;
  list(query: Query): MaybePromise<ListResult>;
  create?(values: Record<string, unknown>): MaybePromise<WriteResult>;
  update?(
    id: string,
    values: Record<string, unknown>,
  ): MaybePromise<WriteResult>;
  /** 删除；面板保证只在用户确认对话后才会调用 */
  remove?(ids: string[]): MaybePromise<BulkResult>;
  /** 给多行设置同一字段（批量状态 / 行内编辑） */
  setField?(
    ids: string[],
    field: string,
    value: unknown,
  ): MaybePromise<BulkResult>;
  /** 导入 CSV / JSON 解析后的行 */
  importRows?(
    rows: Record<string, string>[],
  ): MaybePromise<ImportResult>;
}

/** 能力开关（缺省按数据源方法是否存在推断） */
export interface Caps {
  create: boolean;
  update: boolean;
  view: boolean;
  remove: boolean;
  /**
   * Batch「设为…」唯一能力开关（不在 toolbar 冒充）。
   * UI 在选中批量条 `dp-batch-bar`；默认：存在 `column.batch:true`（且 switch＋两档 options）
   * 且 dataSource.setField 时为 true。调用方可显式 true｜false 覆盖。
   */
  batchStatus: boolean;
  import: boolean;
  export: boolean;
  print: boolean;
  columns: boolean;
  /** 行高密度切换 */
  density: boolean;
  /** 面板全屏 */
  fullscreen: boolean;
  /** 复制选中行到剪贴板 */
  copy: boolean;
}

/**
 * Unified toolbar entry (no row).
 * - `true` / `false` = show only (`disable` defaults false → clickable)
 * - object may override show / disable / icon / label / action
 * - omit `show` → true; omit `disable` → false (both optional)
 * - show / disable may be zero-arg functions (evaluated when building slots)
 * - `disable: true` (or fn→true) = still visible, button disabled — NOT the same as show:false
 * - 未声明的内置键 → 回落 caps（一层真相）；声明则须明确 true｜false｜object（勿用 undefined 绕）
 * - unknown keys are custom; custom keys MUST provide `action` (asserted at mount)
 * - object literal key order = display order; undeclared builtins append after, in default order
 * - no `confirm` field: callers who need confirmation open Popconfirm/dialog inside `action`
 * - 批量「设为…」不在 toolbar：见 caps.batchStatus ＋ column.batch
 */
/**
 * Action button tone — full Button ColorVariant set.
 * Toolbar custom keys map to Button `variant`; row icon buttons use hover color classes.
 * Builtin remove defaults to `danger`.
 */
export type ActionTone =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "ghost";

export type ActionCtrl =
  | boolean
  | {
    show?: boolean | (() => boolean);
    /** Default false. true / fn→true = disabled but still visible. */
    disable?: boolean | (() => boolean);
    icon?: unknown;
    /**
     * Visible text when no icon (toolbar custom) / aria. Omit → fall back to `title` then key.
     */
    label?: string;
    /**
     * Optional Tooltip text. Empty string treated as omit.
     * Final tip = title ?? label ?? builtinMessages ?? key.
     * Also used as display text when `label` is omitted.
     */
    title?: string | (() => string);
    /** Visual tone (Button ColorVariant). Default "default". Toolbar → variant; row icons → hover color. */
    tone?: ActionTone;
    /** Builtin: omit → default handler. Custom key: required (assert throws if missing). */
    action?: () => void;
  };

/**
 * Row-action entry; show / disable / action / title may be per-item functions
 * (`item` = current row).
 * `disable: true` (or fn→true) = still visible, button disabled.
 */
export type RowActionCtrl =
  | boolean
  | {
    show?: boolean | ((item: Row) => boolean);
    /** Default false. true / fn→true = disabled but still visible. */
    disable?: boolean | ((item: Row) => boolean);
    icon?: unknown;
    /**
     * Visible / aria text. Omit → fall back to resolved `title` then key.
     */
    label?: string;
    /**
     * Optional Tooltip text (may be (item)=>…). Empty string treated as omit.
     * Final tip = title ?? label ?? builtinMessages ?? key.
     * Also used as display text when `label` is omitted.
     */
    title?: string | ((item: Row) => string);
    /**
     * Optional confirm bubble. Non-empty string or `(item)=>string` wraps the
     * row button in Popconfirm; omit / empty → click runs `action` immediately.
     */
    confirm?: string | ((item: Row) => string);
    /** Visual tone (Button ColorVariant). Default "default"; builtin remove uses danger. */
    tone?: ActionTone;
    /** Builtin: omit → default handler. Custom key: required unless `href` is set. */
    action?: (item: Row) => void;
    /** 打开链接（string 或 (row)=>string）。自定义键可与 action 二选一。 */
    href?: string | ((item: Row) => string);
  };

export type ToolbarBuiltin =
  | "create"
  | "search"
  | "refresh"
  | "print"
  | "import"
  | "export"
  | "columns"
  | "density"
  | "fullscreen"
  | "copy";

export type RowBuiltin = "view" | "edit" | "remove";

/** Default toolbar display order for undeclared builtins. */
export const TOOLBAR_BUILTINS: readonly ToolbarBuiltin[] = [
  "create",
  "search",
  "refresh",
  "print",
  "import",
  "export",
  "columns",
  "density",
  "fullscreen",
  "copy",
] as const;

/** Default row-action display order for undeclared builtins. */
export const ROW_BUILTINS: readonly RowBuiltin[] = [
  "view",
  "edit",
  "remove",
] as const;

const TOOLBAR_BUILTIN_SET = new Set<string>(TOOLBAR_BUILTINS);
const ROW_BUILTIN_SET = new Set<string>(ROW_BUILTINS);

export function isToolbarBuiltin(key: string): key is ToolbarBuiltin {
  return TOOLBAR_BUILTIN_SET.has(key);
}

export function isRowBuiltin(key: string): key is RowBuiltin {
  return ROW_BUILTIN_SET.has(key);
}

/**
 * Unified Record config. Key write order = display order.
 * Builtins: create/search/… Custom keys sit beside them; must have `action`.
 * Abolished: `extra` arrays and `order` mix fields.
 */
/**
 * Unified Record config（对齐旧 tools 一眼 true｜false）。
 * 省略键 → 内置回落 caps；声明键请写明确 true｜false｜object（勿传 undefined 绕 caps）。
 * Abolished: `extra` arrays and `order` mix fields.
 */
export type PanelToolbarConfig = Record<string, ActionCtrl>;

/**
 * 操作列按钮 Record（写在 `Column.actions`，`type:"actions"`）。
 * 同形：show／disable／action 可 (item)=>…；省略键 → 内置回落 caps；声明键请写明确 true｜false｜object。
 * Abolished: 顶层 `rowActions`、`extra` arrays、`order`。
 */
export type RowActionsConfig = Record<string, RowActionCtrl>;

/** Evaluate boolean | (() => boolean); undefined → fallback. */
function evalFlag(
  val: boolean | (() => boolean) | undefined,
  fallback: boolean,
): boolean {
  if (val === undefined) return fallback;
  return typeof val === "function" ? val() : val;
}

/** Evaluate boolean | ((item) => boolean); undefined → fallback. */
function evalRowFlag(
  val: boolean | ((item: Row) => boolean) | undefined,
  item: Row,
  fallback: boolean,
): boolean {
  if (val === undefined) return fallback;
  return typeof val === "function" ? val(item) : val;
}

/** Evaluate title; omit / empty → undefined (no Tooltip). */
function evalTitle(
  val: string | (() => string) | undefined,
): string | undefined {
  if (val === undefined) return undefined;
  const s = typeof val === "function" ? val() : val;
  return s === "" ? undefined : s;
}

function evalRowTitle(
  val: string | ((item: Row) => string) | undefined,
  item: Row,
): string | undefined {
  if (val === undefined) return undefined;
  const s = typeof val === "function" ? val(item) : val;
  return s === "" ? undefined : s;
}

/**
 * Final Tooltip / accessible tip for a toolbar/row action:
 * `title ?? label ?? builtinDefault ?? key` (empty strings = omit).
 * Builtin messages stay preferred over bare English key.
 * Display text helper: {@link actionDisplayText}.
 */
export function actionTipText(
  key: string,
  title?: string,
  label?: string,
  builtinDefault?: string,
): string {
  if (title) return title;
  if (label) return label;
  if (builtinDefault != null && builtinDefault !== "") return builtinDefault;
  return key;
}

/**
 * Visible button text / aria when rendering a custom (or labeled) control:
 * `label ?? title ?? key` (empty strings = omit).
 */
export function actionDisplayText(
  key: string,
  label?: string,
  title?: string,
): string {
  if (label) return label;
  if (title) return title;
  return key;
}

/**
 * Resolve toolbar ActionCtrl → { show, disable, action? }.
 * - 未声明（调用方传入 undefined／省略）→ show = fallbackShow（caps）；disable = false
 * - boolean → show = that value; disable = false
 * - object → omit show defaults **true**；omit disable defaults false（声明即 caller 真相，不回落 caps）
 * Functions for show/disable are invoked with no args.
 */
export function resolveActionCtrl(
  ctrl: ActionCtrl | undefined,
  fallbackShow: boolean,
): {
  show: boolean;
  disable: boolean;
  title?: string;
  tone?: ActionTone;
  label?: string;
  icon?: unknown;
  action?: () => void;
} {
  if (ctrl === undefined) return { show: fallbackShow, disable: false };
  if (typeof ctrl === "boolean") return { show: ctrl, disable: false };
  return {
    show: evalFlag(ctrl.show, true),
    disable: evalFlag(ctrl.disable, false),
    title: evalTitle(ctrl.title),
    tone: ctrl.tone,
    label: ctrl.label,
    icon: ctrl.icon,
    action: typeof ctrl.action === "function" ? ctrl.action : undefined,
  };
}

/**
 * Resolve a row-action entry for one item (current row).
 * Same defaults: object omit show → true; omit disable → false;
 * 未声明 → fallbackShow (caps)。
 */
export function resolveRowActionCtrl(
  ctrl: RowActionCtrl | undefined,
  item: Row,
  fallbackShow: boolean,
): {
  show: boolean;
  disable: boolean;
  icon?: unknown;
  label?: string;
  title?: string;
  tone?: ActionTone;
  action?: (item: Row) => void;
  href?: string;
  confirm?: string;
} {
  if (ctrl === undefined) return { show: fallbackShow, disable: false };
  if (typeof ctrl === "boolean") return { show: ctrl, disable: false };
  const href = ctrl.href;
  const confirm = evalRowTitle(ctrl.confirm, item);
  return {
    show: evalRowFlag(ctrl.show, item, true),
    disable: evalRowFlag(ctrl.disable, item, false),
    icon: ctrl.icon,
    label: ctrl.label,
    title: evalRowTitle(ctrl.title, item),
    tone: ctrl.tone,
    action: ctrl.action,
    href: typeof href === "function" ? href(item) : href,
    ...(confirm !== undefined ? { confirm } : {}),
  };
}

/** Throw if any custom toolbar key lacks `action`. Call at mount / before render. */
export function assertToolbarConfig(
  cfg: PanelToolbarConfig | false | undefined,
): void {
  if (!cfg) return;
  for (const [key, val] of Object.entries(cfg)) {
    if (isToolbarBuiltin(key)) continue;
    if (
      typeof val === "object" && val !== null &&
      typeof val.action === "function"
    ) {
      continue;
    }
    throw new Error(
      `DataPanel toolbar custom key "${key}" requires action(); ` +
        `got ${
          val === null
            ? "null"
            : typeof val === "object"
            ? typeof (val as { action?: unknown }).action
            : typeof val
        }`,
    );
  }
}

/** Throw if any custom `Column.actions` key lacks `action`. Call at mount / before render. */
export function assertRowActionsConfig(
  cfg: RowActionsConfig | undefined,
): void {
  if (!cfg) return;
  for (const [key, val] of Object.entries(cfg)) {
    if (isRowBuiltin(key) || key === "close") continue;
    if (
      typeof val === "object" && val !== null &&
      (typeof val.action === "function" || val.href != null)
    ) {
      continue;
    }
    throw new Error(
      `DataPanel column.actions custom key "${key}" requires action(row) or href; ` +
        `got ${
          val === null
            ? "null"
            : typeof val === "object"
            ? typeof (val as { action?: unknown }).action
            : typeof val
        }`,
    );
  }
}

/** 表格行高密度 */
export type Density = "compact" | "comfortable" | "loose";

/** 导出格式 */
export type ExportFormat = "xlsx" | "csv" | "json" | "xml" | "html";

/** 导入格式（无 html） */
export type ImportFormat = "xlsx" | "csv" | "json" | "xml";

/** 界面语言 */
export type Locale = "zh-CN" | "en-US";

/** 可本地化文案；`{x}` 为占位符 */
export interface Messages {
  search: string;
  create: string;
  refresh: string;
  /** 工具栏刷新成功提示 */
  refreshed: string;
  print: string;
  import: string;
  export: string;
  columns: string;
  resetColumns: string;
  /** 行高／密度 */
  density: string;
  densityCompact: string;
  densityComfortable: string;
  densityLoose: string;
  /** 切换密度后的提示，{mode} 为当前档文案 */
  densitySet: string;
  enterFullscreen: string;
  exitFullscreen: string;
  copy: string;
  /** 已复制 {n} 行 */
  copyDone: string;
  /** 无选中时的提示 */
  copyEmpty: string;
  copyFailed: string;
  /** 列设置里「多选」列的显示名 */
  colSelect: string;
  /** 列设置里「序号」列的显示名 */
  colIndex: string;
  all: string;
  reset: string;
  searchSubmit: string;
  total: string;
  totalCount: string;
  range: string;
  rangeEmpty: string;
  perPage: string;
  jump: string;
  page: string;
  selected: string;
  batchSet: string;
  batchDelete: string;
  clearSelection: string;
  deleteTitle: string;
  deleteAsk: string;
  deleteMany: string;
  batchConfirmTitle: string;
  batchStatusAsk: string;
  partial: string;
  importDone: string;
  importBad: string;
  doubleClickToEdit: string;
  add: string;
  edit: string;
  view: string;
  delete: string;
  actions: string;
  confirm: string;
  /** 新建表单提交按钮（无行数据） */
  save: string;
  /** 编辑表单提交按钮（有行数据） */
  update: string;
  cancel: string;
  /** 查看详情弹窗页脚的「关闭」按钮 */
  close: string;
  saved: string;
  deleted: string;
  loading: string;
  empty: string;
  networkError: string;
  invalid: string;
  required: string;
  min: string;
  max: string;
  patternMismatch: string;
  yes: string;
  no: string;
  exportFailed: string;
  formatXlsx: string;
  formatCsv: string;
  formatJson: string;
  formatXml: string;
  formatHtml: string;
}
