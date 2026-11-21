import { describe, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, visible } from "./driver.ts";
describe("Picker dismissal physical", () => {
  for (
    const [route, title] of [["date-picker", "基础"], ["time-picker", "基础"], [
      "datetime-picker",
      '基础（mode="single"）',
    ]]
  ) {
    it("物理操作 Picker立即点外关闭：" + route, async (t) => {
      const page = await open(t, "/desktop/form/" + route);
      const button = section(page, title).locator("button[aria-haspopup]");
      const committed = await button.getAttribute("aria-label");
      await button.click();
      await visible(page.getByRole("dialog"));
      // 不插入定时等待；下一次真实按下在外部页头就应关闭，不能被80/120ms窗口吞掉。
      await page.mouse.click(3, 3);
      await attr(button, "aria-expanded", "false");
      await attr(button, "aria-label", committed);
    }, DOCS_BROWSER_CONFIG);
  }
});
