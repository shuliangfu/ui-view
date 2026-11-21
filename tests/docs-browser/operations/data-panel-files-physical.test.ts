import { describe, expect, it } from "@dreamer/test";
import { readFile } from "node:fs/promises";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, open, visible } from "./driver.ts";
import {
  buildXlsx,
  unzipEntries,
} from "../../../src/desktop/data-display/data-panel-xlsx.ts";
const route = "/desktop/data-display/data-panel";
const names = [
  "Alice",
  "Bob",
  "Carol",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Mallory",
  "Niaj",
  "Olivia",
  "Peggy",
  "Rupert",
];
const heads = ["姓名", "角色", "状态", "余额", "积分"],
  props = ["name", "role", "status", "balance", "score"];
const money = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const balances = names.map((_, i) => 100 + (i * 137) % 900 + (i % 7) / 10);
const expected = names.map((
  name,
  i,
) => [
  name,
  ["管理员", "编辑", "访客"][i % 3],
  i % 4 === 3 ? "停用" : "启用",
  money(balances[i]),
  String(i * 7 % 100),
]);
async function ready(panel: Locator, n = 15) {
  await eventually(async () =>
    (await panel.getByTestId("dp-total-count").textContent())?.trim() ===
      `共 ${n} 条记录`
  );
}
async function download(page: Page, panel: Locator, fmt: string) {
  await panel.getByTestId("dp-export").click({ delay: 180 });
  const event = page.waitForEvent("download");
  await page.getByTestId("dp-export-" + fmt).click({ delay: 180 });
  const file = await event;
  expect(await file.failure()).toBe(null);
  expect(file.suggestedFilename()).toMatch(
    new RegExp("^users-\\d{8}\\." + fmt + "$"),
  );
  const path = await file.path();
  if (!path) throw new Error("download missing path");
  return new Uint8Array(await readFile(path));
}
async function hideEmail(page: Page, panel: Locator) {
  await panel.getByTestId("dp-columns").click();
  await page.getByTestId("dp-col-email").uncheck();
  await page.mouse.click(2, 2);
  await eventually(async () =>
    !(await panel.locator("thead").textContent())?.includes("邮箱")
  );
}
async function choose(
  page: Page,
  panel: Locator,
  fmt: string,
  buffer: Uint8Array,
  name = "fixture." + fmt,
) {
  await panel.getByTestId("dp-import").click({ delay: 180 });
  const event = page.waitForEvent("filechooser");
  await page.getByTestId("dp-import-" + fmt).click({ delay: 180 });
  const chooser = await event;
  expect(await chooser.element().getAttribute("data-import-format")).toBe(fmt);
  await chooser.setFiles({
    name,
    mimeType: fmt === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/octet-stream",
    buffer: Buffer.from(buffer),
  });
}
import { Buffer } from "node:buffer";
describe("DataPanel files physical", () => {
  it(
    "物理操作 DataPanel导出：五种真实下载、全部15行超出当前页、仅可见列及xlsx合计",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-export");
      await ready(panel);
      await hideEmail(page, panel);
      await panel.getByTestId("dp-pagesize").locator(
        'button[aria-haspopup="listbox"]',
      ).click();
      await page.getByRole("option", { name: "10 条/页", exact: true }).click();
      await eventually(async () =>
        await panel.locator('[data-testid^="dp-row-"]').count() === 10
      );
      for (const fmt of ["csv", "json", "xml", "html", "xlsx"]) {
        const bytes = await download(page, panel, fmt),
          text = new TextDecoder().decode(bytes);
        if (fmt === "json") {
          expect(JSON.parse(text)).toEqual(
            expected.map((r) =>
              Object.fromEntries(props.map((p, i) => [p, r[i]]))
            ),
          );
        } else if (fmt === "csv") {
          expect([...bytes.slice(0, 3)]).toEqual([239, 187, 191]);
          expect(
            text.replace(/^\uFEFF/, "").split("\r\n").map((r) => r.split(",")),
          ).toEqual([heads, ...expected]);
        } else if (fmt === "xml") {
          const matrix = await page.evaluate(
            (text) =>
              [
                ...new DOMParser().parseFromString(text, "application/xml")
                  .querySelectorAll("row"),
              ].map((row) =>
                Object.fromEntries(
                  [...row.children].map((
                    cell,
                  ) => [cell.tagName, cell.textContent]),
                )
              ),
            text,
          );
          expect(matrix).toEqual(
            expected.map((r) =>
              Object.fromEntries(props.map((p, i) => [p, r[i]]))
            ),
          );
        } else if (fmt === "html") {
          const matrix = await page.evaluate(
            (text) =>
              [
                ...new DOMParser().parseFromString(text, "text/html")
                  .querySelectorAll("tr"),
              ].map((row) =>
                [...row.querySelectorAll("th,td")].map((cell) =>
                  cell.textContent
                )
              ),
            text,
          );
          expect(matrix).toEqual([heads, ...expected]);
        } else {
          expect([...bytes.slice(0, 4)]).toEqual([80, 75, 3, 4]);
          const entries = await unzipEntries(bytes),
            sheet = entries.get("xl/worksheets/sheet1.xml");
          if (!sheet) throw new Error("missing XLSX sheet");
          const matrix = await page.evaluate(
            (xml) =>
              [
                ...new DOMParser().parseFromString(xml, "application/xml")
                  .querySelectorAll("sheetData > row"),
              ].map((row) =>
                [...row.querySelectorAll("c")].map((cell) =>
                  cell.getAttribute("t") === "inlineStr"
                    ? (cell.querySelector("t")?.textContent ?? "")
                    : (cell.querySelector("v")?.textContent ?? "")
                )
              ),
            new TextDecoder().decode(sheet),
          );
          const data = expected.map((
            r,
            i,
          ) => [r[0], r[1], r[2], String(balances[i]), r[4]]);
          expect(matrix).toEqual([heads, ...data, [
            "合计",
            "",
            "",
            String(balances.reduce((a, b) => a + b, 0)),
            "",
          ]]);
        }
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  for (const fmt of ["csv", "json", "xml", "xlsx"]) {
    it(
      "物理操作 DataPanel导入 " + fmt +
        "：真实文件选择、字段映射/转义、新增后刷新保留",
      async (t) => {
        const page = await open(t, route),
          panel = page.getByTestId("panel-demo-export");
        await ready(panel);
        const url = new URL(page.url());
        expect(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)).toBe(
          true,
        );
        expect(["8001", "8003"].includes(url.port)).toBe(false);
        const prefix = "ui-import-" + fmt + "-" +
            crypto.randomUUID().slice(0, 8),
          name = prefix + ' <&"';
        const columns = ["姓名", "邮箱", "角色", "状态", "余额", "积分"],
          values = [name, "own@example.test", "admin", "disabled", "42.5", "7"];
        const esc = (s: string) =>
          s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
            ">",
            "&gt;",
          ).replaceAll('"', "&quot;");
        let bytes: Uint8Array;
        if (fmt === "xlsx") {
          bytes = buildXlsx({
            name: "fixture",
            headers: columns,
            rows: [values],
          });
        } else {
          const text = fmt === "json"
            ? JSON.stringify([
              Object.fromEntries(columns.map((c, i) => [c, values[i]])),
            ])
            : fmt === "xml"
            ? "<rows><row>" +
              ["name", "email", "role", "status", "balance", "score"].map((
                p,
                i,
              ) => `<${p}>${esc(values[i])}</${p}>`).join("") + "</row></rows>"
            : columns.join(",") + "\r\n" +
              values.map((v) => '"' + v.replaceAll('"', '""') + '"').join(",");
          bytes = new TextEncoder().encode(text);
        }
        await choose(page, panel, fmt, bytes);
        await ready(panel, 16);
        const row = panel.locator('[data-testid^="dp-row-"]').filter({
          hasText: prefix,
        });
        await visible(row);
        expect(await row.locator("td").nth(2).textContent()).toBe(name);
        expect(await row.textContent()).toContain("own@example.test");
        expect(await row.textContent()).toContain("管理员");
        expect(await row.textContent()).toContain("42.50");
        expect(await row.getByRole("checkbox").nth(1).isChecked()).toBe(false);
        await visible(
          page.getByText("导入完成：成功 1 条，失败 0 条", { exact: true }),
        );
        await panel.getByTestId("dp-refresh").click();
        await ready(panel, 16);
        await visible(row);
        expect(await row.locator("td").nth(2).textContent()).toBe(name);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "物理操作 DataPanel导入：无效JSON报错、空文件选择不变更数据",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-export");
      await ready(panel);
      await choose(
        page,
        panel,
        "json",
        new TextEncoder().encode("invalid-json"),
      );
      await visible(
        page.getByText("导入失败：文件格式不正确", { exact: true }),
      );
      await ready(panel);
      await panel.getByTestId("dp-import").click();
      const event = page.waitForEvent("filechooser");
      await page.getByTestId("dp-import-csv").click();
      await (await event).setFiles([]);
      await ready(panel);
      expect(
        await panel.locator('[data-testid^="dp-row-"]').evaluateAll((els) =>
          els.map((el) => el.getAttribute("data-testid"))
        ),
      ).toEqual(Array.from({ length: 15 }, (_, i) => "dp-row-" + (i + 1)));
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 DataPanel打印：真实新窗口、原生PDF及beforeprint、可见列精确内容",
    async (t) => {
      const page = await open(t, route),
        panel = page.getByTestId("panel-demo-export");
      await ready(panel);
      await hideEmail(page, panel);
      const event = page.waitForEvent("popup");
      await panel.getByTestId("dp-print").click({ delay: 180 });
      const popup = await event;
      try {
        await eventually(async () => await popup.title() === "导出导入");
        expect(await popup.locator("h3").textContent()).toBe("导出导入");
        // A synchronous about:blank document.write can precede Playwright's popup
        // init-script attachment. Observe the actual headless print operation on
        // the completed print document, without mocking window.open/print.
        await popup.evaluate(() => {
          globalThis.addEventListener("beforeprint", () => {
            document.documentElement.setAttribute(
              "data-native-beforeprint",
              "yes",
            );
          }, { once: true });
        });
        const pdf = await popup.pdf({ format: "A4" });
        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
        expect(pdf.toString("latin1")).toMatch(/%%EOF\s*$/);
        await attr(popup.locator("html"), "data-native-beforeprint", "yes");
        const matrix = [];
        for (const row of await popup.locator("tr").all()) {
          matrix.push(await row.locator("th,td").allTextContents());
        }
        expect(matrix).toEqual([heads, ...expected]);
        await visible(panel);
        expect(new URL(page.url()).pathname).toBe(route);
      } finally {
        await popup.close();
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
