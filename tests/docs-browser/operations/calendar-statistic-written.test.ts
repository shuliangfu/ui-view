/** WRITTEN-UNRUN. All three calendar instances intentionally share the same Signal; independent civil-date oracle. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";
function monthDays(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1)),
    last = new Date(Date.UTC(year, month + 1, 0));
  const count = Math.ceil((first.getUTCDay() + last.getUTCDate()) / 7) * 7;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month, 1 - first.getUTCDay() + i));
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
    };
  });
}
const monthRoots = (
  p: Page,
) => [
  example(p, "基础选日").locator(".calendar"),
  example(p, "fullscreen").locator(".calendar"),
];
async function calendarState(p: Page, y: number, m: number, day: number) {
  const expected = monthDays(y, m),
    selected = expected.findIndex((d) =>
      d.year === y && d.month === m && d.day === day
    );
  for (const root of monthRoots(p)) {
    const cells = root.locator("button[data-ui-calendar-day]");
    const wanted = expected.map((d, i) => ({
      label: String(d.day),
      selected: i === selected,
    }));
    await eventually(async () =>
      JSON.stringify(
        await cells.evaluateAll((es) =>
          es.map((e) => ({
            label: e.textContent!.trim(),
            selected: e.classList.contains("bg-blue-600"),
          }))
        ),
      ) === JSON.stringify(wanted)
    );
    expect(
      await root.locator(":scope > div").first().locator(":scope > div")
        .allTextContents(),
    ).toEqual(["日", "一", "二", "三", "四", "五", "六"]);
    const actual = await cells.evaluateAll((es) =>
      es.map((e) => {
        const c = getComputedStyle(e);
        return {
          label: e.textContent!.trim(),
          selected: e.classList.contains("bg-blue-600"),
          disabled: (e as HTMLButtonElement).disabled,
          right: c.borderRightWidth,
          top: c.borderTopWidth,
          current: e.classList.contains("text-slate-900"),
        };
      })
    );
    expect(actual.map((e) => e.label)).toEqual(
      expected.map((d) => String(d.day)),
    );
    expect(actual.map((e, i) => e.selected ? i : -1).filter((i) => i >= 0))
      .toEqual([selected]);
    for (let i = 0; i < actual.length; i++) {
      expect(actual[i].disabled).toBe(false);
      expect(actual[i].right).toBe(i % 7 === 6 ? "0px" : "1px");
      expect(actual[i].top).toBe(i < 7 ? "0px" : "1px");
      if (i !== selected) {
        expect(actual[i].current).toBe(expected[i].month === m);
      }
    }
    const columns = await root.locator(":scope > div").nth(1).evaluate((e) =>
      getComputedStyle(e).gridTemplateColumns.split(/\s+/).length
    );
    expect(columns).toBe(7);
  }
  const months = example(p, "mode=year 年视图").locator(
    ".calendar-year button",
  );
  expect(await months.allTextContents()).toEqual(
    Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
  );
  expect(
    await months.evaluateAll((es) =>
      es.map((e, i) => e.classList.contains("bg-blue-600") ? i : -1).filter(
        (i) => i >= 0,
      )
    ),
  ).toEqual([m]);
}
async function chooseDay(
  p: Page,
  root: Locator,
  y: number,
  m: number,
  day: number,
  mode: string,
) {
  const index = monthDays(y, m).findIndex((d) =>
    d.year === y && d.month === m && d.day === day
  );
  if (index < 0) throw Error("Requested date is not present");
  const cell = root.locator("[data-ui-calendar-day]").nth(index);
  if (mode === "mouse") await cell.click({ delay: 180 });
  else await cell.press(mode);
  await calendarState(p, y, m, day);
}
describe("Calendar statistic written", () => {
  for (const width of [390, 1280]) {
    for (const label of ["基础选日", "mode=year 年视图", "fullscreen"]) {
      it(
        `Calendar ${label} @${width}：真实选日月份/闰日/邻月跨年与共享结果`,
        async (t) => {
          const host = await open(t, "/desktop/data-display/calendar"),
            browser = host.context().browser();
          if (!browser) throw Error("Isolated local browser context required");
          const context = await browser.newContext({
            viewport: { width, height: 900 },
            timezoneId: "Asia/Shanghai",
          });
          try {
            const p = await context.newPage();
            p.setDefaultTimeout(8000);
            await p.clock.setFixedTime(new Date("2024-06-15T12:00:00+08:00"));
            await p.goto(host.url(), { waitUntil: "networkidle" });
            await calendarState(p, 2024, 5, 15);
            const year = example(p, "mode=year 年视图").locator(
                ".calendar-year",
              ),
              root = example(
                p,
                label === "mode=year 年视图" ? "基础选日" : label,
              )
                .locator(".calendar");
            if (label === "mode=year 年视图") {
              for (let m = 0; m < 12; m++) {
                const b = year.getByRole("button", {
                  name: `${m + 1}月`,
                  exact: true,
                });
                if (m % 3 === 0) await b.click({ delay: 180 });
                else await b.press(m % 3 === 1 ? "Enter" : "Space");
                await calendarState(p, 2024, m, 1);
              }
            }
            await year.getByRole("button", { name: "2月", exact: true }).click({
              delay: 180,
            });
            await calendarState(p, 2024, 1, 1);
            await chooseDay(p, root, 2024, 1, 29, "mouse");
            await chooseDay(p, root, 2024, 1, 1, "Enter");
            await chooseDay(p, root, 2024, 1, 29, "Space");
            const feb = monthDays(2024, 1),
              march = feb.findIndex((d) => d.month === 2 && d.day === 1);
            expect(march >= 0).toBe(true);
            await root.locator("[data-ui-calendar-day]").nth(march).click({
              delay: 180,
            });
            await calendarState(p, 2024, 2, 1);
            const mar = monthDays(2024, 2),
              back = mar.findIndex((d) => d.month === 1 && d.day === 29);
            await root.locator("[data-ui-calendar-day]").nth(back).press(
              "Enter",
            );
            await calendarState(p, 2024, 1, 29);
            await year.getByRole("button", { name: "12月", exact: true }).press(
              "Space",
            );
            await calendarState(p, 2024, 11, 1);
            const dec = monthDays(2024, 11),
              jan = dec.findIndex((d) =>
                d.year === 2025 && d.month === 0 && d.day === 1
              );
            expect(jan >= 0).toBe(true);
            await root.locator("[data-ui-calendar-day]").nth(jan).click({
              delay: 180,
            });
            await calendarState(p, 2025, 0, 1);
            const janGrid = monthDays(2025, 0),
              prior = janGrid.findIndex((d) =>
                d.year === 2024 && d.month === 11 && d.day === 31
              );
            expect(prior >= 0).toBe(true);
            await root.locator("[data-ui-calendar-day]").nth(prior).press(
              "Space",
            );
            await calendarState(p, 2024, 11, 31);
            if (label === "fullscreen") {
              const r = await root.boundingBox(),
                parent = await root.locator("..").boundingBox();
              expect(Math.abs(r!.width - parent!.width) < .1).toBe(true);
              expect(
                await root.locator(":scope > div").nth(1).evaluate((e) =>
                  getComputedStyle(e).minHeight
                ),
              ).toBe("352px");
              expect(
                await root.locator(":scope > div").nth(1).evaluate((e) =>
                  e.getBoundingClientRect().height >= 352
                ),
              ).toBe(true);
            }
          } finally {
            await context.close();
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      `Statistic prefix / suffix / precision / groupSeparator @${width}：精确数值段与无隐式箭头`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/statistic");
        await p.setViewportSize({ width, height: 900 });
        const stats = example(p, "prefix / suffix / precision / groupSeparator")
          .locator(".statistic");
        expect(await stats.count()).toBe(3);
        expect(
          await stats.evaluateAll((es) =>
            es.map((e) => ({
              title: e.firstElementChild!.textContent!.trim(),
              values: Array.from(e.lastElementChild!.children).map((c) =>
                c.textContent!.trim()
              ),
            }))
          ),
        ).toEqual([{ title: "总销售额", values: ["¥", "112,893.50"] }, {
          title: "访问量",
          values: ["8,846", "次"],
        }, { title: "完成率", values: ["93.5", "%"] }]);
        expect(await stats.locator("[aria-hidden]").count()).toBe(0);
        const values = stats.locator(".tabular-nums");
        expect(
          await values.evaluateAll((es) =>
            es.map((e) => {
              const c = getComputedStyle(e);
              return [c.fontSize, c.fontWeight];
            })
          ),
        ).toEqual([["24px", "600"], ["24px", "600"], ["24px", "600"]]);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Statistic 趋势箭头（显式 trend） @${width}：符号/正负/红绿与装饰语义`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/statistic");
        await p.setViewportSize({ width, height: 900 });
        const stats = example(p, "趋势箭头（显式 trend）").locator(
          ".statistic",
        );
        expect(await stats.count()).toBe(2);
        expect(
          await stats.evaluateAll((es) =>
            es.map((e) => ({
              title: e.firstElementChild!.textContent!.trim(),
              values: Array.from(e.lastElementChild!.children).map((c) =>
                c.textContent!.trim()
              ),
            }))
          ),
        ).toEqual([{ title: "环比", values: ["12.5", "↑", "%"] }, {
          title: "同比",
          values: ["-3.2", "↓", "%"],
        }]);
        for (const [i, color] of ["text-green-600", "text-red-600"].entries()) {
          const stat = stats.nth(i),
            value = stat.locator(".tabular-nums"),
            arrow = stat.locator('[aria-hidden="true"]');
          expect(await arrow.count()).toBe(1);
          expect(await value.evaluate((e, c) => e.classList.contains(c), color))
            .toBe(true);
          expect(await value.evaluate((e) => getComputedStyle(e).color)).toBe(
            await arrow.evaluate((e) => getComputedStyle(e).color),
          );
        }
        expect(
          await stats.nth(0).locator(".tabular-nums").evaluate((e) =>
            getComputedStyle(e).color
          ),
        ).not.toBe(
          await stats.nth(1).locator(".tabular-nums").evaluate((e) =>
            getComputedStyle(e).color
          ),
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
