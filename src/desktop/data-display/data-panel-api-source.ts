/**
 * HTTP DataSource factory：显式 `baseRoute`（＋可选 `resource`），勿用页面 pathname 猜资源。
 *
 * `baseRoute` 去首尾 `/` 后按 `/` 分段：
 * - **≥2 段**（如 `"/api/users"`）→ 直接作资源根，不再拼 `resource`
 * - **仅 1 段**（如 `"/api"`）→ 再拼 `resource`（当前资源路由段）
 *
 * - `apiMode: "action"`（默认）：list GET 资源根；create POST …/create；
 *   update POST …/update（body 含 id）；remove POST …/remove（body `{ ids }`）；
 *   view GET …/view/:id；importRows → 同一 create 端点，body `{ rows }`（与单条对象区分）。
 * - `apiMode: "restful"`：list GET 根；create POST 根；update PUT 根/:id；
 *   remove 对每个 id DELETE 根/:id；view GET 根/:id；importRows POST 根/import。
 *
 * 仍可用手写 {@link DataSource} 或面板 `onImportRows` 作逃生口。
 */
import type {
  BulkResult,
  DataSource,
  ImportResult,
  ListResult,
  Query,
  Row,
  WriteResult,
} from "./data-panel-types.ts";

/** API 风格：action＝命名动作路径；restful＝HTTP 动词＋资源路径 */
export type ApiMode = "action" | "restful";

/** `createApiDataSource` 选项 */
export interface ApiDataSourceOptions {
  /**
   * 路由前缀或完整资源根，如 `"/api"` 或 `"/api/users"`。
   * 去首尾 `/` 后按 `/` 分段：≥2 段直接作根；仅 1 段再拼 {@link ApiDataSourceOptions.resource}。
   */
  baseRoute: string;
  /**
   * 资源名／当前资源路由段，如 `"users"`。
   * **仅当 `baseRoute` 只有 1 段时必填**（拼成 `/api/users`）；≥2 段时忽略。
   * 勿从页面 pathname 推断。
   */
  resource?: string;
  /** 默认 `"action"` */
  apiMode?: ApiMode;
  /** 主键字段（restful 的 URL /:id 与 update body），默认 `"id"` */
  rowKey?: string;
  /** 自定义 fetch（缺省 `globalThis.fetch`）；单测可注入 */
  fetch?: typeof globalThis.fetch;
  /** 固定请求头，或返回头的函数 */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** 传给 fetch 的 credentials */
  credentials?: RequestCredentials;
  /**
   * 为 false 时不挂 create／update／remove／importRows（只读 list＋view）。
   * 默认 true。
   */
  writable?: boolean;
}

/** HTTP 数据源：异步；额外暴露 `view`／`root`／`apiMode`（面板暂不自动调 view） */
export interface ApiDataSource extends DataSource {
  sync?: false;
  /** 资源根，如 `/api/users` */
  readonly root: string;
  readonly apiMode: ApiMode;
  /**
   * 拉取单条明细。
   * - action：`GET ${root}/view/:id`
   * - restful：`GET ${root}/:id`
   * DataSource 接口暂无 view 钩子；面板详情仍走当前行数据。调用方可自行预取。
   */
  view(id: string): Promise<Row | null>;
}

function trimSlashes(
  s: string,
  ends: "start" | "end" | "both" = "both",
): string {
  let out = s;
  if (ends === "start" || ends === "both") out = out.replace(/^\/+/, "");
  if (ends === "end" || ends === "both") out = out.replace(/\/+$/, "");
  return out;
}

/** 拼接 URL 路径段（保留首段前导／协议感；去掉多余斜杠） */
export function joinApiPath(...parts: string[]): string {
  if (!parts.length) return "";
  const head = String(parts[0] ?? "").replace(/\/+$/, "");
  const rest = parts.slice(1).map((p) => trimSlashes(String(p ?? ""), "both"))
    .filter((p) => p !== "");
  if (!rest.length) return head || "/";
  if (!head || head === "/") return `/${rest.join("/")}`;
  return `${head}/${rest.join("/")}`;
}

/**
 * 由 `baseRoute`（＋可选 `resource`）解析资源根。
 * - `baseRoute` 去首尾 `/` 分段后 **≥2** → `"/" + segments.join("/")`（不再拼 resource）
 * - **仅 1 段** → 再拼 `resource`（缺 resource 抛错）
 */
