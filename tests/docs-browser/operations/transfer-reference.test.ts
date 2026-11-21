import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { MESSAGES_TRANSFER } from "../../../docs/src/data/component-messages-rows.ts";
import { eventually, open, section, value, visible } from "./driver.ts";
const route = "/desktop/form/transfer";
const rows = [
  [
    "size",
    '"xs" | "sm" | "md" | "lg"',
    '"md"',
    "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入",
  ],
  [
    "dataSource",
    "Array<{key, title, disabled?, group?}>",
    "-",
    "数据源；同 group 的项以 optgroup 分组显示，搜索默认也匹配分组名",
  ],
  [
    "targetKeys",
    "MaybeSignal<string[]>",
    "-",
    "已选 key 列表。传 `createSignal` 返回值时组件内回写，可不写 onChange；静态数组仅适合禁用展示等不需穿梭场景",
  ],
  [
    "onChange",
    "(keys: string[]) => void",
    "-",
    "可选。`targetKeys` 为 Signal 时组件已回写；需副作用（如打日志）时再传",
  ],
  ["titles", "[string, string]", "-", "左右列标题"],
  ["showSearch", "boolean", "false", "是否显示搜索"],
  ["searchPlaceholder", "[string, string]", "-", "左右搜索框占位"],
  [
    "searchValue",
    "[string, string]",
    "-",
    "可选：左右搜索框初始文案（仅实例创建时生效）；勿做每键更新的受控绑定，以免失焦",
  ],
  [
    "onSearch",
    "(dir: 'left'|'right', value: string) => void",
    "-",
    "用户输入搜索时的通知回调（筛选在组件内部完成）",
  ],
  [
    "filterOption",
    "(inputValue: string, item: {key, title}) => boolean",
    "-",
    "自定义筛选",
  ],
  [
    "render",
    "(item: {key, title}) => any",
    "-",
    "自定义渲染项；若返回非文本（非 string/number），列表回退为 title",
  ],
  [
    "listStyle",
    "{ width?: number; height?: number | string; minHeight?: number | string; maxHeight?: number | string; itemHeight?: number }",
    "-",
    '列表样式：width 为列宽基准（窄容器内可收缩），height / minHeight / maxHeight 为整列高度，含标题、搜索和计数（像素数字或 CSS 值，如 "70vh"、"calc(100vh - 340px)"；与顶层同名数字参数同时存在时顶层优先；height 默认 200），itemHeight 为每一项行高（像素）；不传 itemHeight 时按 size 默认为 xs 16 / sm 18 / md 18 / lg 20',
  ],
  [
    "height",
    "number",
    "200",
    "整列高度（含标题、搜索和计数；像素数字）；优先于 listStyle.height。CSS 值请写在 listStyle.height",
  ],
  [
    "minHeight",
    "number",
    "-",
    "整列最小高度（像素数字）；优先于 listStyle.minHeight。CSS 值请写在 listStyle.minHeight",
  ],
  [
    "maxHeight",
    "number",
    "-",
    "整列最大高度（像素数字）；优先于 listStyle.maxHeight。CSS 值请写在 listStyle.maxHeight",
  ],
  ["disabled", "boolean", "false", "整组禁用"],
  [
    "hideFocusRing",
    "boolean",
    "false",
    "为 true 时隐藏列头搜索框与穿梭操作按钮的聚焦蓝色 ring；默认 false 显示",
  ],
  ["class", "string", "-", "额外 class"],
  ["error", "boolean", "false", "错误状态（红框）；可与 createForm 绑定联用"],
  [
    "messages",
    "Partial<TransferMessages>",
    "-",
    "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  ],
];
async function exactTable(
  table: Locator,
  headers: string[],
  expected: string[][],
) {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  expect((await table.locator("thead th").allTextContents()).map(norm)).toEqual(
    headers,
  );
  const actual = [];
  for (const row of await table.locator("tbody tr").all()) {
    actual.push((await row.locator("td").allTextContents()).map(norm));
  }
  expect(actual).toEqual(expected.map((row) => row.map(norm)));
}
describe("Transfer reference", () => {
  it("非交互文档 Transfer：API与消息表全部四列精确渲染", async (t) => {
    const page = await open(t, route);
    await exactTable(section(page, "API").getByRole("table"), [
      "属性",
      "类型",
      "默认值",
      "说明",
    ], rows);
    const messages = section(page, "文案（messages）");
    await exactTable(
      messages.getByRole("table"),
      [
        "字段",
        "类型",
        "默认值",
        "说明",
      ],
      MESSAGES_TRANSFER.map((r) => [r.name, r.type, r.default, r.description]),
    );
    await visible(
      messages.getByText("Partial<TransferMessages>", { exact: true }),
    );
    await visible(
      messages.getByText("defaultTransferMessages", { exact: true }),
    );
    expect(await section(page, "引入").locator("pre code").textContent())
      .toContain("@dreamer/ui-view/form/transfer");
  }, DOCS_BROWSER_CONFIG);
  it("物理操作 Transfer文档：正文Form链接导航后可输入", async (t) => {
    const page = await open(t, route),
      link = page.locator('main a[href="/desktop/form/form-containers"]');
    expect(await link.count()).toBe(1);
    await link.click({ delay: 180 });
    await eventually(() =>
      new URL(page.url()).pathname === "/desktop/form/form-containers"
    );
    await visible(
      page.getByRole("heading", {
        name: "Form · FormItem · FormList · createForm",
        level: 1,
        exact: true,
      }),
    );
    const input = page.getByPlaceholder("字母开头", { exact: true });
    await input.fill("TransferLink");
    await value(input, "TransferLink");
  }, DOCS_BROWSER_CONFIG);
});
