/** WRITTEN-UNRUN. No runtime execution until every documentation operation is written. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open, value } from "./driver.ts";
import {
  hidden,
  mobilePickerContract,
  type MobilePickerKind,
  picker,
  text,
} from "./mobile-picker-driver-written.ts";
const names = {
  "date-picker": {
    basic: "单日（Signal）",
    field: "day",
    placeholder: "请选择日期",
  },
  "datetime-picker": {
    basic: "基础",
    field: "when",
    placeholder: "请选择日期时间",
  },
  "time-picker": {
    basic: "基础（Signal）",
    field: "time",
    placeholder: "请选择时间",
  },
} as const;
async function formData(form: Locator) {
  return await form.evaluate((e) =>
    Array.from(new FormData(e as HTMLFormElement).entries()).map((
      [k, v],
    ) => [k, String(v)])
  );
}
describe("Mobile pickers written", () => {
  for (const width of [390, 1280]) {
    for (const kind of Object.keys(names) as MobilePickerKind[]) {
      const route = "/mobile/form/" + kind, config = names[kind];
      it(
        "移动Picker " + kind + " " + config.basic + " @" + width +
          "：完整导航草稿取消保存和原生时间列",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const s = demo(p, config.basic),
            input = hidden(s),
            initial = await input.inputValue();
          if (kind === "time-picker") expect(initial).toBe("09:30");
          else {
            const now = await p.evaluate(() =>
              [0, 60000].map((ms) => {
                const d = new Date(Date.now() - ms);
                return d.getFullYear() + "-" +
                  String(d.getMonth() + 1).padStart(2, "0") + "-" +
                  String(d.getDate()).padStart(2, "0") + " " +
                  String(d.getHours()).padStart(2, "0") + ":" +
                  String(d.getMinutes()).padStart(2, "0");
              })
            );
            expect(
              (kind === "date-picker" ? now.map((v) => v.slice(0, 10)) : now)
                .includes(initial),
            ).toBe(true);
          }
          await mobilePickerContract(p, s, kind, config.placeholder);
          await value(
            demo(p, "与 createForm").locator(
              'input[name="' + config.field + '"]',
            ),
            "",
          );
        },
        DOCS_BROWSER_CONFIG,
      );
      it(
        "移动Picker " + kind + " 与 createForm @" + width +
          "：无提交草稿、取消不回写、精确隐藏值与有效提交",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const form = demo(p, "与 createForm").locator("form"),
            error = form.locator('[id$="-error"]'),
            submit = form.getByRole("button", { name: "提交", exact: true }),
            b = picker(form),
            toast = p.getByRole("alert").filter({ hasText: /^已提交$/ });
          await submit.click({ delay: 180 });
          await text(error, config.placeholder);
          await attr(b, "aria-invalid", "true");
          expect(await toast.count()).toBe(0);
          expect(await formData(form)).toEqual([[config.field, ""]]);
          const result = await mobilePickerContract(
            p,
            form,
            kind,
            config.placeholder,
            async () => {
              await text(error, config.placeholder);
              await attr(b, "aria-invalid", "true");
              expect(await formData(form)).toEqual([[config.field, ""]]);
              expect(await toast.count()).toBe(0);
            },
          );
          expect(await formData(form)).toEqual([[config.field, result]]);
          await submit.click({ delay: 180 });
          await eventually(async () => await error.count() === 0);
          await attr(b, "aria-invalid", "false");
          await text(toast, "已提交");
          expect(await formData(form)).toEqual([[config.field, result]]);
          // No clear/reset control is present in these demos: verify actual fresh-document reset, not a fictional button.
          const fresh = await open(t, route),
            again = demo(fresh, "与 createForm").locator("form");
          await value(hidden(again), "");
          expect(await formData(again)).toEqual([[config.field, ""]]);
          await again.getByRole("button", { name: "提交", exact: true }).click({
            delay: 180,
          });
          await text(again.locator('[id$="-error"]'), config.placeholder);
          expect(
            await fresh.getByRole("alert").filter({ hasText: /^已提交$/ })
              .count(),
          ).toBe(0);
        },
        DOCS_BROWSER_CONFIG,
      );
      for (const [index, size] of ["xs", "sm", "md", "lg"].entries()) {
        it(
          "移动Picker " + kind + " size " + size + " @" + width +
            "：非受控完整操作及精确尺寸隔离",
          async (t) => {
            const p = await open(t, route);
            await p.setViewportSize({ width, height: 900 });
            const s = demo(p, "size（xs / sm / md / lg）"), bs = picker(s);
            expect(await bs.count()).toBe(4);
            const b = bs.nth(index), root = b.locator("../..");
            await value(hidden(root), "");
            await attr(b, "aria-label", size);
            expect(
              await b.evaluate((e) => {
                const c = getComputedStyle(e);
                return [
                  c.fontSize,
                  c.paddingTop,
                  c.paddingLeft,
                  c.paddingRight,
                ];
              }),
            ).toEqual([
              [12, 14, 14, 16][index] + "px",
              [4, 6, 8, 10][index] + "px",
              [10, 12, 12, 16][index] + "px",
              [10, 12, 12, 12][index] + "px",
            ]);
            const heights = await bs.evaluateAll((es) =>
              es.map((e) => e.getBoundingClientRect().height)
            );
            expect(heights.every((h, i) => !i || h > heights[i - 1])).toBe(
              true,
            );
            const result = await mobilePickerContract(p, root, kind, size);
            await value(hidden(root), result);
            for (let j = 0; j < 4; j++) {
              if (j !== index) {
                await value(
                  bs.nth(j).locator("../..").locator('input[type="hidden"]'),
                  "",
                );
                await attr(
                  bs.nth(j),
                  "aria-label",
                  ["xs", "sm", "md", "lg"][j],
                );
              }
            }
          },
          DOCS_BROWSER_CONFIG,
        );
      }
      it(
        "移动Picker " + kind + " 自动聚焦 @" + width +
          "：实际focus/键盘打开及该实例完整操作",
        async (t) => {
          const p = await open(t, route);
          await p.setViewportSize({ width, height: 900 });
          const s = demo(p, "自动聚焦"), b = picker(s);
          expect(await b.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          expect(await b.getAttribute("autofocus")).not.toBe(null);
          await value(hidden(s), "");
          await p.keyboard.press("Enter");
          await attr(b, "aria-expanded", "true");
          await p.keyboard.press("Escape");
          await attr(b, "aria-expanded", "false");
          await mobilePickerContract(p, s, kind, "挂载后自动聚焦");
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
