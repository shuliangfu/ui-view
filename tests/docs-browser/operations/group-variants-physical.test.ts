import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, open, section } from "./driver.ts";

async function checked(input: Locator, state: boolean) {
  await eventually(async () => await input.isChecked() === state);
  expect(await input.isChecked()).toBe(state);
}
async function hit(input: Locator) {
  const label = input.locator("xpath=ancestor::label[1]");
  if (!await input.isDisabled()) return await label.click();
  await label.scrollIntoViewIfNeeded();
  const b = await label.boundingBox();
  if (!b) throw new Error("disabled choice missing geometry");
  await input.page().mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

describe("Group variants physical", () => {
  it(
    "物理操作 CheckboxGroup：默认与四尺寸逐变体的每项反选/禁用/双快捷键全选清空",
    async (t) => {
      const page = await open(t, "/desktop/form/checkbox-group");
      const defaults = section(page, "有默认值 + 选项含 disabled").getByRole(
        "group",
      );
      const sizes = section(page, "size（xs / sm / md / lg）").getByRole(
        "group",
      );
      expect(await sizes.count()).toBe(4);
      const groups = [defaults, ...await sizes.all()];
      for (const group of groups) {
        const inputs = group.getByRole("checkbox");
        expect(await inputs.count()).toBe(3);
        for (const input of await inputs.all()) {
          const before = await input.isChecked();
          await hit(input);
          if (await input.isDisabled()) await checked(input, before);
          else {
            await checked(input, !before);
            await hit(input);
            await checked(input, before);
          }
        }
        // 先明确清空，避免初始全选时快捷键执行「反选清空」而误判。
        for (const input of await inputs.all()) {
          if (!await input.isDisabled() && await input.isChecked()) {
            await hit(
              input,
            );
          }
        }
        await group.focus();
        for (const modifier of ["Control", "Meta"]) {
          await page.keyboard.press(modifier + "+a");
          for (const input of await inputs.all()) {
            await checked(
              input,
              !await input.isDisabled(),
            );
          }
          await page.keyboard.press(modifier + "+a");
          for (const input of await inputs.all()) await checked(input, false);
        }
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 RadioGroup：四尺寸逐变体每项Space互斥与禁用命中", async (t) => {
    const page = await open(t, "/desktop/form/radio-group");
    const groups = section(page, "size（xs / sm / md / lg）").getByRole(
      "radiogroup",
    );
    expect(await groups.count()).toBe(4);
    for (const group of await groups.all()) {
      const inputs = group.getByRole("radio");
      expect(await inputs.count()).toBe(3);
      for (let i = 0; i < 2; i++) {
        const input = inputs.nth(i);
        await input.focus();
        await page.keyboard.press("Space");
        for (let j = 0; j < 3; j++) await checked(inputs.nth(j), j === i);
      }
      expect(await inputs.nth(2).isDisabled()).toBe(true);
      await hit(inputs.nth(2));
      await checked(inputs.nth(1), true);
      await checked(inputs.nth(2), false);
    }
  }, DOCS_BROWSER_CONFIG);
});
