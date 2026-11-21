/** Common docs actions are tracked separately, never substitutes for component behavior. */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open } from "./driver.ts";
describe("Document utilities physical", () => {
  for (
    const route of [
      "/desktop/form/input",
      "/desktop/form/textarea",
      "/desktop/form/password",
      "/desktop/form/select",
      "/desktop/form/multiselect",
      "/desktop/form/date-picker",
      "/desktop/form/checkbox",
      "/desktop/form/checkbox-group",
      "/desktop/form/radio-group",
      "/desktop/form/switch",
      "/desktop/form/search",
      "/desktop/form/input-number",
      "/desktop/form/rate",
      "/desktop/form/slider",
      "/desktop/form/cascader",
      "/desktop/form/tree-select",
      "/desktop/form/time-picker",
      "/desktop/form/datetime-picker",
      "/desktop/form/form-containers",
      "/desktop/form/upload",
      "/desktop/form/transfer",
      "/desktop/data-display/data-panel",
      "/desktop/layout/tabs",
      "/desktop/data-display/collapse",
      "/desktop/feedback/popover",
      "/desktop/feedback/tooltip",
      "/desktop/navigation/dropdown",
      "/mobile/navigation/dropdown-menu",
      "/mobile/feedback/action-sheet",
      "/mobile/feedback/bottom-sheet",
      "/mobile/other/mobile-portal-host-scope",
      "/mobile/feedback/share-sheet",
      "/mobile/feedback/floating-panel",
      "/mobile/feedback/overlay",
      "/mobile/feedback/notice-bar",
      "/mobile/feedback/swipe-cell",
      "/mobile/feedback/pull-refresh",
      "/desktop/layout/container",
      "/desktop/layout/divider",
      "/desktop/layout/stack",
      "/desktop/layout/grid",
      "/desktop/layout/hero",
      "/desktop/layout/accordion",
      "/desktop/layout/splitter",
      "/desktop/navigation/steps",
      "/desktop/navigation/breadcrumb",
      "/mobile/navigation/tab-bar",
      "/mobile/navigation/navbar",
      "/mobile/navigation/index-bar",
    ]
  ) {
    it("物理操作 文档代码复制：" + route, async (t) => {
      const page = await open(t, route);
      await page.context().grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      const blocks = page.locator("main .code-block");
      const count = await blocks.count();
      expect(count > 0).toBe(true);
      let copied = 0;
      for (let i = 0; i < count; i++) {
        const block = blocks.nth(i);
        const copy = block.getByRole("button", { name: "复制", exact: true });
        if (await copy.count() === 0) continue; // copyable=false is a noninteractive display, not a skipped action.
        const expected = await block.locator("pre code").textContent();
        if (expected === null) throw new Error("CodeBlock missing source text");
        await page.evaluate(() =>
          navigator.clipboard.writeText("sentinel-not-code")
        );
        await copy.click();
        await eventually(async () =>
          await page.evaluate(() => navigator.clipboard.readText()) === expected
        );
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
          expected,
        );
        copied++;
      }
      expect(copied > 0).toBe(true);
      console.log("clipboard assertions", route, copied);
    }, DOCS_BROWSER_CONFIG);
  }
});
