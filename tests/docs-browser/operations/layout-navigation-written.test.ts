/** WRITTEN-UNRUN. Do not run until the whole docs operation inventory is written. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG, sharedEnv } from "../helpers.ts";
import { attr, eventually, example as demo, open } from "./driver.ts";
async function hit(p: Page, el: Locator) {
  await el.scrollIntoViewIfNeeded();
  const r = await el.boundingBox();
  if (!r) throw new Error("Missing pointer target");
  await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2, { delay: 180 });
}
describe("Layout navigation written", () => {
  for (const multiple of [true, false]) {
    it(
      "Accordion：" +
        (multiple ? "allowMultiple=true" : "allowMultiple=false（单选）"),
      async (t) => {
        const p = await open(t, "/desktop/layout/accordion"),
          multi = demo(p, "allowMultiple=true"),
          single = demo(p, "allowMultiple=false（单选）"),
          scope = multiple ? multi : single;
        const state = async (group: typeof scope, expected: boolean[]) => {
          for (const [i, expanded] of expected.entries()) {
            const button = group.getByRole("button", {
                name: ["第一项", "第二项", "第三项"][i],
                exact: true,
              }),
              region = group.getByRole("region").nth(i);
            await attr(button, "aria-expanded", String(expanded));
            expect(await button.getAttribute("aria-controls")).toBe(
              await region.getAttribute("id"),
            );
            expect(await region.getAttribute("aria-labelledby")).toBe(
              await button.getAttribute("id"),
            );
            expect(await region.textContent()).toBe(
              ["第一项展开内容。", "第二项展开内容。", "第三项展开内容。"][i],
            );
            await eventually(async () => {
              const b = await region.boundingBox();
              return b !== null && (expanded ? b.height > 0 : b.height === 0);
            });
          }
        };
        const initial = [true, false, false] as boolean[];
        const other = multiple ? single : multi;
        await state(multi, initial);
        await state(single, initial);
        await scope.getByRole("button", { name: "第二项", exact: true }).click({
          delay: 180,
        });
        await state(
          scope,
          multiple ? [true, true, false] : [false, true, false],
        );
        await state(other, initial);
        await scope.getByRole("button", { name: "第三项", exact: true }).press(
          "Enter",
        );
        await state(
          scope,
          multiple ? [true, true, true] : [false, false, true],
        );
        await state(other, initial);
        await scope.getByRole("button", { name: "第三项", exact: true }).press(
          "Space",
        );
        await state(
          scope,
          multiple ? [true, true, false] : [false, false, false],
        );
        await state(other, initial);
        await scope.getByRole("button", { name: "第一项", exact: true })
          .click();
        await state(
          scope,
          multiple ? [false, true, false] : [true, false, false],
        );
        await state(other, initial);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "Accordion：items 含 disabled，实际禁用点击/键盘不展开且其它项可关闭重开",
    async (t) => {
      const p = await open(t, "/desktop/layout/accordion"),
        scope = demo(p, "items 含 disabled"),
        enabled = scope.getByRole("button", { name: "可展开", exact: true }),
        disabled = scope.getByRole("button", { name: "禁用项", exact: true });
      expect(await disabled.isDisabled()).toBe(true);
      await attr(enabled, "aria-expanded", "true");
      await hit(p, disabled);
      await attr(disabled, "aria-expanded", "false");
      await attr(enabled, "aria-expanded", "true");
      await enabled.press("Space");
      await attr(enabled, "aria-expanded", "false");
      await enabled.press("Enter");
      await attr(enabled, "aria-expanded", "true");
      await enabled.focus();
      await p.keyboard.press("Tab");
      expect(await disabled.evaluate((e) => e === document.activeElement)).toBe(
        false,
      );
      expect(await scope.getByRole("region").nth(1).textContent()).toBe(
        "不可点击",
      );
    },
    DOCS_BROWSER_CONFIG,
  );
  it("Accordion：同页多个实例的ARIA目标ID必须全局唯一", async (t) => {
    const p = await open(t, "/desktop/layout/accordion"),
      buttons = p.locator('main button[aria-controls^="accordion-content-"]');
    expect(await buttons.count()).toBe(8);
    for (const button of await buttons.all()) {
      for (
        const id of [
          await button.getAttribute("id"),
          await button.getAttribute("aria-controls"),
        ]
      ) {
        if (!id) throw new Error("Missing accordion ARIA target");
        expect(await p.locator(`[id="${id}"]`).count()).toBe(1);
      }
    }
  }, DOCS_BROWSER_CONFIG);
  async function stepState(scope: Locator, current: number, override = false) {
    const list = scope.getByRole("list", { name: "步骤", exact: true }),
      items = list.getByRole("listitem");
    expect(await items.count()).toBe(3);
    for (let i = 0; i < 3; i++) {
      const circle = items.nth(i).locator(":scope > div > span").first(),
        status = override
          ? ["finish", "process", "wait"][i]
          : i < current
          ? "finish"
          : i === current
          ? "process"
          : "wait";
      expect(
        await circle.evaluate(
          (e, c) => e.classList.contains(c),
          status === "finish"
            ? "border-green-500"
            : status === "process"
            ? "border-blue-600"
            : "border-slate-300",
        ),
      ).toBe(true);
      expect(await circle.locator("svg").count()).toBe(
        status === "finish" ? 1 : 0,
      );
      if (status !== "finish") {
        expect(await circle.textContent()).toBe(String(i + 1));
      }
    }
  }
  it(
    "Steps：direction=horizontal（可点击）完整上/下一步、末步完成后再禁用",
    async (t) => {
      const p = await open(t, "/desktop/navigation/steps"),
        scope = demo(p, "direction=horizontal（可点击）"),
        vertical = demo(p, "direction=vertical"),
        prev = scope.getByRole("button", { name: "上一步", exact: true });
      await stepState(scope, 0);
      expect(await prev.isDisabled()).toBe(true);
      await hit(p, prev);
      await stepState(scope, 0);
      for (let i = 1; i <= 2; i++) {
        await scope.getByRole("button", { name: "下一步", exact: true }).click({
          delay: 180,
        });
        await stepState(scope, i);
        await stepState(vertical, i);
      }
      const finish = scope.getByRole("button", { name: "完成", exact: true });
      expect(await finish.isDisabled()).toBe(false);
      await finish.click({ delay: 180 });
      await stepState(scope, 3);
      await stepState(vertical, 3);
      const done = scope.getByRole("button", { name: "已完成", exact: true });
      expect(await done.isDisabled()).toBe(true);
      await hit(p, done);
      await stepState(scope, 3);
      await prev.press("Enter");
      await stepState(scope, 2);
      expect(
        await scope.getByRole("button", { name: "完成", exact: true })
          .isDisabled(),
      ).toBe(false);
      await prev.press("Space");
      await stepState(scope, 1);
      await prev.press("Space");
      await stepState(scope, 0);
      await scope.getByRole("listitem").nth(2).click();
      await stepState(scope, 2);
      expect(
        await scope.getByRole("button", { name: "完成", exact: true })
          .isDisabled(),
      ).toBe(false);
      await scope.getByRole("listitem").nth(0).click();
      await stepState(scope, 0);
      await stepState(vertical, 0);
      for (const width of [390, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        const list = scope.getByRole("list");
        const r = await list.boundingBox();
        if (!r) throw new Error("Missing Steps width");
        await attr(
          list,
          "data-steps-direction",
          r.width <= 639.98 ? "vertical" : "horizontal",
        );
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "Steps：direction=vertical 非交互布局随共享current更新但点击不修改状态",
    async (t) => {
      const p = await open(t, "/desktop/navigation/steps"),
        scope = demo(p, "direction=vertical");
      await attr(scope.getByRole("list"), "data-steps-direction", "vertical");
      await stepState(scope, 0);
      await scope.getByRole("listitem").nth(2).click();
      await stepState(scope, 0);
      await demo(p, "direction=horizontal（可点击）").getByRole("button", {
        name: "下一步",
        exact: true,
      }).click();
      await stepState(scope, 1);
      const r = await scope.getByRole("listitem").evaluateAll((nodes) =>
        nodes.map((e) => e.getBoundingClientRect().y)
      );
      expect(r[0] < r[1] && r[1] < r[2]).toBe(true);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "Steps：items 含 status 明确finish/process/wait且不随其它实例切换",
    async (t) => {
      const p = await open(t, "/desktop/navigation/steps"),
        scope = demo(p, "items 含 status");
      await stepState(scope, 1, true);
      for (const title of ["已完成", "进行中", "待开始"]) {
        expect(await scope.getByText(title, { exact: true }).count()).toBe(2);
      }
      await demo(p, "direction=horizontal（可点击）").getByRole("button", {
        name: "下一步",
        exact: true,
      }).click();
      await stepState(scope, 1, true);
      await scope.getByRole("listitem").nth(0).click();
      await stepState(scope, 1, true);
    },
    DOCS_BROWSER_CONFIG,
  );
  for (const title of ["默认", "自定义 separator"]) {
    it(
      "Breadcrumb：" + title + " 每个链接的真实片段导航及末项不可点击",
      async (t) => {
        const p = await open(t, "/desktop/navigation/breadcrumb");
        for (const linkText of ["首页", "列表"]) {
          await open(t, "/desktop/navigation/breadcrumb");
          const nav = demo(p, title).getByRole("navigation");
          expect(await nav.getByRole("listitem").count()).toBe(3);
          expect(await nav.getByRole("link").allTextContents()).toEqual([
            "首页",
            "列表",
          ]);
          await attr(
            nav.getByText("详情", { exact: true }),
            "aria-current",
            "page",
          );
          expect(await nav.getByRole("button").count()).toBe(0);
          if (title === "默认") {
            expect(await nav.locator('[aria-hidden="true"] svg').count()).toBe(
              2,
            );
          } else {expect(await nav.getByText("/", { exact: true }).count())
              .toBe(
                2,
              );}
          const expectedUrl = new URL("#", p.url()).href;
          await nav.getByRole("link", { name: linkText, exact: true }).click();
          await p.waitForURL(expectedUrl);
          expect(p.url()).toBe(expectedUrl);
          expect(await demo(p, title).getByRole("navigation").count()).toBe(1);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "Breadcrumb：onItemClick（无 href 项点击）精确callback索引、键盘及最后一项不回调",
    async (t) => {
      const p = await open(t, "/desktop/navigation/breadcrumb"),
        calls: string[] = [];
      p.on("console", (m) => {
        if (m.text().startsWith("clicked")) calls.push(m.text());
      });
      const nav = demo(p, "onItemClick（无 href 项点击）").getByRole(
          "navigation",
        ),
        button = nav.getByRole("button", { name: "列表", exact: true });
      for (const method of ["click", "Enter", "Space"]) {
        if (method === "click") await button.click({ delay: 180 });
        else await button.press(method);
        await eventually(() =>
          calls.length === ["click", "Enter", "Space"].indexOf(method) + 1
        );
      }
      expect(calls).toEqual(["clicked 1", "clicked 1", "clicked 1"]);
      await nav.getByText("详情", { exact: true }).click();
      await p.waitForTimeout(100);
      expect(calls.length).toBe(3);
      expect(new URL(p.url()).pathname).toBe("/desktop/navigation/breadcrumb");
    },
    DOCS_BROWSER_CONFIG,
  );
  function splitterRoot(p: Page, title: string) {
    const root = demo(p, title).locator(".splitter");
    const sep = root.getByRole("separator");
    const panels = root.locator(":scope > div:not([role=separator])");
    const sizes = () =>
      panels.evaluateAll((nodes) =>
        nodes.map((e) => Number.parseFloat((e as HTMLElement).style.flexBasis))
      );
    const drag = async (fraction: number, axis: "x" | "y") => {
      await sep.scrollIntoViewIfNeeded();
      const s = await sep.boundingBox(), r = await root.boundingBox();
      if (!s || !r) throw new Error("No Splitter geometry");
      const midX = s.x + s.width / 2, midY = s.y + s.height / 2;
      await p.mouse.move(midX, midY);
      await p.mouse.down();
      await p.waitForTimeout(180);
      await p.mouse.move(
        axis === "x" ? midX + r.width * fraction : midX,
        axis === "y" ? midY + r.height * fraction : midY,
        { steps: 10 },
      );
      await p.mouse.up();
    };
    return { root, sep, panels, sizes, drag };
  }
  it(
    "Splitter：左右分割 真实按住横拖、宽度变化/保留、最小比例及释放后不继续拖动",
    async (t) => {
      const p = await open(t, "/desktop/layout/splitter"),
        { sep, panels, sizes, drag } = splitterRoot(p, "左右分割");
      expect(await panels.allTextContents()).toEqual(["左", "右"]);
      await attr(sep, "aria-orientation", "horizontal");
      expect(await sizes()).toEqual([50, 50]);
      await drag(0.2, "x");
      await eventually(async () => Math.abs((await sizes())[0] - 70) < 0.5);
      expect(Math.abs((await sizes())[1] - 30)).toBeLessThanOrEqual(0.5);
      const saved = await sizes();
      await p.mouse.move(10, 10);
      expect(await sizes()).toEqual(saved);
      await drag(-0.2, "x");
      await eventually(async () => Math.abs((await sizes())[0] - 50) < 0.5);
      await drag(-0.9, "x");
      const minimum = await sizes();
      expect(minimum[0] >= 9.99).toBe(true);
      expect(Math.abs(minimum[0] + minimum[1] - 100)).toBeLessThanOrEqual(0.01);
      await sep.scrollIntoViewIfNeeded();
      await sep.focus();
      await eventually(async () =>
        await sep.evaluate((e) => e === document.activeElement)
      );
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "Splitter：上下分割 真实按住纵拖、高度变化/保留、最小比例及释放后不继续拖动",
    async (t) => {
      const p = await open(t, "/desktop/layout/splitter"),
        { sep, panels, sizes, drag } = splitterRoot(p, "上下分割");
      expect(await panels.allTextContents()).toEqual(["上", "下"]);
      await attr(sep, "aria-orientation", "vertical");
      expect(await sizes()).toEqual([50, 50]);
      await drag(0.2, "y");
      await eventually(async () => Math.abs((await sizes())[0] - 70) < 0.5);
      expect(Math.abs((await sizes())[1] - 30)).toBeLessThanOrEqual(0.5);
      const saved = await sizes();
      await p.mouse.move(10, 10);
      expect(await sizes()).toEqual(saved);
      await drag(-0.2, "y");
      await eventually(async () => Math.abs((await sizes())[0] - 50) < 0.5);
      await drag(-0.9, "y");
      const minimum = await sizes();
      expect(minimum[0] >= 9.99).toBe(true);
      expect(Math.abs(minimum[0] + minimum[1] - 100)).toBeLessThanOrEqual(0.01);
      await sep.scrollIntoViewIfNeeded();
      await sep.focus();
      await eventually(async () =>
        await sep.evaluate((e) => e === document.activeElement)
      );
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "Splitter：记住拖拽位置 松开后写入 cookie，刷新后仍是拖过的比例",
    async (t) => {
      const p = await open(t, "/desktop/layout/splitter");
      if (!t) throw new Error("Physical tests require Playwright Page");
      const cookieName = "ui-view-docs-splitter-persist";
      await p.evaluate((name) => {
        document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0`;
      }, cookieName);
      await p.reload();
      await sharedEnv.waitDocMainReady(t);
      const { sizes, drag } = splitterRoot(p, "记住拖拽位置");
      await eventually(async () => {
        const cur = await sizes();
        return cur.length === 2 && Math.abs(cur[0] - 50) < 0.5;
      });
      expect(await sizes()).toEqual([50, 50]);
      await drag(0.2, "x");
      await eventually(async () => Math.abs((await sizes())[0] - 70) < 0.5);
      const saved = await sizes();
      await eventually(async () => {
        const raw = await p.evaluate(() => document.cookie);
        return raw.split(";").some((part) => {
          const [k, v] = part.trim().split("=");
          if (decodeURIComponent(k) !== cookieName) return false;
          const nums = decodeURIComponent(v ?? "").split(",").map(Number);
          return nums.length === 2 && Math.abs(nums[0] - saved[0]) < 0.5 &&
            Math.abs(nums[1] - saved[1]) < 0.5;
        });
      });
      await p.reload();
      await sharedEnv.waitDocMainReady(t);
      const again = splitterRoot(p, "记住拖拽位置");
      await eventually(async () =>
        Math.abs((await again.sizes())[0] - saved[0]) < 0.5
      );
      expect(Math.abs((await again.sizes())[1] - saved[1])).toBeLessThanOrEqual(
        0.5,
      );
    },
    DOCS_BROWSER_CONFIG,
  );
});
