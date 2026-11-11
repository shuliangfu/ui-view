/**
 * @module desktop/data-display/data-panel-chrome
 * @description DataPanel 刷新注册表、环境探测、本地偏好（@dreamer/storage/client）、工具按钮壳与面板 Tailwind 类常量。
 */

import { Button } from "../../shared/basic/Button.tsx";
import type { Tone } from "./data-panel-types.ts";
import { BrowserStorage, LocalStorageAdapter } from "@dreamer/storage/client";

// ---------------------------------------------------------------- refresh registry
export const refreshers = new Map<string, () => Promise<void>>();
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
  "box-border !h-[2.125rem] !w-[2.625rem] !p-0 leading-none !rounded-none !bg-slate-100 !border-slate-200 !text-slate-700 hover:enabled:!bg-slate-200 hover:enabled:!text-slate-900 dark:!bg-slate-900 dark:!border-slate-800 dark:!text-slate-200 dark:hover:enabled:!bg-slate-800 dark:hover:enabled:!text-white [&_[role=img]]:!h-4 [&_[role=img]]:!w-4";
export const TB_FIRST_STYLE = "!rounded-l-[5px]";
export const TB_LAST_STYLE = "!rounded-r-[5px]";
export const TB_NF_STYLE = "!border-l-0";
export const TB_NL_STYLE = "!border-r !shadow-none";

/** 行悬停：压浅色 `hover:bg-slate-50`（原 `.dark .dp-row:hover` slate-800@60%） */
export const ROW_CLS = "dp-row hover:bg-slate-50 dark:hover:!bg-slate-800/60";

/** 就地编辑可点区（原 `.dp-cell-edit`） */
export const CELL_EDIT_CLS =
  "dp-cell-edit inline-block min-w-6 cursor-text rounded px-1 hover:bg-slate-200 dark:hover:bg-slate-700";

/** Popconfirm／Popover 浮层覆盖（原 `.dp-pop`；保留标记类） */
export const POP_OVERLAY_CLS =
  "dp-pop !border-slate-200 !bg-white !text-slate-900 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:[&_[aria-hidden=true]]:!border-slate-600 dark:[&_[aria-hidden=true]]:!bg-slate-800";

/** 跳页输入壳（原 `.dp-jump`；隐藏 number spin） */
export const JUMP_CLS =
  "dp-jump w-14 shrink-0 [&_input]:rounded [&_input]:px-2 [&_input]:py-1 [&_input]:text-center [&_input]:text-sm [&_input]:leading-5 [&_input]:[appearance:textfield] [&_input::-webkit-inner-spin-button]:appearance-none [&_input::-webkit-outer-spin-button]:appearance-none";

/** 就地编辑器外层最小宽（原 `.dp-ed-wrap`） */
export const ED_WRAP_CLS = "dp-ed-wrap min-w-[9.5rem]";

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
  "max-sm:!mx-0 max-sm:!mt-0 dark:!bg-[var(--dp-panel-body-bg,#18212f)] dark:!text-[var(--dp-panel-fg,#e2e8f0)] dark:[&_th]:!text-[var(--dp-panel-fg,#f1f5f9)] dark:[&_td]:!text-[var(--dp-panel-fg,#e2e8f0)] dark:[&_.dp-cell-edit]:!text-[var(--dp-panel-fg,#e2e8f0)] dark:[&_[data-testid=dp-total-count]]:!text-[var(--dp-panel-muted,#cbd5e1)]";

/** 表格外包（原 `.dp-table-wrap`；移动端顶／左右 padding 清零） */
export const TABLE_WRAP_CLS =
  "dp-table-wrap px-2.5 py-2.5 max-sm:!px-0 max-sm:!pt-0";

/** 分页条（原 `.dp-pg`；移动端列布局居中） */
export const PG_CLS =
  "dp-pg flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm max-sm:!flex-col max-sm:!items-center max-sm:!justify-center max-sm:!text-center";

/** 分页控件组（原 `.dp-pg-ctrls`） */
export const PG_CTRLS_CLS =
  "dp-pg-ctrls flex flex-wrap items-center gap-2 max-sm:!order-1 max-sm:!justify-center";

/** 条数文案（原 `.dp-range`） */
export const RANGE_CLS =
  "dp-range max-sm:!order-2 max-sm:!w-full max-sm:!text-center dark:!text-[var(--dp-panel-muted,#cbd5e1)]";

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
