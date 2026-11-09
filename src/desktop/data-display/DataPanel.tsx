/**
 * DataPanel 数据面板（桌面 · 数据展示）。
 *
 * 一块完整的「列表管理」面板：卡片标题栏 + 工具栏按钮组（添加 / 搜索 / 刷新 / 打印 / 导入 / 导出 / 列设置 / 行高 / 全屏 / 复制，
 * 相邻按钮之间只有一条淡分割线）+ 搜索 Modal（工具栏按钮打开，提交即搜索、重置即清空） + 批量操作条 + 表格（排序、多选、行内编辑、合计行、
 * 操作列）+ 分页（每页条数、页码、跳页）。新增 / 编辑 / 查看使用 Modal；**任何删除与批量「设为…」都必须先确认（行内删除／批量删除／批量设为均为按钮上方的小气泡 Popconfirm）**，
 * 绝不走 Modal 确认对话框，也绝不直接执行。导出支持 xlsx（原生 OOXML）/ csv / json / xml / html，支持浅色与深色主题（`.dark`）。
 *
 * 数据通过 props 注入，与任何后端无关：
 * - `data`：本地数组，面板内置本地数据源（过滤 / 排序 / 分页 / 合计 / 增删改全部在内存完成）；
 * - `dataSource`：自定义 {@link DataSource}，`list(query)` 返回当前页，其余写操作按需提供。
 * - 拉数优先级：显式 `dataSource` ＞ 传入 `data`（本地源、不自动请求）＞ 二者皆无且给了 `baseRoute`（1 段时再拼 `resource`；≥2 段直接作根）时才 {@link createApiDataSource} 拉列表。勿用 pathname 猜资源。
 *
 * **SSR / 水合**：布尔属性只在为 true 时输出；`sync` 数据源（含 `data` 模式）首帧同步渲染，水合前后 DOM 一致。
 */
import { createSignal, type JSXRenderable, onCleanup, onMount } from "@dreamer/view";
import { Button, ButtonGroup } from "../basic/Button.tsx";
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import { IconChevronUp } from "../../shared/basic/icons/ChevronUp.tsx";
import { IconColumns } from "../../shared/basic/icons/Columns.tsx";
import { IconCopy } from "../../shared/basic/icons/Copy.tsx";
import { IconDownload } from "../../shared/basic/icons/Download.tsx";
import { IconEdit } from "../../shared/basic/icons/Edit.tsx";
import { IconExitFullscreen } from "../../shared/basic/icons/ExitFullscreen.tsx";
import { IconEye } from "../../shared/basic/icons/Eye.tsx";
import { IconList } from "../../shared/basic/icons/List.tsx";
import { IconMaximize2 } from "../../shared/basic/icons/Maximize2.tsx";
import { IconPlus } from "../../shared/basic/icons/Plus.tsx";
import { IconPrinter } from "../../shared/basic/icons/Printer.tsx";
import { IconRefresh } from "../../shared/basic/icons/Refresh.tsx";
import { IconSearch } from "../../shared/basic/icons/Search.tsx";
import { IconTrash } from "../../shared/basic/icons/Trash.tsx";
import { IconUpload } from "../../shared/basic/icons/Upload.tsx";
import { Card } from "./Card.tsx";
import { Descriptions } from "./Descriptions.tsx";
import { Dropdown } from "../navigation/Dropdown.tsx";
import { FormItem } from "../form/FormItem.tsx";
import { Input } from "../form/Input.tsx";
import { Select } from "../form/Select.tsx";
import { MultiSelect } from "../form/MultiSelect.tsx";
import { InputNumber } from "../form/InputNumber.tsx";
import { DatePicker } from "../form/DatePicker.tsx";
import { DateTimePicker } from "../form/DateTimePicker.tsx";
import { Switch } from "../form/Switch.tsx";
import { Textarea } from "../form/Textarea.tsx";
import { Modal } from "../feedback/Modal.tsx";
import { Popconfirm } from "../feedback/Popconfirm.tsx";
import { Tooltip } from "../feedback/Tooltip.tsx";
import { message } from "../feedback/message-store.ts";
import {
  formatMessage,
  resolveDataPanelMessages,
} from "./data-panel-messages.ts";
import { parseXlsx } from "./data-panel-xlsx.ts";
import {
  buildExportFile,
  createLocalDataSource,
  displayValue,
  formatDateTime,
  formatMoney,
  pageList,
  parseCsv,
  parseJsonRows,
  parseXmlRows,
  enrichFormFields,
  enrichSearchFields,
  fieldLayoutStyle,
  fieldProp,
  looksLikeHtml,
  normalizeColumns,
  queryFromParams,
  queryToParams,
  resolveBatchStatusColumn,
  resolveColumnFn,
  useFieldGrid,
  validateForm,
  validateSearchFields,
  resolvePanelColumns,
  isSelectionColumn,
  isIndexColumn,
  isActionsColumn,
  isSystemColumn,
  colProp,
} from "./data-panel-utils.ts";
import {
  createApiDataSource,
  type ApiMode,
} from "./data-panel-api-source.ts";
import {
  assertRowActionsConfig,
  assertToolbarConfig,
  isRowBuiltin,
  isToolbarBuiltin,
  resolveActionCtrl,
  actionTipText,
  actionDisplayText,
  resolveRowActionCtrl,
  ROW_BUILTINS,
  TOOLBAR_BUILTINS,
  type ActionCtrl,
  type ActionTone,
  type BulkResult,
  type Caps,
  type Column,
  type DataSource,
  type Density,
  type ExportFormat,
  type ImportFormat,
  type FieldRule,
  type FormField,
  type ListResult,
  type Locale,
  type Messages,
  type Option,
  type Query,
  type Row,
  type RowActionsConfig,
  type SearchField,
  type Tone,
  type ViewSchema,
  type PanelToolbarConfig,
  type WriteResult,
  type RowActionCtrl,
  type RowBuiltin,
  type ToolbarBuiltin,
} from "./data-panel-types.ts";

export type {
  ActionCtrl,
  ActionTone,
  BulkResult,
  Caps,
  Column,
  DataSource,
  Density,
  ExportFormat,
  ImportFormat,
  FieldRule,
  FormField,
  ListResult,
  Locale,
  Messages,
  Option,
  Query,
  Row,
  RowActionsConfig,
  SearchField,
  Tone,
  ViewSchema,
  PanelToolbarConfig,
  WriteResult,
  RowActionCtrl,
  RowBuiltin,
  ToolbarBuiltin,
};

export {
  assertRowActionsConfig,
  assertToolbarConfig,
  isRowBuiltin,
  isToolbarBuiltin,
  resolveActionCtrl,
  actionTipText,
  actionDisplayText,
  resolveRowActionCtrl,
  ROW_BUILTINS,
  TOOLBAR_BUILTINS,
} from "./data-panel-types.ts";

/** 导出时传给 `onExport` 的上下文 */
export interface ExportContext {
  /** 当前可见且允许导出的列 */
  columns: Column[];
  /** 当前查询（含筛选 / 排序，page 与 pageSize 为当前页） */
  query: Query;
  /** 拉取符合当前筛选的全部行 */
  fetchAll: () => Promise<ListResult>;
}

export interface PanelProps {
  /**
   * 面板标识：列显隐／行高／全屏的持久化键（`@dreamer/storage/client` → `dp-prefs-${panelKey}`）、
   * 以及 `refreshDataPanel(key)`；同页多面板须唯一。默认 "data-panel"。
   */
  panelKey?: string;
  /** 卡片标题 */
  title: string;
  /** 列定义 */
  columns: Column[];
  /** 搜索项（键用 prop；工具栏搜索打开 Modal）；非空时自动与地址栏双向同步，无开关。options／label 可从 columns 继承 */
  search?: SearchField[];
  /** 新增 / 编辑 Modal 的表单项 */
  form?: FormField[];
  /**
   * 增改 Modal 标题（对齐旧 `form.title`）：`string` 或 `(row)=>string`。
   * 新增时 `row` 为 `{}`（无 id）；编辑时为当前行。缺省 `${edit|add} · ${title}`。
   */
  formTitle?: string | ((row: Row) => string);
  /**
   * 搜索 Modal 标题（对齐旧搜索弹层标题）：`string` 或 `()=>string`。
   * 缺省 `${search} · ${title}`。
   */
  searchTitle?: string | (() => string);
  /**
   * 详情 Modal 标题（对齐旧 `view.title`）：`string` 或 `(row)=>string`。
   * 缺省 `${view} · ${title}`。
   */
  viewTitle?: string | ((row: Row) => string);
  /**
   * 详情项（对齐旧 `view.schemas`）：数组或 `(row)=>` 数组。
   * 项：`{ label, value?, children?, prop?, span? }`；`children`＞`value`＞`prop` 取行字段。
   * 缺省时回落 columns＋form 字段。
   */
  viewSchemas?:
    | {
      label: string;
      value?: unknown;
      children?: unknown;
      prop?: string;
      span?: number;
    }[]
    | ((row: Row) => {
      label: string;
      value?: unknown;
      children?: unknown;
      prop?: string;
      span?: number;
    }[]);
  /** 本地数据（内置本地数据源）。传入则不自动请求列表；优先级低于显式 `dataSource`，高于 `baseRoute`（API） */
  data?: Row[];
  /** 自定义数据源；若传入则走它，勿再自造拉数（优先于 `data`／`baseRoute`） */
  dataSource?: DataSource;
  /**
   * 路由前缀或完整资源根（如 `"/api"` 或 `"/api/users"`）。
   * **仅当未传 `data` 且未传 `dataSource`** 时调用 {@link createApiDataSource} 并拉 list。
   * 去首尾 `/` 分段：≥2 段直接作根；仅 1 段再拼 {@link PanelProps.resource}。
   * **须显式传入**，勿用页面 pathname 推断。
   */
  baseRoute?: string;
  /**
   * 资源名／当前资源路由段（如 `"users"`）。
   * **仅当 `baseRoute` 只有 1 段时需要**；≥2 段时忽略。仅在无 `data`／无 `dataSource` 时生效。
   */
  resource?: string;
  /**
   * API 风格，默认 `"action"`。仅在无 `data`／无 `dataSource` 且由 `baseRoute` 生成数据源时生效。
   * @see createApiDataSource
   */
  apiMode?: ApiMode;
  /** `data` 模式下数据变化时回调（新增 / 编辑 / 删除 / 批量 / 导入） */
  onDataChange?: (rows: Row[]) => void;
  /** 首屏数据（服务端预取）；提供后挂载时不再请求 */
  initial?: ListResult;
  /** 初始查询（page / pageSize / sort / order / filters） */
  initialQuery?: Partial<Query>;
  /** 主键字段，默认 id */
  rowKey?: string;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 每页条数下拉选项，默认 [10, 20, 50, 100] */
  pageSizes?: number[];
  /** 默认排序 */
  defaultSort?: { prop: string; order: "asc" | "desc" };
  /** 固定过滤（并入每次查询，不出现在 URL） */
  fixed?: Record<string, string>;
  /** 能力开关；缺省按数据源方法推断。未在 toolbar／column.actions 声明的钮回落于此。 */
  caps?: Partial<Caps>;
  /**
   * Toolbar config, or `false` to hide the entire toolbar bar.
   * - `false` → do not render the toolbar (`data-panel-toolbar`) at all
   * - omit / `{}` / Record → Unified toolbar Record (existing behavior)
   * Declared keys: omit show→true, omit disable→false (caller truth).
   * 省略键 → 内置回落 caps；声明键请写明确 true｜false｜object。Undeclared builtins → caps, after declared.
   * Object key write order = display order. Custom keys require `action`. No `extra` / `order`.
   */
  toolbar?: false | PanelToolbarConfig;
  /** 界面语言（内置 zh-CN / en-US），默认 zh-CN */
  locale?: Locale;
  /** 覆盖文案 */
  messages?: Partial<Messages>;
  /** 导出文件名（不含扩展名），默认取 title */
  exportName?: string;
  /** 初始行高密度，默认 comfortable（舒适） */
  defaultDensity?: Density;
  /** 自定义单元格渲染（按列 prop） */
  renderCell?: Record<string, (row: Row) => unknown>;
  /** 任一写操作成功后回调 */
  onChanged?: () => void;
  /**
   * @deprecated 改由 columns 驱动：写入 `{ type:"selection" }`。
   * - `false`：仍强制去掉 selection 列（兼容）
   * - 省略／`true`：若 columns 未声明 selection，且 caps.remove／batchStatus 需要多选时自动前置（旧行为）
   */
  selectable?: boolean;
  /**
   * 行是否禁用选择／删除／行内编辑（对齐旧清晰禁用；替代魔字段 `row.locked`）。
   * 缺省时回落 `!!row.locked` 以兼容旧数据。
   */
  isRowDisabled?: (row: Row) => boolean;
  /** 接管导入：收到解析后的行（xlsx／csv／json／xml；缺省时走 dataSource.importRows） */
  onImportRows?: (rows: Record<string, string>[]) => void;
  /** 接管导出：缺省时面板自行拉取全部行并生成文件下载 */
  onExport?: (
    format: ExportFormat,
    ctx: ExportContext,
  ) => void | Promise<void>;
  /**
   * @deprecated 已移除开关：分页（page／pageSize）与排序默认与地址栏双向同步；配置了
   * {@link PanelProps.search} 时搜索字段一并同步。无需再传；保留字段仅为兼容旧调用，传值会被忽略。
   */
  syncUrl?: boolean;
  /** 额外 class（加在卡片上） */
  class?: string;
  /** 面板根节点内的额外内容（如自定义 Modal） */
  children?: unknown;
}

