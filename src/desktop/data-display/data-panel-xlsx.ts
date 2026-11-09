/**
 * 零依赖 xlsx（OOXML）读写：写出真正的 .xlsx 工作簿（ZIP「存储」模式，无压缩），
 * 首行表头加粗白字蓝底并冻结，数字单元格为数值类型，文本使用 inlineStr。
 * 导入支持存储／deflate 压缩的 OOXML，解析首个工作表；浏览器 / Deno / Node 通用（不依赖 DOM）。
 */

/** xlsx 单元格：字符串、数字或空 */
export type XlsxCell = string | number | null | undefined;

/** `buildXlsx` 入参 */
export interface XlsxSheet {
  /** 工作表名（≤31 字符，自动去掉非法字符） */
  name?: string;
  /** 表头 */
  headers: string[];
  /** 数据行 */
  rows: XlsxCell[][];
  /** 末尾合计行（可选，加粗） */
  footer?: XlsxCell[];
  /** 创建者（docProps/core 不写入，仅保留给调用方扩展） */
}

const enc = new TextEncoder();

let crcTable: Uint32Array | null = null;
/** CRC-32（ZIP 校验） */
export function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 转义 XML 文本，并去掉 XML 1.0 不允许的控制字符 */
export function xmlEscape(s: string): string {
  return s
    // deno-lint-ignore no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** 列序号（0 起）→ A / B … AA */
export function xlsxColumnName(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** 文本以公式字符开头时前置 `'`，避免表格软件当作公式执行 */
export function neutralizeFormula(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function strWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1;
  return w;
}

function cellXml(
  ref: string,
  v: XlsxCell,
  style: number,
): string {
  const s = style ? ` s="${style}"` : "";
  if (v === null || v === undefined || v === "") {
    return style ? `<c r="${ref}"${s}/>` : "";
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return `<c r="${ref}"${s}><v>${v}</v></c>`;
  }
  const text = xmlEscape(String(v));
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

/** 生成 sheet1.xml */
export function buildSheetXml(sheet: XlsxSheet): string {
  const cols = sheet.headers.length;
  const widths = sheet.headers.map((h, i) => {
    let w = strWidth(h);
    for (const r of sheet.rows) {
      const v = r[i];
      if (v !== null && v !== undefined) w = Math.max(w, strWidth(String(v)));
    }
    return Math.min(60, Math.max(10, w + 2));
  });
  const rowsXml: string[] = [];
  const pushRow = (n: number, cells: XlsxCell[], style: number) => {
    const inner = cells
      .map((v, i) => cellXml(`${xlsxColumnName(i)}${n}`, v, style))
      .join("");
    rowsXml.push(`<row r="${n}">${inner}</row>`);
  };
  pushRow(1, sheet.headers, 1);
  sheet.rows.forEach((r, i) => pushRow(i + 2, r, 0));
  if (sheet.footer) pushRow(sheet.rows.length + 2, sheet.footer, 2);
  const lastRow = sheet.rows.length + 1 + (sheet.footer ? 1 : 0);
  const dim = `A1:${xlsxColumnName(Math.max(0, cols - 1))}${lastRow}`;
  const colsXml = widths
    .map((w, i) =>
      `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="${dim}"/>` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${colsXml}</cols><sheetData>${
      rowsXml.join("")
    }</sheetData></worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
  `<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FF3C8DBC"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
  `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/** 极简 ZIP（method 0，存储）；条目名须为 ASCII */
export function zipStore(
  files: { name: string; data: Uint8Array }[],
): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  // 固定 DOS 时间 2020-01-01 00:00，保证输出可复现
  const dosTime = 0;
  const dosDate = ((2020 - 1980) << 9) | (1 << 5) | 1;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8 names
    lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, f.data.length, true);
    lh.setUint32(22, f.data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, f.data.length, true);
    ch.setUint32(24, f.data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const centralSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of all) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** 生成 .xlsx 文件内容 */
export function buildXlsx(sheet: XlsxSheet): Uint8Array {
  const name = xmlEscape(
    (sheet.name ?? "Sheet1").replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() ||
      "Sheet1",
  );
  const files = [
    {
      name: "[Content_Types].xml",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", data: STYLES_XML },
    { name: "xl/worksheets/sheet1.xml", data: buildSheetXml(sheet) },
  ].map((f) => ({ name: f.name, data: enc.encode(f.data) }));
  return zipStore(files);
}

/** .xlsx 的 MIME */
export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";


const dec = new TextDecoder();

/** 解压 ZIP deflate-raw（method 8） */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  // 拷贝为独立 ArrayBuffer，避免 SharedArrayBuffer／BlobPart 类型摩擦
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const stream = new Blob([copy]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** 列字母（A／AA）→ 0 起下标 */
export function colLettersToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

/** 还原 `xmlEscape` */
export function xmlUnescape(s: string): string {
  return s
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/** 解析 ZIP（method 0 存储／8 deflate）；返回 name → bytes */
export async function unzipEntries(
  zip: Uint8Array,
): Promise<Map<string, Uint8Array>> {
  const dv = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("invalid zip: EOCD missing");
  const count = dv.getUint16(eocd + 10, true);
  let cd = dv.getUint32(eocd + 16, true);
  const out = new Map<string, Uint8Array>();
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(cd, true) !== 0x02014b50) {
      throw new Error("invalid zip: central directory");
    }
    const method = dv.getUint16(cd + 10, true);
    const compSize = dv.getUint32(cd + 20, true);
    const uncompSize = dv.getUint32(cd + 24, true);
    const nameLen = dv.getUint16(cd + 28, true);
    const extraLen = dv.getUint16(cd + 30, true);
    const commentLen = dv.getUint16(cd + 32, true);
    const lho = dv.getUint32(cd + 42, true);
    const name = dec.decode(zip.subarray(cd + 46, cd + 46 + nameLen));
    if (dv.getUint32(lho, true) !== 0x04034b50) {
      throw new Error(`invalid zip local header: ${name}`);
    }
    const lMethod = dv.getUint16(lho + 8, true);
    const lNameLen = dv.getUint16(lho + 26, true);
    const lExtraLen = dv.getUint16(lho + 28, true);
    let lComp = dv.getUint32(lho + 18, true);
    if (lComp === 0) lComp = compSize;
    const start = lho + 30 + lNameLen + lExtraLen;
    const raw = zip.subarray(start, start + lComp);
    const m = method || lMethod;
    let data: Uint8Array;
    if (m === 0) data = raw;
    else if (m === 8) data = await inflateRaw(raw);
    else throw new Error(`unsupported zip method ${m} for ${name}`);
    if (uncompSize && data.length !== uncompSize && m === 0) {
      // 存储模式下长度应一致；deflate 后以实际为准
    }
    out.set(name, data);
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  // <si>…<t>…</t>…</si>（可能含 rich text 多段 <t>）
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml))) {
    const parts: string[] = [];
    const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
    let t: RegExpExecArray | null;
    while ((t = tRe.exec(m[1]))) parts.push(xmlUnescape(t[1]));
    out.push(parts.join(""));
  }
  return out;
}

/** 工作表 XML → 二维字符串表（稀疏列按最大列对齐） */
export function parseSheetXmlToMatrix(
  xml: string,
  shared: string[] = [],
): string[][] {
  const rows: { r: number; cells: Map<number, string> }[] = [];
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/gi;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml))) {
    const rowAttr = rm[1];
    const inner = rm[2];
    const rMatch = /\br="(\d+)"/.exec(rowAttr);
    const rNum = rMatch ? Number(rMatch[1]) : rows.length + 1;
    const cells = new Map<number, string>();
    const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/gi;
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(inner))) {
      const attrs = cm[1] ?? cm[3] ?? "";
      const body = cm[2] ?? "";
      const ref = /\br="([A-Z]+)(\d+)"/i.exec(attrs);
      if (!ref) continue;
      const col = colLettersToIndex(ref[1]);
      const t = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "";
      let val = "";
      if (t === "inlineStr") {
        const tm = /<t\b[^>]*>([\s\S]*?)<\/t>/i.exec(body);
        val = tm ? xmlUnescape(tm[1]) : "";
      } else if (t === "s") {
        const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/i.exec(body);
        const idx = vm ? Number(vm[1]) : NaN;
        val = Number.isFinite(idx) ? (shared[idx] ?? "") : "";
      } else if (t === "str" || t === "b") {
        const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/i.exec(body);
        val = vm ? xmlUnescape(vm[1]) : "";
      } else {
        const is = /<is\b[^>]*>[\s\S]*?<t\b[^>]*>([\s\S]*?)<\/t>/i.exec(body);
        if (is) val = xmlUnescape(is[1]);
        else {
          const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/i.exec(body);
          val = vm ? xmlUnescape(vm[1]) : "";
        }
      }
      cells.set(col, val);
    }
    rows.push({ r: rNum, cells });
  }
  rows.sort((a, b) => a.r - b.r);
  let maxCol = -1;
  for (const row of rows) {
    for (const c of row.cells.keys()) maxCol = Math.max(maxCol, c);
  }
  if (maxCol < 0) return [];
  return rows.map((row) => {
    const arr = Array.from({ length: maxCol + 1 }, () => "");
    for (const [c, v] of row.cells) arr[c] = v;
    return arr;
  });
}

