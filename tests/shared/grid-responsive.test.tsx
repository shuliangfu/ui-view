/** @jsxImportSource @dreamer/view */
/**
 * Grid：响应式 cols / span 写出对应 Tailwind 断点类。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Grid, GridItem } from "../../src/shared/layout/Grid.tsx";

describe("Grid responsive", () => {
  it("只传 cols 时仍是单一 grid-cols", async () => {
    const h = String(
      await renderToString(() => (
        <Grid cols={12}>
          <GridItem span={6}>a</GridItem>
        </Grid>
      )),
    );
    expect(h).toContain("grid-cols-12");
    expect(h).toContain("col-span-6");
    expect(h).not.toContain("sm:grid-cols");
  });

  it("xs/sm/md/lg 分别写到容器与子项", async () => {
    const h = String(
      await renderToString(() => (
        <Grid xs={4} sm={8} md={12} lg={24}>
          <GridItem xs={4} sm={4} md={6} lg={12}>
            a
          </GridItem>
        </Grid>
      )),
    );
    expect(h).toContain("grid-cols-4");
    expect(h).toContain("sm:grid-cols-8");
    expect(h).toContain("md:grid-cols-12");
    expect(h).toContain("lg:grid-cols-[repeat(24,minmax(0,1fr))]");
    expect(h).toContain("col-span-4");
    expect(h).toContain("sm:col-span-4");
    expect(h).toContain("md:col-span-6");
    expect(h).toContain("lg:col-span-12");
  });
});
