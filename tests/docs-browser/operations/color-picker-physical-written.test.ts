/** WRITTEN-UNRUN. Eleven ColorPicker live examples. Inventory titles with JSX leftovers are registered as-is; locators use rendered accessible names. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

/** Rendered heading text (not the inventory JSX leftovers). */
const HEAD = {
  form: "与 createForm",
  def: "默认（色块 + HEX + 右侧图标）",
  swatch: 'variant="swatch" 仅色块触发',
  toolbar: "showToolbar 面板顶栏",
  noSuffix: "showSuffixIcon={false} 隐藏右侧调色板图标",
  width: "class 控制宽度",
  disabled: "disabled",
  hideRing: "hideFocusRing 无聚焦蓝环",
  combo: "组合：swatch + showToolbar",
  size: "size（xs / sm / md / lg）",
  autoFocus: "自动聚焦",
};

async function openPage(t: Parameters<typeof open>[0], width: number) {
  if (!t?.browser?.page) {
    throw new Error("Physical tests require Playwright Page");
  }
  const page = t.browser.page as Page;
  await page.setViewportSize({ width, height: 900 });
  return await open(t, "/desktop/form/color-picker");
}

const triggerOf = (root: Locator) =>
  root.locator("button[aria-haspopup='dialog']").first();

const hiddenOf = (root: Locator) =>
  root.locator("input[type='hidden']").first();

const dialogOf = (root: Locator) =>
  root.page().getByRole("dialog", { name: "颜色选择" });

async function triggerHex(root: Locator) {
  const text = (await triggerOf(root).innerText()).trim().toLowerCase();
  if (text.startsWith("#")) return text;
  return (await hiddenOf(root).inputValue()).toLowerCase();
}

async function openPanel(root: Locator) {
  await triggerOf(root).click();
  await eventually(async () => await dialogOf(root).isVisible());
}

async function fillHex(root: Locator, hex: string) {
  const box = dialogOf(root).getByRole("textbox", { name: "HEX" });
  await box.fill(hex);
  await box.blur();
}

async function confirmPanel(root: Locator) {
  await dialogOf(root).getByRole("button", { name: "确定" }).click();
  await eventually(async () => await dialogOf(root).count() === 0);
}

async function cancelPanel(root: Locator) {
  await dialogOf(root).getByRole("button", { name: "取消" }).click();
  await eventually(async () => await dialogOf(root).count() === 0);
}

function item(root: Locator, page: Page, label: string) {
  return root.locator("div.flex.flex-col.my-3").filter({
    has: page.getByText(label, { exact: true }),
  });
}

async function triggerHeight(root: Locator) {
  return await triggerOf(root).evaluate((el) =>
    Math.round((el as HTMLElement).getBoundingClientRect().height)
  );
}

