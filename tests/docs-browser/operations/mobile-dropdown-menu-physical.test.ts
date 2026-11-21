import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as scope, open, visible } from "./driver.ts";
const route = "/mobile/navigation/dropdown-menu";
const root = (demo: Locator) => demo.locator(".dropdown-menu");
const head = (demo: Locator, key: string) =>
  root(demo).locator(`[data-menu-key="${key}"]`);
const choices = (demo: Locator) =>
  root(demo).locator(":scope > div.absolute > button");
async function state(demo: Locator, key: string | null) {
  await attr(root(demo), "data-open", key ? "true" : "false");
  await attr(root(demo), "data-open-key", key ?? "");
  expect(await demo.locator('[data-dreamer-dropdown-mask="scoped"]').count())
    .toBe(key ? 1 : 0);
}
async function labels(demo: Locator, sort: string, filter: string) {
  expect((await head(demo, "sort").textContent())!.replace(/\s/g, "")).toBe(
    sort + "▼",
  );
  expect((await head(demo, "filter").textContent())!.replace(/\s/g, "")).toBe(
    filter + "▼",
  );
}
async function list(demo: Locator, expected: string[], selected: string) {
  expect((await choices(demo).allTextContents()).map((s) => s.trim())).toEqual(
    expected,
  );
  expect(
    await choices(demo).evaluateAll((buttons) =>
      buttons.filter((b) => b.classList.contains("bg-blue-50/80")).map((b) =>
        b.textContent!.trim()
      )
    ),
  ).toEqual([selected]);
}
async function maskGeometry(demo: Locator) {
  const host = demo.locator("[data-dreamer-mobile-portal-host]"),
    mask = demo.locator('[data-dreamer-dropdown-mask="scoped"]');
  await visible(mask);
  const h = await host.boundingBox(), m = await mask.boundingBox();
  if (!h || !m) throw new Error("Scoped mask missing");
  for (const key of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(h[key] - m[key])).toBeLessThanOrEqual(1);
  }
  expect(await mask.evaluate((el) => getComputedStyle(el).position)).toBe(
    "absolute",
  );
  expect(await mask.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe(
    "auto",
  );
  expect(await demo.locator('[data-dreamer-dropdown-mask="fixed"]').count())
    .toBe(0);
}
async function closeMask(demo: Locator) {
  const mask = demo.locator('[data-dreamer-dropdown-mask="scoped"]'),
    b = await mask.boundingBox();
  if (!b) throw new Error("Mask rectangle missing");
  await mask.click({
    position: { x: b.width / 2, y: b.height - 12 },
    delay: 180,
  });
  await state(demo, null);
}
async function summary(demo: Locator, expected: Record<string, string>) {
  const text = await demo.getByText(/^value：/).textContent();
  expect(JSON.parse(text!.replace(/^\s*value：/, ""))).toEqual(expected);
}
describe("Mobile dropdown menu physical", () => {
  for (const controlled of [false, true]) {
    it(
      "物理操作 移动DropdownMenu" + (controlled ? "受控value" : "基础多列") +
        "：两列每个选项/回显、切列/重复开关/Enter/Space、遮罩边界与取消不改值",
      async (t) => {
        for (const width of [1280, 390]) {
          const page = await open(t, route);
          await page.setViewportSize({ width, height: 900 });
          const demo = scope(page, controlled ? "受控 value" : "基础多列");
          const selected = { sort: "n", filter: "a" };
          const display = { sort: "最新", filter: "全部" };
          await state(demo, null);
          await labels(demo, "最新", "全部");
          if (controlled) await summary(demo, selected);
          for (
            const [key, options, values] of [["sort", ["最新", "最热"], [
              "n",
              "h",
            ]], ["filter", ["全部", "我的"], ["a", "m"]]] as const
          ) {
            await head(demo, key).click({ delay: 180 });
            await state(demo, key);
            await list(demo, [...options], display[key]);
            await maskGeometry(demo);
            // The scoped mask must not block or dismiss an actual click outside its phone frame.
            // MobileDocDemo has no inner heading (PhoneDeviceFrame was removed); the section title is the heading outside the frame.
            await page.getByRole("heading", {
              name: controlled ? "受控 value" : "基础多列",
              exact: true,
            }).click();
            await state(demo, key);
            const other = key === "sort" ? "filter" : "sort";
            await head(demo, other).click();
            await state(demo, other);
            expect(await choices(demo).count()).toBe(2);
            await head(demo, key).click();
            await state(demo, key);
            await list(demo, [...options], display[key]);
            await head(demo, key).click();
            await state(demo, null);
            await head(demo, key).press("Enter");
            await state(demo, key);
            await head(demo, key).press("Space");
            await state(demo, null);
            for (let i = 0; i < options.length; i++) {
              await head(demo, key).click();
              await state(demo, key);
              await list(demo, [...options], display[key]);
              await choices(demo).filter({ hasText: options[i] }).click({
                delay: 180,
              });
              selected[key] = values[i];
              display[key] = options[i];
              await state(demo, null);
              await labels(demo, display.sort, display.filter);
              if (controlled) await summary(demo, selected);
              await head(demo, key).click();
              await state(demo, key);
              await list(demo, [...options], options[i]);
              await closeMask(demo);
              await labels(demo, display.sort, display.filter);
              if (controlled) await summary(demo, selected);
            }
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "物理操作 移动DropdownMenu：两个示意框同时展开、选择值与scoped遮罩互不重置",
    async (t) => {
      const page = await open(t, route);
      await page.setViewportSize({ width: 390, height: 900 });
      const basic = scope(page, "基础多列"),
        controlled = scope(page, "受控 value");
      await head(basic, "sort").click();
      await choices(basic).filter({ hasText: "最热" }).click();
      await labels(basic, "最热", "全部");
      await head(basic, "filter").click();
      await head(controlled, "sort").click();
      await state(basic, "filter");
      await state(controlled, "sort");
      expect(
        await page.locator('[data-dreamer-dropdown-mask="scoped"]').count(),
      )
        .toBe(2);
      await maskGeometry(basic);
      await maskGeometry(controlled);
      await choices(controlled).filter({ hasText: "最热" }).click();
      await state(basic, "filter");
      await state(controlled, null);
      await summary(controlled, { sort: "h", filter: "a" });
      await choices(basic).filter({ hasText: "我的" }).click();
      await state(basic, null);
      await labels(basic, "最热", "我的");
      await summary(controlled, { sort: "h", filter: "a" });
      await head(controlled, "sort").click();
      await choices(controlled).filter({ hasText: "最新" }).click();
      await summary(controlled, { sort: "n", filter: "a" });
      await labels(basic, "最热", "我的");
      await head(basic, "filter").click();
      await head(controlled, "sort").click();
      await closeMask(basic);
      await state(controlled, "sort");
      await closeMask(controlled);
      await labels(basic, "最热", "我的");
      await labels(controlled, "最新", "全部");
      await summary(controlled, { sort: "n", filter: "a" });
      await eventually(async () =>
        await page.locator('[data-dreamer-dropdown-mask="scoped"]').count() ===
          0
      );
    },
    DOCS_BROWSER_CONFIG,
  );
});
