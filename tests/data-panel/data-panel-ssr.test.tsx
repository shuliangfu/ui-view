/** @jsxImportSource @dreamer/view */
/**
 * @fileoverview DataPanel 服务端渲染：首帧 HTML 与水合前后一致所依赖的结构（布尔属性、转义、能力开关、文案）。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  type Column,
  DATA_PANEL_CSS,
  DataPanel,
  type DataSource,
  type PanelProps,
  type RowActionsConfig,
} from "../../src/desktop/data-display/DataPanel.tsx";
import {
  panelHandles,
  refreshDataPanel,
  setDataPanelQuery,
} from "../../src/desktop/data-display/data-panel-chrome.tsx";

const COLUMNS: Column[] = [
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    options: [{ value: "on", label: "启用", tone: "success" }, {
      value: "off",
      label: "停用",
      tone: "warning",
    }],
  },
  { prop: "balance", label: "余额", type: "money", total: true },
  { prop: "secret", label: "隐藏列", hidden: true },
];

/** 挂操作配置到 COLUMNS 的 actions 列 */
function withActions(actions: RowActionsConfig): Column[] {
  return [...COLUMNS, { type: "actions", actions }];
}

/** 前置多选勾选列（columns 声明才显示） */
function withSelection(columns: Column[] = COLUMNS): Column[] {
  return [{ type: "selection" }, ...columns];
}

function data(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `User ${i + 1}`,
    status: i % 2 ? "off" : "on",
    balance: (i + 1) * 100,
    secret: "TOPSECRET",
    locked: i === 0,
  }));
}

const FORM = { props: [{ name: "name", label: "姓名", required: true }] };

async function html(props: Partial<PanelProps> = {}): Promise<string> {
  return String(
    await renderToString(() => (
      <DataPanel
        title="用户"
        columns={COLUMNS}
        data={data(25)}
        form={FORM}
        {...props}
      />
    )),
  );
}

