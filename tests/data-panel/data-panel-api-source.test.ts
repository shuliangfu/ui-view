/**
 * @fileoverview createApiDataSource：action／restful 路径与 list／create／update／remove／importRows／view。
 * （测暂停闸期间勿跑；统一测再开。）
 */
import { describe, expect, it } from "@dreamer/test";
import {
  apiListQueryHeaders,
  apiQueryParams,
  createApiDataSource,
  joinApiPath,
  normalizeListPayload,
  normalizePageRoute,
  resolveApiRoot,
} from "../../src/desktop/data-display/data-panel-api-source.ts";
import type { Query } from "../../src/desktop/data-display/data-panel-types.ts";

const Q: Query = {
  page: 1,
  pageSize: 10,
  sort: "name",
  order: "asc",
  filters: { role: "admin" },
};

describe("joinApiPath / apiQueryParams / normalizeListPayload", () => {
  it("joinApiPath 拼资源根", () => {
    expect(joinApiPath("/api", "users")).toBe("/api/users");
    expect(joinApiPath("/api/", "/users/")).toBe("/api/users");
    expect(joinApiPath("/api", "users", "create")).toBe("/api/users/create");
  });

  it("normalizePageRoute 去掉 query／hash／末尾 index", () => {
    expect(normalizePageRoute("/rbac/admins")).toBe("/rbac/admins");
    expect(normalizePageRoute("/rbac/admins/")).toBe("/rbac/admins");
    expect(normalizePageRoute("/user")).toBe("/user");
    expect(normalizePageRoute("/user/index")).toBe("/user");
    expect(normalizePageRoute("/user/index/")).toBe("/user");
    expect(normalizePageRoute("/user/active")).toBe("/user/active");
    expect(normalizePageRoute("/user/index?page=1#top")).toBe("/user");
    expect(normalizePageRoute("/")).toBe("/");
    expect(normalizePageRoute("")).toBe("/");
  });

  it("完整 baseRoute（如 /api/admins）直接使用，不再取当前页面路由", () => {
    expect(resolveApiRoot("/api/admins")).toBe("/api/admins");
    expect(resolveApiRoot("/api/admins/")).toBe("/api/admins");
    expect(resolveApiRoot("/api/users")).toBe("/api/users");
    // 即使传入当前页或 resource，也不能再拼上去
    expect(resolveApiRoot("/api/admins", undefined, "/rbac/admins")).toBe(
      "/api/admins",
    );
    expect(resolveApiRoot("/api/admins", "users", "/rbac/roles")).toBe(
      "/api/admins",
    );
  });

  it("只传 /api 时才自动拼接当前页面路由", () => {
    expect(resolveApiRoot("/api", undefined, "/rbac/admins")).toBe(
      "/api/rbac/admins",
    );
    expect(resolveApiRoot("/api", undefined, "/user")).toBe("/api/user");
    expect(resolveApiRoot("/api", undefined, "/user/index")).toBe("/api/user");
    expect(resolveApiRoot("/api", undefined, "/user/active")).toBe(
      "/api/user/active",
    );
    expect(resolveApiRoot("/api", "users")).toBe("/api/users");
    expect(resolveApiRoot("/api", "rbac/admins")).toBe("/api/rbac/admins");
    // 显式 resource 优先于当前页面路由
    expect(resolveApiRoot("/api", "users", "/rbac/admins")).toBe("/api/users");
    // 无 resource 且当前路由为空时仍抛错（便于单测／SSR）
    expect(() => resolveApiRoot("/api", undefined, "")).toThrow();
    expect(() => resolveApiRoot("/api", undefined, "/")).toThrow();
  });

  it("apiQueryParams 扁平 filters", () => {
    const p = apiQueryParams(Q);
    expect(p.get("page")).toBe("1");
    expect(p.get("pageSize")).toBe("10");
    expect(p.get("sort")).toBe("name");
    expect(p.get("order")).toBe("asc");
    expect(p.get("role")).toBe("admin");
  });

  it("apiListQueryHeaders 与 query 键名一致", () => {
    const h = apiListQueryHeaders(Q);
    expect(h.get("page")).toBe("1");
    expect(h.get("pageSize")).toBe("10");
    expect(h.get("sort")).toBe("name");
    expect(h.get("order")).toBe("asc");
    expect(h.get("role")).toBe("admin");
  });

  it("apiListQueryHeaders 对非 ASCII 值做 URI 编码，避免 Headers 抛错", () => {
    const h = apiListQueryHeaders({
      page: 1,
      pageSize: 20,
      sort: "",
      order: "asc",
      filters: { q: "张三", tab: "12" },
    });
    expect(h.get("q")).toBe(encodeURIComponent("张三"));
    expect(h.get("tab")).toBe("12");
    expect(h.get("page")).toBe("1");
  });

  it("normalizeListPayload 常见壳", () => {
    expect(normalizeListPayload({ rows: [{ id: "1" }], total: 1 })).toEqual({
      rows: [{ id: "1" }],
      total: 1,
    });
    expect(
      normalizeListPayload({
        data: { rows: [{ id: "2" }], total: 3, totals: { a: 1 } },
      }),
    ).toEqual({ rows: [{ id: "2" }], total: 3, totals: { a: 1 } });
    // 兼容：没有 rows 时仍接受 items（输出仍为 rows）
    expect(normalizeListPayload({ items: [{ id: "3" }], total: 1 })).toEqual({
      rows: [{ id: "3" }],
      total: 1,
    });
    // 同时有 rows 与 items 时以 rows 为准
    expect(
      normalizeListPayload({
        rows: [{ id: "r" }],
        items: [{ id: "i" }],
        total: 1,
      }),
    ).toEqual({ rows: [{ id: "r" }], total: 1 });
  });
});

