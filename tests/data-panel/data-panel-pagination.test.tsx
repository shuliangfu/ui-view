/** @jsxImportSource @dreamer/view */
/**
 * DataPanel 底栏分页：默认电脑端 full；paginationPreset 可覆盖为 default／simple。
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
        pageSize={10}
        syncUrl={false}
        {...props}
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

  it("paginationPreset=default：有页码与每页条数，无第一页／最后一页／跳转", async () => {
    const h = await html({ paginationPreset: "default" });
    expect(h).toContain('data-dp-pg-preset="default"');
    expect(h).toContain('data-testid="dp-prev"');
    expect(h).toContain('data-testid="dp-next"');
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-pagesize"');
    expect(h).not.toContain('data-testid="dp-first"');
    expect(h).not.toContain('data-testid="dp-last"');
    expect(h).not.toContain('data-testid="dp-jump"');
  });

  it("paginationPreset=simple：上一页／下一页＋「第 n / m 页」，无页码／跳转／每页条数／首页末页", async () => {
    const h = await html({ paginationPreset: "simple" });
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

  it("pagination.preset 与 paginationPreset 等价，并可覆盖 size", async () => {
    const h = await html({
      pagination: { preset: "simple", size: "lg" },
    });
    expect(h).toContain('data-dp-pg-preset="simple"');
    expect(h).toContain('data-dp-pg-size="lg"');
    expect(h).toContain('data-testid="dp-simple-current"');
    expect(h).not.toContain('data-testid="dp-pagesize"');
    expect(h).not.toContain('data-testid="dp-page-1"');
  });

  it("pagination.preset 优先于 paginationPreset", async () => {
    const h = await html({
      paginationPreset: "simple",
      pagination: { preset: "default" },
    });
    expect(h).toContain('data-dp-pg-preset="default"');
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-pagesize"');
    expect(h).not.toContain('data-testid="dp-simple-current"');
  });

  it("pagination 透传 showFirstLast／class／disabled／showTotal／showQuickJumper", async () => {
    const h = await html({
      paginationPreset: "default",
      pagination: {
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
});
