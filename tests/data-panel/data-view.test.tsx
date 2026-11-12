/** @jsxImportSource @dreamer/view */
/**
 * DataView：工具栏默认键、Descriptions 字段区、自定义内容、能力开关、无分页。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  assertDataViewToolbarConfig,
  DATA_VIEW_TOOLBAR_BUILTINS,
  DataView,
  type DataViewProps,
  normalizeDataViewToolbar,
} from "../../src/desktop/data-display/DataView.tsx";
import type { DataSource } from "../../src/desktop/data-display/data-panel-types.ts";
import { Descriptions } from "../../src/desktop/data-display/Descriptions.tsx";

const USER = {
  id: "1",
  name: "Ada",
  email: "ada@example.com",
  status: "active",
};

const VIEW = {
  props: [
    { prop: "name", label: "姓名" },
    { prop: "email", label: "邮箱" },
    {
      prop: "status",
      label: "状态",
      type: "tag" as const,
      options: [
        { value: "active", label: "启用", tone: "success" as const },
        { value: "disabled", label: "停用" },
      ],
    },
  ],
};

const ICON_LIST_PATH = 'd="M8 6h13M8 12h13M8 18h13"';
const ICON_EYE_PATH = 'd="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"';

const TB_IDS = [
  "dv-update",
  "dv-refresh",
  "dv-print",
  "dv-import",
  "dv-export",
  "dv-fullscreen",
  "dv-copy",
] as const;

function hasDisabledAttr(chunk: string): boolean {
  return /<button\b[^>]*\sdisabled(?:=""|\s|>)/.test(chunk);
}

async function html(props: Partial<DataViewProps> = {}): Promise<string> {
  return String(
    await renderToString(() => (
      <DataView
        title="用户详情"
        data={USER}
        view={VIEW}
        form={{ props: [{ prop: "name", label: "姓名" }] }}
        {...props}
      />
    )),
  );
}

describe("DataView", () => {
  it("默认工具栏键序：更新、刷新、打印、导入、导出、全屏、复制", () => {
    expect([...DATA_VIEW_TOOLBAR_BUILTINS]).toEqual([
      "update",
      "refresh",
      "print",
      "import",
      "export",
      "fullscreen",
      "copy",
    ]);
  });

  it("toolbar 的 edit 别名归一成 update", () => {
    const cfg = normalizeDataViewToolbar({
      refresh: true,
      edit: true,
      copy: false,
    });
    expect(Object.keys(cfg)).toEqual(["refresh", "update", "copy"]);
    expect(cfg.update).toBe(true);
    expect("edit" in cfg).toBe(false);
  });

  it("自定义工具栏键必须提供 action", () => {
    expect(() => assertDataViewToolbarConfig({ refresh: true })).not.toThrow();
    expect(() => assertDataViewToolbarConfig({ edit: true })).not.toThrow();
    expect(() =>
      assertDataViewToolbarConfig({ mine: { label: "Mine", action: () => {} } })
    ).not.toThrow();
    expect(() => assertDataViewToolbarConfig({ mine: true })).toThrow(
      /mine.*action/i,
    );
  });

  it("首帧渲染标题、IconList、view.props 字段，且无分页", async () => {
    const h = await html();
    expect(h).toContain("用户详情");
    expect(h).toContain('data-testid="data-view"');
    expect(h).toContain(ICON_LIST_PATH);
    expect(h).not.toContain(ICON_EYE_PATH);
    expect(h).toContain('data-testid="data-view-toolbar"');
    expect(h).toContain("bg-[rgb(240_243_248)]");
    expect(h).toContain("dark:bg-[rgb(19_28_49)]");
    expect(h).toContain('data-testid="dv-view"');
    expect(h).toContain("姓名");
    expect(h).toContain("Ada");
    expect(h).toContain("邮箱");
    expect(h).toContain("ada@example.com");
    expect(h).toContain("启用");
    expect(h).toContain("bg-slate-200/80");
    expect(h).toContain("dark:bg-slate-900");
    expect(h).toContain("!border-b-0");
    expect(h).toContain("border-y");
    expect(h).toContain("border-slate-300");
    expect(h).toContain("dark:border-slate-600/40");
    expect(h).not.toContain('data-testid="dp-pg"');
    expect(h).not.toContain("data-panel-toolbar");
    expect(h).not.toContain('data-testid="dp-create"');
    expect(h).not.toContain('data-testid="dp-search-toggle"');
  });

  it("默认工具栏渲染全部内置按钮", async () => {
    const h = await html();
    for (const id of TB_IDS) {
      expect(h).toContain(`data-testid="${id}"`);
    }
  });

  it("toolbar={false} 隐藏工具栏", async () => {
    const h = await html({ toolbar: false });
    expect(h).not.toContain('data-testid="data-view-toolbar"');
    expect(h).not.toContain('data-testid="dv-refresh"');
  });

  it("caps 可隐藏或禁用工具栏动作", async () => {
    const hidden = await html({
      caps: {
        update: false,
        import: false,
        export: false,
        print: false,
        fullscreen: false,
        copy: false,
      },
    });
    expect(hidden).toContain('data-testid="dv-refresh"');
    expect(hidden).not.toContain('data-testid="dv-update"');
    expect(hidden).not.toContain('data-testid="dv-print"');
    expect(hidden).not.toContain('data-testid="dv-import"');
    expect(hidden).not.toContain('data-testid="dv-export"');
    expect(hidden).not.toContain('data-testid="dv-fullscreen"');
    expect(hidden).not.toContain('data-testid="dv-copy"');

    const disabled = await html({
      toolbar: { print: { disable: true } },
    });
    const i = disabled.indexOf('data-testid="dv-print"');
    expect(i).toBeGreaterThan(-1);
    const start = disabled.lastIndexOf("<button", i);
    expect(hasDisabledAttr(disabled.slice(start, i + 40))).toBe(true);
  });

  it("无 form 且无 onImportRows 时隐藏更新和导入", async () => {
    const h = await html({ form: undefined });
    expect(h).toContain('data-testid="dv-refresh"');
    expect(h).not.toContain('data-testid="dv-update"');
    expect(h).not.toContain('data-testid="dv-import"');
    expect(h).toContain('data-testid="dv-print"');
  });

  it("children 替换 Descriptions 字段区", async () => {
    const h = await html({ children: <div>自定义明细</div> });
    expect(h).toContain('data-testid="dv-view-custom"');
    expect(h).toContain("自定义明细");
    expect(h).not.toContain("ada@example.com");
  });

  it("view.render 替换 Descriptions 字段区", async () => {
    const h = await html({
      view: {
        ...VIEW,
        render: (ctx) => (
          <div>渲染明细·{String((ctx.row as { name?: string }).name)}</div>
        ),
      },
    });
    expect(h).toContain('data-testid="dv-view-custom"');
    expect(h).toContain("渲染明细·Ada");
    expect(h).not.toContain("ada@example.com");
  });

  it("children 优先于 view.render", async () => {
    const h = await html({
      view: {
        ...VIEW,
        render: () => <div>来自 render</div>,
      },
      children: <div>来自 children</div>,
    });
    expect(h).toContain('data-testid="dv-view-custom"');
    expect(h).toContain("来自 children");
    expect(h).not.toContain("来自 render");
  });

  it("dataSource + id 且无 data 时首帧为空，有 data 时仍首屏渲染 data", async () => {
    const ds = {
      list: () => ({ items: [{ id: "1", name: "FromList" }], total: 1 }),
      view: () => ({
        id: "1",
        name: "FromView",
        email: "view@example.com",
        status: "active",
      }),
      get: () => ({
        id: "1",
        name: "FromGet",
        email: "get@example.com",
        status: "active",
      }),
    } as DataSource;
    const empty = await html({
      data: undefined,
      id: "1",
      dataSource: ds,
    });
    expect(empty).toContain("暂无数据");
    expect(empty).not.toContain("FromView");
    expect(empty).not.toContain("FromGet");
    expect(empty).not.toContain("FromList");
    expect(empty).not.toContain("Ada");

    const seeded = await html({
      id: "1",
      dataSource: ds,
    });
    expect(seeded).toContain("Ada");
    expect(seeded).not.toContain("FromView");
    expect(seeded).not.toContain("FromGet");
  });
});

describe("Descriptions 整行斑马", () => {
  it("同一行标签与内容共用行底，奇偶行交替，无标签列单独底色", async () => {
    const h = String(
      await renderToString(() => (
        <Descriptions
          bordered
          column={1}
          size="sm"
          items={[
            { label: "姓名", children: "Ada" },
            { label: "邮箱", children: "ada@example.com" },
          ]}
        />
      )),
    );
    expect(h).toContain("bg-white dark:bg-slate-900/70");
    expect(h).toContain("bg-slate-50 dark:bg-slate-900/40");
    expect(h).not.toContain("dark:bg-slate-800/50");
  });
});
