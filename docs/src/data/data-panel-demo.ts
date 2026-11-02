/**
 * @fileoverview DataPanel 文档页示例数据与列 / 搜索 / 表单定义（纯数据，无 JSX）。
 */
import type {
  DataPanelColumn,
  DataPanelDataSource,
  DataPanelFormField,
  DataPanelRow,
  DataPanelSearchField,
} from "@dreamer/ui-view";
import { createLocalDataSource } from "@dreamer/ui-view";

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
  "Liang",
  "Wei",
  "Mei",
  "Chen",
  "Hao",
];

/** 生成演示用户（可复现） */
export function makeDemoRows(n = 25): DataPanelRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i}` : ""),
    email: `${NAMES[i % NAMES.length].toLowerCase()}${i + 1}@example.com`,
    role: ["admin", "editor", "viewer"][i % 3],
    status: i % 4 === 3 ? "disabled" : "active",
    balance: 100 + ((i * 137) % 900) + (i % 7) / 10,
    score: (i * 7) % 100,
    createdAt: new Date(2026, 0, 1 + i, 9, (i * 7) % 60).toISOString(),
    locked: i === 0,
  }));
}

export const DEMO_COLUMNS: DataPanelColumn[] = [
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    sortable: true,
    total: true,
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    sortable: true,
    hidden: true,
  },
];

export const DEMO_SEARCH: DataPanelSearchField[] = [
  { name: "name", label: "姓名" },
  {
    name: "role",
    label: "角色",
    type: "select",
    options: [
      { value: "admin", label: "管理员" },
      { value: "editor", label: "编辑" },
      { value: "viewer", label: "访客" },
    ],
  },
  {
    name: "status",
    label: "状态",
    type: "select",
    options: [
      { value: "active", label: "启用" },
      { value: "disabled", label: "停用" },
    ],
  },
];

export const DEMO_FORM: DataPanelFormField[] = [
  { name: "name", label: "姓名", required: true, placeholder: "请输入姓名" },
  {
    name: "email",
    label: "邮箱",
    required: true,
    pattern: "^[^@\\s]+@[^@\\s]+$",
  },
  {
    name: "role",
    label: "角色",
    type: "select",
    required: true,
    initial: "viewer",
    options: [
      { value: "admin", label: "管理员" },
      { value: "editor", label: "编辑" },
      { value: "viewer", label: "访客" },
    ],
  },
  { name: "balance", label: "余额", type: "number", min: 0, initial: 0 },
  {
    name: "status",
    label: "启用",
    type: "switch",
    onOff: ["active", "disabled"],
    initial: "active",
  },
];

export const DEMO_STATUS_VALUES = [
  { value: "active", label: "启用" },
  { value: "disabled", label: "停用" },
];

/** 模拟远程接口：异步 + 延迟，内部复用本地引擎做过滤 / 排序 / 分页 */
export function createRemoteDemoSource(latency = 400): DataPanelDataSource {
  const inner = createLocalDataSource({
    rows: makeDemoRows(60),
    columns: DEMO_COLUMNS,
    search: DEMO_SEARCH,
    form: DEMO_FORM,
  });
  const wait = <T>(v: T) =>
    new Promise<T>((r) => setTimeout(() => r(v), latency));
  return {
    list: (q) => wait(inner.list(q)),
    create: (v) => wait(inner.create!(v)),
    update: (id, v) => wait(inner.update!(id, v)),
    remove: (ids) => wait(inner.remove!(ids)),
    setField: (ids, f, v) => wait(inner.setField!(ids, f, v)),
    importRows: (rows) => wait(inner.importRows!(rows)),
  };
}
