/**
 * DataPanel tab query (method 1) + list cache.
 */
import { describe, expect, it } from "@dreamer/test";
import { createApiDataSource } from "../../src/desktop/data-display/data-panel-api-source.ts";
import {
  appendTabQuery,
  createTabListCache,
  createTabRecordCache,
  loadTabListResult,
  loadTabRecord,
  queryAfterTabChange,
  resolveTabQuery,
  tabListCacheKey,
  wrapFetchWithTabParam,
} from "../../src/desktop/data-display/data-panel-tab-source.ts";
import type { Query } from "../../src/desktop/data-display/data-panel-types.ts";

const TABS = [
  { key: "3", label: "最近 3 个月" },
  { key: "6", label: "最近 6 个月" },
  { key: "12", label: "最近 12 个月" },
];

function q(patch: Partial<Query> = {}): Query {
  return {
    page: 1,
    pageSize: 20,
    sort: "",
    order: "asc",
    filters: {},
    ...patch,
  };
}

function jsonOk(body: unknown = { items: [], total: 0 }): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("resolveTabQuery", () => {
  it("uses the default tab key when the panel has tabs", () => {
    expect(resolveTabQuery(TABS, "tab", "12")).toEqual({
      param: "tab",
      value: "12",
    });
  });

  it("uses a custom query key", () => {
    expect(resolveTabQuery(TABS, "months", "6")).toEqual({
      param: "months",
      value: "6",
    });
  });

  it("is disabled when tabParam is empty (tabParam={false})", () => {
    expect(resolveTabQuery(TABS, "", "12")).toBeUndefined();
  });

  it("does not attach a tab param when the panel has no tabs", () => {
    expect(resolveTabQuery(undefined, "tab", "12")).toBeUndefined();
    expect(resolveTabQuery([], "tab", "12")).toBeUndefined();
  });

  it("does not attach an empty tab value", () => {
    expect(resolveTabQuery(TABS, "tab", "")).toBeUndefined();
  });
});

describe("appendTabQuery", () => {
  it("adds the param to a list URL and keeps existing query / hash", () => {
    expect(appendTabQuery("/api/users/worn?page=2", "tab", "12")).toBe(
      "/api/users/worn?page=2&tab=12",
    );
    expect(appendTabQuery("/api/users/worn#x", "tab", "3")).toBe(
      "/api/users/worn?tab=3#x",
    );
  });

  it("does not append when param or value is empty", () => {
    expect(appendTabQuery("/api/users/worn", "tab", "")).toBe(
      "/api/users/worn",
    );
    expect(appendTabQuery("/api/users/worn", "", "12")).toBe(
      "/api/users/worn",
    );
  });
});

describe("queryAfterTabChange", () => {
  it("resets page to 1 and keeps search / sort", () => {
    expect(
      queryAfterTabChange(
        q({ page: 4, sort: "name", order: "desc", filters: { q: "张三" } }),
      ),
    ).toEqual(
      q({ page: 1, sort: "name", order: "desc", filters: { q: "张三" } }),
    );
  });
});

