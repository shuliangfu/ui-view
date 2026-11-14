/**
 * HTTP DataSource factory：由 `baseRoute` 解析资源根。
 *
 * `baseRoute` 去首尾 `/` 后按 `/` 分段：
 * - **≥2 段**（如 `"/api/users"`）→ 直接作资源根，不再拼 `resource` 或当前路由
 * - **仅 1 段**（如 `"/api"`）→ 优先拼显式 `resource`；未传则拼 {@link currentPageRoute}
 *   （当前页面 pathname，去掉末尾 `/` 与索引段 `index`）。
 *   例：打开 `http://127.0.0.1:8810/rbac/admins` 且 `baseRoute="/api"` → `/api/rbac/admins`。
 *   不要把 `index` 拼进路径（`/user` 或 `/user/index` 都得到 `/api/user`，不会写成 `/api/user-index`）。
 *
 * - `apiMode: "action"`（默认）：list GET 资源根；create POST …/create；
 *   update POST …/update?id=；单条删除 POST …/remove?id=（body 亦含 id / ids）；
 *   批量删除 POST …/remote-batch?id=（body 亦含 id / ids）；
 *   view GET …/view?id=；setField POST …/setField?id=（body 含 ids／id／field／value）；
 *   importRows → 同一 create 端点，body `{ rows }`（与单条对象区分）。
 * - `apiMode: "restful"`：list GET 根；create POST 根；update PUT 根/:id；
 *   单条删除 DELETE 根/:id；批量删除 POST 根/remote-batch（body `{ ids }`）；
 *   view GET 根/:id；
 *   setField POST 根/setField（body `{ ids, field, value }`）；importRows POST 根/import。
 * 路径可用 {@link ApiDataSourceOptions.removeAction}／
 * {@link ApiDataSourceOptions.batchRemoveAction} 覆盖。
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
import { DEFAULT_DATA_PANEL_PAGE_SIZE } from "./data-panel-utils.ts";

/** API 风格：action＝命名动作路径；restful＝HTTP 动词＋资源路径 */
export type ApiMode = "action" | "restful";

/** `createApiDataSource` 选项 */
export interface ApiDataSourceOptions {
  /**
   * 路由前缀或完整资源根，如 `"/api"` 或 `"/api/users"`。
   * 去首尾 `/` 后按 `/` 分段：≥2 段直接作根；仅 1 段再拼 {@link ApiDataSourceOptions.resource}，
   * 未传 `resource` 时改拼 {@link currentPageRoute}。
   */
  baseRoute: string;
  /**
   * 资源名／当前资源路由段，如 `"users"` 或 `"rbac/admins"`。
   * **仅当 `baseRoute` 只有 1 段时生效**；≥2 段时忽略。
   * 不传则自动使用当前页面路由（见 {@link currentPageRoute}）。
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
   * 为 false 时不挂 create／update／remove／removeBatch／importRows／setField（只读 list＋view）。
   * 默认 true。
   */
  writable?: boolean;
  /**
   * 列表请求默认每页条数，默认 20。
   * `list` 在 query.pageSize 缺失或非法时用此值；DataPanel 未传 `pageSize` 时也读这个默认。
   */
  pageSize?: number;
  /**
   * 单条删除路径段或绝对路径，默认 `"remove"`。
   * action 模式：POST 此路径（query 带 id，body 含 id／ids）。
   * restful 模式：缺省仍是 DELETE 根/:id；显式传入本项后改为 POST 该路径。
   * 以 `/` 开头视为绝对路径，否则拼在资源根后。
   */
  removeAction?: string;
  /**
   * 批量删除路径段或绝对路径，默认 `"remote-batch"`。
   * action 与 restful 的批量删除都是 POST 此路径（query 可带 id，body 含 ids）。
   * 以 `/` 开头视为绝对路径，否则拼在资源根后。
   */
  batchRemoveAction?: string;
}

