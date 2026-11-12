/**
 * DataPanel / DataView tab chrome: wraps the existing layout Tabs component.
 * A tab without `children` shows the panel's default body (table or descriptions).
 * The tab list sits above `extra` (the toolbar) so the active tab can meet the toolbar
 * with no line underneath.
 */
import type { JSXRenderable } from "@dreamer/view";
import { Tabs, type TabsType } from "../../shared/layout/Tabs.tsx";

/** One tab on DataPanel or DataView. */
export interface DataChromeTab {
  /** Unique key */
  key: string;
  /** Tab label */
  label: string | unknown;
  disabled?: boolean;
  /**
   * Optional tab body. When omitted, the default table (DataPanel)
   * or default descriptions (DataView) is shown.
   */
  children?: unknown;
}

export type { TabsType as DataChromeTabType };

/** Default query key used to activate and remember the current tab. */
export const DEFAULT_TAB_PARAM = "tab";

const tabKeyCache = new Map<string, string>();

export function peekCachedTabKey(panelKey: string): string | undefined {
  return tabKeyCache.get(panelKey);
}

export function rememberTabKey(panelKey: string, key: string): void {
  if (panelKey) tabKeyCache.set(panelKey, key);
}

export function readTabFromLocation(param: string): string | undefined {
  if (!param) return undefined;
  const loc = (globalThis as { location?: { search?: string } }).location;
  if (!loc?.search) return undefined;
  const value = new URLSearchParams(loc.search.replace(/^\?/, "")).get(param);
  return value || undefined;
}

export function writeTabToLocation(param: string, key: string): void {
  const g = globalThis as {
    location?: { pathname: string; search: string; hash: string };
    history?: { replaceState: (a: unknown, b: string, c: string) => void };
  };
  if (!param || !g.location || !g.history) return;
  const p = new URLSearchParams(g.location.search.replace(/^\?/, ""));
  if (key) p.set(param, key);
  else p.delete(param);
  const qs = p.toString();
  g.history.replaceState(
    null,
    "",
    g.location.pathname + (qs ? `?${qs}` : "") + (g.location.hash || ""),
  );
}

/** Resolve the first enabled key, honoring controlled / default keys when they exist. */
export function resolveDataChromeTabKey(
  tabs: DataChromeTab[] | undefined,
  activeTab?: string,
  defaultActiveTab?: string,
): string {
  if (!tabs?.length) return "";
  const keys = new Set(tabs.map((t) => t.key));
  if (activeTab && keys.has(activeTab)) return activeTab;
  if (defaultActiveTab && keys.has(defaultActiveTab)) return defaultActiveTab;
  return tabs.find((t) => !t.disabled)?.key ?? tabs[0]?.key ?? "";
}

/**
 * Initial tab: controlled `activeTab`, then the cached key for this panel,
 * then the URL query, then `defaultActiveTab`.
 */
export function resolveInitialTabKey(opts: {
  tabs?: DataChromeTab[];
  activeTab?: string;
  defaultActiveTab?: string;
  panelKey?: string;
  tabParam?: string;
}): string {
  const fromCache = opts.panelKey ? peekCachedTabKey(opts.panelKey) : undefined;
  const fromUrl = opts.tabParam
    ? readTabFromLocation(opts.tabParam)
    : undefined;
  return resolveDataChromeTabKey(
    opts.tabs,
    opts.activeTab ?? fromCache ?? fromUrl,
    opts.defaultActiveTab,
  );
}

export interface DataChromeTabListProps {
  tabs: DataChromeTab[];
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (key: string) => void;
  type?: TabsType;
}

/**
 * Tab buttons meant to sit in the left of the toolbar row.
 */
export function DataChromeTabList(
  props: DataChromeTabListProps,
): JSXRenderable {
  return () => {
    const items = props.tabs.map((t) => ({
      key: t.key,
      label: t.label,
      disabled: t.disabled,
      children: null,
    }));
    const activeKey = resolveDataChromeTabKey(
      props.tabs,
      props.activeTab,
      props.defaultActiveTab,
    );
    return (
      <Tabs
        hidePanel
        class="mr-auto inline-flex w-fit shrink-0 self-end bg-transparent dark:bg-transparent"
        tabListClass="!flex-nowrap !border-b-0 !gap-0 px-0 py-0 bg-transparent items-end"
        tabClass="!-mb-px !py-1 !rounded-t-md !rounded-b-none !border !border-slate-300 dark:!border-slate-600/40 hover:!border-slate-300 dark:hover:!border-slate-600/40 hover:!border-b hover:!bg-transparent hover:!text-slate-900 dark:hover:!text-slate-100"
        activeClass="!z-10 !border-slate-300 dark:!border-slate-600/40 !border-b-0 hover:!border-b-0 !bg-white hover:!bg-white dark:!bg-[var(--dp-panel-body-bg,rgb(30_41_59/0.8))] dark:hover:!bg-[var(--dp-panel-body-bg,rgb(30_41_59/0.8))] !text-blue-600 dark:!text-blue-400"
        type={props.type ?? "line"}
        items={items}
        activeKey={activeKey}
        onChange={(key) => props.onTabChange?.(key)}
      />
    );
  };
}

export interface DataChromeTabBodyProps {
  tabs: DataChromeTab[];
  activeTab?: string;
  defaultActiveTab?: string;
  defaultBody: unknown;
}

/** Body for the active tab; a tab without `children` shows `defaultBody`. */
export function DataChromeTabBody(
  props: DataChromeTabBodyProps,
): JSXRenderable {
  return () => {
    const activeKey = resolveDataChromeTabKey(
      props.tabs,
      props.activeTab,
      props.defaultActiveTab,
    );
    const tab = props.tabs.find((t) => t.key === activeKey);
    return (
      <div data-testid="data-chrome-tabs" role="tabpanel">
        {tab?.children ?? props.defaultBody}
      </div>
    );
  };
}
