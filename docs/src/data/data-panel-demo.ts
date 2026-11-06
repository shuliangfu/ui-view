/**
 * @fileoverview DataPanel 文档页示例数据与列 / 搜索 / 表单定义（纯数据，无 JSX）。
 */
import type { DataPanelColumn, DataPanelDataSource, DataPanelFormField, DataPanelRow, DataPanelSearchField } from "@dreamer/ui-view/data-display";
import { createLocalDataSource } from "@dreamer/ui-view/data-display";
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

// ------------------------------------------------------------------ 单元格编辑示例

/** 单元格编辑示例的开关：为 true 时数据源拒绝保存，用来演示「保存失败 → 提示并保持原值」 */
export const cellDemoState = { fail: false };

export const CELL_ROLE_OPTIONS = [
  { value: "admin", label: "管理员", tone: "danger" as const },
  { value: "editor", label: "编辑", tone: "info" as const },
  { value: "viewer", label: "访客", tone: "default" as const },
];

export const CELL_TAG_OPTIONS = [
  { value: "vip", label: "VIP", tone: "warning" as const },
  { value: "new", label: "新用户", tone: "success" as const },
  { value: "beta", label: "内测", tone: "info" as const },
  { value: "staff", label: "员工", tone: "default" as const },
];

/** 单元格编辑示例数据：每种可编辑类型一列 */
export function makeCellRows(n = 5): DataPanelRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: NAMES[i % NAMES.length],
    score: 10 + i * 15,
    role: ["admin", "editor", "viewer"][i % 3],
    tags: [["vip"], ["new", "beta"], [], ["staff"], ["vip", "staff"]][i % 5],
    status: i % 2 === 0 ? "active" : "disabled",
    birthday: `199${i}-0${i + 1}-1${i}`,
    loginAt: new Date(2026, 0, 1 + i, 9 + i, 30).toISOString(),
    remark: `第 ${i + 1} 位用户的备注`,
  }));
}

export const CELL_COLUMNS: DataPanelColumn[] = [
  { prop: "name", label: "姓名（text）", inline: "text" },
  { prop: "score", label: "积分（number）", type: "number", inline: "number" },
  {
    prop: "role",
    label: "角色（select）",
    type: "tag",
    inline: "select",
    options: CELL_ROLE_OPTIONS,
  },
  {
    prop: "tags",
    label: "标签（multiselect）",
    type: "tag",
    inline: "multiselect",
    options: CELL_TAG_OPTIONS,
  },
  {
    prop: "status",
    label: "状态（switch）",
    type: "tag",
    inline: "switch",
    options: [
      { value: "active", label: "启用", tone: "success" },
      { value: "disabled", label: "停用", tone: "warning" },
    ],
  },
  { prop: "birthday", label: "生日（date）", type: "date", inline: "date" },
  {
    prop: "loginAt",
    label: "最近登录（datetime）",
    type: "datetime",
    inline: "datetime",
  },
  { prop: "remark", label: "备注（textarea）", inline: "textarea" },
];

/** 单元格编辑示例同款的「新增 / 编辑」表单：覆盖全部字段类型，控件均为 ui-view 自带组件 */
export const CELL_FORM: DataPanelFormField[] = [
  { name: "name", label: "姓名（text）", required: true },
  {
    name: "score",
    label: "积分（number）",
    type: "number",
    min: 0,
    initial: 0,
  },
  {
    name: "role",
    label: "角色（select）",
    type: "select",
    required: true,
    initial: "viewer",
    options: CELL_ROLE_OPTIONS,
  },
  {
    name: "tags",
    label: "标签（multiselect）",
    type: "multiselect",
    options: CELL_TAG_OPTIONS,
  },
  {
    name: "status",
    label: "状态（switch）",
    type: "switch",
    onOff: ["active", "disabled"],
    initial: "active",
  },
  { name: "birthday", label: "生日（date）", type: "date" },
  { name: "loginAt", label: "最近登录（datetime）", type: "datetime" },
  { name: "remark", label: "备注（textarea）", type: "textarea" },
];

/** 单元格编辑示例的数据源：同步本地引擎 + 可切换的「保存失败」 */
export function createCellDemoSource(): DataPanelDataSource {
  const inner = createLocalDataSource({
    rows: makeCellRows(5),
    columns: CELL_COLUMNS,
    form: CELL_FORM,
    writable: true,
  });
  return {
    ...inner,
    setField: (ids, field, value) => {
      if (cellDemoState.fail) {
        return {
          removed: 0,
          failed: ids.map((id) => ({
            id,
            error: "保存失败（演示：服务端拒绝）",
          })),
        };
      }
      return inner.setField!(ids, field, value);
    },
  } as DataPanelDataSource;
}
