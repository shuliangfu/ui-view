/**
 * DataPanel 数据面板（桌面 · 数据展示）。
 *
 * 一块完整的「列表管理」面板：卡片标题栏 + 工具栏按钮组（添加 / 搜索 / 刷新 / 打印 / 导入 / 导出 / 列设置，
 * 相邻按钮之间只有一条淡分割线）+ 搜索 Modal（工具栏按钮打开，提交即搜索、重置即清空） + 批量操作条 + 表格（排序、多选、行内编辑、合计行、
 * 操作列）+ 分页（每页条数、页码、跳页）。新增 / 编辑 / 查看使用 Modal，**任何删除都必须先确认（行内删除为图标上方的小气泡 Popconfirm，批量删除为确认对话框）**，
 * 绝不直接删除。导出支持 xlsx（原生 OOXML）/ csv / json / xml / html，支持浅色与深色主题（`.dark`）。
 *
 * 数据通过 props 注入，与任何后端无关：
 * - `data`：本地数组，面板内置本地数据源（过滤 / 排序 / 分页 / 合计 / 增删改全部在内存完成）；
 * - `dataSource`：自定义 {@link DataPanelDataSource}，`list(query)` 返回当前页，其余写操作按需提供。
 *
 * **SSR / 水合**：布尔属性只在为 true 时输出；`sync` 数据源（含 `data` 模式）首帧同步渲染，水合前后 DOM 一致。
 */
import { createSignal, type JSXRenderable, onMount } from "@dreamer/view";
import { Button, ButtonGroup } from "../basic/Button.tsx";
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import { IconChevronUp } from "../../shared/basic/icons/ChevronUp.tsx";
import { IconColumns } from "../../shared/basic/icons/Columns.tsx";
import { IconDownload } from "../../shared/basic/icons/Download.tsx";
import { IconEdit } from "../../shared/basic/icons/Edit.tsx";
import { IconEye } from "../../shared/basic/icons/Eye.tsx";
import { IconList } from "../../shared/basic/icons/List.tsx";
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
import { Textarea } from "../form/Textarea.tsx";
import { Modal } from "../feedback/Modal.tsx";
import { Popconfirm } from "../feedback/Popconfirm.tsx";
import { Tooltip } from "../feedback/Tooltip.tsx";
import { message } from "../feedback/message-store.ts";
import {
  formatMessage,
  resolveDataPanelMessages,
} from "./data-panel-messages.ts";
import {
  buildExportFile,
  createLocalDataSource,
  displayValue,
  formatDateTime,
  formatMoney,
  pageList,
  parseCsv,
  queryToParams,
  validateForm,
} from "./data-panel-utils.ts";
import type {
  DataPanelBulkResult,
  DataPanelCaps,
  DataPanelColumn,
  DataPanelDataSource,
  DataPanelExportFormat,
  DataPanelFormField,
  DataPanelListResult,
  DataPanelLocale,
  DataPanelMessages,
  DataPanelOption,
  DataPanelQuery,
  DataPanelRow,
  DataPanelSearchField,
  DataPanelTone,
  DataPanelWriteResult,
} from "./data-panel-types.ts";

export type {
  DataPanelBulkResult,
  DataPanelCaps,
  DataPanelColumn,
  DataPanelDataSource,
  DataPanelExportFormat,
  DataPanelFormField,
  DataPanelListResult,
  DataPanelLocale,
  DataPanelMessages,
  DataPanelOption,
  DataPanelQuery,
  DataPanelRow,
  DataPanelSearchField,
  DataPanelTone,
  DataPanelWriteResult,
};

/** 导出时传给 `onExport` 的上下文 */
export interface DataPanelExportContext {
  /** 当前可见且允许导出的列 */
  columns: DataPanelColumn[];
  /** 当前查询（含筛选 / 排序，page 与 pageSize 为当前页） */
  query: DataPanelQuery;
  /** 拉取符合当前筛选的全部行 */
  fetchAll: () => Promise<DataPanelListResult>;
}

export interface DataPanelProps {
  /** 面板标识，用于列偏好的 localStorage 键与 `refreshDataPanel(key)`；默认 "data-panel" */
  panelKey?: string;
  /** 卡片标题 */
  title: string;
  /** 列定义 */
  columns: DataPanelColumn[];
  /** 搜索项；为空则不显示搜索按钮 */
  search?: DataPanelSearchField[];
  /** 新增 / 编辑 Modal 的表单项 */
  form?: DataPanelFormField[];
  /** 本地数据（内置本地数据源）；与 `dataSource` 二选一 */
  data?: DataPanelRow[];
  /** 自定义数据源；优先于 `data` */
  dataSource?: DataPanelDataSource;
  /** `data` 模式下数据变化时回调（新增 / 编辑 / 删除 / 批量 / 导入） */
  onDataChange?: (rows: DataPanelRow[]) => void;
  /** 首屏数据（服务端预取）；提供后挂载时不再请求 */
  initial?: DataPanelListResult;
  /** 初始查询（page / pageSize / sort / order / filters） */
  initialQuery?: Partial<DataPanelQuery>;
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
  /** 批量状态字段与可选值（开启「批量设为…」按钮，需要 dataSource.setField） */
  statusField?: string;
  statusValues?: { value: string; label: string }[];
  /** 能力开关；缺省按数据源方法推断 */
  caps?: Partial<DataPanelCaps>;
  /** 界面语言（内置 zh-CN / en-US），默认 zh-CN */
  locale?: DataPanelLocale;
  /** 覆盖文案 */
  messages?: Partial<DataPanelMessages>;
  /** 导出文件名（不含扩展名），默认取 title */
  exportName?: string;
  /** 自定义新增（替代内置 Modal 表单） */
  onCreate?: () => void;
  /** 自定义编辑 */
  onEdit?: (row: DataPanelRow) => void;
  /** 自定义查看 */
  onView?: (row: DataPanelRow) => void;
  /** 自定义单元格渲染（按列 prop） */
  renderCell?: Record<string, (row: DataPanelRow) => unknown>;
  /** 操作列额外按钮（渲染在标准操作之前） */
  rowExtra?: (row: DataPanelRow) => unknown;
  /** 工具栏左侧额外内容 */
  toolbarExtra?: unknown;
  /** 任一写操作成功后回调 */
  onChanged?: () => void;
  /** 是否显示选择列与批量条（有删除 / 批量状态能力时默认 true） */
  selectable?: boolean;
  /** 接管导入：收到解析后的 CSV / JSON 行（缺省时走 dataSource.importRows） */
  onImportRows?: (rows: Record<string, string>[]) => void;
  /** 接管导出：缺省时面板自行拉取全部行并生成文件下载 */
  onExport?: (
    format: DataPanelExportFormat,
    ctx: DataPanelExportContext,
  ) => void | Promise<void>;
  /** 把查询写入地址栏（history.replaceState），默认 false */
  syncUrl?: boolean;
  /** 额外 class（加在卡片上） */
  class?: string;
  /** 面板根节点内的额外内容（如自定义 Modal） */
  children?: unknown;
}

