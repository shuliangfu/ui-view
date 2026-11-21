/** WRITTEN-UNRUN. Seven live check/switch examples plus four API tables under the inventory title {title}. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { docsDemo, eventually, open } from "./driver.ts";

const example = (p: Page, name: string) => docsDemo(p, name);

const apiSection = (p: Page) =>
  p.getByRole("heading", { name: "API", exact: true }).locator(
    "xpath=ancestor::section[1]",
  );

const apiTable = (p: Page, name: string) =>
  apiSection(p).getByRole("heading", { name, exact: true }).locator(
    "xpath=following::table[1]",
  );

const CHECKBOX_API = [
  [
    "size",
    '"xs" | "sm" | "md" | "lg"',
    '"md"',
    "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  ],
  [
    "checked",
    "boolean | (() => boolean) | Signal<boolean>",
    "-",
    "是否选中。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  ],
  [
    "onChange",
    "(e: Event) => void",
    "-",
    "可选。`checked` 为 Signal 时组件已回写，可不传；需副作用时再传（e.target.checked）",
  ],
  ["disabled", "boolean", "false", "是否禁用"],
  [
    "hideFocusRing",
    "boolean",
    "false",
    "为 true 时隐藏聚焦时的蓝色激活边框（ring）；默认 false 显示",
  ],
  ["name", "string", "-", "原生 name"],
  ["class", "string", "-", "额外 class"],
  ["children", "any", "-", "标签内容"],
];

const CHECKBOX_GROUP_API = [
  [
    "size",
    '"xs" | "sm" | "md" | "lg"',
    '"md"',
    "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  ],
  ["options", "Array<{value, label, disabled?}>", "-", "选项列表"],
  [
    "value",
    "string[] | (() => string[]) | Signal<string[]>",
    "-",
    "当前选中项 value 数组。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  ],
  [
    "onChange",
    "(value: string[]) => void",
    "-",
    "可选。`value` 为 Signal 时组件已回写；需副作用时再传",
  ],
  ["direction", "vertical | horizontal", "vertical", "布局方向"],
  ["disabled", "boolean", "false", "整组禁用"],
  ["error", "boolean", "false", "错误状态"],
  ["class", "string", "-", "额外 class"],
];

const RADIO_GROUP_API = [
  [
    "size",
    '"xs" | "sm" | "md" | "lg"',
    '"md"',
    "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  ],
  ["name", "string", "-", "原生 name（必填以互斥）"],
  ["options", "Array<{value, label, disabled?}>", "-", "选项列表"],
  [
    "value",
    "string | (() => string) | Signal<string>",
    "-",
    "当前选中项 value。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  ],
  [
    "onChange",
    "(value: string) => void",
    "-",
    "可选。`value` 为 Signal 时组件已回写；需副作用时再传",
  ],
  ["direction", "vertical | horizontal", "vertical", "布局方向"],
  ["disabled", "boolean", "false", "整组禁用"],
  ["error", "boolean", "false", "错误状态"],
  ["class", "string", "-", "额外 class"],
];

const SWITCH_API = [
  [
    "size",
    '"xs" | "sm" | "md" | "lg"',
    '"md"',
    "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  ],
  [
    "checked",
    "boolean | (() => boolean) | Signal<boolean>",
    "-",
    "是否开启。与全库表单一致为 MaybeSignal：字面量、`() => T`、`createSignal` 返回值；勿直接绑 `sig.value`（快照失步或误订阅）。",
  ],
  [
    "onChange",
    "(e: Event) => void",
    "-",
    "可选。`checked` 为 Signal 时组件已回写；需副作用时再传（e.target.checked）",
  ],
  ["checkedChildren", "any", "-", "选中时文案/节点"],
  ["unCheckedChildren", "any", "-", "未选中时文案/节点"],
  ["disabled", "boolean", "false", "是否禁用"],
  [
    "hideFocusRing",
    "boolean",
    "false",
    "为 true 时隐藏开关轨道在获焦时的 peer 蓝色 ring；默认 false 显示",
  ],
  ["error", "boolean", "false", "错误状态"],
  ["class", "string", "-", "额外 class"],
];

async function tableRows(table: Locator) {
  return await table.locator("tbody tr").evaluateAll((rows) =>
    rows.map((row) =>
      Array.from(row.querySelectorAll("td")).map((td) =>
        (td.textContent ?? "").trim()
      )
    )
  );
}

async function trackSize(root: Locator) {
  return await root.locator("span[aria-hidden='true']").first().evaluate(
    (el) => {
      const b = el.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height) };
    },
  );
}

async function checkboxSize(root: Locator) {
  return await root.locator("input[type='checkbox']:not(.sr-only)").evaluate(
    (el) => {
      const b = el.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height) };
    },
  );
}

describe("Check physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Check 与 createForm @${width}：校验失败后勾选再提交成功`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "与 createForm");
        const agree = root.getByRole("checkbox", { name: "我已阅读并同意" });
        const notify = root.locator("input[name='notify']");
        const notifyLabel = notify.locator("xpath=ancestor::label[1]");
        expect(await agree.isChecked()).toBe(false);
        expect(await notify.isChecked()).toBe(true);
        expect(await root.getByRole("radio", { name: "A" }).isChecked()).toBe(
          true,
        );
        expect(await root.getByRole("checkbox", { name: "选项 X" }).isChecked())
          .toBe(false);
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await root.innerText()).includes("请勾选同意") &&
          (await root.innerText()).includes("请至少选一项")
        );
        expect((await root.innerText()).includes("请选择级别")).toBe(false);
        await agree.click();
        await root.getByRole("checkbox", { name: "选项 X" }).click();
        await notifyLabel.click();
        expect(await agree.isChecked()).toBe(true);
        expect(await notify.isChecked()).toBe(false);
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已提交" }).count()) > 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Checkbox @${width}：勾选我可来回切换`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const box = example(p, "Checkbox").getByRole("checkbox", {
          name: "勾选我",
        });
        expect(await box.isChecked()).toBe(false);
        await box.click();
        await eventually(async () => await box.isChecked());
        await box.click();
        await eventually(async () => await box.isChecked() === false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `CheckboxGroup @${width}：选项 X/Y/Z 可多选`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "CheckboxGroup");
        const x = root.getByRole("checkbox", { name: "选项 X" });
        const y = root.getByRole("checkbox", { name: "选项 Y" });
        const z = root.getByRole("checkbox", { name: "选项 Z" });
        expect(await x.isChecked()).toBe(false);
        expect(await y.isChecked()).toBe(false);
        expect(await z.isChecked()).toBe(false);
        await x.click();
        await y.click();
        expect(await x.isChecked()).toBe(true);
        expect(await y.isChecked()).toBe(true);
        expect(await z.isChecked()).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RadioGroup @${width}：默认单选 1，点单选 2 后互斥`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "RadioGroup");
        const r1 = root.getByRole("radio", { name: "单选 1" });
        const r2 = root.getByRole("radio", { name: "单选 2" });
        const r3 = root.getByRole("radio", { name: "单选 3" });
        expect(await r1.isChecked()).toBe(true);
        expect(await r2.isChecked()).toBe(false);
        expect(await r3.isChecked()).toBe(false);
        await r2.click();
        await eventually(async () => await r2.isChecked());
        expect(await r1.isChecked()).toBe(false);
        expect(await r3.isChecked()).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Switch 基础与自定义文案 @${width}：共用 Signal，开/关文案同步`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "Switch 基础与自定义文案");
        const switches = root.locator("label").filter({
          has: p.locator("input[type='checkbox']"),
        });
        const basic = switches.nth(0);
        const custom = switches.filter({ hasText: "关" });
        expect(await basic.locator("input").isChecked()).toBe(false);
        expect(await custom.locator("input").isChecked()).toBe(false);
        expect((await custom.innerText()).trim()).toBe("关");
        await basic.locator("input").click({ force: true });
        await eventually(async () => await basic.locator("input").isChecked());
        expect(await custom.locator("input").isChecked()).toBe(true);
        expect((await custom.innerText()).trim()).toBe("开");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Switch disabled @${width}：关/开两个禁用开关，坐标点击不变`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "Switch disabled");
        const boxes = root.locator("input[type='checkbox']");
        expect(await boxes.count()).toBe(2);
        expect(await boxes.nth(0).isChecked()).toBe(false);
        expect(await boxes.nth(1).isChecked()).toBe(true);
        expect(await boxes.nth(0).isDisabled()).toBe(true);
        expect(await boxes.nth(1).isDisabled()).toBe(true);
        const track = root.locator("span[aria-hidden='true']").first();
        const box = await track.boundingBox();
        expect(box != null).toBe(true);
        await p.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        expect(await boxes.nth(0).isChecked()).toBe(false);
        expect(await boxes.nth(1).isChecked()).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Check size @${width}：四档开关轨道与勾选框尺寸递进`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "size（xs / sm / md / lg）");
        const item = (label: string) =>
          root.locator("div.flex.flex-col.my-3").filter({
            has: p.getByText(label, { exact: true }),
          });
        const xs = item("xs");
        const sm = item("sm");
        const md = item("md（默认）");
        const lg = item("lg");
        expect(await trackSize(xs)).toEqual({ w: 28, h: 16 });
        expect(await trackSize(sm)).toEqual({ w: 36, h: 20 });
        expect(await trackSize(md)).toEqual({ w: 44, h: 24 });
        expect(await trackSize(lg)).toEqual({ w: 56, h: 28 });
        expect(await checkboxSize(xs)).toEqual({ w: 12, h: 12 });
        expect(await checkboxSize(sm)).toEqual({ w: 14, h: 14 });
        expect(await checkboxSize(md)).toEqual({ w: 16, h: 16 });
        expect(await checkboxSize(lg)).toEqual({ w: 20, h: 20 });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Check API 表 @${width}：Checkbox/Group/RadioGroup/Switch 四表与源码逐字一致`,
      async (t) => {
        const p = await open(t, "/desktop/form/check");
        await p.setViewportSize({ width, height: 900 });
        const headers = ["属性", "类型", "默认值", "说明"];
        const tables: [string, string[][]][] = [
          ["Checkbox", CHECKBOX_API],
          ["CheckboxGroup", CHECKBOX_GROUP_API],
          ["RadioGroup", RADIO_GROUP_API],
          ["Switch", SWITCH_API],
        ];
        for (const [name, rows] of tables) {
          const table = apiTable(p, name);
          expect(await table.locator("thead th").allInnerTexts()).toEqual(
            headers,
          );
          expect(await tableRows(table)).toEqual(rows);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
