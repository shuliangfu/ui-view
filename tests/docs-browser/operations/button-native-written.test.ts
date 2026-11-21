/** WRITTEN-UNRUN. Real buttons, trusted event ordering across a held press, exact console callback results and geometry. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, docsDemo, eventually, example, open } from "./driver.ts";
const variants = [
  "default",
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
  "ghost",
  "link",
];
type NativeRecord = {
  kind: string;
  trusted: boolean;
  time: number;
  text: string;
};
type ObservedWindow = Window & { __docsNativeButtonEvents?: NativeRecord[] };
async function observe(p: Page) {
  await p.evaluate(() => {
    (globalThis as unknown as ObservedWindow).__docsNativeButtonEvents = [];
    for (
      const kind of [
        "pointerdown",
        "mousedown",
        "pointerup",
        "mouseup",
        "click",
      ]
    ) {
      document.addEventListener(kind, (event) => {
        const button = (event.target as Element)?.closest("button");
        if (!button) return;
        (globalThis as unknown as ObservedWindow).__docsNativeButtonEvents!
          .push({
            kind: event.type,
            trusted: event.isTrusted,
            time: event.timeStamp,
            text: button.textContent!.trim(),
          });
      }, true);
    }
  });
}
async function events(p: Page) {
  return await p.evaluate(() =>
    (globalThis as unknown as ObservedWindow).__docsNativeButtonEvents ?? []
  );
}
async function activate(p: Page, b: Locator, mode: string) {
  await p.evaluate(() => {
    (globalThis as unknown as ObservedWindow).__docsNativeButtonEvents = [];
  });
  const label = (await b.innerText()).trim();
  if (mode === "mouse") await b.click({ delay: 180 });
  else await b.press(mode);
  const records = await events(p),
    clicks = records.filter((r) => r.kind === "click");
  expect(clicks.length).toBe(1);
  expect(clicks[0].trusted).toBe(true);
  expect(clicks[0].text).toBe(label);
  if (mode === "mouse") {
    expect(records.map((r) => r.kind)).toEqual([
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "click",
    ]);
    expect(records.every((r) => r.trusted)).toBe(true);
    expect(records[2].time - records[0].time >= 150).toBe(true);
  }
  expect(await b.evaluate((e) => document.activeElement === e)).toBe(true);
  expect((await b.innerText()).trim()).toBe(label);
}
async function disabledClick(p: Page, b: Locator) {
  expect(await b.isDisabled()).toBe(true);
  await b.scrollIntoViewIfNeeded();
  const box = await b.boundingBox();
  if (!box) throw Error("Disabled control has no hit box");
  await p.evaluate(() => {
    (globalThis as unknown as ObservedWindow).__docsNativeButtonEvents = [];
  });
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
    delay: 180,
  });
  expect((await events(p)).filter((r) => r.kind === "click").length).toBe(0);
  expect(await b.evaluate((e) => document.activeElement === e)).toBe(false);
}
async function sizes(b: Locator, index: number) {
  const expected =
    [["10px", "4px", "12px", "6px"], ["12px", "6px", "14px", "6px"], [
      "16px",
      "8px",
      "14px",
      "8px",
    ], ["20px", "10px", "16px", "8px"]][index];
  expect(
    await b.evaluate((e) => {
      const c = getComputedStyle(e);
      return [c.paddingLeft, c.paddingTop, c.fontSize, c.borderTopLeftRadius];
    }),
  ).toEqual(expected);
}
function previewButtons(root: Locator, nested = false): Locator {
  return nested
    ? root.locator(":scope > div > button")
    : root.locator(":scope > button");
}
describe("Button native written", () => {
  for (const width of [390, 1280]) {
    it(
      `Button variant 变体 @${width}：八种逐一鼠标键盘可信激活`,
      async (t) => {
        const p = await open(t, "/desktop/basic/button");
        await p.setViewportSize({ width, height: 900 });
        await observe(p);
        const s = example(p, "variant 变体"),
          buttons = previewButtons(s);
        expect(await buttons.allTextContents()).toEqual(variants);
        for (const [index, name] of variants.entries()) {
          const b = buttons.nth(index);
          await attr(b, "data-variant", name);
          await attr(b, "type", "button");
          expect(await b.evaluate((e) => e.tagName)).toBe("BUTTON");
          expect(await b.isEnabled()).toBe(true);
          for (const mode of ["mouse", "Enter", "Space"]) {
            await activate(p, b, mode);
          }
        }
        expect(new URL(p.url()).pathname).toBe("/desktop/basic/button");
        expect(await p.locator("main form").count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Button size 尺寸 @${width}：四档逐按钮几何与原生输入`,
      async (t) => {
        const p = await open(t, "/desktop/basic/button");
        await p.setViewportSize({ width, height: 900 });
        await observe(p);
        const b = previewButtons(example(p, "size 尺寸"));
        expect(await b.allTextContents()).toEqual(["xs", "sm", "md", "lg"]);
        for (let i = 0; i < 4; i++) {
          await sizes(b.nth(i), i);
          for (const mode of ["mouse", "Enter", "Space"]) {
            await activate(
              p,
              b.nth(i),
              mode,
            );
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Button block 撑满宽度 @${width}：两例实际宽度和独立激活`,
      async (t) => {
        const p = await open(t, "/desktop/basic/button");
        await p.setViewportSize({ width, height: 900 });
        await observe(p);
        const s = example(p, "block 撑满宽度"),
          b = previewButtons(s);
        expect(await b.allTextContents()).toEqual(["撑满宽度", "文字链也撑满"]);
        const parent = await b.first().locator("..").boundingBox();
        if (!parent) throw Error("Block parent missing");
        for (let i = 0; i < 2; i++) {
          const r = await b.nth(i).boundingBox();
          expect(Math.abs(r!.width - parent.width) < .1).toBe(true);
          expect(r!.x).toBe(parent.x);
          for (const mode of ["mouse", "Enter", "Space"]) {
            await activate(p, b.nth(i), mode);
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const loading of [false, true]) {
      const label = loading ? "loading 加载中" : "disabled";
      it(
        `Button ${label} @${width}：物理坐标不可激活/Tab越过/精确样式`,
        async (t) => {
          const p = await open(t, "/desktop/basic/button");
          await p.setViewportSize({ width, height: 900 });
          await observe(p);
          const b = previewButtons(example(p, label));
          expect(
            await b.allTextContents().then((xs) => xs.map((x) => x.trim())),
          ).toEqual(loading ? ["加载中", "提交中"] : variants);
          for (let i = 0; i < await b.count(); i++) {
            await disabledClick(p, b.nth(i));
            await attr(b.nth(i), "aria-busy", loading ? "true" : null);
            await attr(b.nth(i), "data-loading", loading ? "" : null);
            expect(
              await b.nth(i).evaluate((e) => getComputedStyle(e).opacity),
            ).toBe(loading ? "1" : "0.4");
            expect(
              await b.nth(i).evaluate((e) => getComputedStyle(e).pointerEvents),
            ).toBe("none");
            if (loading) {
              const svg = b.nth(i).locator("svg");
              expect(await svg.count()).toBe(1);
              expect(
                await svg.evaluate((e) => getComputedStyle(e).animationName),
              )
                .toBe("spin");
              expect(await svg.getAttribute("viewBox")).toBe("0 0 24 24");
            }
          }
          const previous = loading
            ? docsDemo(p, "disabled").getByRole("button", {
              name: "复制",
              exact: true,
            })
            : docsDemo(p, "block 撑满宽度").getByRole("button", {
              name: "复制",
              exact: true,
            });
          await previous.press("Tab");
          expect(
            await b.evaluateAll((es) =>
              es.some((e) => e === document.activeElement)
            ),
          ).toBe(false);
          expect((await events(p)).filter((e) => e.kind === "click").length)
            .toBe(
              0,
            );
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      `Button type 按钮类型 @${width}：原生type正确/无form不伪称提交重置`,
      async (t) => {
        const p = await open(t, "/desktop/basic/button");
        await p.setViewportSize({ width, height: 900 });
        await observe(p);
        const b = previewButtons(example(p, "type 按钮类型"));
        expect(await b.allTextContents()).toEqual([
          "button",
          "submit",
          "reset",
        ]);
        for (const [i, type] of ["button", "submit", "reset"].entries()) {
          await attr(b.nth(i), "type", type);
          expect(await b.nth(i).evaluate((e) => (e as HTMLButtonElement).form))
            .toBe(null);
          for (const mode of ["mouse", "Enter", "Space"]) {
            await activate(p, b.nth(i), mode);
          }
        }
        expect(new URL(p.url()).pathname).toBe("/desktop/basic/button");
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const attached of [true, false]) {
      const label = attached
        ? "ButtonGroup 按钮组（默认紧凑相连）"
        : "ButtonGroup attached=false（保留间距）";
      it(
        `Button ${label} @${width}：完整几何/实际回调与键盘焦点`,
        async (t) => {
          const p = await open(t, "/desktop/basic/button");
          await p.setViewportSize({ width, height: 900 });
          await observe(p);
          const group = example(p, label).getByRole("group"),
            b = group.getByRole("button");
          expect(await b.allTextContents().then((a) => a.map((t) => t.trim())))
            .toEqual(["刷新", "导出"]);
          expect(await group.evaluate((e) => getComputedStyle(e).columnGap))
            .toBe(
              attached ? "0px" : "8px",
            );
          const a = await b.nth(0).boundingBox(),
            z = await b.nth(1).boundingBox();
          expect(Math.abs(z!.x - a!.x - a!.width - (attached ? 0 : 8)) < .1)
            .toBe(
              true,
            );
          expect(
            await b.evaluateAll((es) =>
              es.map((e) => {
                const c = getComputedStyle(e);
                return [
                  c.borderTopLeftRadius,
                  c.borderTopRightRadius,
                  c.borderBottomLeftRadius,
                  c.borderBottomRightRadius,
                ];
              })
            ),
          ).toEqual(
            attached
              ? [["6px", "0px", "6px", "0px"], ["0px", "6px", "0px", "6px"]]
              : [["6px", "6px", "6px", "6px"], ["6px", "6px", "6px", "6px"]],
          );
          const messages: string[] = [];
          const listener = (
            message: { type: () => string; text: () => string },
          ) => {
            if (
              message.type() === "log" &&
              ["刷新", "导出"].includes(message.text())
            ) messages.push(message.text());
          };
          p.on("console", listener);
          try {
            for (const [i, text] of ["刷新", "导出"].entries()) {
              for (const mode of ["mouse", "Enter", "Space"]) {
                const count = messages.length;
                await activate(p, b.nth(i), mode);
                if (attached) {
                  await eventually(() => messages.length === count + 1);
                  expect(messages.at(-1)).toBe(text);
                } else expect(messages.length).toBe(0);
              }
            }
          } finally {
            p.off("console", listener);
          }
          await b.nth(0).press("Tab");
          expect(
            await b.nth(1).evaluate((e) => e === document.activeElement),
          ).toBe(true);
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