type Call = { method: string; url: string; body?: unknown; headers?: Headers };

function mockFetch(
  calls: Call[],
  handler: (c: Call) => { status?: number; json: unknown },
) {
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    let body: unknown;
    if (init?.body) {
      try {
        body = JSON.parse(String(init.body));
      } catch {
        body = init.body;
      }
    }
    const c: Call = { method, url, body, headers: new Headers(init?.headers) };
    calls.push(c);
    const r = handler(c);
    return Promise.resolve(
      new Response(JSON.stringify(r.json), {
        status: r.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof fetch;
}

describe("createApiDataSource action", () => {
  it("list／create／update／remove／importRows／view 路径", async () => {
    const calls: Call[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api",
      resource: "users",
      fetch: mockFetch(calls, (c) => {
        if (c.method === "GET" && c.url.startsWith("/api/users?")) {
          return { json: { rows: [{ id: "1" }], total: 1 } };
        }
        if (c.url === "/api/users/view?id=1") {
          return { json: { id: "1", name: "A" } };
        }
        if (c.url === "/api/users/create") {
          return {
            json: {
              ok: true,
              created: Array.isArray((c.body as { rows?: unknown })?.rows)
                ? 2
                : 1,
            },
          };
        }
        if (c.url.split("?")[0] === "/api/users/update") {
          return { json: { ok: true } };
        }
        if (c.url.split("?")[0] === "/api/users/setField") {
          return { json: { removed: 2, failed: [] } };
        }
        if (c.url.split("?")[0] === "/api/users/remove") {
          return { json: { removed: 1, failed: [] } };
        }
        return { status: 404, json: { error: "no" } };
      }),
    });
    expect(ds.root).toBe("/api/users");
    expect(ds.apiMode).toBe("action");
    expect(await ds.list(Q)).toEqual({ rows: [{ id: "1" }], total: 1 });
    expect(await ds.view("1")).toEqual({ id: "1", name: "A" });
    expect(await ds.get!("1")).toEqual({ id: "1", name: "A" });
    expect(await ds.create!({ name: "A" })).toEqual({ ok: true });
    expect(await ds.update!("1", { name: "B" })).toEqual({ ok: true });
    expect(await ds.setField!(["1", "2"], "status", "on")).toEqual({
      removed: 2,
      failed: [],
    });
    expect(await ds.remove!(["1"])).toEqual({ removed: 1, failed: [] });
    expect(await ds.importRows!([{ name: "x" }, { name: "y" }])).toEqual({
      created: 2,
      failed: 0,
    });
    const paths = calls.map((c) => `${c.method} ${c.url}`);
    expect(paths).toEqual([
      "GET /api/users?page=1&pageSize=10&sort=name&order=asc&role=admin",
      "GET /api/users/view?id=1",
      "GET /api/users/view?id=1",
      "POST /api/users/create",
      "POST /api/users/update?id=1",
      "POST /api/users/setField?id=1&id=2",
      "POST /api/users/remove?id=1",
      "POST /api/users/create",
    ]);
    const setBody = calls[5].body as Record<string, unknown>;
    expect(setBody).toEqual({
      ids: ["1", "2"],
      id: "1",
      field: "status",
      value: "on",
    });
    const importBody = calls[7].body as { rows: unknown[] };
    expect(Array.isArray(importBody.rows)).toBe(true);
    expect(importBody.rows.length).toBe(2);
    const createBody = calls[3].body as Record<string, unknown>;
    expect(createBody.name).toBe("A");
    expect(createBody.rows).toBeUndefined();
  });

  it("list 把 page、pageSize 等参数写入 Headers，其他请求不带", async () => {
    const calls: Call[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      headers: { "X-Test": "1" },
      fetch: mockFetch(calls, (c) => {
        if (c.method === "GET" && c.url.startsWith("/api/users?")) {
          return { json: { rows: [], total: 0 } };
        }
        if (c.url === "/api/users/view?id=1") {
          return { json: { id: "1" } };
        }
        return { json: { ok: true } };
      }),
    });
    await ds.list(Q);
    await ds.view("1");
    await ds.create!({ name: "A" });
    const listHeaders = calls[0].headers!;
    expect(listHeaders.get("page")).toBe("1");
    expect(listHeaders.get("pageSize")).toBe("10");
    expect(listHeaders.get("sort")).toBe("name");
    expect(listHeaders.get("order")).toBe("asc");
    expect(listHeaders.get("role")).toBe("admin");
    expect(listHeaders.get("X-Test")).toBe("1");
    expect(calls[1].headers!.get("page")).toBeNull();
    expect(calls[1].headers!.get("X-Test")).toBe("1");
    expect(calls[2].headers!.get("page")).toBeNull();
  });

  it("createApiDataSource：只传 /api 才拼当前路由；传入 /api/admins 则不再取", () => {
    const g = globalThis as { location?: { pathname?: string } };
    const prev = Object.getOwnPropertyDescriptor(globalThis, "location");
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      writable: true,
      value: { pathname: "/rbac/admins" },
    });
    try {
      expect(createApiDataSource({ baseRoute: "/api" }).root).toBe(
        "/api/rbac/admins",
      );
      expect(createApiDataSource({ baseRoute: "/api/admins" }).root).toBe(
        "/api/admins",
      );
      expect(
        createApiDataSource({ baseRoute: "/api/admins", resource: "users" })
          .root,
      ).toBe("/api/admins");
    } finally {
      if (prev) Object.defineProperty(globalThis, "location", prev);
      else delete g.location;
    }
  });

  it("缺 baseRoute 抛错；1 段且当前路由为空时创建不抛，读 root／请求才抛；≥2 段可不传 resource", () => {
    expect(() => createApiDataSource({ baseRoute: "", resource: "u" }))
      .toThrow();
    // SSR／无 location 时允许先创建（页面也会 ...source 展开），不在此时抛错
    const pending = createApiDataSource({ baseRoute: "/api", resource: "" });
    expect(() => ({ ...pending })).not.toThrow();
    expect(() => pending.root).toThrow();
    expect(() => createApiDataSource({ baseRoute: "/api" })).not.toThrow();
    const bare = createApiDataSource({ baseRoute: "/api" });
    expect(() => bare.root).toThrow();
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      fetch: (() =>
        Promise.resolve(new Response("{}", { status: 200 }))) as typeof fetch,
    });
    expect(ds.root).toBe("/api/users");
  });

  it("无 location 时先创建，客户端补上页面路由后再请求", async () => {
    const g = globalThis as { location?: { pathname?: string } };
    const prev = Object.getOwnPropertyDescriptor(globalThis, "location");
    try {
      if (prev) delete g.location;
      const calls: { url: string }[] = [];
      const ds = createApiDataSource({
        baseRoute: "/api",
        fetch: ((input: RequestInfo | URL) => {
          calls.push({ url: String(input) });
          return Promise.resolve(
            new Response(JSON.stringify({ rows: [], total: 0 }), {
              status: 200,
            }),
          );
        }) as typeof fetch,
      });
      expect(() => ds.root).toThrow();
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        writable: true,
        value: { pathname: "/cgm/devices" },
      });
      expect(ds.root).toBe("/api/cgm/devices");
      await ds.list({ ...Q, pageSize: 20 });
      expect(calls[0]?.url.startsWith("/api/cgm/devices?")).toBe(true);
    } finally {
      if (prev) Object.defineProperty(globalThis, "location", prev);
      else delete g.location;
    }
  });
});

