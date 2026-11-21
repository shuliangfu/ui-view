import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import {
  CREATE_FORM_OPTIONS_API,
  FORM_API,
  FORM_ITEM_API,
  FORM_RULES_API,
  FORM_STORE_API,
} from "../../../docs/src/routes/desktop/form/form-item-api.ts";
import { MESSAGES_FORM_LIST } from "../../../docs/src/data/component-messages-rows.ts";

import { attr, eventually, open, value, visible } from "./driver.ts";

const route = "/desktop/form/form-containers";
function demo(page: Page, title: string): Locator {
  return page.getByRole("heading", { name: title, exact: true }).locator(
    "xpath=..",
  );
}
function base(page: Page): Locator {
  return demo(page, "createForm：校验 · 绑定 · 提交").locator("form");
}
async function error(input: Locator, expected: string): Promise<void> {
  const id = await input.getAttribute("id");
  if (!id) throw new Error("bound field must have an accessible control id");
  await attr(input, "aria-invalid", "true");
  const message = input.page().locator(`[id="${id}-error"]`);
  await visible(message);
  expect(await message.textContent()).toBe(expected);
}
async function submit(form: Locator): Promise<void> {
  await form.getByRole("button", { name: "提交", exact: true }).click({
    delay: 150,
  });
}
async function valid(form: Locator): Promise<void> {
  for (
    const [i, text] of ["User_1", "user@example.com", "Abc12345", "Abc12345"]
      .entries()
  ) {
    await form.locator("input").nth(i).fill(text);
  }
}
async function checked(input: Locator, expected: boolean): Promise<void> {
  await eventually(async () => await input.isChecked() === expected);
  expect(await input.isChecked()).toBe(expected);
}
async function labelClick(input: Locator): Promise<void> {
  await input.locator("xpath=ancestor::label[1]").click({ delay: 180 });
}

