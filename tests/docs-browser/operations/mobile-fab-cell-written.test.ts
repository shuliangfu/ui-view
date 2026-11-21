/** WRITTEN-UNRUN: native pointer/keyboard activation, exact state and intercepted link destination. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open } from "./driver.ts";

async function activate(el: Locator, mode: string) {
  if (mode === "mouse") await el.click({ delay: 180 });
  else await el.press(mode);
}
async function noChildren(frame: Locator, names: string[]) {
  for (const name of names) {
    expect(await frame.getByRole("button", { name, exact: true }).count()).toBe(
      0,
    );
  }
}
async function fabShape(button: Locator, shape: string) {
  const css = await button.evaluate((e) => {
    const c = getComputedStyle(e);
    return { w: c.width, h: c.height, p: c.padding, r: c.borderTopLeftRadius };
  });
  expect([css.w, css.h, css.p]).toEqual(["48px", "48px", "0px"]);
  if (shape === "square") expect(css.r).toBe("12px");
  else expect(parseFloat(css.r) >= 24).toBe(true);
  const root = button.locator("..");
  expect(
    await root.evaluate((e) => {
      const c = getComputedStyle(e);
      return [c.position, c.margin, c.zIndex];
    }),
  ).toEqual(["absolute", "24px", "280"]);
  const placement = await root.evaluate((e) => {
    const b = e.getBoundingClientRect(),
      host = (e as HTMLElement).offsetParent!.getBoundingClientRect();
    return [
      Math.round(host.right - b.right),
      Math.round(host.bottom - b.bottom),
    ];
  });
  expect(placement).toEqual([24, 24]);
}
async function switchState(frame: Locator, checked: boolean) {
  const input = frame.getByRole("checkbox");
  await eventually(async () => await input.isChecked() === checked);
  expect(await input.isChecked()).toBe(checked);
  const thumb = frame.locator("label > span[aria-hidden] > span");
  await eventually(async () =>
    await thumb.evaluate((e, on) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
      return m.m41 === (on ? 20 : 0) && m.m42 === -10;
    }, checked)
  );
  expect(
    await thumb.evaluate((e) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
      return [m.m41, m.m42];
    }),
  ).toEqual([checked ? 20 : 0, -10]);
}
describe("Mobile FAB cell written", () => {
  for (const width of [390, 1280]) {
    it(
      `移动FloatButton 圆形 + 徽标 + 子项 @${width}：原生开关/逐子项关闭/键盘与几何`,
      async (t) => {
        const p = await open(t, "/mobile/basic/float-button");
        await p.setViewportSize({ width, height: 900 });
        const frame = demo(p, "圆形 + 徽标 + 子项"),
          main = frame.getByRole("button", { name: "新建", exact: true });
        await fabShape(main, "circle");
        await attr(main, "aria-expanded", "false");
        const badge = main.getByRole("status", { name: "3", exact: true });
        expect(await badge.innerText()).toBe("3");
        expect(await badge.evaluate((e) => getComputedStyle(e).pointerEvents))
          .toBe("none");
        await noChildren(frame, ["文件", "图片"]);
        await main.click({ delay: 180 });
        await attr(main, "aria-expanded", "true");
        expect(await main.locator("..").getByRole("button").count()).toBe(3); // main and exactly two children; exclude docs toolbar
        for (const name of ["文件", "图片"]) {
          const child = frame.getByRole("button", { name, exact: true });
          expect(await child.isVisible()).toBe(true);
          expect(
            await child.evaluate(
              (e) => [getComputedStyle(e).width, getComputedStyle(e).height],
            ),
          ).toEqual(["40px", "40px"]);
        }
        await main.press("Space");
        await attr(main, "aria-expanded", "false");
        await noChildren(frame, ["文件", "图片"]);
        for (
          const [name, mode] of [["文件", "mouse"], ["图片", "Enter"], [
            "文件",
            "Space",
          ]]
        ) {
          await main.press("Enter");
          await attr(main, "aria-expanded", "true");
          await activate(
            frame.getByRole("button", { name, exact: true }),
            mode,
          );
          await attr(main, "aria-expanded", "false");
          await noChildren(frame, ["文件", "图片"]);
          expect(await badge.innerText()).toBe("3");
        }
        await attr(
          demo(p, "受控 open").getByRole("button", {
            name: "受控",
            exact: true,
          }),
          "aria-expanded",
          "false",
        );
        expect(await p.url()).toContain("/mobile/basic/float-button");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `移动FloatButton 方形 @${width}：无菜单原生激活不伪造动作`,
      async (t) => {
        const p = await open(t, "/mobile/basic/float-button");
        await p.setViewportSize({ width, height: 900 });
        const frame = demo(p, "方形"),
          main = frame.getByRole("button", { name: "方", exact: true });
        await fabShape(main, "square");
        expect(await main.innerText()).toBe("＋");
        await attr(main, "aria-expanded", null);
        for (const mode of ["mouse", "Enter", "Space"]) {
          await activate(main, mode);
          await attr(main, "aria-expanded", null);
          expect(await main.innerText()).toBe("＋");
          expect(await frame.locator("button[aria-expanded]").count()).toBe(0);
          await attr(
            demo(p, "圆形 + 徽标 + 子项").getByRole("button", {
              name: "新建",
              exact: true,
            }),
            "aria-expanded",
            "false",
          );
          await attr(
            demo(p, "受控 open").getByRole("button", {
              name: "受控",
              exact: true,
            }),
            "aria-expanded",
            "false",
          );
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `移动FloatButton 受控 open @${width}：每种真实输入与子项写回`,
      async (t) => {
        const p = await open(t, "/mobile/basic/float-button");
        await p.setViewportSize({ width, height: 900 });
        const frame = demo(p, "受控 open"),
          main = frame.getByRole("button", { name: "受控", exact: true });
        await fabShape(main, "circle");
        for (const mode of ["mouse", "Enter", "Space"]) {
          await attr(main, "aria-expanded", "false");
          await noChildren(frame, ["X"]);
          await activate(main, mode);
          await attr(main, "aria-expanded", "true");
          expect(
            await frame.getByRole("button", { name: "X", exact: true })
              .isVisible(),
          ).toBe(true);
          await activate(main, mode);
          await attr(main, "aria-expanded", "false");
          await noChildren(frame, ["X"]);
          await activate(main, mode);
          await attr(main, "aria-expanded", "true");
          await activate(
            frame.getByRole("button", { name: "X", exact: true }),
            mode,
          );
          await attr(main, "aria-expanded", "false");
          await noChildren(frame, ["X"]);
          await attr(
            demo(p, "圆形 + 徽标 + 子项").getByRole("button", {
              name: "新建",
              exact: true,
            }),
            "aria-expanded",
            "false",
          );
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const mode of ["mouse", "Enter", "Space"]) {
      it(
        `移动Cell 可点 + Switch + 禁用 @${width}：账号${mode}精确结果`,
        async (t) => {
          const p = await open(t, "/mobile/data-display/cell");
          await p.setViewportSize({ width, height: 900 });
          const frame = demo(p, "可点 + Switch + 禁用"),
            cells = frame.locator("[data-dreamer-cell]");
          expect(await cells.count()).toBe(3);
          expect(await frame.getByRole("status").count()).toBe(0);
          const account = cells.nth(0);
          await attr(account, "role", "button");
          await attr(account, "tabindex", "0");
          expect(await account.locator("[data-dreamer-cell-extra]").innerText())
            .toBe("详情");
          expect(await account.locator("[data-dreamer-cell-arrow]").innerText())
            .toBe("›");
          await activate(account, mode);
          await eventually(async () =>
            await frame.getByRole("status").innerText() === "已打开账号详情"
          );
          expect(await frame.getByRole("status").count()).toBe(1);
          await switchState(frame, true);
          expect(await p.url()).toContain("/mobile/data-display/cell");
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      `移动Cell 可点 + Switch + 禁用 @${width}：通知switch写回与禁用真实点击`,
      async (t) => {
        const p = await open(t, "/mobile/data-display/cell");
        await p.setViewportSize({ width, height: 900 });
        const frame = demo(p, "可点 + Switch + 禁用"),
          cells = frame.locator("[data-dreamer-cell]"),
          notification = cells.nth(1),
          disabled = cells.nth(2);
        expect(await notification.getByText("通知", { exact: true }).count())
          .toBe(1);
        expect(await notification.getByText("推送", { exact: true }).count())
          .toBe(1);
        await attr(notification, "data-clickable", "false");
        const checkbox = notification.getByRole("checkbox"),
          label = checkbox.locator("..");
        await switchState(frame, true);
        await label.click({ delay: 180 });
        await switchState(frame, false);
        await checkbox.press("Space");
        await switchState(frame, true);
        await checkbox.press("Space");
        await switchState(frame, false);
        await label.click({ delay: 180 });
        await switchState(frame, true);
        await attr(disabled, "aria-disabled", "true");
        await attr(disabled, "data-clickable", "false");
        await attr(disabled, "tabindex", null);
        await attr(disabled, "role", null);
        expect(await disabled.locator("[data-dreamer-cell-extra]").innerText())
          .toBe("不可用");
        expect(
          await disabled.evaluate((e) => {
            const c = getComputedStyle(e);
            return [c.opacity, c.pointerEvents];
          }),
        ).toEqual(["0.5", "none"]);
        await disabled.scrollIntoViewIfNeeded();
        const box = await disabled.boundingBox();
        if (!box) throw Error("Disabled row geometry missing");
        await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
          delay: 180,
        });
        expect(await frame.getByRole("status").count()).toBe(0);
        await switchState(frame, true);
        await checkbox.press("Tab");
        expect(
          await disabled.evaluate((e) =>
            e === document.activeElement || e.contains(document.activeElement)
          ),
        ).toBe(false);
        expect(await frame.getByRole("status").count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const mode of ["mouse", "Enter"]) {
      it(
        `移动Cell href 链接行 @${width}：${mode}导航到精确href本地拦截`,
        async (t) => {
          const p = await open(t, "/mobile/data-display/cell");
          await p.setViewportSize({ width, height: 900 });
          // No external network or real service data: intercept only this demo href.
          const destination = "https://example.com/help";
          let requests = 0;
          await p.route(destination, async (r) => {
            requests++;
            await r.fulfill({
              status: 200,
              contentType: "text/html; charset=utf-8",
              body:
                '<!doctype html><html lang="zh"><head><meta charset="utf-8"></head><body><h1 data-testid="help-destination">本地帮助导航目标</h1></body></html>',
            });
          });
          try {
            const frame = demo(p, "href 链接行"),
              link = frame.getByRole("link", { name: "帮助", exact: true });
            await attr(link, "href", destination);
            await attr(link, "data-clickable", "true");
            expect(await link.evaluate((e) => e.tagName)).toBe("A");
            expect(await link.locator("[data-dreamer-cell-arrow]").innerText())
              .toBe("›");
            await activate(link, mode);
            await p.waitForURL(destination);
            expect(requests).toBe(1);
            expect(p.url()).toBe(destination);
            expect(await p.getByTestId("help-destination").innerText()).toBe(
              "本地帮助导航目标",
            );
          } finally {
            await p.unroute(destination);
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
