/** WRITTEN-UNRUN. No handler calls/DOM dispatch: real scoped keyboard keys and browser text input. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open } from "./driver.ts";
import {
  enterPasscode,
  passcodeContract,
  passcodeValue,
} from "./mobile-passcode-driver-written.ts";
const scopes = (p: Page) =>
  p.locator("[data-dreamer-mobile-portal-host]").locator("..");
async function click(s: Locator) {
  await s.click({ delay: 180 });
}
async function bodyOverflow(p: Page) {
  return await p.evaluate(() => document.body.style.overflow);
}
async function keyboard(frame: Locator, opener: Locator, size = 2) {
  await click(opener);
  const dialog = frame.getByRole("dialog", { name: "数字键盘", exact: true });
  await eventually(async () => await dialog.count() === 1);
  expect(await dialog.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe(
    "auto",
  );
  const grid = dialog.locator(".grid"), buttons = grid.getByRole("button");
  expect(
    await buttons.evaluateAll((es) =>
      es.map((e) => e.getAttribute("aria-label"))
    ),
  ).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "删除"]);
  expect(await grid.locator(":scope > *").count()).toBe(12);
  expect(await dialog.getByRole("button", { name: ".", exact: true }).count())
    .toBe(0);
  const box = await dialog.boundingBox(), host = await frame.boundingBox();
  if (!box || !host) throw new Error("Scoped keyboard geometry missing");
  expect(
    Math.abs(box.x - host.x) < 1 && Math.abs(box.y - host.y) < 1 &&
      Math.abs(box.width - host.width) < 1 &&
      Math.abs(box.height - host.height) < 1,
  ).toBe(true);
  expect(
    await buttons.first().evaluate((e) => {
      const c = getComputedStyle(e);
      return [c.height, c.fontSize];
    }),
  ).toEqual([[36, 40, 48, 56][size] + "px", [14, 16, 18, 20][size] + "px"]);
  expect(
    await dialog.getByRole("button", { name: "完成", exact: true }).evaluate(
      (e) => getComputedStyle(e).height,
    ),
  ).toBe([36, 40, 44, 48][size] + "px");
  return dialog;
}
async function maskClose(p: Page, dialog: Locator) {
  const mask = dialog.getByRole("button", { name: "关闭", exact: true }),
    box = await mask.boundingBox();
  if (!box) throw new Error("Scoped keyboard mask missing");
  await p.mouse.click(box.x + box.width / 2, box.y + 3, { delay: 180 });
  await eventually(async () => await dialog.count() === 0);
}
async function keyboardContract(p: Page, frame: Locator) {
  const group = frame.locator(".passcode-input"),
    opener = frame.getByRole("button", { name: "打开数字键盘", exact: true }),
    before = await bodyOverflow(p);
  await passcodeValue(group, "", 6);
  let dialog = await keyboard(frame, opener);
  expect(await bodyOverflow(p)).toBe(before);
  for (const digit of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
    await click(dialog.getByRole("button", { name: digit, exact: true }));
    await passcodeValue(group, digit, 6);
    await dialog.getByRole("button", { name: "删除", exact: true }).press(
      "Enter",
    );
    await passcodeValue(group, "", 6);
  }
  await click(dialog.getByRole("button", { name: "删除", exact: true }));
  await passcodeValue(group, "", 6);
  let expected = "";
  for (const digit of "123456") {
    await click(dialog.getByRole("button", { name: digit, exact: true }));
    expected += digit;
    await passcodeValue(group, expected, 6);
  }
  await dialog.getByRole("button", { name: "7", exact: true }).press("Enter");
  await passcodeValue(group, "123456", 6);
  await dialog.getByRole("button", { name: "完成", exact: true }).press(
    "Space",
  );
  await eventually(async () => await dialog.count() === 0);
  await passcodeValue(group, "123456", 6);
  expect(await bodyOverflow(p)).toBe(before);
  dialog = await keyboard(frame, opener);
  await passcodeValue(group, "123456", 6);
  await dialog.getByRole("button", { name: "删除", exact: true }).press(
    "Space",
  );
  await passcodeValue(group, "12345", 6);
  await click(dialog.getByRole("button", { name: "6", exact: true }));
  await passcodeValue(group, "123456", 6);
  await maskClose(p, dialog);
  await passcodeValue(group, "123456", 6);
  expect(await bodyOverflow(p)).toBe(before);
}
describe("Mobile keyboard passcode written", () => {
  for (const width of [390, 1280]) {
    it(
      "移动NumberKeyboard 基础未设三级标题 @" + width +
        "：全部十键/删除/长度上限/完成/局部mask及双输入方式",
      async (t) => {
        const p = await open(t, "/mobile/form/number-keyboard");
        await p.setViewportSize({ width, height: 900 });
        const frames = scopes(p);
        expect(await frames.count()).toBe(3);
        const frame = frames.nth(1), group = frame.locator(".passcode-input");
        await passcodeContract(p, group, 6);
        await enterPasscode(p, group, "", "", 6);
        await keyboardContract(p, frame);
        await passcodeValue(frames.nth(0).locator(".passcode-input"), "", 6);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      "移动NumberKeyboard 与 createForm @" + width +
        "：字段精确回写、错误/有效提交/删除后再必填",
      async (t) => {
        const p = await open(t, "/mobile/form/number-keyboard");
        await p.setViewportSize({ width, height: 900 });
        const frame = scopes(p).nth(0),
          form = frame.locator("form"),
          group = form.locator(".passcode-input"),
          submit = form.getByRole("button", { name: "提交", exact: true }),
          error = form.locator('[id$="-error"]'),
          toast = p.getByRole("alert").filter({ hasText: /^已提交$/ });
        await click(submit);
        expect(await error.textContent()).toBe("请输入验证码");
        await enterPasscode(p, group, "123", "123", 6);
        await click(submit);
        expect(await error.textContent()).toBe("须为 6 位数字");
        expect(await toast.count()).toBe(0);
        await enterPasscode(p, group, "", "", 6);
        await passcodeContract(p, group, 6);
        await enterPasscode(p, group, "", "", 6);
        await keyboardContract(p, frame);
        await click(submit);
        await eventually(async () => await error.count() === 0);
        await attr(group.locator("input"), "aria-invalid", "false");
        expect(
          await form.evaluate((e) =>
            Array.from(new FormData(e as HTMLFormElement).entries())
          ),
        ).toEqual([["code", "123456"]]);
        await eventually(async () => await toast.count() === 1);
        await toast.waitFor({ state: "detached", timeout: 10000 });
        const dialog = await keyboard(
          frame,
          frame.getByRole("button", { name: "打开数字键盘", exact: true }),
        );
        for (let i = 5; i >= 0; i--) {
          await click(
            dialog.getByRole("button", { name: "删除", exact: true }),
          );
          await passcodeValue(group, "123456".slice(0, i), 6);
        }
        await dialog.getByRole("button", { name: "完成", exact: true }).press(
          "Enter",
        );
        await click(submit);
        expect(await error.textContent()).toBe("请输入验证码");
        await attr(group.locator("input"), "aria-invalid", "true");
        expect(await toast.count()).toBe(0);
        await passcodeValue(scopes(p).nth(1).locator(".passcode-input"), "", 6);
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const [index, size] of ["xs", "sm", "md", "lg"].entries()) {
      it(
        "移动NumberKeyboard size " + size + " @" + width +
          "：精确键高、无回调演示全部键与原生关闭",
        async (t) => {
          const p = await open(t, "/mobile/form/number-keyboard");
          await p.setViewportSize({ width, height: 900 });
          const frame = scopes(p).nth(2),
            opener = frame.getByRole("button", { name: size, exact: true }),
            before = await bodyOverflow(p);
          let dialog = await keyboard(frame, opener, index);
          for (
            const key of [
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "0",
              "删除",
            ]
          ) {
            await click(dialog.getByRole("button", { name: key, exact: true }));
            expect(await dialog.count()).toBe(1);
            for (const i of [0, 1]) {
              await passcodeValue(
                scopes(p).nth(i).locator(".passcode-input"),
                "",
                6,
              );
            }
          }
          await dialog.getByRole("button", { name: "完成", exact: true }).press(
            "Space",
          );
          await eventually(async () => await dialog.count() === 0);
          dialog = await keyboard(frame, opener, index);
          await maskClose(p, dialog);
          expect(await bodyOverflow(p)).toBe(before);
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      "移动PasscodeInput 基础未设三级标题 @" + width +
        "：真实输入/数字过滤/删除/截断/六格回显",
      async (t) => {
        const p = await open(t, "/mobile/form/passcode-input");
        await p.setViewportSize({ width, height: 900 });
        const groups = p.locator(".passcode-input");
        expect(await groups.count()).toBe(7);
        await passcodeContract(p, groups.nth(1), 6);
        await passcodeValue(groups.nth(0), "", 6);
        for (let i = 2; i < 6; i++) await passcodeValue(groups.nth(i), "", 4);
        await passcodeValue(groups.nth(6), "", 6);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      "移动PasscodeInput 与 createForm @" + width +
        "：原生输入完整行为及必填/六位/提交后删除回错",
      async (t) => {
        const p = await open(t, "/mobile/form/passcode-input");
        await p.setViewportSize({ width, height: 900 });
        const form = p.locator("main form"),
          group = form.locator(".passcode-input"),
          submit = form.getByRole("button", { name: "提交", exact: true }),
          error = form.locator('[id$="-error"]'),
          toast = p.getByRole("alert").filter({ hasText: /^已提交$/ });
        await click(submit);
        expect(await error.textContent()).toBe("请输入验证码");
        await attr(group.locator("input"), "aria-invalid", "true");
        await enterPasscode(p, group, "12345", "12345", 6);
        await click(submit);
        expect(await error.textContent()).toBe("须为 6 位数字");
        expect(await toast.count()).toBe(0);
        await enterPasscode(p, group, "", "", 6);
        await passcodeContract(p, group, 6);
        await click(submit);
        await eventually(async () => await error.count() === 0);
        await attr(group.locator("input"), "aria-invalid", "false");
        expect(
          await form.evaluate((e) =>
            Array.from(new FormData(e as HTMLFormElement).entries())
          ),
        ).toEqual([["code", "567890"]]);
        await eventually(async () => await toast.count() === 1);
        await toast.waitFor({ state: "detached", timeout: 10000 });
        // Submit moved focus away: explicitly click the user-editable group before deleting.
        await group.click({ delay: 180 });
        await p.keyboard.press("ControlOrMeta+A");
        await p.keyboard.press("ArrowRight");
        await p.keyboard.press("Backspace");
        await passcodeValue(group, "56789", 6);
        await click(submit);
        expect(await error.textContent()).toBe("须为 6 位数字");
        await enterPasscode(p, group, "", "", 6);
        await click(submit);
        expect(await error.textContent()).toBe("请输入验证码");
        expect(await toast.count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );
    for (const [index, size] of ["xs", "sm", "md", "lg"].entries()) {
      it(
        "移动PasscodeInput size " + size + " @" + width +
          "：四格完整操作及尺寸/实例隔离",
        async (t) => {
          const p = await open(t, "/mobile/form/passcode-input");
          await p.setViewportSize({ width, height: 900 });
          const groups = p.locator(".passcode-input"),
            group = groups.nth(index + 2),
            cells = group.locator(":scope > div");
          expect(await cells.count()).toBe(4);
          expect(
            await cells.first().evaluate((e) => {
              const c = getComputedStyle(e);
              return [c.width, c.height, c.fontSize];
            }),
          ).toEqual([
            [28, 32, 40, 48][index] + "px",
            [28, 32, 40, 48][index] + "px",
            [14, 16, 18, 20][index] + "px",
          ]);
          expect(await group.evaluate((e) => getComputedStyle(e).gap)).toBe(
            [4, 6, 8, 10][index] + "px",
          );
          await passcodeContract(p, group, 4);
          for (let i = 0; i < 7; i++) {
            if (i !== index + 2) {
              await passcodeValue(groups.nth(i), "", i >= 2 && i < 6 ? 4 : 6);
            }
          }
        },
        DOCS_BROWSER_CONFIG,
      );
    }
    it(
      "移动PasscodeInput 自动聚焦 @" + width +
        "：真实activeElement及该实例完整键盘行为",
      async (t) => {
        const p = await open(t, "/mobile/form/passcode-input");
        await p.setViewportSize({ width, height: 900 });
        const input = p.locator("#docs-autofocus-passcode-input"),
          group = input.locator("..");
        expect(await input.evaluate((e) => document.activeElement === e)).toBe(
          true,
        );
        expect(await input.getAttribute("autofocus")).not.toBe(null);
        await p.keyboard.insertText("123");
        await passcodeValue(group, "123", 6);
        await enterPasscode(p, group, "", "", 6);
        await passcodeContract(p, group, 6);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
