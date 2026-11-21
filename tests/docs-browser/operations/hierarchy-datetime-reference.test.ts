import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { MESSAGES_PICKER_CALENDAR_NAV } from "../../../docs/src/data/component-messages-rows.ts";
import { open, section } from "./driver.ts";
describe("Hierarchy datetime reference", () => {
  for (
    const [route, type] of [["cascader", "CascaderOption"], [
      "tree-select",
      "TreeSelectOption",
    ]]
  ) {
    it("非交互文档 " + type + "：类型示例准确展示递归数据结构", async (t) => {
      const page = await open(t, "/desktop/form/" + route);
      const demo = section(page, "数据结构 " + type),
        code = await demo.locator("pre code").textContent();
      for (
        const declaration of [
          "export interface " + type + " {",
          "value: string;",
          "label: string;",
          "children?: " + type + "[];",
        ]
      ) expect(code).toContain(declaration);
      if (route === "cascader") expect(code).toContain("isLeaf?: boolean;");
      expect(await demo.locator("pre code").count()).toBe(1);
    }, DOCS_BROWSER_CONFIG);
  }
  for (
    const [route, component] of [["date-picker", "DatePicker"], [
      "datetime-picker",
      "DateTimePicker",
    ]]
  ) {
    it(
      "非交互文档 " + component + "：嵌套日历消息表逐字段精确渲染",
      async (t) => {
        const page = await open(t, "/desktop/form/" + route);
        const demo = section(page, "嵌套：PickerCalendarNavMessages"),
          table = demo.getByRole("table");
        expect(await table.getByRole("columnheader").allTextContents()).toEqual(
          [
            "字段",
            "类型",
            "默认值",
            "说明",
          ],
        );
        const norm = (s: string) => s.replace(/\s+/g, " ").trim();
        const actual = [];
        for (const row of await table.locator("tbody tr").all()) {
          actual.push((await row.locator("td").allTextContents()).map(norm));
        }
        expect(actual).toEqual(
          MESSAGES_PICKER_CALENDAR_NAV.map((row) =>
            [row.name, row.type, row.default, row.description].map(norm)
          ),
        );
        expect(
          await demo.getByText("messages.calendarNav", { exact: true }).count(),
        )
          .toBe(1);
        expect(
          await demo.getByText("defaultPickerCalendarNavMessages", {
            exact: true,
          })
            .count(),
        ).toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
