/** @jsxImportSource @dreamer/view */
/**
 * DataPanel／DataView 页面提示条：插槽位置、简写、显隐与关闭按钮。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  createDataAlertState,
  DataChromeAlert,
} from "../../src/desktop/data-display/data-panel-alert.tsx";
import { DataPanel } from "../../src/desktop/data-display/DataPanel.tsx";
import { DataView } from "../../src/desktop/data-display/DataView.tsx";

const COLUMNS = [{ prop: "name", label: "姓名" }];
const ROWS = [
  { id: "1", name: "张三" },
  { id: "2", name: "李四" },
];
const USER = { id: "1", name: "张三", email: "zhangsan@example.com" };
const VIEW = {
  props: [
    { prop: "name", label: "姓名" },
    { prop: "email", label: "邮箱" },
  ],
};

async function panelHtml(
  props: Record<string, unknown> = {},
): Promise<string> {
  return String(
    await renderToString(() => (
      <DataPanel
        title="用户管理"
        columns={COLUMNS}
        data={ROWS}
        {...props}
      />
    )),
  );
}

async function viewHtml(
  props: Record<string, unknown> = {},
): Promise<string> {
  return String(
    await renderToString(() => (
      <DataView title="用户详情" data={USER} view={VIEW} {...props} />
    )),
  );
}

function order(html: string, ids: string[]): number[] {
  return ids.map((id) => html.indexOf(`data-testid="${id}"`));
}

describe("DataPanel alert 插槽", () => {
  it("渲染在工具栏下方、表格上方", async () => {
    const h = await panelHtml({ alert: "请先完成实名认证" });
    const [tb, alert, table] = order(h, [
      "data-panel-toolbar",
      "dp-alert",
      "dp-table",
    ]);
    expect(tb >= 0 && alert >= 0 && table >= 0).toBe(true);
    expect(tb < alert && alert < table).toBe(true);
    expect(h).toContain("请先完成实名认证");
    expect(h).toContain("dp-alert-wrap");
    expect(h).toContain("!py-2.5");
    expect(h).toContain("!pt-0");
    const region = h.slice(
      h.indexOf('data-testid="dp-alert"'),
      h.indexOf('data-testid="dp-table"'),
    );
    expect(region).toContain("self-center");
    expect(region).toContain("size-6");
  });

  it("字符串简写可用", async () => {
    const h = await panelHtml({ alert: "请先完成实名认证" });
    expect(h).toContain('data-testid="dp-alert"');
    expect(h).toContain("请先完成实名认证");
  });

  it("alert={false} 与 show: false 不渲染", async () => {
    expect(await panelHtml({ alert: false })).not.toContain(
      'data-testid="dp-alert"',
    );
    expect(
      await panelHtml({
        alert: { message: "请先完成实名认证", show: false },
      }),
    ).not.toContain('data-testid="dp-alert"');
  });

  it("默认出现关闭按钮；closable: false 时没有", async () => {
    const open = await panelHtml({ alert: "请先完成实名认证" });
    const start = open.indexOf('data-testid="dp-alert"');
    const end = open.indexOf('data-testid="dp-table"');
    expect(open.slice(start, end)).toContain('aria-label="关闭"');
    const pinned = await panelHtml({
      alert: { message: "系统维护中", closable: false },
    });
    const a = pinned.indexOf('data-testid="dp-alert"');
    const b = pinned.indexOf('data-testid="dp-table"');
    expect(pinned.slice(a, b)).not.toContain('aria-label="关闭"');
    expect(pinned).toContain("系统维护中");
  });

  it("函数形式在渲染时求值", async () => {
    const h = await panelHtml({
      alert: () => ({
        type: "warning",
        message: "请先完成实名认证",
        description: "未认证账号部分功能暂不可用。",
      }),
    });
    expect(h).toContain("请先完成实名认证");
    expect(h).toContain("未认证账号部分功能暂不可用。");
  });
});

describe("DataView alert 插槽", () => {
  it("渲染在工具栏下方、详情正文上方", async () => {
    const h = await viewHtml({ alert: "请先完成实名认证" });
    const [tb, alert, body] = order(h, [
      "data-view-toolbar",
      "dv-alert",
      "dv-body",
    ]);
    expect(tb >= 0 && alert >= 0 && body >= 0).toBe(true);
    expect(tb < alert && alert < body).toBe(true);
    expect(h).toContain("请先完成实名认证");
  });

  it("字符串简写可用；false 与 show: false 隐藏", async () => {
    expect(await viewHtml({ alert: "请先完成实名认证" })).toContain(
      'data-testid="dv-alert"',
    );
    expect(await viewHtml({ alert: false })).not.toContain(
      'data-testid="dv-alert"',
    );
    expect(
      await viewHtml({
        alert: { message: "请先完成实名认证", show: false },
      }),
    ).not.toContain('data-testid="dv-alert"');
  });

  it("默认出现关闭按钮；closable: false 时没有", async () => {
    const open = await viewHtml({ alert: "请先完成实名认证" });
    const start = open.indexOf('data-testid="dv-alert"');
    const end = open.indexOf('data-testid="dv-body"');
    expect(open.slice(start, end)).toContain('aria-label="关闭"');
    const pinned = await viewHtml({
      alert: { message: "系统维护中", closable: false },
    });
    const a = pinned.indexOf('data-testid="dv-alert"');
    const b = pinned.indexOf('data-testid="dv-body"');
    expect(pinned.slice(a, b)).not.toContain('aria-label="关闭"');
  });

  it("函数形式在渲染时求值", async () => {
    const h = await viewHtml({
      alert: () => "请先完成实名认证",
    });
    expect(h).toContain("请先完成实名认证");
  });
});

describe("DataChromeAlert 关闭后隐藏，换文案再显示", () => {
  it("close 后卸载提示，并调用 onClose；更换 message 后再次出现", async () => {
    const state = createDataAlertState();
    let closed = 0;
    const tip = {
      message: "请先完成实名认证",
      onClose: () => {
        closed += 1;
      },
    };
    const first = String(
      await renderToString(() => (
        <DataChromeAlert alert={tip} testId="dp-alert" state={state} />
      )),
    );
    expect(first).toContain("请先完成实名认证");
    expect(first).toContain('aria-label="关闭"');
    state.close();
    tip.onClose();
    const hidden = String(
      await renderToString(() => (
        <DataChromeAlert alert={tip} testId="dp-alert" state={state} />
      )),
    );
    expect(hidden).not.toContain('data-testid="dp-alert"');
    expect(closed).toBe(1);
    const again = String(
      await renderToString(() => (
        <DataChromeAlert
          alert={{ message: "资料已更新，请刷新" }}
          testId="dp-alert"
          state={state}
        />
      )),
    );
    expect(again).toContain("资料已更新，请刷新");
  });
});