describe("createApiDataSource restful", () => {
  it("list／create／update／remove／import／view 路径", async () => {
    const calls: Call[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api",
      resource: "users",
      apiMode: "restful",
      fetch: mockFetch(calls, (c) => {
        if (c.method === "GET" && c.url.startsWith("/api/users?")) {
          return { json: { rows: [], total: 0 } };
        }
        if (c.method === "GET" && c.url === "/api/users/9") {
          return { json: { data: { id: "9" } } };
        }
        if (c.method === "POST" && c.url === "/api/users") {
          return { json: { ok: true } };
        }
        if (c.method === "PUT" && c.url === "/api/users/9") {
          return { json: { ok: true } };
        }
        if (c.method === "DELETE" && c.url === "/api/users/9") {
          return { json: {} };
        }
        if (
          c.method === "POST" &&
          c.url.split("?")[0] === "/api/users/remote-batch"
        ) {
          return {
            json: { removed: 1, failed: [{ id: "8", error: "boom" }] },
          };
        }
        if (c.url === "/api/users/setField") {
          return { json: { removed: 1, failed: [] } };
        }
        if (c.url === "/api/users/import") {
          return { json: { created: 1, failed: 0 } };
        }
        return { status: 404, json: {} };
      }),
    });
    await ds.list(Q);
    expect(await ds.view("9")).toEqual({ id: "9" });
    await ds.create!({ name: "n" });
    await ds.update!("9", { name: "m" });
    expect(await ds.setField!(["9"], "status", "on")).toEqual({
      removed: 1,
      failed: [],
    });
    expect(await ds.remove!(["9"])).toEqual({ removed: 1, failed: [] });
    expect(await ds.remove!(["9", "8"])).toEqual({
      removed: 1,
      failed: [{ id: "8", error: "boom" }],
    });
    await ds.importRows!([{ a: "1" }]);
    expect(calls.map((c) => `${c.method} ${c.url.split("?")[0]}`)).toEqual([
      "GET /api/users",
      "GET /api/users/9",
      "POST /api/users",
      "PUT /api/users/9",
      "POST /api/users/setField",
      "DELETE /api/users/9",
      "POST /api/users/remote-batch",
      "POST /api/users/import",
    ]);
    expect(calls[4].body).toEqual({ ids: ["9"], field: "status", value: "on" });
  });
});