// ---------------------------------------------------------------- refresh registry
const refreshers = new Map<string, () => Promise<void>>();
/** 重新拉取某个面板当前页（页面自己的 Modal 保存后可调用） */
export function refreshDataPanel(key: string): Promise<void> {
  return refreshers.get(key)?.() ?? Promise.resolve();
}

// ---------------------------------------------------------------- helpers
interface PrintWin {
  document: { write(s: string): void; close(): void };
  focus(): void;
  print(): void;
}
const g = globalThis as unknown as {
  location?: { pathname: string; search: string };
  history?: { replaceState: (a: unknown, b: string, c: string) => void };
  // deno-lint-ignore no-explicit-any
  document?: any;
  localStorage?: {
    getItem(k: string): string | null;
    setItem(k: string, v: string): void;
    removeItem(k: string): void;
  };
  open?: (u?: string, t?: string) => PrintWin | null;
  URL?: typeof URL;
};

/** 是否在服务端运行（Deno / Node）；浏览器里没有这两者 */
function onServer(): boolean {
  const gg = globalThis as unknown as {
    Deno?: unknown;
    process?: { versions?: { node?: string } };
  };
  return gg.Deno !== undefined ||
    typeof gg.process?.versions?.node === "string";
}

/**
 * Button 不转发 `data-testid` / `aria-label`：给外层 span 打标，既有稳定的 E2E 选择器，也有可访问名称。
 */
// deno-lint-ignore no-explicit-any
function Btn(props: any) {
  const { "data-testid": testid, "aria-label": label, ...rest } = props;
  return (
    <span class="inline-flex" data-testid={testid} title={label}>
      <Button {...rest} />
    </span>
  );
}

/** 布尔属性：仅为 true 时输出（`checked={false}` 在 SSR 会被序列化成 checked="false"） */
const bool = (k: string, v: unknown): Record<string, true> =>
  v ? { [k]: true } : {};

/** 标签配色：浅色沿用 Tailwind 类；深色由 DATA_PANEL_CSS 的 `.dark .dp-tag-*` 覆盖（半透明底 + 亮字） */
const TONE: Record<DataPanelTone, string> = {
  success: "dp-tag dp-tag-success bg-emerald-100 text-emerald-700",
  warning: "dp-tag dp-tag-warning bg-amber-100 text-amber-700",
  danger: "dp-tag dp-tag-danger bg-red-100 text-red-700",
  info: "dp-tag dp-tag-info bg-sky-100 text-sky-700",
  default: "dp-tag dp-tag-default bg-slate-100 text-slate-600",
};

/** 开关滑动动画时长（与 .dp-sw 的 0.2s 过渡对应，略长一点保证播完再重渲染） */
const SWITCH_ANIM_MS = 230;

const SELECT_CLS =
  "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900";
/** 操作列图标按钮：样式见 DATA_PANEL_CSS 的 .dp-act*（无边框 / 无底色，仅图标色变化） */
const ICON_BTN = "dp-act";

/**
 * 面板自带样式（作用域在 `.dp-*` 类名下，不依赖 Tailwind 扫描）：
 * - 工具栏按钮组：相邻按钮之间**只有一条**淡分割线（左侧按钮自己的右边框）；
 * - 注意：SSR 会转义 `<style>` 文本里的 `>` / `&` / `<`，所以这里**不得使用子选择器**，位置用 `.dp-tb-first/-last/-nf/-nl` 类表达；
 * - 深色模式下面板主体用 `--dp-panel-body-bg`（默认 #18212f，比深色卡片再深约半档）。
 */
export const DATA_PANEL_CSS = `
.dp-tb {
  box-sizing: border-box; width: 2.625rem; height: 2.125rem; padding: 0 !important; line-height: 1;
  border-radius: 0 !important;
  background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #334155 !important;
}
.dp-tb [role="img"] { width: 1rem !important; height: 1rem !important; }
.dp-tb:hover:not(:disabled) { background-color: #e2e8f0 !important; color: #0f172a !important; }
.dark .dp-tb { background-color: #0f172a !important; border-color: #1e293b !important; color: #e2e8f0 !important; }
.dark .dp-tb:hover:not(:disabled) { background-color: #1e293b !important; color: #fff !important; }
.dp-tb-first { border-top-left-radius: 5px !important; border-bottom-left-radius: 5px !important; }
.dp-tb-last { border-top-right-radius: 5px !important; border-bottom-right-radius: 5px !important; }
.dp-tb-nf { border-left-width: 0 !important; }
.dp-tb-nl { border-right-width: 1px !important; box-shadow: none !important; }
/* 深色行悬停：与 dweb-admin 一致（Tailwind 的 dark:hover:bg-slate-800/60，即 slate-800 @ 60%）；显式写出，避免被浅色 hover:bg-slate-50 盖住导致近白底 */
.dark .dp-row:hover { background-color: color-mix(in oklab, oklch(27.9% 0.041 260.031) 60%, transparent) !important; }
.dp-sw { position: relative; display: inline-block; box-sizing: border-box; width: 2.25rem; height: 1.25rem; padding: 0; border: 0; border-radius: 9999px; cursor: pointer; flex-shrink: 0; vertical-align: middle; background-color: #cbd5e1; transition: background-color 0.2s ease, opacity 0.2s ease; }
.dp-sw-on { background-color: #2563eb; }
.dark .dp-sw { background-color: #475569; }
.dark .dp-sw-on { background-color: #3b82f6; }
.dp-sw-knob { position: absolute; top: 2px; left: 2px; width: 1rem; height: 1rem; border-radius: 9999px; background-color: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.35); transform: translateX(0); transition: transform 0.2s ease; }
.dp-sw-on .dp-sw-knob { transform: translateX(1rem); }
.dp-sw:disabled { opacity: 0.5; cursor: not-allowed; }
.dp-sw:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
.dark .dp-tag-danger { background-color: rgba(239, 68, 68, 0.15) !important; color: #fca5a5 !important; }
.dark .dp-tag-success { background-color: rgba(34, 197, 94, 0.15) !important; color: #86efac !important; }
.dark .dp-tag-warning { background-color: rgba(234, 179, 8, 0.15) !important; color: #fde047 !important; }
.dark .dp-tag-info { background-color: rgba(56, 189, 248, 0.15) !important; color: #7dd3fc !important; }
.dark .dp-tag-default { background-color: rgba(148, 163, 184, 0.15) !important; color: #cbd5e1 !important; }
.dp-cell-edit { display: inline-block; min-width: 1.5rem; padding: 0 4px; border-radius: 4px; cursor: text; }
.dp-cell-edit:hover { background-color: #e2e8f0; }
.dark .dp-cell-edit:hover { background-color: #334155; }
.dp-ed { box-sizing: border-box; width: 100%; min-width: 7rem; max-width: 18rem; padding: 2px 6px; font-size: 0.875rem; line-height: 1.4; color: #0f172a; background-color: #fff; border: 1px solid #3b82f6; border-radius: 4px; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25); font-family: inherit; }
.dark .dp-ed { color: #e2e8f0; background-color: #0f172a; border-color: #60a5fa; box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3); color-scheme: dark; }
.dp-ed-box { display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; }
.dp-ed-opt { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; cursor: pointer; }
.dp-pop { background-color: #fff !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
.dark .dp-pop { background-color: #1e293b !important; border-color: #475569 !important; color: #f1f5f9 !important; }
.dark .dp-pop [aria-hidden="true"] { background-color: #1e293b !important; border-color: #475569 !important; }
.dp-acts { display: inline-flex; align-items: center; justify-content: center; gap: 1px; }
.dp-act [role="img"] { width: 1.25rem !important; height: 1.25rem !important; }
.dp-act { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 2px !important; min-width: 0 !important; border-radius: 4px; color: #64748b !important; line-height: 1; cursor: pointer; transition: color 0.15s ease; }
.dp-act:hover:not(:disabled) { background: transparent !important; border: 0 !important; color: #2563eb !important; }
.dp-act-del:hover:not(:disabled) { color: #dc2626 !important; }
.dp-act:disabled { opacity: 0.4; color: #94a3b8 !important; cursor: not-allowed !important; }
.dark .dp-act { color: #94a3b8 !important; }
.dark .dp-act:hover:not(:disabled) { color: #60a5fa !important; }
.dark .dp-act-del:hover:not(:disabled) { color: #f87171 !important; }
.dark .dp-act:disabled { color: #64748b !important; }
.dark .dp-card { background: var(--dp-panel-body-bg, #18212f) !important; }
`;

