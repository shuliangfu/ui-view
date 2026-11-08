/**
 * @module desktop/data-display/data-panel-chrome
 * @description DataPanel 刷新注册表、环境探测、本地偏好（@dreamer/storage/client）、工具按钮壳与面板 CSS。
 */

import { Button } from "../../shared/basic/Button.tsx";
import type { DataPanelTone } from "./data-panel-types.ts";
import {
  BrowserStorage,
  LocalStorageAdapter,
} from "@dreamer/storage/client";

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
export interface DataPanelPrefs {
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

function isPrefsShape(v: unknown): v is DataPanelPrefs {
  if (!v || typeof v !== "object") return false;
  const o = v as DataPanelPrefs;
  return o.hidden !== undefined || o.density !== undefined ||
    o.fullscreen !== undefined;
}

/** 读偏好（仅 `@dreamer/storage/client` BrowserStorage）；兼容旧 `dp-cols-*` 与曾直写的 prefs JSON */
export async function readDataPanelPrefs(
  panelKey: string,
): Promise<DataPanelPrefs> {
  const store = getDpBrowserStorage();
  if (!store) return {};
  try {
    const v = await store.get<DataPanelPrefs>(prefsKey(panelKey));
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
      const prefs: DataPanelPrefs = {
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
  patch: DataPanelPrefs,
): Promise<void> {
  const store = getDpBrowserStorage();
  if (!store) return;
  try {
    const cur = await readDataPanelPrefs(panelKey);
    const next: DataPanelPrefs = { ...cur, ...patch };
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

/** 标签配色：浅色沿用 Tailwind 类；深色由 DATA_PANEL_CSS 的 `.dark .dp-tag-*` 覆盖（半透明底 + 亮字） */
export const TONE: Record<DataPanelTone, string> = {
  success: "dp-tag dp-tag-success bg-emerald-100 text-emerald-700",
  warning: "dp-tag dp-tag-warning bg-amber-100 text-amber-700",
  danger: "dp-tag dp-tag-danger bg-red-100 text-red-700",
  info: "dp-tag dp-tag-info bg-sky-100 text-sky-700",
  default: "dp-tag dp-tag-default bg-slate-100 text-slate-600",
};

/** 开关滑动动画时长（Switch 的 0.2s 过渡，略长一点保证播完再重渲染） */
export const SWITCH_ANIM_MS = 230;

/** 操作列图标按钮：样式见 DATA_PANEL_CSS 的 .dp-act*（无边框 / 无底色，仅图标色变化） */
export const ICON_BTN = "dp-act";

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
.dark .dp-tag-danger { background-color: rgba(239, 68, 68, 0.15) !important; color: #fca5a5 !important; }
.dark .dp-tag-success { background-color: rgba(34, 197, 94, 0.15) !important; color: #86efac !important; }
.dark .dp-tag-warning { background-color: rgba(234, 179, 8, 0.15) !important; color: #fde047 !important; }
.dark .dp-tag-info { background-color: rgba(56, 189, 248, 0.15) !important; color: #7dd3fc !important; }
.dark .dp-tag-default { background-color: rgba(148, 163, 184, 0.15) !important; color: #cbd5e1 !important; }
.dp-cell-edit { display: inline-block; min-width: 1.5rem; padding: 0 4px; border-radius: 4px; cursor: text; }
.dp-cell-edit:hover { background-color: #e2e8f0; }
.dark .dp-cell-edit:hover { background-color: #334155; }
.dp-pop { background-color: #fff !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
.dark .dp-pop { background-color: #1e293b !important; border-color: #475569 !important; color: #f1f5f9 !important; }
.dark .dp-pop [aria-hidden="true"] { background-color: #1e293b !important; border-color: #475569 !important; }
.dp-jump { width: 3.5rem; flex: none; }
.dp-jump input { padding: 0.25rem 0.5rem; font-size: 0.875rem; line-height: 1.25rem; border-radius: 0.25rem; text-align: center; -moz-appearance: textfield; appearance: textfield; }
.dp-jump input::-webkit-outer-spin-button, .dp-jump input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.dp-ed-wrap { min-width: 9.5rem; }
/* pageSize Select：宽度随文案与箭头自适应，勿固定过宽；nowrap 防换行 */
.dp-pgsize { width: fit-content; flex: none; min-width: 0; max-width: none; }
.dp-pgsize span.relative {
  width: fit-content !important;
  min-width: 0 !important;
  max-width: none !important;
  display: inline-flex !important;
}
/* 与 .dp-jump 一致：底栏 Select 触发器压到与分页按钮同高（测 heightDiff≤4） */
.dp-pgsize button[aria-haspopup] {
  white-space: nowrap !important;
  width: auto !important;
  padding: 0.25rem 0.5rem !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  border-radius: 0.25rem !important;
  gap: 0.25rem !important;
  box-sizing: border-box !important;
}
.dp-pgsize [role="listbox"] {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 0.25rem;
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
  right: auto;
  left: 0;
}
.dp-pgsize [role="option"] {
  display: block;
  width: 100%;
  white-space: nowrap;
  box-sizing: border-box;
}
.dp-acts { display: inline-flex; align-items: center; justify-content: center; gap: 1px; }
.dp-act [role="img"] { width: 1rem !important; height: 1rem !important; }
.dp-act { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 2px !important; min-width: 0 !important; border-radius: 4px; color: #64748b !important; line-height: 1; cursor: pointer; transition: color 0.15s ease; }
.dp-act:hover:not(:disabled) { background: transparent !important; border: 0 !important; color: #2563eb !important; }
.dp-act-del:hover:not(:disabled), .dp-act-danger:hover:not(:disabled) { color: #dc2626 !important; }
.dp-act-primary:hover:not(:disabled) { color: #1d4ed8 !important; }
.dp-act-secondary:hover:not(:disabled) { color: #475569 !important; }
.dp-act-success:hover:not(:disabled) { color: #16a34a !important; }
.dp-act-warning:hover:not(:disabled) { color: #d97706 !important; }
.dp-act-ghost:hover:not(:disabled) { color: #334155 !important; }
.dp-act-default:hover:not(:disabled) { color: #2563eb !important; }
.dp-act:disabled { opacity: 0.4; color: #94a3b8 !important; cursor: not-allowed !important; }
.dark .dp-act { color: #94a3b8 !important; }
.dark .dp-act:hover:not(:disabled) { color: #60a5fa !important; }
.dark .dp-act-del:hover:not(:disabled), .dark .dp-act-danger:hover:not(:disabled) { color: #f87171 !important; }
.dark .dp-act-primary:hover:not(:disabled) { color: #93c5fd !important; }
.dark .dp-act-secondary:hover:not(:disabled) { color: #cbd5e1 !important; }
.dark .dp-act-success:hover:not(:disabled) { color: #4ade80 !important; }
.dark .dp-act-warning:hover:not(:disabled) { color: #fbbf24 !important; }
.dark .dp-act-ghost:hover:not(:disabled) { color: #e2e8f0 !important; }
.dark .dp-act-default:hover:not(:disabled) { color: #60a5fa !important; }
.dark .dp-act:disabled { color: #64748b !important; }
.dark .dp-card { background: var(--dp-panel-body-bg, #18212f) !important; }
.dp-den-compact td, .dp-den-compact th { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
.dp-den-loose td, .dp-den-loose th { padding-top: 0.875rem !important; padding-bottom: 0.875rem !important; }
.dp-fs {
  position: fixed !important; inset: 0 !important; z-index: 9999 !important;
  width: 100vw !important; height: 100vh !important; max-width: 100vw !important; max-height: 100vh !important;
  overflow: auto !important; box-sizing: border-box !important; padding: 0.75rem !important;
  background: #fff !important; margin: 0 !important; border-radius: 0 !important;
}
.dark .dp-fs { background: #0f172a !important; }
.dp-fs .dp-card { border-radius: 0 !important; min-height: calc(100vh - 1.5rem) !important; }
/* Mobile: flush table card top/left/right; keep bottom.
   Pagination: stack controls above range, both centered; keep L/R/bottom padding. */
@media (max-width: 639.98px) {
  .dp-card {
    margin-top: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  .dp-table-wrap {
    padding-top: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .dp-pg {
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
  }
  .dp-pg-ctrls {
    order: 1 !important;
    justify-content: center !important;
  }
  .dp-range {
    order: 2 !important;
    width: 100% !important;
    text-align: center !important;
  }
}

`;

// ---------------------------------------------------------------- component
