/**
 * DataPanel 纯逻辑工具（无 DOM 依赖，可在测试里直接调用）：
 * 单元格展示、CSV／JSON／XML 解析、分页页码、查询序列化、本地数据源、导出文件构建。
 */
import { formatMessage } from "./data-panel-messages.ts";
import type {
  PaginationPreset,
  PaginationSize,
} from "../navigation/Pagination.tsx";
import type {
  ActionCtrl,
  ActionTone,
  BulkResult,
  Column,
  DataSource,
  ExportFormat,
  FieldRule,
  FormField,
  ImportResult,
  ListResult,
  Messages,
  ModalShellWidth,
  PanelPaginationConfig,
  Query,
  Row,
  RowActionsConfig,
  SearchField,
  ViewConfig,
  ViewDescriptionsProps,
  ViewItem,
  WriteResult,
} from "./data-panel-types.ts";
import {
  actionDisplayText,
  resolveActionCtrl,
  resolveRowActionCtrl,
} from "./data-panel-types.ts";
import {
  buildXlsx,
  neutralizeFormula,
  XLSX_MIME,
  type XlsxCell,
  xmlEscape,
  xmlUnescape,
} from "./data-panel-xlsx.ts";
import { DATA_PANEL_MOBILE_MAX_PX } from "./data-panel-viewport.ts";

const p2 = (n: number) => String(n).padStart(2, "0");

/** 从行数据取主键：优先 rowKey，否则 id，再否则 _id。 */
export function itemRowId(row: Row, rowKey = "id"): string {
  const rec = row as Record<string, unknown>;
  const raw = rec[rowKey] ?? rec.id ?? rec._id;
  return raw == null || raw === "" ? "" : String(raw);
}

/**
 * 按格式输出日期时间（运行环境本地时区）。
 * @param format 令牌 `YYYY` `MM` `DD` `HH` `mm` `ss`；缺省 `YYYY-MM-DD HH:mm:ss`
 * 空 / 无效返回原值或 ""。
 */
export function formatDateTime(
  v: unknown,
  format = "YYYY-MM-DD HH:mm:ss",
): string {
  if (v === null || v === undefined || v === "") return "";
  // 纯日期串 + 只要日期格式：避免时区换算造成前后一天
  const raw = String(v);
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    !format.includes("H") && !format.includes("m") && !format.includes("s")
  ) {
    const [y, mo, d] = raw.split("-");
    return format
      .replace(/YYYY/g, y)
      .replace(/MM/g, mo)
      .replace(/DD/g, d);
  }
  const d = v instanceof Date ? v : new Date(raw);
  if (Number.isNaN(d.getTime())) return String(v);
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: p2(d.getMonth() + 1),
    DD: p2(d.getDate()),
    HH: p2(d.getHours()),
    mm: p2(d.getMinutes()),
    ss: p2(d.getSeconds()),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (tok) => map[tok] ?? tok);
}

/** 金额：千分位 + 两位小数；非数字返回 "" */
export function formatMoney(v: unknown): string {
  const n = Number(v);
  if (v === null || v === "" || v === undefined || !Number.isFinite(n)) {
    return "";
  }
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 是否像可信 HTML 片段（以 `<` 开头且含 `>`）；供列 value／formatter 注入 */
export function looksLikeHtml(s: string): boolean {
  const t = s.trim();
  return t.startsWith("<") && t.includes(">");
}

/** 把 value／formatter 的返回值压成纯文本（导出／打印／详情）；节点／HTML 回落空串由调用方再退字段原文 */
export function cellResultToText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") {
    if (looksLikeHtml(v)) {
      // 粗剥标签，仅作导出兜底
      return v.replace(/<[^>]*>/g, "").trim();
    }
    return v;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const n = v as { textContent?: unknown; nodeType?: number };
    if (typeof n.textContent === "string") return n.textContent;
  }
  return "";
}

/**
 * 解析列上的函数式展示：`formatter` 优先于 `value`。
 * 返回 `undefined` 表示未声明函数，调用方走声明式 options／默认类型。
 */
export function resolveColumnFn(
  col: Column,
  row: Row,
): unknown | undefined {
  const raw = row[colProp(col)];
  if (typeof col.formatter === "function") return col.formatter(row, raw);
  if (typeof col.value === "function") return col.value(row);
  return undefined;
}

/** 声明式／默认类型的纯文本展示（不含 value／formatter） */
function displayValueDefault(
  col: Column,
  row: Row,
  m: Pick<Messages, "yes" | "no">,
): string {
  const raw = row[colProp(col)];
  switch (col.type) {
    case "tag": {
      if (Array.isArray(raw)) {
        return raw.map((v) =>
          col.options?.find((x) => x.value === String(v))?.label ?? String(v)
        ).join(", ");
      }
      const o = col.options?.find((x) => x.value === String(raw));
      return o ? o.label : (raw == null ? "" : String(raw));
    }
    case "date": {
      const fmt = col.format ?? "YYYY-MM-DD";
      return formatDateTime(raw, fmt);
    }
    case "bool":
      return raw ? m.yes : m.no;
    case "datetime":
      return formatDateTime(raw, col.format ?? "YYYY-MM-DD HH:mm:ss");
    case "money":
      return formatMoney(raw);
    case "number": {
      const n = Number(raw);
      return raw !== null && raw !== "" && raw !== undefined &&
          Number.isFinite(n)
        ? String(n)
        : "";
    }
    default:
      if (raw === null || raw === undefined) return "";
      if (Array.isArray(raw)) return raw.join(", ");
      return typeof raw === "object" ? JSON.stringify(raw) : String(raw);
  }
}

/** 单元格的纯文本展示值（tag 用选项文案、日期格式化、布尔本地化等），导出 / 打印 / 详情共用 */
export function displayValue(
  col: Column,
  row: Row,
  m: Pick<Messages, "yes" | "no">,
): string {
  const fn = resolveColumnFn(col, row);
  if (fn !== undefined) {
    const t = cellResultToText(fn);
    if (t !== "") return t;
    // 节点／空 HTML：回落声明式，避免导出空白
    return displayValueDefault(col, row, m);
  }
  return displayValueDefault(col, row, m);
}

/** 极简 CSV 解析（引号、逗号、换行）→ 以表头为键的行 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push(row);
  const [head, ...rest] = rows;
  if (!head) return [];
  return rest.map((r) =>
    Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()]))
  );
}

/** 解析 JSON 数组 → 字符串字段行（非数组则空） */
export function parseJsonRows(text: string): Record<string, string>[] {
  const j = JSON.parse(text);
  return (Array.isArray(j) ? j : []).map((o: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(o ?? {}).map(([k, v]) => [k, String(v ?? "")]),
    )
  );
}