/**
 * 读取 `<select>` 的值：空字符串的 `value=""` 在渲染时可能被省略，
 * 此时浏览器会把选项文字（如「全部」「—」）当作 value，必须按「无 value 属性」处理成 ""。
 */
function selectValue(target: EventTarget | null): string {
  const el = target as HTMLSelectElement | null;
  const o = el?.options?.[el.selectedIndex];
  if (!o) return "";
  return o.hasAttribute("value") ? o.value : "";
}

// ---------------------------------------------------------------- component
export function DataPanel(props: DataPanelProps): JSXRenderable {
  const m = resolveDataPanelMessages(props.locale, props.messages);
  const tr = (tpl: string, params?: Record<string, string | number>) =>
    formatMessage(tpl, params);
  const key = props.panelKey ?? "data-panel";
  const rowKey = props.rowKey ?? "id";
  const idOf = (r: DataPanelRow): string => String(r[rowKey]);
  const columns = props.columns;
  const searchDefs = props.search ?? [];
  const formDefs = props.form ?? [];
  const pageSizes = props.pageSizes ?? [10, 20, 50, 100];
  const defaultPageSize = props.pageSize ?? 10;

  const ds: DataPanelDataSource = props.dataSource ?? createLocalDataSource({
    rows: props.data ?? [],
    columns,
    search: searchDefs,
    form: formDefs,
    rowKey,
    fixed: props.fixed,
    onChange: props.onDataChange,
    writable: !!(props.form && props.form.length) || !!props.onDataChange,
  });

  const caps: DataPanelCaps = {
    create: !!ds.create,
    update: !!ds.update,
    view: true,
    remove: !!ds.remove,
    batchStatus: !!ds.setField && !!props.statusValues?.length,
    import: !!ds.importRows,
    export: true,
    print: true,
    columns: true,
    ...(props.caps ?? {}),
  };
  const selectable = props.selectable !== false &&
    (caps.remove || caps.batchStatus);
  const statusField = props.statusField;
  const isLocked = (r: DataPanelRow) => !!r.locked;

  const initialQuery: DataPanelQuery = {
    page: 1,
    pageSize: defaultPageSize,
    sort: props.defaultSort?.prop ?? "",
    order: props.defaultSort?.order === "desc" ? -1 : 1,
    ...(props.initialQuery ?? {}),
    filters: { ...(props.initialQuery?.filters ?? {}), ...(props.fixed ?? {}) },
  };

  // 首帧数据：显式 initial，或同步数据源直接计算
  let first: DataPanelListResult | undefined = props.initial;
  if (!first && ds.sync) first = ds.list(initialQuery) as DataPanelListResult;

  const rows = createSignal<DataPanelRow[]>(first?.rows ?? []);
  const total = createSignal(first?.total ?? 0);
  const totals = createSignal<Record<string, number>>(first?.totals ?? {});
  const query = createSignal<DataPanelQuery>(initialQuery);
  const loading = createSignal(false);
  const selected = createSignal<string[]>([]);
  const hidden = createSignal<Record<string, boolean>>(
    Object.fromEntries(
      columns.filter((c) => c.hidden).map((c) => [c.prop, true]),
    ),
  );
  // 搜索表单在 Modal 里（工具栏按钮打开）；每个字段一个 signal，输入时不会重渲染输入框
  const searchOpen = createSignal(false);
  const sfields: Record<string, ReturnType<typeof createSignal<string>>> = {};
  for (const sdef of searchDefs) {
    sfields[sdef.name] = createSignal(initialQuery.filters[sdef.name] ?? "");
  }
  const jump = createSignal("");
  let seq = 0;

  const listParams = (q: DataPanelQuery, forUrl: boolean) =>
    queryToParams(q, {
      forUrl,
      defaultPageSize,
      defaultSort: props.defaultSort,
      fixed: props.fixed,
    });

  // ---- data loading
  async function load(syncUrl = true): Promise<void> {
    const my = ++seq;
    loading.value = true;
    const q = query.value;
    let res: DataPanelListResult;
    try {
      res = await ds.list({
        ...q,
        filters: { ...q.filters, ...(props.fixed ?? {}) },
      });
    } catch (e) {
      if (my !== seq) return;
      loading.value = false;
      message.error((e as Error)?.message || m.networkError);
      return;
    }
    if (my !== seq) return;
    loading.value = false;
    const last = Math.max(1, Math.ceil(res.total / q.pageSize));
    if (q.page > last) {
      query.value = { ...q, page: last };
      return load(syncUrl);
    }
    rows.value = res.rows;
    total.value = res.total;
    totals.value = res.totals ?? {};
    selected.value = [];
    if (props.syncUrl && syncUrl && g.history && g.location) {
      const qs = listParams(q, true).toString();
      g.history.replaceState(
        null,
        "",
        g.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
  }
  refreshers.set(key, () => load(false));

  function setQuery(patch: Partial<DataPanelQuery>): void {
    query.value = { ...query.value, ...patch };
    void load();
  }

  const columnsVisible = () => columns.filter((c) => !hidden.value[c.prop]);

  // ---- 首次加载（异步数据源）与列偏好
  const storageKey = `dp-cols-${key}`;
  onMount(() => {
    // 服务端渲染（含 happy-dom）也会执行 onMount：不发请求、不读本地存储
    if (onServer()) return;
    try {
      const raw = g.localStorage?.getItem(storageKey);
      if (raw) hidden.value = JSON.parse(raw);
    } catch { /* ignore */ }
    if (!first) void load(false);
  });
  function saveHidden(next: Record<string, boolean>): void {
    hidden.value = next;
    try {
      g.localStorage?.setItem(storageKey, JSON.stringify(next));
    } catch { /* ignore */ }
  }

  // ---- 确认对话框（所有删除 / 批量状态都经过它）
  type Confirm = {
    title: string;
    text: string;
    danger?: boolean;
    okText: string;
    run: () => Promise<void>;
  };
  const confirm = createSignal<Confirm | null>(null);
  const confirmBusy = createSignal(false);

  const rowName = (r: DataPanelRow): string => {
    const c = columns[0];
    return String(r[c?.prop ?? rowKey] ?? r.name ?? r.username ?? idOf(r));
  };

  function reportBulk(res: DataPanelBulkResult, okText: string): void {
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

  /** 真正执行删除（行内气泡确认与批量确认框共用） */
  async function doRemove(ids: string[]): Promise<void> {
    if (!ds.remove) return;
    const r = await guarded(() => ds.remove!(ids));
    if (r) reportBulk(r, m.deleted);
    await load(false);
    props.onChanged?.();
  }

  /** 批量删除：保留确认对话框；单行删除走行内 Popconfirm（见操作列） */
  function askDelete(ids: string[]): void {
    if (!ds.remove) return;
    confirm.value = {
      title: m.deleteTitle,
      text: tr(m.deleteMany, { n: ids.length }),
      danger: true,
      okText: m.delete,
      run: () => doRemove(ids),
    };
  }

  /** 当前打开删除气泡确认的行 id */
  const popRow = createSignal<string | null>(null);

  function askStatus(ids: string[], value: string, label: string): void {
    if (!ds.setField || !statusField) return;
    confirm.value = {
      title: m.batchConfirmTitle,
      text: tr(m.batchStatusAsk, { n: ids.length, status: label }),
      okText: m.confirm,
      run: async () => {
        const r = await guarded(() => ds.setField!(ids, statusField, value));
        if (r) reportBulk(r, m.saved);
        await load(false);
        props.onChanged?.();
      },
    };
  }

  // ---- 行内编辑
  const editing = createSignal<{ id: string; prop: string } | null>(null);
  async function setField(
    row: DataPanelRow,
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
  const formBusy = createSignal(false);
  const formErrors = createSignal<Record<string, string>>({});
  const formTop = createSignal("");
  const fields: Record<string, ReturnType<typeof createSignal<string>>> = {};
  for (const f of formDefs) fields[f.name] = createSignal("");

  function openForm(row?: DataPanelRow): void {
    formId.value = row ? idOf(row) : "";
    for (const f of formDefs) {
      const raw = row ? row[f.name] : undefined;
      let v: string;
      if (raw === undefined || raw === null) {
        v = row ? "" : String(
          f.initial ??
            (f.type === "switch" ? (f.onOff ? f.onOff[0] : "true") : ""),
        );
      } else if (f.type === "datetime" || f.type === "date") {
        const s = formatDateTime(raw);
        v = f.type === "date"
          ? s.slice(0, 10)
          : s.replace(" ", "T").slice(0, 16);
      } else if (f.type === "switch") {
        v = f.onOff ? String(raw) : (raw ? "true" : "false");
      } else if (Array.isArray(raw)) v = raw.join(",");
      else v = String(raw);
      if (f.type === "password") v = "";
      fields[f.name].value = v;
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
      const v = fields[f.name].value;
      if (f.type === "multiselect") body[f.name] = v.split(",").filter(Boolean);
      else if (f.type === "number") body[f.name] = v === "" ? "" : Number(v);
      else if (f.type === "switch" && !f.onOff) body[f.name] = v === "true";
      else if (f.type === "password" && isEdit && v === "") continue;
      else body[f.name] = v;
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
    let r: DataPanelWriteResult;
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
  const viewRow = createSignal<DataPanelRow | null>(null);

  const doCreate = () => (props.onCreate ? props.onCreate() : openForm());
  const doEdit = (
    r: DataPanelRow,
  ) => (props.onEdit ? props.onEdit(r) : openForm(r));
  const doView = (
    r: DataPanelRow,
  ) => (props.onView ? props.onView(r) : (viewRow.value = r));

  // ---- 导出 / 打印 / 导入
  async function fetchAll(): Promise<DataPanelListResult> {
    const q = query.value;
    const base = { ...q, filters: { ...q.filters, ...(props.fixed ?? {}) } };
    const size = 500;
    const all: DataPanelRow[] = [];
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

  async function exportAs(fmt: DataPanelExportFormat): Promise<void> {
    const cols = columnsVisible().filter((c) => !c.noExport);
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
    const cols = columnsVisible();
    const esc = (s: string) =>
      s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
        ">",
        "&gt;",
      );
    const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join("");
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

  /** 解析导入文件的文本（按扩展名选 JSON / CSV），表头可为列文案或字段名 */
  async function importText(name: string, text: string): Promise<void> {
    let parsed: Record<string, string>[];
    if (name.toLowerCase().endsWith(".json")) {
      const j = JSON.parse(text);
      parsed = (Array.isArray(j) ? j : []).map((o: Record<string, unknown>) =>
        Object.fromEntries(
          Object.entries(o).map(([k, v]) => [k, String(v ?? "")]),
        )
      );
    } else parsed = parseCsv(text);
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

  function pickImport(): void {
    const doc = g.document;
    if (!doc) return;
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = ".csv,.json,text/csv,application/json";
    input.setAttribute("data-testid", "dp-import-input");
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await importText(file.name, await file.text());
      } catch {
        message.error(m.importBad);
      }
    };
    input.click();
  }

  // ---- 工具栏
  // 与下方按钮组的渲染顺序一致
  const toolIds = (): string[][] => [
    ...(caps.create || props.onCreate ? [["dp-create", m.create]] : []),
    ...(searchDefs.length > 0 ? [["dp-search-toggle", m.search]] : []),
    ["dp-refresh", m.refresh],
    ...(caps.print ? [["dp-print", m.print]] : []),
    ...(caps.import || props.onImportRows ? [["dp-import", m.import]] : []),
    ...(caps.export ? [["dp-export", m.export]] : []),
    ...(caps.columns ? [["dp-columns", m.columns]] : []),
  ];
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
      b.setAttribute("title", label);
    });
    return true;
  };
  onMount(() => {
    if (onServer()) return;
    // DOM 在挂载后才插入（水合时还会被替换一次）：短暂重试
    for (const ms of [0, 30, 120, 400, 1000]) setTimeout(tagToolbar, ms);
  });
  // 结构：ButtonGroup.dp-tool-group > Tooltip/Dropdown 包装 > Button。不要在这些按钮外再包一层。
  const posCls = (id: string): string => {
    const ids = toolIds().map((x) => x[0]);
    const i = ids.indexOf(id);
    const n = ids.length;
    return `px-2.5 dp-tb${i === 0 ? " dp-tb-first" : " dp-tb-nf"}${
      i === n - 1 ? " dp-tb-last" : " dp-tb-nl"
    }`;
  };
  const toolBtn = (
    id: string,
    label: string,
    onClick: () => void,
    icon: unknown,
  ) => (
    <Tooltip content={label} placement="top">
      <Button type="button" size="sm" class={posCls(id)} onClick={onClick}>
        {icon}
      </Button>
    </Tooltip>
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

  const columnMenu = () => (
    <div
      class="flex max-h-72 min-w-40 flex-col gap-1 overflow-auto p-2"
      data-testid="dp-column-menu"
    >
      {columns.map((c) => (
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...bool("checked", !hidden.value[c.prop])}
            data-testid={`dp-col-${c.prop}`}
            onChange={() => {
              const next = { ...hidden.value };
              if (next[c.prop]) delete next[c.prop];
              else next[c.prop] = true;
              saveHidden(next);
            }}
          />
          {c.label}
        </label>
      ))}
      <button
        type="button"
        class="mt-1 border-t border-slate-200 px-1 pt-2 text-left text-xs text-slate-500 hover:text-slate-800 dark:border-slate-700"
        data-testid="dp-col-reset"
        onClick={() =>
          saveHidden(Object.fromEntries(
            columns.filter((c) => c.hidden).map((c) => [c.prop, true]),
          ))}
      >
        {m.resetColumns}
      </button>
    </div>
  );

  const toolbar = (
    <div
      class="flex w-full flex-wrap items-center justify-end gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700"
      data-testid="data-panel-toolbar"
    >
      {props.toolbarExtra}
      <div class="contents" data-dp-tools={key}>
        <ButtonGroup attached class="dp-tool-group">
          {(caps.create || props.onCreate) &&
            toolBtn("dp-create", m.create, doCreate, <IconPlus size="sm" />)}
          {searchDefs.length > 0 &&
            toolBtn(
              "dp-search-toggle",
              m.search,
              openSearch,
              <IconSearch size="sm" />,
            )}
          {toolBtn(
            "dp-refresh",
            m.refresh,
            () => void load(false),
            <IconRefresh size="sm" />,
          )}
          {caps.print &&
            toolBtn("dp-print", m.print, printTable, <IconPrinter size="sm" />)}
          {(caps.import || props.onImportRows) &&
            toolBtn(
              "dp-import",
              m.import,
              pickImport,
              <IconUpload size="sm" />,
            )}
          {caps.export && (
            <Dropdown
              overlay={exportMenu}
              placement="bottomRight"
              trigger="click"
            >
              <Button type="button" size="sm" class={posCls("dp-export")}>
                <IconDownload size="sm" />
              </Button>
            </Dropdown>
          )}
          {caps.columns && (
            <Dropdown
              overlay={columnMenu()}
              placement="bottomRight"
              trigger="click"
            >
              <Button type="button" size="sm" class={posCls("dp-columns")}>
                <IconColumns size="sm" />
              </Button>
            </Dropdown>
          )}
        </ButtonGroup>
      </div>
    </div>
  );

  // ---- 搜索表单（Modal）：提交即搜索，重置即清空
  function openSearch(): void {
    for (const sdef of searchDefs) {
      sfields[sdef.name].value = query.value.filters[sdef.name] ?? "";
    }
    searchOpen.value = true;
  }
  function applySearch(): void {
    const filters: Record<string, string> = {};
    for (const sdef of searchDefs) {
      const v = sfields[sdef.name].value.trim();
      if (v) filters[sdef.name] = v;
    }
    searchOpen.value = false;
    setQuery({ filters: { ...filters, ...(props.fixed ?? {}) }, page: 1 });
  }
  /** 搜索 select 的 DOM 引用：用户改过后 `selected` 属性不再生效，重置时需直接回写 value */
  const selectEls: Record<string, HTMLSelectElement> = {};
  function resetSearch(): void {
    for (const sdef of searchDefs) {
      sfields[sdef.name].value = "";
      const el = selectEls[sdef.name];
      if (el) el.selectedIndex = 0;
    }
    setQuery({ filters: { ...(props.fixed ?? {}) }, page: 1 });
  }
  const searchBody = () => (
    <form
      class="grid gap-3"
      data-testid="dp-search"
      onSubmit={(e: Event) => {
        e.preventDefault();
        applySearch();
      }}
    >
      {searchDefs.map((sdef) => {
        const sig = sfields[sdef.name];
        return (
          <FormItem label={sdef.label}>
            {sdef.type === "select"
              ? (
                <select
                  name={sdef.name}
                  class={`${SELECT_CLS} w-full`}
                  data-testid={`dp-f-${sdef.name}`}
                  ref={(el: HTMLSelectElement | null) => {
                    if (el) selectEls[sdef.name] = el;
                  }}
                  onChange={(e: Event) => (sig.value = selectValue(e.target))}
                >
                  <option value="">{m.all}</option>
                  {(sdef.options ?? []).map((o) => (
                    <option
                      value={o.value}
                      {...bool("selected", sig.value === o.value)}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              )
              : (
                <div class="w-full" data-testid={`dp-f-${sdef.name}`}>
                  <Input
                    name={sdef.name}
                    type={sdef.type === "date" ? "date" : "text"}
                    value={sig}
                    onInput={(
                      e: Event,
                    ) => (sig.value =
                      (e.target as unknown as { value: string }).value)}
                  />
                </div>
              )}
          </FormItem>
        );
      })}
      <div class="mt-2 flex justify-end gap-2">
        <Btn type="button" data-testid="dp-search-reset" onClick={resetSearch}>
          {m.reset}
        </Btn>
        <Btn type="submit" variant="primary" data-testid="dp-search-submit">
          {m.searchSubmit}
        </Btn>
      </div>
    </form>
  );

  // ---- 批量条
  const batchBar = () => {
    const ids = selected.value;
    if (!ids.length) return null;
    const sv = props.statusValues ?? [];
    return (
      <div
        class="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-sky-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        data-testid="dp-batch-bar"
      >
        <span data-testid="dp-selected-count">
          {tr(m.selected, { n: ids.length })}
        </span>
        {caps.batchStatus &&
          sv.map((s) => (
            <Btn
              type="button"
              size="sm"
              data-testid={`dp-batch-status-${s.value}`}
              onClick={() => askStatus(ids, s.value, s.label)}
            >
              {tr(m.batchSet, { status: s.label })}
            </Btn>
          ))}
        {caps.remove && (
          <Btn
            type="button"
            size="sm"
            variant="danger"
            data-testid="dp-batch-delete"
            onClick={() => askDelete(ids)}
          >
            {m.batchDelete}
          </Btn>
        )}
        <Btn
          type="button"
          size="sm"
          variant="ghost"
          data-testid="dp-batch-clear"
          onClick={() => (selected.value = [])}
        >
          {m.clearSelection}
        </Btn>
      </div>
    );
  };

  // ---- 单元格
  function cell(c: DataPanelColumn, row: DataPanelRow): unknown {
    const custom = props.renderCell?.[c.prop];
    if (custom) return custom(row);
    const raw = row[c.prop];
    const canEdit = caps.update || !!props.onEdit || statusField === c.prop;
    const isSwitch = c.inline === "switch" && !!c.options &&
      c.options.length === 2;
    if (isSwitch && canEdit) {
      // 开关样式用 .dp-sw* 自带 CSS（不依赖 Tailwind 扫描）：ON 时旋钮在右、OFF 在左，带过渡动画；
      // locked 行渲染成禁用开关（半透明 + not-allowed），而不是普通状态标签
      const [on, off] = c.options!;
      const isOn = String(raw) === on.value;
      const locked = isLocked(row);
      return (
        <button
          type="button"
          role="switch"
          aria-checked={isOn ? "true" : "false"}
          {...bool("disabled", locked)}
          aria-disabled={locked ? "true" : undefined}
          data-testid={`dp-switch-${idOf(row)}`}
          class={`dp-sw ${isOn ? "dp-sw-on" : "dp-sw-off"}`}
          title={isOn ? on.label : off.label}
          onClick={(e: Event) => {
            if (locked) return;
            // 先就地切换类名让旋钮平滑滑动（行重渲染会换新节点），动画结束后再提交数据
            const btn = ((e as unknown as { currentTarget?: HTMLElement })
              .currentTarget ??
              (e.target as HTMLElement).closest("button")) as
                | HTMLElement
                | null;
            if (btn) {
              btn.classList.toggle("dp-sw-on", !isOn);
              btn.classList.toggle("dp-sw-off", isOn);
              btn.setAttribute("aria-checked", isOn ? "false" : "true");
            }
            setTimeout(
              () => void setField(row, c.prop, isOn ? off.value : on.value),
              SWITCH_ANIM_MS,
            );
          }}
        >
          <span class="dp-sw-knob" />
        </button>
      );
    }
    if (c.inline && c.inline !== "switch" && canEdit && !isLocked(row)) {
      const ed = editing.value;
      if (ed && ed.id === idOf(row) && ed.prop === c.prop) {
        return renderEditor(c, row, raw);
      }
      return (
        <span
          class="dp-cell-edit"
          title={m.doubleClickToEdit}
          data-testid={`dp-edit-${c.prop}-${idOf(row)}`}
          onDblClick={() => (editing.value = { id: idOf(row), prop: c.prop })}
        >
          {plainCell(c, row, raw)}
        </span>
      );
    }
    return plainCell(c, row, raw);
  }

  /** 单元格编辑器：失焦 / Enter 保存，Esc 取消；保存失败由 setField 提示并回滚到原值 */
  function renderEditor(
    c: DataPanelColumn,
    row: DataPanelRow,
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
      if (kind === "datetime") {
        return formatDateTime(v).replace(" ", "T").slice(0, 16);
      }
      if (kind === "multiselect") {
        return (Array.isArray(v) ? v.map(String) : String(v).split(","))
          .filter(Boolean).sort().join(",");
      }
      return String(v);
    };
    const original = asStr(raw);
    let done = false;
    /** 读取控件当前值（字符串形式，便于与原值比较） */
    const read = (root: HTMLElement): string => {
      if (kind === "multiselect") {
        return [...root.querySelectorAll("input[type=checkbox]")]
          .filter((i) => (i as HTMLInputElement).checked)
          .map((i) => (i as HTMLElement).getAttribute("data-value") ?? "")
          .sort().join(",");
      }
      if (kind === "select") return selectValue(root);
      return (root as unknown as HTMLInputElement).value;
    };
    const finish = (root: HTMLElement | null, save: boolean): void => {
      if (done) return;
      done = true;
      editing.value = null;
      if (!save || !root) return;
      const draft = read(root);
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
        const d = new Date(draft);
        if (draft && Number.isNaN(d.getTime())) {
          message.error(m.invalid);
          return;
        }
        value = draft ? d.toISOString() : "";
      }
      void setField(row, c.prop, value);
    };
    let rootEl: HTMLElement | null = null;
    /**
     * ref：记录根节点、聚焦，并用原生监听处理失焦保存
     * （框架的 onBlur 绑定在这里不会触发，会导致编辑框「卡住」不退出）
     */
    const focusLater = (el: HTMLElement | null): void => {
      rootEl = el;
      if (!el) return;
      if (kind === "multiselect") {
        el.setAttribute("tabindex", "-1");
        el.addEventListener("focusout", (e) => {
          const next = (e as FocusEvent).relatedTarget as Node | null;
          if (next && el.contains(next)) return;
          finish(el, true);
        });
      } else {
        el.addEventListener("blur", () => finish(el, true));
      }
      setTimeout(() => {
        try {
          el.focus();
          (el as unknown as HTMLInputElement).select?.();
        } catch { /* 部分 input 类型不支持 select() */ }
      }, 0);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(rootEl, false);
      } else if (e.key === "Enter" && !(kind === "textarea" && e.shiftKey)) {
        e.preventDefault();
        finish(rootEl, true);
      }
    };
    const common = {
      "data-testid": testid,
      onKeyDown: onKey,
    };
    if (kind === "textarea") {
      return (
        <textarea
          class="dp-ed"
          rows={3}
          ref={focusLater}
          {...common}
        >
          {original}
        </textarea>
      );
    }
    if (kind === "select") {
      return (
        <select
          class="dp-ed"
          ref={focusLater}
          {...common}
        >
          {(c.options ?? []).map((o) => (
            <option value={o.value} {...bool("selected", o.value === original)}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    if (kind === "multiselect") {
      const cur = original ? original.split(",") : [];
      return (
        <div
          class="dp-ed dp-ed-box"
          tabIndex={-1}
          ref={focusLater}
          {...common}
        >
          {(c.options ?? []).map((o) => (
            <label class="dp-ed-opt">
              <input
                type="checkbox"
                data-value={o.value}
                data-testid={`${testid}-${o.value}`}
                {...bool("checked", cur.includes(o.value))}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    const type = kind === "number"
      ? "number"
      : kind === "date"
      ? "date"
      : kind === "datetime"
      ? "datetime-local"
      : "text";
    return (
      <input
        class="dp-ed"
        type={type}
        value={original}
        ref={focusLater}
        {...common}
      />
    );
  }

  /** 非编辑态的单元格展示 */
  function plainCell(
    c: DataPanelColumn,
    row: DataPanelRow,
    raw: unknown,
  ): unknown {
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
  const acts = !!(caps.view || caps.update || caps.remove || props.onEdit ||
    props.onView || props.rowExtra);

  const sortIcon = (prop: string) => {
    const q = query.value;
    if (q.sort !== prop) return <span class="ml-1 opacity-30">↕</span>;
    return q.order === 1
      ? <IconChevronUp size="xs" class="ml-1 inline" />
      : <IconChevronDown size="xs" class="ml-1 inline" />;
  };

  function toggleSort(prop: string): void {
    const q = query.value;
    if (q.sort !== prop) return setQuery({ sort: prop, order: 1, page: 1 });
    if (q.order === 1) return setQuery({ sort: prop, order: -1, page: 1 });
    // 第三次点击：回到默认排序
    const ds0 = props.defaultSort;
    setQuery({
      sort: ds0?.prop ?? "",
      order: ds0?.order === "desc" ? -1 : 1,
      page: 1,
    });
  }

  const table = () => {
    const cols = columnsVisible();
    const data = rows.value;
    const sel = selected.value;
    const selectableRows = data.filter((r) => !isLocked(r));
    const allSel = selectableRows.length > 0 &&
      selectableRows.every((r) => sel.includes(idOf(r)));
    const t = totals.value;
    const hasTotals = cols.some((c) => c.total) && data.length > 0;
    return (
      <div class="relative overflow-x-auto">
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
              {selectable && (
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
              )}
              <th class="w-12 border border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                #
              </th>
              {cols.map((c) => (
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
                        onClick={() => toggleSort(c.prop)}
                      >
                        {c.label}
                        {sortIcon(c.prop)}
                      </button>
                    )
                    : c.label}
                </th>
              ))}
              {acts && (
                <th class="border border-slate-200 px-3 py-2 text-center font-medium dark:border-slate-700">
                  {m.actions}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? (
                <tr>
                  <td
                    colSpan={cols.length + 1 + (selectable ? 1 : 0) +
                      (acts ? 1 : 0)}
                    class="border border-slate-200 px-3 py-8 text-center text-slate-400 dark:border-slate-700"
                    data-testid="dp-empty"
                  >
                    {m.empty}
                  </td>
                </tr>
              )
              : data.map((r, i) => (
                <tr
                  class={`dp-row hover:bg-slate-50 ${
                    i % 2 ? "bg-slate-50/50 dark:bg-slate-900/40" : ""
                  }`}
                  data-testid={`dp-row-${idOf(r)}`}
                >
                  {selectable && (
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
                  )}
                  <td class="border border-slate-200 px-2 py-1.5 text-center text-slate-500 dark:border-slate-700">
                    {offset() + i + 1}
                  </td>
                  {cols.map((c) => (
                    <td class="border border-slate-200 px-3 py-1.5 dark:border-slate-700">
                      {cell(c, r)}
                    </td>
                  ))}
                  {acts && (
                    <td class="whitespace-nowrap border border-slate-200 px-2 py-1.5 text-center dark:border-slate-700">
                      <span class="dp-acts">
                        {props.rowExtra?.(r)}
                        {(caps.view || props.onView) && (
                          <Btn
                            type="button"
                            size="sm"
                            variant="ghost"
                            class={ICON_BTN}
                            aria-label={m.view}
                            data-testid={`dp-view-${idOf(r)}`}
                            onClick={() => doView(r)}
                          >
                            <IconEye size="xs" />
                          </Btn>
                        )}
                        {(caps.update || props.onEdit) && (
                          <Btn
                            type="button"
                            size="sm"
                            variant="ghost"
                            class={ICON_BTN}
                            aria-label={m.edit}
                            data-testid={`dp-edit-${idOf(r)}`}
                            onClick={() => doEdit(r)}
                          >
                            <IconEdit size="xs" />
                          </Btn>
                        )}
                        {caps.remove && (
                          <Popconfirm
                            open={() => popRow.value === idOf(r)}
                            placement="top"
                            danger
                            title={tr(m.deleteAsk, { name: rowName(r) })}
                            okText={m.delete}
                            cancelText={m.cancel}
                            overlayClass="dp-pop"
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
                              class={`${ICON_BTN} dp-act-del`}
                              {...bool("disabled", isLocked(r))}
                              aria-label={m.delete}
                              data-testid={`dp-delete-${idOf(r)}`}
                              onClick={() => (popRow.value = idOf(r))}
                            >
                              <IconTrash size="xs" />
                            </Btn>
                          </Popconfirm>
                        )}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
          {hasTotals && (
            <tfoot>
              <tr
                class="bg-slate-50 font-semibold dark:bg-slate-800"
                data-testid="dp-totals"
              >
                {selectable && (
                  <td class="border border-slate-200 dark:border-slate-700" />
                )}
                <td class="border border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                  {m.total}
                </td>
                {cols.map((c) => (
                  <td
                    class="border border-slate-200 px-3 py-2 dark:border-slate-700"
                    data-testid={`dp-total-${c.prop}`}
                  >
                    {c.total
                      ? (c.type === "money"
                        ? formatMoney(t[c.prop])
                        : String(t[c.prop] ?? 0))
                      : ""}
                  </td>
                ))}
                {acts && (
                  <td class="border border-slate-200 dark:border-slate-700" />
                )}
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
    const pbtn = "min-w-8 rounded border px-2 py-1 text-sm disabled:opacity-40";
    return (
      <div
        class="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
        data-testid="dp-pagination"
      >
        <span data-testid="dp-range">
          {n === 0 ? m.rangeEmpty : tr(m.range, { from, to, total: n })}
        </span>
        <div class="flex flex-wrap items-center gap-2">
          <select
            class={SELECT_CLS}
            data-testid="dp-pagesize"
            onChange={(e: Event) =>
              setQuery({
                pageSize: Number(
                  (e.target as unknown as { value: string }).value,
                ),
                page: 1,
              })}
          >
            {pageSizes.map((s) => (
              <option value={String(s)} {...bool("selected", s === q.pageSize)}>
                {tr(m.perPage, { n: s })}
              </option>
            ))}
          </select>
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
            <input
              class="w-14 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
              type="number"
              min="1"
              max={String(last)}
              value={jump.value}
              data-testid="dp-jump"
              onInput={(
                e: Event,
              ) => (jump.value =
                (e.target as unknown as { value: string }).value)}
              onKeyDown={(e: Event & { key: string }) => {
                if (e.key === "Enter") {
                  const p = Math.min(
                    last,
                    Math.max(1, Number.parseInt(jump.value, 10) || 1),
                  );
                  jump.value = "";
                  go(p);
                }
              }}
            />
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
    return (
      <form
        class="grid gap-3"
        data-testid="dp-form"
        onSubmit={(e: Event) => {
          e.preventDefault();
          void submitForm();
        }}
      >
        {formDefs.filter((f) => (id ? true : !f.editOnly)).map((f) => {
          const sig = fields[f.name];
          const ro = !!id && !!f.createOnly;
          const type = f.type ?? "text";
          let control: unknown;
          if (type === "textarea") {
            control = (
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
                <Textarea
                  rows={4}
                  value={sig}
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
              <select
                class={`${SELECT_CLS} w-full`}
                {...bool("disabled", ro)}
                data-testid={`dp-fld-${f.name}`}
                onChange={(e: Event) => (sig.value = selectValue(e.target))}
              >
                {!f.required && !(f.options ?? []).some((o) =>
                  o.value === ""
                ) && <option value="">—</option>}
                {(f.options ?? []).map((o) => (
                  <option
                    value={o.value}
                    {...bool("selected", sig.value === o.value)}
                  >
                    {o.label}
                  </option>
                ))}
              </select>
            );
          } else if (type === "multiselect") {
            const cur = sig.value.split(",").filter(Boolean);
            control = (
              <div
                class="flex flex-wrap gap-x-4 gap-y-1"
                data-testid={`dp-fld-${f.name}`}
              >
                {(f.options ?? []).map((o) => (
                  <label class="flex cursor-pointer items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      {...bool("checked", cur.includes(o.value))}
                      data-testid={`dp-fld-${f.name}-${o.value}`}
                      onChange={() => {
                        const now = sig.value.split(",").filter(Boolean);
                        sig.value = (now.includes(o.value)
                          ? now.filter((x) =>
                            x !== o.value
                          )
                          : [...now, o.value]).join(",");
                      }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            );
          } else if (type === "switch") {
            const on = f.onOff ? f.onOff[0] : "true";
            const off = f.onOff ? f.onOff[1] : "false";
            control = (
              <button
                type="button"
                role="switch"
                data-testid={`dp-fld-${f.name}`}
                aria-checked={sig.value === on ? "true" : "false"}
                class={`dp-sw ${sig.value === on ? "dp-sw-on" : "dp-sw-off"}`}
                onClick={() => (sig.value = sig.value === on ? off : on)}
              >
                <span class="dp-sw-knob" />
              </button>
            );
          } else {
            control = (
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
                <Input
                  type={type === "number"
                    ? "number"
                    : type === "password"
                    ? "password"
                    : type === "date"
                    ? "date"
                    : type === "datetime"
                    ? "datetime-local"
                    : "text"}
                  value={sig}
                  {...bool("readOnly", ro)}
                  autoComplete={type === "password" ? "new-password" : "off"}
                  placeholder={f.placeholder}
                  onInput={(
                    e: Event,
                  ) => (sig.value =
                    (e.target as unknown as { value: string }).value)}
                />
              </div>
            );
          }
          return (
            <FormItem
              label={f.label}
              required={!!f.required && !(f.type === "password" && !!id)}
              error={errs[f.name]}
            >
              {control}
            </FormItem>
          );
        })}
        {formTop.value && (
          <p class="m-0 text-sm text-red-600" data-testid="dp-form-error">
            {formTop.value}
          </p>
        )}
        <div class="mt-2 flex justify-end gap-2">
          <Btn
            type="button"
            onClick={() => (formOpen.value = false)}
            data-testid="dp-form-cancel"
          >
            {m.cancel}
          </Btn>
          <Btn
            type="submit"
            variant="primary"
            loading={formBusy.value}
            data-testid="dp-form-submit"
          >
            {m.confirm}
          </Btn>
        </div>
      </form>
    );
  };

  const viewBody = () => {
    const r = viewRow.value;
    if (!r) return null;
    const seen = new Set<string>();
    const items: { label: string; children: unknown }[] = [];
    for (const c of columns) {
      seen.add(c.prop);
      items.push({ label: c.label, children: displayValue(c, r, m) || "—" });
    }
    for (const f of formDefs) {
      if (seen.has(f.name) || f.type === "password") continue;
      const raw = r[f.name];
      items.push({
        label: f.label,
        children: raw === undefined || raw === null || raw === ""
          ? "—"
          : String(raw),
      });
    }
    return <Descriptions bordered column={1} size="sm" items={items} />;
  };

  return (
    <div class="contents" data-testid={`panel-${key}`}>
      <style>{DATA_PANEL_CSS}</style>
      <Card
        bordered
        size="sm"
        class={`dp-card${props.class ? ` ${props.class}` : ""}`}
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
        <div class="px-2.5 py-2.5">{table}</div>
        <div data-testid="dp-batch-slot">{batchBar}</div>
        {pagination}
      </Card>

      {props.children}

      <Modal
        open={formOpen}
        title={() => `${formId.value ? m.edit : m.add} · ${props.title}`}
        width="md"
        keyboard
        destroyOnClose
        onClose={() => (formOpen.value = false)}
        // deno-lint-ignore jsx-no-children-prop
        children={formBody}
      />
      <Modal
        open={searchOpen}
        title={() => `${m.search} · ${props.title}`}
        width="md"
        keyboard
        destroyOnClose
        onClose={() => (searchOpen.value = false)}
        // deno-lint-ignore jsx-no-children-prop
        children={searchBody}
      />
      <Modal
        open={() => viewRow.value !== null}
        title={() => `${m.view} · ${props.title}`}
        width="md"
        keyboard
        destroyOnClose
        onClose={() => (viewRow.value = null)}
        // deno-lint-ignore jsx-no-children-prop
        children={viewBody}
      />
      <Modal
        open={() => confirm.value !== null}
        title={() => confirm.value?.title ?? ""}
        width="sm"
        keyboard
        destroyOnClose
        onClose={() => (confirm.value = null)}
        // deno-lint-ignore jsx-no-children-prop
        children={() => (
          <div data-testid="dp-confirm">
            <p class="mb-5 text-sm" data-testid="dp-confirm-text">
              {confirm.value?.text}
            </p>
            <div class="flex justify-end gap-2">
              <Btn
                type="button"
                data-testid="dp-confirm-cancel"
                onClick={() => (confirm.value = null)}
              >
                {m.cancel}
              </Btn>
              <Btn
                type="button"
                variant={confirm.value?.danger ? "danger" : "primary"}
                loading={confirmBusy.value}
                data-testid="dp-confirm-ok"
                onClick={async () => {
                  const c = confirm.value;
                  if (!c || confirmBusy.value) return;
                  confirmBusy.value = true;
                  try {
                    await c.run();
                  } finally {
                    confirmBusy.value = false;
                    confirm.value = null;
                  }
                }}
              >
                {confirm.value?.okText}
              </Btn>
            </div>
          </div>
        )}
      />
    </div>
  );
}

export default DataPanel;
