/**
 * 文档站 DataPanel／DataView：发布给读者的示例源码必须带上
 * columns／form／search／数据定义，且与现场演示同一份配置
 * （行数、panelKey、标题），不能只 import 不透明的 DEMO_* 常量。
 */
import {
  dirname,
  fromFileUrl,
  join,
  readTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";

const UI_VIEW_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..", "..");
const PANEL_PAGE = join(
  UI_VIEW_ROOT,
  "docs/src/routes/desktop/data-display/data-panel.tsx",
);
const VIEW_PAGE = join(
  UI_VIEW_ROOT,
  "docs/src/routes/desktop/data-display/data-view.tsx",
);
const DEMO_MODULE = join(
  UI_VIEW_ROOT,
  "docs/src/data/data-panel-demo.ts",
);

function extractTemplates(
  src: string,
  pattern: RegExp,
): Record<string, string> {
  const out: Record<string, string> = {};
  const re = new RegExp(pattern.source);
  let i = 0;
  while (i < src.length) {
    const m = re.exec(src.slice(i));
    if (!m) break;
    const name = m[1];
    let j = i + (m.index ?? 0) + m[0].length;
    const contentStart = j;
    let found = false;
    while (j < src.length) {
      if (src[j] === "\\") {
        j += 2;
        continue;
      }
      if (src[j] === "`") {
        let k = j + 1;
        while (k < src.length && (src[k] === " " || src[k] === "\t")) k++;
        if (k < src.length && src[k] === ";") {
          out[name] = src.slice(contentStart, j);
          i = k + 1;
          found = true;
          break;
        }
      }
      j++;
    }
    if (!found) break;
  }
  return out;
}

function interpolate(
  raw: string,
  codes: Record<string, string>,
): string {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === "\\" && i + 1 < raw.length) {
      out += raw.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (raw[i] === "$" && raw[i + 1] === "{") {
      let j = i + 2;
      let depth = 1;
      while (j < raw.length && depth) {
        if (raw[j] === "{") depth++;
        else if (raw[j] === "}") depth--;
        j++;
      }
      const expr = raw.slice(i + 2, j - 1);
      out += expr in codes ? codes[expr] : raw.slice(i, j);
      i = j;
      continue;
    }
    out += raw[i];
    i++;
  }
  return out
    .replace(/\\`/g, "`")
    .replace(/\\\$\{/g, "${")
    .replace(/\\\\/g, "\\");
}

function extractInlineCodes(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const idx = src.indexOf("code={`", i);
    if (idx < 0) break;
    let j = idx + "code={`".length;
    const start = j;
    while (j < src.length) {
      if (src[j] === "\\") {
        j += 2;
        continue;
      }
      if (src[j] === "`") {
        out.push(src.slice(start, j));
        i = j + 1;
        break;
      }
      j++;
    }
    if (j >= src.length) break;
  }
  return out;
}

type DemoBlock = {
  title: string;
  published: string;
  liveChildren: string;
};

function extractDocsDemos(
  src: string,
  namedCodes: Record<string, string>,
  codes: Record<string, string>,
): DemoBlock[] {
  const blocks: DemoBlock[] = [];
  let i = 0;
  while (i < src.length) {
    const start = src.indexOf("<DocsDemo", i);
    if (start < 0) break;
    const end = src.indexOf("</DocsDemo>", start);
    if (end < 0) break;
    const block = src.slice(start, end);
    const titleM = block.match(/title="([^"]+)"/);
    const identM = block.match(/code=\{(\w+)\}/);
    let raw = "";
    let childrenStart = 0;
    if (identM && identM[1] in namedCodes) {
      raw = namedCodes[identM[1]];
      const close = block.search(/code=\{\w+\}/);
      const after = close >= 0 ? block.indexOf(">", close) : block.indexOf(">");
      childrenStart = after >= 0 ? after + 1 : 0;
    } else {
      const marker = block.indexOf("code={`");
      if (marker >= 0) {
        let j = marker + "code={`".length;
        const s = j;
        while (j < block.length) {
          if (block[j] === "\\") {
            j += 2;
            continue;
          }
          if (block[j] === "`") {
            raw = block.slice(s, j);
            const after = block.indexOf(">", j);
            childrenStart = after >= 0 ? after + 1 : j + 1;
            break;
          }
          j++;
        }
      }
    }
    blocks.push({
      title: titleM?.[1] ?? "?",
      published: interpolate(raw, codes),
      liveChildren: block.slice(childrenStart),
    });
    i = end + 1;
  }
  return blocks;
}