/** 解析 DataPanel XML 导出（`<rows><row><prop>…</prop></row></rows>`） */
export function parseXmlRows(text: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(text))) {
    const obj: Record<string, string> = {};
    const cellRe = /<([A-Za-z_][\w.-]*)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let c: RegExpExecArray | null;
    while ((c = cellRe.exec(m[1]))) {
      obj[c[1]] = xmlUnescape(c[2]).trim();
    }
    if (Object.keys(obj).length) rows.push(obj);
  }
  return rows;
}

/** 分页页码序列：首 2 页、末 2 页、当前页 ±1，缺口用 "…" */
export function pageList(cur: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const s = new Set([1, 2, last - 1, last, cur - 1, cur, cur + 1]);
  const arr = [...s].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  arr.forEach((n, i) => {
    if (i && n - arr[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

/** DataPanel 默认每页条数（列表请求与底栏选择器共用） */
export const DEFAULT_DATA_PANEL_PAGE_SIZE = 20;

/** 每页条数下拉缺省选项 */
export const DEFAULT_DATA_PANEL_PAGE_SIZES = [10, 20, 50, 100];

/** 查询 → URLSearchParams（`forUrl` 时省略默认值，用于地址栏同步） */
/** 给查询参数加可选前缀（`p1` → `p1_page`）。空／未传则原名。 */
export function queryParamKey(name: string, prefix?: string): string {
  const p = prefix?.trim();
  return p ? `${p}_${name}` : name;
}

export function queryToParams(
  q: Query,
  opts: {
    forUrl: boolean;
    defaultPageSize?: number;
    defaultSort?: { prop: string; order: "asc" | "desc" };
    fixed?: Record<string, string>;
    /** 参数前缀，如 `"p1"` → `p1_page`、`p1_name`。同页多面板用不同前缀避免抢参数。 */
    prefix?: string;
  },
): URLSearchParams {
  const p = new URLSearchParams();
  const key = (name: string) => queryParamKey(name, opts.prefix);
  if (q.page > 1) p.set(key("page"), String(q.page));
  if (
    !opts.forUrl ||
    q.pageSize !== (opts.defaultPageSize ?? DEFAULT_DATA_PANEL_PAGE_SIZE)
  ) {
    p.set(key("pageSize"), String(q.pageSize));
  }
  const ds = opts.defaultSort;
  const isDefault = (!q.sort && !ds) ||
    (ds && q.sort === ds.prop && q.order === ds.order);
  if (q.sort && (!opts.forUrl || !isDefault)) {
    p.set(key("sort"), q.sort);
    p.set(key("order"), q.order === "desc" ? "desc" : "asc");
  }
  for (const [k, v] of Object.entries(q.filters)) {
    if (v !== "" && !(opts.fixed && k in opts.fixed)) p.set(key(k), v);
  }
  if (!opts.forUrl && opts.fixed) {
    for (const [k, v] of Object.entries(opts.fixed)) p.set(key(k), v);
  }
  return p;
}

/**
 * URLSearchParams → 查询片段（与 {@link queryToParams} forUrl 约定对称）。
 * - `page` / `pageSize`：正整数才采纳
 * - `sort` + `order`（asc｜desc，默认 asc）
 * - 搜索字段：仅 `searchNames` 中的 key；空串忽略；`fixed` 中的 key 不从 URL 读（固定过滤不进地址栏）
 * 未知 query key 忽略（避免污染 filters）。
 */
export function queryFromParams(
  params: URLSearchParams,
  opts: {
    searchNames: readonly string[];
    fixed?: Record<string, string>;
    /** 与 {@link queryToParams} 相同的参数前缀 */
    prefix?: string;
  },
): Partial<Query> {
  const out: Partial<Query> = {};
  const key = (name: string) => queryParamKey(name, opts.prefix);
  const pageRaw = params.get(key("page"));
  if (pageRaw != null && pageRaw !== "") {
    const page = Number.parseInt(pageRaw, 10);
    if (Number.isFinite(page) && page >= 1) out.page = page;
  }
  const psRaw = params.get(key("pageSize"));
  if (psRaw != null && psRaw !== "") {
    const pageSize = Number.parseInt(psRaw, 10);
    if (Number.isFinite(pageSize) && pageSize >= 1) out.pageSize = pageSize;
  }
  const sort = params.get(key("sort"));
  if (sort) {
    out.sort = sort;
    out.order = params.get(key("order")) === "desc" ? "desc" : "asc";
  }
  const filters: Record<string, string> = {};
  const fixed = opts.fixed ?? {};
  for (const name of opts.searchNames) {
    if (name in fixed) continue;
    const v = params.get(key(name));
    if (v != null && v !== "") filters[name] = v;
  }
  if (Object.keys(filters).length > 0) out.filters = filters;
  return out;
}

/**
 * 搜索重置：只去掉搜索表单里的字段，其它过滤条件一律保留。
 * `tab` 不是搜索字段，不会被清掉（即便它曾被写进 filters）。
 */
export function filtersAfterSearchReset(
  filters: Record<string, string> | undefined,
  searchNames: readonly string[],
  fixed?: Record<string, string>,
): Record<string, string> {
  const next = { ...(filters ?? {}) };
  const locked = fixed ?? {};
  for (const name of searchNames) {
    if (!(name in locked)) delete next[name];
  }
  return { ...next, ...locked };
}

/**
 * 搜索提交：只更新搜索表单字段（空值则删除该键），其它过滤条件保留。
 */
export function filtersAfterSearchApply(
  filters: Record<string, string> | undefined,
  searchValues: Record<string, string>,
  searchNames: readonly string[],
  fixed?: Record<string, string>,
): Record<string, string> {
  const next = { ...(filters ?? {}) };
  const locked = fixed ?? {};
  for (const name of searchNames) {
    if (name in locked) continue;
    const v = searchValues[name];
    if (v) next[name] = v;
    else delete next[name];
  }
  return { ...next, ...locked };
}

/**
 * 列规范化：旧 `edit:true` → 补 `inline`（两档 options→switch，否则 text）。
 * 已写 `inline` 时不动。
 */
export function normalizeColumns(
  columns: readonly Column[],
): Column[] {
  return columns.map((c) => {
    if (c.type === "selection" || c.type === "index" || c.type === "actions") {
      return c;
    }
    if (c.inline || !c.edit) return c;
    const inline = c.options && c.options.length === 2
      ? "switch" as const
      : "text" as const;
    return { ...c, inline };
  });
}

/** 与 data-panel-chrome 的 COL_SELECT／COL_INDEX 对齐（避免 utils↔chrome 循环依赖） */
export const PANEL_COL_SELECT = "__select";
export const PANEL_COL_INDEX = "__index";
export const PANEL_COL_ACTIONS = "__actions";

/** 列文本对齐（与 {@link Column.align}／`headerAlign` 一致） */
export type ColumnAlign = "left" | "center" | "right";

/**
 * 解析数据列单元格对齐；缺省居中。
 *
 * @param c - 列配置（只读 `align`）
 */
export function resolveColumnAlign(
  c: Pick<Column, "align">,
): ColumnAlign {
  return c.align ?? "center";
}

/**
 * 解析数据列表头对齐：`headerAlign` 优先，否则跟 `align`，再否则居中。
 *
 * @param c - 列配置
 */
export function resolveColumnHeaderAlign(
  c: Pick<Column, "align" | "headerAlign">,
): ColumnAlign {
  return c.headerAlign ?? c.align ?? "center";
}

/**
 * 将列宽相关字段拼成内联 style 字符串。
 * 未写 `width` 或为 `"auto"` 时用 `max-content` 并禁止换行，按内容自适应。
 * `width` 为数字时写成 `px`。`minWidth`／`maxWidth` 仍为像素。
 *
 * @param c - 含宽度字段的列定义
 * @returns CSS 声明串
 */
export function columnWidthStyle(
  c: Pick<Column, "width" | "minWidth" | "maxWidth">,
): string {
  const parts: string[] = [];
  if (c.width == null || c.width === "auto") {
    parts.push("width:max-content", "white-space:nowrap");
  } else {
    parts.push(`width:${c.width}px`);
  }
  if (c.minWidth != null) parts.push(`min-width:${c.minWidth}px`);
  if (c.maxWidth != null) parts.push(`max-width:${c.maxWidth}px`);
  return parts.join(";");
}

/**
 * 列上 ellipsis 截断，fixed:"left" 左侧粘滞。
 */
export function columnTableClass(
  c: Pick<Column, "ellipsis" | "fixed">,
): string {
  const parts: string[] = [];
  if (c.ellipsis) {
    parts.push("overflow-hidden text-ellipsis whitespace-nowrap");
  }
  if (c.fixed === "left") {
    parts.push("sticky left-0 z-[2] bg-white dark:bg-slate-900");
  }
  return parts.join(" ");
}

/**
 * 对齐 → Tailwind `text-*` class。
 *
 * @param align - 左／中／右
 */
export function columnAlignTextClass(align: ColumnAlign): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

/**
 * 对齐 → 表头排序按钮等 `inline-flex` 容器的 `justify-*`。
 *
 * @param align - 左／中／右
 */
export function columnAlignFlexJustify(align: ColumnAlign): string {
  if (align === "center") return "justify-center";
  if (align === "right") return "justify-end";
  return "justify-start";
}

/** 列 prop（系统列解析后必有；数据列调用方应提供） */
export function colProp(c: Pick<Column, "prop">): string {
  return c.prop ?? "";
}

/** 列 label（空则回落 prop） */
export function colLabel(c: Pick<Column, "prop" | "label">): string {
  const lab = c.label;
  if (lab != null && String(lab).trim()) return String(lab);
  return c.prop ?? "";
}

export function isSelectionColumn(c: Column): boolean {
  return c.type === "selection" || c.prop === PANEL_COL_SELECT;
}

export function isIndexColumn(c: Column): boolean {
  return c.type === "index" || c.prop === PANEL_COL_INDEX;
}

export function isActionsColumn(c: Column): boolean {
  return c.type === "actions" || c.prop === PANEL_COL_ACTIONS;
}

/** 解析后保证 prop／label 为 string（供渲染／导出） */
export type ResolvedColumn = Column & { prop: string; label: string };

export function isSystemColumn(c: Column): boolean {
  return isSelectionColumn(c) || isIndexColumn(c) || isActionsColumn(c);
}

export type ResolvePanelColumnsOptions = {
  /** @deprecated 顶层 selectable：false 强制去掉 selection 列；true／省略不会再自动补勾选列 */
  selectable?: boolean;
  /**
   * @deprecated 已忽略。勾选列只由 columns 里的 `{ type:"selection" }` 决定，
   * caps.remove 不再自动前置多选列。
   */
  needSelection?: boolean;
  /**
   * 无显式 index 列时是否自动前置默认序号列。
   * 默认 false：序号列只在 columns 里声明 `{ type:"index" }` 时出现。
   * 传 true 则恢复旧的自动前置行为。
   */
  autoIndex?: boolean;
  /**
   * 是否需要操作列（column.actions／caps 可能出钮）——无显式 actions 列时兼容追加到末尾。
   * 显式 `{ type:"actions" }` 时位置／label 完全由 columns 决定。
   */
  needActions?: boolean;
};

/**
 * 解析面板列：规范化 selection／index／actions，并按需兼容补系统列。
 * - `{ type:"selection" }`：prop／label 可省（默认 `__select`／`""`）；有则显示勾选列。`selectable:false` 时仍剔除（兼容）
 * - `{ type:"index" }`：prop／label 可省（默认 `__index`／`"#"`）；位置随 columns 写入序
 * - `{ type:"actions" }`：prop／label 可省（默认 `__actions`／`""`，表头回落 messages.actions）
 * - 未声明 index 且 autoIndex===true：前置默认序号列（旧行为，需显式打开）
 * - 未声明 selection：不自动补勾选列（needSelection／selectable:true 均不足够）
 * - 未声明 actions 且 needActions：末尾追加操作列（兼容旧「有钮即出列」）
 */

/** 未写 prop 的自定义列使用的稳定键前缀 */
export const CUSTOM_COL_PREFIX = "__custom:";

/** 是否为面板分配的自定义列键（不是行上的真实字段） */
export function isSyntheticColumnProp(prop: string): boolean {
  return prop.startsWith(CUSTOM_COL_PREFIX);
}

/**
 * 该列排序时写入 `query.sort` 的字段：`sortProp` 优先，否则用真实 `prop`。
 * 合成键不能作为排序字段。
 */
export function columnSortKey(c: Pick<Column, "prop" | "sortProp">): string {
  const sortProp = (c.sortProp ?? "").trim();
  if (sortProp) return sortProp;
  const prop = (c.prop ?? "").trim();
  if (prop && !isSyntheticColumnProp(prop)) return prop;
  return "";
}

/**
 * 为未写 `prop` 的数据列分配稳定且不重复的键（`__custom:标签` 或 `__custom:下标`）。
 * 系统列与已有 prop 保持不变。
 */
export function assignColumnProps<T extends Column>(
  columns: readonly T[],
): T[] {
  const used = new Set(
    columns.map((c) => (c.prop ?? "").trim()).filter(Boolean),
  );
  return columns.map((c, i) => {
    if (isSystemColumn(c)) return c;
    const prop = (c.prop ?? "").trim();
    if (prop) return prop === c.prop ? c : { ...c, prop };
    const lab = (c.label ?? "").trim();
    const base = lab
      ? `${CUSTOM_COL_PREFIX}${lab}`
      : `${CUSTOM_COL_PREFIX}${i}`;
    let key = base;
    let n = 2;
    while (used.has(key)) {
      key = `${base}:${n}`;
      n += 1;
    }
    used.add(key);
    return { ...c, prop: key };
  });
}

export function resolvePanelColumns(
  columns: readonly Column[],
  opts: ResolvePanelColumnsOptions = {},
): ResolvedColumn[] {
  const autoIndex = opts.autoIndex === true;
  const mapped: ResolvedColumn[] = normalizeColumns(columns).map((c) => {
    if (c.type === "selection" || c.prop === PANEL_COL_SELECT) {
      return {
        ...c,
        type: "selection" as const,
        prop: c.prop || PANEL_COL_SELECT,
        label: c.label ?? "",
      };
    }
    if (c.type === "index" || c.prop === PANEL_COL_INDEX) {
      return {
        ...c,
        type: "index" as const,
        prop: c.prop || PANEL_COL_INDEX,
        label: (c.label && String(c.label).trim()) ? c.label : "#",
      };
    }
    if (c.type === "actions" || c.prop === PANEL_COL_ACTIONS) {
      return {
        ...c,
        type: "actions" as const,
        prop: c.prop || PANEL_COL_ACTIONS,
        label: c.label ?? "",
      };
    }
    const prop = c.prop ?? "";
    return {
      ...c,
      prop,
      label: (c.label && String(c.label).trim()) ? c.label : prop,
    };
  });
  const mappedAssigned = assignColumnProps(mapped);

  const hasIdx = mappedAssigned.some(isIndexColumn);
  const hasAct = mappedAssigned.some(isActionsColumn);
  const prepend: ResolvedColumn[] = [];
  if (!hasIdx && autoIndex) {
    prepend.push({ type: "index", prop: PANEL_COL_INDEX, label: "#" });
  }
  let out: ResolvedColumn[] = [...prepend, ...mappedAssigned];
  if (!hasAct && opts.needActions) {
    out = [...out, {
      type: "actions",
      prop: PANEL_COL_ACTIONS,
      label: "",
    }];
  }
  if (opts.selectable === false) {
    out = out.filter((c) => !isSelectionColumn(c));
  }
  return out;
}

/** search／form 字段键：优先 `prop`，兼容旧 `name` */
export function fieldProp(
  f: { prop?: string; name?: string },
): string {
  return f.prop ?? f.name ?? "";
}

/**
 * 用 columns 补全 search 项：缺 label／type／options 时从同 prop 列继承。
 * 键统一写出为 `prop`（保留传入的 name 仅当无 prop）。
 */
export function enrichSearchFields(
  search: readonly SearchField[],
  columns: readonly Column[],
): SearchField[] {
  const byProp = new Map(columns.map((c) => [colProp(c), c]));
  return search.map((s) => {
    const key = fieldProp(s);
    const col = key ? byProp.get(key) : undefined;
    const type = s.type ??
      (col?.type === "tag" || col?.options ? "select" : undefined);
    return {
      ...s,
      prop: key || undefined,
      label: s.label ?? col?.label ?? key,
      type,
      options: s.options ?? col?.options,
    };
  }).filter((s) => fieldProp(s) !== "");
}

/**
 * 用 columns 补全 form 项：缺 label／options 时从同 prop 列继承；
 * switch 无 onOff 时用列两档 options 的 value 作 [开,关]。
 */
export function enrichFormFields(
  form: readonly FormField[],
  columns: readonly Column[],
): FormField[] {
  const byProp = new Map(columns.map((c) => [colProp(c), c]));
  return form.map((f) => {
    const key = fieldProp(f);
    const col = key ? byProp.get(key) : undefined;
    const type = f.type ??
      (col?.inline === "switch"
        ? "switch"
        : col?.options
        ? "select"
        : undefined);
    let onOff = f.onOff;
    if (
      (type === "switch" || f.type === "switch") && !onOff &&
      col?.options && col.options.length >= 2
    ) {
      onOff = [col.options[0].value, col.options[1].value];
    }
    return {
      ...f,
      prop: key || undefined,
      label: f.label ?? col?.label ?? key,
      type,
      options: f.options ?? col?.options,
      onOff,
    };
  }).filter((f) => fieldProp(f) !== "");
}

// ------------------------------------------------------------------ local data source

/** `createLocalDataSource` 选项 */
export interface LocalDataSourceOptions {
  /** 初始数据（会被拷贝；后续增删改在内部副本上进行） */
  rows: Row[];
  columns: Column[];
  search?: SearchField[];
  form?: FormField[];
  /** 主键字段，默认 id */
  rowKey?: string;
  /** 固定过滤（总是并入 filters） */
  fixed?: Record<string, string>;
  /** 数据变化回调（新增 / 编辑 / 删除 / 批量 / 导入之后） */
  onChange?: (rows: Row[]) => void;
  /** 为 false 时不提供 create/update/remove/setField/importRows（只读） */
  writable?: boolean;
}

/** 本地数据源：在内存数组上完成过滤、排序、分页、合计与增删改，同步返回 */
export interface LocalDataSource extends DataSource {
  sync: true;
  create?(values: Record<string, unknown>): WriteResult;
  update?(id: string, values: Record<string, unknown>): WriteResult;
  remove?(ids: string[]): BulkResult;
  setField?(ids: string[], field: string, value: unknown): BulkResult;
  importRows?(rows: Record<string, string>[]): ImportResult;

  list(query: Query): ListResult;
  /** 按主键取单条（副本）；没有则 null */
  view(id: string): Row | null;
  /** {@link LocalDataSource.view} 的别名 */
  get(id: string): Row | null;
  /** 当前全部行（副本） */
  getRows(): Row[];
  /** 整体替换数据 */
  setRows(rows: Row[]): void;
}

function cmp(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined || a === "") return 1;
  if (b === null || b === undefined || b === "") return -1;
  const na = Number(a), nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && a !== "" && b !== "") {
    return na - nb;
  }
  const da = a instanceof Date ? a.getTime() : NaN;
  const db = b instanceof Date ? b.getTime() : NaN;
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * 对配置了 `total: true` 的列，按给定行数据求和。
 * 非数值计为 0；结果四舍五入到 6 位小数，消除浮点累加误差。
 * DataPanel 页脚只用此函数，不读取 `list()`／接口返回的 `totals`。
 *
 * 传入哪些行由调用方决定：本地 data 传当前过滤结果全集，分页接口传当前已加载页。
 */
export function sumColumnTotals(
  rows: Row[],
  columns: Column[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const c of columns) {
    if (!c.total) continue;
    const prop = colProp(c);
    if (!prop) continue;
    const sum = rows.reduce((s, r) => s + (Number(r[prop]) || 0), 0);
    totals[prop] = Math.round(sum * 1e6) / 1e6;
  }
  return totals;
}

/** 本地过滤：按搜索项逐个匹配 */
export function filterRows(
  rows: Row[],
  filters: Record<string, string>,
  search: SearchField[],
): Row[] {
  const entries = Object.entries(filters).filter(([, v]) => v !== "");
  if (!entries.length) return rows;
  return rows.filter((row) =>
    entries.every(([name, val]) => {
      const def = search.find((s) => fieldProp(s) === name);
      const field = def?.field ?? name;
      const raw = row[field];
      const text = raw == null ? "" : String(raw);
      if (def?.type === "multiselect" && !def.match) {
        const want = val.split(",").map((s) => s.trim()).filter(Boolean);
        const have = (Array.isArray(raw) ? raw.map(String) : text.split(","))
          .map((s) => s.trim());
        return want.every((w) => have.includes(w));
      }
      const match = def?.match ??
        (def?.type === "select" || def?.type === "date" ||
            def?.type === "datetime"
          ? "eq"
          : def?.type === "number"
          ? "num"
          : "contains");
      switch (match) {
        case "eq":
          if (def?.type === "date") {
            return text.slice(0, 10) === val.slice(0, 10);
          }
          if (def?.type === "datetime") {
            return text.slice(0, val.length) === val;
          }
          return text === val;
        case "num":
          return Number(raw) === Number(val);
        case "from":
          return text.slice(0, val.length) >= val;
        case "to":
          return text.slice(0, val.length) <= val;
        default:
          return text.toLowerCase().includes(val.toLowerCase());
      }
    })
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmptyVal = (v: unknown): boolean =>
  v === undefined || v === null || v === "" ||
  (Array.isArray(v) && v.length === 0);

function failMsg(
  ruleMsg: string | undefined,
  fieldMsg: string | undefined,
  fallback: string,
): string {
  return ruleMsg || fieldMsg || fallback;
}

/** 执行单条 FieldRule；通过返回 null，失败返回文案 */
export function applyFieldRule(
  rule: FieldRule,
  value: unknown,
  values: Record<string, unknown>,
  opts: {
    fieldType?: string;
    fieldMessage?: string;
    m: Pick<Messages, "required" | "min" | "max" | "patternMismatch">;
  },
): string | null {
  const { m, fieldMessage, fieldType } = opts;
  const empty = isEmptyVal(value);
  if (rule.required && empty) {
    return failMsg(rule.message, fieldMessage, m.required);
  }
  if (empty) return null;

  if (rule.validator) {
    const r = rule.validator(value, values);
    if (typeof r === "string" && r) return r;
    if (r === false) {
      return failMsg(rule.message, fieldMessage, m.patternMismatch);
    }
    // true / void → continue other checks on same rule? treat as pass for validator part
  }

  const asNum = fieldType === "number" || rule.type === "number";
  if (asNum || rule.type === "number") {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return failMsg(rule.message, fieldMessage, m.patternMismatch);
    }
    if (rule.min !== undefined && n < rule.min) {
      return failMsg(
        rule.message,
        fieldMessage,
        formatMessage(m.min, { n: rule.min }),
      );
    }
    if (rule.max !== undefined && n > rule.max) {
      return failMsg(
        rule.message,
        fieldMessage,
        formatMessage(m.max, { n: rule.max }),
      );
    }
  } else {
    const s = typeof value === "string" ? value : String(value);
    if (rule.min !== undefined && s.length < rule.min) {
      return failMsg(
        rule.message,
        fieldMessage,
        formatMessage(m.min, { n: rule.min }),
      );
    }
    if (rule.max !== undefined && s.length > rule.max) {
      return failMsg(
        rule.message,
        fieldMessage,
        formatMessage(m.max, { n: rule.max }),
      );
    }
  }

  if (rule.pattern != null) {
    try {
      const re = typeof rule.pattern === "string"
        ? new RegExp(rule.pattern)
        : rule.pattern;
      if (!re.test(String(value))) {
        return failMsg(rule.message, fieldMessage, m.patternMismatch);
      }
    } catch { /* ignore bad regexp */ }
  }

  if (rule.type === "email" && !EMAIL_RE.test(String(value))) {
    return failMsg(rule.message, fieldMessage, m.patternMismatch);
  }
  if (rule.type === "url") {
    try {
      const u = new URL(String(value));
      if (!/^https?:$/i.test(u.protocol)) {
        return failMsg(rule.message, fieldMessage, m.patternMismatch);
      }
    } catch {
      return failMsg(rule.message, fieldMessage, m.patternMismatch);
    }
  }
  if (rule.type === "string" && typeof value !== "string") {
    return failMsg(rule.message, fieldMessage, m.patternMismatch);
  }
  return null;
}

type FieldLike = {
  prop?: string;
  name?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  maxlength?: number;
  message?: string;
  rules?: FieldRule[];
};

function validateFieldLike(
  f: FieldLike,
  values: Record<string, unknown>,
  m: Pick<Messages, "required" | "min" | "max" | "patternMismatch">,
  skipRequiredPasswordEdit: boolean,
): string | undefined {
  const key = fieldProp(f);
  const v = values[key];
  const empty = isEmptyVal(v);

  if (f.rules && f.rules.length) {
    for (const rule of f.rules) {
      // 编辑密码留空：跳过 required
      if (
        skipRequiredPasswordEdit && rule.required && empty &&
        f.type === "password"
      ) continue;
      const err = applyFieldRule(rule, v, values, {
        fieldType: f.type,
        fieldMessage: f.message,
        m,
      });
      if (err) return err;
    }
    // rules 跑完仍可做 maxlength 硬限制
    if (!empty && f.maxlength != null && String(v).length > f.maxlength) {
      return failMsg(
        undefined,
        f.message,
        formatMessage(m.max, { n: f.maxlength }),
      );
    }
    return undefined;
  }

  // 简写路径
  if (empty) {
    if (f.required && !skipRequiredPasswordEdit) {
      return failMsg(undefined, f.message, m.required);
    }
    return undefined;
  }
  if (f.type === "number") {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      return failMsg(undefined, f.message, m.patternMismatch);
    }
    if (f.min !== undefined && n < f.min) {
      return failMsg(undefined, f.message, formatMessage(m.min, { n: f.min }));
    }
    if (f.max !== undefined && n > f.max) {
      return failMsg(undefined, f.message, formatMessage(m.max, { n: f.max }));
    }
  } else {
    const s = String(v);
    if (f.min !== undefined && s.length < f.min) {
      return failMsg(undefined, f.message, formatMessage(m.min, { n: f.min }));
    }
    if (f.max !== undefined && s.length > f.max) {
      return failMsg(undefined, f.message, formatMessage(m.max, { n: f.max }));
    }
    if (f.maxlength != null && s.length > f.maxlength) {
      return failMsg(
        undefined,
        f.message,
        formatMessage(m.max, { n: f.maxlength }),
      );
    }
  }
  if (f.pattern && typeof v === "string") {
    try {
      if (!new RegExp(f.pattern).test(v)) {
        return failMsg(undefined, f.message, m.patternMismatch);
      }
    } catch { /* ignore */ }
  }
  return undefined;
}

/** 校验表单值（rules 优先；兼容 required／min／max／pattern／maxlength 简写） */
export function validateForm(
  form: FormField[],
  values: Record<string, unknown>,
  isEdit: boolean,
  m: Pick<Messages, "required" | "min" | "max" | "patternMismatch">,
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of form) {
    if (f.createOnly && isEdit) continue;
    if (f.editOnly && !isEdit) continue;
    const key = fieldProp(f);
    const skipPwd = isEdit && f.type === "password" && isEmptyVal(values[key]);
    const err = validateFieldLike(f, values, m, skipPwd);
    if (err) errs[key] = err;
  }
  return errs;
}

/** 校验搜索项（rules／required／pattern／maxlength）；无规则时返回空 */
export function validateSearchFields(
  search: SearchField[],
  values: Record<string, unknown>,
  m: Pick<Messages, "required" | "min" | "max" | "patternMismatch">,
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of search) {
    const has = (f.rules && f.rules.length > 0) ||
      f.required ||
      f.pattern ||
      f.maxlength != null;
    if (!has) continue;
    const key = fieldProp(f);
    const err = validateFieldLike(f, values, m, false);
    if (err) errs[key] = err;
  }
  return errs;
}

/** 栅格跨列：span ?? cols，夹到 1–12 */
export function fieldSpan(
  f: { span?: number; cols?: number },
): number | undefined {
  const raw = f.span ?? f.cols;
  if (raw == null || !Number.isFinite(raw)) return undefined;
  return Math.min(12, Math.max(1, Math.round(raw)));
}

/**
 * 表单／搜索项布局 style（width＋gridColumn）。
 * grid 开启时未写 span／cols 默认占满一行（12）。
 * 传入容器宽度且 ≤ {@link DATA_PANEL_MOBILE_MAX_PX} 时，无论声明 span 多少都整行（12），
 * 避免手机弹层里两列并排被挤窄。宽度未知（SSR／尚未测量）时保持声明值。
 */
export function fieldLayoutStyle(
  f: { span?: number; cols?: number; width?: string | number },
  opts?: { grid?: boolean; containerWidth?: number },
): Record<string, string> | undefined {
  const style: Record<string, string> = {};
  let sp = fieldSpan(f) ?? (opts?.grid ? 12 : undefined);
  if (
    sp != null &&
    opts?.grid &&
    opts.containerWidth != null &&
    Number.isFinite(opts.containerWidth) &&
    opts.containerWidth <= DATA_PANEL_MOBILE_MAX_PX
  ) {
    sp = 12;
  }
  if (sp != null) style.gridColumn = `span ${sp} / span ${sp}`;
  if (f.width != null && f.width !== "") {
    style.width = typeof f.width === "number"
      ? `${f.width}px`
      : String(f.width);
  }
  return Object.keys(style).length ? style : undefined;
}

/** 是否启用 12 列栅格（任一字段带 span／cols／width） */
export function useFieldGrid(
  fields: readonly { span?: number; cols?: number; width?: string | number }[],
): boolean {
  return fields.some(
    (f) =>
      f.span != null || f.cols != null || (f.width != null && f.width !== ""),
  );
}

/** 创建本地数据源 */
export function createLocalDataSource(
  opts: LocalDataSourceOptions,
): LocalDataSource {
  const key = opts.rowKey ?? "id";
  const search = opts.search ?? [];
  let store: Row[] = opts.rows.map((r) => ({ ...r }));
  let seq = store.reduce((n, r) => Math.max(n, Number(r[key]) || 0), 0);
  const changed = () => opts.onChange?.(store.map((r) => ({ ...r })));
  const idOf = (r: Row) => String(r[key]);

  const convert = (
    values: Record<string, unknown>,
  ): Record<string, unknown> => {
    const out = { ...values };
    for (const f of opts.form ?? []) {
      const key = fieldProp(f);
      if (
        f.type === "number" && out[key] !== undefined && out[key] !== ""
      ) {
        out[key] = Number(out[key]);
      }
    }
    return out;
  };

  const src: LocalDataSource = {
    sync: true,
    list(q) {
      const filters = { ...q.filters, ...(opts.fixed ?? {}) };
      let rows = filterRows(store, filters, search);
      if (q.sort) {
        const dir = q.order === "desc" ? -1 : 1;
        rows = [...rows].sort((a, b) => dir * cmp(a[q.sort], b[q.sort]));
      }
      const totals = sumColumnTotals(rows, opts.columns);
      const start = (q.page - 1) * q.pageSize;
      return {
        rows: rows.slice(start, start + q.pageSize).map((r) => ({ ...r })),
        total: rows.length,
        // 本地源仍给出全集合计，便于单独调用 list()；面板页脚会自行再算，不依赖此字段。
        totals: Object.keys(totals).length ? totals : undefined,
      };
    },
    view(id) {
      const row = store.find((r) => idOf(r) === id);
      return row ? { ...row } : null;
    },
    get(id) {
      const row = store.find((r) => idOf(r) === id);
      return row ? { ...row } : null;
    },
    getRows: () => store.map((r) => ({ ...r })),
    setRows(rows) {
      store = rows.map((r) => ({ ...r }));
    },
  };
  if (opts.writable === false) return src;

  src.create = (values): WriteResult => {
    seq += 1;
    store = [{ ...convert(values), [key]: String(seq) }, ...store];
    changed();
  };
  src.update = (id, values): WriteResult => {
    const i = store.findIndex((r) => idOf(r) === id);
    if (i < 0) return { ok: false, message: "not found" };
    store[i] = { ...store[i], ...convert(values) };
    changed();
  };
  src.remove = (ids): BulkResult => {
    const failed: { id: string; error: string }[] = [];
    let removed = 0;
    for (const id of ids) {
      const i = store.findIndex((r) => idOf(r) === id);
      if (i < 0) failed.push({ id, error: "not found" });
      else if (store[i].locked) failed.push({ id, error: "locked" });
      else {
        store.splice(i, 1);
        removed++;
      }
    }
    if (removed) changed();
    return { removed, failed };
  };
  src.setField = (ids, field, value): BulkResult => {
    const failed: { id: string; error: string }[] = [];
    let removed = 0;
    for (const id of ids) {
      const i = store.findIndex((r) => idOf(r) === id);
      if (i < 0) failed.push({ id, error: "not found" });
      else {
        store[i] = { ...store[i], [field]: value };
        removed++;
      }
    }
    if (removed) changed();
    return { removed, failed };
  };
  src.importRows = (rows) => {
    for (const r of rows) {
      seq += 1;
      store = [{ ...r, [key]: String(seq) }, ...store];
    }
    changed();
    return { created: rows.length, failed: 0 };
  };
  return src;
}

// ------------------------------------------------------------------ export

/** 导出产物 */
export interface ExportFile {
  filename: string;
  mime: string;
  data: Uint8Array | string;
}

/** `buildExportFile` 入参 */
export interface BuildExportOptions {
  format: ExportFormat;
  title: string;
  /** 文件名（不含扩展名与日期） */
  basename: string;
  columns: Column[];
  rows: Row[];
  messages: Pick<Messages, "yes" | "no" | "total">;
  totals?: Record<string, number>;
  /** 固定日期串（测试用），默认今天 YYYYMMDD */
  dateStamp?: string;
}

const csvCell = (s: string) =>
  /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;

/** 构建 xlsx / csv / json / xml / html 导出文件（仅处理传入的 rows；分页拉取由组件完成） */
export function buildExportFile(o: BuildExportOptions): ExportFile {
  const columns = o.columns.map((c): ResolvedColumn => ({
    ...c,
    prop: c.prop ?? "",
    label: colLabel(c),
  }));
  const { rows } = o;
  const heads = columns.map((c) => c.label);
  const table = rows.map((r) =>
    columns.map((c) => displayValue(c, r, o.messages))
  );
  const stamp = o.dateStamp ??
    new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const filename = `${o.basename}-${stamp}`;
  switch (o.format) {
    case "xlsx": {
      const bodyRows: XlsxCell[][] = rows.map((r, i) =>
        columns.map((c, j) => {
          const raw = r[colProp(c)];
          if (
            (c.type === "number" || c.type === "money") && raw !== null &&
            raw !== "" && raw !== undefined && Number.isFinite(Number(raw))
          ) return Number(raw);
          return neutralizeFormula(table[i][j]);
        })
      );
      const hasTotals = o.totals && Object.keys(o.totals).length > 0;
      const footer = hasTotals
        ? columns.map((c, i) =>
          i === 0 ? o.messages.total : (o.totals![c.prop] ?? "")
        )
        : undefined;
      return {
        filename: `${filename}.xlsx`,
        mime: XLSX_MIME,
        data: buildXlsx({
          name: o.title,
          headers: heads,
          rows: bodyRows,
          footer,
        }),
      };
    }
    case "csv": {
      const lines = [heads, ...table].map((r) =>
        r.map((c) => csvCell(neutralizeFormula(c))).join(",")
      );
      return {
        filename: `${filename}.csv`,
        mime: "text/csv;charset=utf-8",
        data: "\uFEFF" + lines.join("\r\n"),
      };
    }
    case "json": {
      const out = rows.map((_, i) =>
        Object.fromEntries(columns.map((c, j) => [c.prop, table[i][j]]))
      );
      return {
        filename: `${filename}.json`,
        mime: "application/json;charset=utf-8",
        data: JSON.stringify(out, null, 2),
      };
    }
    case "xml": {
      const tag = (p: string) => p.replace(/[^A-Za-z0-9_]/g, "_");
      const body = rows.map((_, i) =>
        `  <row>\n${
          columns.map((c, j) =>
            `    <${tag(c.prop)}>${xmlEscape(table[i][j])}</${tag(c.prop)}>`
          ).join("\n")
        }\n  </row>`
      ).join("\n");
      return {
        filename: `${filename}.xml`,
        mime: "application/xml;charset=utf-8",
        data:
          `<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n${body}\n</rows>\n`,
      };
    }
    default: {
      const th = heads.map((h) => `<th>${xmlEscape(h)}</th>`).join("");
      const tr = table.map((r) =>
        `<tr>${r.map((c) => `<td>${xmlEscape(c)}</td>`).join("")}</tr>`
      ).join("");
      return {
        filename: `${filename}.html`,
        mime: "text/html;charset=utf-8",
        data: `<!doctype html><html><head><meta charset="utf-8"><title>${
          xmlEscape(o.title)
        }</title><style>table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}th{background:#3c8dbc;color:#fff}</style></head><body><h3>${
          xmlEscape(o.title)
        }</h3><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></body></html>`,
      };
    }
  }
}

/** 把同 prop 列的展示配置补到详情项上（项上已写的字段优先）。 */
export function enrichViewField(
  item: ViewItem,
  columns: readonly Column[],
): ViewItem {
  const key = item.prop;
  if (!key) return item;
  const col = columns.find((c) => colProp(c) === key);
  if (!col) return item;
  return { ...col, ...item, click: item.click };
}

/** 取出 form / search / view 的 `props` 字段数组。 */
export function fieldsOf<T>(
  section: { props?: readonly T[] } | undefined,
): T[] {
  return [...(section?.props ?? [])];
}

/** `view` 里的展示字段，并按列继承缺省配置。未传 view 时返回 undefined。 */
export function resolveViewFields(
  view: ViewConfig | undefined,
  columns: readonly Column[],
): ViewItem[] | undefined {
  if (!view) return undefined;
  return assignColumnProps(
    fieldsOf(view).map((it) => enrichViewField(it, columns)),
  );
}

/** `view.actions` 按钮 Record；没有则 undefined（底部只留默认 close）。 */
export function resolveViewActionsCfg(
  view: ViewConfig | undefined,
): RowActionsConfig | undefined {
  return view?.actions;
}

/** 从 view.descriptions 上挑出可透传给 Descriptions 的参数（不含 items／title）。 */
const VIEW_DESCRIPTIONS_KEYS = [
  "column",
  "bordered",
  "size",
  "layout",
  "colon",
  "class",
  "labelClass",
  "contentClass",
  "labelColPercent",
  "labelMinWidth",
  "labelAlign",
] as const;

/**
 * 抽出写在 {@link ViewConfig.descriptions} 上的 Descriptions 参数。未写的键不出现，便于调用方保留内置缺省。
 */
export function pickViewDescriptionsProps(
  view?: ViewConfig,
): ViewDescriptionsProps {
  const src = view?.descriptions;
  if (!src) return {};
  const out: ViewDescriptionsProps = {};
  for (const key of VIEW_DESCRIPTIONS_KEYS) {
    const value = src[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

const PANEL_PAGINATION_KEYS = [
  "preset",
  "size",
  "pageSize",
  "pageSizeOptions",
  "showFirstLast",
  "showPrevNext",
  "showPageNumbers",
  "showQuickJumper",
  "showTotal",
  "disabled",
  "class",
  "testIdPrefix",
  "messages",
] as const;

/**
 * 抽出写在 DataPanel `pagination` 上的 Pagination 参数。未写的键不出现，便于保留断点缺省。
 */
export function pickPanelPaginationProps(
  cfg?: PanelPaginationConfig,
): PanelPaginationConfig {
  if (!cfg) return {};
  const out: PanelPaginationConfig = {};
  for (const key of PANEL_PAGINATION_KEYS) {
    const value = cfg[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

/**
 * 合并 `pagination` 与断点缺省。
 * `preset`／`size` 未写时走断点；`pageSize` 默认 20，`pageSizeOptions` 默认 [10, 20, 50, 100]。
 * preset／size／pageSize／pageSizeOptions 从 rest 里拿掉，避免再传给 Pagination（运行时页码和条数由面板托管）。
 */
export function resolvePanelPagination(
  cfg: PanelPaginationConfig | undefined,
  auto: { preset: PaginationPreset; size: PaginationSize },
): {
  preset: PaginationPreset;
  size: PaginationSize;
  pageSize: number;
  pageSizeOptions: number[];
  rest: Omit<
    PanelPaginationConfig,
    "preset" | "size" | "pageSize" | "pageSizeOptions"
  >;
} {
  const picked = pickPanelPaginationProps(cfg);
  const preset = picked.preset ?? auto.preset;
  const size = picked.size ?? auto.size;
  const pageSize = picked.pageSize ?? DEFAULT_DATA_PANEL_PAGE_SIZE;
  const pageSizeOptions = picked.pageSizeOptions ??
    DEFAULT_DATA_PANEL_PAGE_SIZES;
  const {
    preset: _preset,
    size: _size,
    pageSize: _pageSize,
    pageSizeOptions: _pageSizeOptions,
    ...rest
  } = picked;
  return { preset, size, pageSize, pageSizeOptions, rest };
}

/** click:"toggle"：在恰好两档 options 之间切换；否则返回 undefined。 */
export function toggleOptionValue(
  current: unknown,
  options: { value: string }[] | undefined,
): string | undefined {
  if (!options || options.length !== 2) return undefined;
  return String(current) === options[0].value
    ? options[1].value
    : options[0].value;
}

/** 不写 view 时详情回落：数据列 + 表单中尚未出现的字段（跳过 password）。 */
export function fallbackViewItems(
  columns: readonly Column[],
  form: readonly FormField[] = [],
): ViewItem[] {
  const items: ViewItem[] = [];
  const seen = new Set<string>();
  for (const c of assignColumnProps(columns)) {
    if (isSystemColumn(c)) continue;
    const prop = colProp(c);
    if (!prop) continue;
    seen.add(prop);
    items.push({
      ...c,
      prop,
      label: c.label ?? prop,
    });
  }
  for (const f of form) {
    const prop = fieldProp(f);
    if (!prop || seen.has(prop) || f.type === "password") continue;
    items.push({ prop, label: f.label ?? prop });
  }
  return items;
}

export interface ViewFooterSlot {
  key: string;
  label: string;
  disable: boolean;
  title?: string;
  tone?: ActionTone;
  href?: string;
  action?: (item: Row) => void;
  builtinClose?: boolean;
}

/**
 * 查看底部按钮：自定义键按写入序（跳过 close），close 默认显示且始终靠右最后。
 */
export function resolveViewFooterActions(
  cfg: RowActionsConfig | undefined,
  row: Row,
  closeLabel: string,
  labels?: { edit?: string },
): ViewFooterSlot[] {
  const actions = cfg ?? {};
  const slots: ViewFooterSlot[] = [];
  for (const key of Object.keys(actions)) {
    if (key === "close") continue;
    const raw = actions[key];
    if (raw === true) {
      slots.push({
        key,
        label: (key === "edit" && labels?.edit)
          ? labels.edit
          : actionDisplayText(key),
        disable: false,
      });
      continue;
    }
    if (typeof raw !== "object" || raw === null) continue;
    const res = resolveRowActionCtrl(raw, row, true);
    if (!res.show) continue;
    const display = actionDisplayText(key, res.label, res.title);
    slots.push({
      key,
      label: display === key && key === "edit" && labels?.edit
        ? labels.edit
        : display,
      disable: res.disable,
      title: res.title,
      tone: res.tone,
      href: res.href,
      action: res.action,
    });
  }
  const closeRes = resolveRowActionCtrl(actions.close, row, true);
  if (closeRes.show) {
    slots.push({
      key: "close",
      label: closeRes.label || closeRes.title || closeLabel,
      disable: closeRes.disable,
      title: closeRes.title,
      tone: closeRes.tone ?? "default",
      action: closeRes.action,
      builtinClose: true,
    });
  }
  return slots;
}

export interface FooterActionSlot<Ctx = unknown> {
  key: string;
  label: string;
  disable: boolean;
  title?: string;
  tone?: ActionTone;
  icon?: unknown;
  action?: (ctx: Ctx) => void;
  builtin?: boolean;
}

/**
 * 表单／搜索官方底部按钮：声明键按写入序；未声明的内置键追加；
 * `trailingKey`（cancel／reset）若显示则始终靠右最后。
 */
export function resolveFooterActions<Ctx>(
  cfg: Record<string, ActionCtrl<Ctx>> | undefined,
  ctx: Ctx,
  builtins: readonly { key: string; label: string; fallbackShow?: boolean }[],
  trailingKey?: string,
): FooterActionSlot<Ctx>[] {
  const actions = cfg ?? {};
  const builtinMap = new Map(builtins.map((b) => [b.key, b]));
  const declared = new Set(Object.keys(actions));
  const slots: FooterActionSlot<Ctx>[] = [];
  const push = (
    key: string,
    raw: ActionCtrl<Ctx> | undefined,
    fallback: boolean,
  ): void => {
    const res = resolveActionCtrl(raw, fallback, ctx);
    if (!res.show) return;
    const b = builtinMap.get(key);
    const display = actionDisplayText(key, res.label, res.title);
    slots.push({
      key,
      label: display === key && b
        ? (res.label || res.title || b.label)
        : display,
      disable: res.disable,
      title: res.title,
      tone: res.tone,
      icon: res.icon,
      action: res.action,
      builtin: !!b,
    });
  };
  for (const key of Object.keys(actions)) {
    if (trailingKey && key === trailingKey) continue;
    const b = builtinMap.get(key);
    push(key, actions[key], b ? (b.fallbackShow ?? true) : true);
  }
  for (const b of builtins) {
    if (trailingKey && b.key === trailingKey) continue;
    if (declared.has(b.key)) continue;
    push(b.key, undefined, b.fallbackShow ?? true);
  }
  if (trailingKey) {
    const b = builtinMap.get(trailingKey);
    if (declared.has(trailingKey)) {
      push(trailingKey, actions[trailingKey], true);
    } else {
      push(trailingKey, undefined, b?.fallbackShow ?? true);
    }
  }
  return slots;
}

/**
 * 解析 form / search / view 的弹层宽度；未配置时用 fallback（默认 md）。
 */
export function resolveModalWidth(
  width: ModalShellWidth | undefined,
  fallback: string | number = "md",
): string | number {
  if (typeof width === "function") {
    const v = width();
    return v === undefined ? fallback : v;
  }
  return width ?? fallback;
}
