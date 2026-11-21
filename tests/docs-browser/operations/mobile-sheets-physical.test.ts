import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open, visible } from "./driver.ts";
const overflow = (page: Page) =>
  page.evaluate(() => document.body.style.overflow);
async function fullscreenMask(page: Page, dialog: Locator) {
  const mask = dialog.getByRole("button", { name: "关闭", exact: true }).filter(
    { hasNotText: "关闭" },
  );
  const b = await mask.boundingBox(), v = page.viewportSize();
  if (!b || !v) throw new Error("Viewport mask missing");
  expect(b.x).toBe(0);
  expect(b.y).toBe(0);
  expect(b.width).toBe(v.width);
  expect(b.height).toBe(v.height);
  return mask;
}
describe("Mobile sheets physical", () => {
  it(
    "物理操作 移动ActionSheet基础：分享/删除演示动作、危险样式、取消/遮罩关闭、反复原生键盘打开",
    async (t) => {
      for (const width of [1280, 390]) {
        const page = await open(t, "/mobile/feedback/action-sheet");
        await page.setViewportSize({ width, height: 900 });
        const before = await overflow(page),
          target = demo(page, "基础（标题 + 动作 + 取消）").getByRole(
            "button",
            {
              name: "打开 ActionSheet",
              exact: true,
            },
          ),
          dialog = page.getByRole("dialog", { name: "操作列表", exact: true });
        for (const action of ["分享", "删除", "取消", "mask"]) {
          await target.click({ delay: 180 });
          await visible(dialog);
          await attr(dialog, "aria-modal", "true");
          await visible(dialog.getByText("请选择操作", { exact: true }));
          expect(
            (await dialog.getByRole("button").allTextContents()).map((s) =>
              s.trim()
            ),
          ).toEqual(["", "分享", "删除", "取消"]);
          expect(
            await dialog.getByRole("button", { name: "删除", exact: true })
              .evaluate((el) => el.classList.contains("text-red-600")),
          ).toBe(true);
          expect(
            await dialog.getByRole("button", { name: "删除", exact: true })
              .evaluate((el) => getComputedStyle(el).color),
          ).not.toBe(
            await dialog.getByRole("button", { name: "分享", exact: true })
              .evaluate((el) => getComputedStyle(el).color),
          );
          const mask = await fullscreenMask(page, dialog);
          expect(await overflow(page)).toBe("hidden");
          await dialog.getByText("请选择操作", { exact: true }).click();
          await visible(dialog);
          if (action === "mask") {
            await mask.click({ position: { x: 12, y: 12 }, delay: 180 });
          } else {await dialog.getByRole("button", {
              name: action,
              exact: true,
            })
              .filter({ hasText: action })
              .click({ delay: 180 });}
          await visible(dialog, false);
          await eventually(async () => await overflow(page) === before);
          expect(new URL(page.url()).pathname).toBe(
            "/mobile/feedback/action-sheet",
          );
        }
        await target.press("Enter");
        await visible(dialog);
        await dialog.getByRole("button", { name: "取消", exact: true }).press(
          "Space",
        );
        await visible(dialog, false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 移动ActionSheet无标题：仅一动作/自定义关闭文案、无标题DOM及遮罩关闭回调",
    async (t) => {
      const page = await open(t, "/mobile/feedback/action-sheet");
      await page.setViewportSize({ width: 390, height: 900 });
      const target = demo(page, "无标题（title 省略）").getByRole("button", {
          name: "打开（无标题）",
          exact: true,
        }),
        dialog = page.getByRole("dialog", { name: "操作列表", exact: true }),
        before = await overflow(page);
      for (const action of ["仅一项", "关闭", "mask"]) {
        await target.click();
        await visible(dialog);
        expect(
          (await dialog.getByRole("button").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual(["", "仅一项", "关闭"]);
        expect(await dialog.getByText("请选择操作", { exact: true }).count())
          .toBe(0);
        expect(await dialog.locator(".border-b.text-center").count()).toBe(0);
        const mask = await fullscreenMask(page, dialog);
        expect(await overflow(page)).toBe("hidden");
        if (action === "mask") await mask.click({ position: { x: 12, y: 12 } });
        else {await dialog.getByRole("button", { name: action, exact: true })
            .filter({ hasText: action })
            .click({ delay: 180 });}
        await visible(dialog, false);
        await eventually(async () => await overflow(page) === before);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "DOM精确契约 移动ActionSheet：两个API表完整字段/类型/默认值/说明，不以长度替代静态展示",
    async (t) => {
      const page = await open(t, "/mobile/feedback/action-sheet");
      const check = async (title: string, expected: string[][]) => {
        const table = demo(page, title).locator("table");
        expect(
          (await table.locator("thead th").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual(["属性", "类型", "默认值", "说明"]);
        expect(
          await table.locator("tbody tr").evaluateAll((rows) =>
            rows.map((row) =>
              [...row.querySelectorAll("td")].map((c) => c.textContent!.trim())
            )
          ),
        ).toEqual(expected);
      };
      await check("ActionSheet", [
        [
          "open",
          "Signal | () => boolean",
          "-",
          "是否打开；须传 Signal 或 getter，勿仅传 `.value`",
        ],
        ["onClose", "() => void", "-", "取消行或遮罩关闭时触发"],
        ["title", "string | null", "-", "动作列表上方标题；null 可隐藏标题区"],
        ["actions", "ActionSheetAction[]", "-", "动作项列表（必填）"],
        [
          "cancelText",
          "string | null",
          '"取消"',
          "底部取消文案；null 或空串则不显示取消区",
        ],
        ["maskClosable", "boolean", "true", "点击遮罩是否关闭"],
        ["destroyOnClose", "boolean", "false", "关闭后是否销毁子树"],
        ["class", "string", "-", "容器额外 class"],
        [
          "messages",
          "Partial<ActionSheetMessages>",
          "-",
          "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
        ],
      ]);
      await check("ActionSheetAction", [
        ["label", "string", "-", "主文案"],
        ["onClick", "() => void", "-", "点击回调"],
        ["disabled", "boolean", "false", "是否禁用"],
        ["danger", "boolean", "false", "危险操作（红色文案）"],
        ["description", "string", "-", "副标题/描述"],
        ["icon", "VNode", "-", "左侧图标节点"],
      ]);
    },
    DOCS_BROWSER_CONFIG,
  );
  for (
    const [title, button, heading, content, mode, route] of [
      [
        '半屏（heightMode="half"）',
        "打开 BottomSheet",
        "示例标题",
        "面板内容区域，可放表单或列表。",
        "half",
        "/mobile/feedback/bottom-sheet",
      ],
      [
        '全屏（heightMode="full"）',
        "打开全屏",
        "全屏示例",
        "全屏高度占满可视区域。",
        "full",
        "/mobile/feedback/bottom-sheet",
      ],
      [
        "MobilePortalHostScope（机内 Portal）",
        "机内打开",
        "机内抽屉",
        "遮罩限制在 Scope 容器内。",
        "scoped",
        "/mobile/feedback/bottom-sheet",
      ],
      [
        "与 BottomSheet 组合",
        "打开（机内遮罩）",
        "Portal 在容器内",
        "遮罩与面板限制在 Scope 容器内。",
        "scoped",
        "/mobile/other/mobile-portal-host-scope",
      ],
    ] as const
  ) {
    it(
      "物理操作 移动BottomSheet" + mode + " " + route +
        "：实际高度/Portal/无障碍命名、内部点击保持、关闭与可用遮罩、重复开关",
      async (t) => {
        for (const width of [1280, 390]) {
          const page = await open(t, route);
          await page.setViewportSize({ width, height: 900 });
          const scope = demo(page, title),
            target = scope.getByRole("button", { name: button, exact: true }),
            dialog = page.getByRole("dialog", { name: heading, exact: true }),
            before = await overflow(page);
          for (
            const closing of mode === "full"
              ? ["button", "keyboard"]
              : ["button", "mask", "keyboard"]
          ) {
            if (closing === "keyboard") await target.press("Enter");
            else await target.click({ delay: 180 });
            console.log(
              "bottom-sheet accessible titles",
              mode,
              await page.locator('[role="dialog"][aria-labelledby]')
                .evaluateAll((
                  nodes,
                ) =>
                  nodes.map((el) => ({
                    title: el.textContent,
                    labelledBy: el.getAttribute("aria-labelledby"),
                    rootHidden: el.parentElement?.getAttribute("aria-hidden"),
                  }))
                ),
            );
            await visible(dialog);
            await visible(dialog.getByText(content, { exact: true }));
            await attr(dialog, "aria-modal", "true");
            const id = await dialog.getAttribute("aria-labelledby");
            if (!id) throw new Error("Missing accessible title ID");
            expect(await page.locator(`[id="${id}"]`).count()).toBe(1);
            expect(await page.locator(`[id="${id}"]`).textContent()).toBe(
              heading,
            );
            const shell = dialog.locator("..");
            const bounds = mode === "scoped"
              ? await scope.locator("[data-dreamer-mobile-portal-host]")
                .boundingBox()
              : { x: 0, y: 0, width, height: 900 };
            if (!bounds) throw new Error("Portal bounds missing");
            await eventually(async () => {
              const b = await dialog.boundingBox();
              return b !== null &&
                Math.abs(
                    b.height - bounds.height * (mode === "full" ? 1 : 0.5),
                  ) <
                  2 &&
                Math.abs(b.y + b.height - bounds.y - bounds.height) < 2;
            });
            const b = await dialog.boundingBox();
            if (!b) throw new Error("Sheet rectangle missing");
            expect(Math.abs(b.x - bounds.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(b.width - bounds.width)).toBeLessThanOrEqual(1);
            expect(await overflow(page)).toBe(
              mode === "scoped" ? before : "hidden",
            );
            if (mode === "scoped") {
              expect(
                await shell.evaluate((el) =>
                  el.closest("[data-dreamer-mobile-portal-host]") !== null
                ),
              ).toBe(true);
            } else {expect(
                await shell.evaluate((el) =>
                  el.parentElement === document.body
                ),
              ).toBe(true);}
            await dialog.getByText(content, { exact: true }).click();
            await visible(dialog);
            if (closing === "mask") {
              await shell.locator(':scope > button[aria-label="关闭"]').click({
                position: { x: 12, y: 12 },
                delay: 180,
              });
            } else if (closing === "keyboard") {
              await dialog.getByRole("button", { name: "关闭", exact: true })
                .press("Space");
            } else {await dialog.getByRole("button", {
                name: "关闭",
                exact: true,
              }).click({ delay: 180 });}
            await visible(dialog, false);
            await eventually(async () => await overflow(page) === before);
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }

  it(
    "DOM精确契约 MobilePortalHostScope：完整两行API及transform包含块，不以文本长度代替",
    async (t) => {
      const page = await open(t, "/mobile/other/mobile-portal-host-scope"),
        scope = demo(page, "与 BottomSheet 组合");
      const host = scope.locator("[data-dreamer-mobile-portal-host]");
      expect(await host.getAttribute("aria-hidden")).toBe(null);
      expect(
        await host.evaluate((el) =>
          getComputedStyle(el.parentElement!).transform
        ),
      ).toBe("matrix(1, 0, 0, 1, 0, 0)");
      const table = page.getByRole("heading", { name: "API", exact: true })
        .locator("..").locator("table");
      expect(
        (await table.locator("thead th").allTextContents()).map((s) =>
          s.trim()
        ),
      ).toEqual(["属性", "类型", "默认值", "说明"]);
      expect(
        await table.locator("tbody tr").evaluateAll((rows) =>
          rows.map((row) =>
            [...row.querySelectorAll("td")].map((c) => c.textContent!.trim())
          )
        ),
      ).toEqual([
        [
          "children",
          "unknown",
          "-",
          "业务内容 + 其内的 BottomSheet / ActionSheet 等",
        ],
        [
          "class",
          "string",
          "-",
          "包裹层 class；建议保留纵向 flex + min-h-0，便于在 flex 布局中占满剩余高度",
        ],
      ]);
    },
    DOCS_BROWSER_CONFIG,
  );
});
