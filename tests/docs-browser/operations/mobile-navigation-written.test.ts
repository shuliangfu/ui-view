/** WRITTEN-UNRUN. Native input plans queued for the eventual unified docs-browser run. */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open } from "./driver.ts";
describe("Mobile navigation written", () => {
  for (const icons of [false, true]) {
    it(
      "移动TabBar：" +
        (icons ? "图标 + 角标" : "文案标签（fixed=false）") +
        " 全项鼠标/键盘切换及实例隔离",
      async (t) => {
        for (const width of [390, 1280]) {
          const p = await open(t, "/mobile/navigation/tab-bar");
          await p.setViewportSize({ width, height: 900 });
          const first = demo(p, "文案标签（fixed=false）"),
            second = demo(p, "图标 + 角标"),
            scope = icons ? second : first,
            other = icons ? first : second,
            list = scope.getByRole("tablist"),
            tabs = list.getByRole("tab"),
            labels = icons
              ? ["首页", "消息", "我的"]
              : ["首页", "列表", "我的"],
            keys = icons ? ["home", "inbox", "me"] : ["home", "list", "me"];
          expect(await tabs.locator(":scope > span.truncate").allTextContents())
            .toEqual(labels);
          expect(await list.evaluate((e) => getComputedStyle(e).position)).toBe(
            "static",
          );
          expect(await tabs.count()).toBe(3);
          expect(await tabs.locator("svg").count()).toBe(icons ? 3 : 0);
          if (icons) {
            expect(await tabs.nth(0).getByText("2", { exact: true }).count())
              .toBe(1);
          }
          for (const [step, index] of [1, 2, 0, 2, 1].entries()) {
            const tab = tabs.nth(index);
            if (step === 2) await tab.press("Enter");
            else if (step === 3) await tab.press("Space");
            else await tab.click({ delay: 180 });
            for (let i = 0; i < 3; i++) {
              await attr(tabs.nth(i), "aria-selected", String(i === index));
              expect(
                await tabs.nth(i).evaluate(
                  (e, c) => e.classList.contains(c),
                  i === index ? "text-blue-600" : "text-slate-500",
                ),
              ).toBe(true);
            }
            await attr(other.getByRole("tab").nth(0), "aria-selected", "true");
            if (!icons) {
              expect(await first.locator("p span.font-mono").textContent())
                .toBe(
                  keys[index],
                );
            } else {
              for (const svg of await tab.locator("svg").all()) {
                // Compare in one browser frame: button transition-colors advances
                // between separate round trips and otherwise produces false failures.
                expect(
                  await svg.evaluate((e) =>
                    getComputedStyle(e).color ===
                      getComputedStyle(e.closest("button")!).color
                  ),
                ).toBe(true);
              }
              expect(
                await tabs.nth(0).getByText("2", { exact: true }).textContent(),
              ).toBe("2");
            }
          }
          const selected = await tabs.evaluateAll((nodes) =>
            nodes.map((e) => e.getAttribute("aria-selected"))
          );
          await tabs.nth(1).click();
          expect(
            await tabs.evaluateAll((nodes) =>
              nodes.map((e) => e.getAttribute("aria-selected"))
            ),
          ).toEqual(selected);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  for (const fixed of [false, true]) {
    it(
      "移动NavBar：" +
        (fixed ? "fixed + placeholder" : "基础（非 fixed）") +
        " 标题/区域/实际history返回",
      async (t) => {
        for (const width of [390, 1280]) {
          const p = await open(t, "/mobile/navigation/tab-bar");
          await open(t, "/mobile/navigation/navbar");
          await p.setViewportSize({ width, height: 900 });
          const scope = demo(
              p,
              fixed ? "fixed + placeholder" : "基础（非 fixed）",
            ),
            bar = scope.getByRole("banner"),
            title = bar.getByRole("heading", {
              name: fixed ? "固定顶栏" : "页面标题",
              exact: true,
            });
          expect(await bar.getByRole("button").count()).toBe(fixed ? 1 : 2);
          expect(
            await bar.getByRole("button", { name: "返回", exact: true })
              .locator(
                "svg",
              ).count(),
          ).toBe(1);
          const r = await bar.boundingBox(), h = await title.boundingBox();
          if (!r || !h) throw new Error("Missing Navbar geometry");
          expect(Math.abs(r.x + r.width / 2 - h.x - h.width / 2))
            .toBeLessThanOrEqual(1);
          expect(await bar.evaluate((e) => getComputedStyle(e).position)).toBe(
            fixed ? "fixed" : "relative",
          );
          if (fixed) {
            const frame = bar.locator(".."),
              placeholder = frame.locator(':scope > div[aria-hidden="true"]'),
              content = frame.getByText(
                "正文从占位下方开始，不被 NavBar 盖住。",
                { exact: true },
              );
            const rect = await placeholder.boundingBox(),
              c = await content.boundingBox();
            if (!rect || !c) throw new Error("Missing fixed placeholder");
            expect(Math.abs(rect.height - r.height)).toBeLessThanOrEqual(1);
            expect(c.y >= r.y + r.height - 1).toBe(true);
            const top = await frame.evaluate((e) =>
              e.getBoundingClientRect().top + (e as HTMLElement).clientTop
            );
            expect(Math.abs(r.y - top)).toBeLessThanOrEqual(1);
          } else {
            const url = p.url();
            await bar.getByRole("button", { name: "操作", exact: true }).click({
              delay: 180,
            });
            expect(p.url()).toBe(url);
            expect(await title.textContent()).toBe("页面标题");
          }
          await bar.getByRole("button", { name: "返回", exact: true }).click({
            delay: 180,
          });
          await p.waitForURL("**/mobile/navigation/tab-bar");
          expect(
            await p.getByRole("heading", {
              name: "TabBar 底部标签栏",
              exact: true,
            }).count(),
          ).toBe(1);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "移动IndexBar：五分组全部索引鼠标/键盘、精确局部滚动和wheel scroll-spy",
    async (t) => {
      const p = await open(t, "/mobile/navigation/index-bar"),
        scope = demo(p, "示例"),
        root = scope.locator(".index-bar"),
        scroll = root.locator("[data-ui-index-bar-list]"),
        nav = root.getByRole("navigation"),
        buttons = nav.getByRole("button");
      expect(await buttons.allTextContents()).toEqual([
        "A",
        "B",
        "C",
        "D",
        "Z",
      ]);
      const names = [["Alice", "Amy"], ["Bob", "Bella"], ["Carol"], ["David"], [
        "Zoe",
      ]];
      const sections = scroll.locator(":scope > section");
      expect(await sections.count()).toBe(5);
      for (let i = 0; i < 5; i++) {
        for (const name of names[i]) {
          expect(await sections.nth(i).getByText(name, { exact: true }).count())
            .toBe(1);
        }
      }
      for (const [n, index] of [4, 0, 2, 1, 3, 0].entries()) {
        const button = buttons.nth(index);
        if (n === 2) await button.press("Enter");
        else if (n === 3) await button.press("Space");
        else await button.click({ delay: 180 });
        await attr(button, "aria-current", "true");
        expect(
          await button.evaluate((e) => e.classList.contains("bg-blue-600")),
        )
          .toBe(true);
        const expected = await sections.nth(index).evaluate((e) => {
          const root = e.parentElement!;
          return Math.min(
            root.scrollHeight - root.clientHeight,
            (e as HTMLElement).offsetTop - (root as HTMLElement).offsetTop,
          );
        });
        await eventually(async () =>
          Math.abs(await scroll.evaluate((e) => e.scrollTop) - expected) < 1
        );
      }
      await p.waitForTimeout(500);
      const b = await scroll.boundingBox();
      if (!b) throw new Error("Missing index list");
      await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await p.mouse.wheel(0, 2000);
      await eventually(async () =>
        await scroll.evaluate((e) => e.scrollTop) > 0
      );
      const expected = await scroll.evaluate((root) => {
        let result = "A";
        for (
          const e of root.querySelectorAll<HTMLElement>(":scope > section")
        ) {
          if (
            e.offsetTop - (root as HTMLElement).offsetTop - 8 <= root.scrollTop
          ) result = e.dataset.index!;
        }
        return result;
      });
      await attr(
        nav.getByRole("button", { name: expected, exact: true }),
        "aria-current",
        "true",
      );
      await p.mouse.wheel(0, -2000);
      await eventually(async () =>
        await scroll.evaluate((e) => e.scrollTop) === 0
      );
      await attr(buttons.nth(0), "aria-current", "true");
    },
    DOCS_BROWSER_CONFIG,
  );
});
