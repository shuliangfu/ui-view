/**
 * 列设置菜单在触发器靠近视口下沿时仍须完全落在视口内，
 * 以便真实点击/勾选（不能靠 force 或放宽断言）。
 */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { open } from "./driver.ts";

const route = "/desktop/data-display/data-panel";

describe("DataPanel columns menu viewport", () => {
  it(
    "物理操作 DataPanel 列设置：触发器贴视口下沿时仍可勾选创建时间列",
    async (t) => {
      const page = await open(t, route);
      const panel = page.getByTestId("panel-demo-search-adv");
      await panel.getByTestId("dp-columns").waitFor({ state: "visible" });
      await page.evaluate(() => {
        const trigger = document.querySelector(
          '[data-testid="panel-demo-search-adv"] [data-testid="dp-columns"]',
        ) as HTMLElement;
        const main = document.querySelector("main") as HTMLElement;
        const r = trigger.getBoundingClientRect();
        const targetBottom = window.innerHeight - 24;
        main.scrollTop += r.bottom - targetBottom;
      });
      const btnBox = await panel.getByTestId("dp-columns").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, vh: window.innerHeight };
      });
      expect(btnBox.bottom).toBeLessThanOrEqual(btnBox.vh);
      expect(btnBox.bottom).toBeGreaterThan(btnBox.vh - 80);
      await panel.getByTestId("dp-columns").click();
      const created = page.getByTestId("dp-col-createdAt");
      await created.waitFor({ state: "visible" });
      const geo = await page.evaluate(() => {
        const menu = document.querySelector(
          '[data-testid="dp-column-menu"]',
        ) as HTMLElement;
        const cb = document.querySelector(
          '[data-testid="dp-col-createdAt"]',
        ) as HTMLElement;
        const box = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return {
            top: r.top,
            bottom: r.bottom,
            fullyIn: r.top >= 0 && r.bottom <= innerHeight &&
              r.left >= 0 && r.right <= innerWidth,
          };
        };
        return { vh: innerHeight, menu: box(menu), cb: box(cb) };
      });
      expect(geo.menu.fullyIn).toBe(true);
      expect(geo.cb.fullyIn).toBe(true);
      await created.check();
      expect(await created.isChecked()).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );
});
