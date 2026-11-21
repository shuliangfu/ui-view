/** WRITTEN-UNRUN. Real local-route navigation / locally intercepted popup, and desktop FAB state/placement contracts. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example, open } from "./driver.ts";
async function activate(el: Locator, mode: string) {
  if (mode === "mouse") await el.click({ delay: 180 });
  else await el.press(mode);
}
async function localTarget(p: Page, link: Locator, mode: string) {
  await attr(link, "href", "/desktop");
  await attr(link, "target", null);
  await attr(link, "rel", null);
  expect(await link.evaluate((e) => e.tagName)).toBe("A");
  await activate(link, mode);
  await p.waitForURL((u) => u.pathname === "/desktop");
  await eventually(async () =>
    await p.locator("main").getByRole("heading", {
      name: "桌面版组件",
      exact: true,
    }).count() === 1
  );
  expect(new URL(p.url()).pathname).toBe("/desktop");
  expect(
    await p.locator("main").getByRole("heading", {
      name: "Link 链接",
      exact: true,
    }).count(),
  ).toBe(0);
}
async function shape(b: Locator, square = false) {
  expect(
    await b.evaluate((e) => {
      const c = getComputedStyle(e);
      return [c.width, c.height, c.padding];
    }),
  ).toEqual(["48px", "48px", "0px"]);
  if (square) {
    expect(await b.evaluate((e) => getComputedStyle(e).borderRadius)).toBe(
      "12px",
    );
  } else {expect(
      await b.evaluate((e) =>
        parseFloat(getComputedStyle(e).borderRadius) >= 24
      ),
    ).toBe(true);}
}
async function placement(b: Locator, corner: string, offset: number) {
  const measured = await b.locator("..").evaluate((e, corner) => {
    const host = (e as HTMLElement).offsetParent as HTMLElement,
      box = e.getBoundingClientRect(),
      h = host.getBoundingClientRect();
    const c = getComputedStyle(host);
    const left = h.left + parseFloat(c.borderLeftWidth),
      top = h.top + parseFloat(c.borderTopWidth),
      right = h.right - parseFloat(c.borderRightWidth),
      bottom = h.bottom - parseFloat(c.borderBottomWidth);
    return {
      position: getComputedStyle(e).position,
      dx: corner.endsWith("right") ? right - box.right : box.left - left,
      dy: corner.startsWith("bottom") ? bottom - box.bottom : box.top - top,
    };
  }, corner);
  expect(measured.position).toBe("absolute");
  expect(Math.abs(measured.dx - offset) < .1).toBe(true);
  expect(Math.abs(measured.dy - offset) < .1).toBe(true);
}
async function closed(s: Locator, main: Locator, names: string[]) {
  await attr(main, "aria-expanded", "false");
  for (const name of names) {
    expect(await s.getByRole("button", { name, exact: true }).count()).toBe(0);
  }
}
describe("Link FAB written", () => {
  for (const width of [390, 1280]) {
    for (
      const [label, names] of [
        ["默认", ["返回桌面"]],
        ["自定义 class", ["绿色加粗链接"]],
        ["underline（下划线）", ["默认（无下划线）", "underline"]],
        ["链接按钮 button + variant + size", ["主色 md", "幽灵 sm"]],
      ] as const
    ) {
      for (const name of names) {
        for (const mode of ["mouse", "Enter"]) {
          it(
            `Link ${label} ${name} ${mode} @${width}：精确属性样式及真实目标内容`,
            async (t) => {
              const p = await open(t, "/desktop/basic/link");
              await p.setViewportSize({ width, height: 900 });
              const s = example(p, label),
                link = s.getByRole("link", { name, exact: true });
              expect(await link.count()).toBe(1);
              await p.mouse.move(0, 0);
              expect(
                await link.evaluate((e) =>
                  getComputedStyle(e).textDecorationLine
                ),
              ).toBe("none");
              await link.hover();
              expect(
                await link.evaluate((e) =>
                  getComputedStyle(e).textDecorationLine
                ),
              ).toBe(name === "underline" ? "underline" : "none");
              if (label === "自定义 class") {
                expect(
                  await link.evaluate((e) => getComputedStyle(e).fontWeight),
                )
                  .toBe("600");
                expect(
                  await link.evaluate((e) =>
                    e.classList.contains("text-green-600")
                  ),
                ).toBe(true);
              }
              if (label === "链接按钮 button + variant + size") {
                await attr(
                  link,
                  "data-variant",
                  name === "主色 md" ? "primary" : "ghost",
                );
                await attr(link, "data-size", name === "主色 md" ? "md" : "sm");
                expect(
                  await link.evaluate((e) => {
                    const c = getComputedStyle(e);
                    return [c.display, c.paddingLeft, c.paddingTop, c.fontSize];
                  }),
                ).toEqual(
                  name === "主色 md"
                    ? ["inline-flex", "16px", "8px", "14px"]
                    : ["inline-flex", "12px", "6px", "14px"],
                );
              }
              await localTarget(p, link, mode);
            },
            DOCS_BROWSER_CONFIG,
          );
        }
      }
    }
    for (const mode of ["mouse", "Enter"]) {
      it(
        `Link 新窗口 target / rel ${mode} @${width}：隔离popup及无Referer`,
        async (t) => {
          const p = await open(t, "/desktop/basic/link");
          await p.setViewportSize({ width, height: 900 });
          const initial = p.url(),
            link = example(p, "新窗口 target / rel").getByRole("link", {
              name: "JSR 新窗口打开",
              exact: true,
            });
          await attr(link, "href", "https://jsr.io");
          await attr(link, "target", "_blank");
          await attr(link, "rel", "noopener noreferrer");
          await attr(link, "title", "打开 JSR 官网");
          let requests = 0;
          let referer: string | undefined;
          const destination = /^https:\/\/jsr\.io\/?$/;
          await p.context().route(destination, async (r) => {
            requests++;
            referer = r.request().headers()["referer"];
            await r.fulfill({
              status: 200,
              contentType: "text/html; charset=utf-8",
              body:
                '<!doctype html><html><head><meta charset="utf-8"></head><body><h1 id="local-jsr-target">本地外链目标</h1></body></html>',
            });
          });
          try {
            const [popup] = await Promise.all([
              p.waitForEvent("popup"),
              activate(link, mode),
            ]);
            try {
              await popup.waitForLoadState("domcontentloaded");
              expect(new URL(popup.url()).href).toBe("https://jsr.io/");
              expect(await popup.locator("#local-jsr-target").innerText()).toBe(
                "本地外链目标",
              );
              expect(await popup.evaluate(() => globalThis.opener === null))
                .toBe(
                  true,
                );
              expect(requests).toBe(1);
              expect(referer).toBe(undefined);
              expect(p.url()).toBe(initial);
            } finally {
              await popup.close();
            }
          } finally {
            await p.context().unroute(destination);
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    for (const controlled of [false, true]) {
      const label = controlled ? "受控 open" : "圆形 + 徽标 + 子项",
        name = controlled ? "受控" : "新建",
        items = controlled ? ["A", "B"] : ["文件", "图片"];
      it(
        `桌面FloatButton ${label} @${width}：开关/逐子项关闭及实例隔离`,
        async (t) => {
          const p = await open(t, "/desktop/basic/float-button");
          await p.setViewportSize({ width, height: 900 });
          const s = example(p, label),
            main = s.getByRole("button", { name, exact: true });
          await shape(main);
          await placement(main, "bottom-right", 24);
          await closed(s, main, items);
          const state = s.locator("p").filter({ hasText: /^展开：/ });
          if (controlled) expect(await state.innerText()).toBe("展开：false");
          else {
            const badge = main.getByRole("status", { name: "3", exact: true });
            expect(await badge.innerText()).toBe("3");
            expect(
              await badge.evaluate((e) => getComputedStyle(e).pointerEvents),
            )
              .toBe("none");
          }
          for (const mode of ["mouse", "Enter", "Space"]) {
            await activate(main, mode);
            await attr(main, "aria-expanded", "true");
            if (controlled) expect(await state.innerText()).toBe("展开：true");
            for (const item of items) {
              expect(
                await s.getByRole("button", { name: item, exact: true })
                  .isVisible(),
              ).toBe(true);
            }
            await activate(main, mode);
            await closed(s, main, items);
            if (controlled) expect(await state.innerText()).toBe("展开：false");
            for (const item of items) {
              await activate(main, mode);
              await attr(main, "aria-expanded", "true");
              const child = s.getByRole("button", { name: item, exact: true });
              expect(
                await child.evaluate(
                  (
                    e,
                  ) => [getComputedStyle(e).width, getComputedStyle(e).height],
                ),
              ).toEqual(["40px", "40px"]);
              await activate(child, mode);
              await closed(s, main, items);
              if (controlled) {
                expect(await state.innerText()).toBe("展开：false");
              }
            }
          }
          const other = example(
            p,
            controlled ? "圆形 + 徽标 + 子项" : "受控 open",
          ).getByRole("button", {
            name: controlled ? "新建" : "受控",
            exact: true,
          });
          await attr(other, "aria-expanded", "false");
          expect(new URL(p.url()).pathname).toBe("/desktop/basic/float-button");
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      `桌面FloatButton 方形 shape=square @${width}：实际尺寸与无菜单原生激活`,
      async (t) => {
        const p = await open(t, "/desktop/basic/float-button");
        await p.setViewportSize({ width, height: 900 });
        const s = example(p, "方形 shape=square"),
          main = s.getByRole("button", { name: "操作", exact: true });
        await shape(main, true);
        await placement(main, "bottom-right", 24);
        expect(await main.innerText()).toBe("＋");
        for (const mode of ["mouse", "Enter", "Space"]) {
          await activate(main, mode);
          await attr(main, "aria-expanded", null);
          expect(await main.locator("..").getByRole("button").count()).toBe(1);
          expect(await main.innerText()).toBe("＋");
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `桌面FloatButton placement 四角 @${width}：四实例准确12px边距与互不干扰`,
      async (t) => {
        const p = await open(t, "/desktop/basic/float-button");
        await p.setViewportSize({ width, height: 900 });
        const s = example(p, "placement 四角");
        for (
          const corner of [
            "bottom-right",
            "bottom-left",
            "top-right",
            "top-left",
          ]
        ) {
          const b = s.getByRole("button", { name: corner, exact: true });
          await shape(b);
          await placement(b, corner, 12);
          expect(await b.innerText()).toBe("·");
          for (const mode of ["mouse", "Enter", "Space"]) {
            await activate(b, mode);
            await attr(b, "aria-expanded", null);
            await placement(b, corner, 12);
          }
        }
        expect(
          await s.locator(
            'button[aria-label="bottom-right"],button[aria-label="bottom-left"],button[aria-label="top-right"],button[aria-label="top-left"]',
          ).count(),
        ).toBe(4);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
