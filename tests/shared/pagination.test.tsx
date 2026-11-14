/** @jsxImportSource @dreamer/view */
/**
 * Pagination：preset、第一页／最后一页（禁用与文案）、极简当前页。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Pagination } from "../../src/shared/navigation/Pagination.tsx";

async function html(
  props: Partial<Parameters<typeof Pagination>[0]> & { total?: number } = {},
): Promise<string> {
  return String(
    await renderToString(() => (
      <Pagination
        total={100}
        defaultPageSize={10}
        onChange={() => {}}
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

describe("Pagination presets and first/last", () => {
  it("preset=full 渲染第一页／最后一页，首页时二者与上一页禁用、下一页／最后一页可点", async () => {
    const h = await html({ preset: "full", defaultCurrent: 1 });
    expect(h).toContain('data-pagination-preset="full"');
    expect(h).toContain('data-testid="pagination-first"');
    expect(h).toContain('data-testid="pagination-last"');
    expect(h).toContain('aria-label="第一页"');
    expect(h).toContain('aria-label="最后一页"');
    expect(h).toContain('aria-label="上一页"');
    expect(h).toContain('aria-label="下一页"');
    expect(h).toContain('data-testid="pagination-jump"');
    expect(h).toMatch(/共 100 条/);

    expect(isDisabled(h, "pagination-first")).toBe(true);
    expect(isDisabled(h, "pagination-prev")).toBe(true);
    expect(isDisabled(h, "pagination-next")).toBe(false);
    expect(isDisabled(h, "pagination-last")).toBe(false);
  });

  it("preset=full 在最后一页时最后一页与下一页禁用，第一页可点", async () => {
    const h = await html({ preset: "full", defaultCurrent: 10 });
    expect(isDisabled(h, "pagination-last")).toBe(true);
    expect(isDisabled(h, "pagination-next")).toBe(true);
    expect(isDisabled(h, "pagination-first")).toBe(false);
    expect(isDisabled(h, "pagination-prev")).toBe(false);
  });

  it("preset=default（及缺省）不渲染第一页／最后一页／跳转，渲染页码", async () => {
    const a = await html({ preset: "default" });
    const b = await html();
    for (const h of [a, b]) {
      expect(h).toContain('data-pagination-preset="default"');
      expect(h).not.toContain('data-testid="pagination-first"');
      expect(h).not.toContain('data-testid="pagination-last"');
      expect(h).not.toContain('data-testid="pagination-jump"');
      expect(h).toContain('data-testid="pagination-prev"');
      expect(h).toContain('data-testid="pagination-next"');
      expect(h).toContain('data-testid="pagination-page-1"');
      expect(h).not.toContain("第 1 / 10 页");
    }
  });

  it("preset=simple 渲染「第 n / m 页」，无页码、无第一页／最后一页／跳转", async () => {
    const h = await html({ preset: "simple", defaultCurrent: 3 });
    expect(h).toContain('data-pagination-preset="simple"');
    expect(h).toContain('data-testid="pagination-simple-current"');
    expect(h).toContain("第 3 / 10 页");
    expect(h).toContain('data-testid="pagination-prev"');
    expect(h).toContain('data-testid="pagination-next"');
    expect(h).not.toContain('data-testid="pagination-first"');
    expect(h).not.toContain('data-testid="pagination-last"');
    expect(h).not.toContain('data-testid="pagination-page-1"');
    expect(h).not.toContain('data-testid="pagination-jump"');
  });

  it("testIdPrefix 会改写按钮 id（数据面板用 dp）", async () => {
    const h = await html({ preset: "full", testIdPrefix: "dp" });
    expect(h).toContain('data-testid="dp-first"');
    expect(h).toContain('data-testid="dp-last"');
    expect(h).toContain('data-testid="dp-prev"');
    expect(h).toContain('data-testid="dp-next"');
    expect(h).toContain('data-testid="dp-page-1"');
    expect(h).toContain('data-testid="dp-jump"');
    expect(h).not.toContain('data-testid="pagination-first"');
  });
});
