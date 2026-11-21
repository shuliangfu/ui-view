import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, section, visible } from "./driver.ts";
async function labelClick(input: Locator) {
  const label = input.locator("xpath=ancestor::label[1]");
  if (await input.isDisabled()) {
    // Playwright intentionally refuses Locator.click on a disabled label association.
    // A real coordinate click proves that the visible disabled control does not toggle.
    await label.scrollIntoViewIfNeeded();
    const box = await rect(label);
    await input.page().mouse.click(
      box.x + box.width / 2,
      box.y + box.height / 2,
    );
  } else await label.click();
}
async function checked(input: Locator, expected: boolean) {
  await eventually(async () => await input.isChecked() === expected);
  expect(await input.isChecked()).toBe(expected);
}
async function rect(input: Locator) {
  const box = await input.boundingBox();
  if (!box) throw new Error("control has no geometry");
  return box;
}

describe("Choices physical", () => {
  it(
    "物理操作 Checkbox：共享绑定、标签点击、Space、表单name/value/id",
    async (t) => {
      const page = await open(t, "/desktop/form/checkbox");
      const base = section(page, "基础").getByRole("checkbox");
      const named = page.locator("#input-agree");
      await checked(base, false);
      await labelClick(base);
      await checked(base, true);
      await checked(named, true);
      await attr(named, "name", "agree");
      await attr(named, "value", "yes");
      await named.focus();
      await page.keyboard.press("Space");
      await checked(named, false);
      await checked(base, false);
      await labelClick(named);
      await checked(base, true);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Checkbox：错误、两种禁用、四种尺寸、半选", async (t) => {
    const page = await open(t, "/desktop/form/checkbox");
    const error = section(page, "error").getByRole("checkbox");
    await attr(error, "aria-invalid", "true");
    await labelClick(error);
    await checked(error, true);
    const disabled = section(page, "disabled").getByRole("checkbox");
    expect(await disabled.count()).toBe(2);
    for (let i = 0; i < 2; i++) {
      expect(await disabled.nth(i).isDisabled()).toBe(true);
      await labelClick(disabled.nth(i));
      await checked(disabled.nth(i), i === 1);
    }
    const sizes = section(page, "size（xs / sm / md / lg）").getByRole(
      "checkbox",
    );
    const heights = [];
    for (let i = 0; i < 4; i++) {
      const box = await rect(sizes.nth(i));
      heights.push(box.height);
      await checked(sizes.nth(i), true);
      await labelClick(sizes.nth(i));
      await checked(sizes.nth(i), false);
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
    const mixed = section(page, "半选 indeterminate").getByRole("checkbox");
    expect(await mixed.count()).toBe(3);
    expect(
      await mixed.nth(0).evaluate((el) =>
        (el as HTMLInputElement).indeterminate
      ),
    ).toBe(true);
    await checked(mixed.nth(1), true);
    await checked(mixed.nth(2), false);
    await labelClick(mixed.nth(0));
    await checked(mixed.nth(0), true);
    expect(
      await mixed.nth(0).evaluate((el) =>
        (el as HTMLInputElement).indeterminate
      ),
    ).toBe(false);
    await labelClick(mixed.nth(1));
    await checked(mixed.nth(1), false);
    await labelClick(mixed.nth(2));
    await checked(mixed.nth(2), true);
  }, DOCS_BROWSER_CONFIG);

  for (
    const [route, errorText] of [["checkbox", "请勾选同意"], [
      "switch",
      "请开启通知",
    ]]
  ) {
    it("物理操作 " + route + "：表单失败→打开→成功→关闭再次失败", async (t) => {
      const page = await open(t, "/desktop/form/" + route);
      const demo = section(page, "与 createForm");
      const input = demo.getByRole("checkbox");
      const submit = demo.getByRole("button", { name: "提交", exact: true });
      await submit.click();
      await visible(demo.getByText(errorText, { exact: true }));
      await checked(input, false);
      await labelClick(input);
      await checked(input, true);
      await submit.click();
      await visible(page.getByText("已提交", { exact: true }));
      await visible(demo.getByText(errorText, { exact: true }), false);
      await labelClick(input);
      await submit.click();
      await visible(demo.getByText(errorText, { exact: true }));
      await checked(input, false);
    }, DOCS_BROWSER_CONFIG);
  }

  it("物理操作 Switch：共享绑定、开关文案、Space与name/id", async (t) => {
    const page = await open(t, "/desktop/form/switch");
    const base = section(page, "基础").getByRole("checkbox");
    const named = page.locator("#switch-notify");
    const textDemo = section(page, "checkedChildren / unCheckedChildren");
    await checked(base, false);
    await visible(textDemo.getByText("关", { exact: true }));
    await visible(textDemo.getByText("开", { exact: true }), false);
    await labelClick(base);
    await checked(base, true);
    await checked(named, true);
    await visible(textDemo.getByText("开", { exact: true }));
    await visible(textDemo.getByText("关", { exact: true }), false);
    await attr(named, "name", "notify");
    await named.focus();
    await page.keyboard.press("Space");
    await checked(base, false);
    await labelClick(textDemo.getByRole("checkbox"));
    await checked(base, true);
    await checked(named, true);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Switch：错误、禁用双态、四尺寸及旋钮位置", async (t) => {
    const page = await open(t, "/desktop/form/switch");
    const demo = section(page, "error / disabled");
    const inputs = demo.getByRole("checkbox");
    await attr(inputs.nth(0), "aria-invalid", "true");
    await labelClick(inputs.nth(0));
    await checked(inputs.nth(0), true);
    for (let i = 1; i < 3; i++) {
      expect(await inputs.nth(i).isDisabled()).toBe(true);
      await labelClick(inputs.nth(i));
      await checked(inputs.nth(i), i === 2);
    }
    const sizes = section(page, "size（xs / sm / md / lg）").getByRole(
      "checkbox",
    )
      .locator("xpath=ancestor::label[1]");
    expect(await sizes.count()).toBe(4);
    const widths = [];
    for (let i = 0; i < 4; i++) {
      const label = sizes.nth(i),
        input = label.getByRole("checkbox"),
        track = label.locator('span[aria-hidden="true"]');
      const on = await rect(track.locator(":scope > span").first());
      widths.push((await rect(track)).width);
      await label.click();
      await checked(input, false);
      await eventually(async () =>
        (await rect(track.locator(":scope > span").first())).x < on.x - 2
      );
      await input.focus();
      await page.keyboard.press("Space");
      await checked(input, true);
    }
    for (let i = 1; i < 4; i++) expect(widths[i] > widths[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 CheckboxGroup：逐项勾反选、默认值、禁用项、Ctrl/Meta全选清空",
    async (t) => {
      const page = await open(t, "/desktop/form/checkbox-group");
      const base = section(page, "基础");
      const x = base.getByRole("checkbox", { name: "选项 X", exact: true }),
        y = base.getByRole("checkbox", { name: "选项 Y", exact: true }),
        z = base.getByRole("checkbox", { name: "选项 Z", exact: true });
      await labelClick(x);
      await checked(x, true);
      await labelClick(y);
      await checked(x, true);
      await checked(y, true);
      await labelClick(x);
      await checked(x, false);
      await checked(y, true);
      expect(await z.isDisabled()).toBe(true);
      await labelClick(z);
      await checked(z, false);
      const group = base.getByRole("group");
      await group.focus();
      for (const modifier of ["Control", "Meta"]) {
        await page.keyboard.press(modifier + "+a");
        await checked(x, true);
        await checked(y, true);
        await checked(z, false);
        await page.keyboard.press(modifier + "+a");
        await checked(x, false);
        await checked(y, false);
      }
      const defaults = section(page, "有默认值 + 选项含 disabled");
      await checked(
        defaults.getByRole("checkbox", { name: "选项 X", exact: true }),
        true,
      );
      await checked(
        defaults.getByRole("checkbox", { name: "选项 Y", exact: true }),
        true,
      );
      await labelClick(
        defaults.getByRole("checkbox", { name: "选项 X", exact: true }),
      );
      await checked(
        defaults.getByRole("checkbox", { name: "选项 X", exact: true }),
        false,
      );
      await checked(
        defaults.getByRole("checkbox", { name: "选项 Y", exact: true }),
        true,
      );
    },
    DOCS_BROWSER_CONFIG,
  );

  for (
    const [route, role, first, second] of [[
      "checkbox-group",
      "checkbox",
      "选项 X",
      "选项 Y",
    ], ["radio-group", "radio", "单选 1", "单选 2"]] as const
  ) {
    it(
      "物理操作 " + route + "：横纵布局、错误/禁用、四尺寸分别操作",
      async (t) => {
        const page = await open(t, "/desktop/form/" + route);
        const titles = route === "checkbox-group"
          ? [
            "direction=horizontal（横向）",
            "direction=vertical + 紧排（纵向 + class 缩小间距）",
          ]
          : ["direction=horizontal（横向）", "direction=vertical（纵向）"];
        for (let i = 0; i < 2; i++) {
          const demo = section(page, titles[i]);
          const a = demo.getByRole(role, { name: first, exact: true }),
            b = demo.getByRole(role, { name: second, exact: true });
          const ar = await rect(a.locator("xpath=ancestor::label[1]")),
            br = await rect(b.locator("xpath=ancestor::label[1]"));
          expect(
            i === 0 ? Math.abs(ar.y - br.y) < 3 : br.y > ar.y + ar.height - 1,
          ).toBe(true);
          if (route === "checkbox-group" && i === 1) {
            expect(
              await demo.getByRole("group").evaluate((el) =>
                getComputedStyle(el).rowGap
              ),
            ).toBe("4px");
          }
          if (role === "radio") {
            await labelClick(b);
            await checked(b, true);
            await checked(a, false);
          } else {
            // Both layout demos share val2, initially [x,y]; restore it after each round trip.
            await checked(b, true);
            await labelClick(b);
            await checked(b, false);
            await labelClick(b);
            await checked(b, true);
          }
        }
        const state = section(page, "error / disabled");
        const groups = state.getByRole(
          role === "radio" ? "radiogroup" : "group",
        );
        await attr(groups.nth(0), "aria-invalid", "true");
        await labelClick(
          groups.nth(0).getByRole(role, { name: second, exact: true }),
        );
        await checked(
          groups.nth(0).getByRole(role, { name: second, exact: true }),
          true,
        );
        const disabled = groups.nth(1).getByRole(role);
        expect(await disabled.count()).toBe(3);
        for (let i = 0; i < 3; i++) {
          const input = disabled.nth(i);
          expect(await input.isDisabled()).toBe(true);
          const before = await input.isChecked();
          await labelClick(input);
          await checked(input, before);
        }
        const sizes = section(page, "size（xs / sm / md / lg）").getByRole(
          role === "radio" ? "radiogroup" : "group",
        );
        expect(await sizes.count()).toBe(4);
        const heights = [];
        for (let i = 0; i < 4; i++) {
          const input = sizes.nth(i).getByRole(role, {
            name: second,
            exact: true,
          });
          heights.push((await rect(input)).height);
          await labelClick(input);
          await checked(input, true);
        }
        for (let i = 1; i < 4; i++) {
          expect(heights[i] > heights[i - 1]).toBe(true);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }

  it("物理操作 RadioGroup：互斥、默认值、禁用项、再次点击及键盘", async (t) => {
    const page = await open(t, "/desktop/form/radio-group");
    const base = section(page, "基础");
    const a = base.getByRole("radio", { name: "单选 1", exact: true }),
      b = base.getByRole("radio", { name: "单选 2", exact: true });
    await checked(a, true);
    await labelClick(b);
    await checked(a, false);
    await checked(b, true);
    await labelClick(b);
    await checked(b, true);
    await a.focus();
    await page.keyboard.press("Space");
    await checked(a, true);
    await checked(b, false);
    const defaults = section(page, "有默认值 + 选项含 disabled");
    await checked(
      defaults.getByRole("radio", { name: "单选 2", exact: true }),
      true,
    );
    const disabled = defaults.getByRole("radio", {
      name: "单选 3",
      exact: true,
    });
    expect(await disabled.isDisabled()).toBe(true);
    await labelClick(disabled);
    await checked(disabled, false);
    await checked(
      defaults.getByRole("radio", { name: "单选 2", exact: true }),
      true,
    );
    await labelClick(
      defaults.getByRole("radio", { name: "单选 1", exact: true }),
    );
    await checked(
      defaults.getByRole("radio", { name: "单选 1", exact: true }),
      true,
    );
    await checked(
      defaults.getByRole("radio", { name: "单选 2", exact: true }),
      false,
    );
  }, DOCS_BROWSER_CONFIG);

  for (
    const [route, errorText, label] of [
      ["checkbox-group", "请至少选一项", "X"],
      [
        "radio-group",
        "请选择级别",
        "A",
      ],
    ]
  ) {
    it("物理操作 " + route + "：表单校验与提交", async (t) => {
      const page = await open(t, "/desktop/form/" + route);
      const demo = section(page, "与 createForm");
      await demo.getByRole("button", { name: "提交", exact: true }).click();
      await visible(demo.getByText(errorText, { exact: true }));
      const input = demo.getByRole(
        route === "checkbox-group" ? "checkbox" : "radio",
        { name: label, exact: true },
      );
      await labelClick(input);
      await checked(input, true);
      await demo.getByRole("button", { name: "提交", exact: true }).click();
      await visible(page.getByText("已提交", { exact: true }));
      await visible(demo.getByText(errorText, { exact: true }), false);
    }, DOCS_BROWSER_CONFIG);
  }
});
