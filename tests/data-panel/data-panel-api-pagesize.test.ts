/**
 * @fileoverview createApiDataSource 可配置 pageSize。
 */
import { describe, expect, it } from "@dreamer/test";
import { createApiDataSource } from "../../src/desktop/data-display/data-panel-api-source.ts";
import type { Query } from "../../src/desktop/data-display/data-panel-types.ts";

function baseQuery(pageSize?: number): Query {
  const q: Query = {
    page: 1,
    pageSize: pageSize ?? (undefined as unknown as number),
    sort: "",
    order: "asc",
    filters: {},
  };
  return q;
}

describe("createApiDataSource pageSize", () => {
  it("未配置时默认 20，并在 list 请求里带上", async () => {
    const urls: string[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      fetch: ((input: RequestInfo | URL) => {
        urls.push(String(input));
        return Promise.resolve(
          new Response(JSON.stringify({ items: [], total: 0 }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }) as typeof fetch,
    });
    expect(ds.pageSize).toBe(20);
    await ds.list(baseQuery());
    const u = new URL(urls[0]!, "http://local");
    expect(u.searchParams.get("pageSize")).toBe("20");
  });

  it("opts.pageSize 作为默认，query.pageSize 优先", async () => {
    const urls: string[] = [];
    const ds = createApiDataSource({
      baseRoute: "/api/users",
      pageSize: 50,
      fetch: ((input: RequestInfo | URL) => {
        urls.push(String(input));
        return Promise.resolve(
          new Response(JSON.stringify({ items: [], total: 0 }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }) as typeof fetch,
    });
    expect(ds.pageSize).toBe(50);
    await ds.list(baseQuery());
    expect(new URL(urls[0]!, "http://local").searchParams.get("pageSize")).toBe(
      "50",
    );
    urls.length = 0;
    await ds.list(baseQuery(10));
    expect(new URL(urls[0]!, "http://local").searchParams.get("pageSize")).toBe(
      "10",
    );
  });
});
