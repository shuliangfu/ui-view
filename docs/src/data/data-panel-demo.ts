/**
 * @fileoverview DataPanel 文档页示例数据与列 / 搜索 / 表单定义（纯数据，无 JSX）。
 */
import type {
  Column,
  DataSource,
  FormField,
  Row,
  RowActionsConfig,
  SearchField,
} from "@dreamer/ui-view/data-display";
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
export function makeDemoRows(n = 25): Row[] {
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

/** 文档 DEMO 默认操作列：多数仅 view＋edit（remove:false 与实机一致，避免 caps 补删除）；自定义／控显隐见专门示例 */
export const DEMO_ROW_ACTIONS: RowActionsConfig = {
  view: true,
  edit: true,
  remove: false,
};

export const DEMO_COLUMNS: Column[] = [
  {
    type: "selection",
    // David、Eve 两行禁止勾选（全选会跳过，也不能进批量栏）
    disable: (row) => row.id === "4" || row.id === "5",
  },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    /** 标签列：表头与单元格居中 */
    align: "center",
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
    align: "center",
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
    /** 金额：单元格／合计右对齐；表头单独居中（演示 headerAlign） */
    align: "right",
    headerAlign: "center",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
  { type: "actions", actions: DEMO_ROW_ACTIONS },
];

/**
 * 列对齐专用示例列（精简）：标签居中、金额右对齐且表头居中。
 * 多选／序号／操作列固定居中，无需配置。
 */
export const ALIGN_DEMO_COLUMNS: Column[] = [
  { type: "selection" },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true },
  { prop: "email", label: "邮箱" },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    total: true,
    align: "right",
    headerAlign: "center",
  },
  { type: "actions", actions: { view: true, edit: false, remove: false } },
];

/** 与 {@link ALIGN_DEMO_COLUMNS} 同步的代码示例 */
export const ALIGN_DEMO_COLUMNS_CODE = `const columns: Column[] = [
  { type: "selection" }, // 多选：固定居中
  { type: "index" },     // 序号：固定居中
  { prop: "name", label: "姓名", sortable: true }, // 默认居中
  { prop: "email", label: "邮箱" },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center", // 表头＋单元格居中
    options: [
      { value: "admin", label: "管理员", tone: "danger" },
      { value: "editor", label: "编辑", tone: "info" },
      { value: "viewer", label: "访客", tone: "default" },
    ],
  },
  {
    prop: "balance",
    label: "余额",
    type: "money",
    total: true,
    align: "right",        // 单元格／合计右对齐
    headerAlign: "center", // 表头单独居中
  },
  { type: "actions", actions: { view: true, edit: false, remove: false } }, // 操作：固定居中
];`;

/** 与 {@link DEMO_COLUMNS} 同步的文档 code 片段（系统列短写法） */
export const DEMO_COLUMNS_CODE = `const columns: Column[] = [
  {
    type: "selection",
    disable: (row) => row.id === "4" || row.id === "5", // David、Eve 禁止勾选
  },
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true, inline: "text" },
  { prop: "email", label: "邮箱", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    align: "center",
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
    align: "center",
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
    align: "right",
    headerAlign: "center",
  },
  {
    prop: "score",
    label: "积分",
    type: "number",
    sortable: true,
    inline: "number",
    align: "right",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    type: "datetime",
    format: "YYYY-MM-DD HH:mm",
    sortable: true,
    hidden: true,
  },
  { type: "actions", actions: {
    view: true,
    edit: true,
    remove: false,
  } },
];`;

/** 把操作配置挂到 DEMO_COLUMNS 的 actions 列（docs／测挂操作配置到 actions 列） */
export function withRowActions(actions: RowActionsConfig): Column[] {
  return DEMO_COLUMNS.map((c) => c.type === "actions" ? { ...c, actions } : c);
}

/** 键用 prop；options／label 可从 DEMO_COLUMNS 同 prop 继承（面板内 enrich） */
export const DEMO_SEARCH: SearchField[] = [
  {
    prop: "name",
    placeholder: "姓名关键字",
    hint: "支持模糊匹配",
    maxlength: 40,
  },
  { prop: "role", type: "select" },
  { prop: "status", type: "select" },
];

export const DEMO_FORM: FormField[] = [
  { prop: "name", required: true, placeholder: "请输入姓名" },
  {
    prop: "email",
    required: true,
    pattern: "^[^@\\s]+@[^@\\s]+$",
  },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  // switch 开／关值从同 prop 列两档 options 继承，无需 onOff
  { prop: "status", type: "switch", initial: "active" },
];

/** 文档「校验／尺寸」示例用的富表单（rules／hint／span／maxlength） */
export const DEMO_FORM_RICH: FormField[] = [
  {
    prop: "name",
    placeholder: "请输入姓名",
    hint: "2–20 个字符",
    maxlength: 20,
    span: 6,
    rules: [
      { required: true, message: "姓名不能为空" },
      { min: 2, max: 20, message: "姓名长度 2–20" },
    ],
  },
  {
    prop: "email",
    placeholder: "name@example.com",
    span: 6,
    rules: [
      { required: true, message: "邮箱不能为空" },
      { type: "email", message: "邮箱格式不正确" },
    ],
  },
  { prop: "role", type: "select", required: true, initial: "viewer", span: 6 },
  { prop: "balance", type: "number", min: 0, initial: 0, span: 6 },
  {
    prop: "status",
    type: "switch",
    initial: "active",
    span: 12,
    hint: "行内亦可切换",
  },
];


