/** @jsxImportSource @dreamer/view */
/**
 * DataPanel／DataView 页面通知条：插槽位置、简写、显隐与关闭按钮。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
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

/** 截取通知条插槽到下一块区域，避免整页其它 rounded 类干扰断言。 */
function region(html: string, testId: string, afterId: string): string {
  return html.slice(
    html.indexOf(`data-testid="${testId}"`),
    html.indexOf(`data-testid="${afterId}"`),
  );
}

describe("DataPanel noticeBar 插槽", () => {
  it("渲染在工具栏下方、表格上方，默认 md 圆角", async () => {
    const h = await panelHtml({ noticeBar: "系统将于今晚维护" });
    const [tb, bar, table] = order(h, [
      "data-panel-toolbar",
      "dp-notice-bar",
      "dp-table",
    ]);
    expect(tb >= 0 && bar >= 0 && table >= 0).toBe(true);
    expect(tb < bar && bar < table).toBe(true);
    expect(h).toContain("系统将于今晚维护");
    expect(h).toContain("dp-notice-bar-wrap");
    const barHtml = region(h, "dp-notice-bar", "dp-table");
    expect(barHtml).toContain("rounded-md");
    expect(barHtml).not.toContain("rounded-none");
    expect(h).toContain("!py-2.5");
    expect(h).toContain("!pt-0");
  });

  it("与 alert 在同一区域，通知条在提示条上方", async () => {
    const h = await panelHtml({
      noticeBar: "系统将于今晚维护",
      alert: "请先完成实名认证",
    });
    const [tb, bar, alert, table] = order(h, [
      "data-panel-toolbar",
      "dp-notice-bar",
      "dp-alert",
      "dp-table",
    ]);
    expect(tb < bar && bar < alert && alert < table).toBe(true);
  });

  it("字符串简写可用，show:false 与空值不渲染", async () => {
    const on = await panelHtml({ noticeBar: "系统将于今晚维护" });
    expect(on).toContain('data-testid="dp-notice-bar"');
    const off = await panelHtml({ noticeBar: false });
    expect(off).not.toContain('data-testid="dp-notice-bar"');
    const hidden = await panelHtml({
      noticeBar: { content: "隐藏", show: false },
    });
    expect(hidden).not.toContain('data-testid="dp-notice-bar"');
    const empty = await panelHtml({ noticeBar: "" });
    expect(empty).not.toContain('data-testid="dp-notice-bar"');
  });

  it("本插槽默认显示关闭按钮，rounded 可覆盖", async () => {
    const h = await panelHtml({
      noticeBar: {
        content: "系统将于今晚维护",
        rounded: true,
      },
    });
    expect(h).toContain("data-dreamer-notice-bar-close");
    expect(region(h, "dp-notice-bar", "dp-table")).toContain("rounded-lg");
    const square = await panelHtml({
      noticeBar: {
        content: "系统将于今晚维护",
        rounded: false,
      },
    });
    const squareBar = region(square, "dp-notice-bar", "dp-table");
    expect(squareBar).toContain("rounded-none");
    expect(squareBar).not.toContain("rounded-md");
  });
});

describe("DataView noticeBar 插槽", () => {
  it("渲染在工具栏下方、详情正文上方", async () => {
    const h = await viewHtml({ noticeBar: "系统将于今晚维护" });
    const [tb, bar, body] = order(h, [
      "data-view-toolbar",
      "dv-notice-bar",
      "dv-body",
    ]);
    expect(tb >= 0 && bar >= 0 && body >= 0).toBe(true);
    expect(tb < bar && bar < body).toBe(true);
    expect(h).toContain("系统将于今晚维护");
    expect(h).toContain("dp-notice-bar-wrap");
    const barHtml = region(h, "dv-notice-bar", "dv-body");
    expect(barHtml).toContain("rounded-md");
    expect(barHtml).not.toContain("rounded-none");
  });
});