describe("Form containers physical", () => {
  it("物理操作 Form：空提交四字段必填、错误关联、dirty和重置", async (t) => {
    const page = await open(t, route),
      form = base(page),
      inputs = form.locator("input");
    await visible(
      form.getByText("dirty: false · submitting: false", { exact: true }),
    );
    await submit(form);
    const messages = ["请输入用户名", "此项为必填", "此项为必填", "请确认密码"];
    for (let i = 0; i < 4; i++) await error(inputs.nth(i), messages[i]);
    expect(await form.getByText(/^onFinish values:/).count()).toBe(0);
    await inputs.first().fill("User");
    await visible(
      form.getByText("dirty: true · submitting: false", { exact: true }),
    );
    await form.getByRole("button", { name: "重置", exact: true }).click();
    for (let i = 0; i < 4; i++) {
      await value(inputs.nth(i), "");
      await attr(inputs.nth(i), "aria-invalid", "false");
    }
    expect(await form.locator('[id$="-error"]').count()).toBe(0);
    await visible(
      form.getByText("dirty: false · submitting: false", { exact: true }),
    );
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Form：用户名最短最长和字母开头规则不接受无效提交", async (t) => {
    const page = await open(t, route),
      form = base(page),
      username = form.locator("input").first();
    await valid(form);
    for (
      const [text, message] of [
        ["U", "至少 2 个字符"],
        ["U".repeat(33), "最多 32 个字符"],
        ["1user", "字母开头，仅字母数字下划线"],
        ["User!", "字母开头，仅字母数字下划线"],
      ]
    ) {
      await username.fill(text);
      await submit(form);
      await error(username, message);
      expect(await form.getByText(/^onFinish values:/).count()).toBe(0);
    }
    await username.fill("U".repeat(32));
    await submit(form);
    await attr(username, "aria-invalid", "false");
    await visible(page.getByText("校验通过，已提交", { exact: true }));
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Form：邮箱格式、密码长度和交叉字段比较逐次纠正", async (t) => {
    const page = await open(t, route),
      form = base(page),
      inputs = form.locator("input");
    await valid(form);
    await inputs.nth(1).fill("not-an-email");
    await inputs.nth(2).fill("short");
    await inputs.nth(3).fill("other");
    await submit(form);
    await error(inputs.nth(1), "请输入有效邮箱");
    await error(inputs.nth(2), "至少 6 位");
    await error(inputs.nth(3), "两次输入不一致");
    expect(await form.getByText(/^onFinish values:/).count()).toBe(0);
    await inputs.nth(1).fill("user@example.com");
    await inputs.nth(2).fill("Abc12345");
    await inputs.nth(3).fill("Abc12345");
    await submit(form);
    for (let i = 0; i < 4; i++) {
      await attr(inputs.nth(i), "aria-invalid", "false");
    }
    // Changing the referenced field must be checked against the unchanged confirmation.
    await inputs.nth(2).fill("Different123");
    await submit(form);
    await error(inputs.nth(3), "两次输入不一致");
    await inputs.nth(3).fill("Different123");
    await submit(form);
    await attr(inputs.nth(3), "aria-invalid", "false");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 Form：连续键入不失焦、提交精确数据、重置清结果和再次提交",
    async (t) => {
      const page = await open(t, route),
        form = base(page),
        inputs = form.locator("input");
      const username = inputs.first(),
        original = await username.elementHandle();
      await username.click();
      await page.keyboard.type("User_1", { delay: 40 });
      await value(username, "User_1");
      expect(
        await username.evaluate(
          (el, before) => el === before && el === document.activeElement,
          original,
        ),
      ).toBe(true);
      await inputs.nth(1).fill("user@example.com");
      await inputs.nth(2).fill("Abc12345");
      await inputs.nth(3).fill("Abc12345");
      await inputs.nth(3).press("Enter");
      const result = form.getByText(/^onFinish values:/);
      await visible(result);
      expect(await result.textContent()).toBe(
        'onFinish values: {"username":"User_1","email":"user@example.com","password":"Abc12345","password2":"Abc12345"}',
      );
      await visible(
        form.getByText("dirty: true · submitting: false", { exact: true }),
      );
      await form.getByRole("button", { name: "重置", exact: true }).click();
      expect(await result.count()).toBe(0);
      for (let i = 0; i < 4; i++) await value(inputs.nth(i), "");
      await submit(form);
      await error(inputs.first(), "请输入用户名");
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Form：Select/Checkbox/Switch/Radio绑定、成功和再次拒绝",
    async (t) => {
      const page = await open(t, route);
      const form = demo(
        page,
        "bind 变体：Select · Checkbox · Switch · RadioGroup",
      ).locator("form");
      const city = form.locator("button[aria-haspopup]"),
        checks = form.getByRole("checkbox");
      const agree = checks.nth(0),
        notify = checks.nth(1),
        radios = form.getByRole("radio");
      const send = form.getByRole("button", {
        name: "校验并提交",
        exact: true,
      });
      await checked(agree, false);
      await checked(notify, true);
      await checked(radios.nth(0), true);
      await checked(radios.nth(1), false);
      await send.click();
      await visible(form.getByText("请选择城市", { exact: true }));
      await visible(form.getByText("请勾选同意", { exact: true }));
      await city.click();
      await page.getByRole("option", { name: "北京", exact: true }).click({
        delay: 180,
      });
      await labelClick(agree);
      await checked(agree, true);
      await labelClick(notify);
      await checked(notify, false);
      await labelClick(radios.nth(1));
      await checked(radios.nth(0), false);
      await checked(radios.nth(1), true);
      await send.click();
      await visible(page.getByText("变体表单校验通过", { exact: true }));
      expect(await form.locator('[id$="-error"]').count()).toBe(0);
      await city.click();
      await page.getByRole("option", { name: "请选择", exact: true }).click();
      await agree.focus();
      await page.keyboard.press("Space");
      await checked(agree, false);
      await labelClick(notify);
      await checked(notify, true);
      await radios.nth(0).focus();
      await page.keyboard.press("Space");
      await checked(radios.nth(0), true);
      await checked(radios.nth(1), false);
      await send.click();
      await visible(form.getByText("请选择城市", { exact: true }));
      await visible(form.getByText("请勾选同意", { exact: true }));
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Form：三布局可编辑、实际flex属性及horizontal断点", async (t) => {
    const page = await open(t, route),
      forms = demo(page, "Form：layout").locator("form");
    const viewport = page.viewportSize();
    try {
      await page.setViewportSize({ width: 1280, height: 900 });
      expect(await forms.count()).toBe(3);
      for (let i = 0; i < 3; i++) {
        const form = forms.nth(i);
        expect(await form.evaluate((el) => getComputedStyle(el).display)).toBe(
          "flex",
        );
        expect(await form.evaluate((el) => getComputedStyle(el).flexDirection))
          .toBe(i === 0 ? "column" : "row");
        for (let j = 0; j < 2; j++) {
          await form.locator("input").nth(j).fill(`layout-${i}-${j}`);
          await value(form.locator("input").nth(j), `layout-${i}-${j}`);
        }
      }
      expect(
        await forms.nth(2).evaluate((el) => getComputedStyle(el).alignItems),
      )
        .toBe("flex-end");
      await page.setViewportSize({ width: 600, height: 900 });
      expect(
        await forms.nth(1).evaluate((el) => getComputedStyle(el).flexDirection),
      ).toBe("column");
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          await value(forms.nth(i).locator("input").nth(j), `layout-${i}-${j}`);
        }
      }
    } finally {
      if (viewport) await page.setViewportSize(viewport);
    }
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 FormItem：左标签关联聚焦、必填星号和outline真实浮起",
    async (t) => {
      const page = await open(t, route),
        block = demo(page, "FormItem：标签位置与必填");
      const left = block.locator('label[for="fc-email"]'),
        email = block.locator("#fc-email");
      expect(await left.locator('[aria-hidden="true"]').textContent()).toBe(
        "*",
      );
      expect(await left.evaluate((el) => getComputedStyle(el).justifyContent))
        .toBe("flex-end");
      await left.click();
      expect(await email.evaluate((el) => el === document.activeElement)).toBe(
        true,
      );
      await page.keyboard.type("user@example.com");
      await value(email, "user@example.com");
      const outlined = block.locator("#fc-outline"),
        field = outlined.locator("xpath=ancestor::fieldset[1]");
      const legend = field.locator("legend");
      expect((await legend.textContent())?.replace(/\s/g, "")).toBe("手机号*");
      expect(await legend.evaluate((el) => getComputedStyle(el).opacity)).toBe(
        "0",
      );
      await outlined.fill("13800138000");
      await eventually(async () =>
        await legend.evaluate((el) => getComputedStyle(el).opacity) === "1"
      );
      await email.click();
      expect(await legend.evaluate((el) => getComputedStyle(el).opacity)).toBe(
        "1",
      );
      await outlined.fill("");
      await email.click();
      await eventually(async () =>
        await legend.evaluate((el) => getComputedStyle(el).opacity) === "0"
      );
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 FormList：连续输入不失焦、追加保留、删中间首尾至空再加",
    async (t) => {
      const page = await open(t, route),
        list = demo(page, "FormList：动态增减行").getByRole("group", {
          name: "动态列表",
          exact: true,
        });
      const inputs = list.locator("input"),
        add = list.getByRole("button", { name: "添加一行", exact: true });
      expect(await inputs.count()).toBe(2);
      const original = await inputs.first().elementHandle();
      await inputs.first().click();
      await page.keyboard.type("alpha", { delay: 40 });
      await value(inputs.first(), "alpha");
      expect(
        await inputs.first().evaluate(
          (el, before) => el === before && el === document.activeElement,
          original,
        ),
      ).toBe(true);
      await inputs.nth(1).fill("beta");
      await add.click({ delay: 180 });
      await eventually(async () => await inputs.count() === 3);
      await value(inputs.nth(0), "alpha");
      await value(inputs.nth(1), "beta");
      await value(inputs.nth(2), "");
      await inputs.nth(2).fill("gamma");
      await list.getByRole("button", { name: "删除第 2 项", exact: true })
        .click({
          delay: 180,
        });
      await eventually(async () => await inputs.count() === 2);
      await value(inputs.nth(0), "alpha");
      await value(inputs.nth(1), "gamma");
      await attr(inputs.nth(1), "placeholder", "第 2 行");
      await list.getByRole("button", { name: "删除第 1 项", exact: true })
        .click();
      await eventually(async () => await inputs.count() === 1);
      await value(inputs.first(), "gamma");
      await list.getByRole("button", { name: "删除第 1 项", exact: true })
        .click();
      await eventually(async () => await inputs.count() === 0);
      expect(await list.getByRole("button", { name: /^删除第/ }).count()).toBe(
        0,
      );
      await add.click();
      await eventually(async () => await inputs.count() === 1);
      await value(inputs.first(), "");
      await inputs.first().fill("recreated");
      await value(inputs.first(), "recreated");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Form：整表禁用实际命中不输入、不触发提交导航", async (t) => {
    const page = await open(t, route),
      form = demo(page, "整表禁用").locator("form");
    const input = form.locator("input"),
      button = form.getByRole("button", { name: "提交", exact: true });
    expect(await input.isDisabled()).toBe(true);
    expect(await button.isDisabled()).toBe(true);
    const url = page.url();
    for (const target of [input, button]) {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      if (!box) throw new Error("disabled form control has no geometry");
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
        delay: 180,
      });
      await page.keyboard.type("blocked");
      await value(input, "");
    }
    expect(page.url()).toBe(url);
  }, DOCS_BROWSER_CONFIG);

  const listApi = [
    [
      "items",
      "unknown[] | number | (() => unknown[] | number) | Signal<unknown[] | number>",
      "-",
      "列表长度：数组用 length，number 仅表示行数。请传行数 signal 本身，勿写 items={count.value}",
    ],
    ["onAdd", "() => void", "-", "点击「添加」时回调；不传则不渲染添加按钮"],
    [
      "onRemove",
      "(index: number) => void",
      "-",
      "点击某行「删除」时回调；不传则不渲染删除按钮",
    ],
    ["addButtonText", "string", '"添加一项"', "添加按钮文案"],
    ["class", "string", "-", "外层容器 class"],
    [
      "renderRow",
      "(index, ctx) => unknown",
      "-",
      "按行渲染；ctx.removeButton 在传了 onRemove 时为删除按钮，请赋给 FormItem.trailing",
    ],
    [
      "children",
      "unknown",
      "-",
      "无 renderRow 时每行挂载同一模板；按索引变化请用 renderRow",
    ],
    [
      "messages",
      "Partial<FormListMessages>",
      "-",
      "本地化文案；addButtonText 仍优先于 messages.addButton",
    ],
  ];
  const apiTables: [string, string[][]][] = [
    ...([
      ["Form", FORM_API],
      ["FormItem", FORM_ITEM_API],
      ["createForm(options)", CREATE_FORM_OPTIONS_API],
      ["FormStore", FORM_STORE_API],
      ["formRules", FORM_RULES_API],
    ] as const).map((
      [title, rows],
    ): [string, string[][]] => [
      title,
      rows.map((r) => [r.name, r.type, r.default, r.description]),
    ]),
    ["FormList", listApi],
  ];
  async function exactTable(
    table: Locator,
    headers: string[],
    expected: string[][],
  ): Promise<void> {
    const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
    expect((await table.locator("thead th").allTextContents()).map(normalize))
      .toEqual(headers);
    const actual = [];
    for (const row of await table.locator("tbody tr").all()) {
      actual.push((await row.locator("td").allTextContents()).map(normalize));
    }
    expect(actual).toEqual(expected.map((row) => row.map(normalize)));
  }
  for (const [title, rows] of apiTables) {
    it("非交互文档 Form API：" + title + "逐行四列精确渲染", async (t) => {
      const page = await open(t, route);
      await exactTable(demo(page, title).getByRole("table"), [
        "属性",
        "类型",
        "默认值",
        "说明",
      ], rows);
    }, DOCS_BROWSER_CONFIG);
  }
  it("非交互文档 FormList：消息表四字段和类型默认文案精确渲染", async (t) => {
    const page = await open(t, route),
      messages = demo(page, "文案（messages）");
    await exactTable(
      messages.getByRole("table"),
      [
        "字段",
        "类型",
        "默认值",
        "说明",
      ],
      MESSAGES_FORM_LIST.map((r) => [r.name, r.type, r.default, r.description]),
    );
    await visible(
      messages.getByText("Partial<FormListMessages>", { exact: true }),
    );
    await visible(
      messages.getByText("defaultFormListMessages", { exact: true }),
    );
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Form文档：正文Input链接真实导航且目标组件就绪", async (t) => {
    const page = await open(t, route);
    const link = page.locator('main a[href="/desktop/form/input"]');
    expect(await link.count()).toBe(1);
    await link.click();
    await eventually(() =>
      new URL(page.url()).pathname === "/desktop/form/input"
    );
    await visible(
      page.getByRole("heading", {
        level: 1,
        name: "Input 单行输入",
        exact: true,
      }),
    );
    const target = page.getByRole("heading", { name: "基础", exact: true })
      .locator("xpath=ancestor::section[1]").locator("input");
    await target.fill("navigation-ready");
    await value(target, "navigation-ready");
  }, DOCS_BROWSER_CONFIG);
});