/** 文档示例展示用源码，与上方运行时定义同步（读者能在示例里看到变量怎么写）。 */
export const MAKE_DEMO_ROWS_CODE = `const NAMES = [
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
function makeDemoRows(n = 25): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? \` \${i}\` : ""),
    email: \`\${NAMES[i % NAMES.length].toLowerCase()}\${i + 1}@example.com\`,
    role: ["admin", "editor", "viewer"][i % 3],
    status: i % 4 === 3 ? "disabled" : "active",
    balance: 100 + ((i * 137) % 900) + (i % 7) / 10,
    score: (i * 7) % 100,
    createdAt: new Date(2026, 0, 1 + i, 9, (i * 7) % 60).toISOString(),
    locked: i === 0,
  }));
}
`;

export const DEMO_SEARCH_CODE = `const search: SearchField[] = [
  {
    prop: "name",
    placeholder: "姓名关键字",
    hint: "支持模糊匹配",
    maxlength: 40,
  },
  { prop: "role", type: "select" },
  { prop: "status", type: "select" },
];
`;

export const DEMO_FORM_CODE = `const form: FormField[] = [
  { prop: "name", required: true, placeholder: "请输入姓名" },
  {
    prop: "email",
    required: true,
    pattern: "^[^@\\\\s]+@[^@\\\\s]+$",
  },
  { prop: "role", type: "select", required: true, initial: "viewer" },
  { prop: "balance", type: "number", min: 0, initial: 0 },
  // switch 开／关值从同 prop 列两档 options 继承，无需 onOff
  { prop: "status", type: "switch", initial: "active" },
];
`;

export const DEMO_FORM_RICH_CODE = `const form: FormField[] = [
  {
    prop: "name",
    placeholder: "请输入姓名",
    hint: "2–20 个字符",
    maxlength: 20,
    span: 6,
    rules: [
      { required: true, message: "姓名不能为空" },
      { min: 2, max: 20, message: "姓名长度 2–20" },
    ],
  },
  {
    prop: "email",
    placeholder: "name@example.com",
    span: 6,
    rules: [
      { required: true, message: "邮箱不能为空" },
      { type: "email", message: "邮箱格式不正确" },
    ],
  },
  { prop: "role", type: "select", required: true, initial: "viewer", span: 6 },
  { prop: "balance", type: "number", min: 0, initial: 0, span: 6 },
  {
    prop: "status",
    type: "switch",
    initial: "active",
    span: 12,
    hint: "行内亦可切换",
  },
];
`;

export const DEMO_HIDE_CHROME_CODE = `const hideChrome = {
  print: false,
  import: false,
  export: false,
  columns: false,
  density: false,
  fullscreen: false,
  copy: false,
} as const;
`;

export const WITH_ROW_ACTIONS_CODE = `function withRowActions(actions: RowActionsConfig): Column[] {
  return columns.map((c) => c.type === "actions" ? { ...c, actions } : c);
}
`;

/** makeDemoRows + columns + search + form，供多数 DataPanel 示例内联展示。 */
export const DEMO_COMMON_SETUP_CODE = [
  MAKE_DEMO_ROWS_CODE,
  DEMO_COLUMNS_CODE,
  DEMO_SEARCH_CODE,
  DEMO_FORM_CODE,
].join("\n\n");

/** 模拟远程接口：异步 + 延迟，内部复用本地引擎做过滤 / 排序 / 分页 */
export function createRemoteDemoSource(latency = 400): DataSource {
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
export function makeCellRows(n = 5): Row[] {
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

export const CELL_COLUMNS: Column[] = [
  { type: "selection" },
  { type: "index" },
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
  { type: "actions", actions: DEMO_ROW_ACTIONS },
];

/** 单元格编辑示例同款的「新增 / 编辑」表单：覆盖全部字段类型，控件均为 ui-view 自带组件 */
export const CELL_FORM: FormField[] = [
  { prop: "name", label: "姓名（text）", required: true },
  {
    prop: "score",
    label: "积分（number）",
    type: "number",
    min: 0,
    initial: 0,
  },
  {
    prop: "role",
    label: "角色（select）",
    type: "select",
    required: true,
    initial: "viewer",
  },
  {
    prop: "tags",
    label: "标签（multiselect）",
    type: "multiselect",
  },
  {
    prop: "status",
    label: "状态（switch）",
    type: "switch",
    initial: "active",
  },
  { prop: "birthday", label: "生日（date）", type: "date" },
  { prop: "loginAt", label: "最近登录（datetime）", type: "datetime" },
  { prop: "remark", label: "备注（textarea）", type: "textarea" },
];

/** 单元格编辑示例的数据源：同步本地引擎 + 可切换的「保存失败」 */
export function createCellDemoSource(): DataSource {
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
  } as DataSource;
}

/**
 * Docs helpers for toolbar／操作列 demos（显式 true｜false，一层真相）。
 * Pure functions — no JSX.
 */

/** Hide chrome builtins so write-order demos stay readable. */
export const DEMO_HIDE_CHROME = {
  print: false,
  import: false,
  export: false,
  columns: false,
  density: false,
  fullscreen: false,
  copy: false,
} as const;

/** 显式能力门：true 显示／false 隐藏（勿再返回 undefined 绕 caps）。 */
export function demoCapGate(allow: boolean): boolean {
  return allow;
}

/** Tiny permission map for docs (simulates admin `can("…")`). */
export type DemoPerms = { "demo.view": boolean; "demo.write": boolean };

export function demoCan(perms: DemoPerms, code: keyof DemoPerms): boolean {
  return !!perms[code];
}
