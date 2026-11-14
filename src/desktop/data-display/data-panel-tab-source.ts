/**
 * DataPanel tab → API query and in-memory list cache (method 1).
 *
 * When a panel has tabs, the active tab key is attached as a query param on
 * API requests (default key `tab`). A panel without tabs never sends the
 * param. Results are cached per tab + list query for the panel instance.
 */
import {
  type DataChromeTab,
  resolveDataChromeTabKey,
} from "./data-panel-tabs.tsx";
import type { ListResult, Query, Row } from "./data-panel-types.ts";

/** Resolved tab query to attach, or `undefined` when it must not be sent. */
export type TabQuery = { param: string; value: string };

/**
 * Attach the tab query only when the panel has tabs and `tabParam` is enabled.
 * If the active key is empty (first visit, address bar has no tab yet),
 * use the first enabled tab, otherwise `tabs[0]`. Never returns an empty value.
 */
export function resolveTabQuery(
  tabs: DataChromeTab[] | undefined,
  tabParam: string,
  tabKey: string,
): TabQuery | undefined {
  if (!tabs?.length || !tabParam) return undefined;
  const value = tabKey || resolveDataChromeTabKey(tabs);
  if (!value) return undefined;
  return { param: tabParam, value };
}

/** Reset pagination when the active tab changes. Search / sort / filters stay. */
export function queryAfterTabChange(query: Query): Query {
  return { ...query, page: 1 };
}

/** Append (or replace) a query param on a possibly-relative URL. */
export function appendTabQuery(
  url: string,
  param: string,
  value: string,
): string {
  if (!param || !value) return url;
  const hashIdx = url.indexOf("#");
  const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
  const withoutHash = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const qIdx = withoutHash.indexOf("?");
  const path = qIdx >= 0 ? withoutHash.slice(0, qIdx) : withoutHash;
  const qs = new URLSearchParams(
    qIdx >= 0 ? withoutHash.slice(qIdx + 1) : "",
  );
  qs.set(param, value);
  return `${path}?${qs.toString()}${hash}`;
}

/**
 * Wrap `fetch` so every request carries the current tab query when
 * {@link resolveTabQuery} returns a value. No tabs / disabled `tabParam`
 * leaves the URL unchanged (no `tab=`).
 */
export function wrapFetchWithTabParam(
  fetchImpl: typeof globalThis.fetch,
  getTab: () => TabQuery | undefined,
): typeof globalThis.fetch {
  return ((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const tab = getTab();
    if (!tab) return fetchImpl(input as RequestInfo, init);
    if (typeof input === "string") {
      return fetchImpl(appendTabQuery(input, tab.param, tab.value), init);
    }
    if (input instanceof URL) {
      return fetchImpl(
        appendTabQuery(input.toString(), tab.param, tab.value),
        init,
      );
    }
    const next = appendTabQuery(input.url, tab.param, tab.value);
    return fetchImpl(new Request(next, input), init);
  }) as typeof globalThis.fetch;
}

function stableFilters(filters: Record<string, string> | undefined): string {
  return Object.entries(filters ?? {})
    .filter(([, v]) => v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

/**
 * Cache identity: active tab + page / pageSize / sort / search filters.
 * The tab key is included even when it is also present in filters.
 */
export function tabListCacheKey(opts: {
  tabKey: string;
  query: Query;
}): string {
  return [
    opts.tabKey,
    String(opts.query.page),
    String(opts.query.pageSize),
    opts.query.sort ?? "",
    opts.query.order ?? "asc",
    stableFilters(opts.query.filters),
  ].join("\0");
}

function cloneListResult(value: ListResult): ListResult {
  return {
    rows: value.rows.map((row) => ({ ...row }) as Row),
    total: value.total,
    totals: value.totals ? { ...value.totals } : undefined,
  };
}

export interface TabListCache {
  get(key: string): ListResult | undefined;
  set(key: string, value: ListResult): void;
  /** Drop every cached request for one tab (other tabs are kept). */
  invalidateTab(tabKey: string): void;
  clear(): void;
  readonly size: number;
}

/** In-memory list cache for one DataPanel instance / page session. */
export function createTabListCache(): TabListCache {
  const map = new Map<string, ListResult>();
  return {
    get(key) {
      const hit = map.get(key);
      return hit ? cloneListResult(hit) : undefined;
    },
    set(key, value) {
      map.set(key, cloneListResult(value));
    },
    invalidateTab(tabKey) {
      const prefix = `${tabKey}\0`;
      for (const key of [...map.keys()]) {
        if (key.startsWith(prefix)) map.delete(key);
      }
    },
    clear() {
      map.clear();
    },
    get size() {
      return map.size;
    },
  };
}

type MaybePromise<T> = T | Promise<T>;

/**
 * Read a cached list, or call `list` and store the result.
 * `bypassCache` still updates the cache with the fresh response.
 */
export async function loadTabListResult(opts: {
  cache: TabListCache;
  tabKey: string;
  query: Query;
  bypassCache?: boolean;
  list: () => MaybePromise<ListResult>;
}): Promise<{ result: ListResult; fromCache: boolean }> {
  const key = tabListCacheKey({ tabKey: opts.tabKey, query: opts.query });
  if (!opts.bypassCache) {
    const hit = opts.cache.get(key);
    if (hit) return { result: hit, fromCache: true };
  }
  const result = await opts.list();
  opts.cache.set(key, result);
  return { result, fromCache: false };
}

/** In-memory record cache for one DataView instance / page session. */
export interface TabRecordCache {
  /** `undefined` = miss; `null` = cached empty record. */
  get(tabKey: string, id: string): Row | null | undefined;
  set(tabKey: string, id: string, row: Row | null): void;
  /** Drop every cached record for one tab (other tabs are kept). */
  invalidateTab(tabKey: string): void;
  clear(): void;
}

export function tabRecordCacheKey(tabKey: string, id: string): string {
  return `${tabKey}\0${id}`;
}

export function createTabRecordCache(): TabRecordCache {
  const map = new Map<string, Row | null>();
  return {
    get(tabKey, id) {
      const key = tabRecordCacheKey(tabKey, id);
      if (!map.has(key)) return undefined;
      const hit = map.get(key);
      return hit ? { ...hit } as Row : null;
    },
    set(tabKey, id, row) {
      map.set(tabRecordCacheKey(tabKey, id), row ? { ...row } as Row : null);
    },
    invalidateTab(tabKey) {
      const prefix = `${tabKey}\0`;
      for (const key of [...map.keys()]) {
        if (key.startsWith(prefix)) map.delete(key);
      }
    },
    clear() {
      map.clear();
    },
  };
}

/**
 * Read a cached record, or call `load` and store the result.
 * `bypassCache` still updates the cache with the fresh response.
 */
export async function loadTabRecord(opts: {
  cache: TabRecordCache;
  tabKey: string;
  id: string;
  bypassCache?: boolean;
  load: () => MaybePromise<Row | null>;
}): Promise<{ result: Row | null; fromCache: boolean }> {
  if (!opts.bypassCache) {
    const hit = opts.cache.get(opts.tabKey, opts.id);
    if (hit !== undefined) return { result: hit, fromCache: true };
  }
  const result = await opts.load();
  opts.cache.set(opts.tabKey, opts.id, result);
  return { result, fromCache: false };
}
