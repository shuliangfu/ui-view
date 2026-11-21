/** WRITTEN-UNRUN. Native Dialog close/loading and Overlay click-through/scroll contracts. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";
const box = (dialog: Locator) => dialog.locator(":scope > div").last();
async function bounds(el: Locator) {
  const r = await el.boundingBox();
  if (!r) throw Error("Visible physical target required");
  return r;
}
const near = (a: number, b: number) =>
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1.5);
async function scroll(p: Page, expected: string) {
  await eventually(async () =>
    await p.evaluate(() => document.body.style.overflow) === expected
  );
}
async function overlayState(el: Locator, shown: boolean) {
  // opacity-zero overlays remain in the DOM: isVisible() would NOT prove their state.
  expect(await el.count()).toBe(1);
  expect(await el.getAttribute("aria-hidden")).toBe(shown ? null : "true");
  await eventually(async () =>
    await el.evaluate((e) => getComputedStyle(e).opacity) ===
      (shown ? "1" : "0")
  );
  expect(await el.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe(
    shown ? "auto" : "none",
  );
}
describe("Dialog Overlay written", () => {
  for (const width of [390, 1280]) {
    for (
      const demo of [
        {
          label: "基础用法",
          opener: "打开 Dialog",
          title: "确认操作",
          content: "确定要执行该操作吗？",
          confirm: "确定",
          variant: "primary",
        },
        {
          label: "警告确认（warning）",
          opener: "警告确认",
          title: "警告",
          content: "该操作可能影响其他用户，是否继续？",
          confirm: "仍要继续",
          variant: "warning",
        },
        {
          label: "危险操作（danger）",
          opener: "危险操作",
          title: "删除确认",
          content: "删除后无法恢复，确定要删除吗？",
          confirm: "删除",
          variant: "danger",
        },
      ]
    ) {
      it(
        `Dialog ${demo.label} @${width}：五关闭路径/定取顺序/真实状态`,
        async (t) => {
          const p = await open(t, "/desktop/feedback/dialog");
          await p.setViewportSize({ width, height: 900 });
          const opener = example(p, demo.label).getByRole("button", {
            name: demo.opener,
            exact: true,
          });
          const before = await p.evaluate(() => document.body.style.overflow);
          for (const action of ["confirm", "取消", "关闭", "Escape", "mask"]) {
            await opener.click({ delay: 180 });
            const d = p.getByRole("dialog");
            await d.waitFor({ state: "visible" });
            await scroll(p, "hidden");
            expect(await p.getByRole("dialog").count()).toBe(1);
            expect(
              await d.getByRole("heading", { name: demo.title, exact: true })
                .count(),
            ).toBe(1);
            expect(await d.getByText(demo.content, { exact: true }).innerText())
              .toBe(
                demo.content,
              );
            expect(await d.getAttribute("aria-modal")).toBe("true");
            const yes = d.getByRole("button", {
                name: demo.confirm,
                exact: true,
              }),
              no = d.getByRole("button", { name: "取消", exact: true });
            expect(await yes.getAttribute("data-variant")).toBe(demo.variant);
            expect(await yes.isDisabled()).toBe(false);
            expect(await no.isDisabled()).toBe(false);
            expect(await yes.getAttribute("aria-busy")).toBe(null);
            expect((await bounds(yes)).x).toBeLessThan((await bounds(no)).x);
            near((await bounds(yes)).y, (await bounds(no)).y);
            near((await bounds(box(d))).width, Math.min(520, width - 32));
            await d.getByText(demo.content, { exact: true }).click({
              delay: 180,
            });
            expect(await d.isVisible()).toBe(true);
            if (action === "Escape") await p.keyboard.press("Escape");
            else if (action === "mask") {
              await d.locator("[data-dreamer-overlay]").click({
                position: { x: 4, y: 4 },
                delay: 180,
              });
            } else {
              const button = action === "confirm"
                ? yes
                : d.getByRole("button", { name: action, exact: true });
              if (action === "取消") await button.press("Space");
              else if (action === "confirm") await button.press("Enter");
              else await button.click({ delay: 180 });
            }
            await eventually(async () =>
              await p.getByRole("dialog").count() === 0
            );
            await scroll(p, before);
            await eventually(async () =>
              await opener.evaluate((e) => document.activeElement === e)
            );
          }
          // These examples only close their local modal; there is no business deletion/save callback to invent.
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `Dialog 确定 Loading（confirmLoading） @${width}：两禁用钮坐标点击/键盘跳过/允许关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/dialog");
        await p.setViewportSize({ width, height: 900 });
        const opener = example(p, "确定 Loading（confirmLoading）").getByRole(
          "button",
          { name: "确定 Loading", exact: true },
        );
        const before = await p.evaluate(() => document.body.style.overflow);
        for (const action of ["mask", "Escape", "关闭"]) {
          await opener.click({ delay: 180 });
          const d = p.getByRole("dialog");
          await d.waitFor({ state: "visible" });
          expect(
            await d.getByRole("heading", { name: "提交中", exact: true })
              .count(),
          ).toBe(1);
          expect(
            await d.getByText("确定后将显示 loading 状态，常用于异步提交。", {
              exact: true,
            }).innerText(),
          ).toBe("确定后将显示 loading 状态，常用于异步提交。");
          const yes = d.getByRole("button", { name: "确定", exact: true }),
            no = d.getByRole("button", { name: "取消", exact: true }),
            x = d.getByRole("button", { name: "关闭", exact: true });
          expect(await yes.isDisabled()).toBe(true);
          expect(await no.isDisabled()).toBe(true);
          expect(await yes.getAttribute("aria-busy")).toBe("true");
          expect(await yes.getAttribute("data-variant")).toBe("primary");
          expect(await yes.locator("svg.animate-spin").count()).toBe(1);
          expect(await yes.evaluate((e) => getComputedStyle(e).opacity)).toBe(
            "1",
          );
          expect(await no.getAttribute("aria-busy")).toBe(null);
          for (const target of [yes, no]) {
            const r = await bounds(target);
            await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2, {
              delay: 180,
            });
            expect(await d.isVisible()).toBe(true);
            expect(await yes.isDisabled()).toBe(true);
            expect(await no.isDisabled()).toBe(true);
          }
          await x.focus();
          for (const key of ["Tab", "Shift+Tab"]) {
            await p.keyboard.press(key);
            expect(await x.evaluate((e) => document.activeElement === e)).toBe(
              true,
            );
          }
          await scroll(p, "hidden");
          if (action === "mask") {
            await d.locator("[data-dreamer-overlay]").click({
              position: { x: 4, y: 4 },
              delay: 180,
            });
          } else if (action === "Escape") await p.keyboard.press("Escape");
          else await x.press("Enter");
          await eventually(async () =>
            await p.getByRole("dialog").count() === 0
          );
          await scroll(p, before);
          await eventually(async () =>
            await opener.evaluate((e) => document.activeElement === e)
          );
        }
        // confirmLoading is constant true in this live demo, not an asynchronous completion demo.
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Overlay 默认 Portal @${width}：body几何/锁滚动/点击关闭与重开`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/overlay");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "默认 Portal"),
          opener = root.getByRole("button", { name: "打开遮罩", exact: true });
        const overlay = p.locator('[data-dreamer-overlay][aria-label="遮罩"]');
        // The local example uses the same label, so distinguish portal placement rather than first()/nth().
        const portal = overlay.locator("xpath=self::*[not(ancestor::main)]");
        const before = await p.evaluate(() => document.body.style.overflow);
        await overlayState(portal, false);
        expect(await root.locator("[data-dreamer-overlay]").count()).toBe(0);
        for (const key of ["mouse", "Enter", "Space"]) {
          if (key === "mouse") await opener.click({ delay: 180 });
          else await opener.press(key);
          await overlayState(portal, true);
          await scroll(p, "hidden");
          const r = await bounds(portal);
          near(r.x, 0);
          near(r.y, 0);
          near(r.width, width);
          near(r.height, 900);
          expect(await portal.evaluate((e) => getComputedStyle(e).position))
            .toBe(
              "fixed",
            );
          expect(await portal.evaluate((e) => getComputedStyle(e).zIndex)).toBe(
            "400",
          );
          await p.keyboard.press("Escape");
          await overlayState(portal, true);
          await portal.click({ position: { x: 4, y: 4 }, delay: 180 });
          await overlayState(portal, false);
          await scroll(p, before);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Overlay 局部 portal=false @${width}：框内几何/不锁body/框外不关/框内关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/overlay");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "局部 portal=false"),
          opener = root.getByRole("button", { name: "框内遮罩", exact: true });
        const local = root.locator("[data-dreamer-overlay]"),
          parent = local.locator("..");
        const before = await p.evaluate(() => document.body.style.overflow);
        await overlayState(local, false);
        for (const key of ["Enter", "Space"]) {
          await opener.press(key);
          await overlayState(local, true);
          await scroll(p, before);
          const outer = await bounds(parent), inner = await bounds(local);
          expect(await local.evaluate((e) => getComputedStyle(e).position))
            .toBe(
              "absolute",
            );
          expect(await local.evaluate((e) => getComputedStyle(e).zIndex)).toBe(
            "10",
          );
          near(outer.height, 160);
          near(inner.x, outer.x + 1);
          near(inner.y, outer.y + 1);
          near(inner.width, outer.width - 2);
          near(inner.height, outer.height - 2);
          expect(
            await local.evaluate((e) => e.closest("main") !== null),
          ).toBe(true);
          await p.getByRole("heading", {
            name: "局部 portal=false",
            exact: true,
          }).click({ delay: 180 });
          await overlayState(local, true);
          await local.click({
            position: { x: inner.width / 2, y: inner.height / 2 },
            delay: 180,
          });
          await overlayState(local, false);
          await scroll(p, before);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Overlay clickable=false @${width}：真点遮罩不关、ESC 不关、强制关闭可点`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/overlay");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "clickable=false"),
          opener = root.getByRole("button", {
            name: "打开（点遮罩不关）",
            exact: true,
          });
        const overlay = p.locator(
          '[data-dreamer-overlay][aria-label="不可点遮罩"]',
        );
        const before = await p.evaluate(() => document.body.style.overflow);
        await opener.click({ delay: 180 });
        await overlayState(overlay, true);
        await scroll(p, "hidden");
        await overlay.click({ position: { x: 4, y: 4 }, delay: 180 });
        await overlayState(overlay, true);
        await p.keyboard.press("Escape");
        await overlayState(overlay, true);
        const close = overlay.getByRole("button", {
          name: "强制关闭",
          exact: true,
        });
        expect(await close.count()).toBe(1);
        expect(
          await close.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const top = document.elementFromPoint(
              r.left + r.width / 2,
              r.top + r.height / 2,
            );
            return top === el || el.contains(top);
          }),
        ).toBe(true);
        await close.click({ delay: 180 });
        await overlayState(overlay, false);
        await scroll(p, before);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
