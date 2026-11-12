/**
 * GET/POST /api/users — DataPanel 文档「action」自动请求列表示例假后端（**仅内存**，无数据库）。
 *
 * action 约定（createApiDataSource apiMode:"action"）：
 * - GET  /api/users
 * - POST /api/users/create（单条对象；importRows 为 `{ rows }`）
 * - POST /api/users/update（body 含 id）
 * - POST /api/users/remove（body `{ ids }`）
 */
import { json } from "@dreamer/router";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
};

const NAMES = [
  "Alice",
  "Bob",
  "Carol",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Mallory",
  "Niaj",
  "Olivia",
  "Peggy",
  "Rupert",
  "Sybil",
  "Trent",
  "Victor",
  "Walter",
  "Zoe",
];

function seed(n = 28): User[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: NAMES[i % NAMES.length]! + (i >= NAMES.length ? ` ${i}` : ""),
    email: `${NAMES[i % NAMES.length]!.toLowerCase()}${i + 1}@example.com`,
    role: ["admin", "editor", "viewer"][i % 3]!,
    status: i % 4 === 3 ? "disabled" : "active",
    balance: 100 + ((i * 137) % 900) + (i % 7) / 10,
    createdAt: new Date(2026, 0, 1 + i, 9, (i * 7) % 60).toISOString(),
  }));
}

let store: User[] = seed();
let seq = store.length;

function pathOf(req: Request): string {
  return new URL(req.url).pathname.replace(/\/+$/, "") || "/";
}

function lastSeg(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function list(req: Request) {
  const u = new URL(req.url);
  const page = Math.max(1, Number(u.searchParams.get("page") || 1) || 1);
  const pageSize = Math.max(
    1,
    Number(u.searchParams.get("pageSize") || 10) || 10,
  );
  const sort = u.searchParams.get("sort") || "";
  const order = u.searchParams.get("order") === "desc" ? "desc" : "asc";
  let rows = [...store];
  for (const key of ["name", "email", "role", "status"]) {
    const v = u.searchParams.get(key);
    if (!v) continue;
    rows = rows.filter((r) => {
      const text = String((r as Record<string, unknown>)[key] ?? "");
      return key === "name" || key === "email"
        ? text.toLowerCase().includes(v.toLowerCase())
        : text === v;
    });
  }
  if (sort) {
    const dir = order === "desc" ? -1 : 1;
    const key = sort as keyof User;
    rows.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === bv) return 0;
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
      }) * dir;
    });
  }
  const total = rows.length;
  const balance = rows.reduce((s, r) => s + (Number(r.balance) || 0), 0);
  const start = (page - 1) * pageSize;
  return json({
    items: rows.slice(start, start + pageSize),
    total,
    totals: { balance: Math.round(balance * 100) / 100 },
  });
}

function createOne(values: Record<string, unknown>): User {
  seq += 1;
  const row: User = {
    id: String(seq),
    name: String(values.name ?? ""),
    email: String(values.email ?? ""),
    role: String(values.role ?? "viewer"),
    status: String(values.status ?? "active"),
    balance: Number(values.balance) || 0,
    createdAt: new Date().toISOString(),
  };
  store = [row, ...store];
  return row;
}

/** GET /api/users */
export function GET(request: Request): Response {
  const path = pathOf(request);
  if (path === "/api/users") return list(request);
  return json({ error: "not_found" }, 404);
}

/** POST /api/users/create|update|remove（同文件 :method） */
export async function POST(request: Request): Promise<Response> {
  const action = lastSeg(pathOf(request));
  const body = await request.json().catch(() => ({})) as Record<
    string,
    unknown
  >;
  if (action === "create") {
    if (Array.isArray(body.rows)) {
      let created = 0;
      let failed = 0;
      for (const row of body.rows) {
        try {
          createOne(
            (row && typeof row === "object" ? row : {}) as Record<
              string,
              unknown
            >,
          );
          created++;
        } catch {
          failed++;
        }
      }
      return json({ ok: true, created, failed });
    }
    if (!body.name) {
      return json({
        ok: false,
        message: "姓名必填",
        fields: ["name"],
        messages: { name: "姓名必填" },
      }, 400);
    }
    return json({ ok: true, row: createOne(body) });
  }
  if (action === "update") {
    const id = body.id != null ? String(body.id) : "";
    if (!id) return json({ ok: false, message: "缺少 id" }, 400);
    const i = store.findIndex((r) => r.id === id);
    if (i < 0) return json({ ok: false, message: "not found" }, 404);
    const prev = store[i]!;
    const next: User = {
      ...prev,
      name: body.name !== undefined ? String(body.name) : prev.name,
      email: body.email !== undefined ? String(body.email) : prev.email,
      role: body.role !== undefined ? String(body.role) : prev.role,
      status: body.status !== undefined ? String(body.status) : prev.status,
      balance: body.balance !== undefined
        ? Number(body.balance) || 0
        : prev.balance,
    };
    store = [...store.slice(0, i), next, ...store.slice(i + 1)];
    return json({ ok: true, row: next });
  }
  if (action === "remove" || action === "delete") {
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) return json({ removed: 0, failed: [] }, 400);
    const set = new Set(ids);
    const next = store.filter((r) => !set.has(r.id));
    const removed = store.length - next.length;
    const failed = ids
      .filter((id) => !store.some((r) => r.id === id))
      .map((id) => ({ id, error: "not found" }));
    store = next;
    return json({ removed, failed });
  }
  return json({ error: "unknown_action", action }, 404);
}
