/**
 * Modal 文档页的示例标题、示例代码与 API 表，须与 public-docs-reference 夹具一致，
 * 避免 copyIn 再出现夹具与文档源码对不上的情况。
 */
import {
  dirname,
  fromFileUrl,
  join,
  readTextFile,
} from "@dreamer/runtime-adapter";
import { describe, expect, it } from "@dreamer/test";

const ROOT = join(dirname(fromFileUrl(import.meta.url)), "..", "..");
const PAGE = join(ROOT, "docs/src/routes/desktop/feedback/modal.tsx");
const FIXTURE = join(
  ROOT,
  "tests/docs-browser/operations/fixtures/public-docs-reference.json",
);

/** 按内容比较换行：Windows 检出的文档源可能是 CRLF，夹具为 LF。 */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n|\r/g, "\n");
}

function unescapeTemplate(raw: string): string {
  return raw
    .replace(/\\`/g, "`")
    .replace(/\\\$/g, "$")
    .replace(/\\\\/g, "\\");
}

function extractTemplate(src: string, start: number): [string, number] {
  let i = start;
  while (i < src.length) {
    if (src[i] === "\\" && i + 1 < src.length) {
      i += 2;
      continue;
    }
    if (src[i] === "`") {
      return [unescapeTemplate(src.slice(start, i)), i + 1];
    }
    i += 1;
  }
  throw new Error("unclosed template literal");
}

function extractCodes(src: string): string[] {
  const codes: string[] = [];
  const importMark = "const importCode = `";
  const importAt = src.indexOf(importMark);
  if (importAt < 0) throw new Error("importCode missing");
  const [importCode, afterImport] = extractTemplate(
    src,
    importAt + importMark.length,
  );
  codes.push(importCode);
  let i = afterImport;
  const mark = "code={`";
  while (i < src.length) {
    const idx = src.indexOf(mark, i);
    if (idx < 0) break;
    const [code, next] = extractTemplate(src, idx + mark.length);
    codes.push(code);
    i = next;
  }
  return codes.map(normalizeNewlines);
}

function parseTsString(src: string, start: number): [string, number] {
  const quote = src[start];
  if (quote !== '"' && quote !== "'") {
    throw new Error(`expected string at ${start}`);
  }
  let i = start + 1;
  let out = "";
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length) {
      const nxt = src[i + 1];
      out += nxt === "n" ? "\n" : nxt === "t" ? "\t" : nxt;
      i += 2;
      continue;
    }
    if (ch === quote) return [out, i + 1];
    out += ch;
    i += 1;
  }
  throw new Error("unclosed string");
}

function parseTsStringConcat(src: string, start: number): [string, number] {
  let i = start;
  while (i < src.length && /\s/.test(src[i]!)) i += 1;
  let out = "";
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i]!)) i += 1;
    if (src[i] !== '"' && src[i] !== "'") break;
    const [part, next] = parseTsString(src, i);
    out += part;
    i = next;
  }
  return [out, i];
}

function extractApiRows(
  src: string,
): { name: string; type: string; default: string; description: string }[] {
  const startMark = "const MODAL_API: ApiRow[] = [";
  const start = src.indexOf(startMark);
  if (start < 0) throw new Error("MODAL_API missing");
  const bodyStart = start + startMark.length;
  const end = src.indexOf("\n];", bodyStart);
  const body = src.slice(bodyStart, end);
  const rows = [];
  const field = /\b(name|type|default|description):\s*/g;
  let current: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = field.exec(body))) {
    const key = m[1]!;
    const [value, next] = parseTsStringConcat(body, m.index + m[0].length);
    current[key] = value;
    field.lastIndex = next;
    if (
      current.name && current.type && current.default && current.description
    ) {
      rows.push({
        name: current.name,
        type: current.type,
        default: current.default,
        description: current.description,
      });
      current = {};
    }
  }
  return rows;
}

type PublicFixture = {
  route: string;
  examples: string[];
  codes: string[];
  api: { headers: string[]; rows: string[][] }[];
};

describe("Modal docs examples stay in sync with public-docs-reference", () => {
  it("文档页 h3、CodeBlock 与 API 表与夹具一致，并含新 API 示例", async () => {
    const src = await readTextFile(PAGE);
    const bundle = JSON.parse(await readTextFile(FIXTURE)) as {
      fixtures: PublicFixture[];
    };
    const entry = bundle.fixtures.find((f) =>
      f.route === "/desktop/feedback/modal"
    );
    expect(entry != null).toBe(true);
    const examples = [...src.matchAll(/<Title level=\{3\}>([^<]+)<\/Title>/g)]
      .map((m) => m[1]!);
    expect(examples.map(normalizeNewlines)).toEqual(
      entry!.examples.map(normalizeNewlines),
    );
    expect(extractCodes(src)).toEqual(entry!.codes.map(normalizeNewlines));
    const apiRows = extractApiRows(src).map((r) =>
      [
        r.name,
        r.type,
        r.default,
        r.description,
      ].map(normalizeNewlines)
    );
    expect(apiRows).toEqual(
      entry!.api[0]!.rows.map((row) => row.map(normalizeNewlines)),
    );
    for (const title of ["指定宽高", "标题栏与底栏高度", "嵌入页面"]) {
      expect(examples.includes(title)).toBe(true);
    }
    const joined = entry!.codes.join("\n");
    expect(joined.includes('src="/desktop"')).toBe(true);
    expect(joined.includes('titleHeight="sm"')).toBe(true);
    expect(joined.includes("width={440}")).toBe(true);
    expect(joined.includes("height={900}")).toBe(true);
    expect(joined.includes("draggable")).toBe(true);
    expect(joined.includes("example.com")).toBe(false);
    expect(joined.includes('src="/desktop/feedback/modal"')).toBe(false);
    expect(joined.includes('titleHeight="xs"')).toBe(true);
    expect(joined.includes("titleHeight={40}")).toBe(true);
    expect(joined.includes("footerHeight={64}")).toBe(true);
    expect(joined.includes("width={720}")).toBe(true);
    expect(joined.includes("height={480}")).toBe(true);
    const names = apiRows.map((r) => r[0]);
    for (
      const name of ["src", "sandbox", "titleHeight", "footerHeight", "height"]
    ) {
      expect(names.includes(name)).toBe(true);
    }
  });

  it("文档源为 CRLF 时仍按内容与夹具一致", async () => {
    const lfSrc = normalizeNewlines(await readTextFile(PAGE));
    const crlfSrc = lfSrc.replace(/\n/g, "\r\n");
    const bundle = JSON.parse(await readTextFile(FIXTURE)) as {
      fixtures: PublicFixture[];
    };
    const entry = bundle.fixtures.find((f) =>
      f.route === "/desktop/feedback/modal"
    );
    expect(entry != null).toBe(true);
    const expected = entry!.codes.map(normalizeNewlines);
    const fromCrlf = extractCodes(crlfSrc);
    expect(fromCrlf).toEqual(expected);
    expect(fromCrlf).toEqual(extractCodes(lfSrc));
    expect(fromCrlf.some((code) => code.includes("\r"))).toBe(false);
  });
});
