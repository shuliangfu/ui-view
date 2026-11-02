/**
 * DataPanel 纯逻辑工具（无 DOM 依赖，可在测试里直接调用）：
 * 单元格展示、CSV 解析、分页页码、查询序列化、本地数据源、导出文件构建。
 */
import { formatMessage } from "./data-panel-messages.ts";
import type {
  DataPanelBulkResult,
  DataPanelColumn,
  DataPanelDataSource,
  DataPanelExportFormat,
  DataPanelFormField,
  DataPanelListResult,
  DataPanelMessages,
  DataPanelQuery,
  DataPanelRow,
  DataPanelSearchField,
  DataPanelWriteResult,
} from "./data-panel-types.ts";
import {
  buildXlsx,
  neutralizeFormula,
  XLSX_MIME,
  type XlsxCell,
  xmlEscape,
} from "./data-panel-xlsx.ts";

const p2 = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD HH:mm:ss"（运行环境本地时区）；空 / 无效返回原值或 "" */
export function formatDateTime(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${
    p2(d.getHours())
  }:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
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

/** 单元格的纯文本展示值（tag 用选项文案、日期格式化、布尔本地化等），导出 / 打印 / 详情共用 */
export function displayValue(
  col: DataPanelColumn,
  row: DataPanelRow,
  m: Pick<DataPanelMessages, "yes" | "no">,
): string {
  const raw = row[col.prop];
  switch (col.type) {
    case "tag": {
      const o = col.options?.find((x) => x.value === String(raw));
      return o ? o.label : (raw == null ? "" : String(raw));
    }
    case "bool":
      return raw ? m.yes : m.no;
    case "datetime":
      return formatDateTime(raw);
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

/** 查询 → URLSearchParams（`forUrl` 时省略默认值，用于地址栏同步） */
export function queryToParams(
  q: DataPanelQuery,
  opts: {
    forUrl: boolean;
    defaultPageSize?: number;
    defaultSort?: { prop: string; order: "asc" | "desc" };
    fixed?: Record<string, string>;
  },
): URLSearchParams {
  const p = new URLSearchParams();
  if (q.page > 1) p.set("page", String(q.page));
  if (!opts.forUrl || q.pageSize !== (opts.defaultPageSize ?? 10)) {
    p.set("pageSize", String(q.pageSize));
  }
  const ds = opts.defaultSort;
  const isDefault = (!q.sort && !ds) ||
    (ds && q.sort === ds.prop && (q.order === 1 ? "asc" : "desc") === ds.order);
  if (q.sort && (!opts.forUrl || !isDefault)) {
    p.set("sort", q.sort);
    p.set("order", q.order === -1 ? "desc" : "asc");
  }
  for (const [k, v] of Object.entries(q.filters)) {
    if (v !== "" && !(opts.fixed && k in opts.fixed)) p.set(k, v);
  }
  if (!opts.forUrl && opts.fixed) {
    for (const [k, v] of Object.entries(opts.fixed)) p.set(k, v);
  }
  return p;
}

// ------------------------------------------------------------------ local data source

/** `createLocalDataSource` 选项 */
export interface LocalDataSourceOptions {
  /** 初始数据（会被拷贝；后续增删改在内部副本上进行） */
  rows: DataPanelRow[];
  columns: DataPanelColumn[];
  search?: DataPanelSearchField[];
  form?: DataPanelFormField[];
  /** 主键字段，默认 id */
  rowKey?: string;
  /** 固定过滤（总是并入 filters） */
  fixed?: Record<string, string>;
  /** 数据变化回调（新增 / 编辑 / 删除 / 批量 / 导入之后） */
  onChange?: (rows: DataPanelRow[]) => void;
  /** 为 false 时不提供 create/update/remove/setField/importRows（只读） */
  writable?: boolean;
}

/** 本地数据源：在内存数组上完成过滤、排序、分页、合计与增删改，同步返回 */
export interface LocalDataSource extends DataPanelDataSource {
  sync: true;
  list(query: DataPanelQuery): DataPanelListResult;
  /** 当前全部行（副本） */
  getRows(): DataPanelRow[];
  /** 整体替换数据 */
  setRows(rows: DataPanelRow[]): void;
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

/** 本地过滤：按搜索项逐个匹配 */
export function filterRows(
  rows: DataPanelRow[],
  filters: Record<string, string>,
  search: DataPanelSearchField[],
): DataPanelRow[] {
  const entries = Object.entries(filters).filter(([, v]) => v !== "");
  if (!entries.length) return rows;
  return rows.filter((row) =>
    entries.every(([name, val]) => {
      const def = search.find((s) => s.name === name);
      const field = def?.field ?? name;
      const raw = row[field];
      const text = raw == null ? "" : String(raw);
      const match = def?.match ??
        (def?.type === "select"
          ? "eq"
          : def?.type === "date"
          ? "eq"
          : "contains");
      switch (match) {
        case "eq":
          if (def?.type === "date") {
            return text.slice(0, 10) === val.slice(0, 10);
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

/** 校验表单值（必填 / min / max / pattern），返回字段 → 错误文案 */
export function validateForm(
  form: DataPanelFormField[],
  values: Record<string, unknown>,
  isEdit: boolean,
  m: Pick<DataPanelMessages, "required" | "min" | "max" | "patternMismatch">,
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of form) {
    if (f.createOnly && isEdit) continue;
    if (f.editOnly && !isEdit) continue;
    const v = values[f.name];
    const empty = v === undefined || v === null || v === "" ||
      (Array.isArray(v) && v.length === 0);
    if (empty) {
      // 编辑时密码留空表示不修改
      if (f.required && !(f.type === "password" && isEdit)) {
        errs[f.name] = m.required;
      }
      continue;
    }
    if (f.type === "number") {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        errs[f.name] = m.patternMismatch;
        continue;
      }
      if (f.min !== undefined && n < f.min) {
        errs[f.name] = formatMessage(m.min, { n: f.min });
      } else if (f.max !== undefined && n > f.max) {
        errs[f.name] = formatMessage(m.max, { n: f.max });
      }
    } else if (f.pattern && typeof v === "string") {
      try {
        if (!new RegExp(f.pattern).test(v)) errs[f.name] = m.patternMismatch;
      } catch { /* 非法正则忽略 */ }
    }
  }
  return errs;
}

/** 创建本地数据源 */
export function createLocalDataSource(
  opts: LocalDataSourceOptions,
): LocalDataSource {
  const key = opts.rowKey ?? "id";
  const search = opts.search ?? [];
  let store: DataPanelRow[] = opts.rows.map((r) => ({ ...r }));
  let seq = store.reduce((n, r) => Math.max(n, Number(r[key]) || 0), 0);
  const changed = () => opts.onChange?.(store.map((r) => ({ ...r })));
  const idOf = (r: DataPanelRow) => String(r[key]);

  const convert = (
    values: Record<string, unknown>,
  ): Record<string, unknown> => {
    const out = { ...values };
    for (const f of opts.form ?? []) {
      if (
        f.type === "number" && out[f.name] !== undefined && out[f.name] !== ""
      ) {
        out[f.name] = Number(out[f.name]);
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
        const dir = q.order === -1 ? -1 : 1;
        rows = [...rows].sort((a, b) => dir * cmp(a[q.sort], b[q.sort]));
      }
      const totals: Record<string, number> = {};
      for (const c of opts.columns) {
        if (c.total) {
          totals[c.prop] = rows.reduce(
            (s, r) => s + (Number(r[c.prop]) || 0),
            0,
          );
        }
      }
      const start = (q.page - 1) * q.pageSize;
      return {
        rows: rows.slice(start, start + q.pageSize).map((r) => ({ ...r })),
        total: rows.length,
        totals: Object.keys(totals).length ? totals : undefined,
      };
    },
    getRows: () => store.map((r) => ({ ...r })),
    setRows(rows) {
      store = rows.map((r) => ({ ...r }));
    },
  };
  if (opts.writable === false) return src;

  src.create = (values): DataPanelWriteResult => {
    seq += 1;
    store = [{ ...convert(values), [key]: String(seq) }, ...store];
    changed();
  };
  src.update = (id, values): DataPanelWriteResult => {
    const i = store.findIndex((r) => idOf(r) === id);
    if (i < 0) return { ok: false, message: "not found" };
    store[i] = { ...store[i], ...convert(values) };
    changed();
  };
  src.remove = (ids): DataPanelBulkResult => {
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
  src.setField = (ids, field, value): DataPanelBulkResult => {
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
export interface DataPanelExportFile {
  filename: string;
  mime: string;
  data: Uint8Array | string;
}

/** `buildExportFile` 入参 */
export interface BuildExportOptions {
  format: DataPanelExportFormat;
  title: string;
  /** 文件名（不含扩展名与日期） */
  basename: string;
  columns: DataPanelColumn[];
  rows: DataPanelRow[];
  messages: Pick<DataPanelMessages, "yes" | "no" | "total">;
  totals?: Record<string, number>;
  /** 固定日期串（测试用），默认今天 YYYYMMDD */
  dateStamp?: string;
}

const csvCell = (s: string) =>
  /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;

/** 构建 xlsx / csv / json / xml / html 导出文件（仅处理传入的 rows；分页拉取由组件完成） */
export function buildExportFile(o: BuildExportOptions): DataPanelExportFile {
  const { columns, rows } = o;
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
          const raw = r[c.prop];
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
