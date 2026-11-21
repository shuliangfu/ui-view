/** WRITTEN-UNRUN. Native wheel input, independently computed data/offset oracle; isolated browser clock for temporal DOM. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";
type Entry = { height: number; text: string };
function offsets(entries: Entry[]) {
  const values = [0];
  for (const e of entries) values.push(values[values.length - 1] + e.height);
  return values;
}
function firstVisible(prefix: number[], top: number) {
  for (let i = 0; i < prefix.length - 1; i++) if (prefix[i + 1] > top) return i;
  return prefix.length - 2;
}
async function virtualState(
  list: Locator,
  entries: Entry[],
  height: number,
  overscan: number,
) {
  const prefix = offsets(entries),
    spacer = list.locator("[data-dreamer-virtual-list-spacer]");
  await eventually(async () => {
    const top = await list.evaluate((e) => e.scrollTop),
      first = firstVisible(prefix, top);
    return Number(await spacer.getAttribute("data-start")) ===
      Math.max(0, first - overscan);
  });
  const state = await list.evaluate((e) => {
    const spacer = e.querySelector("[data-dreamer-virtual-list-spacer]")!,
      content = spacer.firstElementChild!,
      outer = e.getBoundingClientRect();
    return {
      top: e.scrollTop,
      client: e.clientHeight,
      scroll: e.scrollHeight,
      h: outer.height,
      total: Number(spacer.getAttribute("data-total")),
      start: Number(spacer.getAttribute("data-start")),
      end: Number(spacer.getAttribute("data-end")),
      spacerHeight: spacer.getBoundingClientRect().height,
      offset: new DOMMatrixReadOnly(getComputedStyle(content).transform).m42,
      rows: Array.from(e.querySelectorAll(".virtual-list-item")).map((r) => ({
        index: Number(r.getAttribute("data-index")),
        height: r.getBoundingClientRect().height,
        text: (r as HTMLElement).innerText,
      })),
    };
  });
  expect(state.h).toBe(height);
  expect(state.client).toBe(height);
  expect(state.scroll).toBe(prefix[prefix.length - 1]);
  expect(state.spacerHeight).toBe(prefix[prefix.length - 1]);
  expect(state.total).toBe(entries.length);
  const indices = state.rows.map((r) => r.index),
    first = firstVisible(prefix, state.top),
    visible = entries.map((_, i) => i).filter((i) =>
      prefix[i + 1] > state.top && prefix[i] < state.top + height
    );
  expect(state.rows.length > 0).toBe(true);
  expect(state.start).toBe(Math.max(0, first - overscan));
  expect(indices).toEqual(
    Array.from({ length: state.end - state.start }, (_, i) => state.start + i),
  );
  expect(
    state.rows.length <= Math.ceil(
          height / Math.min(...entries.map((e) => e.height)),
        ) + 2 * overscan + 1,
  ).toBe(true);
  expect(state.offset).toBe(prefix[state.start]);
  for (const i of visible) expect(indices.includes(i)).toBe(true);
  for (const r of state.rows) {
    expect(r.index >= 0 && r.index < entries.length).toBe(true);
    expect(r.height).toBe(entries[r.index].height);
    expect(r.text).toBe(entries[r.index].text);
  }
  return state;
}
async function wheel(p: Page, list: Locator, delta: number) {
  await list.hover();
  await p.mouse.wheel(0, delta);
}
async function scrollContract(
  p: Page,
  list: Locator,
  entries: Entry[],
  height: number,
  overscan: number,
) {
  const original = await list.elementHandle();
  if (!original) throw Error("Stable scroll element missing");
  const total = offsets(entries).at(-1)!;
  try {
    expect((await virtualState(list, entries, height, overscan)).top).toBe(0);
    await wheel(p, list, height * 5 + 17);
    await eventually(async () => await list.evaluate((e) => e.scrollTop) > 0);
    const middle = await virtualState(list, entries, height, overscan);
    expect(middle.top > 0 && middle.top < total - height).toBe(true);
    expect(middle.start > 0).toBe(true);
    expect(await list.evaluate((e, old) => e === old, original)).toBe(true);
    await wheel(p, list, 1_000_000);
    await eventually(async () =>
      await list.evaluate((e) => e.scrollTop) === total - height
    );
    const last = await virtualState(list, entries, height, overscan);
    expect(last.rows.at(-1)!.index).toBe(entries.length - 1);
    expect(last.rows.at(-1)!.text).toBe(entries.at(-1)!.text);
    expect(last.end).toBe(entries.length);
    expect(await list.evaluate((e, old) => e === old, original)).toBe(true);
    await wheel(p, list, -1_000_000);
    await eventually(async () => await list.evaluate((e) => e.scrollTop) === 0);
    const reset = await virtualState(list, entries, height, overscan);
    expect(reset.start).toBe(0);
    expect(reset.rows[0].text).toBe(entries[0].text);
    expect(await list.evaluate((e, old) => e === old, original)).toBe(true);
  } finally {
    await original.dispose();
  }
}
function readSeconds(text: string) {
  if (!/^\d{2}:\d{2}:\d{2}$/.test(text)) {
    throw Error("Exact HH:mm:ss required: " + text);
  }
  const [h, m, s] = text.split(":").map(Number);
  expect(m >= 0 && m < 60 && s >= 0 && s < 60).toBe(true);
  return h * 3600 + m * 60 + s;
}
function format(seconds: number) {
  return [
    Math.floor(seconds / 3600),
    Math.floor(seconds % 3600 / 60),
    seconds % 60,
  ].map((n) => String(n).padStart(2, "0")).join(":");
}
describe("Virtual time written", () => {
  for (const platform of ["desktop", "mobile"]) {
    for (const width of [390, 1280]) {
      it(
        `VirtualList ${platform} 定高 @${width}：真实滚轮中段/尾部/返回及2000条精确定位`,
        async (t) => {
          const p = await open(t, `/${platform}/data-display/virtual-list`);
          await p.setViewportSize({ width, height: 900 });
          const list = example(p, "定高 · 2000 条").locator(
            "[data-dreamer-virtual-list]",
          );
          await scrollContract(
            p,
            list,
            Array.from(
              { length: 2000 },
              (_, i) => ({ height: 36, text: `Item ${i + 1}` }),
            ),
            platform === "desktop" ? 320 : 280,
            4,
          );
          const other = example(
            p,
            platform === "desktop" ? "动态行高 getItemHeight" : "动态行高",
          ).locator("[data-dreamer-virtual-list]");
          expect(await other.evaluate((e) => e.scrollTop)).toBe(0);
        },
        DOCS_BROWSER_CONFIG,
      );
      it(
        `VirtualList ${platform} 动态行高 @${width}：独立前缀和/逐条文案高度及边界回滚`,
        async (t) => {
          const p = await open(t, `/${platform}/data-display/virtual-list`);
          await p.setViewportSize({ width, height: 900 });
          const desktop = platform === "desktop",
            list = example(p, desktop ? "动态行高 getItemHeight" : "动态行高")
              .locator("[data-dreamer-virtual-list]");
          const entries = Array.from(
            { length: desktop ? 200 : 80 },
            (_, i) =>
              desktop
                ? {
                  height: i % 3 === 0 ? 56 : 36,
                  text: i % 3 === 0
                    ? `多行文案 #${i + 1}\n第二行说明`
                    : `短行 #${i + 1}`,
                }
                : {
                  height: i % 4 === 0 ? 52 : 36,
                  text: i % 4 === 0 ? `高行 ${i}` : `行 ${i}`,
                },
          );
          await scrollContract(
            p,
            list,
            entries,
            desktop ? 240 : 200,
            desktop ? 6 : 4,
          );
          expect(
            await example(p, "定高 · 2000 条").locator(
              "[data-dreamer-virtual-list]",
            ).evaluate((e) => e.scrollTop),
          ).toBe(0);
        },
        DOCS_BROWSER_CONFIG,
      );
      it(
        `VirtualList ${platform} 空态 @${width}：精确空提示/容器高度且滚轮不凭空生成行`,
        async (t) => {
          const p = await open(t, `/${platform}/data-display/virtual-list`);
          await p.setViewportSize({ width, height: 900 });
          const list = example(
            p,
            platform === "desktop" ? "空态 empty" : "空态",
          )
            .locator("[data-dreamer-virtual-list]");
          expect(await list.locator("p").innerText()).toBe("暂无数据");
          expect(await list.evaluate((e) => e.getBoundingClientRect().height))
            .toBe(platform === "desktop" ? 120 : 100);
          for (const delta of [600, -600]) {
            await wheel(p, list, delta);
            expect(await list.locator(".virtual-list-item").count()).toBe(0);
            expect(
              await list.locator("[data-dreamer-virtual-list-spacer]").count(),
            ).toBe(0);
            expect(await list.evaluate((e) => e.scrollTop)).toBe(0);
            expect(await list.locator("p").innerText()).toBe("暂无数据");
          }
        },
        DOCS_BROWSER_CONFIG,
      );
      it(
        `CountDown ${platform} 基础未设三级标题 @${width}：一秒递减/跨分钟/到零稳定`,
        async (t) => {
          // Dedicated context: mocked Date/timers never leak into other documentation cases.
          const host = await open(t, `/${platform}/data-display/count-down`),
            browser = host.context().browser();
          if (!browser) throw Error("Browser required for isolated clock");
          const context = await browser.newContext({
            viewport: { width, height: 900 },
          });
          try {
            const p = await context.newPage();
            p.setDefaultTimeout(8000);
            await p.clock.install();
            await p.goto(host.url(), { waitUntil: "networkidle" });
            const timer = p.locator('main [role="timer"]');
            await eventually(async () =>
              await timer.count() === 1 &&
              readSeconds((await timer.innerText()).trim()) > 0
            );
            await p.clock.pauseAt(await p.evaluate(() => Date.now() + 1500));
            const first = readSeconds((await timer.innerText()).trim()),
              elapsed = await p.evaluate(() => performance.now());
            expect(first > 61).toBe(true);
            expect(
              first <= 3661 &&
                first >= Math.max(0, Math.floor((3_661_000 - elapsed) / 1000)),
            ).toBe(true);
            await p.clock.runFor(1000);
            expect((await timer.innerText()).trim()).toBe(format(first - 1));
            await p.clock.fastForward(60_000);
            expect((await timer.innerText()).trim()).toBe(format(first - 61));
            await p.clock.fastForward((first + 1) * 1000);
            expect((await timer.innerText()).trim()).toBe("00:00:00");
            await p.clock.fastForward(86_400_000);
            expect((await timer.innerText()).trim()).toBe("00:00:00");
            expect(await timer.count()).toBe(1);
            expect(
              await timer.evaluate((e) => e.classList.contains("tabular-nums")),
            ).toBe(true);
          } finally {
            await context.close();
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