describe("createApiDataSource setField 能力", () => {
  it("writable:false 不挂 setField，仍有 view／get", () => {
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      writable: false,
      fetch: (() =>
        Promise.resolve(new Response("{}", { status: 200 }))) as typeof fetch,
    });
    expect(ds.setField).toBe(undefined);
    expect(ds.create).toBe(undefined);
    expect(typeof ds.view).toBe("function");
    expect(typeof ds.get).toBe("function");
  });
});

describe("createApiDataSource 删除路径默认与覆盖", () => {
  it("action：单条 POST …/remove，批量 POST …/remote-batch；removeBatch 即使一条也走 remote-batch", async () => {
    const calls: Call[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      fetch: mockFetch(calls, (c) => {
        const path = c.url.split("?")[0];
        if (path === "/api/users/remove") {
          return { json: { removed: 1, failed: [] } };
        }
        if (path === "/api/users/remote-batch") {
          const ids = (c.body as { ids?: string[] })?.ids ?? [];
          return { json: { removed: ids.length, failed: [] } };
        }
        return { status: 404, json: { error: "no" } };
      }),
    });
    expect(await ds.remove!(["1"])).toEqual({ removed: 1, failed: [] });
    expect(await ds.remove!(["1", "2"])).toEqual({ removed: 2, failed: [] });
    expect(await ds.removeBatch!(["3"])).toEqual({ removed: 1, failed: [] });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST /api/users/remove?id=1",
      "POST /api/users/remote-batch?id=1&id=2",
      "POST /api/users/remote-batch?id=3",
    ]);
    expect(calls[1].body).toEqual({ ids: ["1", "2"], id: "1" });
    expect(calls[2].body).toEqual({ ids: ["3"], id: "3" });
  });

  it("可用 removeAction／batchRemoveAction 覆盖路径（相对段或绝对路径）", async () => {
    const calls: Call[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      removeAction: "delete-one",
      batchRemoveAction: "/custom/batch-del",
      fetch: mockFetch(calls, (c) => {
        const path = c.url.split("?")[0];
        if (path === "/api/users/delete-one" || path === "/custom/batch-del") {
          return { json: { removed: 1, failed: [] } };
        }
        return { status: 404, json: { error: "no" } };
      }),
    });
    await ds.remove!(["1"]);
    await ds.removeBatch!(["1", "2"]);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST /api/users/delete-one?id=1",
      "POST /custom/batch-del?id=1&id=2",
    ]);
  });

  it("restful：单条默认 DELETE 根/:id；显式 removeAction 后改为 POST", async () => {
    const calls: Call[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      apiMode: "restful",
      removeAction: "remove",
      fetch: mockFetch(calls, () => ({ json: { removed: 1, failed: [] } })),
    });
    await ds.remove!(["9"]);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST /api/users/remove?id=9",
    ]);
  });

  it("writable:false 不挂 remove／removeBatch", () => {
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      writable: false,
      fetch: (() =>
        Promise.resolve(new Response("{}", { status: 200 }))) as typeof fetch,
    });
    expect(ds.remove).toBe(undefined);
    expect(ds.removeBatch).toBe(undefined);
  });
});
