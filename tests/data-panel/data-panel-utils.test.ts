/**
 * @fileoverview DataPanel 纯逻辑：展示值、CSV、分页页码、查询序列化、本地过滤 / 排序 / 分页 / 合计、
 * 增删改与批量、表单校验、五种导出格式、文案。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  buildExportFile,
  createLocalDataSource,
  displayValue,
  filterRows,
  formatDateTime,
  formatMoney,
  pageList,
  parseCsv,
  queryToParams,
  validateForm,
} from "../../src/desktop/data-display/data-panel-utils.ts";
import {
  defaultDataPanelMessages,
  enDataPanelMessages,
  formatMessage,
  resolveDataPanelMessages,
} from "../../src/desktop/data-display/data-panel-messages.ts";
import type {
  DataPanelColumn,
  DataPanelFormField,
  DataPanelQuery,
  DataPanelSearchField,
} from "../../src/desktop/data-display/data-panel-types.ts";

const M = defaultDataPanelMessages;

const COLUMNS: DataPanelColumn[] = [
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
const SEARCH: DataPanelSearchField[] = [
  { name: "name", label: "姓名" },
  { name: "role", label: "角色", type: "select" },
  { name: "born", label: "出生", type: "date" },
  { name: "scoreMin", label: "最低分", field: "score", match: "from" },
  { name: "scoreMax", label: "最高分", field: "score", match: "to" },
  { name: "scoreEq", label: "积分", field: "score", match: "num" },
];
const FORM: DataPanelFormField[] = [
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

const Q: DataPanelQuery = {
  page: 1,
  pageSize: 10,
  sort: "",
  order: 1,
  filters: {},
};

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
    order: -1 as const,
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
      { ...base, page: 3, sort: "name", order: -1 },
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
    expect(p1.rows.length).toBe(10);
    expect(s.list({ ...Q, page: 3 }).rows.length).toBe(3);
    expect(s.list({ ...Q, page: 9 }).rows.length).toBe(0);
    expect(s.list({ ...Q, pageSize: 50 }).rows.length).toBe(23);
  });

  it("排序：升序 / 降序 / 数字 / 字符串", () => {
    const s = src();
    expect(s.list({ ...Q, sort: "name", order: -1 }).rows[0].name).toBe(
      "User23",
    );
    expect(s.list({ ...Q, sort: "score", order: -1 }).rows[0].score).toBe(66);
    expect(s.list({ ...Q, sort: "balance", order: 1 }).rows[0].id).toBe("1");
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
    s.list(Q).rows[0].name = "HACKED";
    expect(s.list(Q).rows[0].name).toBe("User01");
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
    const first = s.list(Q).rows[0];
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
    expect(s.list(Q).rows[0].name).toBe("I2");
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