describe("wrapFetchWithTabParam", () => {
  it("puts the active tab on list / create / update / remove / import / view", async () => {
    const urls: string[] = [];
    let current = "12";
    const fetchImpl = ((input: RequestInfo | URL) => {
      urls.push(typeof input === "string" ? input : String(input));
      return jsonOk({ items: [{ id: "1", name: "张三" }], total: 1, ok: true });
    }) as typeof fetch;
    const ds = createApiDataSource({
      baseRoute: "/api/users/worn",
      fetch: wrapFetchWithTabParam(fetchImpl, () =>
        resolveTabQuery(TABS, "tab", current)),
    });

    await ds.list(q());
    await ds.create?.({ name: "李四" });
    await ds.update?.("1", { name: "王五" });
    await ds.remove?.(["1"]);
    await ds.importRows?.([{ name: "张三" }]);
    await ds.view("1");

    expect(urls.length).toBe(6);
    for (const url of urls) {
      const u = new URL(url, "http://ui-view.test");
      expect(u.searchParams.get("tab")).toBe("12");
      expect(u.pathname.startsWith("/api/users/worn")).toBe(true);
    }

    current = "3";
    urls.length = 0;
    await ds.list(q());
    expect(new URL(urls[0]!, "http://ui-view.test").searchParams.get("tab"))
      .toBe("3");
  });

  it("uses a custom tabParam key on every request", async () => {
    const urls: string[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users/worn",
      fetch: wrapFetchWithTabParam(((input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonOk();
      }) as typeof fetch, () => resolveTabQuery(TABS, "months", "6")),
    });
    await ds.list(q());
    await ds.create?.({ name: "张三" });
    const list = new URL(urls[0]!, "http://ui-view.test");
    const create = new URL(urls[1]!, "http://ui-view.test");
    expect(list.searchParams.get("months")).toBe("6");
    expect(list.searchParams.get("tab")).toBeNull();
    expect(create.searchParams.get("months")).toBe("6");
  });

  it("does not send tab when tabParam is disabled", async () => {
    const urls: string[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users/worn",
      fetch: wrapFetchWithTabParam(((input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonOk();
      }) as typeof fetch, () => resolveTabQuery(TABS, "", "12")),
    });
    await ds.list(q());
    await ds.importRows?.([{ name: "张三" }]);
    for (const url of urls) {
      expect(url.includes("tab=")).toBe(false);
      expect(new URL(url, "http://ui-view.test").searchParams.has("tab"))
        .toBe(false);
    }
  });

  it("does not send tab on list / import / refresh when the panel has no tabs", async () => {
    const urls: string[] = [];
    const fetchImpl = wrapFetchWithTabParam(((input: RequestInfo | URL) => {
      urls.push(String(input));
      return jsonOk();
    }) as typeof fetch, () => resolveTabQuery(undefined, "tab", "12"));
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      fetch: fetchImpl,
    });
    await ds.list(q());
    await ds.importRows?.([{ name: "张三" }]);
    await ds.list(q()); // refresh
    expect(urls.length).toBe(3);
    for (const url of urls) {
      expect(url.includes("tab=")).toBe(false);
      expect(new URL(url, "http://ui-view.test").searchParams.has("tab"))
        .toBe(false);
    }
  });

  it("reads the initial URL tab key on the first request", async () => {
    const initial = resolveTabQuery(
      TABS,
      "tab",
      "12", /* same as ?tab=12 */
    );
    const urls: string[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users/worn",
      fetch: wrapFetchWithTabParam(((input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonOk({ items: [{ id: "1", name: "张三" }], total: 1 });
      }) as typeof fetch, () => initial),
    });
    await ds.list(q());
    expect(new URL(urls[0]!, "http://ui-view.test").searchParams.get("tab"))
      .toBe("12");
  });
});

