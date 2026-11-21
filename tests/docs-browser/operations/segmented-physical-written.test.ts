/** WRITTEN-UNRUN. Three live Segmented examples with independent signals; disabled option is a real no-op. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const tablist = (root: Locator) =>
  root.getByRole("tablist", { name: "分段选择", exact: true });

async function selected(list: Locator) {
  return await list.getByRole("tab", { selected: true }).innerText();
}

async function activate(tab: Locator, mode: string) {
  if (mode === "mouse") await tab.click({ delay: 180 });
  else {
    await tab.focus();
    await tab.press(mode);
  }
}

describe("Segmented physical written", () => {
  for (const width of [390, 1280]) {
    for (const mode of ["mouse", "Enter", "Space"]) {
      it(
        `Segmented 基础 @${width}/${mode}：三选一切换写回当前值且不联动其它实例`,
        async (t) => {
          const p = await open(t, "/desktop/data-display/segmented");
          await p.setViewportSize({ width, height: 900 });
          const root = example(p, "基础");
          const list = tablist(root);
          const tabs = list.getByRole("tab");
          expect(await tabs.allTextContents()).toEqual([
            "列表",
            "网格",
            "卡片",
          ]);
          expect(await list.getAttribute("aria-label")).toBe("分段选择");
          expect(await selected(list)).toBe("列表");
          expect(
            await root.locator("p").filter({ hasText: /^当前:/ }).innerText(),
          )
            .toBe("当前: 列表");
          await activate(tabs.nth(1), mode);
          await eventually(async () => await selected(list) === "网格");
          expect(await selected(list)).toBe("网格");
          expect(
            await root.locator("p").filter({ hasText: /^当前:/ }).innerText(),
          )
            .toBe("当前: 网格");
          await activate(tabs.nth(2), mode);
          await eventually(async () => await selected(list) === "卡片");
          expect(await selected(list)).toBe("卡片");
          expect(
            await root.locator("p").filter({ hasText: /^当前:/ }).innerText(),
          )
            .toBe("当前: 卡片");
          expect(await selected(tablist(example(p, "block / size=lg")))).toBe(
            "列表",
          );
          expect(await selected(tablist(example(p, "options 含 disabled"))))
            .toBe(
              "列表",
            );
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `Segmented block / size=lg @${width}：整行等分、lg 字号内边距，切页不改基础当前值`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/segmented");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "block / size=lg");
        const list = tablist(root);
        const box = await list.boundingBox();
        if (!box) throw new Error("block segmented has no box");
        const parent = await list.evaluate((e) =>
          (e.parentElement as HTMLElement).clientWidth
        );
        expect(Math.abs(box.width - parent)).toBeLessThan(1);
        const metrics = await list.getByRole("tab").evaluateAll((es) =>
          es.map((e) => {
            const c = getComputedStyle(e);
            return {
              text: e.textContent,
              width: (e as HTMLElement).getBoundingClientRect().width,
              font: c.fontSize,
              pad: [
                c.paddingTop,
                c.paddingRight,
                c.paddingBottom,
                c.paddingLeft,
              ],
            };
          })
        );
        expect(metrics.map((m) => m.text)).toEqual(["列表", "网格", "卡片"]);
        expect(metrics.every((m) => m.font === "16px")).toBe(true);
        expect(
          metrics.every((m) =>
            m.pad[0] === "10px" && m.pad[1] === "16px" && m.pad[2] === "10px" &&
            m.pad[3] === "16px"
          ),
        ).toBe(true);
        expect(Math.abs(metrics[0].width - metrics[1].width)).toBeLessThan(2);
        expect(Math.abs(metrics[1].width - metrics[2].width)).toBeLessThan(2);
        const basic = example(p, "基础").locator("p").filter({
          hasText: /^当前:/,
        });
        expect(await basic.innerText()).toBe("当前: 列表");
        await list.getByRole("tab", { name: "网格", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await selected(list) === "网格");
        expect(await basic.innerText()).toBe("当前: 列表");
        const md = await tablist(example(p, "基础")).getByRole("tab").first()
          .evaluate((e) => {
            const c = getComputedStyle(e);
            return { font: c.fontSize, pad: c.paddingTop };
          });
        expect(md).toEqual({ font: "14px", pad: "8px" });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Segmented options 含 disabled @${width}：禁用项坐标点击无效，可选项可切`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/segmented");
        await p.setViewportSize({ width, height: 900 });
        const list = tablist(example(p, "options 含 disabled"));
        const tabs = list.getByRole("tab");
        expect(await tabs.allTextContents()).toEqual([
          "列表",
          "网格",
          "卡片",
          "禁用",
        ]);
        const banned = tabs.nth(3);
        expect(await banned.getAttribute("data-disabled")).toBe("true");
        expect(await banned.isDisabled()).toBe(true);
        expect(
          Number(await banned.evaluate((e) => getComputedStyle(e).opacity)),
        )
          .toBeCloseTo(0.6, 2);
        await list.getByRole("tab", { name: "网格", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await selected(list) === "网格");
        const box = await banned.boundingBox();
        if (!box) throw new Error("disabled tab has no box");
        await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
          delay: 180,
        });
        expect(await selected(list)).toBe("网格");
        expect(
          await example(p, "基础").locator("p").filter({ hasText: /^当前:/ })
            .innerText(),
        ).toBe("当前: 列表");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
