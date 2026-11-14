/**
 * @module desktop/data-display/data-panel-chrome
 * @description DataPanel 刷新注册表、环境探测、本地偏好（@dreamer/storage/client）、工具按钮壳与面板 Tailwind 类常量。
 */

import { Button } from "../../shared/basic/Button.tsx";
import type { Query, Row, Tone } from "./data-panel-types.ts";
import { BrowserStorage, LocalStorageAdapter } from "@dreamer/storage/client";

// ---------------------------------------------------------------- refresh / imperative registry
export const refreshers = new Map<string, () => Promise<void>>();

/** DataPanel 命令式句柄（按 `panelKey` 注册；与 {@link refreshDataPanel} 同一套键）。 */
export interface DataPanelHandle {
  /** 重新拉取当前页（不写地址栏；等价 refreshDataPanel） */
  reload: () => Promise<void>;
  getQuery: () => Query;
  /** 合并查询并重新拉数（会按 syncUrl 配置写地址栏） */
  setQuery: (patch: Partial<Query>) => void;
  /** 当前页已选中的行对象 */
  getSelected: () => Row[];
  /** 打开新增（无参）或编辑表单 */
  openForm: (row?: Row) => void;
  /** 打开详情；可传行对象或主键 */
  openView: (row: Row | string) => void;
}

/** DataView 命令式句柄（按 `panelKey` 注册）。 */
export interface DataViewHandle {
  reload: () => Promise<void>;
  getRecord: () => Row | null;
  /** 打开编辑表单；无参则用当前记录 */
  openForm: (row?: Row) => void;
}

export const panelHandles = new Map<string, DataPanelHandle>();
export const viewHandles = new Map<string, DataViewHandle>();

/** 重新拉取某个面板或详情当前数据（页面自己的 Modal 保存后可调用） */
export function refreshDataPanel(key: string): Promise<void> {
  return panelHandles.get(key)?.reload() ??
    viewHandles.get(key)?.reload() ??
    refreshers.get(key)?.() ??
    Promise.resolve();
}

/** 取已挂载 DataPanel 的命令式句柄；未挂载或不存在则 undefined。 */
export function getDataPanel(key: string): DataPanelHandle | undefined {
  return panelHandles.get(key);
}

/** 取已挂载 DataView 的命令式句柄；未挂载或不存在则 undefined。 */
export function getDataView(key: string): DataViewHandle | undefined {
  return viewHandles.get(key);
}

export function getDataPanelQuery(key: string): Query | undefined {
  return panelHandles.get(key)?.getQuery();
}

export function setDataPanelQuery(key: string, patch: Partial<Query>): void {
  panelHandles.get(key)?.setQuery(patch);
}

export function getDataPanelSelected(key: string): Row[] {
  return panelHandles.get(key)?.getSelected() ?? [];
}

export function openDataPanelForm(key: string, row?: Row): void {
  panelHandles.get(key)?.openForm(row);
}

export function openDataPanelView(key: string, row: Row | string): void {
  panelHandles.get(key)?.openView(row);
}

export function getDataViewRecord(key: string): Row | null | undefined {
  return viewHandles.get(key)?.getRecord();
}

export function openDataViewForm(key: string, row?: Row): void {
  viewHandles.get(key)?.openForm(row);
}

