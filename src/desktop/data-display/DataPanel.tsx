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

import {
  bool,
  Btn,
  COL_INDEX,
  COL_SELECT,
  DATA_PANEL_CSS,
  g,
  ICON_BTN,
  onServer,
  refreshers,
  SWITCH_ANIM_MS,
  TONE,
} from "./data-panel-chrome.tsx";

export { DATA_PANEL_CSS, refreshDataPanel } from "./data-panel-chrome.tsx";

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
  /** 多选列：仅当面板本身可多选，且列设置未隐藏 */
  const showSelectCol = () => selectable && !hidden.value[COL_SELECT];
  /** 序号列：列设置未隐藏时显示（默认显示） */
  const showIndexCol = () => !hidden.value[COL_INDEX];
  /** 重置列：回到列定义里的 default hidden，系统列（多选/序号）恢复显示 */
  const defaultHidden = (): Record<string, boolean> =>
    Object.fromEntries(
      columns.filter((c) => c.hidden).map((c) => [c.prop, true]),
    );

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
  /** 多选字段的数组镜像（供 ui-view MultiSelect 绑定；与 fields 的逗号串保持同步） */
  const mfields: Record<string, ReturnType<typeof createSignal<string[]>>> = {};
  for (const f of formDefs) mfields[f.name] = createSignal<string[]>([]);

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
        v = f.type === "date" ? s.slice(0, 10) : s.slice(0, 16);
      } else if (f.type === "switch") {
        v = f.onOff ? String(raw) : (raw ? "true" : "false");
      } else if (Array.isArray(raw)) v = raw.join(",");
      else v = String(raw);
      if (f.type === "password") v = "";
      fields[f.name].value = v;
      mfields[f.name].value = v.split(",").filter(Boolean);
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
      else if (f.type === "datetime") body[f.name] = v.replace(" ", "T");
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
      {selectable && (
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...bool("checked", !hidden.value[COL_SELECT])}
            data-testid="dp-col-__select"
            onChange={() => toggleHiddenProp(COL_SELECT)}
          />
          {m.colSelect}
        </label>
      )}
      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          {...bool("checked", !hidden.value[COL_INDEX])}
          data-testid="dp-col-__index"
          onChange={() => toggleHiddenProp(COL_INDEX)}
        />
        {m.colIndex}
      </label>
      {columns.map((c) => (
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...bool("checked", !hidden.value[c.prop])}
            data-testid={`dp-col-${c.prop}`}
            onChange={() => toggleHiddenProp(c.prop)}
          />
          {c.label}
        </label>
      ))}
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
              overlay={columnMenu}
              placement="bottomRight"
              trigger="click"
              closeOnOverlayClick={false}
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
  function resetSearch(): void {
    for (const sdef of searchDefs) {
      sfields[sdef.name].value = "";
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
                <div class="w-full" data-testid={`dp-f-${sdef.name}`}>
                  <Select
                    name={sdef.name}
                    size="sm"
                    value={sig}
                    placeholder={m.all}
                    options={(sdef.options ?? []).map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                  />
                </div>
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
        <Btn type="submit" variant="primary" data-testid="dp-search-submit">
          {m.searchSubmit}
        </Btn>
        <Btn type="button" data-testid="dp-search-reset" onClick={resetSearch}>
          {m.reset}
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
                () => void setField(row, c.prop, next ? on.value : off.value),
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

  /**
   * 单元格编辑器：全部使用 ui-view 自带表单组件（Input / InputNumber / Select / MultiSelect /
   * DatePicker / DateTimePicker / Textarea）。
   * 失焦 / 点击外部 / Enter 保存，Esc 取消；浮层（下拉、日历）打开期间不会误触发保存，
   * 浮层关闭后焦点离开编辑器才保存。保存失败由 setField 提示并回滚到原值。
   */
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
      void setField(row, c.prop, value);
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
        class="dp-ed-wrap"
        tabIndex={-1}
        ref={setup}
        data-testid={testid}
        data-editor={kind}
      >
        {control}
      </div>
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
              {showSelectCol() && (
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
              {showIndexCol() && (
                <th
                  class="w-12 border border-slate-200 px-2 py-2 text-center dark:border-slate-700"
                  data-testid="dp-colhead-index"
                >
                  #
                </th>
              )}
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
                    colSpan={cols.length + (showIndexCol() ? 1 : 0) +
                      (showSelectCol() ? 1 : 0) + (acts ? 1 : 0)}
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
                  {showSelectCol() && (
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
                  {showIndexCol() && (
                    <td class="border border-slate-200 px-2 py-1.5 text-center text-slate-500 dark:border-slate-700">
                      {offset() + i + 1}
                    </td>
                  )}
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
                {showSelectCol() && (
                  <td class="border border-slate-200 dark:border-slate-700" />
                )}
                {showIndexCol() && (
                  <td class="border border-slate-200 px-2 py-2 text-center dark:border-slate-700">
                    {m.total}
                  </td>
                )}
                {cols.map((c, ci) => (
                  <td
                    class="border border-slate-200 px-3 py-2 dark:border-slate-700"
                    data-testid={`dp-total-${c.prop}`}
                  >
                    {(() => {
                      const val = c.total
                        ? (c.type === "money"
                          ? formatMoney(t[c.prop])
                          : String(t[c.prop] ?? 0))
                        : "";
                      if (!showIndexCol() && ci === 0 && !val) return m.total;
                      if (!showIndexCol() && ci === 0 && val) {
                        return `${m.total} ${val}`;
                      }
                      return val;
                    })()}
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
          <div class="dp-pgsize" data-testid="dp-pagesize">
            <Select
              size="xs"
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
            <div class="dp-jump" data-testid="dp-jump">
              <Input
                size="sm"
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
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
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
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
                <MultiSelect
                  size="sm"
                  value={mfields[f.name]}
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
              <span data-testid={`dp-fld-${f.name}`}>
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
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
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
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
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
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
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
              <div class="w-full" data-testid={`dp-fld-${f.name}`}>
                <Input
                  type={type === "password" ? "password" : "text"}
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
