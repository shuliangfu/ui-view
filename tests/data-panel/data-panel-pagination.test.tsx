/** @jsxImportSource @dreamer/view */
/**
 * DataPanel 底栏分页：默认电脑端 full；pagination.preset 可覆盖为 default／simple。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  DataPanel,
  type PanelProps,
} from "../../src/desktop/data-display/DataPanel.tsx";

const columns = [
  { prop: "name", label: "姓名" },
];

function rows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `用户${i + 1}`,
  }));
}

async function html(props: Partial<PanelProps> = {}): Promise<string> {
  return String(
    await renderToString(() => (
      <DataPanel
        title="分页"
        columns={columns}
        data={rows(40)}
        syncUrl={false}
        {...props}
        pagination={{ pageSize: 10, ...props.pagination }}
      />
    )),
  );
}

function buttonTag(html: string, testId: string): string {
  const i = html.indexOf(`data-testid="${testId}"`);
  if (i < 0) return "";
  const start = html.lastIndexOf("<button", i);
  const end = html.indexOf(">", i);
  return start >= 0 && end > start ? html.slice(start, end + 1) : "";
}

function isDisabled(html: string, testId: string): boolean {
  const tag = buttonTag(html, testId);
  return /(?:^|\s)disabled(?:[=\s>]|$)/.test(tag);
}

describe("DataPanel pagination presets", () => {
  it("SSR／默认（电脑端）使用 full：有第一页、最后一页、页码、跳转、每页条数", async () => {
    const h = await html();
    expect(h).toContain('data-testid="dp-pagination"');
    expect(h).toContain('data-dp-pg-preset="full"');
    expect(h).toContain('data-dp-pg-size="md"');
    expect(h).toContain('data-testid="dp-first"');
    expect(h).toContain('data-testid="dp-last"');
    expect(h).toContain('data-testid="dp-prev"');
    expect(h).toContain('data-testid="dp-next"');
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-jump"');
    expect(h).toContain('data-testid="dp-pagesize"');
    expect(h).toContain('aria-label="第一页"');
    expect(h).toContain('aria-label="最后一页"');
    expect(isDisabled(h, "dp-first")).toBe(true);
    expect(isDisabled(h, "dp-prev")).toBe(true);
    expect(isDisabled(h, "dp-next")).toBe(false);
    expect(isDisabled(h, "dp-last")).toBe(false);
  });

  it("pagination.preset=default：有页码与每页条数，无第一页／最后一页／跳转", async () => {
    const h = await html({ pagination: { preset: "default" } });
    expect(h).toContain('data-dp-pg-preset="default"');
    expect(h).toContain('data-testid="dp-prev"');
    expect(h).toContain('data-testid="dp-next"');
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-pagesize"');
    expect(h).not.toContain('data-testid="dp-first"');
    expect(h).not.toContain('data-testid="dp-last"');
    expect(h).not.toContain('data-testid="dp-jump"');
  });

  it("pagination.preset=simple：上一页／下一页＋「第 n / m 页」，无页码／跳转／每页条数／首页末页", async () => {
    const h = await html({ pagination: { preset: "simple" } });
    expect(h).toContain('data-dp-pg-preset="simple"');
    expect(h).toContain('data-testid="dp-simple-current"');
    expect(h).toContain("第 1 / 4 页");
    expect(h).toContain('data-testid="dp-prev"');
    expect(h).toContain('data-testid="dp-next"');
    expect(h).not.toContain('data-testid="dp-first"');
    expect(h).not.toContain('data-testid="dp-last"');
    expect(h).not.toContain('data-testid="dp-page-1"');
    expect(h).not.toContain('data-testid="dp-jump"');
    expect(h).not.toContain('data-testid="dp-pagesize"');
  });

  it("pagination.preset 与 size 可一起写，并可覆盖断点 size", async () => {
    const h = await html({
      pagination: { preset: "simple", size: "lg" },
    });
    expect(h).toContain('data-dp-pg-preset="simple"');
    expect(h).toContain('data-dp-pg-size="lg"');
    expect(h).toContain('data-testid="dp-simple-current"');
    expect(h).not.toContain('data-testid="dp-pagesize"');
    expect(h).not.toContain('data-testid="dp-page-1"');
  });

  it("pagination.preset=default 覆盖电脑端默认 full", async () => {
    const h = await html({
      pagination: { preset: "default" },
    });
    expect(h).toContain('data-dp-pg-preset="default"');
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-pagesize"');
    expect(h).not.toContain('data-testid="dp-simple-current"');
  });

  it("pagination 透传 showFirstLast／class／disabled／showTotal／showQuickJumper", async () => {
    const h = await html({
      pagination: {
        preset: "default",
        showFirstLast: true,
        showQuickJumper: true,
        showTotal: () => "CUSTOM_PG_TOTAL",
        disabled: true,
        class: "pg-extra-class",
      },
    });
    expect(h).toContain('data-dp-pg-preset="default"');
    expect(h).toContain('data-testid="dp-first"');
    expect(h).toContain('data-testid="dp-last"');
    expect(h).toContain('data-testid="dp-jump"');
    expect(h).toContain("CUSTOM_PG_TOTAL");
    expect(h).toContain("pg-extra-class");
    expect(isDisabled(h, "dp-first")).toBe(true);
    expect(isDisabled(h, "dp-prev")).toBe(true);
    expect(isDisabled(h, "dp-next")).toBe(true);
    expect(isDisabled(h, "dp-last")).toBe(true);
  });

  it("pagination.messages 覆盖第一页／最后一页文案，不再读面板 messages", async () => {
    const h = await html({
      pagination: {
        messages: {
          first: "自定义首页",
          last: "自定义末页",
        },
      },
    });
    expect(h).toContain('aria-label="自定义首页"');
    expect(h).toContain('aria-label="自定义末页"');
    expect(h).not.toContain('aria-label="第一页"');
    expect(h).not.toContain('aria-label="最后一页"');
  });

  it("simple 档当前页文案走 pagination.messages.simpleCurrent", async () => {
    const h = await html({
      pagination: {
        preset: "simple",
        messages: {
          simpleCurrent: (page, totalPages) => `当前 ${page}／${totalPages}`,
        },
      },
    });
    expect(h).toContain("当前 1／4");
    expect(h).not.toContain("第 1 / 4 页");
  });

  it("未写 pagination.messages.jumpTo 时，跳转文案回落面板 messages.jump／page", async () => {
    const h = await html({
      messages: { jump: "面板跳至", page: "面板页" },
    });
    expect(h).toContain("面板跳至");
    expect(h).toContain("面板页");
  });
});
