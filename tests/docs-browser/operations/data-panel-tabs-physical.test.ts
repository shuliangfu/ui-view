import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, visible } from "./driver.ts";
const route = "/desktop/data-display/data-panel";
async function rows(panel: Locator, expected: string[]) {
  const read = () =>
    panel.locator('[data-testid^="dp-row-"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-testid")!.slice(7))
    );
  try {
    await eventually(async () =>
      JSON.stringify(await read()) === JSON.stringify(expected)
    );
  } catch (cause) {
    throw new Error(JSON.stringify({ expected, actual: await read() }), {
      cause,
    });
  }
}
async function tab(page: Page, panel: Locator, label: string, key: string) {
  await panel.getByRole("tab", { name: label, exact: true }).click({
    delay: 180,
  });
  await attr(
    panel.getByRole("tab", { name: label, exact: true }),
    "aria-selected",
    "true",
  );
  await eventually(() => new URL(page.url()).searchParams.get("tab") === key);
  expect(new URL(page.url()).searchParams.get("keep")).toBe("batch09");
}
describe("DataPanel tabs physical", () => {
  it(
    "物理操作 DataPanel Tab：URL回填管理员、全部与统计、自定义内容/刷新/清选/重载",
    async (t) => {
      const page = await open(t, route + "?tab=admin&keep=batch09"),
        panel = page.getByTestId("panel-demo-tabs");
      await rows(panel, ["1", "4", "7"]);
      await attr(
        panel.getByRole("tab", { name: "管理员", exact: true }),
        "aria-selected",
        "true",
      );
      await tab(page, panel, "全部", "all");
      await rows(panel, ["1", "2", "3", "4", "5", "6", "7", "8"]);
      await panel.getByTestId("dp-select-2").check();
      expect(await panel.getByTestId("dp-selected-count").textContent()).toBe(
        "已选 1 项",
      );
      await tab(page, panel, "统计", "stats");
      await visible(panel.getByTestId("dp-table"), false);
      await visible(
        panel.getByText("当前共 8 人，其中管理员 3 人。", { exact: true }),
      );
      await panel.getByTestId("dp-refresh").click();
      await visible(
        panel.getByText("当前共 8 人，其中管理员 3 人。", { exact: true }),
      );
      await open(t, new URL(page.url()).pathname + new URL(page.url()).search);
      await attr(
        panel.getByRole("tab", { name: "统计", exact: true }),
        "aria-selected",
        "true",
      );
      await visible(panel.getByTestId("dp-table"), false);
      await tab(page, panel, "全部", "all");
      await rows(panel, ["1", "2", "3", "4", "5", "6", "7", "8"]);
      expect(await panel.getByTestId("dp-select-2").isChecked()).toBe(false);
      expect(await panel.getByTestId("dp-batch-bar").count()).toBe(0);
      await tab(page, panel, "管理员", "admin");
      await rows(panel, ["1", "4", "7"]);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel Tab：未知URL标签回退全部且原生Enter切管理员",
    async (t) => {
      const page = await open(t, route + "?tab=invalid&keep=batch09"),
        panel = page.getByTestId("panel-demo-tabs");
      await rows(panel, ["1", "2", "3", "4", "5", "6", "7", "8"]);
      await attr(
        panel.getByRole("tab", { name: "全部", exact: true }),
        "aria-selected",
        "true",
      );
      await panel.getByRole("tab", { name: "管理员", exact: true }).press(
        "Enter",
      );
      await rows(panel, ["1", "4", "7"]);
      await attr(
        panel.getByRole("tab", { name: "管理员", exact: true }),
        "aria-selected",
        "true",
      );
      expect(new URL(page.url()).searchParams.get("tab")).toBe("admin");
      expect(new URL(page.url()).searchParams.get("keep")).toBe("batch09");
    },
    DOCS_BROWSER_CONFIG,
  );
});
