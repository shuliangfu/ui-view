/** WRITTEN-UNRUN: all 13 live Modal examples, native input only. No browser execution before inventory is written. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open } from "./driver.ts";

const box = (dialog: Locator) => dialog.locator(":scope > div").last();
const text = async (el: Locator) =>
  (await el.innerText()).replace(/\s+/g, " ").trim();
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1.5);
async function rect(el: Locator) {
  const r = await el.boundingBox();
  if (!r) throw Error("Visible Modal box required");
  return r;
}
async function begin(
  p: Page,
  opener: string,
  title: string | null,
  content: string,
) {
  const button = p.getByRole("button", { name: opener, exact: true });
  const overflow = await p.evaluate(() => document.body.style.overflow);
  await button.click({ delay: 180 });
  const dialog = p.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  expect(await dialog.count()).toBe(1);
  expect(await dialog.getAttribute("aria-modal")).toBe("true");
  expect(
    await dialog.evaluate((e) =>
      document.body.contains(e) && document.querySelector("main") !== null &&
      !document.querySelector("main")!.contains(e)
    ),
  ).toBe(true);
  if (title !== null) {
    expect(
      await dialog.getByRole("heading", { name: title, exact: true }).count(),
    ).toBe(1);
    expect(await dialog.getAttribute("aria-labelledby")).toBe("modal-title");
  } else {
    expect(await dialog.getByRole("heading").count()).toBe(0);
    expect(await dialog.getAttribute("aria-labelledby")).toBe(null);
  }
  await eventually(async () =>
    await text(box(dialog).locator("p")) === content
  );
  expect(await text(box(dialog).locator("p"))).toBe(content);
  await eventually(async () =>
    await p.evaluate(() => document.body.style.overflow) === "hidden"
  );
  return { dialog, button, overflow };
}
async function ended(p: Page, state: Awaited<ReturnType<typeof begin>>) {
  await eventually(async () => await p.getByRole("dialog").count() === 0);
  expect(await p.evaluate(() => document.body.style.overflow)).toBe(
    state.overflow,
  );
  await eventually(async () =>
    await state.button.evaluate((e) => document.activeElement === e)
  );
}
async function mask(dialog: Locator) {
  expect(await dialog.locator("[data-dreamer-overlay]").count()).toBe(1);
  // A native held click outside the centered box; no dispatchEvent / framework callback.
  await dialog.locator("[data-dreamer-overlay]").click({
    position: { x: 4, y: 4 },
    delay: 180,
  });
}
async function stillOpen(p: Page, dialog: Locator) {
  expect(await dialog.isVisible()).toBe(true);
  expect(await p.getByRole("dialog").count()).toBe(1);
  expect(await p.evaluate(() => document.body.style.overflow)).toBe("hidden");
}
async function close(
  p: Page,
  s: Awaited<ReturnType<typeof begin>>,
  name = "关闭",
  key?: string,
) {
  const b = s.dialog.getByRole("button", { name, exact: true });
  if (key) await b.press(key);
  else await b.click({ delay: 180 });
  await ended(p, s);
}
describe("Modal physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Modal 基础用法 @${width}：全部关闭路径/正文不关闭/焦点圈与恢复`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        for (const action of ["确定", "取消", "关闭", "遮罩"]) {
          const s = await begin(
            p,
            "打开 Modal",
            "弹窗标题",
            "这里是弹层内容区域，可放置表单、说明或自定义节点。",
          );
          const buttons = s.dialog.getByRole("button");
          expect(await buttons.allTextContents()).toEqual(["", "确定", "取消"]);
          const yes = s.dialog.getByRole("button", {
              name: "确定",
              exact: true,
            }),
            no = s.dialog.getByRole("button", { name: "取消", exact: true }),
            x = s.dialog.getByRole("button", { name: "关闭", exact: true });
          expect((await rect(yes)).x).toBeLessThan((await rect(no)).x);
          await eventually(async () =>
            await x.evaluate((e) => document.activeElement === e)
          );
          await p.keyboard.press("Shift+Tab");
          expect(await no.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await p.keyboard.press("Tab");
          expect(await x.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await p.keyboard.press("Tab");
          expect(await yes.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await p.keyboard.press("Tab");
          expect(await no.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await p.keyboard.press("Tab");
          expect(await x.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await s.dialog.locator("p").click({ delay: 180 });
          await p.keyboard.press("Escape");
          await stillOpen(p, s.dialog);
          if (action === "遮罩") {
            await mask(s.dialog);
            await ended(p, s);
          } else {await close(
              p,
              s,
              action,
              action === "确定"
                ? "Enter"
                : action === "取消"
                ? "Space"
                : undefined,
            );}
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    for (
      const demo of [
        {
          label: "无 Footer",
          opener: "无 Footer Modal",
          title: "仅标题与内容",
          content: "不传 footer 时不显示底部按钮区。",
        },
        {
          label: "无标题",
          opener: "无标题 Modal",
          title: null,
          content: "无标题栏，仅内容与关闭按钮。",
        },
      ]
    ) {
      it(
        `Modal ${demo.label} @${width}：结构/关闭与重开`,
        async (t) => {
          const p = await open(t, "/desktop/feedback/modal");
          await p.setViewportSize({ width, height: 900 });
          for (const key of ["Enter", "Space"]) {
            const s = await begin(p, demo.opener, demo.title, demo.content);
            expect(await box(s.dialog).locator(":scope > .border-t").count())
              .toBe(0);
            expect(await s.dialog.getByRole("button").count()).toBe(1);
            if (demo.title === null) {
              const padding = await box(s.dialog).locator(
                ":scope > div.overflow-y-auto",
              ).evaluate((
                e,
              ) => [
                getComputedStyle(e).paddingTop,
                getComputedStyle(e).paddingRight,
              ]);
              expect(padding).toEqual(["48px", "48px"]);
            }
            await s.dialog.locator("p").click({ delay: 180 });
            await stillOpen(p, s.dialog);
            await close(p, s, "关闭", key);
          }
          const s = await begin(p, demo.opener, demo.title, demo.content);
          await mask(s.dialog);
          await ended(p, s);
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `Modal 无关闭按钮 @${width}：无按钮/ESC与正文不关/真实遮罩关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const s = await begin(
          p,
          "无关闭按钮",
          "只能点遮罩关闭",
          "未显示关闭按钮，请点击遮罩关闭。",
        );
        expect(await s.dialog.getByRole("button").count()).toBe(0);
        await eventually(async () =>
          await s.dialog.evaluate((e) => document.activeElement === e)
        );
        await p.keyboard.press("Tab");
        expect(await s.dialog.evaluate((e) => document.activeElement === e))
          .toBe(
            true,
          );
        await p.keyboard.press("Escape");
        await s.dialog.locator("p").click();
        await stillOpen(p, s.dialog);
        await mask(s.dialog);
        await ended(p, s);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 点击遮罩不关闭 @${width}：遮罩与ESC不关/关闭按钮生效`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const s = await begin(
          p,
          "遮罩不可关闭",
          "点击遮罩不关闭",
          "只能通过关闭按钮关闭。",
        );
        await mask(s.dialog);
        await p.keyboard.press("Escape");
        await stillOpen(p, s.dialog);
        expect(await text(s.dialog.locator("p"))).toBe(
          "只能通过关闭按钮关闭。",
        );
        await close(p, s);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 无遮罩 @${width}：背景原生命中/正文不关/ESC和关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        for (const action of ["Escape", "关闭"]) {
          const s = await begin(
            p,
            "打开无遮罩 Modal",
            "无遮罩",
            "无遮罩层，可看到背后文档；请点右上角关闭或按 Esc。",
          );
          expect(await s.dialog.locator("[data-dreamer-overlay]").count()).toBe(
            0,
          );
          expect(
            await s.dialog.evaluate((e) => getComputedStyle(e).pointerEvents),
          ).toBe("none");
          expect(
            await box(s.dialog).evaluate((e) =>
              getComputedStyle(e).pointerEvents
            ),
          ).toBe("auto");
          await p.evaluate(() => {
            document.body.dataset.modalBackgroundHit = "";
            document.addEventListener("click", (e) => {
              document.body.dataset.modalBackgroundHit = JSON.stringify({
                trusted: e.isTrusted,
                outside: !(e.target as Element).closest(
                  "[data-ui-modal-panel]",
                ),
              });
            }, { capture: true, once: true });
          });
          await p.mouse.click(4, 4, { delay: 180 });
          expect(
            await p.evaluate(() =>
              JSON.parse(document.body.dataset.modalBackgroundHit!)
            ),
          ).toEqual({ trusted: true, outside: true });
          await s.dialog.locator("p").click();
          await stillOpen(p, s.dialog);
          if (action === "Escape") {
            await p.keyboard.press("Escape");
            await ended(p, s);
          } else await close(p, s);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 自定义宽度 @${width}：全部六宽度/顺序切换/百分比与视口边界`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const sizes: Record<string, number> = {
          xs: 400,
          sm: 520,
          md: 640,
          lg: 800,
          xl: 960,
          "80%": width * .8,
        };
        for (const preset of ["xs", "sm", "md", "lg", "xl", "80%", "xs"]) {
          const content = preset === "80%"
            ? 'width="80%" 时弹层占视口宽度 80%。'
            : `width="${preset}"：xs 400px / sm 520px / md 640px / lg 800px / xl 960px。`;
          for (
            const action of preset === "80%"
              ? ["关闭", "遮罩"]
              : ["确定", "取消", "关闭", "遮罩"]
          ) {
            const s = await begin(p, preset, `宽度 ${preset}`, content);
            const r = await rect(box(s.dialog));
            near(r.width, Math.min(sizes[preset], width - 32));
            near(r.x + r.width / 2, width / 2);
            expect(r.x).toBeGreaterThanOrEqual(15);
            expect(r.x + r.width).toBeLessThanOrEqual(width - 15);
            if (action === "遮罩") {
              await mask(s.dialog);
              await ended(p, s);
            } else {await close(
                p,
                s,
                action,
                action === "确定"
                  ? "Enter"
                  : action === "取消"
                  ? "Space"
                  : undefined,
              );}
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(`Modal 不垂直居中 @${width}：固定顶距/关闭重开`, async (t) => {
      const p = await open(t, "/desktop/feedback/modal");
      await p.setViewportSize({ width, height: 900 });
      for (const path of ["mask", "close"]) {
        const s = await begin(
          p,
          "顶部对齐",
          "顶部对齐",
          "弹层在视口上方，非垂直居中。",
        );
        const r = await rect(box(s.dialog));
        near(r.y, width < 640 ? 48 : 64);
        near(r.x + r.width / 2, width / 2);
        if (path === "mask") {
          await mask(s.dialog);
          await ended(p, s);
        } else await close(p, s);
      }
    }, DOCS_BROWSER_CONFIG);

    it(
      `Modal 关闭后销毁 @${width}：物理关闭后节点脱离/重开为新节点`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const content = "关闭后此内容会被销毁，再次打开会重新挂载。";
        const s = await begin(p, "关闭后销毁", "关闭后销毁内容", content);
        const old = await s.dialog.locator("p").elementHandle();
        if (!old) throw Error("Destroy demo content required");
        try {
          await close(p, s);
          expect(await old.evaluate((e) => e.isConnected)).toBe(false);
          expect(await p.getByText(content, { exact: true }).count()).toBe(0);
          const next = await begin(p, "关闭后销毁", "关闭后销毁内容", content);
          expect(
            await next.dialog.locator("p").evaluate(
              (e, prior) => e === prior,
              old,
            ),
          ).toBe(false);
          await mask(next.dialog);
          await ended(p, next);
        } finally {
          await old.dispose();
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 可移动 @${width}：按住跨timer/拖动/松开停止/四边约束/重开复位`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const content = "拖拽上方标题栏可移动弹层位置。";
        const s = await begin(p, "可移动弹窗", "可拖拽标题栏移动", content);
        const b = box(s.dialog), initial = await rect(b);
        const header = s.dialog.getByRole("heading", {
          name: "可拖拽标题栏移动",
          exact: true,
        }).locator("../..");
        const drag = async (x: number, y: number) => {
          const h = await rect(header);
          await p.mouse.move(h.x + 24, h.y + 20);
          await p.mouse.down();
          await p.waitForTimeout(180);
          await p.mouse.move(x, y, { steps: 8 });
          await p.mouse.up();
        };
        const h = await rect(header);
        await drag(h.x + 24 + 8, h.y + 20 + 30);
        await eventually(async () =>
          Math.abs((await rect(b)).x - initial.x - 8) <= 1.5 &&
          Math.abs((await rect(b)).y - initial.y - 30) <= 1.5
        );
        const moved = await rect(b);
        await p.mouse.move(2, 2, { steps: 4 });
        near((await rect(b)).x, moved.x);
        near((await rect(b)).y, moved.y);
        await drag(0, 0);
        near((await rect(b)).x, 0);
        near((await rect(b)).y, 0);
        await drag(width - 1, 899);
        const end = await rect(b);
        near(end.x + end.width, width);
        near(end.y + end.height, 900);
        await close(p, s, "取消");
        const again = await begin(p, "可移动弹窗", "可拖拽标题栏移动", content);
        near((await rect(box(again.dialog))).x, initial.x);
        near((await rect(box(again.dialog))).y, initial.y);
        await close(p, again, "确定", "Enter");
        const last = await begin(p, "可移动弹窗", "可拖拽标题栏移动", content);
        await close(p, last);
        const masked = await begin(
          p,
          "可移动弹窗",
          "可拖拽标题栏移动",
          content,
        );
        await mask(masked.dialog);
        await ended(p, masked);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 支持 ESC @${width}：连续打开按键关闭及普通关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        for (const action of ["Escape", "Escape", "close", "mask"]) {
          const s = await begin(
            p,
            "按 Esc 关闭",
            "按 Esc 可关闭",
            "打开后按键盘 Esc 可关闭此弹窗。",
          );
          if (action === "Escape") {
            await p.keyboard.press("Escape");
            await ended(p, s);
          } else if (action === "mask") {
            await mask(s.dialog);
            await ended(p, s);
          } else await close(p, s);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 全屏 @${width}：两实例初态/全屏还原/关闭重置与精确几何`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const fullscreen = async (d: Locator, full: boolean) => {
          const r = await rect(box(d));
          near(r.width, full ? width : Math.min(520, width - 32));
          if (full) {
            near(r.x, 0);
            near(r.y, 0);
            near(r.height, 900);
          } else {
            near(r.x + r.width / 2, width / 2);
            near(r.y + r.height / 2, 450);
          }
          expect(
            await box(d).evaluate((e) =>
              getComputedStyle(e).borderTopLeftRadius
            ),
          ).toBe(full ? "0px" : "12px");
          expect(
            await d.getByRole("button", {
              name: full ? "退出全屏" : "全屏",
              exact: true,
            }).count(),
          ).toBe(1);
        };
        for (const initial of [false, true]) {
          const opener = initial ? "打开即全屏" : "可全屏（标题栏切换）",
            title = initial ? "打开即全屏" : "可全屏",
            content = initial
              ? "打开时已是全屏，仍可用标题栏按钮退出全屏。"
              : "点击标题栏右侧按钮可进入/退出全屏。";
          const s = await begin(p, opener, title, content);
          await fullscreen(s.dialog, initial);
          await s.dialog.getByRole("button", {
            name: initial ? "退出全屏" : "全屏",
            exact: true,
          }).click({ delay: 180 });
          await fullscreen(s.dialog, !initial);
          await s.dialog.getByRole("button", {
            name: initial ? "全屏" : "退出全屏",
            exact: true,
          }).press("Enter");
          await fullscreen(s.dialog, initial);
          await s.dialog.getByRole("button", {
            name: initial ? "退出全屏" : "全屏",
            exact: true,
          }).press("Space");
          await fullscreen(s.dialog, !initial);
          await close(p, s);
          const reopened = await begin(p, opener, title, content);
          await fullscreen(reopened.dialog, initial);
          if (initial) {
            await reopened.dialog.getByRole("button", {
              name: "退出全屏",
              exact: true,
            }).click({ delay: 180 });
            await fullscreen(reopened.dialog, false);
          }
          await mask(reopened.dialog);
          await ended(p, reopened);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Modal 自定义样式 @${width}：实际ring/正文背景与关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/modal");
        await p.setViewportSize({ width, height: 900 });
        const s = await begin(
          p,
          "自定义 class",
          "自定义样式",
          "弹层加了 ring，内容区加了背景色（bodyClass）。",
        );
        expect(
          await box(s.dialog).evaluate((e) =>
            e.classList.contains("ring-2") &&
            e.classList.contains("ring-blue-500")
          ),
        ).toBe(true);
        expect(
          await box(s.dialog).evaluate((e) =>
            getComputedStyle(e).getPropertyValue("--tw-ring-shadow")
          ),
        ).toContain("2px");
        expect(
          await box(s.dialog).evaluate((e) => getComputedStyle(e).boxShadow),
        )
          .not.toBe("none");
        const body = box(s.dialog).locator(":scope > div.overflow-y-auto");
        expect(await body.evaluate((e) => e.classList.contains("bg-slate-50")))
          .toBe(true);
        expect(await body.evaluate((e) => getComputedStyle(e).backgroundColor))
          .not.toBe("rgba(0, 0, 0, 0)");
        await s.dialog.locator("p").click();
        await stillOpen(p, s.dialog);
        await close(p, s, "关闭", "Space");
        const reopened = await begin(
          p,
          "自定义 class",
          "自定义样式",
          "弹层加了 ring，内容区加了背景色（bodyClass）。",
        );
        await mask(reopened.dialog);
        await ended(p, reopened);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
