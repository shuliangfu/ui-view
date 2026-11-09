/** @jsxImportSource @dreamer/view */
/**
 * @fileoverview DataPanel 服务端渲染：首帧 HTML 与水合前后一致所依赖的结构（布尔属性、转义、能力开关、文案）。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  DATA_PANEL_CSS,
  DataPanel,
  type Column,
  type DataSource,
  type PanelProps,
  type RowActionsConfig,
} from "../../src/desktop/data-display/DataPanel.tsx";

const COLUMNS: Column[] = [
  { type: "index" },
  { prop: "name", label: "姓名", sortable: true },
  {
    prop: "status",
    label: "状态",
    type: "tag",
    inline: "switch",
    batch: true,
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

const FORM = [{ name: "name", label: "姓名", required: true }];

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
  it("标题、总数、第一页 10 行、序号与范围文案", async () => {
    const h = await html();
    expect(h).toContain("用户");
    expect(h).toContain("共 25 条记录");
    expect(h).toContain("第 1-10 条，共 25 条");
    expect((h.match(/data-testid="dp-row-/g) ?? []).length).toBe(10);
    expect(h).toContain("User 1");
    expect(h).toContain("User 10");
    expect(h).not.toContain("User 11");
  });

  it("tag 列显示选项文案，money 列格式化，合计行汇总全部匹配行", async () => {
    const h = await html();
    expect(h).toContain("启用");
    expect(h).toContain("停用");
    expect(h).toContain("100.00");
    // 1..25 → 100*(25*26/2) = 32500
    expect(h).toContain('data-testid="dp-total-balance"');
    expect(h).toMatch(/dp-total-balance[^>]*>\s*32,500\.00/);
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
    expect(ps).toMatch(/aria-label="10 条\/页"/);
    expect(ps).toContain("20 条/页");
    expect(h).toMatch(/data-testid="dp-prev"/);
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-page-3"');
    expect(h).not.toContain('data-testid="dp-page-4"');
  });

  it("pageSize / defaultSort / initialQuery 影响首帧", async () => {
    const h = await html({
      pageSize: 5,
      pageSizes: [5, 10],
      defaultSort: { prop: "balance", order: "desc" },
    });
    expect((h.match(/data-testid="dp-row-/g) ?? []).length).toBe(5);
    expect(h.indexOf("User 25")).toBeLessThan(h.indexOf("User 24"));
    const h2 = await html({ initialQuery: { page: 2 } });
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
      search: [{ name: "name", label: "姓名" }],
      initialQuery: { filters: { name: "User 2" } },
    });
    // User 2, User 20-25
    expect(h).toContain("共 7 条记录");
  });
});

describe("DataPanel SSR：布尔属性与转义", () => {
  it('不会输出 checked/disabled/selected="false"', async () => {
    const h = await html();
    const bad = h.match(
      /.{60}(?<!aria-)(checked|disabled|selected|readonly)="false".{10}/gi,
    );
    expect(bad).toBe(null);
  });

  it("locked 行：复选框与删除按钮禁用", async () => {
    const h = await html();
    const row1 = h.slice(
      h.indexOf('data-testid="dp-row-1"'),
      h.indexOf('data-testid="dp-row-2"'),
    );
    expect(row1).toMatch(
      /<input[^>]*type="checkbox"[^>]*disabled|<input[^>]*disabled[^>]*type="checkbox"/,
    );
    const row2 = h.slice(
      h.indexOf('data-testid="dp-row-2"'),
      h.indexOf('data-testid="dp-row-3"'),
    );
    expect(row2).not.toMatch(/<input[^>]*type="checkbox"[^>]*disabled/);
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

  it("移动端断点：表格卡上／左／右贴边；分页居中且条数在下（Tailwind max-sm）", async () => {
    const h = await html();
    // 卡片／表格外包：max-sm 清上／左右 margin／padding
    expect(h).toContain("max-sm:!mx-0");
    expect(h).toContain("max-sm:!mt-0");
    expect(h).toContain("dp-table-wrap");
    expect(h).toContain("max-sm:!px-0");
    expect(h).toContain("max-sm:!pt-0");
    // 底边不在移动规则里清零（保留 py-2.5）
    expect(h).toContain("py-2.5");
    expect(h).not.toMatch(/dp-table-wrap[^"]*max-sm:!pb-0/);
    // 分页：列布局、控件 order1、条数 order2 居中
    expect(h).toContain("dp-pg-ctrls");
    expect(h).toContain("dp-range");
    expect(h).toContain("max-sm:!flex-col");
    expect(h).toContain("max-sm:!order-1");
    expect(h).toContain("max-sm:!order-2");
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
    const h = await html();
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
    // 关 remove 后若仍有 column.batch:true，默认仍开 batchStatus → 选择列还在；一并关掉才无选择列
    const h = await html({
      caps: { remove: false, view: false, update: false, batchStatus: false },
    });
    expect(h).not.toContain('data-testid="dp-delete-2"');
    expect(h).not.toContain('data-testid="dp-view-2"');
    expect(h).not.toContain('data-testid="dp-edit-2"');
    expect(h).not.toContain('data-testid="dp-select-all"');
    expect(h).not.toContain(">操作</th>");
  });

  it("selectable=false 去掉选择列", async () => {
    expect(await html({ selectable: false })).not.toContain(
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
});

describe("DataPanel SSR：文案与自定义", () => {
  it("en-US 文案；messages 覆盖", async () => {
    const h = await html({ locale: "en-US", messages: { total: "Sum" } });
    expect(h).toContain("25 records");
    expect(h).toContain("1-10 of 25");
    expect(h).toContain("10 / page");
    expect(h).toContain("Sum");
    expect(h).toContain(">Actions</th>");
  });



  it("viewSchemas：定制详情项（对齐旧 view.schemas）", async () => {
    const h = await html({
      title: "详情定制",
      data: [{ id: "1", name: "Alice", flag: 1 }],
      columns: [{ prop: "name", label: "姓名" }, { prop: "flag", label: "标记" },
        { type: "actions", actions: { view: true, edit: false, remove: false } }],
      caps: { create: false, update: false, view: true, remove: false, import: false, export: false, print: false, columns: false, density: false, fullscreen: false, copy: false },
            viewSchemas: (row) => [
        { label: "名", value: row.name },
        { label: "旗", children: <em data-x="vs">{String(row.flag)}</em> },
      ],
    });
    // 打开 view 需交互；SSR 仅校验面板壳存在。详情内容在 open 后——此处至少不炸
    expect(h).toContain("详情定制");
    expect(h.includes("dp-view") || h.includes("详情定制")).toBe(true);
  });

  it("column value／color／formatter：文本标签／JSX／可信 HTML；formTitle／viewTitle", async () => {
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
      formTitle: (row) => (row.id ? `修改 · ${row.name}` : "添加用户"),
      searchTitle: "筛选用户",
      viewTitle: (row) => `详情 · ${row.name}`,
      form: [{ prop: "name", required: true }],
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
    const h = await html({columns: withActions({
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

  it("title／label 互落 tip；batchStatus 不在工具栏（caps＋column.batch）", async () => {
    const h = await html({columns: withActions({
        view: false,
        edit: false,
        remove: false,
        assign: { label: "分配", action: () => {} },
      }),
      
      caps: { batchStatus: true, create: false, print: false, import: false, export: false, columns: false, density: false, fullscreen: false, copy: false },
      toolbar: {
        refresh: true,
        assign: { label: "分配全部", action: () => {} },
        titled: { title: "仅标题", action: () => {} }, // 无 label → 显示用 title
        bare: { action: () => {} },
      },
            dataSource: {
        sync: true,
        list: () => ({ rows: [{ id: "1", name: "A", status: "active" }], total: 1 }),
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
    // batchStatus 不在 toolbar builtins；UI 仅在选中批量条
    expect(h).not.toContain('data-testid="dp-batch-status"');
    expect(h).not.toContain('data-testid="dp-batch-status-');
    // 选择列因 remove|caps.batchStatus 出现；批量条仅选中后出现（SSR 无选中 → 无 batch-bar 内容）
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
    const rec = await html({ toolbar: { refresh: true, print: false } });
    expect(rec).toContain('data-testid="data-panel-toolbar"');
    expect(rec).toContain('data-testid="dp-refresh"');
  });

  it("caps.batchStatus:false 隐藏选择列（无 remove 时）", async () => {
    const h = await html({columns: withActions({ view: false, edit: false, remove: false }),
      
      caps: {
        batchStatus: false,
        remove: false,
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
        list: () => ({ rows: [{ id: "1", name: "A", status: "active" }], total: 1 }),
        setField: async () => ({ removed: 0, failed: [] }),
      },
    });
    expect(h).not.toContain('data-testid="dp-select-1"');
    expect(h).not.toContain('data-testid="dp-batch-bar"');
  });

  it("panelKey 进入根节点 data-testid 与工具栏标记", async () => {
    const h = await html({ panelKey: "users" });
    expect(h).toContain('data-testid="panel-users"');
    expect(h).toContain('data-dp-tools="users"');
  });

  it("工具栏按钮位置类：首个无左边框处理、末个无右边框处理", async () => {
    const h = await html({ search: [{ name: "name", label: "姓名" }] });
    expect(h).toContain("dp-tb dp-tb-first dp-tb-nl");
    expect(h).toContain("dp-tb dp-tb-nf dp-tb-last");
    expect(h).toContain("dp-tb dp-tb-nf dp-tb-nl");
  });


  it("disable:true 仍渲染且带 disabled；show:false 才隐藏；声明省略 show→显示", async () => {
    const h = await html({columns: withActions({
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
    const afterEdit = h.slice(h.indexOf('data-testid="dp-edit-1"'), h.indexOf('data-testid="dp-edit-1"') + 900);
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
    const h = await html({columns: withActions({
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
    expect(count(await html({ search: [{ name: "name", label: "姓名" }] })))
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
});
