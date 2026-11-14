/**
 * DataPanel／DataView 文档 API 章节：配置时要用的对象类型，都必须有一份属性表
 * （Title / data-api-type / DocsMessagesSection），不能只出现类型名。
 * 仅作为字段取值的字符串／数字联合或无属性别名（如 ExportFormat、ApiMode）
 * 应写在字段的 type 上，不必单独成章。
 */
import {
  dirname,
  fromFileUrl,
  join,
  readTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";
import {
  DATA_DISPLAY_TYPE_SECTIONS,
  DATA_PANEL_EXTRA_TYPE_IDS,
  DATA_VIEW_TYPE_IDS,
} from "../../docs/src/data/data-display-api-types.ts";

const ROOT = join(dirname(fromFileUrl(import.meta.url)), "..", "..");
const PANEL_PAGE = join(
  ROOT,
  "docs/src/routes/desktop/data-display/data-panel.tsx",
);
const VIEW_PAGE = join(
  ROOT,
  "docs/src/routes/desktop/data-display/data-view.tsx",
);

/** 不是本组件文档需要展开的类型／工具名 */
const IGNORE = new Set([
  "Array",
  "Boolean",
  "Button",
  "CSS",
  "ColorVariant",
  "Date",
  "Error",
  "Event",
  "Function",
  "HTMLElement",
  "HeadersInit",
  "Map",
  "MaybePromise",
  "Number",
  "Omit",
  "Partial",
  "Pick",
  "Promise",
  "Readonly",
  "Record",
  "RegExp",
  "Request",
  "RequestCredentials",
  "Required",
  "Response",
  "ReturnType",
  "Set",
  "Signal",
  "String",
  "URL",
  "VoidFunction",
]);

/**
 * 配置时不会写成对象、只需在字段 type 上内联的联合／别名。
 * 即使 type 字符串里还写着这些名字，也不要求单独属性章节。
 */
const INLINE_UNIONS = new Set([
  "ActionTone",
  "ApiMode",
  "DataChromeTabType",
  "Density",
  "ExportFormat",
  "ImportFormat",
  "Locale",
  "ModalShellWidth",
  "Tone",
  "ViewClick",
]);

const PASCAL = /\b([A-Z][A-Za-z0-9]*)\b/g;
const TYPE_FIELD = /\btype:\s*(?:\n\s*)?["'`]([^"'`]+)["'`]/g;
const API_TYPE_ID = /(?:id="api-type-|data-api-type=")([^"]+)"/g;
const INTERFACE_NAME = /interfaceName="([^"]+)"/g;
const TITLE_TEXT = /<Title\b[^>]*>([^<]+)<\/Title>/g;

function namedTypesInTypeStrings(src: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of src.matchAll(TYPE_FIELD)) {
    const body = m[1] ?? "";
    for (const hit of body.matchAll(PASCAL)) {
      const name = hit[1]!;
      if (IGNORE.has(name) || INLINE_UNIONS.has(name) || seen.has(name)) {
        continue;
      }
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

function documentedFromSource(src: string): Set<string> {
  const documented = new Set<string>();
  for (const m of src.matchAll(API_TYPE_ID)) {
    for (const part of (m[1] ?? "").split("-")) {
      if (part) documented.add(part);
    }
  }
  for (const m of src.matchAll(INTERFACE_NAME)) {
    if (m[1]) documented.add(m[1]);
  }
  for (const m of src.matchAll(TITLE_TEXT)) {
    const text = m[1] ?? "";
    for (const hit of text.matchAll(PASCAL)) {
      documented.add(hit[1]!);
    }
    if (text.includes("createApiDataSource")) {
      documented.add("createApiDataSource");
    }
  }
  return documented;
}

function rowsSourceFor(ids: readonly string[]): string {
  const chunks: string[] = [];
  for (const id of ids) {
    const section = DATA_DISPLAY_TYPE_SECTIONS.find((s) => s.id === id);
    if (!section) continue;
    for (const row of section.rows) {
      chunks.push(`type: ${JSON.stringify(row.type)}`);
    }
  }
  return chunks.join("\n");
}

describe("文档 API 对象类型都有属性表", () => {
  it("类型表 id 不重复，且额外／详情列表都能在注册表里找到", () => {
    const ids = DATA_DISPLAY_TYPE_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of DATA_PANEL_EXTRA_TYPE_IDS) {
      expect(ids.includes(id)).toBe(true);
    }
    for (const id of DATA_VIEW_TYPE_IDS) {
      expect(ids.includes(id)).toBe(true);
    }
  });

  it("DataPanel API 用到的具名类型都有对应章节", async () => {
    const page = await readTextFile(PANEL_PAGE);
    const mentioned = namedTypesInTypeStrings(
      page + "\n" + rowsSourceFor([
        "Column",
        "SearchConfig",
        "SearchField",
        "FormConfig",
        "FormField",
        "ViewConfig",
        "ViewItem",
        "DataSource",
        "createApiDataSource",
        ...DATA_PANEL_EXTRA_TYPE_IDS,
      ]),
    );
    const documented = documentedFromSource(page);
    documented.add("Messages");
    for (const id of DATA_PANEL_EXTRA_TYPE_IDS) documented.add(id);
    const missing = mentioned.filter((name) => !documented.has(name));
    expect(missing).toEqual([]);
  });

  it("DataView API 用到的具名类型都有对应章节", async () => {
    const page = await readTextFile(VIEW_PAGE);
    const mentioned = namedTypesInTypeStrings(
      page + "\n" + rowsSourceFor(DATA_VIEW_TYPE_IDS),
    );
    const documented = documentedFromSource(page);
    documented.add("Messages");
    for (const id of DATA_VIEW_TYPE_IDS) documented.add(id);
    const missing = mentioned.filter((name) => !documented.has(name));
    expect(missing).toEqual([]);
  });
});