// ---------------------------------------------------------------- helpers
interface PrintWin {
  document: { write(s: string): void; close(): void };
  focus(): void;
  print(): void;
}
export const g = globalThis as unknown as {
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

/**
 * Print an HTML document. Uses `window.open` when it returns a *different*
 * document, so existing tests can stub `open`. If `open` is blocked or returns
 * the current window (seen in some CI browsers), fall back to a hidden iframe.
 * Never `document.write` into the current page — that would destroy it.
 */
export function printHtml(html: string): void {
  const currentDoc = g.document;
  const w = g.open?.("", "_blank");
  const other = w?.document;
  if (w && other && other !== currentDoc) {
    other.write(html);
    other.close();
    w.focus();
    w.print();
    return;
  }
  if (!currentDoc?.createElement || !currentDoc.body) return;
  const iframe = currentDoc.createElement("iframe") as HTMLIFrameElement;
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("data-testid", "print-frame");
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden";
  currentDoc.body.appendChild(iframe);
  const iw = iframe.contentWindow;
  const idoc = iframe.contentDocument ?? iw?.document;
  if (!iw || !idoc) {
    iframe.remove();
    return;
  }
  idoc.open();
  idoc.write(html);
  idoc.close();
  iw.focus();
  iw.print();
  const later = (globalThis as unknown as {
    setTimeout?: (fn: () => void, ms: number) => number;
  }).setTimeout;
  if (later) later(() => iframe.remove(), 1000);
  else iframe.remove();
}

/** 是否在服务端运行（Deno / Node）；浏览器里没有这两者 */
export function onServer(): boolean {
  const gg = globalThis as unknown as {
    Deno?: unknown;
    process?: { versions?: { node?: string } };
  };
  return gg.Deno !== undefined ||
    typeof gg.process?.versions?.node === "string";
}

/** DataPanel 本地偏好（列显隐 / 行高 / 全屏）；按 panelKey 隔离 */
export interface Prefs {
  hidden?: Record<string, boolean>;
  density?: "compact" | "comfortable" | "loose";
  fullscreen?: boolean;
}

function prefsKey(panelKey: string): string {
  return `dp-prefs-${panelKey}`;
}
function legacyColsKey(panelKey: string): string {
  return `dp-cols-${panelKey}`;
}

let dpBrowserStorage: BrowserStorage | null = null;

/** 浏览器端单例；SSR／无 localStorage 时返回 null */
function getDpBrowserStorage(): BrowserStorage | null {
  if (onServer()) return null;
  try {
    if (typeof globalThis.localStorage === "undefined") return null;
  } catch {
    return null;
  }
  if (!dpBrowserStorage) {
    dpBrowserStorage = new BrowserStorage({ adapter: "localStorage" });
  }
  return dpBrowserStorage;
}

function isPrefsShape(v: unknown): v is Prefs {
  if (!v || typeof v !== "object") return false;
  const o = v as Prefs;
  return o.hidden !== undefined || o.density !== undefined ||
    o.fullscreen !== undefined;
}

/** 读偏好（仅 `@dreamer/storage/client` BrowserStorage）；兼容旧 `dp-cols-*` 与曾直写的 prefs JSON */
export async function readDataPanelPrefs(
  panelKey: string,
): Promise<Prefs> {
  const store = getDpBrowserStorage();
  if (!store) return {};
  try {
    const v = await store.get<Prefs>(prefsKey(panelKey));
    if (isPrefsShape(v)) return v;

    // 兼容：本机曾用 raw localStorage JSON 写入的 prefs（无 BrowserStorage 信封）
    const adapter = new LocalStorageAdapter();
    const raw = adapter.get(prefsKey(panelKey));
    if (isPrefsShape(raw)) {
      await store.set(prefsKey(panelKey), raw);
      return raw;
    }
    // 兼容更旧：仅列显隐 `dp-cols-*`
    const legacy = adapter.get(legacyColsKey(panelKey));
    if (legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
      const prefs: Prefs = {
        hidden: legacy as Record<string, boolean>,
      };
      await store.set(prefsKey(panelKey), prefs);
      return prefs;
    }
  } catch { /* ignore */ }
  return {};
}

/** 浅合并写回（仅 `@dreamer/storage/client` BrowserStorage.set） */
export async function writeDataPanelPrefs(
  panelKey: string,
  patch: Prefs,
): Promise<void> {
  const store = getDpBrowserStorage();
  if (!store) return;
  try {
    const cur = await readDataPanelPrefs(panelKey);
    const next: Prefs = { ...cur, ...patch };
    await store.set(prefsKey(panelKey), next);
  } catch { /* ignore */ }
}

/**
 * Button 不转发 `data-testid` / `aria-label`：给外层 span 打标，既有稳定的 E2E 选择器，也有可访问名称。
 * 不用 HTML `title`（避免与外层 Tooltip 双提示）；可访问名用 aria-label。
 */
// deno-lint-ignore no-explicit-any
export function Btn(props: any) {
  const { "data-testid": testid, "aria-label": label, ...rest } = props;
  return (
    <span class="inline-flex" data-testid={testid} aria-label={label}>
      <Button {...rest} />
    </span>
  );
}

/** 布尔属性：仅为 true 时输出（`checked={false}` 在 SSR 会被序列化成 checked="false"） */
export const bool = (k: string, v: unknown): Record<string, true> =>
  v ? { [k]: true } : {};

/** 列偏好里系统列键（与业务 prop 隔离） */
export const COL_SELECT = "__select";
export const COL_INDEX = "__index";
export const COL_ACTIONS = "__actions";

/** 标签配色：浅色 + dark: 半透明底／亮字（原 `.dark .dp-tag-*`） */
export const TONE: Record<Tone, string> = {
  success:
    "dp-tag dp-tag-success bg-emerald-100 text-emerald-700 dark:!bg-emerald-500/15 dark:!text-emerald-300",
  warning:
    "dp-tag dp-tag-warning bg-amber-100 text-amber-700 dark:!bg-amber-500/15 dark:!text-amber-300",
  danger:
    "dp-tag dp-tag-danger bg-red-100 text-red-700 dark:!bg-red-500/15 dark:!text-red-300",
  info:
    "dp-tag dp-tag-info bg-sky-100 text-sky-700 dark:!bg-sky-400/15 dark:!text-sky-300",
  default:
    "dp-tag dp-tag-default bg-slate-100 text-slate-600 dark:!bg-slate-400/15 dark:!text-slate-300",
};

/** 开关滑动动画时长（Switch 的 0.2s 过渡，略长一点保证播完再重渲染） */
export const SWITCH_ANIM_MS = 230;

/**
 * 操作列图标按钮：无边框／无底色，仅图标色变化（原 `.dp-act`）。
 * 保留 `dp-act` 标记类供测／选择器；视觉全走 Tailwind（含 `!` 压 Button 默认）。
 */
export const ICON_BTN =
  "dp-act inline-flex items-center justify-center !bg-transparent !border-0 !shadow-none !p-0.5 !min-w-0 rounded !text-slate-500 leading-none cursor-pointer transition-colors duration-150 hover:!bg-transparent hover:!border-0 hover:!text-blue-600 disabled:opacity-40 disabled:!text-slate-400 disabled:!cursor-not-allowed dark:!text-slate-400 dark:hover:!text-blue-400 dark:disabled:!text-slate-500 [&_[role=img]]:!h-4 [&_[role=img]]:!w-4";

/** 操作列 tone 悬停色（拼在 ICON_BTN 后；danger 另带 `dp-act-del` 标记） */
export const ACT_TONE_HOVER: Record<string, string> = {
  danger: "hover:!text-red-600 dark:hover:!text-red-400",
  primary: "hover:!text-blue-700 dark:hover:!text-blue-300",
  secondary: "hover:!text-slate-600 dark:hover:!text-slate-300",
  success: "hover:!text-green-600 dark:hover:!text-green-400",
  warning: "hover:!text-amber-600 dark:hover:!text-amber-400",
  ghost: "hover:!text-slate-700 dark:hover:!text-slate-200",
  default: "hover:!text-blue-600 dark:hover:!text-blue-400",
};

/**
 * 工具栏按钮壳（原 `.dp-tb` + first/last/nf/nl）。
 * 标记类 `dp-tb*` 仍保留（SSR／测）；尺寸／色／圆角拼接用 Tailwind `!`。
 */
/** 工具栏按钮 Tailwind 壳（不含位置标记类） */
export const TB_STYLE =
  "box-border !h-[2.125rem] !w-[2.625rem] !p-0 leading-none !rounded-none !bg-white !border-slate-200 !text-slate-700 hover:enabled:!bg-slate-200 hover:enabled:!text-slate-900 dark:!bg-slate-900 dark:!border-slate-800 dark:!text-slate-200 dark:hover:enabled:!bg-slate-800 dark:hover:enabled:!text-white [&_[role=img]]:!h-4 [&_[role=img]]:!w-4";
export const TB_FIRST_STYLE = "!rounded-l-[5px]";
export const TB_LAST_STYLE = "!rounded-r-[5px]";
export const TB_NF_STYLE = "!border-l-0";
export const TB_NL_STYLE = "!border-r !shadow-none";

/** 行悬停：浅色 `hover:bg-slate-100`（原 `.dark .dp-row:hover` slate-800@60%） */
export const ROW_CLS = "dp-row hover:bg-slate-100 dark:hover:!bg-slate-800/60";

/** 就地编辑可点区（原 `.dp-cell-edit`） */
export const CELL_EDIT_CLS =
  "dp-cell-edit inline-block min-w-6 cursor-text rounded px-1 hover:bg-slate-200 dark:hover:bg-slate-700";

/** Popconfirm／Popover 浮层覆盖（原 `.dp-pop`；保留标记类） */
export const POP_OVERLAY_CLS =
  "dp-pop !border-slate-200 !bg-white !text-slate-900 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:[&_[aria-hidden=true]]:!border-slate-600 dark:[&_[aria-hidden=true]]:!bg-slate-800";

/** 跳页输入壳（原 `.dp-jump`；隐藏 number spin） */
export const JUMP_CLS =
  "dp-jump w-14 shrink-0 [&_input]:rounded [&_input]:px-2 [&_input]:py-1 [&_input]:text-center [&_input]:text-sm [&_input]:leading-5 [&_input]:[appearance:textfield] [&_input::-webkit-inner-spin-button]:appearance-none [&_input::-webkit-outer-spin-button]:appearance-none";

/**
 * 就地编辑输入区按草稿估算的内容宽度（ch，不含左右 padding / 步进钮）。
 * 数字至少 3 位，避免 2 位排序值把数字或 +/- 裁切；并设上限以免异常长值撑破表格。
 *
 * @param draft - 当前草稿字符串（数字、日期等已格式化后的文本）
 * @param kind - `column.inline` 类型：number / date / datetime / textarea / 其它文本或选择
 */
export function inlineEditorContentCh(draft: string, kind: string): number {
  const len = Array.from(draft ?? "").length;
  if (kind === "number") return Math.min(12, Math.max(3, len));
  if (kind === "date") return Math.min(12, Math.max(10, len));
  if (kind === "datetime") return Math.min(20, Math.max(16, len));
  if (kind === "textarea") return Math.min(32, Math.max(12, len));
  return Math.min(24, Math.max(6, len));
}

/**
 * 就地编辑内层 `<input>` / `<textarea>` 的 CSS 宽度。
 * `calc(Nch + 1.5rem)`：N 为内容 ch，1.5rem 对应 sm 控件 `px-3` 水平内边距
 * （Tailwind preflight 为 `box-sizing: border-box`）。
 *
 * @param draft - 当前草稿字符串
 * @param kind - 同 {@link inlineEditorContentCh}
 */
export function inlineEditorInputCssWidth(draft: string, kind: string): string {
  return `calc(${inlineEditorContentCh(draft, kind)}ch + 1.5rem)`;
}

/**
 * 挂到编辑器根节点的样式：用 CSS 变量驱动内层 input 宽度，并随草稿 signal 更新。
 *
 * @param draft - 当前草稿字符串
 * @param kind - 同 {@link inlineEditorContentCh}
 */
export function inlineEditorInputWidthStyle(
  draft: string,
  kind: string,
): Record<string, string> {
  return { "--dp-ed-input-w": inlineEditorInputCssWidth(draft, kind) };
}

/**
 * 就地编辑器外层：宽度随控件 / 内容收缩（不再使用固定 `min-width: 9.5rem`，
 * 避免「排序」等 2～3 位数字步进框比列宽一截）。
 * 输入框宽度由 `--dp-ed-input-w`（{@link inlineEditorInputCssWidth}）驱动；
 * 支持 `field-sizing: content` 的浏览器改由内容精确撑开，变量仍作最小宽，
 * 避免空值过窄、数字被裁切或步进钮被挤没。
 */
export const ED_WRAP_CLS = "dp-ed-wrap inline-block w-fit " +
  "[&_input:not([type=hidden])]:box-border " +
  "[&_input:not([type=hidden])]:[field-sizing:content] " +
  "[&_input:not([type=hidden])]:!w-[length:var(--dp-ed-input-w,calc(3ch+1.5rem))] " +
  "[&_input:not([type=hidden])]:!min-w-[length:var(--dp-ed-input-w,calc(3ch+1.5rem))] " +
  "[&_input:not([type=hidden])]:!flex-none " +
  "[&_input:not([type=hidden])]:!shrink-0 " +
  "supports-[field-sizing:content]:[&_input:not([type=hidden])]:!w-auto " +
  "[&_textarea]:box-border [&_textarea]:[field-sizing:content] " +
  "[&_textarea]:!w-[length:var(--dp-ed-input-w,calc(12ch+1.5rem))] " +
  "[&_textarea]:!min-w-[length:var(--dp-ed-input-w,calc(12ch+1.5rem))] " +
  "supports-[field-sizing:content]:[&_textarea]:!w-auto " +
  "[&>span]:!inline-flex [&>span]:!w-fit [&>span]:!max-w-none " +
  "[&>div]:!w-fit [&>div]:!max-w-none " +
  "[&_span.relative]:!inline-flex [&_span.relative]:!w-fit [&_span.relative]:!min-w-0 " +
  "[&_button[aria-haspopup]]:!box-border [&_button[aria-haspopup]]:!w-auto " +
  "[&_button[aria-haspopup]]:!whitespace-nowrap";

/** 底栏 pageSize Select 壳（原 `.dp-pgsize`） */
export const PGSIZE_WRAP_CLS = "dp-pgsize w-fit min-w-0 max-w-none shrink-0";

/** pageSize Select 上的子选择器压 Button／listbox（原 `.dp-pgsize …`） */
export const PGSIZE_SELECT_CLS =
  "inline-flex w-fit shrink-0 align-middle whitespace-nowrap [&_span.relative]:!inline-flex [&_span.relative]:!w-fit [&_span.relative]:!min-w-0 [&_span.relative]:!max-w-none [&_button[aria-haspopup]]:!box-border [&_button[aria-haspopup]]:!w-auto [&_button[aria-haspopup]]:!gap-1 [&_button[aria-haspopup]]:!rounded [&_button[aria-haspopup]]:!px-2 [&_button[aria-haspopup]]:!py-1 [&_button[aria-haspopup]]:!text-sm [&_button[aria-haspopup]]:!leading-5 [&_button[aria-haspopup]]:!whitespace-nowrap [&_[role=listbox]]:!bottom-full [&_[role=listbox]]:!left-0 [&_[role=listbox]]:!right-auto [&_[role=listbox]]:!top-auto [&_[role=listbox]]:!mt-0 [&_[role=listbox]]:!mb-1 [&_[role=listbox]]:!flex [&_[role=listbox]]:!w-max [&_[role=listbox]]:!min-w-full [&_[role=listbox]]:!flex-col [&_[role=option]]:!block [&_[role=option]]:!w-full [&_[role=option]]:whitespace-nowrap";

/** 操作列图标组（原 `.dp-acts`） */
export const ACTS_CLS =
  "dp-acts inline-flex items-center justify-center gap-px";

/**
 * 面板卡片（原 `.dp-card` + 深色变量正文色）。
 * 移动端 max-sm 上／左／右贴边（原 @media）。
 */
export const CARD_STYLE =
  "max-sm:!mx-0 max-sm:!mt-0 bg-slate-50 dark:!bg-[var(--dp-panel-body-bg,rgb(30_41_59/0.8))] dark:!text-[var(--dp-panel-fg,#e2e8f0)] dark:[&_th]:!text-[var(--dp-panel-fg,#f1f5f9)] dark:[&_td]:!text-[var(--dp-panel-fg,#e2e8f0)] dark:[&_.dp-cell-edit]:!text-[var(--dp-panel-fg,#e2e8f0)] dark:[&_[data-testid=dp-total-count]]:!text-[var(--dp-panel-muted,#cbd5e1)]";

/** 页面提示条外包：左右与上下内边距与表格外包一致（!px-2.5 !py-2.5）。 */
export const ALERT_WRAP_CLS = "dp-alert-wrap !px-2.5 !py-2.5";

/** 表格外包（原 `.dp-table-wrap`）。内边距始终保留，含移动端。 */
export const TABLE_WRAP_CLS =
  "dp-table-wrap bg-white !px-2.5 !py-2.5 dark:bg-transparent";

/** 提示条可见时去掉表格外包上内边距，避免与提示条下内边距叠成双倍间距。 */
export const TABLE_WRAP_BELOW_ALERT_CLS =
  "dp-table-wrap bg-white !px-2.5 !pb-2.5 !pt-0 dark:bg-transparent";

/**
 * DataPanel／DataView 工具栏底色：比标题浅、比原先工具栏深的中间值。
 * 浅色：标题 `bg-slate-200/80` 与原工具栏 `bg-slate-100/80` 的中间色；
 * 深色：标题 `bg-slate-900`（约 rgb(14,22,44)）与原透明底透出的面板色
 * （约 rgb(24,33,53)）的中间色 rgb(19,28,49)。
 */
export const TOOLBAR_BAR_CLS =
  "flex w-full flex-wrap items-center justify-end gap-2 border-y border-slate-300 bg-[rgb(240_243_248)] px-3 py-2 dark:border-slate-600/40 dark:bg-[rgb(19_28_49)]";

/**
 * DataPanel／DataView 标题栏：取消 Card 自带底边，改由工具栏用相同的
 * `border-y` 画出上下两条同样淡的分隔线（浅色 slate-300，深色 slate-600/40）。
 * 浅色不用 slate-200：它和标题 rgb(230,235,243)、工具栏 rgb(240,243,248) 太近，几乎看不见。
 */
export const HEADER_BAR_CLS = "!border-b-0 bg-slate-200/80 dark:bg-slate-900";

/** 分页条（原 `.dp-pg`；条数在左、控件在右，各端同一行） */
export const PG_CLS =
  "dp-pg flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-100/80 px-3 py-3 text-sm dark:border-slate-700 dark:bg-transparent";

/** 分页控件组（原 `.dp-pg-ctrls`） */
export const PG_CTRLS_CLS = "dp-pg-ctrls flex flex-wrap items-center gap-2";

/** 条数文案（原 `.dp-range`） */
export const RANGE_CLS = "dp-range dark:!text-[var(--dp-panel-muted,#cbd5e1)]";

/** 全屏壳（原 `.dp-fs`） */
export const FS_CLS =
  "dp-fs !fixed !inset-0 !z-[9999] !m-0 !box-border !h-screen !max-h-screen !w-screen !max-w-screen !overflow-auto !rounded-none !bg-white !p-3 dark:!bg-slate-900 dark:!text-[var(--dp-panel-fg,#e2e8f0)] [&_.dp-card]:!min-h-[calc(100vh-1.5rem)] [&_.dp-card]:!rounded-none";

/** 行高：compact／comfortable／loose（原 `.dp-den-*`） */
export function densityTableCls(
  density: "compact" | "comfortable" | "loose",
): string {
  const base = `relative overflow-x-auto dp-den-${density}`;
  if (density === "compact") return `${base} [&_td]:!py-1 [&_th]:!py-1`;
  if (density === "loose") return `${base} [&_td]:!py-3.5 [&_th]:!py-3.5`;
  return base;
}

/**
 * @deprecated 样式已迁 Tailwind（见本文件 `TONE`／`ICON_BTN`／`CARD_STYLE` 等）。
 * 保留空串导出以免破坏旧 import；DataPanel 不再注入 `<style>`。
 */
export const DATA_PANEL_CSS = "";

// ---------------------------------------------------------------- component