function makeNs(text: string): string[] {
  return [...text.matchAll(/makeDemoRows\s*\(\s*(\d+)/g)].map((m) => m[1]);
}

type Fixture = {
  codes: Record<string, string>;
  panelCodes: Record<string, string>;
  viewNamed: Record<string, string>;
  panelDemos: DemoBlock[];
  viewDemos: DemoBlock[];
};

let fixture: Fixture | null = null;

async function loadFixture(): Promise<Fixture> {
  if (fixture) return fixture;
  const panelSrc = await readTextFile(PANEL_PAGE);
  const viewSrc = await readTextFile(VIEW_PAGE);
  const demoSrc = await readTextFile(DEMO_MODULE);
  const codes = extractTemplates(demoSrc, /export const (\w+_CODE)\s*=\s*`/);
  if (Object.keys(codes).length < 8) {
    throw new Error(`demo CODE 导出过少: ${Object.keys(codes).join(",")}`);
  }
  codes["DEMO_COMMON_SETUP_CODE"] = [
    codes["MAKE_DEMO_ROWS_CODE"],
    codes["DEMO_COLUMNS_CODE"],
    codes["DEMO_SEARCH_CODE"],
    codes["DEMO_FORM_CODE"],
  ].join("\n\n");
  const panelCodes = extractTemplates(panelSrc, /const (\w+[Cc]ode)\s*=\s*`/);
  const viewNamed = extractTemplates(viewSrc, /const (\w+)\s*=\s*`/);
  const panelDemos = extractDocsDemos(panelSrc, panelCodes, codes);
  const viewDemos = extractDocsDemos(viewSrc, viewNamed, codes);
  fixture = { codes, panelCodes, viewNamed, panelDemos, viewDemos };
  return fixture;
}

describe("文档示例与现场演示同步（定义可见）", () => {
  it("读入文档页与 demo 模块", async () => {
    const { panelDemos, viewDemos, panelCodes, codes } = await loadFixture();
    expect(panelDemos.length).toBe(41);
    expect(viewDemos.length).toBe(5);
    expect(Object.keys(panelCodes).length >= 30).toBe(true);
    expect(Boolean(codes["DEMO_COMMON_SETUP_CODE"])).toBe(true);
  });

  it("共享 CODE 含 columns／search／form／makeDemoRows 定义", async () => {
    const { codes } = await loadFixture();
    const common = codes["DEMO_COMMON_SETUP_CODE"];
    expect(common.includes("function makeDemoRows")).toBe(true);
    expect(common.includes("const columns: Column[]")).toBe(true);
    expect(common.includes("const search: SearchField[]")).toBe(true);
    expect(common.includes("const form: FormField[]")).toBe(true);
    expect(common.includes('prop: "name"')).toBe(true);
    expect(common.includes('prop: "email"')).toBe(true);
    expect(common.includes('placeholder: "姓名关键字"')).toBe(true);
    expect(common.includes('row.id === "4" || row.id === "5"')).toBe(true);
  });

  it("发布示例不 import data-panel-demo，也不使用不透明 DEMO_* 名", async () => {
    const { panelDemos, viewDemos, panelCodes, codes } = await loadFixture();
    const panelSrc = await readTextFile(PANEL_PAGE);
    const viewSrc = await readTextFile(VIEW_PAGE);
    const published = [
      ...panelDemos.map((d) => d.published),
      ...viewDemos.map((d) => d.published),
    ];
    // 页内「引入」等非 DocsDemo 的 *Code 也检查
    for (const raw of Object.values(panelCodes)) {
      published.push(interpolate(raw, codes));
    }
    for (const raw of extractInlineCodes(panelSrc)) {
      published.push(interpolate(raw, codes));
    }
    for (const raw of extractInlineCodes(viewSrc)) {
      published.push(interpolate(raw, codes));
    }
    const bad: string[] = [];
    for (const src of published) {
      if (src.includes("data-panel-demo")) {
        bad.push("imports data-panel-demo.ts");
      }
      if (
        /\bDEMO_(COLUMNS|FORM_RICH|FORM|SEARCH|HIDE_CHROME|USER)\b/.test(src)
      ) {
        bad.push("uses opaque DEMO_* name");
      }
    }
    expect(bad).toEqual([]);
  });

  it("带 makeDemoRows 的示例都展示函数定义，且 N 与现场一致", async () => {
    const { panelDemos } = await loadFixture();
    const mismatches: string[] = [];
    for (const demo of panelDemos) {
      const pubN = makeNs(demo.published);
      const liveN = makeNs(demo.liveChildren);
      if (pubN.length && !demo.published.includes("function makeDemoRows")) {
        mismatches.push(`${demo.title}: 调用 makeDemoRows 但没有函数定义`);
      }
      if (liveN.length && pubN.length && liveN[0] !== pubN[0]) {
        mismatches.push(
          `${demo.title}: live makeDemoRows(${liveN[0]}) vs snippet (${
            pubN[0]
          })`,
        );
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("现场 DataPanel panelKey／title 与示例源码一致", async () => {
    const { panelDemos } = await loadFixture();
    const mismatches: string[] = [];
    for (const demo of panelDemos) {
      const liveKeys = [
        ...demo.liveChildren.matchAll(/panelKey="([^"]+)"/g),
      ].map((m) => m[1]);
      const pubKeys = [
        ...demo.published.matchAll(/panelKey="([^"]+)"/g),
      ].map((m) => m[1]);
      if (liveKeys.length && pubKeys.length && liveKeys[0] !== pubKeys[0]) {
        mismatches.push(
          `${demo.title}: panelKey live=${liveKeys} snippet=${pubKeys}`,
        );
      }
      const liveTitles = [
        ...demo.liveChildren.matchAll(/<DataPanel\b[\s\S]*?title="([^"]+)"/g),
      ].map((m) => m[1]);
      const pubTitles = [
        ...demo.published.matchAll(/<DataPanel\b[\s\S]*?title="([^"]+)"/g),
      ].map((m) => m[1]);
      if (
        liveTitles.length &&
        pubTitles.length &&
        liveTitles[0] !== pubTitles[0]
      ) {
        mismatches.push(
          `${demo.title}: title live=${liveTitles[0]} snippet=${pubTitles[0]}`,
        );
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("特殊示例内联自己的数据（拼接列、列函数、远程、单元格）", async () => {
    const { panelDemos } = await loadFixture();
    const byTitle = Object.fromEntries(
      panelDemos.map((d) => [d.title, d.published]),
    );
    const join =
      Object.values(byTitle).find((s) =>
        s.includes('panelKey="demo-join-name"')
      ) ?? "";
    expect(join.includes('lastName: "张"')).toBe(true);
    expect(join.includes('firstName: "三"')).toBe(true);
    expect(join.includes('lastName: "李"')).toBe(true);
    expect(join.includes('lastName: "王"')).toBe(true);

    const colFn =
      Object.values(byTitle).find((s) =>
        s.includes('panelKey="demo-col-fn"')
      ) ?? "";
    expect(colFn.includes('name: "Alice"')).toBe(true);
    expect(colFn.includes('name: "Bob"')).toBe(true);
    expect(colFn.includes('name: "Carol"')).toBe(true);

    const remote =
      Object.values(byTitle).find((s) =>
        s.includes('panelKey="demo-remote"')
      ) ?? "";
    expect(remote.includes("function makeDemoRows")).toBe(true);
    expect(remote.includes("makeDemoRows(60)")).toBe(true);
    expect(
      remote.includes("function createRemoteDemoSource") ||
        remote.includes("createLocalDataSource"),
    ).toBe(true);

    const cell =
      Object.values(byTitle).find((s) => s.includes('panelKey="demo-cell"')) ??
        "";
    expect(
      cell.includes("function makeCellRows") || cell.includes("birthday"),
    ).toBe(true);
    expect(cell.includes('inline: "text"') || cell.includes('inline: "text"'))
      .toBe(true);
  });

  it("工具栏族示例展示真实按钮配置，而不是空壳 JSX", async () => {
    const { panelDemos } = await loadFixture();
    const pub = Object.fromEntries(
      panelDemos.map((d) => [d.title, d.published]),
    );
    const pick = (needle: string) =>
      Object.values(pub).find((s) => s.includes(needle)) ?? "";
    expect(pick('panelKey="demo-tb-custom"').includes('label: "邀请"')).toBe(
      true,
    );
    expect(pick('panelKey="demo-ra-custom"').includes('label: "克隆"')).toBe(
      true,
    );
    expect(pick('panelKey="demo-key-order"').includes("order:audit")).toBe(
      true,
    );
    expect(pick('panelKey="demo-enabled"').includes("disable 演示")).toBe(
      true,
    );
    expect(pick('panelKey="demo-title"').includes("title Tooltip")).toBe(true);
    expect(pick('panelKey="demo-can"').includes("can()／页面变量")).toBe(true);
    expect(pick('panelKey="demo-can"').includes("demo.write")).toBe(true);
    expect(pick('panelKey="demo-custom"').includes('label: "冻结"')).toBe(true);
    expect(pick('panelKey="demo-dark"').includes("深色面板")).toBe(true);
  });

  it("data + baseRoute 示例内联张三李四王五，且含 baseRoute 与 data", async () => {
    const { panelDemos } = await loadFixture();
    const demo = panelDemos.find((d) =>
      d.published.includes('panelKey="demo-data-base-route"')
    );
    expect(Boolean(demo)).toBe(true);
    expect(demo!.published.includes("张三")).toBe(true);
    expect(demo!.published.includes("李四")).toBe(true);
    expect(demo!.published.includes("王五")).toBe(true);
    expect(demo!.published.includes('baseRoute="/api/users"')).toBe(true);
    expect(demo!.published.includes("data={rows}")).toBe(true);
    expect(demo!.published.includes("data-panel-demo")).toBe(false);
    expect(demo!.liveChildren.includes("张三")).toBe(true);
    expect(demo!.liveChildren.includes('baseRoute="/api/users"')).toBe(true);
  });

  it("openViewOnRowClick 示例源码含开关且定义内联，默认可仅用眼睛", async () => {
    const { panelDemos } = await loadFixture();
    const rowClick = panelDemos.find((d) =>
      d.published.includes('panelKey="demo-row-click-view"')
    );
    const viewDemo = panelDemos.find((d) => d.title.includes("查看详情"));
    expect(Boolean(rowClick)).toBe(true);
    expect(rowClick!.published.includes("function makeDemoRows")).toBe(true);
    expect(rowClick!.published.includes("openViewOnRowClick")).toBe(true);
    expect(rowClick!.liveChildren.includes("openViewOnRowClick")).toBe(true);
    expect(Boolean(viewDemo)).toBe(true);
    expect(viewDemo!.published.includes("openViewOnRowClick")).toBe(false);
    expect(viewDemo!.published.includes("data-panel-demo")).toBe(false);
    expect(viewDemo!.liveChildren.includes('panelKey="demo-view"')).toBe(true);
  });

  it("DataView 示例内联用户数据，不引用外部 DEMO_USER", async () => {
    const { viewDemos } = await loadFixture();
    for (const demo of viewDemos) {
      expect(demo.published.includes("data-panel-demo")).toBe(false);
      expect(demo.published.includes("DEMO_USER")).toBe(false);
    }
    const all = viewDemos.map((d) => d.published).join("\n");
    expect(all.includes("Ada Lovelace")).toBe(true);
    expect(all.includes('lastName: "张"') || all.includes("张")).toBe(true);
    expect(all.includes("三")).toBe(true);
  });
});