/** HTTP 数据源：异步；额外暴露 `view`／`root`／`apiMode`（点击查看时会调 view） */
export interface ApiDataSource extends DataSource {
  sync?: false;
  /** 资源根，如 `/api/users` */
  readonly root: string;
  readonly apiMode: ApiMode;
  /** 列表默认每页条数 */
  readonly pageSize: number;
  /**
   * 拉取单条明细。
   * - action：`GET ${root}/view?id=`
   * - restful：`GET ${root}/:id`
   * 点击查看时 DataPanel 会调用此方法；失败或返回空则回落当前行。
   * {@link DataSource.get} 与本方法指向同一实现。
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
 * 把页面 pathname 收成资源路由段。
 * 去掉 query／hash、首尾 `/`，并丢掉末尾索引段 `index`（索引路由访问时可省略）。
 * 例：`/rbac/admins`、`/user/index` → `/user`、`/user/active` 保持不变。
 */
export function normalizePageRoute(pathname: string): string {
  let path = String(pathname ?? "").trim();
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h >= 0) path = path.slice(0, h);
  try {
    path = decodeURI(path);
  } catch { /* keep raw */ }
  const segs = path.replace(/^\/+/, "").replace(/\/+$/, "").split("/").filter((
    s,
  ) => s !== "");
  while (segs.length && segs[segs.length - 1] === "index") segs.pop();
  return segs.length ? `/${segs.join("/")}` : "/";
}

/** 当前页面访问路由，如打开 `http://127.0.0.1:8810/rbac/admins` 得到 `/rbac/admins`。 */
export function currentPageRoute(): string {
  const loc = (globalThis as { location?: { pathname?: string } }).location;
  return normalizePageRoute(String(loc?.pathname ?? ""));
}

/**
 * 由 `baseRoute`（＋可选 `resource`／当前页面路由）解析资源根。
 * - 传入较完整路径（去首尾 `/` 后 **≥2** 段，如 `"/api/admins"`）→ 直接作根，不再自动取当前页面路由，也不再拼 `resource`
 * - **只传** `"/api"` 这类 1 段前缀 → 再拼显式 `resource`；未传则拼 `pageRoute`（默认 {@link currentPageRoute}）
 *   例：当前页 `/rbac/admins` → `/api/rbac/admins`
 * - 不要把 `index` 拼进结果（由 {@link normalizePageRoute} 去掉）
 * @param pageRoute 可注入的当前路由（单测／SSR）；不传则读 `location.pathname`
 */
