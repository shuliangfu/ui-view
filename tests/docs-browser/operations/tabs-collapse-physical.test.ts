import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open, visible } from "./driver.ts";
async function tabState(scope: Locator, letter: string) {
  const tabs = scope.getByRole("tab");
  for (const tab of await tabs.all()) {
    const expected =
      (await tab.getAttribute("data-tab-key")) === letter.toLowerCase();
    await attr(tab, "aria-selected", String(expected));
    await attr(tab, "data-active", expected ? "" : null);
  }
  expect((await scope.getByRole("tabpanel").textContent())!.trim()).toBe(
    "内容 " + letter,
  );
  expect(await scope.getByRole("tabpanel").count()).toBe(1);
}
describe("Tabs collapse physical", () => {
  for (
    const title of [
      "type=line",
      "type=card",
      "fullWidth",
      "items 含 disabled",
      "位置与默认激活项",
    ]
  ) {
    it(
      "物理操作 Tabs：" + title + " 全部可用标签/键盘/选中和精确面板",
      async (t) => {
        const page = await open(t, "/desktop/layout/tabs"),
          scope = demo(page, title);
        await tabState(scope, title === "位置与默认激活项" ? "B" : "A");
        const a = scope.getByRole("tab", { name: "标签 A", exact: true }),
          before = await a.elementHandle();
        for (
          const letter
            of (title === "items 含 disabled" || title === "位置与默认激活项"
              ? ["B", "A"]
              : ["B", "C", "A"])
        ) {
          await scope.getByRole("tab", { name: "标签 " + letter, exact: true })
            .click({ delay: 180 });
          await tabState(scope, letter);
        }
        expect(await a.evaluate((el, old) => el === old, before)).toBe(true);
        await scope.getByRole("tab", { name: "标签 B", exact: true }).press(
          "Enter",
        );
        await tabState(scope, "B");
        await a.press("Space");
        await tabState(scope, "A");
        await a.click();
        await tabState(scope, "A");
        if (title === "type=line" || title === "type=card") {
          const active = scope.locator('[role="tab"][aria-selected="true"]');
          const style = await active.evaluate((el) => {
            const c = getComputedStyle(el);
            return {
              top: c.borderTopWidth,
              bottom: c.borderBottomWidth,
              bottomRadius: c.borderBottomLeftRadius,
            };
          });
          if (title === "type=line") {
            expect(style).toEqual({
              top: "1px",
              bottom: "0px",
              bottomRadius: "0px",
            });
          } else {
            expect(style.top).toBe("0px");
            expect(
              await scope.getByRole("tablist").evaluate((el) =>
                getComputedStyle(el).paddingTop
              ),
            ).toBe("4px");
            expect(
              await scope.getByRole("tablist").evaluate((el) =>
                getComputedStyle(el).borderRadius
              ),
            ).toBe("8px");
          }
        }
        if (title === "items 含 disabled") {
          const disabled = scope.getByRole("tab", {
            name: "标签 C（禁用）",
            exact: true,
          });
          expect(await disabled.isDisabled()).toBe(true);
          const b = await disabled.boundingBox();
          if (!b) throw new Error("disabled tab not measurable");
          await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
          await tabState(scope, "A");
          await scope.getByRole("tab", { name: "标签 B", exact: true }).press(
            "Tab",
          );
          expect(await disabled.evaluate((el) => document.activeElement === el))
            .toBe(false);
          expect(await scope.getByText("不可选", { exact: true }).count()).toBe(
            0,
          );
        }
        if (title === "fullWidth") {
          for (const width of [1280, 640, 390]) {
            await page.setViewportSize({ width, height: 900 });
            const b = await scope.getByRole("tab").evaluateAll((els) =>
              els.map((el) => {
                const r = el.getBoundingClientRect();
                return { width: r.width, top: r.top };
              })
            );
            expect(b.length).toBe(3);
            expect(
              Math.max(...b.map((x) => x.top)) -
                Math.min(...b.map((x) => x.top)),
            ).toBeLessThanOrEqual(1);
            expect(
              Math.max(...b.map((x) => x.width)) -
                Math.min(...b.map((x) => x.width)),
            ).toBeLessThanOrEqual(1);
            const list = scope.getByRole("tablist");
            expect(
              await list.evaluate((el) =>
                Math.abs(
                  el.getBoundingClientRect().width -
                    el.parentElement!.getBoundingClientRect().width,
                )
              ),
            ).toBeLessThanOrEqual(1);
            await scope.getByRole("tab", { name: "标签 B", exact: true })
              .click();
            await tabState(scope, "B");
          }
        }
        if (title === "位置与默认激活项") {
          const list = await scope.getByRole("tablist").boundingBox(),
            panel = await scope.getByRole("tabpanel").boundingBox();
          if (!list || !panel) throw new Error("left layout not measurable");
          expect(list.x + list.width).toBeLessThanOrEqual(panel.x);
          expect(
            await scope.getByRole("tablist").evaluate((el) =>
              getComputedStyle(el).flexDirection
            ),
          ).toBe("column");
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  async function collapseState(scope: Locator, opened: number[]) {
    for (let n = 1; n <= 3; n++) {
      const button = scope.getByRole("button", {
          name: "面板 " + n,
          exact: true,
        }),
        content = button.locator("..").locator(":scope > div[aria-hidden]");
      await attr(button, "aria-expanded", String(opened.includes(n)));
      await attr(content, "aria-hidden", String(!opened.includes(n)));
      await visible(content, opened.includes(n));
      expect((await content.textContent())!.trim()).toBe(
        ["内容一", "内容二", "内容三"][n - 1],
      );
    }
  }
  it("物理操作 Collapse：受控多开逐个开关、Enter/Space及恢复", async (t) => {
    const page = await open(t, "/desktop/data-display/collapse"),
      scope = demo(page, "受控 + 多开");
    await collapseState(scope, [1]);
    for (
      const [n, state] of [[2, [1, 2]], [3, [1, 2, 3]], [1, [2, 3]], [2, [3]], [
        3,
        [],
      ]] as const
    ) {
      await scope.getByRole("button", { name: "面板 " + n, exact: true }).click(
        {
          delay: 180,
        },
      );
      await collapseState(scope, [...state]);
    }
    await scope.getByRole("button", { name: "面板 1", exact: true }).press(
      "Enter",
    );
    await collapseState(scope, [1]);
    await scope.getByRole("button", { name: "面板 2", exact: true }).press(
      "Space",
    );
    await collapseState(scope, [1, 2]);
  }, DOCS_BROWSER_CONFIG);
  it("物理操作 Collapse：手风琴排他/全部关闭及无外边框", async (t) => {
    const page = await open(t, "/desktop/data-display/collapse"),
      scope = demo(page, "accordion + bordered=false");
    await collapseState(scope, [1]);
    for (const [n, state] of [[2, [2]], [3, [3]], [3, []], [1, [1]]] as const) {
      await scope.getByRole("button", { name: "面板 " + n, exact: true }).click(
        {
          delay: 180,
        },
      );
      await collapseState(scope, [...state]);
    }
    expect(
      await scope.locator(".collapse-panels").evaluate((el) =>
        getComputedStyle(el).borderTopWidth
      ),
    ).toBe("0px");
  }, DOCS_BROWSER_CONFIG);
  it(
    "物理操作 Collapse：无箭头与sm两个实例各自全部面板开关且独立",
    async (t) => {
      const page = await open(t, "/desktop/data-display/collapse"),
        scope = demo(page, "showArrow=false / size=sm"),
        groups = scope.locator(".collapse-panels");
      expect(await groups.count()).toBe(2);
      await collapseState(groups.nth(0), []);
      await collapseState(groups.nth(1), [1]);
      for (let i = 0; i < 2; i++) {
        const group = groups.nth(i);
        expect(await group.locator("button svg").count()).toBe(i === 0 ? 0 : 3);
        const first = group.getByRole("button", {
          name: "面板 1",
          exact: true,
        });
        expect(await first.evaluate((el) => getComputedStyle(el).paddingTop))
          .toBe(
            i === 0 ? "12px" : "6px",
          );
        const opened = new Set(i === 0 ? [] : [1]);
        for (const n of [2, 3, 1, 2, 3, 1]) {
          await group.getByRole("button", { name: "面板 " + n, exact: true })
            .click(
              { delay: 180 },
            );
          if (opened.has(n)) opened.delete(n);
          else opened.add(n);
          await collapseState(group, [...opened]);
          await collapseState(groups.nth(1 - i), i === 0 ? [1] : []);
        }
      }
      await eventually(async () => await groups.count() === 2);
    },
    DOCS_BROWSER_CONFIG,
  );
});
