/** WRITTEN-UNRUN: click the real group then use browser-native keyboard; no direct value writes. */
import { expect } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { attr, eventually, value } from "./driver.ts";
export async function passcodeValue(
  group: Locator,
  expected: string,
  length: number,
) {
  await value(group.locator("input"), expected);
  await eventually(async () =>
    JSON.stringify(await group.locator(":scope > div").allTextContents()) ===
      JSON.stringify(Array.from({ length }, (_, i) => expected[i] ?? ""))
  );
  expect(await group.locator(":scope > div").allTextContents()).toEqual(
    Array.from({ length }, (_, i) => expected[i] ?? ""),
  );
}
export async function enterPasscode(
  p: Page,
  group: Locator,
  raw: string,
  expected: string,
  length: number,
) {
  await group.click({ delay: 180 });
  expect(
    await group.locator("input").evaluate((e) => document.activeElement === e),
  ).toBe(true);
  await p.keyboard.press("ControlOrMeta+A");
  if (raw) await p.keyboard.insertText(raw);
  else await p.keyboard.press("Backspace");
  await passcodeValue(group, expected, length);
}
export async function passcodeContract(
  p: Page,
  group: Locator,
  length: number,
) {
  const input = group.locator("input");
  await attr(input, "inputmode", "numeric");
  await attr(input, "autocomplete", "one-time-code");
  await attr(input, "maxlength", String(length));
  expect(await input.isDisabled()).toBe(false);
  await passcodeValue(group, "", length);
  // Raw string is exactly maxlength characters, so digit sanitizing is independently observable.
  const mixed = length === 4 ? "1a2b" : "1a2b3c",
    clean = length === 4 ? "12" : "123";
  await enterPasscode(p, group, mixed, clean, length);
  await p.keyboard.press("Backspace");
  await passcodeValue(group, clean.slice(0, -1), length);
  await enterPasscode(
    p,
    group,
    "123456789",
    length === 4 ? "1234" : "123456",
    length,
  );
  await p.keyboard.insertText("9");
  await passcodeValue(group, length === 4 ? "1234" : "123456", length);
  await enterPasscode(p, group, "", "", length);
  expect(
    await group.locator(":scope > div").first().evaluate((e) =>
      e.classList.contains("ring-2")
    ),
  ).toBe(true);
  const final = length === 4 ? "5678" : "567890";
  await p.keyboard.insertText(final);
  await passcodeValue(group, final, length);
}
