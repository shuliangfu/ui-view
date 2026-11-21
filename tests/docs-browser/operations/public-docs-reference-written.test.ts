/** WRITTEN-UNRUN. Public docs copy, in-page links, API/messages/type tables and example headings from reviewed source fixtures; expected values are never scraped from the live page at run time. */
import { fromFileUrl, readTextFileSync } from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import {
  DOCS_BROWSER_CONFIG,
  type DocsBrowserTestContext,
  sharedEnv,
} from "../helpers.ts";
import { eventually, open, visible } from "./driver.ts";

type TableFixture = {
  title?: string;
  headers: string[];
  rows: string[][];
  interfaceName?: string;
  defaultExportName?: string;
};

type PublicFixture = {
  route: string;
  source: string;
  h1: string | null;
  examples: string[];
  codes: string[];
  api: TableFixture[];
  messages: TableFixture[];
  typeTables: TableFixture[];
  inPageLinks: { href: string; h1?: string | null; hash?: boolean }[];
  externalLinks: { href: string; target?: string | null }[];
  runtimeYearIdents: string[];
};

const bundle = JSON.parse(
  readTextFileSync(
    fromFileUrl(
      new URL("./fixtures/public-docs-reference.json", import.meta.url),
    ),
  ),
) as { fixtures: PublicFixture[] };

function expectedCode(code: string, years: string[]): string {
  const year = String(new Date().getFullYear());
  let out = code;
  for (const name of years) {
    out = out.replaceAll("${" + name + "}", year);
  }
  return out;
}

async function copyIn(page: Page, expected: string) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const blocks = page.locator("main .code-block, .code-block");
  const count = await blocks.count();
  let index = -1;
  for (let i = 0; i < count; i++) {
    const pre = (await blocks.nth(i).locator("pre code").textContent()) ?? "";
    if (pre === expected) {
      index = i;
      break;
    }
  }
  expect(index >= 0).toBe(true);
  const block = blocks.nth(index);
  await block.scrollIntoViewIfNeeded();
  await page.evaluate(() => navigator.clipboard.writeText("sentinel-not-code"));
  await block.getByRole("button", { name: "复制", exact: true }).click();
  await eventually(async () =>
    await page.evaluate(() => navigator.clipboard.readText()) === expected
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expected,
  );
}

async function readTable(table: Locator): Promise<{
  headers: string[];
  rows: string[][];
}> {
  const headers = (await table.locator("thead th").allTextContents()).map((
    s,
  ) => s.trim());
  const rows = await table.locator("tbody tr").evaluateAll((nodes) =>
    nodes.map((row) =>
      [...row.querySelectorAll("td")].map((c) => c.textContent!.trim())
    )
  );
  return { headers, rows };
}

async function readAllTables(page: Page): Promise<{
  headers: string[];
  rows: string[][];
}[]> {
  const tables = page.getByRole("table");
  const count = await tables.count();
  const all = [];
  for (let i = 0; i < count; i++) {
    all.push(await readTable(tables.nth(i)));
  }
  return all;
}

function assertTablePresent(
  all: { headers: string[]; rows: string[][] }[],
  fixture: TableFixture,
) {
  const found = all.some((got) =>
    JSON.stringify(got.headers) === JSON.stringify(fixture.headers) &&
    JSON.stringify(got.rows) === JSON.stringify(fixture.rows)
  );
  expect(found).toBe(true);
}

async function headingReady(page: Page, name: string) {
  await eventually(async () =>
    await page.getByRole("heading", { level: 1, name, exact: true }).count() >
      0
  );
  await visible(
    page.getByRole("heading", { level: 1, name, exact: true }),
  );
}

describe("Public docs reference written", () => {
  for (const entry of bundle.fixtures) {
    it("公共文档操作：" + entry.route, async (t) => {
      const page = await open(t, entry.route);
      await page.setViewportSize({ width: 1280, height: 900 });
      if (entry.h1) {
        await headingReady(page, entry.h1);
      }
      for (const title of entry.examples) {
        const heading = page.getByRole("heading", { name: title, exact: true })
          .first();
        await heading.scrollIntoViewIfNeeded();
        await visible(heading);
      }
      for (const code of entry.codes) {
        await copyIn(page, expectedCode(code, entry.runtimeYearIdents));
      }
      const allTables = await readAllTables(page);
      for (
        const table of [
          ...entry.api,
          ...entry.typeTables,
          ...entry.messages,
        ]
      ) {
        assertTablePresent(allTables, table);
      }
      for (const table of entry.messages) {
        if (table.interfaceName) {
          await visible(
            page.getByText("Partial<" + table.interfaceName + ">", {
              exact: true,
            }).first(),
          );
        }
        if (table.defaultExportName) {
          await visible(
            page.getByText(table.defaultExportName, { exact: true }).first(),
          );
        }
      }
      for (const link of entry.externalLinks) {
        const el = page.locator(`a[href="${link.href}"]`).first();
        await el.scrollIntoViewIfNeeded();
        await visible(el);
        expect(await el.getAttribute("href")).toBe(link.href);
        if (link.target) {
          expect(await el.getAttribute("target")).toBe(link.target);
        }
      }
      for (const link of entry.inPageLinks) {
        if (link.hash || link.href === "#") {
          const el = page.locator(`a[href="${link.href}"]`).first();
          await visible(el);
          expect(await el.getAttribute("href")).toBe(link.href);
          continue;
        }
        const el = page.locator(
          `main a[href="${link.href}"], a[href="${link.href}"]`,
        ).first();
        await el.scrollIntoViewIfNeeded();
        await visible(el);
        await el.click();
        const path = link.href.split("#")[0];
        await eventually(() => new URL(page.url()).pathname === path);
        if (link.h1) {
          await headingReady(page, link.h1);
        }
        await sharedEnv.goto(t as DocsBrowserTestContext, entry.route);
        if (entry.h1) {
          await headingReady(page, entry.h1);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }
});
