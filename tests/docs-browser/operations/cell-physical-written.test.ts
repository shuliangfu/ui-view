/** WRITTEN-UNRUN. Three live Cell examples; shared tip Signal only renders in the first. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const cells = (root: Locator) => root.locator("[data-dreamer-cell]");

async function activate(el: Locator, mode: string) {
  if (mode === "mouse") await el.click({ delay: 180 });
  else {
    await el.focus();
    await el.press(mode);
  }
}

async function cellSnap(el: Locator) {
  return await el.evaluate((e) => {
    const c = getComputedStyle(e);
    return {
      tag: e.tagName,
      title: (e.querySelector(".text-sm.font-medium")?.textContent ?? "")
        .trim(),
      description:
        (e.querySelector(".text-xs.text-slate-500")?.textContent ?? "")
          .trim(),
      extra: (e.querySelector("[data-dreamer-cell-extra]")?.textContent ?? "")
        .trim(),
      arrow: e.querySelector("[data-dreamer-cell-arrow]")?.textContent ?? "",
      icon: (e.querySelector(
        ".shrink-0:not([data-dreamer-cell-extra]):not([data-dreamer-cell-arrow])",
      )?.textContent ?? "").trim(),
      required: !!e.querySelector(".text-red-500"),
      star: e.querySelector(".text-red-500")?.textContent ?? "",
      href: e.getAttribute("href"),
      role: e.getAttribute("role"),
      tabIndex: e.getAttribute("tabindex"),
      clickable: e.getAttribute("data-clickable"),
      disabled: e.getAttribute("aria-disabled"),
      opacity: c.opacity,
      pointer: c.pointerEvents,
      cursor: c.cursor,
    };
  });
}

async function status(p: Page) {
  const node = example(p, "可点详情 + Switch + 禁用").locator(
    "[role=status]",
  );
  return await node.count() === 0 ? "" : (await node.innerText()).trim();
}

async function switchOn(cell: Locator) {
  return await cell.locator('input[type="checkbox"]').isChecked();
}

async function trackColor(cell: Locator) {
  return await cell.locator("label > span").first().evaluate((e) =>
    getComputedStyle(e).backgroundColor
  );
}

describe("Cell physical written", () => {
  for (const width of [390, 1280]) {
    for (const mode of ["mouse", "Enter", "Space"]) {
      it(
        `Cell 可点详情 + Switch + 禁用 @${width}/${mode}：账号写回/开关切换/禁用坐标点击无效`,
        async (t) => {
          const p = await open(t, "/desktop/data-display/cell");
          await p.setViewportSize({ width, height: 900 });
          const root = example(p, "可点详情 + Switch + 禁用");
          const group = root.locator("[data-dreamer-cell-group]");
          expect(await group.locator(":scope > div").first().innerText()).toBe(
            "设置",
          );
          const list = cells(root);
          expect(await list.count()).toBe(3);
          const account = list.nth(0), notify = list.nth(1), gone = list.nth(2);
          expect(await cellSnap(account)).toEqual({
            tag: "DIV",
            title: "账号",
            description: "",
            extra: "详情",
            arrow: "›",
            icon: "",
            required: false,
            star: "",
            href: null,
            role: "button",
            tabIndex: "0",
            clickable: "true",
            disabled: null,
            opacity: "1",
            pointer: "auto",
            cursor: "pointer",
          });
          const notifySnap = await cellSnap(notify);
          expect({
            tag: notifySnap.tag,
            title: notifySnap.title,
            description: notifySnap.description,
            extra: notifySnap.extra,
            arrow: notifySnap.arrow,
            icon: notifySnap.icon,
            required: notifySnap.required,
            role: notifySnap.role,
            tabIndex: notifySnap.tabIndex,
            clickable: notifySnap.clickable,
            disabled: notifySnap.disabled,
            pointer: notifySnap.pointer,
          }).toEqual({
            tag: "DIV",
            title: "通知",
            description: "推送开关",
            extra: "",
            arrow: "",
            icon: "",
            required: false,
            role: null,
            tabIndex: null,
            clickable: "false",
            disabled: null,
            pointer: "auto",
          });
          const goneSnap = await cellSnap(gone);
          expect({
            tag: goneSnap.tag,
            title: goneSnap.title,
            extra: goneSnap.extra,
            arrow: goneSnap.arrow,
            role: goneSnap.role,
            tabIndex: goneSnap.tabIndex,
            clickable: goneSnap.clickable,
            disabled: goneSnap.disabled,
            pointer: goneSnap.pointer,
            cursor: goneSnap.cursor,
          }).toEqual({
            tag: "DIV",
            title: "注销（禁用示意）",
            extra: "不可用",
            arrow: "›",
            role: null,
            tabIndex: null,
            clickable: "false",
            disabled: "true",
            pointer: "none",
            cursor: "not-allowed",
          });
          expect(Number((await cellSnap(gone)).opacity)).toBeCloseTo(0.5, 2);
          expect(await status(p)).toBe("");
          expect(await switchOn(notify)).toBe(true);
          const onColor = await trackColor(notify);
          await activate(account, mode);
          await eventually(async () => await status(p) === "已打开账号详情");
          expect(await status(p)).toBe("已打开账号详情");
          expect(await switchOn(notify)).toBe(true);
          await notify.locator("label").click({ delay: 180 });
          await eventually(async () => await status(p) === "通知已关闭");
          expect(await switchOn(notify)).toBe(false);
          expect(await trackColor(notify)).not.toBe(onColor);
          await notify.locator("label").click({ delay: 180 });
          await eventually(async () => await status(p) === "通知已开启");
          expect(await switchOn(notify)).toBe(true);
          await eventually(async () => await trackColor(notify) === onColor);
          expect(await trackColor(notify)).toBe(onColor);
          const box = await gone.boundingBox();
          if (!box) throw new Error("disabled cell has no box");
          await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
            delay: 180,
          });
          expect(await status(p)).toBe("通知已开启");
          expect(await switchOn(notify)).toBe(true);
          expect((await cellSnap(gone)).disabled).toBe("true");
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `Cell 图标 / 必填 / href @${width}：必填星号写回共享状态，帮助链真实跳转`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/cell");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "图标 / 必填 / href");
        expect(
          await root.locator("[data-dreamer-cell-group] > div").first()
            .innerText(),
        ).toBe("资料");
        const inset = root.locator("[data-dreamer-cell-group] > div").nth(1);
        const insetBorder = await inset.evaluate((e) => {
          const c = getComputedStyle(e);
          return {
            radius: c.borderRadius,
            border: c.borderTopWidth,
          };
        });
        expect(insetBorder.radius).not.toBe("0px");
        expect(insetBorder.border).toBe("1px");
        const list = cells(root);
        expect(await list.count()).toBe(2);
        const nick = list.nth(0), help = list.nth(1);
        const snap = await cellSnap(nick);
        expect(snap.tag).toBe("DIV");
        expect(snap.title).toBe("*昵称");
        expect(snap.required).toBe(true);
        expect(snap.star).toBe("*");
        expect(snap.extra).toBe("未填写");
        expect(snap.arrow).toBe("›");
        expect(snap.icon).toBe("👤");
        expect(snap.clickable).toBe("true");
        const helpSnap = await cellSnap(help);
        expect({
          tag: helpSnap.tag,
          title: helpSnap.title,
          description: helpSnap.description,
          extra: helpSnap.extra,
          arrow: helpSnap.arrow,
          href: helpSnap.href,
          role: helpSnap.role,
          clickable: helpSnap.clickable,
          targetMissing: await help.getAttribute("target"),
        }).toEqual({
          tag: "A",
          title: "帮助文档",
          description: "新窗口打开",
          extra: "",
          arrow: "›",
          href: "https://example.com/help",
          role: null,
          clickable: "true",
          targetMissing: null,
        });
        expect(
          await example(p, "图标 / 必填 / href").locator("[role=status]")
            .count(),
        ).toBe(0);
        await nick.click({ delay: 180 });
        await eventually(async () => await status(p) === "编辑昵称");
        expect(await status(p)).toBe("编辑昵称");
        expect(
          await example(p, "图标 / 必填 / href").locator("[role=status]")
            .count(),
        ).toBe(0);
        await p.route("https://example.com/**", (route) =>
          route.fulfill({
            status: 200,
            contentType: "text/html; charset=utf-8",
            body: "<!doctype html><title>help</title><p>help-ok</p>",
          }));
        await help.click({ delay: 180 });
        await p.waitForURL("https://example.com/help");
        expect(p.url()).toBe("https://example.com/help");
        expect(await p.getByText("help-ok", { exact: true }).isVisible()).toBe(
          true,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Cell 无分割线 inset=false @${width}：紧凑组无外框，子项仍保留相邻顶边`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/cell");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "无分割线 inset=false");
        expect(
          await root.locator("[data-dreamer-cell-group] > div").first()
            .innerText(),
        ).toBe("紧凑");
        const box = root.locator("[data-dreamer-cell-group] > div").nth(1);
        const geometry = await box.evaluate((e) => {
          const c = getComputedStyle(e);
          return {
            radius: c.borderRadius,
            border: [
              c.borderTopWidth,
              c.borderRightWidth,
              c.borderBottomWidth,
              c.borderLeftWidth,
            ],
            margin: c.marginLeft,
          };
        });
        expect(geometry.radius).toBe("0px");
        expect(geometry.border).toEqual(["0px", "0px", "0px", "0px"]);
        const list = cells(root);
        expect(await list.count()).toBe(2);
        expect((await cellSnap(list.nth(0))).title).toBe("一项");
        expect((await cellSnap(list.nth(1))).title).toBe("二项");
        const tops = await list.evaluateAll((es) =>
          es.map((e) => getComputedStyle(e).borderTopWidth)
        );
        expect(tops[0]).toBe("0px");
        expect(tops[1]).toBe("1px");
        await list.nth(0).click({ delay: 180 });
        await list.nth(1).click({ delay: 180 });
        expect(await status(p)).toBe("");
        expect((await cellSnap(list.nth(0))).title).toBe("一项");
        expect((await cellSnap(list.nth(1))).title).toBe("二项");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
