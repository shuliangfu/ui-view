import { expect } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { attr, visible } from "./driver.ts";
export async function pickTime(
  panel: Locator,
  time: { hour?: number; minute?: number; second?: number },
  scope = "default",
) {
  for (const [kind, n] of Object.entries(time)) {
    const column = panel.locator(
      `[data-picker-time-strip-scope="${scope}"] [data-picker-time-kind="${kind}"]`,
    );
    await visible(column);
    const cell = column.locator(`button[data-picker-cell-value="${n}"]`);
    await cell.click({ delay: 180 });
    expect(await cell.getAttribute("data-picker-time-active")).not.toBe(null);
  }
}
export async function confirmTime(
  button: Locator,
  time: { hour?: number; minute?: number; second?: number },
) {
  await button.click();
  const panel = button.page().getByRole("dialog");
  await visible(panel);
  await pickTime(panel, time);
  await panel.getByRole("button", { name: "确定", exact: true }).click();
  await attr(button, "aria-expanded", "false");
}