describe("tab list cache", () => {
  it("fetches the first visit of a tab and reuses the cache on the way back", async () => {
    const calls: string[] = [];
    const cache = createTabListCache();
    const list = (tabKey: string, query: Query) =>
      loadTabListResult({
        cache,
        tabKey,
        query,
        list: () => {
          calls.push(tabKey);
          return Promise.resolve({
            items: [{ id: tabKey, name: tabKey === "3" ? "张三" : "李四" }],
            total: 1,
          });
        },
      });

    const first = await list("3", q());
    expect(first.fromCache).toBe(false);
    expect(calls).toEqual(["3"]);

    const other = await list("12", q());
    expect(other.fromCache).toBe(false);
    expect(calls).toEqual(["3", "12"]);

    const back = await list("3", q());
    expect(back.fromCache).toBe(true);
    expect(back.result.items[0]?.name).toBe("张三");
    expect(calls).toEqual(["3", "12"]);
  });

  it("treats a different page or search as a new request", async () => {
    const calls: string[] = [];
    const cache = createTabListCache();
    const list = (query: Query) =>
      loadTabListResult({
        cache,
        tabKey: "3",
        query,
        list: () => {
          calls.push(`${query.page}:${query.filters.q ?? ""}`);
          return Promise.resolve({ items: [], total: 0 });
        },
      });

    await list(q({ page: 1 }));
    await list(q({ page: 2 }));
    await list(q({ page: 1, filters: { q: "王五" } }));
    await list(q({ page: 1 }));
    expect(calls).toEqual(["1:", "2:", "1:王五"]);
  });

  it("refresh bypasses cache for the current tab only", async () => {
    const calls: string[] = [];
    const cache = createTabListCache();
    const list = (tabKey: string, bypassCache = false) =>
      loadTabListResult({
        cache,
        tabKey,
        query: q(),
        bypassCache,
        list: () => {
          calls.push(tabKey);
          return Promise.resolve({
            items: [{ id: tabKey, name: "张三" }],
            total: 1,
          });
        },
      });

    await list("3");
    await list("12");
    cache.invalidateTab("3");
    const refreshed = await list("3", true);
    expect(refreshed.fromCache).toBe(false);
    expect(calls).toEqual(["3", "12", "3"]);

    const other = await list("12");
    expect(other.fromCache).toBe(true);
    expect(calls).toEqual(["3", "12", "3"]);
  });

  it("builds distinct keys for tab + query identity", () => {
    const a = tabListCacheKey({ tabKey: "3", query: q() });
    const b = tabListCacheKey({ tabKey: "12", query: q() });
    const c = tabListCacheKey({ tabKey: "3", query: q({ page: 2 }) });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("DataView API requests carry the current tab", () => {
  it("adds tab on view / refresh / import / update when tabs are set", async () => {
    const urls: string[] = [];
    let current = "basic";
    const tabs = [
      { key: "basic", label: "基本信息" },
      { key: "extra", label: "其他" },
    ];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      fetch: wrapFetchWithTabParam(((input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonOk({ id: "1", name: "张三", ok: true });
      }) as typeof fetch, () => resolveTabQuery(tabs, "tab", current)),
    });
    await ds.view("1");
    await ds.view("1"); // refresh
    await ds.importRows?.([{ name: "李四" }]);
    await ds.update?.("1", { name: "王五" });
    expect(urls.length).toBe(4);
    for (const url of urls) {
      expect(new URL(url, "http://ui-view.test").searchParams.get("tab"))
        .toBe("basic");
    }
    current = "extra";
    urls.length = 0;
    await ds.view("1");
    expect(new URL(urls[0]!, "http://ui-view.test").searchParams.get("tab"))
      .toBe("extra");
  });

  it("does not send tab when DataView has no tabs", async () => {
    const urls: string[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      fetch: wrapFetchWithTabParam(((input: RequestInfo | URL) => {
        urls.push(String(input));
        return jsonOk({ id: "1", name: "张三", ok: true });
      }) as typeof fetch, () => resolveTabQuery(undefined, "tab", "basic")),
    });
    await ds.view("1");
    await ds.importRows?.([{ name: "李四" }]);
    await ds.update?.("1", { name: "王五" });
    for (const url of urls) {
      expect(url.includes("tab=")).toBe(false);
      expect(new URL(url, "http://ui-view.test").searchParams.has("tab"))
        .toBe(false);
    }
  });
});

describe("DataView tab record cache", () => {
  it("fetches once per tab and reuses the cache on the way back", async () => {
    const calls: string[] = [];
    const cache = createTabRecordCache();
    const load = (tabKey: string, bypassCache = false) =>
      loadTabRecord({
        cache,
        tabKey,
        id: "1",
        bypassCache,
        load: () => {
          calls.push(tabKey);
          return Promise.resolve({
            id: "1",
            name: tabKey === "basic" ? "张三" : "李四",
          });
        },
      });

    const first = await load("basic");
    expect(first.fromCache).toBe(false);
    const other = await load("extra");
    expect(other.fromCache).toBe(false);
    const back = await load("basic");
    expect(back.fromCache).toBe(true);
    expect(back.result?.name).toBe("张三");
    expect(calls).toEqual(["basic", "extra"]);

    cache.invalidateTab("basic");
    const refreshed = await load("basic", true);
    expect(refreshed.fromCache).toBe(false);
    expect(calls).toEqual(["basic", "extra", "basic"]);
    const kept = await load("extra");
    expect(kept.fromCache).toBe(true);
    expect(calls).toEqual(["basic", "extra", "basic"]);
  });
});
