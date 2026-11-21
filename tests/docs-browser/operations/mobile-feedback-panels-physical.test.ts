import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open, visible } from "./driver.ts";
const overflow = (p: Page) => p.evaluate(() => document.body.style.overflow);
async function sameBounds(a: Locator, b: Locator) {
  const x = await a.boundingBox(), y = await b.boundingBox();
  if (!x || !y) throw new Error("Missing rectangle");
  for (const k of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(x[k] - y[k])).toBeLessThanOrEqual(1);
  }
}
describe("Mobile feedback panels physical", () => {
  it(
    "物理操作 移动ShareSheet：四个分享演示项逐个点击、图标宫格、取消/机内遮罩、键盘及不锁整页",
    async (t) => {
      for (const width of [1280, 390]) {
        const p = await open(t, "/mobile/feedback/share-sheet");
        await p.setViewportSize({ width, height: 900 });
        const before = await overflow(p),
          scope = demo(p, "示例"),
          trigger = scope.getByRole("button", {
            name: "打开分享面板",
            exact: true,
          }),
          dialog = p.getByRole("dialog", { name: "分享", exact: true }),
          host = scope.locator("[data-dreamer-mobile-portal-host]");
        for (const action of [0, 1, 2, 3, "cancel", "mask", "keyboard"]) {
          if (action === "keyboard") await trigger.press("Enter");
          else await trigger.click({ delay: 180 });
          await visible(dialog);
          await attr(dialog, "aria-modal", "true");
          await sameBounds(dialog, host);
          expect(await overflow(p)).toBe(before);
          await visible(dialog.getByText("分享到", { exact: true }));
          const options = dialog.locator(".grid > button");
          expect(await options.allTextContents()).toEqual([
            "微微信",
            "QQQ",
            "链链接",
            "…更多",
          ]);
          const cells = await options.evaluateAll((nodes) =>
            nodes.map((n) => {
              const b = n.getBoundingClientRect();
              return { x: b.x, y: b.y, width: b.width };
            })
          );
          expect(cells.length).toBe(4);
          expect(new Set(cells.map((c) => c.y)).size).toBe(1);
          for (let i = 1; i < 4; i++) {
            expect(cells[i].x > cells[i - 1].x).toBe(true);
          }
          await dialog.getByText("分享到", { exact: true }).click();
          await visible(dialog);
          if (typeof action === "number") {
            await options.nth(action).click({ delay: 180 });
          } else if (action === "mask") {
            await dialog.getByRole("button", { name: "关闭", exact: true })
              .click(
                { position: { x: 8, y: 8 } },
              );
          } else if (action === "keyboard") {
            await dialog.getByRole("button", { name: "取消", exact: true })
              .press(
                "Space",
              );
          } else {await dialog.getByRole("button", {
              name: "取消",
              exact: true,
            })
              .click();}
          await visible(dialog, false);
          expect(await overflow(p)).toBe(before);
          expect(new URL(p.url()).pathname).toBe(
            "/mobile/feedback/share-sheet",
          );
        }
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 移动FloatingPanel：原生拖拽跨timer到全部三个锚点、最近吸附、机内遮罩关闭及重开",
    async (t) => {
      for (const width of [1280, 390]) {
        const p = await open(t, "/mobile/feedback/floating-panel");
        await p.setViewportSize({ width, height: 900 });
        const before = await overflow(p),
          scope = demo(p, "示例"),
          trigger = scope.getByRole("button", {
            name: "打开浮动面板",
            exact: true,
          }),
          dialog = p.getByRole("dialog").filter({
            has: p.getByText("拖拽顶栏切换高度锚点；点遮罩关闭。", {
              exact: true,
            }),
          }),
          host = scope.locator("[data-dreamer-mobile-portal-host]");
        await trigger.click({ delay: 180 });
        await visible(dialog);
        await sameBounds(dialog, host);
        expect(await overflow(p)).toBe(before);
        const panel = dialog.locator(":scope > div"),
          handle = panel.locator(":scope > div").first();
        const height = async (n: number) => {
          await eventually(async () => {
            const b = await panel.boundingBox();
            return !!b && Math.abs(b.height - n) < 1;
          });
          expect(
            await panel.evaluate((el) =>
              Number.parseFloat((el as HTMLElement).style.height)
            ),
          ).toBe(n);
        };
        await height(220);
        for (
          const [delta, target] of [[-80, 300], [80, 220], [100, 120], [
            -35,
            120,
          ]] as const
        ) {
          const b = await handle.boundingBox();
          if (!b) throw new Error("Missing drag handle");
          const x = b.x + b.width / 2, y = b.y + b.height / 2;
          await p.mouse.move(x, y);
          await p.mouse.down();
          await p.waitForTimeout(180);
          await p.mouse.move(x, y + delta, { steps: 8 });
          console.log(
            "floating actual drag",
            width,
            delta,
            await panel.boundingBox(),
            await panel.getAttribute("style"),
          );
          await p.mouse.up();
          await height(target);
          const hb = await host.boundingBox(), pb = await panel.boundingBox();
          if (!hb || !pb) throw new Error("Missing portal bounds");
          expect(Math.abs(pb.y + pb.height - hb.y - hb.height))
            .toBeLessThanOrEqual(1);
          await visible(dialog);
        }
        await panel.getByText("拖拽顶栏切换高度锚点；点遮罩关闭。", {
          exact: true,
        }).click();
        await visible(dialog);
        await dialog.getByRole("button", { name: "关闭", exact: true }).click({
          position: { x: 8, y: 8 },
        });
        await visible(dialog, false);
        expect(await overflow(p)).toBe(before);
        await trigger.press("Enter");
        await visible(dialog);
        await height(120);
        await dialog.getByRole("button", { name: "关闭", exact: true }).press(
          "Space",
        );
        await visible(dialog, false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  for (const local of [false, true]) {
    it(
      "物理操作 移动Overlay" + (local ? "局部" : "Portal") +
        "：精确遮罩范围/层级、原生点击回写、关闭后点击穿透及滚动锁还原",
      async (t) => {
        for (const width of [1280, 390]) {
          const p = await open(t, "/mobile/feedback/overlay");
          await p.setViewportSize({ width, height: 900 });
          const before = await overflow(p),
            scope = demo(p, local ? "局部 portal=false" : "默认 Portal"),
            trigger = scope.getByRole("button", {
              name: local ? "框内遮罩" : "打开遮罩",
              exact: true,
            }),
            mask = local
              ? scope.locator("[data-dreamer-overlay]")
              : p.locator("body > [data-dreamer-overlay]");
          await attr(mask, "aria-hidden", "true");
          for (let i = 0; i < 3; i++) {
            if (i === 1) await trigger.press("Enter");
            else await trigger.click({ delay: 180 });
            await attr(mask, "aria-hidden", null);
            await eventually(async () =>
              await mask.evaluate((el) => getComputedStyle(el).opacity) === "1"
            );
            expect(await mask.evaluate((el) => getComputedStyle(el).zIndex))
              .toBe(
                local ? "10" : "400",
              );
            expect(await mask.evaluate((el) => getComputedStyle(el).position))
              .toBe(local ? "absolute" : "fixed");
            expect(await overflow(p)).toBe(local ? before : "hidden");
            if (local) {
              const expected = await mask.locator("..").evaluate((el) => {
                const e = el as HTMLElement, b = e.getBoundingClientRect();
                return {
                  x: b.x + e.clientLeft,
                  y: b.y + e.clientTop,
                  width: e.clientWidth,
                  height: e.clientHeight,
                };
              });
              expect(await mask.boundingBox()).toEqual(expected);
              await p.getByRole("heading", { name: "Overlay", exact: true })
                .click();
              await attr(mask, "aria-hidden", null);
              expect(
                await p.locator(
                  'body > [data-dreamer-overlay]:not([aria-hidden="true"])',
                ).count(),
              ).toBe(0);
            } else {
              const b = await mask.boundingBox();
              expect(b).toEqual({ x: 0, y: 0, width, height: 900 });
            }
            await mask.click({ position: { x: 12, y: 12 }, delay: 180 });
            await attr(mask, "aria-hidden", "true");
            await eventually(async () =>
              await mask.evaluate((el) => getComputedStyle(el).opacity) === "0"
            );
            expect(
              await mask.evaluate((el) => getComputedStyle(el).pointerEvents),
            ).toBe("none");
            expect(await overflow(p)).toBe(before);
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "物理操作 移动NoticeBar：非受控关闭、受控反复显示/取消及独立色调DOM",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar"),
        closable = demo(p, "可关闭"),
        tones = demo(p, "色调"),
        controlled = demo(p, "滚动 + 受控");
      expect(await closable.getByRole("status").textContent()).toBe(
        "系统将于今晚维护×",
      );
      expect(
        await closable.getByRole("status").evaluate((el) =>
          el.classList.contains("bg-amber-50")
        ),
      ).toBe(true);
      await closable.getByRole("button", { name: "关闭", exact: true }).click({
        delay: 180,
      });
      expect(await closable.getByRole("status").count()).toBe(0);
      expect(await tones.getByRole("status").allTextContents()).toEqual([
        "信息",
        "成功",
        "危险",
      ]);
      const colors = [];
      for (
        const [i, cls] of ["bg-sky-50", "bg-emerald-50", "bg-red-50"].entries()
      ) {
        const el = tones.getByRole("status").nth(i);
        expect(await el.evaluate((e, c) => e.classList.contains(c), cls)).toBe(
          true,
        );
        expect(await el.getByRole("button").count()).toBe(0);
        colors.push(await el.evaluate((e) => getComputedStyle(e).color));
      }
      expect(new Set(colors).size).toBe(3);
      const item = controlled.getByRole("status").filter({
          hasText: "受控可见条",
        }),
        restore = controlled.getByRole("button", {
          name: "重新显示",
          exact: true,
        });
      for (let i = 0; i < 3; i++) {
        expect(await item.textContent()).toBe("受控可见条×");
        await item.getByRole("button", { name: "关闭", exact: true }).click({
          delay: 180,
        });
        await visible(item, false);
        await visible(restore);
        expect(await tones.getByRole("status").allTextContents()).toEqual([
          "信息",
          "成功",
          "危险",
        ]);
        if (i === 1) await restore.press("Space");
        else await restore.click();
        await visible(item);
        await visible(restore, false);
      }
      expect(await closable.getByRole("status").count()).toBe(0);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "DOM与实际动画 移动NoticeBar滚动：精确完整文案、12秒线性无限横移与reduced-motion",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar");
      await p.setViewportSize({ width: 390, height: 900 });
      await p.emulateMedia({ reducedMotion: "no-preference" });
      const status = demo(p, "滚动 + 受控").getByRole("status").filter({
          hasText: "欢迎使用移动组件库",
        }),
        text = status.getByText("欢迎使用移动组件库 —— 长文案可横向滚动展示", {
          exact: true,
        });
      await eventually(async () => {
        const info = await text.evaluate((el) => {
          const raw = getComputedStyle(el).animationDuration;
          const n = parseFloat(raw);
          const sec = raw.trim().endsWith("ms") ? n / 1000 : n;
          return {
            name: getComputedStyle(el).animationName,
            sec,
            dist: el.scrollWidth,
          };
        });
        return info.name === "notice-bar-marquee" &&
          Number.isFinite(info.sec) &&
          info.dist > 0 &&
          Math.abs(info.sec - Math.max(0.2, info.dist / 60)) < 0.08;
      });
      const style = await text.evaluate((el) => {
        const s = getComputedStyle(el),
          parent = getComputedStyle(el.parentElement!);
        const raw = s.animationDuration;
        const n = parseFloat(raw);
        const sec = raw.trim().endsWith("ms") ? n / 1000 : n;
        return {
          name: s.animationName,
          iteration: s.animationIterationCount,
          timing: s.animationTimingFunction,
          whiteSpace: parent.whiteSpace,
          overflow: parent.overflowX,
          sec,
          dist: el.scrollWidth,
        };
      });
      expect(style.name).toBe("notice-bar-marquee");
      expect(style.iteration).toBe("infinite");
      expect(style.timing).toBe("linear");
      expect(style.whiteSpace).toBe("nowrap");
      expect(style.overflow).toBe("hidden");
      expect(Math.abs(style.sec - Math.max(0.2, style.dist / 60))).toBeLessThan(
        0.08,
      );
      const first = await text.evaluate((e) => getComputedStyle(e).transform);
      await eventually(async () =>
        await text.evaluate((e) => getComputedStyle(e).transform) !== first
      );
      await p.emulateMedia({ reducedMotion: "reduce" });
      await eventually(async () =>
        await text.evaluate((e) => getComputedStyle(e).animationName) === "none"
      );
      expect(await text.textContent()).toBe(
        "欢迎使用移动组件库 —— 长文案可横向滚动展示",
      );
      await p.emulateMedia({ reducedMotion: "no-preference" });
    },
    DOCS_BROWSER_CONFIG,
  );

  const NOTICE_ITEMS = [
    "系统将于今晚 23:00 维护，请提前保存数据。",
    "v2.1 已发布，可在设置中查看更新说明。",
    "请及时完成实名认证，以免影响部分功能。",
  ];
  async function waitNotice(
    probe: () => boolean | Promise<boolean>,
    ms = 20000,
  ): Promise<void> {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      if (await probe()) return;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    expect(await probe()).toBe(true);
  }
  it(
    "物理操作 移动NoticeBar多条滚动：一次一条并在停留后切到下一条",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar");
      await p.setViewportSize({ width: 390, height: 900 });
      await p.emulateMedia({ reducedMotion: "no-preference" });
      const b = demo(p, "多条滚动").getByRole("status");
      await b.scrollIntoViewIfNeeded();
      const first = (await b.innerText()).trim();
      expect(first).toContain(NOTICE_ITEMS[0]);
      expect(first.includes(NOTICE_ITEMS[1]) && first.includes(NOTICE_ITEMS[2]))
        .toBe(false);
      await waitNotice(async () => {
        const text = (await b.innerText()).trim();
        return text.includes(NOTICE_ITEMS[1]) &&
          !text.includes(NOTICE_ITEMS[0]);
      }, 50000);
      const next = (await b.innerText()).trim();
      expect(next).toContain(NOTICE_ITEMS[1]);
      expect(next).not.toContain(NOTICE_ITEMS[0]);
    },
    { ...DOCS_BROWSER_CONFIG, timeout: 90_000 },
  );
  it(
    "DOM与实际时长 移动NoticeBar滚动速度：三档与数字按像素每秒计算",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar");
      await p.setViewportSize({ width: 390, height: 900 });
      await p.emulateMedia({ reducedMotion: "no-preference" });
      const root = demo(p, "滚动速度");
      const bars = root.getByRole("status");
      expect(await bars.count()).toBe(4);
      const speeds = [120, 60, 30, 90];
      const secs: number[] = [];
      for (let i = 0; i < speeds.length; i++) {
        const row = bars.nth(i);
        await row.scrollIntoViewIfNeeded();
        const moving = row.locator(".animate-notice-bar-marquee");
        await waitNotice(async () => {
          const info = await moving.evaluate((e) => {
            const raw = getComputedStyle(e).animationDuration;
            const n = parseFloat(raw);
            const sec = raw.trim().endsWith("ms") ? n / 1000 : n;
            return {
              name: getComputedStyle(e).animationName,
              sec,
              dist: e.scrollWidth,
            };
          });
          return info.name === "notice-bar-marquee" &&
            Number.isFinite(info.sec) &&
            info.dist > 0 &&
            Math.abs(info.sec - Math.max(0.2, info.dist / speeds[i])) < 0.08;
        }, 4000);
        const info = await moving.evaluate((e) => {
          const raw = getComputedStyle(e).animationDuration;
          const n = parseFloat(raw);
          const sec = raw.trim().endsWith("ms") ? n / 1000 : n;
          return { sec, dist: e.scrollWidth };
        });
        expect(Math.abs(info.sec - Math.max(0.2, info.dist / speeds[i])))
          .toBeLessThan(0.08);
        secs.push(info.sec);
      }
      expect(secs[0]).toBeLessThan(secs[1]);
      expect(secs[1]).toBeLessThan(secs[2]);
      expect(secs[3]).toBeGreaterThan(secs[0]);
      expect(secs[3]).toBeLessThan(secs[2]);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 移动NoticeBar纵向滚动：从下往上一次一条",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar");
      await p.setViewportSize({ width: 390, height: 900 });
      await p.emulateMedia({ reducedMotion: "no-preference" });
      const b = demo(p, "纵向滚动").getByRole("status");
      await b.scrollIntoViewIfNeeded();
      const first = (await b.innerText()).trim();
      expect(first).toContain(NOTICE_ITEMS[0]);
      expect(first.includes(NOTICE_ITEMS[1]) && first.includes(NOTICE_ITEMS[2]))
        .toBe(false);
      await waitNotice(async () => {
        const text = (await b.innerText()).trim();
        return text.includes(NOTICE_ITEMS[1]) &&
          !text.includes(NOTICE_ITEMS[0]);
      }, 20000);
      expect((await b.innerText()).trim()).toContain(NOTICE_ITEMS[1]);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 移动NoticeBar关闭确认：确认后写入 cookie，刷新不再显示",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar");
      await p.setViewportSize({ width: 390, height: 900 });
      await p.evaluate(() => {
        document.cookie =
          "docs-notice-bar-mobile-close-key=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
      });
      const root = demo(p, "关闭确认");
      const restore = root.getByRole("button", {
        name: "重新显示",
        exact: true,
      });
      if (await root.getByRole("status").count() === 0) {
        await restore.click({ delay: 180 });
      }
      const b = root.getByRole("status");
      await b.waitFor({ state: "visible" });
      expect(await b.innerText()).toContain(
        "系统维护通知：关闭后刷新也不再显示",
      );
      await b.getByRole("button", { name: "关闭", exact: true }).click({
        delay: 180,
      });
      const panel = p.locator("[data-dreamer-popconfirm-panel]:visible");
      await panel.waitFor({ state: "visible" });
      expect(await panel.innerText()).toContain("关闭后将不再提示");
      await panel.getByRole("button", { name: "确定", exact: true }).click({
        delay: 180,
      });
      await waitNotice(async () => await b.count() === 0, 4000);
      const cookie = await p.evaluate(() => document.cookie);
      expect(cookie.includes("docs-notice-bar-mobile-close-key=1")).toBe(true);
      await p.reload({ waitUntil: "load" });
      const root2 = demo(p, "关闭确认");
      const restore2 = root2.getByRole("button", {
        name: "重新显示",
        exact: true,
      });
      await restore2.waitFor({ state: "visible" });
      expect(await root2.getByRole("status").count()).toBe(0);
      await waitNotice(async () => {
        if (await root2.getByRole("status").count() > 0) return true;
        await restore2.click({ delay: 180 }).catch(() => undefined);
        return await root2.getByRole("status").count() > 0;
      }, 8000);
      expect(await root2.getByRole("status").innerText()).toContain(
        "系统维护通知：关闭后刷新也不再显示",
      );
      await p.evaluate(() => {
        document.cookie =
          "docs-notice-bar-mobile-close-key=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
      });
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 移动NoticeBar默认图标：写 icon 即显示默认图标，颜色随 tone",
    async (t) => {
      const p = await open(t, "/mobile/feedback/notice-bar");
      await p.setViewportSize({ width: 390, height: 900 });
      const root = demo(p, "默认图标");
      const bars = root.getByRole("status");
      const expected = [
        { text: "信息", cls: "text-sky-600" },
        { text: "成功", cls: "text-emerald-600" },
        { text: "警告", cls: "text-amber-600" },
        { text: "危险", cls: "text-red-600" },
      ];
      expect(await bars.count()).toBe(4);
      for (let i = 0; i < expected.length; i++) {
        const b = bars.nth(i), fixture = expected[i];
        expect(await b.innerText()).toContain(fixture.text);
        const actual = await b.evaluate((e, cls) => {
          const wrap = e.querySelector("svg")?.closest("." + CSS.escape(cls));
          return {
            hasSvg: !!e.querySelector('svg[viewBox="0 0 24 24"]'),
            hasCls: !!wrap,
          };
        }, fixture.cls);
        expect(actual.hasSvg).toBe(true);
        expect(actual.hasCls).toBe(true);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