export function resolveApiRoot(
  baseRoute: string,
  resource?: string,
  pageRoute?: string,
): string {
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
    const explicit = String(resource ?? "").trim();
    const page = normalizePageRoute(pageRoute ?? currentPageRoute());
    const res = explicit || (page !== "/" ? page : "");
    if (!res) {
      throw new Error(
        'createApiDataSource: "resource" is required when baseRoute has only one segment and the current page route is empty (e.g. baseRoute:"/api" on "/rbac/admins" → "/api/rbac/admins")',
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

/**
 * 把 list 查询参数同步写入请求头，键名与 query 一致（page、pageSize、sort、order 以及 filters）。
 * 仅列表请求使用，方便服务端渲染按 Header 读取分页等信息。
 */
export function apiListQueryHeaders(query: Query): Headers {
  const h = new Headers();
  apiQueryParams(query).forEach((value, key) => {
    if (value === "") return;
    // Headers 只接受 ByteString，中文等值先按 URI 分量编码。
    h.set(key, encodeURIComponent(value));
  });
  return h;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** 从常见响应壳里取出 list 载荷 */
export function normalizeListPayload(body: unknown): ListResult {
  if (!isRecord(body)) return { rows: [], total: 0 };
  const inner = isRecord(body.data) &&
      (Array.isArray(body.data.rows) || Array.isArray(body.data.items) ||
        typeof body.data.total === "number")
    ? body.data
    : body;
  // 官方键为 rows；没有 rows 时再接受 items（已部署接口过渡兼容）
  const rowsRaw = Array.isArray(inner.rows)
    ? inner.rows
    : Array.isArray(inner.items)
    ? inner.items
    : (Array.isArray(body.data) ? body.data : []);
  const rows = rowsRaw as Row[];
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

/**
 * 从失败响应体取可读文案。
 * 兼容顶层 `message`／`error`／`msg`，以及 CSRF 等嵌套 `{ error: { message } }`。
 */
function messageFromBody(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  const top = body.message ?? body.error ?? body.msg;
  if (typeof top === "string" && top) return top;
  // @dreamer/middlewares csrf：{ error: { code, message, status } }
  if (isRecord(top)) {
    const nested = top.message ?? top.msg;
    if (typeof nested === "string" && nested) return nested;
  }
  return fallback;
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
 * 创建时不读取当前页面路由；服务端渲染没有 `location` 也不会抛错，
 * 真正请求或读取 {@link ApiDataSource.root} 时再解析。
 *
 * ```ts
 * // 推荐：baseRoute 只传 "/api"，自动拼当前页面路由
 * // 打开 /rbac/admins → GET /api/rbac/admins
 * const ds = createApiDataSource({ baseRoute: "/api" });
 * // 仍可显式指定 resource，或把完整根写在 baseRoute 里
 * const ds2 = createApiDataSource({ baseRoute: "/api", resource: "users" });
 * const ds3 = createApiDataSource({ baseRoute: "/api/users" });
 * // restful
 * const rest = createApiDataSource({
 *   baseRoute: "/api/users", apiMode: "restful",
 * });
 * ```
 *
 * 面板亦可透传 `baseRoute`／`resource`／`apiMode`：未传 `dataSource` 时内部生成 API 源
 * （优先级：`dataSource` ＞ `baseRoute` ＞ 只传 `data`）。同时传 `data` 和 `baseRoute` 时
 * 首屏用 `data`、挂载不拉 list，刷新／翻页再请求。`onImportRows` 仍可接管导入。
 */
export function createApiDataSource(
  opts: ApiDataSourceOptions,
): ApiDataSource {
  const mode: ApiMode = opts.apiMode === "restful" ? "restful" : "action";
  const rowKey = opts.rowKey ?? "id";
  if (!String(opts.baseRoute ?? "").trim()) {
    throw new Error('createApiDataSource: "baseRoute" is required');
  }
  /** 请求或读取 `root` 时再解析，避免 SSR 尚无 location 时在创建阶段抛错。 */
  const apiRoot = (): string => resolveApiRoot(opts.baseRoute, opts.resource);
  const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const writable = opts.writable !== false;
  const pageSizeDefault = (() => {
    const n = opts.pageSize;
    if (typeof n === "number" && Number.isFinite(n) && n >= 1) {
      return Math.floor(n);
    }
    return DEFAULT_DATA_PANEL_PAGE_SIZE;
  })();

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
    extraHeaders?: HeadersInit,
  ): Promise<{ ok: boolean; status: number; body: unknown }> {
    const h = await headers();
    if (extraHeaders) {
      new Headers(extraHeaders).forEach((v, k) => h.set(k, v));
    }
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

  function withItemIds(url: string, ids: string[]): string {
    const q = new URLSearchParams();
    for (const id of ids) {
      const v = String(id ?? "").trim();
      if (v) q.append("id", v);
    }
    const s = q.toString();
    return s ? `${url}?${s}` : url;
  }

  const src = {
    apiMode: mode,
    pageSize: pageSizeDefault,
    async list(query) {
      const size = typeof query.pageSize === "number" &&
          Number.isFinite(query.pageSize) && query.pageSize >= 1
        ? Math.floor(query.pageSize)
        : pageSizeDefault;
      const listQuery = { ...query, pageSize: size };
      const qs = apiQueryParams(listQuery).toString();
      const root = apiRoot();
      const url = qs ? `${root}?${qs}` : root;
      const r = await request(
        "GET",
        url,
        undefined,
        apiListQueryHeaders(listQuery),
      );
      if (!r.ok) return { rows: [], total: 0 };
      return normalizeListPayload(r.body);
    },
    async view(id: string) {
      const root = apiRoot();
      const url = mode === "action"
        ? withItemIds(joinApiPath(root, "view"), [id])
        : joinApiPath(root, id);
      const r = await request("GET", url);
      if (!r.ok) return null;
      const body = r.body;
      if (isRecord(body)) {
        if (isRecord(body.data)) return body.data as Row;
        if (isRecord(body.row)) return body.row as Row;
        // 整包当行（排除明显的列表壳）
        if (!Array.isArray(body.items) && !Array.isArray(body.rows)) {
          return body as Row;
        }
      }
      return null;
    },
  } as ApiDataSource;

  Object.defineProperty(src, "root", {
    configurable: true,
    enumerable: false,
    get: apiRoot,
  });

  src.get = (id) => src.view(id);

  if (!writable) return src;

  src.create = async (values) => {
    const root = apiRoot();
    const url = mode === "action" ? joinApiPath(root, "create") : root;
    const r = await request("POST", url, values);
    return writeFromResponse(r.ok, r.body);
  };

  src.update = async (id, values) => {
    if (mode === "action") {
      const r = await request(
        "POST",
        withItemIds(joinApiPath(apiRoot(), "update"), [id]),
        {
          [rowKey]: id,
          id,
          ...values,
        },
      );
      return writeFromResponse(r.ok, r.body);
    }
    const r = await request("PUT", joinApiPath(apiRoot(), id), values);
    return writeFromResponse(r.ok, r.body);
  };

  const removeActionPath = (raw: string | undefined, fallback: string) => {
    const seg = (raw ?? "").trim() || fallback;
    return seg.startsWith("/") ? seg : joinApiPath(apiRoot(), seg);
  };

  const postRemove = async (path: string, ids: string[]) => {
    const r = await request(
      "POST",
      withItemIds(path, ids),
      { ids, id: ids[0] },
    );
    return bulkFromBody(r.body, ids, r.ok);
  };

  const deleteOneRestful = async (ids: string[]) => {
    const failed: { id: string; error: string }[] = [];
    let removed = 0;
    for (const id of ids) {
      try {
        const r = await request("DELETE", joinApiPath(apiRoot(), id));
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

  /** 单条删除：action 默认 POST …/remove；restful 默认 DELETE 根/:id。多 id 回落批量。 */
  src.remove = (ids) => {
    if (ids.length > 1) return src.removeBatch!(ids);
    if (mode === "action") {
      return postRemove(removeActionPath(opts.removeAction, "remove"), ids);
    }
    if ((opts.removeAction ?? "").trim()) {
      return postRemove(removeActionPath(opts.removeAction, "remove"), ids);
    }
    return deleteOneRestful(ids);
  };

  /** 批量删除：默认 POST …/remote-batch（可用 batchRemoveAction 覆盖）。 */
  src.removeBatch = (ids) =>
    postRemove(
      removeActionPath(opts.batchRemoveAction, "remote-batch"),
      ids,
    );

  src.setField = async (ids, field, value) => {
    const url = joinApiPath(apiRoot(), "setField");
    if (mode === "action") {
      const r = await request(
        "POST",
        withItemIds(url, ids),
        { ids, id: ids[0], field, value },
      );
      return bulkFromBody(r.body, ids, r.ok);
    }
    const r = await request("POST", url, { ids, field, value });
    return bulkFromBody(r.body, ids, r.ok);
  };

  src.importRows = async (rows) => {
    if (mode === "action") {
      // 无单独 import：走 create，body 用 { rows } 与单条对象区分
      const r = await request("POST", joinApiPath(apiRoot(), "create"), {
        rows,
      });
      return importFromBody(r.body, rows.length, r.ok);
    }
    const r = await request("POST", joinApiPath(apiRoot(), "import"), { rows });
    return importFromBody(r.body, rows.length, r.ok);
  };

  return src;
}