describe("DataPanel SSR：首帧内容", () => {
  it("标题、总数、第一页 20 行、序号与范围文案", async () => {
    const h = await html();
    expect(h).toContain("用户");
    expect(h).toContain("共 25 条记录");
    expect(h).toContain("第 1-20 条，共 25 条");
    expect((h.match(/data-testid="dp-row-/g) ?? []).length).toBe(20);
    expect(h).toContain("User 1");
    expect(h).toContain("User 20");
    expect(h).not.toContain("User 21");
  });

  it("tag 列显示选项文案，money 列格式化，合计行汇总全部匹配行", async () => {
    const h = await html();
    expect(h).toContain("启用");
    expect(h).toContain("停用");
    expect(h).toContain("100.00");
    // 本地 data：合计当前过滤结果全集。1..25 → 100*(25*26/2) = 32500（不是当前页 20 行）
    expect(h).toContain('data-testid="dp-total-balance"');
    expect(h).toMatch(/dp-total-balance[^>]*>\s*32,500\.00/);
  });

  it("本地 data 分页后合计仍是过滤结果全集，不是当前页", async () => {
    const h = await html({ pagination: { pageSize: 5 } });
    // 当前页 1..5 → 1500；全集仍是 32,500.00
    expect(h).toMatch(/dp-total-balance[^>]*>\s*32,500\.00/);
    expect(h).not.toMatch(/dp-total-balance[^>]*>\s*1,500\.00/);
  });

  it("分页数据源合计当前已加载页，即使服务端 totals 是另一个数", async () => {
    const all = data(25);
    const h = await html({
      data: undefined,
      dataSource: {
        sync: true,
        list(q) {
          const start = (q.page - 1) * q.pageSize;
          return {
            rows: all.slice(start, start + q.pageSize),
            total: all.length,
            totals: { balance: 8968.6 },
          };
        },
      },
    });
    // 当前页 20 行：100*(20*21/2)=21000，不能用服务端 8,968.60，也不能用全集 32,500.00
    expect(h).toMatch(/dp-total-balance[^>]*>\s*21,000\.00/);
    expect(h).not.toContain("8,968.60");
    expect(h).not.toMatch(/dp-total-balance[^>]*>\s*32,500\.00/);
  });

  it("initial.totals 不影响页脚：按 initial.rows 自算", async () => {
    const page = data(20);
    const h = await html({
      data: undefined,
      initial: { rows: page, total: 25, totals: { balance: 8968.6 } },
      dataSource: {
        list() {
          return Promise.resolve({
            rows: page,
            total: 25,
            totals: { balance: 8968.6 },
          });
        },
      },
    });
    expect(h).toMatch(/dp-total-balance[^>]*>\s*21,000\.00/);
    expect(h).not.toContain("8,968.60");
  });

  it("data + baseRoute 首屏按传入 data 自算合计，忽略 initial.totals", async () => {
    const rows = [
      {
        id: "1",
        name: "张三",
        status: "on",
        balance: 120,
        secret: "",
        locked: false,
      },
      {
        id: "2",
        name: "李四",
        status: "on",
        balance: 80,
        secret: "",
        locked: false,
      },
      {
        id: "3",
        name: "王五",
        status: "off",
        balance: 40,
        secret: "",
        locked: false,
      },
    ];
    const h = await html({
      data: rows,
      baseRoute: "/api/users",
      initial: { rows, total: 3, totals: { balance: 8968.6 } },
      syncUrl: false,
    });
    expect(h).toMatch(/dp-total-balance[^>]*>\s*240\.00/);
    expect(h).not.toContain("8,968.60");
  });

  it("hidden 列默认不渲染", async () => {
    const h = await html();
    expect(h).not.toContain("TOPSECRET");
    expect(h).not.toContain("隐藏列</th>");
  });

  it("分页：每页条数为 ui-view Select（无原生 select），上一页禁用，页码按钮", async () => {
    const h = await html();
    // 每页条数是 ui-view Select（自绘下拉）：无原生 <select>，触发按钮显示当前项
    expect(h).not.toMatch(/<select/);
    const ps = h.slice(h.indexOf('data-testid="dp-pagesize"'));
    expect(ps).toMatch(/aria-label="20 条\/页"/);
    expect(ps).toContain("10 条/页");
    expect(h).toMatch(/data-testid="dp-prev"/);
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-page-2"');
    expect(h).not.toContain('data-testid="dp-page-3"');
  });

  it("pageSize / defaultSort / initialQuery 影响首帧", async () => {
    const h = await html({
      pagination: { pageSize: 5, pageSizeOptions: [5, 10] },
      defaultSort: { prop: "balance", order: "desc" },
    });
    expect((h.match(/data-testid="dp-row-/g) ?? []).length).toBe(5);
    expect(h.indexOf("User 25")).toBeLessThan(h.indexOf("User 24"));
    const h2 = await html({ initialQuery: { page: 2, pageSize: 10 } });
    expect(h2).toContain("第 11-20 条，共 25 条");
    expect(h2).toContain("User 11");
  });

  it("首帧 page 越界（同页 URL 残留）夹回末页：有行、范围不倒置", async () => {
    // 复现：共 6 条、pageSize 10、page=2 → 旧行为 rows=[]、「第 11-6 条」
    const h = await html({
      data: data(6),
      initialQuery: { page: 2, pageSize: 10 },
    });
    expect(h).not.toContain('data-testid="dp-empty"');
    expect((h.match(/data-testid="dp-row-/g) ?? []).length).toBe(6);
    expect(h).toContain("第 1-6 条，共 6 条");
    expect(h).toContain("共 6 条记录");
    expect(h).toContain("User 1");
  });

  it("initialQuery.filters 在首帧生效", async () => {
    const h = await html({
      search: { props: [{ name: "name", label: "姓名" }] },
      initialQuery: { filters: { name: "User 2" } },
    });
    // User 2, User 20-25
    expect(h).toContain("共 7 条记录");
  });
});

/** 原生 disabled 属性，避开 class 里的 Tailwind `disabled:` */
const CHECKBOX_ATTR_DISABLED_RE =
  /<input\b[^>]*\stype="checkbox"[^>]*\sdisabled(?:=""|\s|\/?>)|<input\b[^>]*\sdisabled(?:=""|\s)[^>]*\stype="checkbox"/;
const selectDisabledRe = (id: string) =>
  new RegExp(
    `data-testid="${id}"[^>]*\\sdisabled(?:=""|\\s|\\/?>)|\\sdisabled(?:=""|\\s)[^>]*data-testid="${id}"`,
  );

describe("DataPanel SSR：布尔属性与转义", () => {
  it('不会输出 checked/disabled/selected="false"', async () => {
    const h = await html();
    const bad = h.match(
      /.{60}(?<!aria-)(checked|disabled|selected|readonly)="false".{10}/gi,
    );
    expect(bad).toBe(null);
  });

  it("locked 行：复选框与删除按钮禁用", async () => {
    const h = await html({ columns: withSelection() });
    const row1 = h.slice(
      h.indexOf('data-testid="dp-row-1"'),
      h.indexOf('data-testid="dp-row-2"'),
    );
    expect(row1).toMatch(CHECKBOX_ATTR_DISABLED_RE);
    const row2 = h.slice(
      h.indexOf('data-testid="dp-row-2"'),
      h.indexOf('data-testid="dp-row-3"'),
    );
    expect(row2).not.toMatch(CHECKBOX_ATTR_DISABLED_RE);
  });

  it("selection 列 disable 函数：按行禁用勾选，不影响未命中行", async () => {
    const h = await html({
      columns: [
        { type: "selection", disable: (row) => row.id === "2" },
        ...COLUMNS,
      ],
    });
    const row2 = h.slice(
      h.indexOf('data-testid="dp-row-2"'),
      h.indexOf('data-testid="dp-row-3"'),
    );
    expect(row2).toMatch(CHECKBOX_ATTR_DISABLED_RE);
    const row3 = h.slice(
      h.indexOf('data-testid="dp-row-3"'),
      h.indexOf('data-testid="dp-row-4"'),
    );
    expect(row3).not.toMatch(CHECKBOX_ATTR_DISABLED_RE);
  });

  it("actions 列 disable 函数：按行禁用查看／编辑／删除", async () => {
    const h = await html({
      columns: [
        { type: "selection" },
        ...COLUMNS,
        {
          type: "actions",
          disable: (row) => row.id === "2",
        },
      ],
    });
    const row2 = h.slice(
      h.indexOf('data-testid="dp-row-2"'),
      h.indexOf('data-testid="dp-row-3"'),
    );
    // data-testid 在包裹 span 上，disabled 在内部 button 上
    expect(row2).toMatch(
      /data-testid="dp-view-2"[\s\S]*?<button[^>]*\sdisabled(?:=""|\s|>)/,
    );
    expect(row2).toMatch(
      /data-testid="dp-edit-2"[\s\S]*?<button[^>]*\sdisabled(?:=""|\s|>)/,
    );
    expect(row2).toMatch(
      /data-testid="dp-delete-2"[\s\S]*?<button[^>]*\sdisabled(?:=""|\s|>)/,
    );
    const row3 = h.slice(
      h.indexOf('data-testid="dp-row-3"'),
      h.indexOf('data-testid="dp-row-4"'),
    );
    expect(row3).not.toMatch(
      /data-testid="dp-view-3"[\s\S]*?<button[^>]*\sdisabled(?:=""|\s|>)/,
    );
    expect(row3).not.toMatch(
      /data-testid="dp-edit-3"[\s\S]*?<button[^>]*\sdisabled(?:=""|\s|>)/,
    );
    expect(row3).not.toMatch(
      /data-testid="dp-delete-3"[\s\S]*?<button[^>]*\sdisabled(?:=""|\s|>)/,
    );
  });

  it("数据列 disable 函数：按行禁止行内编辑；locked 行同样没有编辑壳", async () => {
    const h = await html({
      columns: [
        { type: "selection" },
        { type: "index" },
        {
          prop: "name",
          label: "姓名",
          inline: "text",
          disable: (row) => row.id === "2",
        },
        ...COLUMNS.filter((c) => c.prop !== "name" && c.type !== "index"),
      ],
    });
    const row1 = h.slice(
      h.indexOf('data-testid="dp-row-1"'),
      h.indexOf('data-testid="dp-row-2"'),
    );
    const row2 = h.slice(
      h.indexOf('data-testid="dp-row-2"'),
      h.indexOf('data-testid="dp-row-3"'),
    );
    const row3 = h.slice(
      h.indexOf('data-testid="dp-row-3"'),
      h.indexOf('data-testid="dp-row-4"'),
    );
    expect(row1).not.toContain('data-testid="dp-edit-name-1"');
    expect(row2).not.toContain('data-testid="dp-edit-name-2"');
    expect(row3).toContain('data-testid="dp-edit-name-3"');
  });

  it("selection 列 disable:true：所有行勾选与表头全选都禁用", async () => {
    const h = await html({
      columns: [
        { type: "selection", disable: true },
        ...COLUMNS,
      ],
    });
    expect(h).toMatch(selectDisabledRe("dp-select-all"));
    expect(h).toMatch(selectDisabledRe("dp-select-2"));
    expect(h).toMatch(selectDisabledRe("dp-select-3"));
  });

  it("禁用的选择框带有更明显的灰色样式类（深浅色）", async () => {
    const h = await html({
      columns: [
        { type: "selection", disable: (row) => row.id === "2" },
        ...COLUMNS,
      ],
    });
    const row2 = h.slice(
      h.indexOf('data-testid="dp-row-2"'),
      h.indexOf('data-testid="dp-row-3"'),
    );
    const row3 = h.slice(
      h.indexOf('data-testid="dp-row-3"'),
      h.indexOf('data-testid="dp-row-4"'),
    );
    expect(row2).toContain("dp-select-cb");
    expect(row2).toContain("appearance-none");
    expect(row2).toContain("disabled:bg-slate-300");
    expect(row2).toContain("dark:disabled:bg-slate-600");
    expect(row2).toContain("disabled:border-slate-300");
    expect(row2).toContain("dark:disabled:border-slate-500");
    expect(row2).toMatch(CHECKBOX_ATTR_DISABLED_RE);
    expect(row3).toContain("dp-select-cb");
    expect(row3).toContain("disabled:bg-slate-300");
    expect(row3).not.toMatch(CHECKBOX_ATTR_DISABLED_RE);
    // 全部禁用时表头全选同样带灰底类
    const hall = await html({
      columns: [
        { type: "selection", disable: true },
        ...COLUMNS,
      ],
    });
    const allIdx = hall.indexOf('data-testid="dp-select-all"');
    const allOpen = hall.slice(Math.max(0, allIdx - 2500), allIdx + 40);
    expect(allOpen).toContain("dp-select-cb");
    expect(allOpen).toContain("disabled:bg-slate-300");
    expect(allOpen).toContain("dark:disabled:bg-slate-600");
    expect(allOpen).toMatch(selectDisabledRe("dp-select-all"));
  });

  it("selection 列仅部分行 disable 时，表头全选仍可用", async () => {
    const h = await html({
      columns: [
        { type: "selection", disable: (row) => row.id === "2" },
        ...COLUMNS,
      ],
    });
    expect(h).not.toMatch(selectDisabledRe("dp-select-all"));
  });

  it("单元格内容被转义", async () => {
    const h = await html({
      data: [{
        id: "1",
        name: '<img src=x onerror="alert(1)">',
        status: "on",
        balance: 1,
      }],
    });
    expect(h).not.toContain("<img src=x onerror");
    expect(h).toContain("&lt;img");
  });

  it("DATA_PANEL_CSS 已清空（样式迁 Tailwind，不再注入内联 <style>）", () => {
    expect(DATA_PANEL_CSS).toBe("");
  });

  it("移动端断点：卡片贴边但表格内边距始终保留；分页与各端一样左右一行（Tailwind max-sm）", async () => {
    const h = await html();
    // 卡片外边距可在移动端清掉；体内边距始终保留
    expect(h).toContain("max-sm:!mx-0");
    expect(h).toContain("max-sm:!mt-0");
    expect(h).toContain("dp-table-wrap");
    expect(h).toContain("!px-2.5");
    expect(h).toContain("!py-2.5");
    expect(h).not.toContain("max-sm:!px-0");
    expect(h).not.toContain("max-sm:!pt-0");
    // 分页：各端同一行，条数在左、控件在右，不再列布局
    expect(h).toContain("dp-pg-ctrls");
    expect(h).toContain("dp-range");
    expect(h).toContain("justify-between");
    expect(h).not.toContain("max-sm:!flex-col");
    expect(h).not.toContain("max-sm:!order-1");
    expect(h).not.toContain("max-sm:!order-2");
  });

  it("SSR 不再注入 DataPanel 面板 CSS；工具栏类为 Tailwind", async () => {
    const h = await html();
    // 不应再有面板大块 <style>（打印 HTML 的 <style> 在新窗口字符串里，不在面板 SSR）
    expect(h).not.toContain(".dp-tb-nf {");
    expect(h).toContain("dp-tb");
    expect(h).toContain("dp-tb-nf");
    expect(h).toContain("dark:hover:!bg-slate-800/60");
  });
});

describe("DataPanel SSR：能力开关", () => {
  it("有 form 的 data 模式：添加 / 编辑 / 删除 / 选择列都在", async () => {
    const h = await html({ columns: withSelection() });
    expect(h).toContain('data-testid="dp-select-all"');
    expect(h).toContain('data-testid="dp-edit-2"');
    expect(h).toContain('data-testid="dp-delete-2"');
    expect(h).toContain('data-testid="dp-view-2"');
  });

  it("没有 form 的 data 模式是只读：没有编辑 / 删除 / 选择列，仍可查看", async () => {
    const h = await html({ form: undefined });
    expect(h).not.toContain('data-testid="dp-select-all"');
    expect(h).not.toContain('data-testid="dp-delete-2"');
    expect(h).not.toContain('data-testid="dp-edit-2"');
    expect(h).toContain('data-testid="dp-view-2"');
  });

  it("caps 可以关闭 remove / view / update", async () => {
    const h = await html({
      caps: { remove: false, view: false, update: false },
    });
    expect(h).not.toContain('data-testid="dp-delete-2"');
    expect(h).not.toContain('data-testid="dp-view-2"');
    expect(h).not.toContain('data-testid="dp-edit-2"');
    expect(h).not.toContain('data-testid="dp-select-all"');
    expect(h).not.toContain(">操作</th>");
  });

  it("selectable=false 去掉选择列", async () => {
    expect(
      await html({
        columns: withSelection(),
        selectable: false,
      }),
    ).not.toContain(
      'data-testid="dp-select-all"',
    );
  });

  it("空数据显示空状态且没有合计行", async () => {
    const h = await html({ data: [] });
    expect(h).toContain('data-testid="dp-empty"');
    expect(h).toContain("暂无数据");
    expect(h).not.toContain('data-testid="dp-totals"');
    expect(h).toContain("共 0 条记录");
  });

  it("异步数据源：服务端不请求，首帧是空表（挂载后再加载）", async () => {
    let calls = 0;
    const ds: DataSource = {
      list() {
        calls++;
        return Promise.resolve({ rows: data(3), total: 3 });
      },
    };
    const h = await html({ data: undefined, dataSource: ds, form: undefined });
    expect(calls).toBe(0);
    expect(h).toContain('data-testid="dp-empty"');
  });

  it("initial 预取数据直接渲染，且不调用 list", async () => {
    let calls = 0;
    const ds: DataSource = {
      list() {
        calls++;
        return Promise.resolve({ rows: [], total: 0 });
      },
    };
    const h = await html({
      data: undefined,
      dataSource: ds,
      initial: { rows: data(2), total: 2 },
      form: undefined,
    });
    expect(calls).toBe(0);
    expect(h).toContain("共 2 条记录");
    expect(h).toContain("User 2");
  });

  it("同步数据源（sync: true）首帧直出", async () => {
    const ds: DataSource = {
      sync: true,
      list: () => ({ rows: data(4), total: 4 }),
    };
    const h = await html({ data: undefined, dataSource: ds, form: undefined });
    expect(h).toContain("共 4 条记录");
  });

  it("同时传 data 与 baseRoute：首帧用 data 渲染且不请求 list", async () => {
    const calls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL) => {
      calls.push(String(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({ rows: [{ id: "9", name: "API" }], total: 99 }),
          {
            headers: { "content-type": "application/json" },
          },
        ),
      );
    }) as typeof fetch;
    try {
      const h = await html({
        panelKey: "seed-users",
        data: [
          { id: "1", name: "张三", status: "on", balance: 10 },
          { id: "2", name: "李四", status: "off", balance: 20 },
        ],
        baseRoute: "/api/users",
        syncUrl: false,
      });
      expect(calls).toEqual([]);
      expect(h).toContain("张三");
      expect(h).toContain("李四");
      expect(h).toContain("共 2 条记录");
      expect(h).not.toContain("API");
    } finally {
      globalThis.fetch = orig;
      panelHandles.delete("seed-users");
    }
  });

  it("data + baseRoute：initial.total 作为首屏总数，不按 data.length 臆造", async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = ((() => {
      throw new Error("list should not run on first paint");
    }) as unknown) as typeof fetch;
    try {
      const h = await html({
        panelKey: "seed-total",
        data: [
          { id: "1", name: "张三", status: "on", balance: 10 },
          { id: "2", name: "李四", status: "off", balance: 20 },
        ],
        baseRoute: "/api/users",
        initial: { rows: [], total: 128 },
        syncUrl: false,
      });
      expect(h).toContain("张三");
      expect(h).toContain("李四");
      expect(h).toContain("共 128 条记录");
      expect(h).toContain("第 1-20 条，共 128 条");
    } finally {
      globalThis.fetch = orig;
      panelHandles.delete("seed-total");
    }
  });

  it("data + baseRoute：刷新与翻页才请求 list", async () => {
    const calls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL) => {
      calls.push(String(input));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            rows: [{ id: "9", name: "API", status: "on", balance: 1 }],
            total: 40,
          }),
          { headers: { "content-type": "application/json" } },
        ),
      );
    }) as typeof fetch;
    const origSet = panelHandles.set.bind(panelHandles);
    let handle: {
      reload: () => Promise<void>;
      setQuery: (patch: { page?: number }) => void;
    } | undefined;
    panelHandles.set = ((key, value) => {
      if (key === "seed-reload") handle = value;
      return origSet(key, value);
    }) as typeof panelHandles.set;
    try {
      await html({
        panelKey: "seed-reload",
        data: [{ id: "1", name: "王五", status: "on", balance: 10 }],
        baseRoute: "/api/users",
        syncUrl: false,
      });
      expect(calls).toEqual([]);
      expect(Boolean(handle)).toBe(true);
      await handle!.reload();
      expect(calls.length).toBe(1);
      expect(calls[0].includes("/api/users")).toBe(true);
      calls.length = 0;
      handle!.setQuery({ page: 2 });
      await new Promise((r) => setTimeout(r, 50));
      expect(calls.length).toBe(1);
      expect(calls[0].includes("page=2")).toBe(true);
    } finally {
      panelHandles.set = origSet;
      globalThis.fetch = orig;
      panelHandles.delete("seed-reload");
    }
  });
});

