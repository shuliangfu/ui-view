/** WRITTEN-UNRUN. Noninteractive demos: real geometry, semantics, image load/failure and reduced-motion contracts. */
import { describe, expect, it, type TestContext } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example, open } from "./driver.ts";
async function box(el: Locator, w: number, h: number) {
  const b = await el.boundingBox();
  if (!b) throw Error("Required rendered box missing");
  expect(Math.abs(b.width - w) < 0.6).toBe(true);
  expect(Math.abs(b.height - h) < 0.6).toBe(true);
}
async function circle(el: Locator) {
  expect(
    await el.evaluate((e) => {
      const c = getComputedStyle(e);
      return parseFloat(c.borderTopLeftRadius) >=
        Math.min(
            e.getBoundingClientRect().width,
            e.getBoundingClientRect().height,
          ) / 2;
    }),
  ).toBe(true);
}
const avatarSrc = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
async function avatarPage(
  t: TestContext | undefined,
  width: number,
  fail = false,
) {
  const p = t?.browser?.page as Page | undefined;
  if (!p) throw Error("Real browser page required");
  await p.route(avatarSrc, async (r) => {
    if (fail) await r.abort("failed");
    else {await r.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body:
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16"><rect width="32" height="16" fill="#123456"/></svg>',
      });}
  });
  await open(t, "/desktop/basic/avatar");
  await p.setViewportSize({ width, height: 900 });
  return p;
}
async function motion(p: Page, nodes: Locator, name: string) {
  await p.emulateMedia({ reducedMotion: "no-preference" });
  expect(
    await nodes.evaluateAll((es) =>
      es.every((e) => getComputedStyle(e).animationName !== "none")
    ),
  ).toBe(true);
  expect(
    await nodes.evaluateAll(
      (es, n) => es.every((e) => getComputedStyle(e).animationName === n),
      name,
    ),
  ).toBe(true);
  await p.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await nodes.evaluateAll((es) =>
      es.every((e) => getComputedStyle(e).animationName === "none")
    ),
  ).toBe(true);
}
describe("Basic visual contracts written", () => {
  for (const width of [390, 1280]) {
    it(
      `Avatar size 尺寸 @${width}：六档实际几何/文字/圆形`,
      async (t) => {
        const p = await avatarPage(t, width),
          s = example(p, "size 尺寸"),
          avatars = s.locator('span[role="img"]');
        expect(await avatars.allTextContents()).toEqual([
          "xs",
          "sm",
          "md",
          "lg",
          "xl",
          "2xl",
        ]);
        for (const [i, n] of [32, 40, 48, 64, 80, 96].entries()) {
          await box(avatars.nth(i), n, n);
          await circle(avatars.nth(i));
          await attr(avatars.nth(i), "aria-hidden", "true");
        }
        expect(
          await avatars.evaluateAll((es) =>
            es.map((e) => getComputedStyle(e).fontSize)
          ),
        ).toEqual(["12px", "14px", "16px", "18px", "20px", "24px"]);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Avatar 首字（children） @${width}：逐字真实头像而非代码文本`,
      async (t) => {
        const p = await avatarPage(t, width),
          a = example(p, "首字（children）").locator('span[role="img"]');
        expect(await a.allTextContents()).toEqual(["张", "李", "王"]);
        expect(await a.count()).toBe(3);
        for (let i = 0; i < 3; i++) {
          await box(a.nth(i), 48, 48);
          await circle(a.nth(i));
        }
        expect(await example(p, "首字（children）").locator("img").count())
          .toBe(
            0,
          );
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const fail of [false, true]) {
      it(
        `Avatar 图片 src 与 alt @${width}：${
          fail ? "失败替代文本" : "成功解码裁剪"
        }`,
        async (t) => {
          const p = await avatarPage(t, width, fail),
            s = example(p, "图片 src 与 alt"),
            img = s.getByRole("img", { name: "Avatar", exact: true });
          expect(await img.count()).toBe(1);
          await attr(img, "src", avatarSrc);
          await attr(img, "alt", "Avatar");
          await box(img, 64, 64);
          await circle(img);
          await eventually(async () =>
            await img.evaluate((e) => (e as HTMLImageElement).complete)
          );
          expect(
            await img.evaluate((e) => {
              const i = e as HTMLImageElement;
              return [i.naturalWidth, i.naturalHeight];
            }),
          ).toEqual(fail ? [0, 0] : [32, 16]);
          expect(await img.evaluate((e) => getComputedStyle(e).objectFit)).toBe(
            "cover",
          );
          expect(await s.locator('span[role="img"]').count()).toBe(0);
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      `Avatar class 自定义样式 @${width}：两种ring及offset实际生效`,
      async (t) => {
        const p = await avatarPage(t, width),
          a = example(p, "class 自定义样式").locator('span[role="img"]');
        expect(await a.allTextContents()).toEqual(["A", "B"]);
        for (let i = 0; i < 2; i++) {
          await box(a.nth(i), 48, 48);
          expect(await a.nth(i).evaluate((e) => getComputedStyle(e).boxShadow))
            .not.toBe("none");
        }
        expect(
          await a.nth(0).evaluate((e) => e.classList.contains("ring-blue-500")),
        ).toBe(true);
        expect(
          await a.nth(1).evaluate((e) =>
            e.classList.contains("ring-amber-400")
          ),
        ).toBe(true);
        expect(
          await a.nth(0).evaluate((e) =>
            getComputedStyle(e).getPropertyValue("--tw-ring-offset-width")
              .trim()
          ),
        ).toBe("0px");
        expect(
          await a.nth(1).evaluate((e) =>
            getComputedStyle(e).getPropertyValue("--tw-ring-offset-width")
              .trim()
          ),
        ).toBe("2px");
        expect(await a.nth(0).evaluate((e) => getComputedStyle(e).boxShadow))
          .not
          .toBe(await a.nth(1).evaluate((e) => getComputedStyle(e).boxShadow));
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Avatar 形状与头像组 @${width}：方圆区别/真实重叠与顺序`,
      async (t) => {
        const p = await avatarPage(t, width),
          a = example(p, "形状与头像组").locator('span[role="img"]');
        expect(await a.allTextContents()).toEqual(["方", "A", "B", "C"]);
        await box(a.nth(0), 48, 48);
        expect(await a.nth(0).evaluate((e) => getComputedStyle(e).borderRadius))
          .toBe("6px");
        const rectangles = [];
        for (let i = 1; i < 4; i++) {
          await box(a.nth(i), 48, 48);
          await circle(a.nth(i));
          rectangles.push(await a.nth(i).boundingBox());
        }
        for (let i = 1; i < 3; i++) {
          expect(Math.round(rectangles[i]!.x - rectangles[i - 1]!.x)).toBe(40);
          expect(rectangles[i]!.y).toBe(rectangles[0]!.y);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Badge variant 变体 @${width}：七种状态及零值保留`,
      async (t) => {
        const p = await open(t, "/desktop/basic/badge");
        await p.setViewportSize({ width, height: 900 });
        const badges = example(p, "variant 变体").getByRole("status");
        const labels = ["1", "2", "3", "5", "9", "99", "0"],
          classes = [
            "bg-gray-200",
            "bg-blue-600",
            "bg-gray-500",
            "bg-green-600",
            "bg-amber-500",
            "bg-red-600",
            "bg-transparent",
          ];
        expect(await badges.allTextContents()).toEqual(labels);
        for (let i = 0; i < 7; i++) {
          await attr(badges.nth(i), "aria-label", labels[i]);
          await circle(badges.nth(i));
          expect(
            await badges.nth(i).evaluate(
              (e, c) => e.classList.contains(c),
              classes[i],
            ),
          ).toBe(true);
        }
        expect(
          await badges.nth(6).evaluate((e) =>
            getComputedStyle(e).backgroundColor
          ),
        ).toBe("rgba(0, 0, 0, 0)");
        expect(
          await badges.nth(6).evaluate((e) =>
            getComputedStyle(e).borderTopWidth
          ),
        ).toBe("1px");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(`Badge count 与 max @${width}：两个上限精确格式`, async (t) => {
      const p = await open(t, "/desktop/basic/badge");
      await p.setViewportSize({ width, height: 900 });
      const b = example(p, "count 与 max").getByRole("status");
      expect(await b.allTextContents()).toEqual(["9+", "99+"]);
      await attr(b.nth(0), "aria-label", "9+");
      await attr(b.nth(1), "aria-label", "99+");
    }, DOCS_BROWSER_CONFIG);
    it(`Badge dot 圆点 @${width}：无文字的8像素圆点`, async (t) => {
      const p = await open(t, "/desktop/basic/badge");
      await p.setViewportSize({ width, height: 900 });
      const b = example(p, "dot 圆点").getByRole("status");
      expect(await b.allTextContents()).toEqual(["", ""]);
      for (let i = 0; i < 2; i++) {
        await box(b.nth(i), 8, 8);
        await circle(b.nth(i));
        await attr(b.nth(i), "aria-label", null);
      }
      expect(
        await b.nth(0).evaluate((e) => getComputedStyle(e).backgroundColor),
      )
        .not.toBe(
          await b.nth(1).evaluate((e) => getComputedStyle(e).backgroundColor),
        );
    }, DOCS_BROWSER_CONFIG);
    it(
      `Badge size 尺寸 @${width}：四档高度最小宽度字号padding`,
      async (t) => {
        const p = await open(t, "/desktop/basic/badge");
        await p.setViewportSize({ width, height: 900 });
        const b = example(p, "size 尺寸").getByRole("status");
        expect(await b.allTextContents()).toEqual(["1", "2", "3", "4"]);
        expect(
          await b.evaluateAll((es) =>
            es.map((e) => {
              const c = getComputedStyle(e);
              return [
                c.height,
                c.minWidth,
                c.fontSize,
                c.paddingLeft,
                c.paddingRight,
              ];
            })
          ),
        ).toEqual([
          ["16px", "16px", "10px", "4px", "4px"],
          ["20px", "20px", "12px", "6px", "6px"],
          ["24px", "24px", "12px", "8px", "8px"],
          ["32px", "32px", "14px", "10px", "10px"],
        ]);
        for (let i = 0; i < 4; i++) {
          const r = await b.nth(i).boundingBox();
          expect(r!.height).toBe([16, 20, 24, 32][i]);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Badge children 自定义文案 @${width}：非数字状态文本`,
      async (t) => {
        const p = await open(t, "/desktop/basic/badge");
        await p.setViewportSize({ width, height: 900 });
        const b = example(p, "children 自定义文案").getByRole("status");
        expect(await b.allTextContents()).toEqual(["New", "Hot", "Pro"]);
        for (const [i, name] of ["New", "Hot", "Pro"].entries()) {
          await attr(b.nth(i), "aria-label", name);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Skeleton size 尺寸 @${width}：真正可见高度及减弱动画`,
      async (t) => {
        const p = await open(t, "/desktop/basic/skeleton");
        await p.setViewportSize({ width, height: 900 });
        const nodes = example(p, "size 尺寸").getByRole("status", {
          name: "Loading",
          exact: true,
        });
        expect(await nodes.count()).toBe(4);
        for (const [i, h] of [16, 20, 24, 32].entries()) {
          const b = await nodes.nth(i).boundingBox();
          expect(b!.height).toBe(h);
          expect(b!.width > 0).toBe(true);
        }
        await motion(p, nodes, "pulse");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Skeleton 自定义宽高（class） @${width}：实际宽度比例和高度`,
      async (t) => {
        const p = await open(t, "/desktop/basic/skeleton");
        await p.setViewportSize({ width, height: 900 });
        const n = example(p, "自定义宽高（class）").getByRole("status", {
          name: "Loading",
          exact: true,
        });
        expect(await n.count()).toBe(3);
        const parent = await n.first().locator("..").boundingBox();
        if (!parent) throw Error("Skeleton container missing");
        for (const [i, ratio] of [1, .75, .5].entries()) {
          await box(n.nth(i), parent.width * ratio, [16, 16, 32][i]);
        }
        await motion(p, n, "pulse");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Skeleton 模拟整页排版 @${width}：完整十二占位几何与网格`,
      async (t) => {
        const p = await open(t, "/desktop/basic/skeleton");
        await p.setViewportSize({ width, height: 900 });
        const s = example(p, "模拟整页排版"),
          nodes = s.getByRole("status", { name: "Loading", exact: true });
        expect(await nodes.count()).toBe(12);
        const header = s.locator("header"), top = header.getByRole("status");
        expect(await top.count()).toBe(6);
        for (const [i, w] of [96, 64, 64, 80, 32, 32].entries()) {
          await box(
            top.nth(i),
            w,
            32,
          );
        }
        expect(await header.evaluate((e) => getComputedStyle(e).height)).toBe(
          "56px",
        );
        const grid = s.locator(".grid"), cards = grid.getByRole("status");
        expect(await cards.count()).toBe(3);
        const widths = [];
        for (let i = 0; i < 3; i++) {
          const b = await cards.nth(i).boundingBox();
          expect(b!.height).toBe(96);
          expect(b!.width > 0).toBe(true);
          widths.push(b!.width);
        }
        expect(Math.abs(widths[0] - widths[1]) < .1).toBe(true);
        expect(Math.abs(widths[1] - widths[2]) < .1).toBe(true);
        await motion(p, nodes, "pulse");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Skeleton 占位形态 variant @${width}：标题段落头像按钮独立几何`,
      async (t) => {
        const p = await open(t, "/desktop/basic/skeleton");
        await p.setViewportSize({ width, height: 900 });
        const n = example(p, "占位形态 variant").getByRole("status", {
          name: "Loading",
          exact: true,
        });
        expect(await n.count()).toBe(4);
        const parent = await n.first().locator("..").boundingBox();
        if (!parent) throw Error("Variant container missing");
        await box(n.nth(0), parent.width / 2, 24);
        await box(n.nth(1), parent.width, 64);
        const lines = n.nth(1).locator(":scope > span");
        expect(await lines.count()).toBe(3);
        for (const [i, r] of [1, 1, 2 / 3].entries()) {
          await box(lines.nth(i), parent.width * r, 16);
        }
        await box(n.nth(2), 40, 40);
        await circle(n.nth(2));
        await box(n.nth(3), 80, 32);
        await motion(p, n.nth(0), "pulse");
        await motion(p, lines, "pulse");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Spinner size 尺寸 @${width}：四档真实圆环/透明顶边/动画`,
      async (t) => {
        const p = await open(t, "/desktop/basic/spinner");
        await p.setViewportSize({ width, height: 900 });
        const n = example(p, "size 尺寸").getByRole("status", {
          name: "Loading",
          exact: true,
        });
        await p.emulateMedia({ reducedMotion: "reduce" });
        expect(await n.count()).toBe(4);
        for (const [i, v] of [16, 20, 32, 40].entries()) {
          await box(n.nth(i), v, v);
          await circle(n.nth(i));
        }
        expect(
          await n.evaluateAll((es) =>
            es.map((e) => {
              const c = getComputedStyle(e);
              return [c.borderTopWidth, c.borderTopColor];
            })
          ),
        ).toEqual([["2px", "rgba(0, 0, 0, 0)"], ["2px", "rgba(0, 0, 0, 0)"], [
          "2px",
          "rgba(0, 0, 0, 0)",
        ], ["3px", "rgba(0, 0, 0, 0)"]]);
        await motion(p, n, "spin");
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Spinner 自定义 class（颜色） @${width}：绿红颜色/32与40尺寸`,
      async (t) => {
        const p = await open(t, "/desktop/basic/spinner");
        await p.setViewportSize({ width, height: 900 });
        const n = example(p, "自定义 class（颜色）").getByRole("status", {
          name: "Loading",
          exact: true,
        });
        await p.emulateMedia({ reducedMotion: "reduce" });
        expect(await n.count()).toBe(2);
        await box(n.nth(0), 32, 32);
        await box(n.nth(1), 40, 40);
        expect(
          await n.nth(0).evaluate((e) =>
            e.classList.contains("text-green-600")
          ),
        ).toBe(true);
        expect(
          await n.nth(1).evaluate((e) => e.classList.contains("text-red-500")),
        ).toBe(true);
        const colors = await n.evaluateAll((es) =>
          es.map((e) => {
            const c = getComputedStyle(e);
            return [c.color, c.borderRightColor];
          })
        );
        expect(colors[0][0]).toBe(colors[0][1]);
        expect(colors[1][0]).toBe(colors[1][1]);
        expect(colors[0][0]).not.toBe(colors[1][0]);
        await motion(p, n, "spin");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