export function resolveApiRoot(baseRoute: string, resource?: string): string {
  const raw = String(baseRoute ?? "").trim();
  if (!raw) {
    throw new Error('createApiDataSource: "baseRoute" is required');
  }
  const segments = raw.replace(/^\/+/, "").replace(/\/+$/, "").split("/")
    .filter(
      (s) => s !== "",
    );
  if (segments.length >= 2) {
    return `/${segments.join("/")}`;
  }
  if (segments.length === 1) {
    const res = String(resource ?? "").trim();
    if (!res) {
      throw new Error(
        'createApiDataSource: "resource" is required when baseRoute has only one segment (e.g. baseRoute:"/api", resource:"users")',
      );
    }
    return joinApiPath(`/${segments[0]}`, res);
  }
  throw new Error('createApiDataSource: "baseRoute" is required');
}

/** list 查询 → URLSearchParams（page／pageSize／sort／order＋filters 扁平键） */
export function apiQueryParams(query: Query): URLSearchParams {
  const p = new URLSearchParams();
  p.set("page", String(query.page));
  p.set("pageSize", String(query.pageSize));
  if (query.sort) {
    p.set("sort", query.sort);
    p.set("order", query.order === "desc" ? "desc" : "asc");
  }
  for (const [k, v] of Object.entries(query.filters ?? {})) {
    if (v !== "") p.set(k, v);
  }
  return p;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** 从常见响应壳里取出 list 载荷 */
export function normalizeListPayload(body: unknown): ListResult {
  if (!isRecord(body)) return { rows: [], total: 0 };
  const inner = isRecord(body.data) &&
      (Array.isArray(body.data.rows) || typeof body.data.total === "number")
    ? body.data
    : body;
  const rowsRaw = inner.rows ?? (Array.isArray(body.data) ? body.data : []);
  const rows = Array.isArray(rowsRaw) ? rowsRaw as Row[] : [];
  const totalRaw = inner.total;
  const total = typeof totalRaw === "number" && Number.isFinite(totalRaw)
    ? totalRaw
    : rows.length;
  const totals = isRecord(inner.totals)
    ? Object.fromEntries(
      Object.entries(inner.totals).filter(([, v]) => typeof v === "number"),
    ) as Record<string, number>
    : undefined;
  return totals && Object.keys(totals).length
    ? { rows, total, totals }
    : { rows, total };
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  const m = body.message ?? body.error ?? body.msg;
  return typeof m === "string" && m ? m : fallback;
}

function writeFromResponse(
  okHttp: boolean,
  body: unknown,
): WriteResult {
  if (isRecord(body) && body.ok === false) {
    return {
      ok: false,
      message: messageFromBody(body, "request failed"),
      fields: Array.isArray(body.fields)
        ? body.fields.filter((x): x is string => typeof x === "string")
        : undefined,
      messages: isRecord(body.messages)
        ? Object.fromEntries(
          Object.entries(body.messages).filter(([, v]) =>
            typeof v === "string"
          ),
        ) as Record<string, string>
        : undefined,
    };
  }
  if (!okHttp) {
    return { ok: false, message: messageFromBody(body, "request failed") };
  }
  if (isRecord(body) && body.ok === true) return { ok: true };
  return { ok: true };
}

function bulkFromBody(
  body: unknown,
  ids: string[],
  okHttp: boolean,
): BulkResult {
  if (!okHttp) {
    const err = messageFromBody(body, "request failed");
    return { removed: 0, failed: ids.map((id) => ({ id, error: err })) };
  }
  if (!isRecord(body)) {
    return { removed: ids.length, failed: [] };
  }
  const removed = typeof body.removed === "number"
    ? body.removed
    : typeof body.deleted === "number"
    ? body.deleted
    : ids.length;
  const failedRaw = body.failed;
  const failed = Array.isArray(failedRaw)
    ? failedRaw
      .map((f) => {
        if (!isRecord(f)) return null;
        const id = f.id != null ? String(f.id) : "";
        const error = typeof f.error === "string" ? f.error : "failed";
        return id ? { id, error } : null;
      })
      .filter((x): x is { id: string; error: string } => !!x)
    : [];
  return { removed, failed };
}

function importFromBody(
  body: unknown,
  rowCount: number,
  okHttp: boolean,
): ImportResult {
  if (!okHttp) return { created: 0, failed: rowCount };
  if (!isRecord(body)) return { created: rowCount, failed: 0 };
  const created = typeof body.created === "number" ? body.created : rowCount;
  const failed = typeof body.failed === "number" ? body.failed : 0;
  return { created, failed };
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

/**
 * 创建基于 `baseRoute`（＋可选 `resource`）的远程 {@link DataSource}。
 *
 * ```ts
 * // 1 段：再拼 resource
 * const ds = createApiDataSource({ baseRoute: "/api", resource: "users" });
 * // ≥2 段：直接作根
 * const ds2 = createApiDataSource({ baseRoute: "/api/users" });
 * // restful
 * const rest = createApiDataSource({
 *   baseRoute: "/api/users", apiMode: "restful",
 * });
 * ```
 *
 * 面板亦可透传 `baseRoute`／`resource`／`apiMode`：**仅当未传 `data` 且未传 `dataSource`**
 * 时内部生成并拉 list（优先级：`dataSource` ＞ `data` ＞ API）。`onImportRows` 仍可接管导入。
 */
export function createApiDataSource(
  opts: ApiDataSourceOptions,
): ApiDataSource {
  const mode: ApiMode = opts.apiMode === "restful" ? "restful" : "action";
  const rowKey = opts.rowKey ?? "id";
  const root = resolveApiRoot(opts.baseRoute, opts.resource);
  const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const writable = opts.writable !== false;

  async function headers(): Promise<Headers> {
    const h = new Headers({ Accept: "application/json" });
    const extra = typeof opts.headers === "function"
      ? await opts.headers()
      : opts.headers;
    if (extra) {
      const e = new Headers(extra);
      e.forEach((v, k) => h.set(k, v));
    }
    return h;
  }

  async function request(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<{ ok: boolean; status: number; body: unknown }> {
    const h = await headers();
    const init: RequestInit = {
      method,
      headers: h,
      credentials: opts.credentials,
    };
    if (body !== undefined) {
      if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }
    const res = await doFetch(url, init);
    const parsed = await readBody(res);
    return { ok: res.ok, status: res.status, body: parsed };
  }

  const src: ApiDataSource = {
    root,
    apiMode: mode,
    async list(query) {
      const qs = apiQueryParams(query).toString();
      const url = qs ? `${root}?${qs}` : root;
      const r = await request("GET", url);
      if (!r.ok) return { rows: [], total: 0 };
      return normalizeListPayload(r.body);
    },
    async view(id: string) {
      const url = mode === "action"
        ? joinApiPath(root, "view", id)
        : joinApiPath(root, id);
      const r = await request("GET", url);
      if (!r.ok) return null;
      const body = r.body;
      if (isRecord(body)) {
        if (isRecord(body.data)) return body.data as Row;
        if (isRecord(body.row)) return body.row as Row;
        // 整包当行（排除明显的列表壳）
        if (!Array.isArray(body.rows)) return body as Row;
      }
      return null;
    },
  };

  if (!writable) return src;

  src.create = async (values) => {
    const url = mode === "action" ? joinApiPath(root, "create") : root;
    const r = await request("POST", url, values);
    return writeFromResponse(r.ok, r.body);
  };

  src.update = async (id, values) => {
    if (mode === "action") {
      const r = await request("POST", joinApiPath(root, "update"), {
        [rowKey]: id,
        id,
        ...values,
      });
      return writeFromResponse(r.ok, r.body);
    }
    const r = await request("PUT", joinApiPath(root, id), values);
    return writeFromResponse(r.ok, r.body);
  };

  src.remove = async (ids) => {
    if (mode === "action") {
      const r = await request("POST", joinApiPath(root, "remove"), { ids });
      return bulkFromBody(r.body, ids, r.ok);
    }
    // restful：逐条 DELETE；汇总 removed／failed
    const failed: { id: string; error: string }[] = [];
    let removed = 0;
    for (const id of ids) {
      try {
        const r = await request("DELETE", joinApiPath(root, id));
        if (r.ok) removed++;
        else {
          failed.push({
            id,
            error: messageFromBody(r.body, `HTTP ${r.status}`),
          });
        }
      } catch (e) {
        failed.push({
          id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { removed, failed };
  };

  src.importRows = async (rows) => {
    if (mode === "action") {
      // 无单独 import：走 create，body 用 { rows } 与单条对象区分
      const r = await request("POST", joinApiPath(root, "create"), { rows });
      return importFromBody(r.body, rows.length, r.ok);
    }
    const r = await request("POST", joinApiPath(root, "import"), { rows });
    return importFromBody(r.body, rows.length, r.ok);
  };

  return src;
}
