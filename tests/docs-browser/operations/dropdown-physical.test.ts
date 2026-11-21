import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import {
  attr,
  docsDemo,
  eventually,
  example,
  open,
  visible,
} from "./driver.ts";
const route = "/desktop/navigation/dropdown";
const menu = (page: Page) => page.getByRole("menu");
const trigger = (scope: Locator, label: string) =>
  scope.locator('[data-dreamer-dropdown] > [role="button"]').filter({
    hasText: label,
  });
async function wheelTo(page: Page, target: Locator, y: number) {
  await target.scrollIntoViewIfNeeded();
  const r = await target.boundingBox();
  if (!r) throw new Error("Missing trigger rectangle");
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.wheel(0, r.y - y);
  await eventually(async () => {
    const r = await target.boundingBox();
    return r !== null && Math.abs(r.y - y) < 2;
  });
}
function inBox(
  p: { x: number; y: number },
  r: { x: number; y: number; width: number; height: number },
) {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y &&
    p.y <= r.y + r.height;
}

/** 指针移到元素中心，避免 locator.hover() 为可见而滚页、拖垮 100ms 关闭窗。 */
async function pointerOn(page: Page, el: Locator) {
  const box = await el.boundingBox();
  if (!box) throw new Error("Missing rectangle");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

/** 离开触发器与面板；勿用 (2,2)，会落在文档顶栏或侧栏。 */
async function pointerOff(page: Page, target: Locator, panel?: Locator) {
  const t = await target.boundingBox();
  if (!t) throw new Error("Missing trigger rectangle");
  const b = panel ? await panel.boundingBox() : null;
  const left = Math.min(t.x, b?.x ?? t.x);
  const top = Math.min(t.y, b?.y ?? t.y);
  await page.mouse.move(Math.max(80, left - 80), Math.max(80, top - 80));
}

async function isClearPoint(
  page: Page,
  c: { x: number; y: number },
): Promise<boolean> {
  return await page.evaluate(({ x, y }) => {
    const stack = document.elementsFromPoint(x, y);
    for (const el of stack) {
      if (!(el instanceof Element)) continue;
      if (getComputedStyle(el).pointerEvents === "none") continue;
      return !el.closest(
        "[data-dreamer-dropdown],[role='menu'],[data-dreamer-view-devtools],a,button,[role='button']",
      );
    }
    return false;
  }, c);
}

/** 点在空白处关闭；跳过仍会命中触发器、面板或其他控件的坐标。 */
async function clickOutside(page: Page, target: Locator, panel: Locator) {
  const t = await target.boundingBox(), b = await panel.boundingBox();
  if (!t || !b) throw new Error("Missing trigger or panel for outside click");
  const candidates = [
    { x: t.x + t.width / 2, y: Math.max(80, t.y - 40) },
    { x: Math.max(300, t.x - 40), y: Math.max(80, t.y - 40) },
    {
      x: t.x + t.width / 2,
      y: t.y + t.height + 16 + (b.y + b.height < t.y ? 0 : b.height + 24),
    },
    {
      x: Math.max(80, Math.min(t.x, b.x) - 80),
      y: Math.max(80, Math.min(t.y, b.y) - 80),
    },
  ];
  for (const c of candidates) {
    if (c.y < 80 || inBox(c, t) || inBox(c, b)) continue;
    if (!await isClearPoint(page, c)) continue;
    await page.mouse.click(c.x, c.y);
    return;
  }
  throw new Error("No safe outside-click point");
}
/**
 * 与公开 API / 文档一致：尖角对准触发器中线；若中线会越出面板角，则夹在内侧 12px
 * （面板宽度不足 24px 时夹在面板中线）。这不是放宽容差。
 */
function arrowCenterX(
  trigger: { x: number; width: number },
  panel: { x: number; width: number },
  inset = 12,
): number {
  const raw = trigger.x + trigger.width / 2 - panel.x;
  const min = Math.min(inset, panel.width / 2);
  const max = Math.max(min, panel.width - min);
  const offset = raw < min ? min : raw > max ? max : raw;
  return panel.x + offset;
}
async function geometry(
  target: Locator,
  panel: Locator,
  vertical: "top" | "bottom",
  horizontal: "left" | "center" | "right",
  arrow: boolean,
) {
  await eventually(async () => {
    const a = await target.boundingBox(), b = await panel.boundingBox();
    if (!a || !b) return false;
    const v = vertical === "bottom"
      ? b.y - a.y - a.height
      : a.y - b.y - b.height;
    const h = horizontal === "left"
      ? b.x - a.x
      : horizontal === "right"
      ? b.x + b.width - a.x - a.width
      : b.x + b.width / 2 - a.x - a.width / 2;
    return Math.abs(v - (arrow ? 8 : 4)) <= 1 && Math.abs(h) <= 1;
  });
  expect(
    await panel.locator("..").evaluate((el) => getComputedStyle(el).position),
  ).toBe("fixed");
  const arrows = panel.locator("..").locator(":scope > span[aria-hidden]");
  expect(await arrows.count()).toBe(arrow ? 1 : 0);
  if (arrow) {
    const edgeY = (box: { y: number; height: number }) =>
      vertical === "bottom" ? box.y : box.y + box.height;
    await eventually(async () => {
      const tip = await arrows.boundingBox(),
        trigger = await target.boundingBox(),
        box = await panel.boundingBox();
      if (!tip || !trigger || !box) return false;
      return Math.abs(tip.x + tip.width / 2 - arrowCenterX(trigger, box)) <=
          1 &&
        Math.abs(tip.y + tip.height / 2 - edgeY(box)) <= 1;
    });
    const tip = await arrows.boundingBox(),
      trigger = await target.boundingBox(),
      box = await panel.boundingBox();
    if (!tip || !trigger || !box) throw new Error("Missing arrow");
    expect(Math.abs(tip.x + tip.width / 2 - arrowCenterX(trigger, box)))
      .toBeLessThanOrEqual(1);
    expect(Math.abs(tip.y + tip.height / 2 - edgeY(box)))
      .toBeLessThanOrEqual(1);
  }
  await attr(target, "aria-expanded", "true");
}
async function plainActions(page: Page) {
  expect(
    (await menu(page).getByRole("button").allTextContents()).map((s) =>
      s.trim()
    ),
  ).toEqual(["操作一", "操作二"]);
}
async function selectAction(page: Page, label: string) {
  const link = menu(page).getByRole("button", { name: label, exact: true });
  await attr(link, "type", "button");
  const before = page.url();
  await link.click({ delay: 180 });
  await visible(menu(page), false);
  expect(page.url()).toBe(before);
}
describe("Dropdown physical", () => {
  it(
    "物理操作 Dropdown箭头：三个实际触发器对齐/箭头、跨timer按住释放、两项按钮和Esc外部重复关闭",
    async (t) => {
      const page = await open(t, route),
        scope = example(page, "arrow（浮层与触发器之间的小尖角）");
      const cases: [Locator, "center" | "right"][] = [
        [trigger(scope, "带箭头（正下方居中）"), "center"],
        [trigger(scope, "bottomRight + 箭头"), "right"],
        [
          scope.locator('[data-dreamer-dropdown] > [role="button"]').filter({
            has: page.locator('[title="展开菜单"]'),
          }),
          "center",
        ],
      ];
      for (const [target, h] of cases) {
        await wheelTo(page, target, 300);
        const box = await target.boundingBox();
        if (!box) throw new Error("Missing trigger rectangle");
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        expect(await menu(page).count()).toBe(0);
        await page.mouse.down();
        await page.waitForTimeout(180);
        expect(await menu(page).count()).toBe(0);
        await page.mouse.up();
        await visible(menu(page));
        await geometry(target, menu(page), "bottom", h, true);
        await plainActions(page);
        await selectAction(page, "操作一");
        await attr(target, "aria-expanded", "false");
        await target.click();
        await visible(menu(page));
        await selectAction(page, "操作二");
        await target.press("Enter");
        await visible(menu(page));
        await page.keyboard.press("Escape");
        await visible(menu(page), false);
        await target.press("Space");
        await visible(menu(page));
        await clickOutside(page, target, menu(page));
        await visible(menu(page), false);
        await target.click();
        await visible(menu(page));
        await target.click({ delay: 180 });
        await visible(menu(page), false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Dropdown click：下左下中下右精确几何、所有菜单按钮及原生键盘开关",
    async (t) => {
      const page = await open(t, route),
        scope = example(page, /^trigger=click：下左/);
      for (
        const [label, h] of [["下左", "left"], ["下中", "center"], [
          "下右",
          "right",
        ]] as const
      ) {
        const target = trigger(scope, label);
        await wheelTo(page, target, 300);
        await target.click({ delay: 180 });
        await visible(menu(page));
        await geometry(target, menu(page), "bottom", h, true);
        await plainActions(page);
        await selectAction(page, "操作一");
        await target.click();
        await visible(menu(page));
        await selectAction(page, "操作二");
        await target.press("Enter");
        await visible(menu(page));
        await target.press("Enter");
        await visible(menu(page), false);
        await target.press("Space");
        await visible(menu(page));
        await page.keyboard.press("Escape");
        await visible(menu(page), false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Dropdown hover：150/100ms原生计时、短停取消、跨间隙进面板、返回取消关闭、两按钮及Esc",
    async (t) => {
      const page = await open(t, route),
        target = trigger(example(page, "trigger=hover"), "悬停展开");
      await target.evaluate((el) => {
        type Stamp = { event: string; at: number };
        const events: Stamp[] = [];
        (globalThis as unknown as { dropdownEvents: Stamp[] }).dropdownEvents =
          events;
        const root = el.parentElement!;
        for (const type of ["mouseenter", "mouseleave"]) {
          root.addEventListener(type, () =>
            events.push({
              event: type === "mouseenter" ? "enter" : "leave",
              at: performance.now(),
            }));
        }
        let shown = false;
        const observer = new MutationObserver(() => {
          const panel = document.querySelector('[role="menu"]');
          const present = panel !== null;
          if (present !== shown) {
            events.push({
              event: present ? "shown" : "hidden",
              at: performance.now(),
            });
            shown = present;
            if (panel) {
              panel.parentElement!.addEventListener(
                "mouseleave",
                () => events.push({ event: "leave", at: performance.now() }),
              );
            }
          }
        });
        observer.observe(document.body, { subtree: true, childList: true });
        globalThis.addEventListener("pagehide", () => observer.disconnect(), {
          once: true,
        });
      });
      await target.hover();
      await page.waitForTimeout(40);
      expect(await menu(page).count()).toBe(0);
      await pointerOff(page, target, menu(page));
      await page.waitForTimeout(180);
      expect(await menu(page).count()).toBe(0);
      await target.hover();
      await visible(menu(page));
      await geometry(target, menu(page), "bottom", "center", false);
      await plainActions(page);
      await pointerOn(page, menu(page));
      await page.waitForTimeout(160);
      await visible(menu(page));
      await pointerOff(page, target, menu(page));
      await page.waitForTimeout(40);
      await visible(menu(page));
      await pointerOn(page, menu(page));
      await page.waitForTimeout(160);
      await visible(menu(page));
      await pointerOff(page, target, menu(page));
      await visible(menu(page), false);
      await attr(target, "aria-expanded", "false");
      const stamps = await page.evaluate(() =>
        (globalThis as unknown as {
          dropdownEvents: { event: string; at: number }[];
        }).dropdownEvents
      );
      console.log("dropdown native hover timing", stamps);
      const shown = stamps.find((x) => x.event === "shown"),
        hidden = stamps.find((x) => x.event === "hidden");
      if (!shown || !hidden) {
        throw new Error("Missing native hover transitions");
      }
      const enter = stamps.filter((x) => x.event === "enter" && x.at < shown.at)
          .at(-1),
        leave = stamps.filter((x) => x.event === "leave" && x.at < hidden.at)
          .at(
            -1,
          );
      if (!enter || !leave) {
        throw new Error("Missing actual mouse boundary timestamps");
      }
      expect(shown.at - enter.at).toBeGreaterThanOrEqual(149);
      expect(hidden.at - leave.at).toBeGreaterThanOrEqual(99);
      for (const label of ["操作一", "操作二"]) {
        await target.hover();
        await visible(menu(page));
        await pointerOn(page, menu(page));
        await attr(
          menu(page).getByRole("button", { name: label, exact: true }),
          "type",
          "button",
        );
        const before = page.url();
        await menu(page).getByRole("button", { name: label, exact: true })
          .click({
            delay: 180,
          });
        expect(page.url()).toBe(before);
        await pointerOff(page, target, menu(page));
        await visible(menu(page), false);
      }
      await target.hover();
      await visible(menu(page));
      await page.keyboard.press("Escape");
      await visible(menu(page), false);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Dropdown disabled：真实鼠标命中及Tab跳过、禁用属性和没有菜单",
    async (t) => {
      const page = await open(t, route),
        scope = example(page, "disabled"),
        target = trigger(scope, "禁用下拉"),
        button = target.locator("button");
      expect(await button.isDisabled()).toBe(true);
      await attr(target, "aria-disabled", "true");
      expect(await target.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(
        -1,
      );
      await button.scrollIntoViewIfNeeded();
      const b = await button.boundingBox();
      if (!b) throw new Error("Disabled trigger missing");
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(180);
      await page.mouse.up();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      expect(await menu(page).count()).toBe(0);
      await attr(target, "aria-expanded", "false");
      const copy = docsDemo(page, "trigger=hover").getByRole("button", {
        name: /复制/,
      });
      await copy.press("Tab");
      expect(await target.evaluate((el) => el.contains(document.activeElement)))
        .toBe(false);
      expect(await menu(page).count()).toBe(0);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Dropdown复杂菜单：头像/两分隔线/三图标按钮、每项原生点击关闭且演示按钮不离开本页",
    async (t) => {
      const page = await open(t, route),
        target = trigger(
          example(page, "overlay 复杂示例（头像、分割线、图标菜单项）"),
          "用户菜单",
        );
      for (const label of ["个人设置", "账户安全", "退出登录"]) {
        await wheelTo(page, target, 300);
        await target.click();
        await visible(menu(page));
        await geometry(target, menu(page), "bottom", "center", true);
        await visible(menu(page).getByText("当前用户", { exact: true }));
        await visible(
          menu(page).getByText("user@example.com", { exact: true }),
        );
        await visible(menu(page).getByText("用", { exact: true }));
        expect(await menu(page).getByRole("separator").count()).toBe(2);
        expect(
          (await menu(page).getByRole("button").allTextContents()).map((s) =>
            s.trim()
          ),
        ).toEqual(["个人设置", "账户安全", "退出登录"]);
        for (const name of ["个人设置", "账户安全", "退出登录"]) {
          expect(
            await menu(page).getByRole("button", { name, exact: true }).locator(
              "svg",
            ).count(),
          ).toBe(1);
        }
        await selectAction(page, label);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Dropdown向上/auto：固定top与真实滚动时动态翻转、含间隙边界、宽窄屏视口约束",
    async (t) => {
      const page = await open(t, route),
        scope = example(page, "向上展开与 auto"),
        up = trigger(scope, "向上展开"),
        auto = trigger(scope, "自动定位");
      await wheelTo(page, up, 300);
      await up.press("Enter");
      await visible(menu(page));
      await geometry(up, menu(page), "top", "center", false);
      await plainActions(page);
      await selectAction(page, "操作一");
      await up.click();
      await visible(menu(page));
      await selectAction(page, "操作二");
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await wheelTo(page, auto, 300);
        await auto.click();
        await visible(menu(page));
        await geometry(auto, menu(page), "bottom", "center", false);
        const a = await auto.boundingBox(), b = await menu(page).boundingBox();
        if (!a || !b) throw new Error("Auto geometry missing");
        // Only two free pixels beyond the panel height: the actual four-pixel gap must also fit.
        const boundaryY = 900 - a.height - b.height - 2;
        await wheelTo(page, auto, boundaryY);
        console.log(
          "dropdown auto before expected flip",
          width,
          await auto.boundingBox(),
          await menu(page).boundingBox(),
        );
        await geometry(auto, menu(page), "top", "center", false);
        await wheelTo(page, auto, 300);
        await geometry(auto, menu(page), "bottom", "center", false);
        await wheelTo(page, auto, 840);
        await geometry(auto, menu(page), "top", "center", false);
        const r = await menu(page).boundingBox();
        if (!r) throw new Error("Missing auto panel");
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(width);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.y + r.height).toBeLessThanOrEqual(900);
        await page.keyboard.press("Escape");
        await visible(menu(page), false);
      }
      await auto.click();
      await visible(menu(page));
      await selectAction(page, "操作一");
      await auto.click();
      await visible(menu(page));
      await selectAction(page, "操作二");
    },
    DOCS_BROWSER_CONFIG,
  );
});