/**
 * 解析 .xlsx 字节 → 以首行表头为键的行（字符串值）。
 * 读取 workbook 指向的首个 worksheet；支持 inlineStr／共享字符串／数值。
 */
export async function parseXlsx(
  data: Uint8Array,
): Promise<Record<string, string>[]> {
  const files = await unzipEntries(data);
  const wb = files.get("xl/workbook.xml");
  const rels = files.get("xl/_rels/workbook.xml.rels");
  let sheetPath = "xl/worksheets/sheet1.xml";
  if (wb && rels) {
    const sheet = /<sheet\b[^>]*\br:id="([^"]+)"/i.exec(dec.decode(wb));
    if (sheet) {
      const id = sheet[1];
      const re = new RegExp(
        `<Relationship\\b[^>]*\\bId="${id}"[^>]*\\bTarget="([^"]+)"`,
        "i",
      );
      const m = re.exec(dec.decode(rels));
      if (m) {
        const target = m[1].replace(/^\//, "");
        sheetPath = target.startsWith("xl/")
          ? target
          : `xl/${target}`;
      }
    }
  }
  const sheetBytes = files.get(sheetPath) ??
    files.get("xl/worksheets/sheet1.xml");
  if (!sheetBytes) throw new Error("xlsx worksheet missing");
  const sstBytes = files.get("xl/sharedStrings.xml");
  const shared = sstBytes ? parseSharedStrings(dec.decode(sstBytes)) : [];
  const matrix = parseSheetXmlToMatrix(dec.decode(sheetBytes), shared);
  if (matrix.length < 2) return [];
  const [head, ...rest] = matrix;
  const keys = head.map((h) => h.trim());
  return rest
    .filter((r) => r.some((c) => c !== ""))
    .map((r) =>
      Object.fromEntries(keys.map((k, i) => [k || `col${i}`, (r[i] ?? "").trim()]))
    );
}
