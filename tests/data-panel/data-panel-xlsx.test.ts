/**
 * @fileoverview DataPanel 原生 xlsx 写入：ZIP 结构、CRC、工作表内容、转义与公式中和。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  buildSheetXml,
  buildXlsx,
  crc32,
  neutralizeFormula,
  xlsxColumnName,
  xmlEscape,
  zipStore,
} from "../../src/desktop/data-display/data-panel-xlsx.ts";

const dec = new TextDecoder();

/** 解析「存储」ZIP：返回 name → bytes，并校验 CRC 与中央目录 */
function readZip(zip: Uint8Array): Map<string, Uint8Array> {
  const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const eocd = zip.length - 22;
  expect(dv.getUint32(eocd, true)).toBe(0x06054b50);
  const count = dv.getUint16(eocd + 10, true);
  let cd = dv.getUint32(eocd + 16, true);
  const out = new Map<string, Uint8Array>();
  for (let i = 0; i < count; i++) {
    expect(dv.getUint32(cd, true)).toBe(0x02014b50);
    const crc = dv.getUint32(cd + 16, true);
    const size = dv.getUint32(cd + 24, true);
    const nameLen = dv.getUint16(cd + 28, true);
    const lho = dv.getUint32(cd + 42, true);
    const name = dec.decode(zip.subarray(cd + 46, cd + 46 + nameLen));
    // 本地头
    expect(dv.getUint32(lho, true)).toBe(0x04034b50);
    const lnl = dv.getUint16(lho + 26, true);
    const lel = dv.getUint16(lho + 28, true);
    const start = lho + 30 + lnl + lel;
    const data = zip.subarray(start, start + size);
    expect(crc32(data)).toBe(crc);
    out.set(name, data);
    cd += 46 + nameLen;
  }
  return out;
}

describe("data-panel-xlsx 工具函数", () => {
  it("crc32 与已知值一致", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("xlsxColumnName：A … Z AA AB … AZ BA", () => {
    expect(xlsxColumnName(0)).toBe("A");
    expect(xlsxColumnName(25)).toBe("Z");
    expect(xlsxColumnName(26)).toBe("AA");
    expect(xlsxColumnName(27)).toBe("AB");
    expect(xlsxColumnName(51)).toBe("AZ");
    expect(xlsxColumnName(52)).toBe("BA");
    expect(xlsxColumnName(701)).toBe("ZZ");
    expect(xlsxColumnName(702)).toBe("AAA");
  });

  it("xmlEscape 转义特殊字符并去掉非法控制字符", () => {
    expect(xmlEscape(`a<b>&"c"`)).toBe("a&lt;b&gt;&amp;&quot;c&quot;");
    expect(xmlEscape("a\u0000b\u0008c")).toBe("abc");
    expect(xmlEscape("tab\tnew\nline")).toBe("tab\tnew\nline");
  });

  it("neutralizeFormula 给公式开头加单引号", () => {
    for (const s of ["=1+1", "+1", "-1", "@SUM(A1)", "\tx", "\rx"]) {
      expect(neutralizeFormula(s)).toBe(`'${s}`);
    }
    expect(neutralizeFormula("normal")).toBe("normal");
    expect(neutralizeFormula("")).toBe("");
  });
});

describe("zipStore", () => {
  it("写出可被读回的 ZIP（名称、内容、CRC、数量）", () => {
    const enc = new TextEncoder();
    const zip = zipStore([
      { name: "a.txt", data: enc.encode("hello") },
      { name: "dir/b.txt", data: enc.encode("世界") },
      { name: "empty", data: new Uint8Array() },
    ]);
    const files = readZip(zip);
    expect([...files.keys()]).toEqual(["a.txt", "dir/b.txt", "empty"]);
    expect(dec.decode(files.get("a.txt"))).toBe("hello");
    expect(dec.decode(files.get("dir/b.txt"))).toBe("世界");
    expect(files.get("empty")!.length).toBe(0);
  });

  it("输出可复现（固定时间戳）", () => {
    const f = [{ name: "x", data: new Uint8Array([1, 2, 3]) }];
    expect(zipStore(f)).toEqual(zipStore(f));
  });
});

describe("buildXlsx", () => {
  const sheet = {
    name: "用户/管理:*?",
    headers: ["姓名", "余额", "备注"],
    rows: [
      ["Alice", 100.5, "a & b <c>"],
      ["=cmd", 0, null],
      ["Bob", Number.NaN, "x"],
    ],
    footer: ["合计", 100.5, ""],
  };
  const zip = buildXlsx(sheet);
  const files = readZip(zip);

  it("包含 OOXML 必需部件", () => {
    expect([...files.keys()].sort()).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    expect(dec.decode(files.get("[Content_Types].xml"))).toContain(
      "spreadsheetml.sheet.main+xml",
    );
  });

  it("工作表名去掉非法字符，且不超过 31 字符", () => {
    const wb = dec.decode(files.get("xl/workbook.xml"));
    expect(wb).toContain('name="用户 管理"');
    const long = readZip(
      buildXlsx({ name: "x".repeat(50), headers: ["a"], rows: [] }),
    );
    const m = /name="(x+)"/.exec(dec.decode(long.get("xl/workbook.xml")))!;
    expect(m[1].length).toBe(31);
    const blank = readZip(buildXlsx({ name: "///", headers: ["a"], rows: [] }));
    expect(dec.decode(blank.get("xl/workbook.xml"))).toContain('name="Sheet1"');
  });

  it("sheet1：表头样式、冻结首行、数值与文本单元格", () => {
    const xml = dec.decode(files.get("xl/worksheets/sheet1.xml"));
    expect(xml).toContain(
      '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>',
    );
    expect(xml).toContain('<dimension ref="A1:C5"/>');
    // 表头：样式 1
    expect(xml).toContain('<c r="A1" s="1" t="inlineStr">');
    // 数字是 <v>，文本是 inlineStr
    expect(xml).toContain('<c r="B2"><v>100.5</v></c>');
    expect(xml).toContain(
      '<c r="A2" t="inlineStr"><is><t xml:space="preserve">Alice</t></is></c>',
    );
    // 特殊字符转义
    expect(xml).toContain("a &amp; b &lt;c&gt;");
    // NaN 不是合法数值：按文本写
    expect(xml).toContain(
      '<c r="B4" t="inlineStr"><is><t xml:space="preserve">NaN</t></is></c>',
    );
    // null 单元格不输出
    expect(xml).not.toContain('r="C3"');
    // 合计行样式 2
    expect(xml).toContain('<c r="A5" s="2" t="inlineStr">');
  });

  it("buildSheetXml：列宽随内容（中文按 2 宽），上限 60，下限 10", () => {
    const xml = buildSheetXml({
      headers: ["a", "很长的中文表头很长的中文表头", "x".repeat(100)],
      rows: [],
    });
    const widths = [...xml.matchAll(/width="(\d+)"/g)].map((m) => Number(m[1]));
    expect(widths[0]).toBe(10);
    expect(widths[1]).toBe(Math.min(60, 14 * 2 + 2));
    expect(widths[2]).toBe(60);
  });

  it("空数据也能生成合法文件", () => {
    const f = readZip(buildXlsx({ headers: ["a", "b"], rows: [] }));
    expect(dec.decode(f.get("xl/worksheets/sheet1.xml"))).toContain(
      '<dimension ref="A1:B1"/>',
    );
  });

  it("styles.xml 含蓝底白字表头与加粗合计两种样式", () => {
    const st = dec.decode(files.get("xl/styles.xml"));
    expect(st).toContain("FF3C8DBC");
    expect(st).toContain('<cellXfs count="3">');
  });
});
