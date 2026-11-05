/**
 * @fileoverview qrMatrix 轻量单元测（无浏览器）
 */

import { describe, expect, it } from "@dreamer/test";
import { qrMatrix } from "../../src/shared/data-display/qrcode-matrix.ts";

describe("qrcode-matrix", () => {
  it("qrMatrix 对短文本返回方阵且含黑白模块", () => {
    const m = qrMatrix("hello");
    expect(Array.isArray(m)).toBe(true);
    expect(m.length).toBeGreaterThan(20);
    expect(m.every((row) => row.length === m.length)).toBe(true);
    const flat = m.flat();
    expect(flat.some((v) => v === true)).toBe(true);
    expect(flat.some((v) => v === false)).toBe(true);
  });

  it("相同输入矩阵一致；空串可生成", () => {
    const a = qrMatrix("DIG");
    const b = qrMatrix("DIG");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const empty = qrMatrix("");
    expect(empty.length).toBeGreaterThan(20);
  });
});
