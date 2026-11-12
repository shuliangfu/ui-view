/**
 * /api/orders — DataPanel 文档「restful」自动请求列表示例假后端（**仅内存**，无数据库）。
 *
 * restful 约定（createApiDataSource apiMode:"restful"）：
 * - GET    /api/orders
 * - POST   /api/orders
 * - PUT    /api/orders/:id
 * - DELETE /api/orders/:id
 * - POST   /api/orders/import（importRows）
 * - GET    /api/orders/:id（明细，可选）
 */
import { json } from "@dreamer/router";

type Order = {
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

function seed(n = 24): Order[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `订单-${NAMES[i % NAMES.length]}${i >= NAMES.length ? `-${i}` : ""}`,
    email: `order${i + 1}@example.com`,
    role: ["admin", "editor", "viewer"][i % 3]!,
    status: i % 5 === 0 ? "disabled" : "active",
    balance: 50 + ((i * 89) % 800) + (i % 5) / 10,
    createdAt: new Date(2026, 1, 1 + i, 10, (i * 11) % 60).toISOString(),
  }));
}

let store: Order[] = seed();
let seq = store.length;

function pathOf(req: Request): string {
  return new URL(req.url).pathname.replace(/\/+$/, "") || "/";
}

function idSeg(path: string): string {
  const parts = path.split("/").filter(Boolean);
  // api / orders / :id
  return parts.length >= 3 ? parts[2]! : "";
}

function list(req: Request) {
  const u = new URL(req.url);
  const page = Math.max(1, Number(u.searchParams.get("page") || 1) || 1);
  const pageSize = Math.max(
    1,
    Number(u.searchParams.get("pageSize") || 20) || 20,
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
    const key = sort as keyof Order;
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

function createOne(values: Record<string, unknown>): Order {
  seq += 1;
  const row: Order = {
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

export function GET(request: Request): Response {
  const path = pathOf(request);
  if (path === "/api/orders") return list(request);
  const id = idSeg(path);
  if (!id || id === "import") return json({ error: "not_found" }, 404);
  const row = store.find((r) => r.id === id);
  if (!row) return json({ error: "not_found", id }, 404);
  return json(row);
}

export async function POST(request: Request): Promise<Response> {
  const path = pathOf(request);
  const body = await request.json().catch(() => ({})) as Record<
    string,
    unknown
  >;
  if (path === "/api/orders/import" || path.endsWith("/import")) {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    let created = 0;
    let failed = 0;
    for (const row of rows) {
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
  if (path === "/api/orders") {
    if (!body.name) {
      return json({
        ok: false,
        message: "名称必填",
        fields: ["name"],
        messages: { name: "名称必填" },
      }, 400);
    }
    return json({ ok: true, row: createOne(body) });
  }
  return json({ error: "not_found" }, 404);
}

export async function PUT(request: Request): Promise<Response> {
  const id = idSeg(pathOf(request));
  const body = await request.json().catch(() => ({})) as Record<
    string,
    unknown
  >;
  const i = store.findIndex((r) => r.id === id);
  if (i < 0) return json({ ok: false, message: "not found" }, 404);
  const prev = store[i]!;
  const next: Order = {
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

export function DELETE(request: Request): Response {
  const id = idSeg(pathOf(request));
  const i = store.findIndex((r) => r.id === id);
  if (i < 0) {
    return json({ removed: 0, failed: [{ id, error: "not found" }] }, 404);
  }
  store = [...store.slice(0, i), ...store.slice(i + 1)];
  return json({ removed: 1, failed: [] });
}
