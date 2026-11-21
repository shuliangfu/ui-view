/** Physical browser driver: failures are never silently skipped. */
import { expect } from "@dreamer/test";
import type { TestContext } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { sharedEnv } from "../helpers.ts";
export async function open(
  t: TestContext | undefined,
  route: string,
): Promise<Page> {
  if (!t?.browser?.page) {
    throw new Error("Physical tests require Playwright Page");
  }
  await sharedEnv.goto(t, route);
  const page = t.browser.page as Page;
  page.setDefaultTimeout(8000);
  return page;
}
export function section(page: Page, title: string): Locator {
  return page.getByRole("heading", { name: title, exact: true }).locator(
    "xpath=ancestor::section[1]",
  );
}

/** 整个 DocsDemo 壳（标题 + 预览 + 代码示例），仅在断言源码时用。 */
export function docsDemo(page: Page, title: string): Locator {
  return page.getByRole("heading", { name: title, exact: true }).locator(
    "..",
  );
}

/**
 * 文档示例的实时预览：标题后第一个 div/form/section。
 * 会跳过说明段落，以及本身就是「代码示例」的代码块（文案以「代码示例」开头）；
 * 预览容器内部再带代码块的（如 Title 层级）仍算预览。
 * 需要断言源码、复制按钮，或代码块后还有填充节点时，用 docsDemo。
 */
export function example(page: Page, title: string | RegExp): Locator {
  return page.getByRole("heading", {
    name: title,
    exact: typeof title === "string",
  }).locator(
    "xpath=following-sibling::*[self::div or self::form or self::section][not(starts-with(normalize-space(.), '代码示例'))][1]",
  );
}
export async function attr(
  el: Locator,
  name: string,
  expected: string | null,
): Promise<void> {
  await eventually(async () => await el.getAttribute(name) === expected);
  expect(await el.getAttribute(name)).toBe(expected);
}
export async function value(el: Locator, expected: string): Promise<void> {
  await eventually(async () => await el.inputValue() === expected);
  expect(await el.inputValue()).toBe(expected);
}
export async function eventually(
  probe: () => boolean | Promise<boolean>,
): Promise<void> {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    if (await probe()) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  expect(await probe()).toBe(true);
}
export async function visible(el: Locator, expected = true): Promise<void> {
  await eventually(async () => await el.isVisible() === expected);
}

/** 选择器触发器上可见的已选文案（不含用于撑宽的隐藏占位）。 */
export async function pickerText(trigger: Locator): Promise<string> {
  const label = trigger.locator("[data-ui-picker-placeholder] + span");
  return ((await label.textContent()) ?? "").trim();
}
