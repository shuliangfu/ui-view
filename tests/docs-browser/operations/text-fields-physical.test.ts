import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, value, visible } from "./driver.ts";

describe("Text fields physical", () => {
  it("物理操作 Input：逐字输入、清除、必填、错误、只读、禁用", async (t) => {
    const page = await open(t, "/desktop/form/input");
    const base = page.locator("#input-placeholder");
    await base.pressSequentially("browser typing");
    await value(base, "browser typing");
    expect(await base.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    const clear = page.getByPlaceholder("输入内容后出现清除按钮", {
      exact: true,
    });
    await clear.fill("to clear");
    await section(page, "allowClear 可清除").getByRole("button", {
      name: "清除",
      exact: true,
    }).click();
    await value(clear, "");
    const required = page.locator("#input-required");
    await attr(required, "aria-required", "true");
    await required.fill("required filled");
    await value(required, "required filled");
    const hidden = page.locator("#input-hide-mark");
    await attr(hidden, "aria-required", "true");
    expect(
      await section(page, "FormItem：hideRequiredMark").locator("label")
        .textContent(),
    ).not.toContain("*");
    await hidden.fill("still required");
    await value(hidden, "still required");
    const error = page.locator("#input-error");
    await attr(error, "aria-invalid", "true");
    await visible(
      section(page, "error").getByText("请输入有效内容", { exact: true }),
    );
    await error.fill("retains input despite error");
    await value(error, "retains input despite error");
    const readonly = page.locator("#input-readonly");
    const before = await readonly.inputValue();
    expect(await readonly.isEditable()).toBe(false);
    await readonly.click();
    await page.keyboard.type("ignored");
    await value(readonly, before);
    const disabled = page.locator("#input-disabled");
    expect(await disabled.isDisabled()).toBe(true);
    await value(disabled, "");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Input：标签布局、类型前后缀、尺寸均可输入", async (t) => {
    const page = await open(t, "/desktop/form/input");
    for (
      const id of [
        "left-name",
        "left-phone",
        "left-email",
        "right-name",
        "right-phone",
        "right-email",
        "input-email",
        "input-prefix",
        "input-suffix",
        "input-prefix-user",
        "input-prefix-lock",
        "size-xs",
        "size-sm",
        "size-md",
        "size-lg",
      ]
    ) {
      const input = page.locator("#" + id);
      await input.fill(id + "@example.test");
      await value(input, id + "@example.test");
    }
    await attr(page.locator("#input-email"), "type", "email");
    await attr(page.locator("#input-prefix-lock"), "type", "password");
    await visible(
      section(page, "type / prefix / suffix").locator("form").getByText(
        "https://",
        {
          exact: true,
        },
      ),
    );
    await visible(
      section(page, "type / prefix / suffix").locator("form").getByText(
        ".com",
        {
          exact: true,
        },
      ),
    );
    const heights = [];
    for (const size of ["xs", "sm", "md", "lg"]) {
      const bounds = await page.locator("#size-" + size).boundingBox();
      if (!bounds) throw new Error("size missing");
      heights.push(bounds.height);
    }
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i] > heights[i - 1]).toBe(true);
    }
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Input：表单空值校验、填值成功后错误消失", async (t) => {
    const page = await open(t, "/desktop/form/input");
    const demo = section(page, "与 createForm");
    const input = demo.getByPlaceholder("必填用户名", { exact: true });
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await attr(input, "aria-invalid", "true");
    await input.pressSequentially("browser-user");
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await visible(page.getByText("ok", { exact: true }));
    expect(await input.getAttribute("aria-invalid")).not.toBe("true");
    await value(input, "browser-user");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Input：自动填充属性、自动聚焦、描边标签输入",
    async (t) => {
      const page = await open(t, "/desktop/form/input");
      expect(
        await page.locator("#docs-autofocus-input").evaluate((el) =>
          el === document.activeElement
        ),
      ).toBe(true);
      for (
        const [id, type] of [["doc-input-autofill-email", "email"], [
          "doc-input-autofill-password",
          "password",
        ]]
      ) {
        const input = page.locator("#" + id);
        await attr(input, "type", type);
        expect(await input.getAttribute("autocomplete")).not.toBe(null);
        await input.fill("autofill@example.test");
        await value(input, "autofill@example.test");
      }
      for (
        const id of [
          "outline-empty",
          "outline-filled",
          "outline-float",
          "outline-item",
          "outline-pwd",
          "outline-area",
          "outline-color",
        ]
      ) {
        const input = page.locator("#" + id);
        await input.fill("outline content");
        await value(input, "outline content");
        await input.blur();
        await value(input, "outline content");
      }
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Textarea：多行逐字输入、最大长度及字数同步", async (t) => {
    const page = await open(t, "/desktop/form/textarea");
    const base = page.getByPlaceholder("多行输入", { exact: true });
    await base.pressSequentially("line one");
    await base.press("Enter");
    await base.pressSequentially("line two");
    await value(base, "line one\nline two");
    expect(await base.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    await attr(base, "rows", "3");
    const limit = page.getByPlaceholder("输入会显示字数", { exact: true });
    await limit.fill("12345");
    await visible(
      section(page, "maxLength（展示已用/总数）").getByText("剩余 195 / 200", {
        exact: true,
      }),
    );
    await limit.fill("x".repeat(200));
    await limit.pressSequentially("overflow");
    await value(limit, "x".repeat(200));
    await visible(
      section(page, "maxLength（展示已用/总数）").getByText("剩余 0 / 200", {
        exact: true,
      }),
    );
    await limit.fill("");
    await visible(
      section(page, "maxLength（展示已用/总数）").getByText("剩余 200 / 200", {
        exact: true,
      }),
    );
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Textarea：错误、只读、禁用、四种尺寸与自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/textarea");
    expect(
      await page.getByPlaceholder("挂载后自动聚焦", { exact: true }).evaluate(
        (el) => el === document.activeElement,
      ),
    ).toBe(true);
    const error = page.getByPlaceholder("错误态红框", { exact: true });
    await attr(error, "aria-invalid", "true");
    await visible(
      section(page, "required / error").getByText("内容不能为空", {
        exact: true,
      }),
    );
    await error.fill("editable error field");
    await value(error, "editable error field");
    const readonly = section(page, "readOnly").locator("textarea");
    const before = await readonly.inputValue();
    expect(await readonly.isEditable()).toBe(false);
    await readonly.click();
    await page.keyboard.type("ignored");
    await value(readonly, before);
    const disabled = page.getByPlaceholder("禁用", { exact: true });
    expect(await disabled.isDisabled()).toBe(true);
    await attr(disabled, "rows", "5");
    for (const size of ["xs", "sm", "md", "lg"]) {
      const input = page.getByPlaceholder(size, { exact: true });
      await input.fill(size + "\nsecond line");
      await value(input, size + "\nsecond line");
      expect(await input.evaluate((el) => (el as HTMLTextAreaElement).rows))
        .toBe(
          2,
        );
    }
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Textarea：表单空值校验与成功提交", async (t) => {
    const page = await open(t, "/desktop/form/textarea");
    const demo = section(page, "与 createForm");
    const input = demo.getByPlaceholder("必填多行", { exact: true });
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await attr(input, "aria-invalid", "true");
    await input.fill("submitted\nmultiline");
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await visible(page.getByText("ok", { exact: true }));
    expect(await input.getAttribute("aria-invalid")).not.toBe("true");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Password：强度随逐字输入变化、清空、无强度示例显隐",
    async (t) => {
      const page = await open(t, "/desktop/form/password");
      const strength = section(page, "带强度提示（showStrength）");
      const input = strength.locator("input");
      await input.pressSequentially("a");
      await visible(strength.getByText("强度：弱", { exact: true }));
      await input.fill("Abcd1234!@#$");
      await visible(strength.getByText("强度：强", { exact: true }));
      await input.fill("");
      await visible(strength.getByText(/^强度：/), false);
      const demo = section(page, "无强度提示");
      const pwd = demo.getByPlaceholder("仅显隐切换", { exact: true });
      await pwd.fill("retain-secret");
      await demo.getByRole("button", { name: "显示密码", exact: true }).click();
      await attr(pwd, "type", "text");
      await value(pwd, "retain-secret");
      await demo.getByRole("button", { name: "隐藏密码", exact: true }).click();
      await attr(pwd, "type", "password");
      await value(pwd, "retain-secret");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Password：前缀显隐保值、禁用、尺寸、自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/password");
    expect(
      await page.getByPlaceholder("挂载后自动聚焦", { exact: true }).evaluate(
        (el) => el === document.activeElement,
      ),
    ).toBe(true);
    const prefix = section(page, "prefix 前缀");
    const input = prefix.locator("input");
    await input.fill("prefix-secret");
    await prefix.getByRole("button", { name: "显示密码", exact: true }).click();
    await attr(input, "type", "text");
    await value(input, "prefix-secret");
    await prefix.getByRole("button", { name: "隐藏密码", exact: true }).click();
    await attr(input, "type", "password");
    expect(await page.getByPlaceholder("禁用", { exact: true }).isDisabled())
      .toBe(true);
    for (const size of ["xs", "sm", "md", "lg"]) {
      const pwd = page.getByPlaceholder(size, { exact: true });
      await pwd.fill("size-secret-" + size);
      await value(pwd, "size-secret-" + size);
      await attr(pwd, "type", "password");
    }
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Password：表单空值校验与成功提交", async (t) => {
    const page = await open(t, "/desktop/form/password");
    const demo = section(page, "与 createForm");
    const input = demo.getByPlaceholder("必填密码", { exact: true });
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await attr(input, "aria-invalid", "true");
    await input.fill("valid-secret");
    await demo.getByRole("button", { name: "校验", exact: true }).click();
    await visible(page.getByText("ok", { exact: true }));
    expect(await input.getAttribute("aria-invalid")).not.toBe("true");
  }, DOCS_BROWSER_CONFIG);
});
