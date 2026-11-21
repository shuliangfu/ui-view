/** WRITTEN-UNRUN. The drawer docs page has no h3 titles; these three live openers are the actual examples. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open } from "./driver.ts";

const panel = (d: Locator) => d.locator("[data-ui-drawer-panel]");
const near = (a: number, b: number) =>
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1.5);

async function boxOf(el: Locator) {
  const r = await el.boundingBox();
  if (!r) throw Error("Visible drawer geometry required");
  return r;
}

async function begin(
  p: Page,
  opener: string,
  title: string,
  content: string,
  side: "left" | "right",
  widthPx: number,
) {
  const button = p.getByRole("button", { name: opener, exact: true });
  await button.click({ delay: 180 });
  const dialog = p.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  expect(await p.getByRole("dialog").count()).toBe(1);
  expect(await dialog.getAttribute("aria-modal")).toBe("true");
  expect(await dialog.getAttribute("aria-labelledby")).toBe("drawer-title");
  expect(
    await dialog.evaluate((e) =>
      document.body.contains(e) && document.querySelector("main") !== null &&
      !document.querySelector("main")!.contains(e)
    ),
  ).toBe(true);
  await eventually(async () =>
    await p.evaluate(() => document.body.style.overflow) === "hidden"
  );
  const box = panel(dialog);
  await eventually(async () => {
    const t = await box.evaluate((e) => getComputedStyle(e).transform);
    return t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
  });
  const r = await boxOf(box);
  const vw = p.viewportSize()!.width;
  near(r.width, Math.min(widthPx, vw));
  near(r.y, 0);
  near(r.height, 900);
  if (side === "right") near(r.x + r.width, vw);
  else near(r.x, 0);
  expect(await dialog.locator("p").innerText()).toBe(content);
  expect(await dialog.locator("#drawer-title").innerText()).toContain(title);
  return { dialog, button, box };
}

async function ended(p: Page, opener: Locator) {
  await eventually(async () => await p.getByRole("dialog").count() === 0);
  expect(await p.evaluate(() => document.body.style.overflow)).toBe("");
  await eventually(async () =>
    await opener.evaluate((e) => document.activeElement === e)
  );
}

async function closeHow(p: Page, d: Locator, action: string) {
  if (action === "Escape") await p.keyboard.press("Escape");
  else if (action === "mask") {
    const overlay = d.locator("[data-dreamer-overlay]");
    const overlayBox = await overlay.boundingBox();
    const panelBox = await d.locator("[data-ui-drawer-panel]").boundingBox();
    if (!overlayBox || !panelBox) {
      throw Error("Visible drawer mask geometry required");
    }
    // 左侧抽屉盖住遮罩左上角，须点在露出的遮罩上；右侧抽屉点左上角即可。
    const x = panelBox.x <= overlayBox.x + 1
      ? Math.min(
        overlayBox.width - 4,
        panelBox.x + panelBox.width + 8 - overlayBox.x,
      )
      : 4;
    await overlay.click({
      position: { x, y: 4 },
      delay: 180,
    });
  } else {
    const btn = d.getByRole("button", { name: action, exact: true });
    if (action === "确定") await btn.press("Enter");
    else if (action === "关闭") await btn.press("Space");
    else await btn.click({ delay: 180 });
  }
}

describe("Drawer physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Drawer 右侧抽屉 @${width}：几何/底栏确定/四关闭路径/正文不关/焦点圈`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/drawer");
        await p.setViewportSize({ width, height: 900 });
        for (const action of ["确定", "关闭", "Escape", "mask"]) {
          const s = await begin(
            p,
            "右侧抽屉",
            "右侧抽屉",
            "抽屉内容区域，可放置表单或列表。",
            "right",
            360,
          );
          const x = s.dialog.getByRole("button", { name: "关闭", exact: true });
          const yes = s.dialog.getByRole("button", {
            name: "确定",
            exact: true,
          });
          expect(await yes.getAttribute("data-variant")).toBe("primary");
          expect(
            await s.dialog.locator("[data-ui-drawer-panel] > .border-t")
              .count(),
          ).toBe(1);
          await eventually(async () =>
            await x.evaluate((e) => document.activeElement === e)
          );
          await p.keyboard.press("Tab");
          expect(await yes.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await p.keyboard.press("Tab");
          expect(await x.evaluate((e) => document.activeElement === e)).toBe(
            true,
          );
          await s.dialog.locator("p").click({ delay: 180 });
          expect(await s.dialog.isVisible()).toBe(true);
          await closeHow(p, s.dialog, action);
          await ended(p, s.button);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Drawer 左侧抽屉 @${width}：320宽靠左/居中标题/无底栏/三关闭路径`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/drawer");
        await p.setViewportSize({ width, height: 900 });
        for (const action of ["关闭", "Escape", "mask"]) {
          const s = await begin(
            p,
            "左侧抽屉",
            "左侧抽屉",
            "从左侧滑出的面板，宽度 320px。",
            "left",
            320,
          );
          expect(
            await s.dialog.getByRole("button", { name: "确定", exact: true })
              .count(),
          ).toBe(0);
          expect(
            await s.dialog.locator("[data-ui-drawer-panel] > .border-t")
              .count(),
          ).toBe(0);
          const title = s.dialog.locator("#drawer-title");
          expect(await title.evaluate((e) => getComputedStyle(e).textAlign))
            .toBe(
              "center",
            );
          const close = s.dialog.getByRole("button", {
            name: "关闭",
            exact: true,
          });
          const tr = await boxOf(title), cr = await boxOf(close);
          expect(cr.x).toBeGreaterThan(tr.x + tr.width / 2);
          await s.dialog.locator("p").click({ delay: 180 });
          expect(await s.dialog.isVisible()).toBe(true);
          await closeHow(p, s.dialog, action);
          await ended(p, s.button);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Drawer 自定义标题（TSX） @${width}：VNode标题/无底栏/关闭恢复`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/drawer");
        await p.setViewportSize({ width, height: 900 });
        for (const action of ["关闭", "Escape", "mask"]) {
          const s = await begin(
            p,
            "自定义标题（TSX）",
            "自定义标题",
            "title 可传入任意 VNode，不限于纯文本。",
            "right",
            360,
          );
          const heading = s.dialog.locator("#drawer-title");
          expect(await heading.locator("strong").innerText()).toBe(
            "自定义标题",
          );
          expect(
            await heading.getByText("支持 TSX", { exact: true }).innerText(),
          )
            .toBe(
              "支持 TSX",
            );
          expect(await heading.evaluate((e) => e.tagName)).toBe("DIV");
          expect(
            await s.dialog.getByRole("button", { name: "确定", exact: true })
              .count(),
          ).toBe(0);
          await closeHow(p, s.dialog, action);
          await ended(p, s.button);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