describe("ColorPicker physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `ColorPicker 与 createForm @${width}：改色确定后提交成功`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.form);
        expect(await triggerHex(root)).toBe("#14b8a6");
        expect(await triggerOf(root).locator("svg").count()).toBe(0);
        expect(
          await root.locator("span.pointer-events-none.absolute svg").count(),
        ).toBe(1);
        await openPanel(root);
        await fillHex(root, "#ef4444");
        await confirmPanel(root);
        await eventually(async () => await triggerHex(root) === "#ef4444");
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已提交" }).count()) > 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker 默认 @${width}：取消恢复原色，确定写回 HEX`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.def);
        expect(await triggerHex(root)).toBe("#3b82f6");
        expect(
          await root.locator("span.pointer-events-none.absolute svg").count(),
        ).toBe(1);
        await openPanel(root);
        expect(
          await dialogOf(root).getByRole("button", { name: "屏幕取色" })
            .count(),
        ).toBe(0);
        expect(
          (await dialogOf(root).innerText()).includes(
            "拖动方格与色相条选择颜色",
          ),
        )
          .toBe(false);
        await fillHex(root, "#ef4444");
        await cancelPanel(root);
        expect(await triggerHex(root)).toBe("#3b82f6");
        await openPanel(root);
        await fillHex(root, "#ef4444");
        await confirmPanel(root);
        await eventually(async () => await triggerHex(root) === "#ef4444");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker swatch @${width}：仅色块约 40×40，无 HEX 文案，可改色`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.swatch);
        const btn = triggerOf(root);
        expect(await btn.getAttribute("aria-label")).toBe(
          "选择颜色，当前 #10b981",
        );
        const box = await btn.boundingBox();
        expect(box != null).toBe(true);
        expect(Math.round(box!.width)).toBe(40);
        expect(Math.round(box!.height)).toBe(40);
        expect((await btn.innerText()).trim()).toBe("");
        expect(
          await root.locator("span.pointer-events-none.absolute svg").count(),
        ).toBe(0);
        await openPanel(root);
        await fillHex(root, "#ef4444");
        await confirmPanel(root);
        await eventually(async () =>
          await btn.getAttribute("aria-label") === "选择颜色，当前 #ef4444"
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker showToolbar @${width}：面板含取色、预览与说明`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.toolbar);
        expect(await triggerHex(root)).toBe("#f59e0b");
        await openPanel(root);
        const dlg = dialogOf(root);
        expect(await dlg.getByRole("button", { name: "屏幕取色" }).isVisible())
          .toBe(true);
        expect((await dlg.innerText()).includes("拖动方格与色相条选择颜色"))
          .toBe(
            true,
          );
        expect(await dlg.locator("div.h-9.w-9.rounded-full").count()).toBe(1);
        await confirmPanel(root);
        expect(await triggerHex(root)).toBe("#f59e0b");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker 隐藏后缀图标 @${width}：无调色板图标仍可打开面板`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.noSuffix);
        expect(await triggerHex(root)).toBe("#8b5cf6");
        expect(
          await root.locator("span.pointer-events-none.absolute svg").count(),
        ).toBe(0);
        await openPanel(root);
        await confirmPanel(root);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker class 宽度 @${width}：触发条最大 200px`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.width);
        expect(await triggerHex(root)).toBe("#ec4899");
        const box = await triggerOf(root).boundingBox();
        expect(box != null).toBe(true);
        expect(Math.round(box!.width)).toBe(200);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker disabled @${width}：禁用触发器坐标点击不打开面板`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.disabled);
        const btn = triggerOf(root);
        expect(await btn.isDisabled()).toBe(true);
        expect(await triggerHex(root)).toBe("#64748b");
        const box = await btn.boundingBox();
        expect(box != null).toBe(true);
        await p.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        expect(await dialogOf(root).count()).toBe(0);
        expect(await triggerHex(root)).toBe("#64748b");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker hideFocusRing @${width}：触发器 class 为 focus:ring-0`,
      async (t) => {
        const p = await openPage(t, width);
        const hidden = triggerOf(example(p, HEAD.hideRing));
        const normal = triggerOf(example(p, HEAD.def));
        expect(
          (await hidden.getAttribute("class") ?? "").includes("focus:ring-0"),
        )
          .toBe(true);
        expect(
          (await hidden.getAttribute("class") ?? "").includes("focus:ring-2"),
        )
          .toBe(false);
        expect(
          (await normal.getAttribute("class") ?? "").includes("focus:ring-2"),
        )
          .toBe(true);
        const hasBlueRing = (el: Element) => {
          const shadow = getComputedStyle(el).boxShadow;
          if (!shadow || shadow === "none") return false;
          // Tailwind ring-2 is a non-inset 0 0 0 2px layer. Ignore inner
          // shadow and zero-spread / outline-color placeholders.
          return shadow.split(/,(?![^(]*\))/).some((layer) => {
            if (/\binset\b/i.test(layer)) return false;
            const spread = layer.match(
              /(?:^| )\d+(?:\.\d+)?px\s+\d+(?:\.\d+)?px\s+\d+(?:\.\d+)?px\s+(\d+(?:\.\d+)?)px/,
            );
            return spread != null && Number(spread[1]) > 0;
          });
        };
        await hidden.focus();
        expect(await hidden.evaluate(hasBlueRing)).toBe(false);
        await normal.focus();
        expect(await normal.evaluate(hasBlueRing)).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker 组合 swatch+toolbar @${width}：色块打开后可见顶栏`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.combo);
        const btn = triggerOf(root);
        expect(await btn.getAttribute("aria-label")).toBe(
          "选择颜色，当前 #6366f1",
        );
        const box = await btn.boundingBox();
        expect(box != null).toBe(true);
        expect(Math.round(box!.width)).toBe(40);
        await openPanel(root);
        expect(
          await dialogOf(root).getByRole("button", { name: "屏幕取色" })
            .isVisible(),
        ).toBe(true);
        await confirmPanel(root);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker size @${width}：四档触发器高度递进`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.size);
        expect(await triggerHeight(item(root, p, "xs"))).toBe(28);
        expect(await triggerHeight(item(root, p, "sm"))).toBe(32);
        expect(await triggerHeight(item(root, p, "md（默认）"))).toBe(40);
        expect(await triggerHeight(item(root, p, "lg"))).toBe(48);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ColorPicker 自动聚焦 @${width}：挂载后焦点在触发器，默认 #000000`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, HEAD.autoFocus);
        const btn = root.locator("#docs-autofocus-color-picker");
        expect(await btn.getAttribute("autofocus") !== null).toBe(true);
        expect(await triggerHex(root)).toBe("#000000");
        expect(
          await btn.evaluate((el) => globalThis.document.activeElement === el),
        ).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