import {
  ACT_TONE_HOVER,
  ACTS_CLS,
  bool,
  Btn,
  CARD_STYLE,
  CELL_EDIT_CLS,
  densityTableCls,
  ED_WRAP_CLS,
  FS_CLS,
  g,
  ICON_BTN,
  JUMP_CLS,
  onServer,
  PG_CLS,
  PG_CTRLS_CLS,
  PGSIZE_SELECT_CLS,
  PGSIZE_WRAP_CLS,
  POP_OVERLAY_CLS,
  RANGE_CLS,
  readDataPanelPrefs,
  refreshers,
  ROW_CLS,
  SWITCH_ANIM_MS,
  TABLE_WRAP_CLS,
  TB_FIRST_STYLE,
  TB_LAST_STYLE,
  TB_NF_STYLE,
  TB_NL_STYLE,
  TB_STYLE,
  TONE,
  writeDataPanelPrefs,
} from "./data-panel-chrome.tsx";

export { DATA_PANEL_CSS, refreshDataPanel } from "./data-panel-chrome.tsx";



export function DataPanel(props: PanelProps): JSXRenderable {
  const m = resolveDataPanelMessages(props.locale, props.messages);
  const tr = (tpl: string, params?: Record<string, string | number>) =>
    formatMessage(tpl, params);
  const key = props.panelKey ?? "data-panel";
  const rowKey = props.rowKey ?? "id";
  const idOf = (r: Row): string => String(r[rowKey]);
  const inputColumns = normalizeColumns(props.columns);
  /** 数据列（不含 selection／index 系统列）——数据源／导出／合计用 */
  const dataInputColumns = inputColumns.filter(
    (c) => !isSelectionColumn(c) && !isIndexColumn(c),
  );
  const searchDefs = enrichSearchFields(props.search ?? [], dataInputColumns);
  const formDefs = enrichFormFields(props.form ?? [], dataInputColumns);
  const pageSizes = props.pageSizes ?? [10, 20, 50, 100];
  const defaultPageSize = props.pageSize ?? 10;

  // 拉数优先级：dataSource ＞ data（本地、不自动请求）＞ 二者皆无＋baseRoute → API
  const ds: DataSource = props.dataSource
    ? props.dataSource
    : props.data !== undefined
    ? createLocalDataSource({
      rows: props.data,
      columns: dataInputColumns,
      search: searchDefs,
      form: formDefs,
      rowKey,
      fixed: props.fixed,
      onChange: props.onDataChange,
      writable: !!(props.form && props.form.length) || !!props.onDataChange,
    })
    : props.baseRoute
    ? createApiDataSource({
      baseRoute: props.baseRoute,
      resource: props.resource,
      apiMode: props.apiMode,
      rowKey,
    })
    : createLocalDataSource({
      rows: [],
      columns: dataInputColumns,
      search: searchDefs,
      form: formDefs,
      rowKey,
      fixed: props.fixed,
      onChange: props.onDataChange,
      writable: !!(props.form && props.form.length) || !!props.onDataChange,
    });

  /** 批量「设为…」：column.batch:true 且 inline:switch＋两档 options */
  const batchStatusCol = resolveBatchStatusColumn(dataInputColumns);
  const statusField = batchStatusCol?.field;
  const statusValues = batchStatusCol?.values ?? [];

  const caps: Caps = {
    create: !!ds.create,
    update: !!ds.update,
    view: true,
    remove: !!ds.remove,
    batchStatus: !!ds.setField && !!batchStatusCol,
    import: !!ds.importRows,
    export: true,
    print: true,
    columns: true,
    density: true,
    fullscreen: true,
    copy: true,
    ...(props.caps ?? {}),
  };
  // Caller overrides: show = resolve(caller, capsFallback). Handlers (action/on*) never imply visibility.
  const toolbarHidden = props.toolbar === false;
  const tbCfg: PanelToolbarConfig =
    props.toolbar && typeof props.toolbar === "object" ? props.toolbar : {};
  /** 行操作配置：来自 columns 里 type:"actions" 的 `actions` 字段（废止顶层 rowActions） */
  const actionsColIn = inputColumns.find(
    (c) => c.type === "actions" || c.prop === "__actions",
  );
  const raCfg: RowActionsConfig = actionsColIn?.actions ?? {};
  assertToolbarConfig(tbCfg);
  assertRowActionsConfig(raCfg);
  const tbResolved = (name: ToolbarBuiltin, fallback: boolean) =>
    resolveActionCtrl(tbCfg[name], fallback);
  const rowResolved = (
    name: RowBuiltin,
    row: Row,
    fallback: boolean,
  ) => resolveRowActionCtrl(raCfg[name], row, fallback);
  /** Whether a builtin row action might appear for any row (drives actions column). */
  const rowMayShow = (name: RowBuiltin, fallback: boolean): boolean => {
    const raw = raCfg[name];
    // Key absent → undeclared path uses fallback (caps). Key present with undefined → same.
    if (!(name in raCfg)) return fallback;
    if (raw === undefined) return fallback;
    if (typeof raw === "boolean") return raw;
    if (typeof raw.show === "function") return true;
    // Declared object: omit show → true (caller truth)
    return resolveRowActionCtrl(raw, {}, fallback).show;
  };
  const hasCustomRowAction = Object.keys(raCfg).some((k) => !isRowBuiltin(k));
  /** 批量「设为…」：仅 caps.batchStatus（已挪出 toolbar）；UI 仍在选中批量条 */
  const batchStatusOn = caps.batchStatus;
  const needSelection = caps.remove || batchStatusOn;
  const needActions = !!(
    rowMayShow("view", caps.view) ||
    rowMayShow("edit", caps.update) ||
    rowMayShow("remove", caps.remove) ||
    hasCustomRowAction
  );
  /** 含 selection／index／actions 的完整列（显式 columns 优先；缺省兼容自动补） */
  const panelColumns = resolvePanelColumns(inputColumns, {
    selectable: props.selectable,
    needSelection,
    needActions,
  });
  /** 数据列（解析后，不含系统列） */
  const columns = panelColumns.filter((c) => !isSystemColumn(c));
  const isLocked = (r: Row) =>
    props.isRowDisabled ? !!props.isRowDisabled(r) : !!r.locked;

  /**
   * 分页（page／pageSize）与排序默认与地址栏双向同步——无开关（对齐工具栏搜索）。
   * 配置了 search 时，搜索字段一并写入／回填。首帧从 location.search 读入
   * （与 queryToParams 约定对称）；无 location 时（SSR）跳过。
   */
  const urlSync = true;
  const urlPartial: Partial<Query> =
    urlSync && g.location?.search
      ? queryFromParams(new URLSearchParams(g.location.search.replace(/^\?/, "")), {
        searchNames: searchDefs.map((s) => fieldProp(s)),
        fixed: props.fixed,
      })
      : {};
  const iq = props.initialQuery ?? {};
  let initialQuery: Query = {
    page: urlPartial.page ?? iq.page ?? 1,
    pageSize: urlPartial.pageSize ?? iq.pageSize ?? defaultPageSize,
    sort: urlPartial.sort ?? iq.sort ?? (props.defaultSort?.prop ?? ""),
    order: urlPartial.order ??
      iq.order ??
      (props.defaultSort?.order === "desc" ? "desc" : "asc"),
    filters: {
      ...(iq.filters ?? {}),
      ...(urlPartial.filters ?? {}),
      ...(props.fixed ?? {}),
    },
  };

  // 首帧数据：显式 initial，或同步数据源直接计算。
  // 同页多面板共用 URL page 时，小数据集易出现 page 越界 → rows=[] 且 total>0
  // （「暂无数据」+「第 11-6 条」）。load() 内已夹页，但有 first 时 onMount 不调 load，须在此夹。
  let first: ListResult | undefined = props.initial;
  if (!first && ds.sync) first = ds.list(initialQuery) as ListResult;
  if (first) {
    const ps = Math.max(1, initialQuery.pageSize || 10);
    const last = Math.max(1, Math.ceil(first.total / ps));
    if (initialQuery.page > last) {
      initialQuery = { ...initialQuery, page: last };
      // 同步源按夹页后的 query 重算；纯 async+initial 等 onMount/load 再夹
      if (ds.sync) first = ds.list(initialQuery) as ListResult;
    }
  }

  const rows = createSignal<Row[]>(first?.rows ?? []);
  const total = createSignal(first?.total ?? 0);
  const totals = createSignal<Record<string, number>>(first?.totals ?? {});
  const query = createSignal<Query>(initialQuery);
  const loading = createSignal(false);
  const density = createSignal<Density>(
    props.defaultDensity ?? "comfortable",
  );
  /** 密度菜单受控开闭：选后写 false，避免仅靠 __lastDropdownClose／冒泡关不掉 */
  const densityOpen = createSignal(false);
  const panelFs = createSignal(false);
  const selected = createSignal<string[]>([]);
  const hidden = createSignal<Record<string, boolean>>(
    Object.fromEntries(
      columns.filter((c) => c.hidden).map((c) => [c.prop, true]),
    ),
  );
  // 搜索表单在 Modal 里（工具栏按钮打开）；每个字段一个 signal，输入时不会重渲染输入框
  const searchOpen = createSignal(false);
  const searchErrors = createSignal<Record<string, string>>({});
  const sfields: Record<string, ReturnType<typeof createSignal<string>>> = {};
  for (const sdef of searchDefs) {
    sfields[fieldProp(sdef)] = createSignal(initialQuery.filters[fieldProp(sdef)] ?? "");
  }
  const fieldRequired = (f: { required?: boolean; rules?: { required?: boolean }[] }) =>
    !!f.required || !!(f.rules && f.rules.some((r) => r.required));
  const jump = createSignal("");
  /** 移动断点（≤639.98px）：底栏分页 Select／按钮用 xs；桌面 md */
  const isNarrow = createSignal(false);
  let seq = 0;

  const listParams = (q: Query, forUrl: boolean) =>
    queryToParams(q, {
      forUrl,
      defaultPageSize,
      defaultSort: props.defaultSort,
      fixed: props.fixed,
    });

  // ---- data loading
  /** 工具栏刷新最短 busy，避免本地同步 list 瞬间结束导致 loading 从未上屏 */
  const REFRESH_MIN_BUSY_MS = 320;
  type LoadOpts = { minBusyMs?: number; notify?: boolean };
  async function holdBusy(started: number, minMs?: number): Promise<void> {
    if (!minMs) return;
    const left = minMs - (Date.now() - started);
    if (left > 0) {
      await new Promise<void>((r) => setTimeout(r, left));
    }
  }
  async function load(syncUrl = true, opts?: LoadOpts): Promise<void> {
    const my = ++seq;
    const started = Date.now();
    loading.value = true;
    const q = query.value;
    let res: ListResult;
    try {
      // 始终再次调用数据源 list（远程 Promise 会等待；同步源也会再跑一遍过滤／分页）
      res = await Promise.resolve(
        ds.list({
          ...q,
          filters: { ...q.filters, ...(props.fixed ?? {}) },
        }),
      );
    } catch (e) {
      if (my !== seq) return;
      await holdBusy(started, opts?.minBusyMs);
      if (my !== seq) return;
      loading.value = false;
      message.error((e as Error)?.message || m.networkError);
      return;
    }
    if (my !== seq) return;
    const last = Math.max(1, Math.ceil(res.total / q.pageSize));
    if (q.page > last) {
      query.value = { ...q, page: last };
      return load(syncUrl, opts);
    }
    rows.value = res.rows;
    total.value = res.total;
    totals.value = res.totals ?? {};
    selected.value = [];
    if (urlSync && syncUrl && g.history && g.location) {
      const qs = listParams(q, true).toString();
      g.history.replaceState(
        null,
        "",
        g.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
    await holdBusy(started, opts?.minBusyMs);
    if (my !== seq) return;
    loading.value = false;
    if (opts?.notify) message.success(m.refreshed);
  }
  /**
   * 工具栏刷新：必须再次 await ds.list 拉数（真请求／真重算），再配 loading 遮罩与成功／失败 toast。
   * minBusy 只保证同步源也能看见转圈，不能替代 list 调用。
   */
  function refreshFromToolbar(): Promise<void> {
    return load(false, { minBusyMs: REFRESH_MIN_BUSY_MS, notify: true });
  }
  refreshers.set(key, () => load(false));

  function setQuery(patch: Partial<Query>): void {
    query.value = { ...query.value, ...patch };
    void load();
  }

  /** 可见列（含系统列；按 columns 写入序） */
  const columnsVisible = () =>
    panelColumns.filter((c) => c.prop && !hidden.value[c.prop!]);
  /** 可见数据列 */
  const dataColumnsVisible = () =>
    columnsVisible().filter((c) => !isSystemColumn(c));
  const showIndexCol = () => columnsVisible().some((c) => isIndexColumn(c));
  const indexColLabel = () =>
    panelColumns.find((c) => isIndexColumn(c))?.label || "#";
  const actionsColLabel = () => {
    const lab = panelColumns.find((c) => isActionsColumn(c))?.label;
    return (lab && String(lab).trim()) ? lab : m.actions;
  };
  /** 重置列：回到列定义里的 default hidden */
  const defaultHidden = (): Record<string, boolean> =>
    Object.fromEntries(
      panelColumns.filter((c) => c.hidden && c.prop).map((c) => [c.prop!, true]),
    );

  // ---- 首次加载（异步数据源）与本地偏好（@dreamer/storage/client：列／密度／全屏）
  onMount(() => {
    // 服务端渲染（含 happy-dom）也会执行 onMount：不发请求、不读本地存储
    if (onServer()) return;
    void (async () => {
      const prefs = await readDataPanelPrefs(key);
      if (prefs.hidden) hidden.value = prefs.hidden;
      if (
        prefs.density === "compact" ||
        prefs.density === "comfortable" ||
        prefs.density === "loose"
      ) {
        density.value = prefs.density;
      }
      if (prefs.fullscreen) setPanelFullscreen(true);
      if (!first) void load(false);
    })();
    const onKey = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === "Escape" && panelFs.value) {
        applyFullscreenChrome(false);
        void writeDataPanelPrefs(key, { fullscreen: false });
      }
    };
    const mq = globalThis.matchMedia?.("(max-width: 639.98px)");
    if (mq) {
      const syncNarrow = () => {
        isNarrow.value = mq.matches;
      };
      syncNarrow();
      mq.addEventListener("change", syncNarrow);
      onCleanup(() => mq.removeEventListener("change", syncNarrow));
    }
    g.document?.addEventListener?.("keydown", onKey);
    onCleanup(() => {
      g.document?.removeEventListener?.("keydown", onKey);
      applyFullscreenChrome(false);
    });
  });
  function saveHidden(next: Record<string, boolean>): void {
    hidden.value = next;
    void writeDataPanelPrefs(key, { hidden: next });
  }

  // ---- 确认一律小气泡 Popconfirm（行内删除／批量删除／批量设为）；不走 Modal 确认对话框
  const rowName = (r: Row): string => {
    const c = columns[0];
    return String(r[c?.prop ?? rowKey] ?? r.name ?? r.username ?? idOf(r));
  };

  function reportBulk(res: BulkResult, okText: string): void {
    const failed = res.failed ?? [];
    if (!failed.length) {
      message.success(okText);
      return;
    }
    const reason = failed[0].error;
    if ((res.removed ?? 0) > 0) {
      message.warning(
        tr(m.partial, { ok: res.removed ?? 0, fail: failed.length, reason }),
      );
    } else message.error(reason);
  }

  async function guarded<T>(fn: () => T | Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (e) {
      message.error((e as Error)?.message || m.networkError);
      return undefined;
    }
  }

  /** 真正执行删除（行内／批量气泡确认共用） */
  async function doRemove(ids: string[]): Promise<void> {
    if (!ds.remove) return;
    const r = await guarded(() => ds.remove!(ids));
    if (r) reportBulk(r, m.deleted);
    await load(false);
    props.onChanged?.();
  }

  /** 真正执行批量设为（气泡确认后） */
  async function doSetStatus(ids: string[], value: string): Promise<void> {
    if (!ds.setField || !statusField) return;
    const r = await guarded(() => ds.setField!(ids, statusField, value));
    if (r) reportBulk(r, m.saved);
    await load(false);
    props.onChanged?.();
  }

  /** 当前打开删除气泡确认的行 id（单行） */
  const popRow = createSignal<string | null>(null);
  /** 批量删除气泡是否打开 */
  const popBatch = createSignal(false);
  /** 批量「设为…」气泡：打开中的 status value；null 关闭 */
  const popStatus = createSignal<string | null>(null);

  // ---- 行内编辑
  const editing = createSignal<{ id: string; prop: string } | null>(null);
  async function setField(
    row: Row,
    prop: string,
    value: unknown,
  ): Promise<void> {
    const id = idOf(row);
    let failed: string | undefined;
    let ok = false;
    if (ds.setField) {
      const r = await guarded(() => ds.setField!([id], prop, value));
      if (r) {
        ok = true;
        failed = r.failed?.[0]?.error;
      }
    } else if (ds.update) {
      const r = await guarded(() => ds.update!(id, { [prop]: value }));
      ok = true;
      if (r && r.ok === false) failed = r.message ?? m.invalid;
    }
    if (failed) message.error(failed);
    else if (ok) {
      message.success(m.saved);
      props.onChanged?.();
    }
    await load(false);
  }

  // ---- 新增 / 编辑 Modal
  const formOpen = createSignal(false);
  const formId = createSignal("");
  /** 当前增改行；新增时为 null（formTitle 回调收到 `{}`） */
  const formRow = createSignal<Row | null>(null);
  const formBusy = createSignal(false);
  const formErrors = createSignal<Record<string, string>>({});
  const formTop = createSignal("");
  const fields: Record<string, ReturnType<typeof createSignal<string>>> = {};
  for (const f of formDefs) fields[fieldProp(f)] = createSignal("");
  /** 多选字段的数组镜像（供 ui-view MultiSelect 绑定；与 fields 的逗号串保持同步） */
  const mfields: Record<string, ReturnType<typeof createSignal<string[]>>> = {};
  for (const f of formDefs) mfields[fieldProp(f)] = createSignal<string[]>([]);

  function openForm(row?: Row): void {
    formId.value = row ? idOf(row) : "";
    formRow.value = row ?? null;
    for (const f of formDefs) {
      const raw = row ? row[fieldProp(f)] : undefined;
      let v: string;
      if (raw === undefined || raw === null) {
        v = row ? "" : String(
          f.initial ??
            (f.type === "switch" ? (f.onOff ? f.onOff[0] : "true") : ""),
        );
      } else if (f.type === "datetime" || f.type === "date") {
        const s = formatDateTime(raw);
        v = f.type === "date" ? s.slice(0, 10) : s.slice(0, 16);
      } else if (f.type === "switch") {
        v = f.onOff ? String(raw) : (raw ? "true" : "false");
      } else if (Array.isArray(raw)) v = raw.join(",");
      else v = String(raw);
      if (f.type === "password") v = "";
      fields[fieldProp(f)].value = v;
      mfields[fieldProp(f)].value = v.split(",").filter(Boolean);
    }
    formErrors.value = {};
    formTop.value = "";
    formOpen.value = true;
  }

  function collectValues(isEdit: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const f of formDefs) {
      if (f.createOnly && isEdit) continue;
      if (f.editOnly && !isEdit) continue;
      const v = fields[fieldProp(f)].value;
      if (f.type === "multiselect") body[fieldProp(f)] = v.split(",").filter(Boolean);
      else if (f.type === "number") body[fieldProp(f)] = v === "" ? "" : Number(v);
      else if (f.type === "datetime") body[fieldProp(f)] = v.replace(" ", "T");
      else if (f.type === "switch" && !f.onOff) body[fieldProp(f)] = v === "true";
      else if (f.type === "password" && isEdit && v === "") continue;
      else body[fieldProp(f)] = v;
    }
    return body;
  }

  async function submitForm(): Promise<void> {
    if (formBusy.value) return;
    const id = formId.value;
    const values = collectValues(!!id);
    const errs = validateForm(formDefs, values, !!id, m);
    if (Object.keys(errs).length) {
      formErrors.value = errs;
      formTop.value = m.invalid;
      return;
    }
    formBusy.value = true;
    formErrors.value = {};
    formTop.value = "";
    let r: WriteResult;
    try {
      r = id ? await ds.update?.(id, values) : await ds.create?.(values);
    } catch (e) {
      formBusy.value = false;
      formTop.value = (e as Error)?.message || m.networkError;
      return;
    }
    formBusy.value = false;
    if (!r || r.ok) {
      formOpen.value = false;
      message.success(m.saved);
      await load(false);
      props.onChanged?.();
      return;
    }
    const msgs = { ...(r.messages ?? {}) };
    for (const f of r.fields ?? []) if (!msgs[f]) msgs[f] = m.invalid;
    formErrors.value = msgs;
    formTop.value = r.message ?? m.invalid;
  }

  // ---- 查看 Modal
  const viewRow = createSignal<Row | null>(null);

  const doCreate = () => openForm();
  const doEdit = (r: Row) => openForm(r);
  const doView = (r: Row) => {
    viewRow.value = r;
  };

  // ---- 导出 / 打印 / 导入
  async function fetchAll(): Promise<ListResult> {
    const q = query.value;
    const base = { ...q, filters: { ...q.filters, ...(props.fixed ?? {}) } };
    const size = 500;
    const all: Row[] = [];
    let totalAll = 0;
    let totalsAll: Record<string, number> | undefined;
    for (let page = 1; page <= 200; page++) {
      const r = await ds.list({ ...base, page, pageSize: size });
      all.push(...r.rows);
      totalAll = r.total;
      totalsAll = r.totals;
      if (all.length >= r.total || r.rows.length === 0) break;
    }
    return { rows: all, total: totalAll, totals: totalsAll };
  }

  function downloadFile(
    file: { filename: string; mime: string; data: Uint8Array | string },
  ): void {
    const doc = g.document;
    if (!doc || !g.URL?.createObjectURL) return;
    // deno-lint-ignore no-explicit-any
    const blob = new Blob([file.data as any], { type: file.mime });
    const url = g.URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url;
    a.download = file.filename;
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => g.URL?.revokeObjectURL(url), 1000);
  }

  async function exportAs(fmt: ExportFormat): Promise<void> {
    const cols = dataColumnsVisible().filter((c) => !c.noExport);
    try {
      if (props.onExport) {
        await props.onExport(fmt, {
          columns: cols,
          query: query.value,
          fetchAll,
        });
        return;
      }
      const all = await fetchAll();
      downloadFile(buildExportFile({
        format: fmt,
        title: props.title,
        basename: props.exportName ?? props.title,
        columns: cols,
        rows: all.rows,
        messages: m,
        totals: cols.some((c) => c.total) ? all.totals : undefined,
      }));
    } catch (e) {
      message.error((e as Error)?.message || m.exportFailed);
    }
  }

  function printTable(): void {
    const cols = dataColumnsVisible();
    const esc = (s: string) =>
      s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
        ">",
        "&gt;",
      );
    const head = cols.map((c) => `<th>${esc(c.label ?? c.prop ?? "")}</th>`).join("");
    const body = rows.value
      .map((r) =>
        `<tr>${
          cols.map((c) => `<td>${esc(displayValue(c, r, m))}</td>`).join("")
        }</tr>`
      )
      .join("");
    const w = g.open?.("", "_blank");
    if (!w) return;
    w.document.write(
      `<!doctype html><title>${
        esc(props.title)
      }</title><style>body{font:13px sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 8px;text-align:left}</style><h3>${
        esc(props.title)
      }</h3><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  /** 把解析后的行写入（表头可为列文案或字段名） */
  async function applyImportedRows(
    parsed: Record<string, string>[],
  ): Promise<void> {
    if (props.onImportRows) return props.onImportRows(parsed);
    const byLabel = new Map(columns.map((c) => [c.label, c.prop]));
    const mapped = parsed.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [byLabel.get(k) ?? k, v]),
      )
    );
    const r = await ds.importRows?.(mapped);
    if (r) {
      message.success(
        tr(m.importDone, { created: r.created, failed: r.failed }),
      );
    }
    await load(false);
    props.onChanged?.();
  }

  /** 按所选导入格式打开文件选择器并解析 */
  function pickImport(fmt: ImportFormat): void {
    const doc = g.document;
    if (!doc) return;
    const accept: Record<ImportFormat, string> = {
      xlsx:
        ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: ".csv,text/csv",
      json: ".json,application/json",
      xml: ".xml,application/xml,text/xml",
    };
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = accept[fmt];
    input.setAttribute("data-testid", "dp-import-input");
    input.setAttribute("data-import-format", fmt);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        let parsed: Record<string, string>[];
        if (fmt === "xlsx") {
          parsed = await parseXlsx(new Uint8Array(await file.arrayBuffer()));
        } else if (fmt === "json") {
          parsed = parseJsonRows(await file.text());
        } else if (fmt === "xml") {
          parsed = parseXmlRows(await file.text());
        } else {
          parsed = parseCsv(await file.text());
        }
        await applyImportedRows(parsed);
      } catch {
        message.error(m.importBad);
      }
    };
    input.click();
  }

  // ---- 密度 / 全屏 / 复制
  function applyFullscreenChrome(on: boolean): void {
    panelFs.value = on;
    try {
      if (g.document?.body) {
        g.document.body.style.overflow = on ? "hidden" : "";
      }
    } catch { /* ignore */ }
  }
  /** 用户切换全屏：写 UI + 持久化；卸载清理勿走此函数以免抹掉已存偏好 */
  function setPanelFullscreen(on: boolean): void {
    applyFullscreenChrome(on);
    void writeDataPanelPrefs(key, { fullscreen: on });
  }
  function toggleFullscreen(): void {
    setPanelFullscreen(!panelFs.value);
  }
  function densityLabel(d: Density): string {
    if (d === "compact") return m.densityCompact;
    if (d === "loose") return m.densityLoose;
    return m.densityComfortable;
  }
  function setDensity(d: Density): void {
    density.value = d;
    densityOpen.value = false;
    void writeDataPanelPrefs(key, { density: d });
    message.success(tr(m.densitySet, { mode: densityLabel(d) }));
  }
  async function writeClipboard(text: string): Promise<void> {
    const nav = (globalThis as unknown as {
      navigator?: { clipboard?: { writeText?(s: string): Promise<void> } };
    }).navigator;
    if (typeof nav?.clipboard?.writeText === "function") {
      await nav.clipboard.writeText(text);
      return;
    }
    const doc = g.document;
    if (!doc) throw new Error("no document");
    const ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    doc.body.appendChild(ta);
    ta.select();
    const ok = typeof doc.execCommand === "function"
      ? doc.execCommand("copy")
      : false;
    ta.remove();
    if (!ok) throw new Error("execCommand copy failed");
  }
  async function copySelected(): Promise<void> {
    const ids = selected.value;
    if (!ids.length) {
      message.warning(m.copyEmpty);
      return;
    }
    const idSet = new Set(ids);
    const cols = dataColumnsVisible().filter((c) => !c.noExport);
    const data = rows.value.filter((r) => idSet.has(idOf(r)));
    if (!data.length) {
      message.warning(m.copyEmpty);
      return;
    }
    const escCell = (s: string) => s.replace(/\t|\r?\n/g, " ");
    const header = cols.map((c) => escCell(c.label)).join("\t");
    const lines = data.map((r) =>
      cols.map((c) => escCell(displayValue(c, r, m))).join("\t")
    );
    try {
      await writeClipboard([header, ...lines].join("\n"));
      message.success(tr(m.copyDone, { n: data.length }));
    } catch {
      message.error(m.copyFailed);
    }
  }
  /** 必须是 getter：静态 overlay 会冻住 ✓；选中后关菜单 */
  const densityMenu = () => (
    <div
      class="flex min-w-28 flex-col gap-0.5 p-1"
      data-testid="dp-density-menu"
    >
      {([
        ["compact", m.densityCompact],
        ["comfortable", m.densityComfortable],
        ["loose", m.densityLoose],
      ] as const).map(([d, label]) => (
        <button
          type="button"
          class="rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          data-testid={`dp-density-${d}`}
          aria-pressed={density.value === d ? "true" : "false"}
          onClick={() => setDensity(d)}
        >
          {label}
          {density.value === d ? " ✓" : ""}
        </button>
      ))}
    </div>
  );

  // ---- 工具栏
  // Object.keys write order = display order; undeclared builtins append in TOOLBAR_BUILTINS order.
  const TB_FALLBACK: Record<ToolbarBuiltin, boolean> = {
    create: caps.create,
    search: searchDefs.length > 0,
    refresh: true,
    print: caps.print,
    import: caps.import,
    export: caps.export,
    columns: caps.columns,
    density: caps.density,
    fullscreen: caps.fullscreen,
    copy: caps.copy,
  };
  type TbSlot =
    | {
      kind: "builtin";
      name: ToolbarBuiltin;
      disable: boolean;
      title?: string;
      label?: string;
      tone?: ActionTone;
      action?: () => void;
    }
    | {
      kind: "custom";
      key: string;
      disable: boolean;
      label: unknown;
      icon?: unknown;
      title?: string;
      tone?: ActionTone;
      action: () => void;
    };

  /**
   * Always wrap with Tooltip when content is non-empty.
   * Callers resolve content via actionTipText: title ?? label ?? builtin ?? key.
   * 工具栏／操作列 tip 默认 placement=top；Popconfirm 打开时用 `disabled` 压掉同锚点 tip（不挡确认钮）。
   */
  const tipWrap = (
    content: string | undefined,
    node: unknown,
    opts?: {
      placement?: "top" | "bottom";
      disabled?: boolean | (() => boolean);
    },
  ) =>
    content
      ? (
        <Tooltip
          content={content}
          placement={opts?.placement ?? "top"}
          disabled={opts?.disabled}
        >
          {node}
        </Tooltip>
      )
      : node;

  const toneActCls = (tone?: ActionTone): string => {
    if (!tone || tone === "default") return "";
    const hover = ACT_TONE_HOVER[tone] ?? "";
    // danger keeps legacy dp-act-del (tests / existing styles) plus dp-act-danger
    if (tone === "danger") return ` dp-act-del dp-act-danger ${hover}`;
    return ` dp-act-${tone} ${hover}`;
  };

  const toolbarSlots = (): TbSlot[] => {
    const slots: TbSlot[] = [];
    const declared = new Set<string>();
    for (const key of Object.keys(tbCfg)) {
      declared.add(key);
      if (isToolbarBuiltin(key)) {
        // Declared: object omit show→true（声明即真相；省略键才回落 caps）
        const r = resolveActionCtrl(
          tbCfg[key],
          isToolbarBuiltin(key) ? TB_FALLBACK[key] : true,
        );
        if (!r.show) continue;
        slots.push({
          kind: "builtin",
          name: key,
          disable: r.disable,
          title: r.title,
          label: r.label,
          tone: r.tone,
          action: r.action,
        });
        continue;
      }
      const raw = tbCfg[key];
      // assertToolbarConfig already ensured action exists for custom keys
      if (typeof raw !== "object" || raw === null) continue;
      const r = resolveActionCtrl(raw, true);
      if (!r.show) continue;
      slots.push({
        kind: "custom",
        key,
        disable: r.disable,
        label: actionDisplayText(key, raw.label, r.title),
        icon: raw.icon,
        title: r.title,
        tone: r.tone,
        action: r.action!,
      });
    }
    for (const name of TOOLBAR_BUILTINS) {
      if (declared.has(name)) continue;
      const r = tbResolved(name, TB_FALLBACK[name]);
      if (!r.show) continue;
      slots.push({
        kind: "builtin",
        name,
        disable: r.disable,
        title: r.title,
        label: r.label,
        tone: r.tone,
      });
    }
    return slots;
  };

  const TB_IDS: Record<ToolbarBuiltin, string> = {
    create: "dp-create",
    search: "dp-search-toggle",
    refresh: "dp-refresh",
    print: "dp-print",
    import: "dp-import",
    export: "dp-export",
    columns: "dp-columns",
    density: "dp-density",
    fullscreen: "dp-fullscreen",
    copy: "dp-copy",
  };
  const toolIds = (): string[][] =>
    toolbarSlots().map((s) => {
      if (s.kind === "custom") {
        const label = typeof s.label === "string" ? s.label : s.key;
        return [`dp-tb-extra-${s.key}`, label];
      }
      const labels: Record<ToolbarBuiltin, string> = {
        create: m.create,
        search: m.search,
        refresh: m.refresh,
        print: m.print,
        import: m.import,
        export: m.export,
        columns: m.columns,
        density: m.density,
        fullscreen: panelFs.value ? m.exitFullscreen : m.enterFullscreen,
        copy: m.copy,
      };
      return [TB_IDS[s.name], labels[s.name]];
    });

  const tagToolbar = (): boolean => {
    const root = g.document?.querySelector?.(`[data-dp-tools="${key}"]`);
    if (!root) return false;
    const btns = root.querySelectorAll("button");
    const ids = toolIds();
    if (btns.length < ids.length) return false;
    ids.forEach(([id, label], i) => {
      const b = btns[i];
      b.setAttribute("data-testid", id);
      b.setAttribute("aria-label", label);
      // 不要 HTML title：与 ui-view Tooltip 叠成双提示
      b.removeAttribute("title");
    });
    return true;
  };
  onMount(() => {
    if (onServer()) return;
    for (const ms of [0, 30, 120, 400, 1000]) setTimeout(tagToolbar, ms);
  });
  const posCls = (id: string): string => {
    const ids = toolIds().map((x) => x[0]);
    const i = ids.indexOf(id);
    const n = ids.length;
    // 标记类紧挨（SSR 测断言 `dp-tb dp-tb-first …`）；视觉走 TB_*_STYLE
    return `px-2.5 dp-tb${i === 0 ? " dp-tb-first" : " dp-tb-nf"}${
      i === n - 1 ? " dp-tb-last" : " dp-tb-nl"
    } ${TB_STYLE} ${i === 0 ? TB_FIRST_STYLE : TB_NF_STYLE} ${
      i === n - 1 ? TB_LAST_STYLE : TB_NL_STYLE
    }`;
  };
  const toolBtn = (
    id: string,
    messageLabel: string,
    onClick: () => void,
    icon: unknown,
    disable = false,
    title?: string,
    ctrlLabel?: string,
  ) => (
    <Tooltip
      content={actionTipText(id, title, ctrlLabel, messageLabel)}
      placement="top"
    >
      <Button
        type="button"
        size="sm"
        class={posCls(id)}
        disabled={disable}
        data-testid={id}
        aria-label={actionTipText(id, title, ctrlLabel, messageLabel)}
        onClick={onClick}
      >
        {icon}
      </Button>
    </Tooltip>
  );

  const importMenu = (
    <div
      class="flex min-w-32 flex-col gap-0.5 p-1"
      data-testid="dp-import-menu"
    >
      {(["xlsx", "csv", "json", "xml"] as const).map((f) => (
        <button
          type="button"
          class="rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          data-testid={`dp-import-${f}`}
          onClick={() => pickImport(f)}
        >
          {{
            xlsx: m.formatXlsx,
            csv: m.formatCsv,
            json: m.formatJson,
            xml: m.formatXml,
          }[f]}
        </button>
      ))}
    </div>
  );

  const exportMenu = (
    <div
      class="flex min-w-32 flex-col gap-0.5 p-1"
      data-testid="dp-export-menu"
    >
      {(["xlsx", "csv", "json", "xml", "html"] as const).map((f) => (
        <button
          type="button"
          class="rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          data-testid={`dp-export-${f}`}
          onClick={() => void exportAs(f)}
        >
          {{
            xlsx: m.formatXlsx,
            csv: m.formatCsv,
            json: m.formatJson,
            xml: m.formatXml,
            html: m.formatHtml,
          }[f]}
        </button>
      ))}
    </div>
  );

  function toggleHiddenProp(prop: string): void {
    const next = { ...hidden.value };
    if (next[prop]) delete next[prop];
    else next[prop] = true;
    saveHidden(next);
  }

  const columnMenu = () => (
    <div
      class="flex max-h-72 min-w-40 flex-col gap-1 overflow-auto p-2"
      data-testid="dp-column-menu"
      onClick={(e: Event) => e.stopPropagation()}
      onMouseDown={(e: Event) => e.stopPropagation()}
    >
      {panelColumns.map((c) => {
        const prop = c.prop!;
        const label = isSelectionColumn(c)
          ? (c.label || m.colSelect)
          : isIndexColumn(c)
          ? (c.label || m.colIndex || "#")
          : isActionsColumn(c)
          ? (c.label || m.actions)
          : (c.label || prop);
        return (
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...bool("checked", !hidden.value[prop])}
              data-testid={`dp-col-${prop}`}
              onChange={() => toggleHiddenProp(prop)}
            />
            {label}
          </label>
        );
      })}
      <button
        type="button"
        class="mt-1 border-t border-slate-200 px-1 pt-2 text-left text-xs font-medium text-slate-700 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:text-white"
        data-testid="dp-col-reset"
        onClick={() => saveHidden(defaultHidden())}
      >
        {m.resetColumns}
      </button>
    </div>
  );

  const renderTbBuiltin = (
    name: ToolbarBuiltin,
    disable: boolean,
    action?: () => void,
    title?: string,
    label?: string,
  ) => {
    switch (name) {
      case "create":
        return toolBtn("dp-create", m.create, action ?? doCreate, <IconPlus size="sm" />, disable, title, label);
      case "search":
        return toolBtn("dp-search-toggle", m.search, action ?? openSearch, <IconSearch size="sm" />, disable, title, label);
      case "refresh":
        return (
          <Tooltip content={actionTipText("refresh", title, label, m.refresh)} placement="top">
            <Button
              type="button"
              size="sm"
              class={posCls("dp-refresh")}
              disabled={loading.value || disable}
              data-testid="dp-refresh"
              aria-label={actionTipText("refresh", title, label, m.refresh)}
              aria-busy={loading.value ? true : undefined}
              onClick={action ?? (() => void refreshFromToolbar())}
            >
              <span class={loading.value ? "inline-flex animate-spin" : "inline-flex"}>
                <IconRefresh size="sm" />
              </span>
            </Button>
          </Tooltip>
        );
      case "print":
        return toolBtn("dp-print", m.print, action ?? printTable, <IconPrinter size="sm" />, disable, title, label);
      case "import":
        if (action) {
          return toolBtn("dp-import", m.import, action, <IconUpload size="sm" />, disable, title, label);
        }
        return tipWrap(
          actionTipText("import", title, label, m.import),
          <Dropdown overlay={importMenu} placement="bottomRight" trigger="click">
            <Button type="button" size="sm" class={posCls("dp-import")} disabled={disable} data-testid="dp-import" aria-label={actionTipText("import", title, label, m.import)}>
              <IconUpload size="sm" />
            </Button>
          </Dropdown>,
        );
      case "export":
        return tipWrap(
          actionTipText("export", title, label, m.export),
          <Dropdown overlay={exportMenu} placement="bottomRight" trigger="click">
            <Button type="button" size="sm" class={posCls("dp-export")} disabled={disable} data-testid="dp-export" aria-label={actionTipText("export", title, label, m.export)}>
              <IconDownload size="sm" />
            </Button>
          </Dropdown>,
        );
      case "columns":
        return tipWrap(
          actionTipText("columns", title, label, m.columns),
          <Dropdown
            overlay={columnMenu}
            placement="bottomRight"
            trigger="click"
            closeOnOverlayClick={false}
          >
            <Button type="button" size="sm" class={posCls("dp-columns")} disabled={disable} data-testid="dp-columns" aria-label={actionTipText("columns", title, label, m.columns)}>
              <IconColumns size="sm" />
            </Button>
          </Dropdown>,
        );
      case "density":
        return tipWrap(
          actionTipText("density", title, label, m.density),
          (
          <Dropdown
            open={densityOpen}
            onOpenChange={(o) => {
              densityOpen.value = o;
            }}
            overlay={densityMenu}
            placement="bottomRight"
            trigger="click"
            closeOnOverlayClick
          >
            <Button type="button" size="sm" class={posCls("dp-density")} disabled={disable} data-testid="dp-density" aria-label={actionTipText("density", title, label, m.density)}>
              <IconList size="sm" />
            </Button>
          </Dropdown>
          ),
        );
      case "fullscreen":
        return (
          <Tooltip
            content={actionTipText(
              "fullscreen",
              title,
              label,
              panelFs.value ? m.exitFullscreen : m.enterFullscreen,
            )}
            placement="top"
          >
            <Button
              type="button"
              size="sm"
              class={posCls("dp-fullscreen")}
              disabled={disable}
              data-testid="dp-fullscreen"
              aria-label={actionTipText(
                "fullscreen",
                title,
                label,
                panelFs.value ? m.exitFullscreen : m.enterFullscreen,
              )}
              onClick={toggleFullscreen}
            >
              {panelFs.value
                ? <IconExitFullscreen size="sm" />
                : <IconMaximize2 size="sm" />}
            </Button>
          </Tooltip>
        );
      case "copy":
        return toolBtn(
          "dp-copy",
          m.copy,
          action ?? (() => void copySelected()),
          <IconCopy size="sm" />,
          disable,
          title,
          label,
        );
    }
  };

  const toolbar = () => toolbarHidden ? null : (
    <div
      class="flex w-full flex-wrap items-center justify-end gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700"
      data-testid="data-panel-toolbar"
    >
      <div class="contents" data-dp-tools={key}>
        <ButtonGroup attached class="dp-tool-group">
          {toolbarSlots().map((s) => {
            if (s.kind === "custom") {
              const tip = actionTipText(
                s.key,
                s.title,
                typeof s.label === "string" ? s.label : undefined,
              );
              const variant = s.tone; // full ColorVariant / ActionTone
              const btn = (
                <span
                  class="inline-flex"
                  data-testid={`dp-tb-extra-${s.key}`}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={variant}
                    class={posCls(`dp-tb-extra-${s.key}`)}
                    disabled={s.disable}
                    onClick={() => s.action()}
                  >
                    {s.icon != null ? s.icon : s.label}
                  </Button>
                </span>
              );
              return tipWrap(tip, btn);
            }
            return renderTbBuiltin(s.name, s.disable, s.action, s.title, s.label);
          })}
        </ButtonGroup>
      </div>
    </div>
  );

  // ---- 搜索表单（Modal）：提交即搜索，重置即清空
  function openSearch(): void {
    for (const sdef of searchDefs) {
      sfields[fieldProp(sdef)].value = query.value.filters[fieldProp(sdef)] ?? "";
    }
    searchErrors.value = {};
    searchOpen.value = true;
  }
  function applySearch(): void {
    const values: Record<string, unknown> = {};
    const filters: Record<string, string> = {};
    for (const sdef of searchDefs) {
      const v = sfields[fieldProp(sdef)].value.trim();
      values[fieldProp(sdef)] = v;
      if (v) filters[fieldProp(sdef)] = v;
    }
    const errs = validateSearchFields(searchDefs, values, m);
    if (Object.keys(errs).length) {
      searchErrors.value = errs;
      return;
    }
    searchErrors.value = {};
    searchOpen.value = false;
    setQuery({ filters: { ...filters, ...(props.fixed ?? {}) }, page: 1 });
  }
  function resetSearch(): void {
    for (const sdef of searchDefs) {
      sfields[fieldProp(sdef)].value = "";
    }
    searchErrors.value = {};
    setQuery({ filters: { ...(props.fixed ?? {}) }, page: 1 });
  }
  const searchBody = () => (
    <form
      class={useFieldGrid(searchDefs) ? "grid grid-cols-12 gap-3" : "grid gap-3"}
      data-testid="dp-search"
      onSubmit={(e: Event) => {
        e.preventDefault();
        applySearch();
      }}
    >
      {searchDefs.map((sdef) => {
        const sig = sfields[fieldProp(sdef)];
        const err = searchErrors.value[fieldProp(sdef)];
        const lay = fieldLayoutStyle(sdef);
        return (
          <div style={lay} class={lay?.width ? undefined : "min-w-0"}>
            <FormItem
              label={sdef.label ?? fieldProp(sdef)}
              required={fieldRequired(sdef)}
              error={err}
            >
              {sdef.type === "select"
                ? (
                  <div class="w-full" data-testid={`dp-f-${fieldProp(sdef)}`}>
                    <Select
                      name={fieldProp(sdef)}
                      size="sm"
                      value={sig}
                      placeholder={sdef.placeholder ?? m.all}
                      options={(sdef.options ?? []).map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                    />
                  </div>
                )
                : (
                  <div class="w-full" data-testid={`dp-f-${fieldProp(sdef)}`}>
                    <Input
                      name={fieldProp(sdef)}
                      type={sdef.type === "date" ? "date" : "text"}
                      value={sig}
                      placeholder={sdef.placeholder}
                      onInput={(e: Event) => {
                        let v = (e.target as unknown as { value: string }).value;
                        if (sdef.maxlength != null && v.length > sdef.maxlength) {
                          v = v.slice(0, sdef.maxlength);
                        }
                        sig.value = v;
                      }}
                    />
                  </div>
                )}
            </FormItem>
            {sdef.hint && !err && (
              <p class="m-0 -mt-1 text-xs text-slate-500 dark:text-slate-400" data-testid={`dp-hint-${fieldProp(sdef)}`}>
                {sdef.hint}
              </p>
            )}
          </div>
        );
      })}
      <div class="mt-2 flex justify-end gap-2">
        <Btn type="submit" variant="primary" data-testid="dp-search-submit">
          {m.searchSubmit}
        </Btn>
        <Btn type="button" data-testid="dp-search-reset" onClick={resetSearch}>
          {m.reset}
        </Btn>
      </div>
    </form>
  );

  // ---- 批量条（显隐跟 caps.batchStatus；数据来自 column.batch:true）
  const batchBar = () => {
    const ids = selected.value;
    if (!ids.length) return null;
    const sv = statusValues;
    const bs = { show: batchStatusOn, disable: false };
    return (
      <div
        class="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-sky-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        data-testid="dp-batch-bar"
      >
        <span data-testid="dp-selected-count">
          {tr(m.selected, { n: ids.length })}
        </span>
        {bs.show &&
          sv.map((s) => (
            <Popconfirm
              open={() => popStatus.value === s.value}
              placement="top"
              title={tr(m.batchStatusAsk, { n: ids.length, status: s.label })}
              okText={m.confirm}
              cancelText={m.cancel}
              overlayClass={POP_OVERLAY_CLS}
              onOpenChange={(o: boolean) => {
                if (!o) popStatus.value = null;
              }}
              onConfirm={() => void doSetStatus(ids, s.value)}
            >
              <Btn
                type="button"
                size="sm"
                data-testid={`dp-batch-status-${s.value}`}
                disabled={bs.disable}
                onClick={() => (popStatus.value = s.value)}
              >
                {tr(m.batchSet, { status: s.label })}
              </Btn>
            </Popconfirm>
          ))}
        {caps.remove && (
          <Popconfirm
            open={() => popBatch.value}
            placement="top"
            danger
            title={tr(m.deleteMany, { n: ids.length })}
            okText={m.delete}
            cancelText={m.cancel}
            overlayClass={POP_OVERLAY_CLS}
            onOpenChange={(o: boolean) => {
              if (!o) popBatch.value = false;
            }}
            onConfirm={() => void doRemove(ids)}
          >
            <Btn
              type="button"
              size="sm"
              variant="danger"
              data-testid="dp-batch-delete"
              onClick={() => (popBatch.value = true)}
            >
              {m.batchDelete}
            </Btn>
          </Popconfirm>
        )}
        <Btn
          type="button"
          size="sm"
          variant="ghost"
          data-testid="dp-batch-clear"
          onClick={() => {
            popBatch.value = false;
            popStatus.value = null;
            selected.value = [];
          }}
        >
          {m.clearSelection}
        </Btn>
      </div>
    );
  };

  // ---- 单元格
  function cell(c: Column, row: Row): unknown {
    const custom = props.renderCell?.[colProp(c)];
    if (custom) return custom(row);
    const raw = row[colProp(c)];
    // Inline edit: column.actions.edit ?? caps.update；inline:switch 列本身可切换（不依赖 edit 能力）
    const canEdit = rowResolved("edit", row, caps.update).show ||
      c.inline === "switch";
    const isSwitch = c.inline === "switch" && !!c.options &&
      c.options.length === 2;
    if (isSwitch && canEdit) {
      // 使用 ui-view 自带 Switch：旋钮 ON 在右、OFF 在左，带过渡动画；
      // locked 行为禁用态（半透明 + not-allowed）。先让旋钮滑动，动画结束后再提交数据
      const [on, off] = c.options!;
      const isOn = String(raw) === on.value;
      const locked = isLocked(row);
      return (
        <span
          class="dp-sw-wrap"
          data-testid={`dp-switch-${idOf(row)}`}
          title={isOn ? on.label : off.label}
        >
          <Switch
            checked={createSignal(isOn)}
            disabled={locked}
            onChange={(e: Event) => {
              if (locked) return;
              const next = (e.target as unknown as { checked: boolean })
                .checked;
              setTimeout(
                () => void setField(row, colProp(c), next ? on.value : off.value),
                SWITCH_ANIM_MS,
              );
            }}
          />
        </span>
      );
    }
    if (c.inline && c.inline !== "switch" && canEdit && !isLocked(row)) {
      const ed = editing.value;
      if (ed && ed.id === idOf(row) && ed.prop === c.prop) {
        return renderEditor(c, row, raw);
      }
      return (
        <span
          class={CELL_EDIT_CLS}
          title={m.doubleClickToEdit}
          data-testid={`dp-edit-${c.prop}-${idOf(row)}`}
          onDblClick={() => (editing.value = { id: idOf(row), prop: colProp(c) })}
        >
          {plainCell(c, row, raw)}
        </span>
      );
    }
    return plainCell(c, row, raw);
  }

  /**
   * 单元格编辑器：全部使用 ui-view 自带表单组件（Input / InputNumber / Select / MultiSelect /
   * DatePicker / DateTimePicker / Textarea）。
   * 失焦 / 点击外部 / Enter 保存，Esc 取消；浮层（下拉、日历）打开期间不会误触发保存，
   * 浮层关闭后焦点离开编辑器才保存。保存失败由 setField 提示并回滚到原值。
   */
  function renderEditor(
    c: Column,
    row: Row,
    raw: unknown,
  ): unknown {
    const kind = c.inline as string;
    const testid = `dp-inline-${c.prop}`;
    const asStr = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      if (kind === "date") {
        const str = String(v);
        return /^\d{4}-\d{2}-\d{2}/.test(str)
          ? str.slice(0, 10)
          : formatDateTime(v).slice(0, 10);
      }
      if (kind === "datetime") return formatDateTime(v).slice(0, 16);
      if (kind === "multiselect") {
        return (Array.isArray(v) ? v.map(String) : String(v).split(","))
          .filter(Boolean).sort().join(",");
      }
      return String(v);
    };
    const original = asStr(raw);
    /** 草稿：单值用 sv，多选用 mv（均由 ui-view 组件回写） */
    const sv = createSignal(original);
    const mv = createSignal<string[]>(original ? original.split(",") : []);
    const mine = editing.value;
    let done = false;
    let wrap: HTMLElement | null = null;
    let offPointer: (() => void) | null = null;
    const popupOpen = (): boolean =>
      !!wrap?.querySelector('[aria-expanded="true"]');
    const finish = (save: boolean): void => {
      if (done) return;
      done = true;
      offPointer?.();
      offPointer = null;
      if (editing.value === mine) editing.value = null;
      if (!save) return;
      const draft = kind === "multiselect"
        ? [...mv.value].sort().join(",")
        : String(sv.value ?? "");
      if (draft === original) return;
      let value: unknown = draft;
      if (kind === "number") {
        const n = Number(draft);
        if (draft.trim() === "" || !Number.isFinite(n)) {
          message.error(m.invalid);
          return;
        }
        value = n;
      } else if (kind === "multiselect") {
        value = draft ? draft.split(",") : [];
      } else if (kind === "datetime") {
        const d = new Date(draft.replace(" ", "T"));
        if (draft && Number.isNaN(d.getTime())) {
          message.error(m.invalid);
          return;
        }
        value = draft ? d.toISOString() : "";
      }
      void setField(row, colProp(c), value);
    };
    /**
     * ref：记录根节点、聚焦，并用原生监听处理失焦 / 点外部 / 键盘
     * （框架的 onBlur 绑定在这里不会触发，会导致编辑框「卡住」不退出）
     */
    const setup = (el: HTMLElement | null): void => {
      wrap = el;
      if (!el) return;
      el.addEventListener("keydown", (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "Escape") {
          if (popupOpen()) return; // 先交给浮层自己关闭
          ke.preventDefault();
          finish(false);
        } else if (ke.key === "Enter") {
          if (popupOpen()) return;
          if (kind === "textarea" && ke.shiftKey) return;
          ke.preventDefault();
          finish(true);
        }
      });
      el.addEventListener("focusout", (e) => {
        const next = (e as FocusEvent).relatedTarget as Node | null;
        if (next && el.contains(next)) return;
        if (next) return finish(true); // Tab 到编辑器外
        // 焦点丢失（点击不可聚焦处 / 浮层选项收起 / 调用 blur()）：稍后判定
        const lost = e.target as HTMLElement;
        setTimeout(() => {
          if (done) return;
          if (el.contains(document.activeElement)) return;
          if (popupOpen()) return;
          // 失焦元素已被收起 / 移除（如下拉选项选中后浮层关闭）：不是用户离开，焦点收回编辑器
          if (!lost.isConnected || lost.getClientRects().length === 0) {
            focusMain();
            return;
          }
          finish(true);
        }, 60);
      });
      const onDown = (e: Event) => {
        if (!el.isConnected) return offPointer?.();
        if (!el.contains(e.target as Node)) finish(true);
      };
      setTimeout(() => {
        if (done) return;
        document.addEventListener("pointerdown", onDown, true);
        offPointer = () =>
          document.removeEventListener("pointerdown", onDown, true);
      }, 0);
      setTimeout(() => focusMain(true), 0);
    };
    /** 把焦点放回编辑器主控件（选择类可顺便展开浮层） */
    const focusMain = (open = false): void => {
      if (done || !wrap) return;
      try {
        const input = wrap.querySelector(
          "input:not([type=hidden]), textarea",
        ) as HTMLInputElement | null;
        const trigger = wrap.querySelector(
          "button[aria-haspopup]",
        ) as HTMLElement | null;
        if (trigger) {
          trigger.focus();
          if (open) trigger.click(); // 选择类编辑器：直接展开浮层
        } else if (input) {
          input.focus();
          if (open) input.select?.();
        }
      } catch { /* 部分 input 类型不支持 select() */ }
    };
    let control: unknown;
    if (kind === "textarea") {
      control = <Textarea rows={3} value={sv} />;
    } else if (kind === "select") {
      control = (
        <Select
          size="sm"
          value={sv}
          options={(c.options ?? []).map((o) => ({
            value: o.value,
            label: o.label,
          }))}
        />
      );
    } else if (kind === "multiselect") {
      control = (
        <MultiSelect
          size="sm"
          value={mv}
          options={(c.options ?? []).map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          onChange={(e: Event) => {
            const v = (e.target as unknown as { value: unknown }).value;
            if (Array.isArray(v)) mv.value = v.map(String);
          }}
        />
      );
    } else if (kind === "number") {
      control = <InputNumber size="sm" value={sv} />;
    } else if (kind === "date") {
      control = (
        <DatePicker
          size="sm"
          value={sv}
          panelAttach="viewport"
          onChange={(e: Event) => {
            sv.value = String((e.target as unknown as { value: string }).value);
          }}
        />
      );
    } else if (kind === "datetime") {
      control = (
        <DateTimePicker
          size="sm"
          value={sv}
          format="YYYY-MM-DD HH:mm"
          panelAttach="viewport"
          onChange={(e: Event) => {
            sv.value = String((e.target as unknown as { value: string }).value);
          }}
        />
      );
    } else {
      control = <Input size="sm" value={sv} />;
    }
    return (
      <div
        class={ED_WRAP_CLS}
        tabIndex={-1}
        ref={setup}
        data-testid={testid}
        data-editor={kind}
      >
        {control}
      </div>
    );
  }

  /**
   * 可信 HTML 字符串 → 节点（@dreamer/view 禁 JSX innerHTML prop，经 ref 写入）。
   * 仅用于列 value／formatter 明确返回的可信片段，勿喂不可信用户输入。
   */
  function TrustedHtml(p: { html: string; class?: string }): JSXRenderable {
    return (
      <span
        class={p.class}
        ref={(el: HTMLElement) => {
          if (el && el.innerHTML !== p.html) el.innerHTML = p.html;
        }}
      />
    );
  }

  /** 原始文本 + 可选 color／tag → dp-tag；自定义节点原样返回 */
  function coerceFnResult(
    result: unknown,
    c: Column,
    row: Row,
  ): unknown {
    if (result === null || result === undefined) return "—";
    if (typeof result === "string") {
      if (looksLikeHtml(result)) return <TrustedHtml html={result} />;
      const tone = typeof c.color === "function" ? c.color(row) : undefined;
      if (c.type === "tag" || tone) {
        return (
          <span
            class={`inline-block rounded px-1.5 py-0.5 text-xs ${
              TONE[tone ?? "default"]
            }`}
          >
            {result === "" ? "—" : result}
          </span>
        );
      }
      return result === "" ? "—" : result;
    }
    if (typeof result === "number" || typeof result === "boolean") {
      const text = String(result);
      const tone = typeof c.color === "function" ? c.color(row) : undefined;
      if (c.type === "tag" || tone) {
        return (
          <span
            class={`inline-block rounded px-1.5 py-0.5 text-xs ${
              TONE[tone ?? "default"]
            }`}
          >
            {text}
          </span>
        );
      }
      return text;
    }
    // JSX／VNode／组件／DOM Node —— 任意可渲染节点，原样交给视图层
    return result;
  }

  /** 非编辑态的单元格展示 */
  function plainCell(
    c: Column,
    row: Row,
    raw: unknown,
  ): unknown {
    const fn = resolveColumnFn(c, row);
    if (fn !== undefined) return coerceFnResult(fn, c, row);
    switch (c.type) {
      case "tag": {
        if (Array.isArray(raw)) {
          return raw.length === 0
            ? "—"
            : (
              <span class="inline-flex flex-wrap gap-1">
                {raw.map((v) => {
                  const oo = c.options?.find((x) => x.value === String(v));
                  return (
                    <span
                      class={`inline-block rounded px-1.5 py-0.5 text-xs ${
                        TONE[oo?.tone ?? "default"]
                      }`}
                    >
                      {oo?.label ?? String(v)}
                    </span>
                  );
                })}
              </span>
            );
        }
        const o = c.options?.find((x) => x.value === String(raw));
        return (
          <span
            class={`inline-block rounded px-1.5 py-0.5 text-xs ${
              TONE[o?.tone ?? "default"]
            }`}
          >
            {o?.label ?? String(raw ?? "")}
          </span>
        );
      }
      case "image":
        return raw
          ? (
            <img
              src={String(raw)}
              alt=""
              class="h-8 w-8 rounded object-cover"
            />
          )
          : "—";
      case "link":
        return raw
          ? (
            <a
              href={String(raw)}
              class="text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noreferrer"
            >
              {String(raw)}
            </a>
          )
          : "—";
      case "money":
        return <span class="tabular-nums">{formatMoney(raw) || "—"}</span>;
      default: {
        const v = displayValue(c, row, m);
        return v === "" ? "—" : v;
      }
    }
  }

  // ---- 表格
  const offset = () => (query.value.page - 1) * query.value.pageSize;
  // Action buttons: column.actions ?? caps, plus custom Record keys.
  // 操作列出现与否／位置／表头／按钮由 columns 的 type:"actions"（及列上 actions）决定。
  const ROW_FALLBACK: Record<RowBuiltin, boolean> = {
    view: caps.view,
    edit: caps.update,
    remove: caps.remove,
  };

  type RowSlot =
    | {
      kind: "builtin";
      name: RowBuiltin;
      disable: boolean;
      title?: string;
      label?: string;
      tone?: ActionTone;
      action?: (row: Row) => void;
    }
    | {
      kind: "custom";
      key: string;
      disable: boolean;
      label: unknown;
      icon?: unknown;
      title?: string;
      tone?: ActionTone;
      action: (row: Row) => void;
    };

  /** Row actions: Object.keys write order; undeclared builtins append in ROW_BUILTINS order. */
  const rowSlots = (r: Row): RowSlot[] => {
    const slots: RowSlot[] = [];
    const declared = new Set<string>();
    for (const key of Object.keys(raCfg)) {
      declared.add(key);
      if (isRowBuiltin(key)) {
        // Declared: object omit show→true; undefined value → caps (capGate allow).
        const res = resolveRowActionCtrl(raCfg[key], r, ROW_FALLBACK[key]);
        if (!res.show) continue;
        slots.push({
          kind: "builtin",
          name: key,
          disable: res.disable,
          title: res.title,
          label: res.label,
          tone: res.tone,
          action: res.action,
        });
        continue;
      }
      const raw = raCfg[key];
      if (typeof raw !== "object" || raw === null) continue;
      const res = resolveRowActionCtrl(raw, r, true);
      if (!res.show) continue;
      slots.push({
        kind: "custom",
        key,
        disable: res.disable,
        label: actionDisplayText(key, res.label, res.title),
        icon: res.icon,
        title: res.title,
        tone: res.tone,
        action: res.action!,
      });
    }
    for (const name of ROW_BUILTINS) {
      if (declared.has(name)) continue;
      const res = rowResolved(name, r, ROW_FALLBACK[name]);
      if (!res.show) continue;
      slots.push({
        kind: "builtin",
        name,
        disable: res.disable,
        title: res.title,
        label: res.label,
        tone: res.tone,
        action: res.action,
      });
    }
    return slots;
  };

  const sortIcon = (prop: string) => {
    const q = query.value;
    if (q.sort !== prop) return <span class="ml-1 opacity-30">↕</span>;
    return q.order === "asc"
      ? <IconChevronUp size="xs" class="ml-1 inline" />
      : <IconChevronDown size="xs" class="ml-1 inline" />;
  };

  function toggleSort(prop: string): void {
    const q = query.value;
    if (q.sort !== prop) return setQuery({ sort: prop, order: "asc", page: 1 });
    if (q.order === "asc") return setQuery({ sort: prop, order: "desc", page: 1 });
    // 第三次点击：回到默认排序
    const ds0 = props.defaultSort;
    setQuery({
      sort: ds0?.prop ?? "",
      order: ds0?.order === "desc" ? "desc" : "asc",
      page: 1,
    });
  }

  const table = () => {
    const displayCols = columnsVisible();
    const cols = displayCols.filter((c) => !isSystemColumn(c));
    const data = rows.value;
    const sel = selected.value;
    const selectableRows = data.filter((r) => !isLocked(r));
    const allSel = selectableRows.length > 0 &&
      selectableRows.every((r) => sel.includes(idOf(r)));
    const t = totals.value;
    const hasTotals = cols.some((c) => c.total) && data.length > 0;
    return (
      <div
        class={densityTableCls(density.value)}
        data-density={density.value}
      >
        {loading.value && (
          <div
            class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60"
            data-testid="dp-loading"
          >
            <span class="animate-pulse text-sm text-slate-500">
              {m.loading}
            </span>
          </div>
        )}
        <table class="w-full border-collapse text-sm" data-testid="dp-table">
          <thead>
            <tr class="bg-slate-50 text-left dark:bg-slate-800">
              {displayCols.map((c) => {
                if (isSelectionColumn(c)) {
                  return (
                    <th class="w-10 border border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                      <input
                        type="checkbox"
                        {...bool("checked", allSel)}
                        data-testid="dp-select-all"
                        onChange={() => (selected.value = allSel
                          ? []
                          : selectableRows.map(idOf))}
                      />
                    </th>
                  );
                }
                if (isIndexColumn(c)) {
                  return (
                    <th
                      class="w-12 border border-slate-200 px-2 py-2 text-center dark:border-slate-700"
                      data-testid="dp-colhead-index"
                    >
                      {indexColLabel()}
                    </th>
                  );
                }
                if (isActionsColumn(c)) {
                  return (
                    <th class="border border-slate-200 px-3 py-2 text-center font-medium dark:border-slate-700">
                      {actionsColLabel()}
                    </th>
                  );
                }
                return (
                  <th
                    class="whitespace-nowrap border border-slate-200 px-3 py-2 font-medium dark:border-slate-700"
                    style={c.width ? `width:${c.width}px` : undefined}
                  >
                    {c.sortable
                      ? (
                        <button
                          type="button"
                          class="inline-flex items-center hover:text-blue-600"
                          data-testid={`dp-sort-${c.prop}`}
                          onClick={() => toggleSort(c.prop!)}
                        >
                          {c.label}
                          {sortIcon(c.prop!)}
                        </button>
                      )
                      : c.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? (
                <tr>
                  <td
                    colSpan={displayCols.length}
                    class="border border-slate-200 px-3 py-8 text-center text-slate-400 dark:border-slate-700"
                    data-testid="dp-empty"
                  >
                    {m.empty}
                  </td>
                </tr>
              )
              : data.map((r, i) => (
                <tr
                  class={`${ROW_CLS} ${
                    i % 2
                      ? "bg-slate-50/50 dark:bg-slate-900/40"
                      : "bg-white dark:bg-slate-900"
                  }`}
                  data-testid={`dp-row-${idOf(r)}`}
                >
                  {displayCols.map((c) => {
                    if (isSelectionColumn(c)) {
                      return (
                        <td class="border border-slate-200 px-2 py-1.5 text-center dark:border-slate-700">
                          <input
                            type="checkbox"
                            {...bool("disabled", isLocked(r))}
                            {...bool("checked", sel.includes(idOf(r)))}
                            data-testid={`dp-select-${idOf(r)}`}
                            onChange={() => {
                              const cur = selected.value;
                              selected.value = cur.includes(idOf(r))
                                ? cur.filter((x) => x !== idOf(r))
                                : [...cur, idOf(r)];
                            }}
                          />
                        </td>
                      );
                    }
                    if (isIndexColumn(c)) {
                      return (
                        <td class="border border-slate-200 px-2 py-1.5 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          {offset() + i + 1}
                        </td>
                      );
                    }
                    if (isActionsColumn(c)) {
                      return (
                        <td class="whitespace-nowrap border border-slate-200 px-2 py-1.5 text-center dark:border-slate-700">
                          <span class={ACTS_CLS}>
                            {rowSlots(r).map((s) => {
                              if (s.kind === "custom") {
                                const tip = actionTipText(
                                  s.key,
                                  s.title,
                                  typeof s.label === "string" ? s.label : undefined,
                                );
                                const aria = typeof s.label === "string"
                                  ? s.label
                                  : s.key;
                                const btn = (
                                  <Btn
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    class={`${ICON_BTN}${toneActCls(s.tone)}`}
                                    disabled={s.disable || isLocked(r)}
                                    aria-label={aria}
                                    data-testid={`dp-row-extra-${s.key}-${idOf(r)}`}
                                    onClick={() => s.action(r)}
                                  >
                                    {s.icon != null ? s.icon : s.label}
                                  </Btn>
                                );
                                return tipWrap(tip, btn);
                              }
                              if (s.name === "view") {
                                const run = () =>
                                  (s.action ? s.action(r) : doView(r));
                                return tipWrap(
                                  actionTipText("view", s.title, s.label, m.view),
                                  <Btn
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    class={`${ICON_BTN}${toneActCls(s.tone)}`}
                                    disabled={s.disable}
                                    aria-label={m.view}
                                    data-testid={`dp-view-${idOf(r)}`}
                                    onClick={run}
                                  >
                                    <IconEye size="xs" />
                                  </Btn>,
                                );
                              }
                              if (s.name === "edit") {
                                const run = () =>
                                  (s.action ? s.action(r) : doEdit(r));
                                return tipWrap(
                                  actionTipText("edit", s.title, s.label, m.edit),
                                  <Btn
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    class={`${ICON_BTN}${toneActCls(s.tone)}`}
                                    disabled={s.disable}
                                    aria-label={m.edit}
                                    data-testid={`dp-edit-${idOf(r)}`}
                                    onClick={run}
                                  >
                                    <IconEdit size="xs" />
                                  </Btn>,
                                );
                              }
                              // remove: custom action → direct; no action → builtin Popconfirm.
                              const remTone = s.tone ?? "danger";
                              if (s.action) {
                                return tipWrap(
                                  actionTipText("remove", s.title, s.label, m.delete),
                                  <Btn
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    class={`${ICON_BTN}${toneActCls(remTone)}`}
                                    {...bool(
                                      "disabled",
                                      isLocked(r) || s.disable,
                                    )}
                                    aria-label={m.delete}
                                    data-testid={`dp-delete-${idOf(r)}`}
                                    onClick={() => s.action!(r)}
                                  >
                                    <IconTrash size="xs" />
                                  </Btn>,
                                );
                              }
                              return tipWrap(
                                actionTipText("remove", s.title, undefined, m.delete),
                                (
                                <Popconfirm
                                  open={() => popRow.value === idOf(r)}
                                  placement="top"
                                  danger
                                  title={tr(m.deleteAsk, { name: rowName(r) })}
                                  okText={m.delete}
                                  cancelText={m.cancel}
                                  overlayClass={POP_OVERLAY_CLS}
                                  onOpenChange={(o: boolean) => {
                                    if (!o && popRow.value === idOf(r)) {
                                      popRow.value = null;
                                    }
                                  }}
                                  onConfirm={() => void doRemove([idOf(r)])}
                                >
                                  <Btn
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    class={`${ICON_BTN}${toneActCls(remTone)}`}
                                    {...bool(
                                      "disabled",
                                      isLocked(r) || s.disable,
                                    )}
                                    aria-label={m.delete}
                                    data-testid={`dp-delete-${idOf(r)}`}
                                    onClick={() => (popRow.value = idOf(r))}
                                  >
                                    <IconTrash size="xs" />
                                  </Btn>
                                </Popconfirm>
                                ),
                                {
                                  // Popconfirm open: hide same-anchor Tooltip
                                  disabled: () => popRow.value === idOf(r),
                                },
                              );
                            })}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td class="border border-slate-200 px-3 py-1.5 dark:border-slate-700">
                        {cell(c, r)}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
          {hasTotals && (
            <tfoot>
              <tr
                class="bg-slate-50 font-semibold dark:bg-slate-800"
                data-testid="dp-totals"
              >
                {displayCols.map((c, ci) => {
                  if (isSelectionColumn(c)) {
                    return (
                      <td class="border border-slate-200 dark:border-slate-700" />
                    );
                  }
                  if (isIndexColumn(c)) {
                    return (
                      <td class="border border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                        {m.total}
                      </td>
                    );
                  }
                  if (isActionsColumn(c)) {
                    return (
                      <td class="border border-slate-200 dark:border-slate-700" />
                    );
                  }
                  const dataIdx = displayCols
                    .slice(0, ci)
                    .filter((x) => !isSystemColumn(x)).length;
                  const val = c.total
                    ? (c.type === "money"
                      ? formatMoney(t[c.prop])
                      : String(t[c.prop] ?? 0))
                    : "";
                  return (
                    <td
                      class="border border-slate-200 px-3 py-2 dark:border-slate-700"
                      data-testid={`dp-total-${c.prop}`}
                    >
                      {(() => {
                        if (!showIndexCol() && dataIdx === 0 && !val) {
                          return m.total;
                        }
                        if (!showIndexCol() && dataIdx === 0 && val) {
                          return `${m.total} ${val}`;
                        }
                        return val;
                      })()}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  // ---- 分页
  const pagination = () => {
    const q = query.value;
    const n = total.value;
    const last = Math.max(1, Math.ceil(n / q.pageSize));
    const from = n === 0 ? 0 : (q.page - 1) * q.pageSize + 1;
    const to = Math.min(n, q.page * q.pageSize);
    const go = (p: number) => {
      if (p < 1 || p > last || p === q.page) return;
      setQuery({ page: p });
    };
    /** 移动端 xs、桌面 md（与 Pagination.size 口径一致） */
    const pgSize = isNarrow.value ? "xs" : "md";
    const pbtn = pgSize === "xs"
      ? "min-w-6 rounded border px-1 py-0.5 text-xs disabled:opacity-40"
      : "min-w-8 rounded border px-2 py-1 text-sm disabled:opacity-40";
    return (
      <div
        class={PG_CLS}
        data-testid="dp-pagination"
        data-dp-pg-size={pgSize}
      >
        <span class={RANGE_CLS} data-testid="dp-range">
          {n === 0 ? m.rangeEmpty : tr(m.range, { from, to, total: n })}
        </span>
        <div class={PG_CTRLS_CLS}>
          <div class={PGSIZE_WRAP_CLS} data-testid="dp-pagesize" data-size={pgSize}>
            <Select
              size={pgSize}
              class={PGSIZE_SELECT_CLS}
              value={createSignal(String(q.pageSize))}
              options={pageSizes.map((sz) => ({
                value: String(sz),
                label: tr(m.perPage, { n: sz }),
              }))}
              onChange={(e: Event) =>
                setQuery({
                  pageSize: Number(
                    (e.target as unknown as { value: string }).value,
                  ),
                  page: 1,
                })}
            />
          </div>
          <button
            type="button"
            class={`${pbtn} border-slate-300`}
            {...bool("disabled", q.page <= 1)}
            data-testid="dp-prev"
            onClick={() => go(q.page - 1)}
          >
            ‹
          </button>
          {pageList(q.page, last).map((p) =>
            // deno-lint-ignore jsx-key
            p === "…" ? <span class="px-1">…</span> : (
              <button
                type="button"
                class={`${pbtn} ${
                  p === q.page
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300"
                }`}
                data-testid={`dp-page-${p}`}
                onClick={() => go(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            class={`${pbtn} border-slate-300`}
            {...bool("disabled", q.page >= last)}
            data-testid="dp-next"
            onClick={() => go(q.page + 1)}
          >
            ›
          </button>
          <label class="flex items-center gap-1">
            {m.jump}
            <div class={JUMP_CLS} data-testid="dp-jump">
              <Input
                size={pgSize}
                type="text"
                value={jump}
                onInput={(e: Event) => {
                  const el = e.target as unknown as { value: string };
                  const v = el.value.replace(/\D+/g, "").slice(0, 7);
                  if (v !== el.value) el.value = v;
                  jump.value = v;
                }}
                onKeyDown={(e: Event) => {
                  if ((e as KeyboardEvent).key === "Enter") {
                    const p = Math.min(
                      last,
                      Math.max(1, Number.parseInt(jump.value, 10) || 1),
                    );
                    jump.value = "";
                    go(p);
                  }
                }}
              />
            </div>
            {m.page}
          </label>
        </div>
      </div>
    );
  };

  // ---- 表单 Modal 内容
  const formBody = () => {
    const id = formId.value;
    const errs = formErrors.value;
    const formGrid = useFieldGrid(formDefs);
    return (
      <form
        class={formGrid ? "grid grid-cols-12 gap-3" : "grid gap-3"}
        data-testid="dp-form"
        onSubmit={(e: Event) => {
          e.preventDefault();
          void submitForm();
        }}
      >
        {formDefs.filter((f) => (id ? true : !f.editOnly)).map((f) => {
          const sig = fields[fieldProp(f)];
          const ro = !!id && !!f.createOnly;
          const type = f.type ?? "text";
          const lay = fieldLayoutStyle(f);
          let control: unknown;
          if (type === "textarea") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <Textarea
                  rows={f.rows ?? 4}
                  value={sig}
                  maxLength={f.maxlength}
                  placeholder={f.placeholder}
                  {...bool("disabled", ro)}
                  onInput={(
                    e: Event,
                  ) => (sig.value =
                    (e.target as unknown as { value: string }).value)}
                />
              </div>
            );
          } else if (type === "select") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <Select
                  size="sm"
                  value={sig}
                  disabled={ro}
                  placeholder={!f.required &&
                      !(f.options ?? []).some((o) => o.value === "")
                    ? "—"
                    : undefined}
                  options={(f.options ?? []).map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
              </div>
            );
          } else if (type === "multiselect") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <MultiSelect
                  size="sm"
                  value={mfields[fieldProp(f)]}
                  disabled={ro}
                  options={(f.options ?? []).map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  onChange={(e: Event) => {
                    const v = (e.target as unknown as { value: unknown }).value;
                    if (Array.isArray(v)) sig.value = v.join(",");
                  }}
                />
              </div>
            );
          } else if (type === "switch") {
            const on = f.onOff ? f.onOff[0] : "true";
            const off = f.onOff ? f.onOff[1] : "false";
            control = (
              <span data-testid={`dp-fld-${fieldProp(f)}`}>
                <Switch
                  checked={() => sig.value === on}
                  disabled={ro}
                  onChange={(e: Event) => {
                    sig.value =
                      (e.target as unknown as { checked: boolean }).checked
                        ? on
                        : off;
                  }}
                />
              </span>
            );
          } else if (type === "number") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <InputNumber
                  size="sm"
                  value={sig}
                  disabled={ro}
                  placeholder={f.placeholder}
                />
              </div>
            );
          } else if (type === "date") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <DatePicker
                  size="sm"
                  value={sig}
                  disabled={ro}
                  placeholder={f.placeholder}
                />
              </div>
            );
          } else if (type === "datetime") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <DateTimePicker
                  size="sm"
                  value={sig}
                  disabled={ro}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={f.placeholder}
                />
              </div>
            );
          } else {
            control = (
              <div class="w-full" data-testid={`dp-fld-${fieldProp(f)}`}>
                <Input
                  type={type === "password" ? "password" : "text"}
                  value={sig}
                  {...bool("readOnly", ro)}
                  autoComplete={type === "password" ? "new-password" : "off"}
                  placeholder={f.placeholder}
                  onInput={(e: Event) => {
                    let v = (e.target as unknown as { value: string }).value;
                    if (f.maxlength != null && v.length > f.maxlength) {
                      v = v.slice(0, f.maxlength);
                    }
                    sig.value = v;
                  }}
                />
              </div>
            );
          }
          const err = errs[fieldProp(f)];
          return (
            <div style={lay} class={lay?.width ? undefined : "min-w-0"}>
              <FormItem
                label={f.label ?? fieldProp(f)}
                required={fieldRequired(f) && !(f.type === "password" && !!id)}
                error={err}
              >
                {control}
              </FormItem>
              {f.hint && !err && (
                <p class="m-0 -mt-1 text-xs text-slate-500 dark:text-slate-400" data-testid={`dp-fld-hint-${fieldProp(f)}`}>
                  {f.hint}
                </p>
              )}
            </div>
          );
        })}
        {formTop.value && (
          <p class="m-0 text-sm text-red-600" data-testid="dp-form-error">
            {formTop.value}
          </p>
        )}
        <div class="mt-2 flex justify-end gap-2">
          <Btn
            type="submit"
            variant="primary"
            loading={formBusy.value}
            data-testid="dp-form-submit"
          >
            {m.confirm}
          </Btn>
          <Btn
            type="button"
            onClick={() => (formOpen.value = false)}
            data-testid="dp-form-cancel"
          >
            {m.cancel}
          </Btn>
        </div>
      </form>
    );
  };

  const viewBody = () => {
    const r = viewRow.value;
    if (!r) return null;
    const items: { label: string; children: unknown; span?: number }[] = [];
    const vs = props.viewSchemas;
    if (vs) {
      const list = typeof vs === "function" ? vs(r) : vs;
      for (const it of list) {
        let children: unknown = it.children;
        if (children === undefined) children = it.value;
        if (children === undefined && it.prop) {
          const col = columns.find((c) => c.prop === it.prop);
          children = col
            ? (displayValue(col, r, m) || "—")
            : (r[it.prop] == null || r[it.prop] === "" ? "—" : String(r[it.prop]));
        }
        if (children === undefined || children === null || children === "") {
          children = "—";
        }
        items.push({ label: it.label, children, span: it.span });
      }
    } else {
      const seen = new Set<string>();
      for (const c of columns) {
        seen.add(c.prop);
        items.push({ label: c.label, children: displayValue(c, r, m) || "—" });
      }
      for (const f of formDefs) {
        if (seen.has(fieldProp(f)) || f.type === "password") continue;
        const raw = r[fieldProp(f)];
        items.push({
          label: f.label ?? fieldProp(f),
          children: raw === undefined || raw === null || raw === ""
            ? "—"
            : String(raw),
        });
      }
    }
    return (
      <div data-testid="dp-view">
        <Descriptions bordered column={1} size="sm" items={items} />
        <div class="mt-4 flex justify-end gap-2" data-testid="dp-view-footer">
          <Btn
            type="button"
            data-testid="dp-view-close"
            onClick={() => (viewRow.value = null)}
          >
            {m.close}
          </Btn>
        </div>
      </div>
    );
  };

  return (
    <div class="contents" data-testid={`panel-${key}`}>
      {() => (
      <div
        class={panelFs.value ? FS_CLS : undefined}
        data-dp-shell={key}
        data-testid="dp-shell"
        data-fullscreen={panelFs.value ? "true" : undefined}
      >
      <Card
        bordered
        size="sm"
        class={`dp-card${props.class ? ` ${props.class}` : ""} ${CARD_STYLE}`}
        title={
          <span
            class="inline-flex min-w-0 items-center gap-2"
            data-testid="data-panel"
          >
            <IconList size="sm" />
            <span class="truncate">{props.title}</span>
          </span>
        }
        extra={
          <span class="text-sm font-normal" data-testid="dp-total-count">
            {() => tr(m.totalCount, { total: total.value })}
          </span>
        }
        bodyClass="p-0"
      >
        {toolbar}
        {/* 固定插槽：响应式子节点插在静态兄弟之后会落到卡片底部；批量条在表格下方，选中行不会把表格顶下去 */}
        <div class={TABLE_WRAP_CLS}>{table}</div>
        <div data-testid="dp-batch-slot">{batchBar}</div>
        {pagination}
      </Card>
      </div>
      )}

      {props.children}

      <Modal
        open={formOpen}
        title={() => {
          const ft = props.formTitle;
          if (typeof ft === "function") {
            return ft(formRow.value ?? ({} as Row));
          }
          if (typeof ft === "string") return ft;
          return `${formId.value ? m.edit : m.add} · ${props.title}`;
        }}
        width="md"
        keyboard
        destroyOnClose
        onClose={() => (formOpen.value = false)}
        // deno-lint-ignore jsx-no-children-prop
        children={formBody}
      />
      <Modal
        open={searchOpen}
        title={() => {
          const st = props.searchTitle;
          if (typeof st === "function") return st();
          if (typeof st === "string") return st;
          return `${m.search} · ${props.title}`;
        }}
        width="md"
        keyboard
        destroyOnClose
        onClose={() => (searchOpen.value = false)}
        // deno-lint-ignore jsx-no-children-prop
        children={searchBody}
      />
      <Modal
        open={() => viewRow.value !== null}
        title={() => {
          const vt = props.viewTitle;
          const row = viewRow.value;
          if (typeof vt === "function") {
            return row ? vt(row) : `${m.view} · ${props.title}`;
          }
          if (typeof vt === "string") return vt;
          return `${m.view} · ${props.title}`;
        }}
        width="md"
        keyboard
        destroyOnClose
        onClose={() => (viewRow.value = null)}
        // deno-lint-ignore jsx-no-children-prop
        children={viewBody}
      />
    </div>
  );
}

export default DataPanel;
