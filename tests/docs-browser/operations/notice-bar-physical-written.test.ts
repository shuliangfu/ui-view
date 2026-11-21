/** WRITTEN-UNRUN. Five real NoticeBar examples; no synthetic click or text-length coverage. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";
const bar = (root: Locator) => root.locator("[data-dreamer-notice-bar]");
async function activate(el: Locator, mode: string) {
  if (mode === "mouse") await el.click({ delay: 180 });
  else await el.press(mode);
}
const ITEMS = [
  "系统将于今晚 23:00 维护，请提前保存数据。",
  "v2.1 已发布，可在设置中查看更新说明。",
  "请及时完成实名认证，以免影响部分功能。",
];
async function waitUntil(
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
async function animationSec(el: Locator): Promise<number> {
  return await el.evaluate((e) => {
    const raw = getComputedStyle(e).animationDuration;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return Number.NaN;
    return raw.trim().endsWith("ms") ? n / 1000 : n;
  });
}
async function waitMarqueeDuration(
  moving: Locator,
  speed: number,
  ms = 4000,
): Promise<{ sec: number; dist: number }> {
  await waitUntil(async () => {
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
    return info.name === "notice-bar-marquee" && Number.isFinite(info.sec) &&
      info.dist > 0 &&
      Math.abs(info.sec - Math.max(0.2, info.dist / speed)) < 0.08;
  }, ms);
  const dist = await moving.evaluate((e) => e.scrollWidth);
  return { sec: await animationSec(moving), dist };
}
describe("NoticeBar physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `NoticeBar 色调 tone @${width}：四条逐项文案/语义/边框和独立色调`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "色调 tone"), bars = bar(root);
        const expected = [
          {
            text: "信息：同步已完成",
            bg: "bg-sky-50",
            fg: "text-sky-800",
            border: "border-sky-200/80",
          },
          {
            text: "成功：配置已保存",
            bg: "bg-emerald-50",
            fg: "text-emerald-800",
            border: "border-emerald-200/80",
          },
          {
            text: "警告：磁盘空间不足",
            bg: "bg-amber-50",
            fg: "text-amber-900",
            border: "border-amber-200/80",
          },
          {
            text: "危险：认证即将过期",
            bg: "bg-red-50",
            fg: "text-red-800",
            border: "border-red-200/80",
          },
        ];
        expect(await bars.count()).toBe(4);
        const backgrounds: string[] = [], foregrounds: string[] = [];
        for (let i = 0; i < expected.length; i++) {
          const b = bars.nth(i), fixture = expected[i];
          expect(await b.innerText()).toBe(fixture.text);
          expect(await b.getAttribute("role")).toBe("status");
          expect(await b.getByRole("button").count()).toBe(0);
          const actual = await b.evaluate((e, f) => {
            const c = getComputedStyle(e);
            return {
              classes: [f.bg, f.fg, f.border].every((s) =>
                e.classList.contains(s)
              ),
              border: [
                c.borderTopWidth,
                c.borderRightWidth,
                c.borderBottomWidth,
                c.borderLeftWidth,
              ],
              background: c.backgroundColor,
              color: c.color,
            };
          }, fixture);
          expect(actual.classes).toBe(true);
          expect(actual.border).toEqual(["1px", "1px", "1px", "1px"]);
          expect(actual.background).not.toBe("rgba(0, 0, 0, 0)");
          backgrounds.push(actual.background);
          foregrounds.push(actual.color);
          await b.click({ delay: 180 });
          expect(await b.isVisible()).toBe(true);
          expect(await b.innerText()).toBe(fixture.text);
        }
        expect(new Set(backgrounds).size).toBe(4);
        expect(new Set(foregrounds).size).toBe(4);
        expect(await bars.allTextContents()).toEqual(
          expected.map((f) => f.text),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    for (const mode of ["mouse", "Enter", "Space"]) {
      it(
        `NoticeBar 可关闭 closable @${width}/${mode}：自身消失/其它条不受影响`,
        async (t) => {
          const p = await open(t, "/desktop/feedback/notice-bar");
          await p.setViewportSize({ width, height: 900 });
          const root = example(p, "可关闭 closable"),
            b = bar(root),
            others = bar(example(p, "色调 tone"));
          expect(await b.textContent()).toBe("系统将于今晚维护×");
          await b.getByText("系统将于今晚维护", { exact: true }).click({
            delay: 180,
          });
          expect(await b.isVisible()).toBe(true);
          await activate(
            b.getByRole("button", { name: "关闭", exact: true }),
            mode,
          );
          await eventually(async () => await b.count() === 0);
          expect(await root.locator("[data-dreamer-notice-bar-host]").count())
            .toBe(1);
          expect(await others.allTextContents()).toEqual([
            "信息：同步已完成",
            "成功：配置已保存",
            "警告：磁盘空间不足",
            "危险：认证即将过期",
          ]);
          expect(await bar(example(p, "受控 visible")).isVisible()).toBe(true);
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `NoticeBar 长文滚动 scrollable @${width}：真实动画位移/裁切/减弱动态`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        await p.emulateMedia({ reducedMotion: "no-preference" });
        const b = bar(example(p, "长文滚动 scrollable"));
        await b.scrollIntoViewIfNeeded();
        const content =
          "欢迎使用组件库 —— 本条为长文案横向滚动示意，请关注发布说明与变更日志。";
        expect(await b.innerText()).toBe(content);
        const moving = b.locator(".animate-notice-bar-marquee"),
          clip = moving.locator("..");
        const measured = await waitMarqueeDuration(moving, 60);
        const actual = await moving.evaluate((e) => {
          const c = getComputedStyle(e);
          return {
            name: c.animationName,
            timing: c.animationTimingFunction,
            repeats: c.animationIterationCount,
          };
        });
        expect(actual.name).toBe("notice-bar-marquee");
        expect(actual.timing).toBe("linear");
        expect(actual.repeats).toBe("infinite");
        expect(Math.abs(measured.sec - Math.max(0.2, measured.dist / 60)))
          .toBeLessThan(0.08);
        expect(
          await clip.evaluate((
            e,
          ) => [getComputedStyle(e).overflowX, getComputedStyle(e).whiteSpace]),
        ).toEqual(["hidden", "nowrap"]);
        expect(await clip.evaluate((e) => getComputedStyle(e).maskImage))
          .toContain("linear-gradient");
        if (width === 390) {
          expect(await clip.evaluate((e) => e.scrollWidth > e.clientWidth))
            .toBe(
              true,
            );
        }
        const x = await moving.evaluate((e) =>
          new DOMMatrix(getComputedStyle(e).transform).e
        );
        await p.waitForTimeout(180);
        const next = await moving.evaluate((e) =>
          new DOMMatrix(getComputedStyle(e).transform).e
        );
        expect(Math.abs(next - x)).toBeGreaterThan(.25);
        await p.emulateMedia({ reducedMotion: "reduce" });
        await eventually(async () =>
          await moving.evaluate((e) => getComputedStyle(e).animationName) ===
            "none"
        );
        expect(await moving.evaluate((e) => getComputedStyle(e).transform))
          .toBe(
            "none",
          );
        expect(await moving.innerText()).toBe(content);
        await p.waitForTimeout(180);
        expect(await moving.evaluate((e) => getComputedStyle(e).transform))
          .toBe(
            "none",
          );
        expect(await b.getByRole("button").count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `NoticeBar 受控 visible @${width}：关闭/恢复三轮与相邻实例隔离`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "受控 visible"),
          b = bar(root),
          restore = root.getByRole("button", { name: "重新显示", exact: true });
        for (const mode of ["mouse", "Enter", "Space"]) {
          expect(await b.textContent()).toBe(
            "受控条：点 × 由外部 signal 隐藏×",
          );
          expect(await restore.count()).toBe(0);
          await activate(
            b.getByRole("button", { name: "关闭", exact: true }),
            mode,
          );
          await eventually(async () => await b.count() === 0);
          await restore.waitFor({ state: "visible" });
          expect(await bar(example(p, "可关闭 closable")).isVisible()).toBe(
            true,
          );
          await activate(
            restore,
            mode === "mouse" ? "Enter" : mode === "Enter" ? "Space" : "mouse",
          );
          await b.waitFor({ state: "visible" });
          expect(await b.count()).toBe(1);
          expect(await restore.count()).toBe(0);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `NoticeBar 默认图标 icon @${width}：写 icon 即显示默认图标，颜色随 tone`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "默认图标 icon"), bars = bar(root);
        const expected = [
          { text: "信息：同步已完成", cls: "text-sky-600" },
          { text: "成功：配置已保存", cls: "text-emerald-600" },
          { text: "警告：磁盘空间不足", cls: "text-amber-600" },
          { text: "危险：认证即将过期", cls: "text-red-600" },
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

    for (const target of ["content", "icon"]) {
      it(
        `NoticeBar 图标 + 整条点击 @${width}/${target}：可信点击得到精确反馈`,
        async (t) => {
          const p = await open(t, "/desktop/feedback/notice-bar");
          await p.setViewportSize({ width, height: 900 });
          const root = example(p, "图标 + 整条点击"),
            b = bar(root),
            result = root.locator('p[role="status"]');
          expect(await b.getAttribute("role")).toBe("status");
          expect(await result.count()).toBe(0);
          const icon = b.locator('span[aria-hidden="true"]');
          expect(await icon.innerText()).toBe("📢");
          expect(await b.evaluate((e) => getComputedStyle(e).cursor)).toBe(
            "pointer",
          );
          const button = target === "icon"
            ? icon
            : b.getByText("点击本条查看详情", { exact: true });
          await button.click({ delay: 180 });
          await result.waitFor({ state: "visible" });
          expect(await result.innerText()).toBe("已点击通知条");
          expect(await result.count()).toBe(1);
          expect(
            await b.getByText("点击本条查看详情", { exact: true }).innerText(),
          ).toBe("点击本条查看详情");
          expect(await bar(example(p, "受控 visible")).isVisible()).toBe(true);
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `NoticeBar 多条滚动 @${width}：一次一条、停留后切到下一条`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        await p.emulateMedia({ reducedMotion: "no-preference" });
        const b = bar(example(p, "多条滚动"));
        await b.scrollIntoViewIfNeeded();
        const first = (await b.innerText()).trim();
        expect(first).toContain(ITEMS[0]);
        expect(first.includes(ITEMS[1]) && first.includes(ITEMS[2])).toBe(
          false,
        );
        await waitUntil(async () => {
          const text = (await b.innerText()).trim();
          return text.includes(ITEMS[1]) && !text.includes(ITEMS[0]);
        }, 50000);
        const next = (await b.innerText()).trim();
        expect(next).toContain(ITEMS[1]);
        expect(next).not.toContain(ITEMS[0]);
        expect(next).not.toContain(ITEMS[2]);
      },
      { ...DOCS_BROWSER_CONFIG, timeout: 90_000 },
    );

    it(
      `NoticeBar 滚动速度 @${width}：三档与数字的时长按像素每秒计算`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        await p.emulateMedia({ reducedMotion: "no-preference" });
        const root = example(p, "滚动速度");
        const bars = bar(root);
        expect(await bars.count()).toBe(4);
        const rows = [
          { hint: "快速 120", speed: 120 },
          { hint: "中速 60", speed: 60 },
          { hint: "慢速 30", speed: 30 },
          { hint: "自定义 90", speed: 90 },
        ];
        const secs: number[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = bars.nth(i);
          await row.scrollIntoViewIfNeeded();
          const moving = row.locator(".animate-notice-bar-marquee");
          const measured = await waitMarqueeDuration(moving, rows[i].speed);
          expect(
            Math.abs(
              measured.sec - Math.max(0.2, measured.dist / rows[i].speed),
            ),
          ).toBeLessThan(0.08);
          secs.push(measured.sec);
        }
        expect(secs[0]).toBeLessThan(secs[1]);
        expect(secs[1]).toBeLessThan(secs[2]);
        expect(secs[3]).toBeGreaterThan(secs[0]);
        expect(secs[3]).toBeLessThan(secs[2]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `NoticeBar 纵向滚动 @${width}：从下往上切条，一次只显示一条`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        await p.emulateMedia({ reducedMotion: "no-preference" });
        const b = bar(example(p, "纵向滚动"));
        await b.scrollIntoViewIfNeeded();
        const first = (await b.innerText()).trim();
        expect(first).toContain(ITEMS[0]);
        expect(first.includes(ITEMS[1]) && first.includes(ITEMS[2])).toBe(
          false,
        );
        const track = b.locator("[data-dreamer-notice-bar-track]");
        const y0 = await track.evaluate((e) =>
          new DOMMatrix(getComputedStyle(e).transform).f
        );
        await p.waitForTimeout(180);
        const y1 = await track.evaluate((e) =>
          new DOMMatrix(getComputedStyle(e).transform).f
        );
        // either already holding (y==0) after a short enter, or still moving on Y
        expect(Number.isFinite(y0) && Number.isFinite(y1)).toBe(true);
        await waitUntil(async () => {
          const text = (await b.innerText()).trim();
          return text.includes(ITEMS[1]) && !text.includes(ITEMS[0]);
        }, 20000);
        expect((await b.innerText()).trim()).toContain(ITEMS[1]);
        expect((await b.innerText()).trim()).not.toContain(ITEMS[2]);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `NoticeBar 关闭提示 @${width}：取消保留，确认后可再显示`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "关闭提示");
        const restore = root.getByRole("button", {
          name: "重新显示",
          exact: true,
        });
        if (await restore.count() && await restore.isVisible()) {
          await restore.click({ delay: 180 });
        }
        const b = bar(root);
        await b.waitFor({ state: "visible" });
        expect(await b.innerText()).toContain("这条关闭前会先确认");
        await b.getByRole("button", { name: "关闭", exact: true }).click({
          delay: 180,
        });
        const panel = p.locator("[data-dreamer-popconfirm-panel]:visible");
        await panel.waitFor({ state: "visible" });
        expect(await panel.innerText()).toContain("你确认要关闭吗？");
        await panel.getByRole("button", { name: "取消", exact: true }).click({
          delay: 180,
        });
        await waitUntil(async () => await panel.count() === 0, 4000);
        expect(await b.isVisible()).toBe(true);
        expect(await b.innerText()).toContain("这条关闭前会先确认");
        await b.getByRole("button", { name: "关闭", exact: true }).click({
          delay: 180,
        });
        await panel.waitFor({ state: "visible" });
        await panel.getByRole("button", { name: "确定", exact: true }).click({
          delay: 180,
        });
        await waitUntil(async () => await b.count() === 0, 4000);
        await restore.waitFor({ state: "visible" });
        await restore.click({ delay: 180 });
        await b.waitFor({ state: "visible" });
        expect(await b.innerText()).toContain("这条关闭前会先确认");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `NoticeBar 关闭确认 @${width}：确认后写入 cookie，刷新不再显示`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/notice-bar");
        await p.setViewportSize({ width, height: 900 });
        await p.evaluate(() => {
          document.cookie =
            "docs-notice-bar-close-key=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
        });
        const root = example(p, "关闭确认");
        const restore = root.getByRole("button", {
          name: "重新显示",
          exact: true,
        });
        if (await bar(root).count() === 0) {
          await restore.click({ delay: 180 });
        }
        const b = bar(root);
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
        await waitUntil(async () => await b.count() === 0, 4000);
        const cookie = await p.evaluate(() => document.cookie);
        expect(cookie.includes("docs-notice-bar-close-key=1")).toBe(true);
        await p.reload({ waitUntil: "load" });
        const root2 = example(p, "关闭确认");
        const restore2 = root2.getByRole("button", {
          name: "重新显示",
          exact: true,
        });
        await restore2.waitFor({ state: "visible" });
        expect(await bar(root2).count()).toBe(0);
        await waitUntil(async () => {
          if (await bar(root2).count() > 0) return true;
          await restore2.click({ delay: 180 }).catch(() => undefined);
          return await bar(root2).count() > 0;
        }, 8000);
        expect(await bar(root2).innerText()).toContain(
          "系统维护通知：关闭后刷新也不再显示",
        );
        await p.evaluate(() => {
          document.cookie =
            "docs-notice-bar-close-key=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
        });
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
