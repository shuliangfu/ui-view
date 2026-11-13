/**
 * @fileoverview DataPanel 纯逻辑：展示值、CSV、分页页码、查询序列化、本地过滤 / 排序 / 分页 / 合计、
 * 增删改与批量、表单校验、五种导出格式、JSON／XML 导入解析、文案。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  applyFieldRule,
  assignColumnProps,
  buildExportFile,
  columnSortKey,
  createLocalDataSource,
  CUSTOM_COL_PREFIX,
  displayValue,
  fieldLayoutStyle,
  fieldSpan,
  filterRows,
  formatDateTime,
  formatMoney,
  itemRowId,
  normalizeColumns,
  pageList,
  parseCsv,
  parseJsonRows,
  parseXmlRows,
  filtersAfterSearchApply,
  filtersAfterSearchReset,
  queryFromParams,
  queryToParams,
  resolveBatchStatusColumn,
  resolveModalWidth,
  isSelectionColumn,
  resolvePanelColumns,
  useFieldGrid,
  validateForm,
  validateSearchFields,
} from "../../src/desktop/data-display/data-panel-utils.ts";
import {
  defaultDataPanelMessages,
  enDataPanelMessages,
  formatMessage,
  resolveDataPanelMessages,
} from "../../src/desktop/data-display/data-panel-messages.ts";
import type {
  Column,
  FormField,
  Query,
  SearchField,
} from "../../src/desktop/data-display/data-panel-types.ts";

const M = defaultDataPanelMessages;

const COLUMNS: Column[] = [
  { prop: "name", label: "姓名", sortable: true },
  {
    prop: "role",
    label: "角色",
    type: "tag",
    options: [{ value: "admin", label: "管理员" }, {
      value: "viewer",
      label: "访客",
    }],
  },
  { prop: "balance", label: "余额", type: "money", total: true },
  { prop: "score", label: "积分", type: "number" },
  { prop: "vip", label: "VIP", type: "bool" },
  { prop: "tags", label: "标签" },
];
const SEARCH: SearchField[] = [
  { name: "name", label: "姓名" },
  { name: "role", label: "角色", type: "select" },
  { name: "born", label: "出生", type: "date" },
  { name: "scoreMin", label: "最低分", field: "score", match: "from" },
  { name: "scoreMax", label: "最高分", field: "score", match: "to" },
  { name: "scoreEq", label: "积分", field: "score", match: "num" },
];
const FORM: FormField[] = [
  { name: "name", label: "姓名", required: true },
  { name: "balance", label: "余额", type: "number", min: 0, max: 1000 },
  { name: "code", label: "编码", pattern: "^[A-Z]{3}$" },
  { name: "password", label: "密码", type: "password", required: true },
  { name: "createdBy", label: "创建人", createOnly: true, required: true },
  { name: "note", label: "备注", editOnly: true, required: true },
  { name: "roles", label: "角色", type: "multiselect", required: true },
];

function rows(n = 23) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `User${String(i + 1).padStart(2, "0")}`,
    role: i % 2 ? "viewer" : "admin",
    balance: (i + 1) * 10.1,
    score: i * 3,
    born: `2000-01-${String((i % 28) + 1).padStart(2, "0")}T08:00:00`,
    vip: i % 5 === 0,
    locked: i === 0,
  }));
}

const Q: Query = {
  page: 1,
  pageSize: 10,
  sort: "",
  order: "asc",
  filters: {},
};

describe("itemRowId", () => {
  it("reads rowKey, then id, then _id", () => {
    expect(itemRowId({ code: "c", id: "i", _id: "_x" }, "code")).toBe("c");
    expect(itemRowId({ id: "i", _id: "_x" })).toBe("i");
    expect(itemRowId({ _id: "_x" })).toBe("_x");
    expect(itemRowId({})).toBe("");
  });
});

describe("展示值", () => {
  it("formatDateTime：Date / ISO / 空 / 非法", () => {
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4, 5))).toBe(
      "2026-01-02 03:04:05",
    );
    expect(formatDateTime("2026-01-02T03:04:05")).toBe("2026-01-02 03:04:05");
    expect(formatDateTime("")).toBe("");
    expect(formatDateTime(null)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
    expect(formatDateTime("not a date")).toBe("not a date");
  });

  it("formatDateTime：自定义 format（不要秒／只要日期）", () => {
    expect(
      formatDateTime(new Date(2026, 10, 10, 10, 30, 45), "YYYY-MM-DD HH:mm"),
    )
      .toBe("2026-11-10 10:30");
    expect(formatDateTime("2026-11-10", "YYYY-MM-DD")).toBe("2026-11-10");
    expect(formatDateTime("2026-11-10", "YYYY/MM/DD")).toBe("2026/11/10");
  });

  it("displayValue：column.format 作用于 date／datetime", () => {
    const row = { id: "1", at: "2026-11-10T10:30:45" };
    expect(displayValue(
      {
        prop: "at",
        label: "时间",
        type: "datetime",
        format: "YYYY-MM-DD HH:mm",
      },
      row,
      { yes: "是", no: "否" },
    )).toBe("2026-11-10 10:30");
    expect(displayValue(
      { prop: "at", label: "日", type: "date", format: "YYYY/MM/DD" },
      { id: "1", at: "2026-11-10" },
      { yes: "是", no: "否" },
    )).toBe("2026/11/10");
  });

  it("resolvePanelColumns：index／selection／actions 由 columns 驱动；label 默认 #", () => {
    const cols = resolvePanelColumns(
      [
        { type: "selection" },
        { type: "index" },
        { prop: "name", label: "姓名" },
        { type: "actions" },
      ],
      { needSelection: false, autoIndex: false, needActions: false },
    );
    expect(cols.map((c) => c.type)).toEqual([
      "selection",
      "index",
      undefined,
      "actions",
    ]);
    expect(cols[1].label).toBe("#");
    expect(cols[0].prop).toBe("__select");
    expect(cols[1].prop).toBe("__index");
    expect(cols[3].prop).toBe("__actions");
    // 无显式 selection 时不自动前置（needSelection 已忽略）；actions 仍可末尾兼容补
    const auto = resolvePanelColumns(
      [{ prop: "name", label: "姓名" }],
      { needSelection: true, needActions: true, selectable: true },
    );
    expect(auto.map((c) => c.type)).toEqual([
      undefined,
      "actions",
    ]);
    expect(auto.some(isSelectionColumn)).toBe(false);
    // autoIndex:true 才自动前置序号
    const withIdx = resolvePanelColumns(
      [{ prop: "name", label: "姓名" }],
      { needSelection: false, needActions: false, autoIndex: true },
    );
    expect(withIdx.map((c) => c.type)).toEqual(["index", undefined]);
    expect(withIdx[0].label).toBe("#");
    // selectable:false 去掉显式 selection；未声明 index 则没有序号列
    const noSel = resolvePanelColumns(
      [{ type: "selection" }, { prop: "name", label: "姓名" }],
      { needSelection: true, selectable: false, needActions: false },
    );
    expect(noSel.some(isSelectionColumn)).toBe(false);
    expect(noSel.some((c) => c.type === "index")).toBe(false);
    expect(noSel[0].prop).toBe("name");
  });

  it("resolvePanelColumns：勾选列只由 columns 的 type:selection 决定", () => {
    const absent = resolvePanelColumns(
      [{ prop: "name", label: "姓名" }],
      { needSelection: true, selectable: true, needActions: false },
    );
    expect(absent.some(isSelectionColumn)).toBe(false);

    const present = resolvePanelColumns(
      [{ type: "selection" }, { prop: "name", label: "姓名" }],
      { needSelection: false, needActions: false },
    );
    expect(present[0].type).toBe("selection");
    expect(present[0].prop).toBe("__select");
    expect(present.some(isSelectionColumn)).toBe(true);
  });

  it("resolvePanelColumns：actions 列保留 width／minWidth／maxWidth", () => {
    const cols = resolvePanelColumns(
      [
        { prop: "name", label: "姓名", width: 200 },
        {
          type: "actions",
          width: 150,
          minWidth: 120,
          maxWidth: 200,
          actions: { view: true },
        },
      ],
      { needSelection: false, autoIndex: false, needActions: false },
    );
    const act = cols.find((c) => c.type === "actions");
    expect(act?.width).toBe(150);
    expect(act?.minWidth).toBe(120);
    expect(act?.maxWidth).toBe(200);
  });

  it("未写 prop 的自定义列会分配稳定键；sortProp 作为排序字段", () => {
    const cols = resolvePanelColumns(
      [
        { prop: "lastName", label: "姓", sortable: true },
        { prop: "firstName", label: "名", sortable: true },
        {
          prop: "",
          label: "姓名",
          sortable: true,
          sortProp: "lastName",
          formatter: (row) =>
            `${row.lastName ?? ""}${row.firstName ?? ""}` || "—",
        },
        {
          label: "姓名",
          formatter: (row) => String(row.id ?? ""),
        },
      ],
      { needSelection: false, needActions: false },
    );
    expect(cols.map((c) => c.prop)).toEqual([
      "lastName",
      "firstName",
      `${CUSTOM_COL_PREFIX}姓名`,
      `${CUSTOM_COL_PREFIX}姓名:2`,
    ]);
    expect(columnSortKey(cols[2])).toBe("lastName");
    expect(columnSortKey(cols[3])).toBe("");
    expect(columnSortKey({ prop: "email" })).toBe("email");
    const name = cols[2];
    expect(displayValue(name, { lastName: "张", firstName: "三" }, M)).toBe(
      "张三",
    );
    expect(displayValue(name, { lastName: "", firstName: "" }, M)).toBe("—");
  });

  it("formatMoney：千分位两位小数，非数字为空", () => {
    expect(formatMoney(1234.5)).toBe("1,234.50");
    expect(formatMoney("1000000")).toBe("1,000,000.00");
    expect(formatMoney(0)).toBe("0.00");
    expect(formatMoney("")).toBe("");
    expect(formatMoney(null)).toBe("");
    expect(formatMoney("abc")).toBe("");
  });

  it("displayValue：各列类型", () => {
    const r = {
      name: "A",
      role: "admin",
      balance: 1234.5,
      score: "7",
      vip: true,
      tags: ["x", "y"],
    };
    const dv = (p: string, row: Record<string, unknown> = r) =>
      displayValue(COLUMNS.find((c) => c.prop === p)!, { id: "1", ...row }, M);
    expect(dv("name")).toBe("A");
    expect(dv("role")).toBe("管理员");
    expect(dv("role", { role: "unknown" })).toBe("unknown");
    expect(dv("role", { role: null })).toBe("");
    expect(dv("balance")).toBe("1,234.50");
    expect(dv("score")).toBe("7");
    expect(dv("score", { score: "" })).toBe("");
    expect(dv("vip")).toBe("是");
    expect(dv("vip", { vip: false })).toBe("否");
    expect(dv("tags")).toBe("x, y");
    expect(dv("name", { name: { a: 1 } })).toBe('{"a":1}');
    expect(dv("name", { name: undefined })).toBe("");
    expect(
      displayValue({ prop: "vip", label: "v", type: "bool" }, {
        id: "1",
        vip: true,
      }, enDataPanelMessages),
    ).toBe("Yes");
  });
});

describe("displayValue 函数列", () => {
  it("displayValue：value／formatter／节点回落", () => {
    const row = { id: "1", flag: 1, name: "A" };
    expect(
      displayValue(
        {
          prop: "flag",
          label: "f",
          type: "tag",
          value: (r) => (r.flag === 1 ? "开启" : "关闭"),
        },
        row,
        M,
      ),
    ).toBe("开启");
    expect(
      displayValue(
        {
          prop: "flag",
          label: "f",
          formatter: (_r, raw) => (raw === 1 ? "ON" : "OFF"),
          value: () => "ignored",
        },
        row,
        M,
      ),
    ).toBe("ON");
    // HTML → 剥标签
    expect(
      displayValue(
        {
          prop: "flag",
          label: "f",
          formatter: () => '<b style="color:green">ON</b>',
        },
        row,
        M,
      ),
    ).toBe("ON");
    // 节点无 textContent 时回落声明式 options
    expect(
      displayValue(
        {
          prop: "flag",
          label: "f",
          type: "tag",
          options: [{ value: "1", label: "开" }],
          value: () => ({ nodeType: 1 }),
        },
        { id: "1", flag: "1" },
        M,
      ),
    ).toBe("开");
  });
});

describe("normalizeColumns", () => {
  it("normalizeColumns：edit→inline；已有 inline 不动", () => {
    const cols = normalizeColumns([
      { prop: "a", label: "A", edit: true },
      {
        prop: "b",
        label: "B",
        edit: true,
        options: [{ value: "1", label: "开" }, { value: "0", label: "关" }],
      },
      { prop: "c", label: "C", edit: true, inline: "number" },
      { prop: "d", label: "D" },
    ]);
    expect(cols[0].inline).toBe("text");
    expect(cols[1].inline).toBe("switch");
    expect(cols[2].inline).toBe("number");
    expect(cols[3].inline).toBeUndefined();
  });
});

describe("parseCsv", () => {
  it("引号、逗号、换行、BOM、空行", () => {
    const csv = '\uFEFF姓名,备注\r\nAlice,"a,b"\r\n"Bo""b","line1\nline2"\n\n';
    expect(parseCsv(csv)).toEqual([
      { "姓名": "Alice", "备注": "a,b" },
      { "姓名": 'Bo"b', "备注": "line1\nline2" },
    ]);
  });
  it("空文本与只有表头", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("a,b")).toEqual([]);
  });
  it("缺失列补空串", () => {
    expect(parseCsv("a,b,c\n1,2")).toEqual([{ a: "1", b: "2", c: "" }]);
  });
});

describe("parseJsonRows", () => {
  it("数组对象 → 字符串字段；非数组空", () => {
    expect(parseJsonRows('[{"a":1,"b":null},{"a":"x"}]')).toEqual([
      { a: "1", b: "" },
      { a: "x" },
    ]);
    expect(parseJsonRows('{"a":1}')).toEqual([]);
  });
});

describe("parseXmlRows", () => {
  it("解析导出 XML 并还原转义", () => {
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n  <row>\n    <name>A&lt;B</name>\n    <email>a@b.com</email>\n  </row>\n</rows>\n`;
    expect(parseXmlRows(xml)).toEqual([{ name: "A<B", email: "a@b.com" }]);
  });

  it("与 buildExportFile(xml) 往返", () => {
    const cols = [
      { prop: "name", label: "姓名" },
      { prop: "note", label: "备注" },
    ];
    const rows = [{ name: "Tom", note: "a<b>&c" }];
    const f = buildExportFile({
      format: "xml",
      title: "t",
      basename: "t",
      columns: cols,
      rows,
      messages: M,
      dateStamp: "20260102",
    });
    expect(parseXmlRows(f.data as string)).toEqual([
      { name: "Tom", note: "a<b>&c" },
    ]);
  });
});

describe("pageList", () => {
  it("少于等于 7 页全部展示", () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("中间用省略号", () => {
    expect(pageList(1, 20)).toEqual([1, 2, "…", 19, 20]);
    expect(pageList(10, 20)).toEqual([1, 2, "…", 9, 10, 11, "…", 19, 20]);
    expect(pageList(20, 20)).toEqual([1, 2, "…", 19, 20]);
    expect(pageList(3, 20)).toEqual([1, 2, 3, 4, "…", 19, 20]);
  });
});

describe("queryToParams", () => {
  const base = {
    ...Q,
    sort: "name",
    order: "desc" as const,
    filters: { name: "x", kind: "a", empty: "" },
  };
  it("请求参数：始终带 pageSize，固定过滤并入", () => {
    const p = queryToParams(base, {
      forUrl: false,
      fixed: { kind: "a", seg: "s" },
    });
    expect(p.get("pageSize")).toBe("10");
    expect(p.get("sort")).toBe("name");
    expect(p.get("order")).toBe("desc");
    expect(p.get("name")).toBe("x");
    expect(p.get("seg")).toBe("s");
    expect(p.has("empty")).toBe(false);
    expect(p.has("page")).toBe(false);
  });
  it("地址栏：省略默认值与固定过滤", () => {
    const p = queryToParams(
      { ...base, page: 3, pageSize: 20, sort: "name", order: "desc" },
      {
        forUrl: true,
        fixed: { kind: "a" },
        defaultSort: { prop: "name", order: "desc" },
      },
    );
    expect(p.toString()).toBe("page=3&name=x");
    const q = queryToParams({ ...base, pageSize: 50 }, { forUrl: true });
    expect(q.get("pageSize")).toBe("50");
    expect(q.get("sort")).toBe("name");
    expect(queryToParams(Q, { forUrl: true, defaultPageSize: 10 }).toString())
      .toBe("");
  });
});

describe("queryFromParams（page／pageSize／搜索 ↔ URL 回填）", () => {
  const names = ["name", "role"] as const;
  it("读 page／pageSize／sort／order／搜索字段；忽略空与未知 key；跳过 fixed", () => {
    const p = new URLSearchParams(
      "page=2&pageSize=20&sort=balance&order=desc&name=Ada&role=admin&fixedK=x&noise=1",
    );
    const q = queryFromParams(p, {
      searchNames: names,
      fixed: { fixedK: "keep" },
    });
    expect(q.page).toBe(2);
    expect(q.pageSize).toBe(20);
    expect(q.sort).toBe("balance");
    expect(q.order).toBe("desc");
    expect(q.filters).toEqual({ name: "Ada", role: "admin" });
    expect(q.filters?.fixedK).toBeUndefined();
  });
  it("非法／缺省数字忽略；order 默认 asc；空串 filters 不产出", () => {
    const p = new URLSearchParams("page=0&pageSize=abc&sort=name&name=&role=");
    const q = queryFromParams(p, { searchNames: names });
    expect(q.page).toBeUndefined();
    expect(q.pageSize).toBeUndefined();
    expect(q.sort).toBe("name");
    expect(q.order).toBe("asc");
    expect(q.filters).toBeUndefined();
  });
  it("无 searchNames 仍读 page／pageSize（分页默认同步不依赖 search）", () => {
    const p = new URLSearchParams("page=3&pageSize=20&name=x");
    const q = queryFromParams(p, { searchNames: [] });
    expect(q.page).toBe(3);
    expect(q.pageSize).toBe(20);
    expect(q.filters).toBeUndefined();
  });
  it("与 queryToParams(forUrl) 往返：写出再读回（默认值省略）", () => {
    const written = queryToParams(
      {
        page: 3,
        pageSize: 50,
        sort: "name",
        order: "desc",
        filters: { name: "x", role: "admin", secret: "no" },
      },
      {
        forUrl: true,
        defaultPageSize: 10,
        defaultSort: { prop: "id", order: "asc" },
        fixed: { secret: "no" },
      },
    );
    const back = queryFromParams(written, {
      searchNames: ["name", "role", "secret"],
      fixed: { secret: "no" },
    });
    expect(back.page).toBe(3);
    expect(back.pageSize).toBe(50);
    expect(back.sort).toBe("name");
    expect(back.order).toBe("desc");
    expect(back.filters).toEqual({ name: "x", role: "admin" });
  });
});

describe("resolveBatchStatusColumn（批量设为 ← column.batch:true）", () => {
  it("须 batch:true＋inline:switch＋两档 options；映射 field／values", () => {
    const got = resolveBatchStatusColumn([
      { prop: "name", label: "姓名" },
      {
        prop: "status",
        label: "状态",
        type: "tag",
        inline: "switch",
        batch: true,
        options: [
          { value: "active", label: "启用", tone: "success" },
          { value: "disabled", label: "停用", tone: "warning" },
        ],
      },
    ]);
    expect(got).toEqual({
      field: "status",
      values: [
        { value: "active", label: "启用" },
        { value: "disabled", label: "停用" },
      ],
    });
  });
  it("仅 switch 无 batch → null；batch 但非两档 → null", () => {
    expect(resolveBatchStatusColumn([
      {
        prop: "status",
        label: "状态",
        inline: "switch",
        options: [
          { value: "on", label: "开" },
          { value: "off", label: "关" },
        ],
      },
    ])).toBeNull();
    expect(resolveBatchStatusColumn([
      {
        prop: "status",
        label: "状态",
        inline: "switch",
        batch: true,
        options: [{ value: "on", label: "开" }],
      },
    ])).toBeNull();
    expect(resolveBatchStatusColumn([])).toBeNull();
  });
  it("多个 batch:true 取第一个", () => {
    const got = resolveBatchStatusColumn([
      {
        prop: "locked",
        label: "锁定",
        inline: "switch",
        batch: true,
        options: [
          { value: "1", label: "是" },
          { value: "0", label: "否" },
        ],
      },
      {
        prop: "status",
        label: "状态",
        inline: "switch",
        batch: true,
        options: [
          { value: "active", label: "启用" },
          { value: "disabled", label: "停用" },
        ],
      },
    ]);
    expect(got?.field).toBe("locked");
  });
});

describe("filterRows", () => {
  const data = rows();
  it("text 包含（不区分大小写）、select 精确", () => {
    expect(filterRows(data, { name: "user0" }, SEARCH).length).toBe(9);
    expect(filterRows(data, { role: "viewer" }, SEARCH).length).toBe(11);
  });
  it("date 按日期前缀相等；from / to / num", () => {
    expect(filterRows(data, { born: "2000-01-05" }, SEARCH).map((r) => r.id))
      .toEqual(["5"]);
    expect(filterRows(data, { scoreMin: "60" }, SEARCH).length).toBe(
      filterRows(data, {}, SEARCH).filter((r) => String(r.score) >= "60")
        .length,
    );
    expect(filterRows(data, { scoreEq: "9" }, SEARCH).map((r) => r.id)).toEqual(
      ["4"],
    );
  });
  it("多条件取交集，空值忽略，无搜索定义时按包含匹配", () => {
    expect(filterRows(data, { role: "admin", name: "User1" }, SEARCH).length)
      .toBe(5);
    expect(filterRows(data, { name: "" }, SEARCH).length).toBe(23);
    expect(filterRows(data, { role: "viewer" }, []).length).toBe(11);
  });
});

describe("createLocalDataSource：查询", () => {
  const src = () =>
    createLocalDataSource({
      rows: rows(),
      columns: COLUMNS,
      search: SEARCH,
      form: FORM,
    });

  it("分页与 total", () => {
    const s = src();
    expect(s.sync).toBe(true);
    const p1 = s.list(Q);
    expect(p1.total).toBe(23);
    expect(p1.items.length).toBe(10);
    expect(s.list({ ...Q, page: 3 }).items.length).toBe(3);
    expect(s.list({ ...Q, page: 9 }).items.length).toBe(0);
    expect(s.list({ ...Q, pageSize: 50 }).items.length).toBe(23);
  });

  it("排序：升序 / 降序 / 数字 / 字符串", () => {
    const s = src();
    expect(s.list({ ...Q, sort: "name", order: "desc" }).items[0].name).toBe(
      "User23",
    );
    expect(s.list({ ...Q, sort: "score", order: "desc" }).items[0].score).toBe(
      66,
    );
    expect(s.list({ ...Q, sort: "balance", order: "asc" }).items[0].id).toBe(
      "1",
    );
  });

  it("拼接列按 sortProp（姓）排序", () => {
    const s = createLocalDataSource({
      rows: [
        { id: "1", lastName: "张", firstName: "三" },
        { id: "2", lastName: "李", firstName: "四" },
        { id: "3", lastName: "王", firstName: "五" },
      ],
      columns: [
        {
          label: "姓名",
          sortable: true,
          sortProp: "lastName",
          formatter: (row) =>
            `${row.lastName ?? ""}${row.firstName ?? ""}` || "—",
        },
      ],
    });
    const byName = (a: string, b: string) =>
      a.localeCompare(b, undefined, { numeric: true });
    const names = ["张", "李", "王"];
    const asc = s.list({ ...Q, sort: "lastName", order: "asc" }).items;
    expect(asc.map((r) => r.lastName)).toEqual([...names].sort(byName));
    const desc = s.list({ ...Q, sort: "lastName", order: "desc" }).items;
    expect(desc.map((r) => r.lastName)).toEqual(
      [...names].sort(byName).reverse(),
    );
  });

  it("合计：只对 total 列，浮点误差被消除", () => {
    const s = createLocalDataSource({
      rows: [{ id: "1", balance: 0.1 }, { id: "2", balance: 0.2 }],
      columns: COLUMNS,
    });
    expect(s.list(Q).totals).toEqual({ balance: 0.3 });
    expect(
      createLocalDataSource({ rows: [], columns: [{ prop: "a", label: "a" }] })
        .list(Q).totals,
    ).toBe(undefined);
  });

  it("合计随过滤变化；固定过滤始终生效", () => {
    const s = createLocalDataSource({
      rows: rows(),
      columns: COLUMNS,
      search: SEARCH,
      fixed: { role: "admin" },
    });
    expect(s.list(Q).total).toBe(12);
    expect(s.list({ ...Q, filters: { name: "User03" } }).total).toBe(1);
  });

  it("返回的是副本，改动不会污染内部数据", () => {
    const s = src();
    s.list(Q).items[0].name = "HACKED";
    expect(s.list(Q).items[0].name).toBe("User01");
  });
});

describe("createLocalDataSource：写操作", () => {
  it("create 在最前面插入并自增 id，number 字段转数字，触发 onChange", () => {
    let changed = 0;
    const s = createLocalDataSource({
      rows: rows(3),
      columns: COLUMNS,
      form: FORM,
      onChange: () => changed++,
    });
    s.create!({ name: "New", balance: "12.5" });
    const first = s.list(Q).items[0];
    expect(first.id).toBe("4");
    expect(first.name).toBe("New");
    expect(first.balance).toBe(12.5);
    expect(changed).toBe(1);
  });

  it("update 合并字段；不存在返回失败", () => {
    const s = createLocalDataSource({
      rows: rows(3),
      columns: COLUMNS,
      form: FORM,
    });
    expect(s.update!("2", { name: "Renamed" })).toBe(undefined);
    expect(s.getRows().find((r) => r.id === "2")!.name).toBe("Renamed");
    expect(s.update!("99", { name: "x" })).toEqual({
      ok: false,
      message: "not found",
    });
  });

  it("remove：删除、不存在、locked 不可删", () => {
    const s = createLocalDataSource({ rows: rows(5), columns: COLUMNS });
    const r = s.remove!(["2", "99", "1"]);
    expect(r.removed).toBe(1);
    expect(r.failed).toEqual([{ id: "99", error: "not found" }, {
      id: "1",
      error: "locked",
    }]);
    expect(s.getRows().length).toBe(4);
  });

  it("setField 批量设置；importRows 追加并返回数量", () => {
    const s = createLocalDataSource({ rows: rows(4), columns: COLUMNS });
    expect(s.setField!(["1", "2", "77"], "role", "viewer")).toEqual({
      removed: 2,
      failed: [{ id: "77", error: "not found" }],
    });
    expect(s.getRows().filter((r) => r.role === "viewer").length).toBe(3);
    expect(s.importRows!([{ name: "I1" }, { name: "I2" }])).toEqual({
      created: 2,
      failed: 0,
    });
    expect(s.getRows().length).toBe(6);
    expect(s.list(Q).items[0].name).toBe("I2");
  });

  it("setRows 整体替换；writable=false 时没有写方法", () => {
    const s = createLocalDataSource({ rows: rows(4), columns: COLUMNS });
    s.setRows([{ id: "9", name: "Only" }]);
    expect(s.list(Q).total).toBe(1);
    const ro = createLocalDataSource({
      rows: rows(2),
      columns: COLUMNS,
      writable: false,
    });
    expect(ro.create).toBe(undefined);
    expect(ro.remove).toBe(undefined);
    expect(ro.setField).toBe(undefined);
  });

  it("自定义 rowKey", () => {
    const s = createLocalDataSource({
      rows: [{ uid: "a", n: 1 }, { uid: "b", n: 2 }],
      columns: [{ prop: "n", label: "n" }],
      rowKey: "uid",
    });
    expect(s.remove!(["a"]).removed).toBe(1);
    expect(s.getRows()).toEqual([{ uid: "b", n: 2 }]);
  });
});

describe("validateForm", () => {
  const v = (values: Record<string, unknown>, edit = false) =>
    validateForm(FORM, values, edit, M);
  it("必填、数字范围、正则", () => {
    const e = v({ balance: -1, code: "abc" });
    expect(e.name).toBe("此项必填");
    expect(e.balance).toBe("不能小于 0");
    expect(e.code).toBe("格式不正确");
    expect(e.password).toBe("此项必填");
    expect(e.roles).toBe("此项必填");
    expect(v({ balance: 1001 }).balance).toBe("不能大于 1000");
    expect(v({ balance: "x" }).balance).toBe("格式不正确");
  });
  it("createOnly 只在新建校验；editOnly 只在编辑校验；编辑时密码可留空", () => {
    expect(v({}, false).createdBy).toBe("此项必填");
    expect(v({}, false).note).toBe(undefined);
    expect(v({}, true).createdBy).toBe(undefined);
    expect(v({}, true).note).toBe("此项必填");
    expect(v({}, true).password).toBe(undefined);
  });
  it("全部合法时无错误", () => {
    expect(
      v({
        name: "a",
        balance: 5,
        code: "ABC",
        password: "x",
        createdBy: "me",
        roles: ["a"],
      }),
    ).toEqual({});
  });
  it("非法正则被忽略", () => {
    expect(
      validateForm(
        [{ name: "a", label: "a", pattern: "(" }],
        { a: "x" },
        false,
        M,
      ),
    ).toEqual({});
  });
});

describe("buildExportFile", () => {
  const data = [
    {
      id: "1",
      name: "Alice",
      role: "admin",
      balance: 1234.5,
      score: 3,
      vip: true,
    },
    {
      id: "2",
      name: '=SUM(A1) "q", <b>',
      role: "viewer",
      balance: 10,
      score: 4,
      vip: false,
    },
  ];
  const cols = COLUMNS.filter((c) => c.prop !== "tags");
  const base = {
    title: "用户",
    basename: "users",
    columns: cols,
    rows: data,
    messages: M,
    dateStamp: "20260102",
  };

  it("csv：BOM、表头、引号转义、公式中和", () => {
    const f = buildExportFile({ ...base, format: "csv" });
    expect(f.filename).toBe("users-20260102.csv");
    expect(f.mime).toContain("text/csv");
    const t = f.data as string;
    expect(t.startsWith("\uFEFF姓名,角色,余额,积分,VIP")).toBe(true);
    expect(t).toContain('Alice,管理员,"1,234.50",3,是');
    expect(t).toContain(`"'=SUM(A1) ""q"", <b>"`);
    expect(t.split("\r\n").length).toBe(3);
  });

  it("json：用展示值，键为 prop", () => {
    const f = buildExportFile({ ...base, format: "json" });
    const j = JSON.parse(f.data as string);
    expect(j[0]).toEqual({
      name: "Alice",
      role: "管理员",
      balance: "1,234.50",
      score: "3",
      vip: "是",
    });
    expect(f.filename.endsWith(".json")).toBe(true);
  });

  it("xml：转义与标签名净化", () => {
    const f = buildExportFile({
      ...base,
      columns: [{ prop: "a b", label: "x" }],
      rows: [{ id: "1", "a b": "<&>" }],
      format: "xml",
    });
    expect(f.data as string).toContain("<a_b>&lt;&amp;&gt;</a_b>");
    expect((f.data as string).startsWith('<?xml version="1.0"')).toBe(true);
  });

  it("html：表格 + 转义标题与单元格", () => {
    const f = buildExportFile({ ...base, title: "A<B", format: "html" });
    const h = f.data as string;
    expect(h).toContain("<title>A&lt;B</title>");
    expect(h).toContain("<th>姓名</th>");
    expect(h).toContain("&lt;b&gt;");
    expect(f.mime).toContain("text/html");
  });

  it("xlsx：二进制 ZIP，数字列写成数值", () => {
    const f = buildExportFile({
      ...base,
      format: "xlsx",
      totals: { balance: 1244.5 },
    });
    expect(f.filename).toBe("users-20260102.xlsx");
    expect(f.mime).toContain("spreadsheetml.sheet");
    const bytes = f.data as Uint8Array;
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("<v>1234.5</v>");
    expect(text).toContain("<v>1244.5</v>"); // 合计行
    expect(text).toContain("合计");
    expect(text).toContain("'=SUM(A1)");
  });

  it("默认日期戳为今天（YYYYMMDD）", () => {
    const f = buildExportFile({ ...base, dateStamp: undefined, format: "csv" });
    expect(/^users-\d{8}\.csv$/.test(f.filename)).toBe(true);
  });
});

describe("messages", () => {
  it("formatMessage 替换占位符，未知占位符保留", () => {
    expect(formatMessage("第 {from}-{to} 条", { from: 1, to: 10 })).toBe(
      "第 1-10 条",
    );
    expect(formatMessage("{a} {b}", { a: "x" })).toBe("x {b}");
    expect(formatMessage("plain")).toBe("plain");
  });
  it("resolveDataPanelMessages：按语言取内置并浅合并覆盖", () => {
    expect(resolveDataPanelMessages(undefined).create).toBe("添加");
    expect(resolveDataPanelMessages("zh-CN").create).toBe("添加");
    expect(resolveDataPanelMessages("en-US").create).toBe("Add");
    expect(resolveDataPanelMessages("en-US", { create: "New" }).create).toBe(
      "New",
    );
    expect(resolveDataPanelMessages("en-US", { create: "New" }).search).toBe(
      "Search",
    );
  });
  it("中英文案的键完全一致且都非 undefined", () => {
    const zh = Object.keys(defaultDataPanelMessages).sort();
    const en = Object.keys(enDataPanelMessages).sort();
    expect(en).toEqual(zh);
    for (const k of zh) {
      expect(
        typeof (defaultDataPanelMessages as unknown as Record<string, unknown>)[
          k
        ],
      ).toBe("string");
    }
  });
});

describe("validateForm rules／search／layout", () => {
  const Mm = {
    required: "必填",
    min: "最小 {n}",
    max: "最大 {n}",
    patternMismatch: "格式错",
  };

  it("rules：required message、email type、min/max 长度、validator", () => {
    const form = [
      {
        prop: "name",
        rules: [
          { required: true, message: "姓名不能为空" },
          { min: 2, max: 5, message: "长度 2–5" },
        ],
      },
      {
        prop: "email",
        rules: [{ type: "email" as const, message: "邮箱不对" }],
      },
      {
        prop: "code",
        rules: [{
          validator: (v: unknown) => (v === "ok" ? true : "必须 ok"),
        }],
      },
    ];
    expect(validateForm(form, {}, false, Mm).name).toBe("姓名不能为空");
    expect(validateForm(form, { name: "A" }, false, Mm).name).toBe("长度 2–5");
    expect(validateForm(form, { name: "AliceX" }, false, Mm).name).toBe(
      "长度 2–5",
    );
    expect(
      validateForm(form, { name: "Al", email: "x", code: "ok" }, false, Mm)
        .email,
    ).toBe("邮箱不对");
    expect(
      validateForm(form, { name: "Al", email: "a@b.co", code: "no" }, false, Mm)
        .code,
    ).toBe("必须 ok");
    expect(
      validateForm(
        form,
        { name: "Al", email: "a@b.co", code: "ok" },
        false,
        Mm,
      ),
    ).toEqual({});
  });

  it("简写 message／maxlength；编辑密码留空跳过 required", () => {
    expect(
      validateForm(
        [{ prop: "n", required: true, message: "自定义必填" }],
        {},
        false,
        Mm,
      ).n,
    ).toBe("自定义必填");
    expect(
      validateForm(
        [{ prop: "n", maxlength: 3 }],
        { n: "abcd" },
        false,
        Mm,
      ).n,
    ).toBe("最大 3");
    expect(
      validateForm(
        [{ prop: "pw", type: "password", required: true }],
        { pw: "" },
        true,
        Mm,
      ),
    ).toEqual({});
  });

  it("validateSearchFields：仅有规则的项", () => {
    const search = [
      { prop: "q" },
      { prop: "code", required: true, message: "码必填" },
    ];
    expect(validateSearchFields(search, { q: "", code: "" }, Mm)).toEqual({
      code: "码必填",
    });
    expect(validateSearchFields(search, { q: "", code: "1" }, Mm)).toEqual({});
  });

  it("fieldSpan／fieldLayoutStyle／useFieldGrid", () => {
    expect(fieldSpan({ span: 6 })).toBe(6);
    expect(fieldSpan({ cols: 3 })).toBe(3);
    expect(fieldSpan({ span: 99 })).toBe(12);
    expect(fieldLayoutStyle({ span: 4, width: "50%" })).toEqual({
      gridColumn: "span 4 / span 4",
      width: "50%",
    });
    expect(fieldLayoutStyle({ width: 200 })).toEqual({ width: "200px" });
    expect(useFieldGrid([{}])).toBe(false);
    expect(useFieldGrid([{ span: 6 }])).toBe(true);
    expect(useFieldGrid([{ width: "50%" }])).toBe(true);
  });
});

describe("filtersAfterSearchReset / filtersAfterSearchApply", () => {
  it("reset only clears search form fields and keeps tab", () => {
    expect(
      filtersAfterSearchReset(
        { q: "张三", tab: "12", status: "on" },
        ["q"],
      ),
    ).toEqual({ tab: "12", status: "on" });
  });

  it("reset keeps fixed fields even if they share a search name", () => {
    expect(
      filtersAfterSearchReset(
        { q: "张三", scope: "mine" },
        ["q", "scope"],
        { scope: "mine" },
      ),
    ).toEqual({ scope: "mine" });
  });

  it("apply updates search fields only and keeps tab", () => {
    expect(
      filtersAfterSearchApply(
        { q: "张三", tab: "6" },
        { q: "李四" },
        ["q"],
      ),
    ).toEqual({ q: "李四", tab: "6" });
    expect(
      filtersAfterSearchApply(
        { q: "张三", tab: "6" },
        {},
        ["q"],
      ),
    ).toEqual({ tab: "6" });
  });

  it("apply then reset only drops search fields and keeps tab", () => {
    const afterApply = filtersAfterSearchApply(
      { tab: "12", status: "on" },
      { q: "王五", role: "admin" },
      ["q", "role"],
    );
    expect(afterApply).toEqual({
      tab: "12",
      status: "on",
      q: "王五",
      role: "admin",
    });
    expect(filtersAfterSearchReset(afterApply, ["q", "role"])).toEqual({
      tab: "12",
      status: "on",
    });
  });

  it("reset on empty filters stays empty, or keeps only fixed", () => {
    expect(filtersAfterSearchReset(undefined, ["q"])).toEqual({});
    expect(filtersAfterSearchReset({}, ["q"], { scope: "mine" })).toEqual({
      scope: "mine",
    });
  });

  it("apply does not overwrite a fixed field", () => {
    expect(
      filtersAfterSearchApply(
        { q: "张三", scope: "mine", tab: "3" },
        { q: "李四", scope: "all" },
        ["q", "scope"],
        { scope: "mine" },
      ),
    ).toEqual({ q: "李四", scope: "mine", tab: "3" });
  });
});

describe("resolveModalWidth", () => {
  it("falls back to md and unwraps getters", () => {
    expect(resolveModalWidth(undefined)).toBe("md");
    expect(resolveModalWidth("92vw")).toBe("92vw");
    expect(resolveModalWidth(960)).toBe(960);
    expect(resolveModalWidth(() => "xl")).toBe("xl");
    expect(resolveModalWidth(() => undefined, "lg")).toBe("lg");
  });
});
