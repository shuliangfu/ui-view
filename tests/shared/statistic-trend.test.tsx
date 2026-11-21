/** @jsxImportSource @dreamer/view */
/**
 * Statistic 不再按数值正负自动出趋势，仅显式 trend 时着色并显示箭头。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Statistic } from "../../src/shared/data-display/Statistic.tsx";

describe("Statistic trend", () => {
  it("does not color or arrow a positive value without trend", async () => {
    const h = String(await renderToString(() => <Statistic value={12} />));
    expect(h).toContain("12");
    expect(h).not.toContain("text-green-600");
    expect(h).not.toContain("text-red-600");
    expect(h).not.toContain("aria-hidden");
  });

  it("applies up color and an arrow when trend is set", async () => {
    const h = String(
      await renderToString(() => <Statistic value={-3} trend="up" />),
    );
    expect(h).toContain("text-green-600");
    expect(h).toContain("aria-hidden");
  });
});
