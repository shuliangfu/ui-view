/**
 * @fileoverview createForm / formRules 单元测（无浏览器）
 */

import { describe, expect, it } from "@dreamer/test";
import { createForm } from "../../src/shared/form/create-form.ts";
import { formRules, runFormRules } from "../../src/shared/form/form-rules.ts";

describe("formRules / runFormRules", () => {
  it("required 空值失败", async () => {
    const msg = await runFormRules("", [formRules.required("必填")], {});
    expect(msg).toBe("必填");
  });

  it("email 格式", async () => {
    expect(await runFormRules("a@", [formRules.email()], {})).toBeTruthy();
    expect(await runFormRules("a@b.c", [formRules.email()], {}))
      .toBeUndefined();
  });

  it("min/max 字符串长度", async () => {
    expect(await runFormRules("ab", [formRules.min(3)], {})).toBeTruthy();
    expect(await runFormRules("abcd", [formRules.max(3)], {})).toBeTruthy();
    expect(await runFormRules("abc", [formRules.min(3), formRules.max(3)], {}))
      .toBeUndefined();
  });

  it("equalsField 交叉字段", async () => {
    const values = { password: "secret", password2: "nope" };
    const msg = await runFormRules(
      values.password2,
      [formRules.equalsField("password", "不一致")],
      values,
    );
    expect(msg).toBe("不一致");
  });

  it("自定义 validator 异步", async () => {
    const msg = await runFormRules(
      "x",
      [
        formRules.custom((v) => v === "x" ? "不可为 x" : undefined),
      ],
      {},
    );
    expect(msg).toBe("不可为 x");
  });

  it("空值跳过非 required 规则", async () => {
    expect(await runFormRules("", [formRules.email()], {})).toBeUndefined();
  });
});

describe("createForm", () => {
  it("initialValues + get/setFieldValue", () => {
    const form = createForm({
      initialValues: { name: "Ada", age: 1 },
    });
    expect(form.getFieldValue("name")).toBe("Ada");
    form.setFieldValue("name", "Bob", { validate: false });
    expect(form.values.value.name).toBe("Bob");
    expect(form.signal("name").value).toBe("Bob");
    expect(form.dirty.value).toBe(true);
  });

  it("validateFields 聚合错误", async () => {
    const form = createForm({
      initialValues: { email: "", password: "1" },
      fields: {
        email: { rules: [formRules.required(), formRules.email()] },
        password: { rules: [formRules.min(6)] },
      },
    });
    const r = await form.validateFields();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.email).toBeTruthy();
      expect(r.errors.password).toBeTruthy();
    }
    expect(form.errors.value.email).toBeTruthy();
  });

  it("validateFields 成功返回 values", async () => {
    const form = createForm({
      initialValues: { email: "a@b.c" },
      fields: { email: { rules: [formRules.required(), formRules.email()] } },
    });
    const r = await form.validateFields();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.values.email).toBe("a@b.c");
  });

  it("registerField 合并 FormItem rules", async () => {
    const form = createForm({ initialValues: { code: "" } });
    form.registerField("code", {
      rules: [formRules.required("验证码必填"), formRules.pattern(/^\d{6}$/)],
    });
    expect(await form.validateField("code")).toBe(false);
    form.setFieldValue("code", "123456", { validate: false });
    expect(await form.validateField("code")).toBe(true);
  });

  it("setFieldsError / clearErrors / resetFields", () => {
    const form = createForm({ initialValues: { a: "1" } });
    form.setFieldValue("a", "2", { validate: false });
    form.setFieldsError({ a: "坏了" });
    expect(form.getFieldError("a")).toBe("坏了");
    form.clearErrors();
    expect(form.getFieldError("a")).toBeUndefined();
    form.resetFields();
    expect(form.getFieldValue("a")).toBe("1");
    expect(form.dirty.value).toBe(false);
  });

  it("submit 失败不调用 handler；成功调用", async () => {
    const form = createForm({
      initialValues: { n: "" },
      fields: { n: { rules: [formRules.required()] } },
    });
    let called = 0;
    const fail = await form.submit(() => {
      called++;
    });
    expect(fail.ok).toBe(false);
    expect(called).toBe(0);

    form.setFieldValue("n", "ok", { validate: false });
    const ok = await form.submit(() => {
      called++;
    });
    expect(ok.ok).toBe(true);
    expect(called).toBe(1);
  });

  it("bind 写入并触发 change 校验", async () => {
    const form = createForm({
      initialValues: { q: "" },
      fields: {
        q: {
          rules: [formRules.min(2, "太短")],
          validateTrigger: "change",
        },
      },
    });
    const b = form.bind("q");
    const input = {
      type: "text",
      value: "a",
    } as HTMLInputElement;
    b.onInput({ target: input } as unknown as Event);
    // validateField 异步
    await form.validateField("q");
    expect(form.getFieldValue("q")).toBe("a");
    expect(form.errors.value.q).toBe("太短");
    expect(form.isFieldTouched("q")).toBe(true);
  });

  it("isFieldRequired 读 rules", () => {
    const form = createForm<{ x?: string; y?: string }>({
      fields: { x: { rules: [formRules.required()] } },
    });
    expect(form.isFieldRequired("x")).toBe(true);
    expect(form.isFieldRequired("y")).toBe(false);
  });

  it("bindChecked 写入布尔并校验", async () => {
    const form = createForm<{ agree: boolean }>({
      initialValues: { agree: false },
      fields: {
        agree: {
          rules: [
            formRules.custom((v) => (v === true ? undefined : "须勾选")),
          ],
          validateTrigger: "change",
        },
      },
    });
    const b = form.bindChecked("agree");
    b.onChange({
      target: { type: "checkbox", checked: true },
    } as unknown as Event);
    await form.validateField("agree");
    expect(form.getFieldValue("agree")).toBe(true);
    expect(form.errors.value.agree).toBeUndefined();
  });

  it("bindValue / bindTargetKeys 写入非 Event 值", async () => {
    const form = createForm<{ level: string; keys: string[] }>({
      initialValues: { level: "", keys: [] },
      fields: {
        level: { rules: [formRules.required()] },
        keys: {
          rules: [
            formRules.custom((v) =>
              Array.isArray(v) && v.length > 0 ? undefined : "至少一项"
            ),
          ],
        },
      },
    });
    form.bindValue("level").onChange("pro");
    form.bindTargetKeys("keys").onChange(["a", "b"]);
    const r = await form.validateFields();
    expect(r.ok).toBe(true);
    expect(form.getFieldValue("level")).toBe("pro");
    expect(form.getFieldValue("keys")).toEqual(["a", "b"]);
  });
});