describe("DataPanel SSR：文案与自定义", () => {
  it("en-US 文案；messages 覆盖", async () => {
    const h = await html({ locale: "en-US", messages: { total: "Sum" } });
    expect(h).toContain("25 records");
    expect(h).toContain("1-20 of 25");
    expect(h).toContain("20 / page");
    expect(h).toContain("Sum");
    expect(h).toContain(">Actions</th>");
  });

  it("view/form/search 对象配置：{ title, props } 首帧不炸", async () => {
    const h = await html({
      title: "查看对象",
      data: [{ id: "1", name: "Alice", email: "a@x.com", status: "active" }],
      columns: [
        { prop: "name", label: "姓名" },
        {
          prop: "status",
          label: "状态",
          type: "tag",
          options: [
            { value: "active", label: "启用" },
            { value: "disabled", label: "停用" },
          ],
        },
        { type: "actions", actions: { view: true, edit: true, remove: false } },
      ],
      caps: {
        create: true,
        update: true,
        view: true,
        remove: false,
        import: false,
        export: false,
        print: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
      search: {
        title: "查询",
        props: [{ prop: "name", label: "姓名" }],
      },
      form: {
        title: (row) => (row.id ? `修改 · ${row.name}` : "注册用户"),
        props: [{ prop: "name", label: "姓名", required: true }],
      },
      view: {
        title: (row) => `详情 · ${row.name}`,
        props: [
          { prop: "name" },
          { prop: "status", click: "toggle" },
        ],
        actions: {
          password: { label: "密码", action: () => {} },
          site: { label: "主页", href: (row) => `/u/${row.id}` },
          close: true,
        },
      },
    });
    expect(h).toContain("查看对象");
    expect(h).toContain('data-testid="dp-view-1"');
  });

  it("column value／color／formatter：文本标签／JSX／可信 HTML", async () => {
    const h = await html({
      title: "列函数",
      data: [
        { id: "1", name: "Alice", flag: 1 },
        { id: "2", name: "Bob", flag: 0 },
      ],
      columns: [
        { prop: "name", label: "姓名" },
        {
          prop: "flag",
          label: "标记",
          type: "tag",
          value: (r) => (r.flag === 1 ? "开启" : "关闭"),
          color: (r) => (r.flag === 1 ? "success" : "danger"),
        },
        {
          prop: "flag",
          label: "节点",
          value: (r) => <b data-x="flag-node">{r.flag === 1 ? "Y" : "N"}</b>,
        },
        {
          prop: "flag",
          label: "HTML",
          formatter: (_r, raw) =>
            raw === 1 ? '<i data-x="flag-html">ON</i>' : "<i>OFF</i>",
        },
      ],
      search: {
        title: "筛选用户",
        props: [{ prop: "name", label: "姓名" }],
      },
      form: {
        title: (row) => (row.id ? `修改 · ${row.name}` : "添加用户"),
        props: [{ prop: "name", required: true }],
      },
      view: {
        title: (row) => `详情 · ${row.name}`,
        props: [{ prop: "name" }, { prop: "flag", label: "标记" }],
      },
      caps: {
        create: true,
        update: true,
        view: true,
        remove: false,
        import: false,
        export: false,
        print: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
    });
    expect(h).toContain("开启");
    expect(h).toContain("关闭");
    expect(h).toContain("dp-tag-success");
    expect(h).toContain("dp-tag-danger");
    expect(h).toContain('data-x="flag-node"');
    // 可信 HTML 经 ref 写入；SSR 下 ref 会跑 ssr-dom innerHTML
    expect(h.includes("flag-html") || h.includes("<i")).toBe(true);
  });

  it("renderCell / children / class；无 toolbarExtra／rowExtra 槽", async () => {
    const h = await html({
      columns: withActions({
        view: false,
        edit: false,
        remove: false,
        freeze: {
          label: "冻结",
          tone: "danger",
          action: () => {},
        },
      }),

      renderCell: { name: (r) => <b data-x="cell">{String(r.name)}!</b> },
      children: <div data-x="child">CHILD</div>,
      class: "my-panel",
      toolbar: {
        create: false,
        notify: { label: "通知", tone: "primary", action: () => {} },
      },
    });
    expect(h).toContain('<b data-x="cell">');
    expect(h).toContain('data-x="child"');
    expect(h).toContain("dp-card my-panel");
    // 双轨插槽已废止
    expect(h).not.toContain('data-x="tbx"');
    expect(h).not.toContain('data-x="extra"');
    // tone 自定义经 Record（无 confirm 字段）
    expect(h).toContain('data-testid="dp-tb-extra-notify"');
    expect(h).toContain("通知");
    expect(h).toContain('data-testid="dp-row-extra-freeze-1"');
    expect(h).toContain("冻结");
    expect(h).toContain("dp-act-del"); // tone=danger
  });

  it("title／label 互落 tip；工具栏没有批量设为按钮", async () => {
    const h = await html({
      columns: withSelection(withActions({
        view: false,
        edit: false,
        remove: false,
        assign: { label: "分配", action: () => {} },
      })),

      caps: {
        create: false,
        print: false,
        import: false,
        export: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
      toolbar: {
        refresh: true,
        assign: { label: "分配全部", action: () => {} },
        titled: { title: "仅标题", action: () => {} }, // 无 label → 显示用 title
        bare: { action: () => {} },
      },
      dataSource: {
        sync: true,
        list: () => ({
          rows: [{ id: "1", name: "A", status: "active" }],
          total: 1,
        }),
        setField: async () => ({ removed: 0, failed: [] }),
        remove: async () => ({ removed: 0, failed: [] }),
      },
    });
    // 自定义有 label → aria／可见文案用 label（tip 规则同）
    expect(h).toContain("分配全部");
    expect(h).toContain('data-testid="dp-tb-extra-assign"');
    expect(h).toContain('data-testid="dp-tb-extra-titled"');
    expect(h).toContain("仅标题"); // 无 label 有 title → 显示 title
    expect(h).toContain('data-testid="dp-tb-extra-bare"');
    expect(h).toContain('aria-label="分配"');
    // 不再提供内置批量「设为…」按钮
    expect(h).not.toContain('data-testid="dp-batch-status"');
    expect(h).not.toContain('data-testid="dp-batch-status-');
    // 选择列因 columns 声明 type:selection 出现；批量条仅选中后出现（SSR 无选中 → 无 batch-bar 内容）
    expect(h).toContain('data-testid="dp-select-1"');
  });

  it("toolbar: false 整栏工具栏不渲染；省略仍渲染", async () => {
    const off = await html({ toolbar: false });
    expect(off).not.toContain('data-testid="data-panel-toolbar"');
    expect(off).toContain('data-testid="dp-table"');
    expect(off).toContain('data-testid="dp-pagination"');
    expect(off).toContain("dp-table-wrap");
    expect(off).toContain("dp-pg");
    expect(off).toContain("dp-pg-ctrls");
    expect(off).toContain("dp-range");
    const on = await html({});
    expect(on).toContain('data-testid="data-panel-toolbar"');
    expect(on).toContain("bg-[rgb(240_243_248)]");
    expect(on).toContain("dark:bg-[rgb(19_28_49)]");
    expect(on).toContain("!border-b-0");
    expect(on).toContain("border-y");
    expect(on).toContain("border-slate-300");
    expect(on).toContain("dark:border-slate-600/40");
    const rec = await html({ toolbar: { refresh: true, print: false } });
    expect(rec).toContain('data-testid="data-panel-toolbar"');
    expect(rec).toContain('data-testid="dp-refresh"');
  });

  it("未声明 selection 列时即使 caps.remove 为 true 也不出现勾选列", async () => {
    const h = await html({
      columns: withActions({ view: false, edit: false, remove: false }),

      caps: {
        remove: true,
        create: false,
        print: false,
        import: false,
        export: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
      toolbar: { refresh: true },
      dataSource: {
        sync: true,
        list: () => ({
          rows: [{ id: "1", name: "A", status: "active" }],
          total: 1,
        }),
        setField: async () => ({ removed: 0, failed: [] }),
        remove: async () => ({ removed: 0, failed: [] }),
      },
    });
    expect(h).not.toContain('data-testid="dp-select-all"');
    expect(h).not.toContain('data-testid="dp-select-1"');
    expect(h).not.toContain('data-testid="dp-batch-bar"');
  });

  it("panelKey 进入根节点 data-testid 与工具栏标记", async () => {
    const h = await html({ panelKey: "users" });
    expect(h).toContain('data-testid="panel-users"');
    expect(h).toContain('data-dp-tools="users"');
  });

  it("工具栏按钮位置类：首个无左边框处理、末个无右边框处理", async () => {
    const h = await html({
      search: { props: [{ name: "name", label: "姓名" }] },
    });
    expect(h).toContain("dp-tb dp-tb-first dp-tb-nl");
    expect(h).toContain("dp-tb dp-tb-nf dp-tb-last");
    expect(h).toContain("dp-tb dp-tb-nf dp-tb-nl");
  });

  it("disable:true 仍渲染且带 disabled；show:false 才隐藏；声明省略 show→显示", async () => {
    const h = await html({
      columns: withActions({
        view: false,
        edit: { disable: true },
        remove: false,
        assign: {
          label: "分配",
          disable: (item) => !!item.locked,
          action: () => {},
        },
      }),

      caps: {
        create: false,
        print: false,
        import: false,
        export: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
      toolbar: {
        create: { disable: true },
        freeze: { label: "冻结", disable: false, action: () => {} },
        ghost: { label: "幽灵", show: false, action: () => {} },
        refresh: true,
      },
    });
    const hasDisabledAttr = (chunk: string) =>
      /<button\b[^>]*\sdisabled(?:=""|\s|>)/.test(chunk);
    expect(h.includes('data-testid="dp-tb-extra-freeze"')).toBe(true);
    expect(h.includes("冻结")).toBe(true);
    expect(h.includes('data-testid="dp-tb-extra-ghost"')).toBe(false);
    expect(h.includes("幽灵")).toBe(false);
    expect(hasDisabledAttr(h.slice(0, h.indexOf("冻结") + 50))).toBe(true); // create before freeze
    expect(h.includes('data-testid="dp-edit-1"')).toBe(true);
    const afterEdit = h.slice(
      h.indexOf('data-testid="dp-edit-1"'),
      h.indexOf('data-testid="dp-edit-1"') + 900,
    );
    expect(hasDisabledAttr(afterEdit)).toBe(true);
    const afterA1 = h.slice(
      h.indexOf('data-testid="dp-row-extra-assign-1"'),
      h.indexOf('data-testid="dp-row-extra-assign-1"') + 900,
    );
    expect(hasDisabledAttr(afterA1)).toBe(true);
    const afterA2 = h.slice(
      h.indexOf('data-testid="dp-row-extra-assign-2"'),
      h.indexOf('data-testid="dp-row-extra-assign-2"') + 900,
    );
    expect(hasDisabledAttr(afterA2)).toBe(false);
  });

  it("toolbar／column.actions：无原生 HTML title 提示（仅 Tooltip）", async () => {
    const h = await html({
      columns: withActions({
        view: true,
        edit: true,
        remove: false,
        assign: { label: "分配", action: () => {} },
      }),

      caps: {
        import: false,
        export: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
      toolbar: {
        create: true,
        print: true,
        refresh: true,
        freeze: { label: "冻结", action: () => {} },
      },
    });
    // 原生 title= 会与 Tooltip 叠成双提示；工具栏／行钮不得带 tip 文案作 HTML title
    expect(h).not.toMatch(/\btitle="打印"/);
    expect(h).not.toMatch(/\btitle="新建"/);
    expect(h).not.toMatch(/\btitle="刷新"/);
    expect(h).not.toMatch(/\btitle="查看"/);
    expect(h).not.toMatch(/\btitle="编辑"/);
    expect(h).not.toMatch(/\btitle="分配"/);
    expect(h).not.toMatch(/\btitle="冻结"/);
    expect(h).not.toMatch(/\btitle="assign"/);
    expect(h).not.toMatch(/\btitle="freeze"/);
    // 行钮可访问名仍在（Btn 外层 aria-label，不再用 title）
    expect(h).toMatch(/aria-label="查看"/);
    expect(h).toMatch(/aria-label="编辑"/);
    expect(h).toMatch(/data-testid="dp-tb-extra-freeze"/);
    expect(h).toMatch(/data-testid="dp-row-extra-assign-1"/);
  });

  it("工具栏按钮数量随能力变化", async () => {
    const count = (h: string) =>
      (h.match(/class="[^"]*dp-tb[ "]/g) ?? []).length;
    // 添加 + 导入 + 刷新 + 打印 + 导出 + 列设置 + 行高 + 全屏 + 复制
    expect(count(await html())).toBe(9);
    // + 搜索
    expect(
      count(
        await html({ search: { props: [{ name: "name", label: "姓名" }] } }),
      ),
    )
      .toBe(10);
    // 只读：刷新 + 打印 + 导出 + 列设置 + 行高 + 全屏 + 复制
    expect(count(await html({ form: undefined }))).toBe(7);
    expect(
      count(
        await html({
          caps: {
            print: false,
            columns: false,
            export: false,
            import: false,
            density: false,
            fullscreen: false,
            copy: false,
          },
        }),
      ),
    ).toBe(2);
  });

  it("form.render / view.render 配置可 SSR（关闭态不抛错）", async () => {
    const h = await html({
      form: {
        render: () => <div data-testid="ssr-form-render">custom-form</div>,
      },
      view: {
        render: () => <div data-testid="ssr-view-render">custom-view</div>,
        actions: { close: true },
      },
      columns: withActions({ view: true, edit: true, remove: false }),
    });
    expect(h).toContain("用户");
    expect(h).toContain('data-testid="panel-data-panel"');
  });

  it("SSR 时 baseRoute 只有 /api、没有页面路由也不抛错", async () => {
    const h = String(
      await renderToString(() => (
        <DataPanel
          title="用户"
          columns={COLUMNS}
          baseRoute="/api"
          apiMode="action"
        />
      )),
    );
    expect(h).toContain("用户");
    expect(h).toContain('data-testid="panel-data-panel"');
  });

  it("详情弹层首帧关闭：view 标签配置不会出现在 HTML，查看按钮仍在", async () => {
    const h = await html({
      data: [{
        id: "1",
        name: "张三",
        status: "on",
        balance: 100,
        secret: "x",
      }],
      view: {
        descriptions: {
          labelColPercent: 28,
          labelMinWidth: "7rem",
        },
        props: [
          {
            prop: "name",
            label: "姓名",
            labelAlign: { vertical: "center", horizontal: "left" },
          },
        ],
      },
    });
    expect(h).toContain("张三");
    expect(h).toContain('data-testid="dp-view-1"');
    // destroyOnClose 且 viewRow 初始为 null，关闭态不渲染详情主体（避免与 dp-view-1 按钮误匹配）
    expect(h).not.toContain('data-testid="dp-view">');
    expect(h).not.toContain("minmax(7rem, 28%)");
  });
});

describe("DataPanel SSR：actions 列宽度", () => {
  it("type:actions 的 width／minWidth／maxWidth 写到表头、单元格与合计行 style", async () => {
    const h = await html({
      columns: [
        { prop: "name", label: "姓名", width: 200 },
        { prop: "balance", label: "余额", type: "money", total: true },
        {
          type: "actions",
          width: 150,
          minWidth: 120,
          maxWidth: 200,
          actions: { view: true, edit: true, remove: true },
        },
      ],
      data: data(1),
      form: undefined,
    });
    const headStart = h.indexOf('data-testid="dp-colhead-actions"');
    expect(headStart).toBeGreaterThanOrEqual(0);
    const thOpen = h.lastIndexOf("<th", headStart);
    const thClose = h.indexOf("</th>", headStart);
    expect(thOpen).toBeGreaterThanOrEqual(0);
    expect(thClose).toBeGreaterThan(thOpen);
    const head = h.slice(thOpen, thClose);
    expect(head).toContain("width:150px");
    expect(head).toContain("min-width:120px");
    expect(head).toContain("max-width:200px");

    const viewBtn = h.indexOf('data-testid="dp-view-1"');
    expect(viewBtn).toBeGreaterThanOrEqual(0);
    const cell = h.slice(Math.max(0, viewBtn - 500), viewBtn);
    const tdOpen = cell.lastIndexOf("<td");
    expect(tdOpen).toBeGreaterThanOrEqual(0);
    const tdTag = cell.slice(tdOpen, cell.indexOf(">", tdOpen) + 1);
    expect(tdTag).toContain("width:150px");
    expect(tdTag).toContain("min-width:120px");
    expect(tdTag).toContain("max-width:200px");

    const totalsStart = h.indexOf('data-testid="dp-totals"');
    expect(totalsStart).toBeGreaterThanOrEqual(0);
    const totals = h.slice(totalsStart, totalsStart + 1200);
    expect(totals).toContain("width:150px");
    expect(totals).toContain("min-width:120px");
    expect(totals).toContain("max-width:200px");
  });
});

describe("DataPanel SSR：勾选列只由 columns 的 type:selection 决定", () => {
  it("columns 未声明 selection 时不出现表头或行勾选框", async () => {
    const h = await html();
    expect(h).not.toContain('data-testid="dp-select-all"');
    expect(h).not.toContain('data-testid="dp-select-1"');
    expect(h).not.toContain('data-testid="dp-select-2"');
  });

  it('columns 声明 { type:"selection" } 时出现勾选列', async () => {
    const h = await html({ columns: withSelection() });
    expect(h).toContain('data-testid="dp-select-all"');
    expect(h).toContain('data-testid="dp-select-1"');
    expect(h).toContain('data-testid="dp-select-2"');
  });

  it("声明了 selection 后即使 caps.remove 为 false 仍显示勾选列", async () => {
    const h = await html({
      columns: withSelection(),
      caps: { remove: false },
    });
    expect(h).toContain('data-testid="dp-select-all"');
    expect(h).toContain('data-testid="dp-select-2"');
  });
});

describe("DataPanel SSR：工具栏上下文与 syncUrl", () => {
  it("工具栏 show／disable 接收 { selected, rows, query }；零参函数仍可用", async () => {
    const h = await html({
      initialQuery: { page: 2, pageSize: 10 },
      caps: {
        create: false,
        print: false,
        import: false,
        export: false,
        columns: false,
        density: false,
        fullscreen: false,
        copy: false,
      },
      toolbar: {
        refresh: true,
        zeroHide: { label: "零参藏", show: () => false, action: () => {} },
        zeroShow: { label: "零参显", show: () => true, action: () => {} },
        ctxHide: {
          label: "次页藏",
          show: (ctx) => ctx.query.page !== 2,
          action: () => {},
        },
        ctxShow: {
          label: "次页显",
          show: (ctx) => ctx.query.page === 2 && ctx.rows.length > 0,
          action: () => {},
        },
        ctxDisable: {
          label: "有行禁",
          disable: (ctx) => ctx.rows.length > 0 && ctx.selected.length === 0,
          action: () => {},
        },
      },
    });
    expect(h.includes("零参藏")).toBe(false);
    expect(h.includes('data-testid="dp-tb-extra-zeroHide"')).toBe(false);
    expect(h.includes("零参显")).toBe(true);
    expect(h.includes('data-testid="dp-tb-extra-zeroShow"')).toBe(true);
    expect(h.includes("次页藏")).toBe(false);
    expect(h.includes("次页显")).toBe(true);
    expect(h.includes('data-testid="dp-tb-extra-ctxShow"')).toBe(true);
    const i = h.indexOf('data-testid="dp-tb-extra-ctxDisable"');
    expect(i).toBeGreaterThan(-1);
    // testid 在包裹 span 上，button 在其后；disabled 属性在超长 class 之后
    const start = h.indexOf("<button", i);
    const open = h.slice(start, h.indexOf(">", start) + 1);
    expect(/\sdisabled(?:=""|\s|>)/.test(open)).toBe(true);
  });

  function rowOpenTag(h: string, id = "2"): string {
    const marker = `data-testid="dp-row-${id}"`;
    const at = h.indexOf(marker);
    expect(at).toBeGreaterThan(-1);
    const start = h.lastIndexOf("<tr", at);
    expect(start).toBeGreaterThan(-1);
    return h.slice(start, h.indexOf(">", at) + 1);
  }

  it("默认点击行不打开详情：行上无 cursor-pointer，操作列仍有眼睛", async () => {
    const h = await html({
      columns: withActions({ view: true, edit: false, remove: false }),
    });
    expect(rowOpenTag(h).includes("cursor-pointer")).toBe(false);
    expect(h).toContain('data-testid="dp-view-2"');
  });

  it("openViewOnRowClick 开启且 caps.view 时行可点；caps.view=false 时仍不可点", async () => {
    const on = await html({
      openViewOnRowClick: true,
      columns: withActions({ view: true, edit: false, remove: false }),
    });
    expect(rowOpenTag(on).includes("cursor-pointer")).toBe(true);
    expect(on).toContain('data-testid="dp-view-2"');

    const offCaps = await html({
      openViewOnRowClick: true,
      caps: { view: false },
      autoActions: false,
    });
    expect(rowOpenTag(offCaps).includes("cursor-pointer")).toBe(false);
  });

  it("传入 onRowClick 时行可点（只走回调，不依赖 openViewOnRowClick）", async () => {
    const h = await html({
      onRowClick: () => {},
      caps: { view: false },
      autoActions: false,
    });
    expect(rowOpenTag(h).includes("cursor-pointer")).toBe(true);
  });

  it("syncUrl=false 不读地址栏；默认与前缀会读对应参数", async () => {
    const g = globalThis as { location?: { search?: string } };
    const prev = Object.getOwnPropertyDescriptor(globalThis, "location");
    const setSearch = (search: string) => {
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        writable: true,
        value: { search },
      });
    };
    try {
      setSearch("?page=2&pageSize=10");
      const on = await html();
      expect(on).toContain("第 11-20 条，共 25 条");
      expect(on).toContain("User 11");
      const off = await html({ syncUrl: false, initialQuery: { page: 1 } });
      expect(off).toContain("第 1-20 条，共 25 条");
      expect(off).toContain("User 1");
      const ignoredPrefix = await html({ syncUrl: { prefix: "p1" } });
      expect(ignoredPrefix).toContain("第 1-20 条，共 25 条");
      setSearch("?p1_page=2&p1_pageSize=10");
      const prefixed = await html({ syncUrl: { prefix: "p1" } });
      expect(prefixed).toContain("第 11-20 条，共 25 条");
      const unprefixed = await html();
      expect(unprefixed).toContain("第 1-20 条，共 25 条");
    } finally {
      if (prev) Object.defineProperty(globalThis, "location", prev);
      else delete g.location;
    }
  });
});
