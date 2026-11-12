/**
 * @fileoverview Transfer listStyle / height / minHeight / maxHeight 解析。
 * 顶层参数只接受像素数字；CSS 值走 listStyle。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DEFAULT_TRANSFER_LIST_HEIGHT,
  resolveCssSize,
  resolveListBoxStyle,
  resolvePxNumber,
} from "../../src/shared/form/transfer-list-style.ts";

describe("resolveCssSize", () => {
  it("turns a pixel number into px", () => {
    expect(resolveCssSize(360)).toBe("360px");
    expect(resolveCssSize(280)).toBe("280px");
  });

  it("keeps CSS strings as-is and trims them", () => {
    expect(resolveCssSize("calc(100vh - 240px)")).toBe("calc(100vh - 240px)");
    expect(resolveCssSize("  70vh  ")).toBe("70vh");
    expect(resolveCssSize("max(280px, calc(100vh - 340px))")).toBe(
      "max(280px, calc(100vh - 340px))",
    );
  });

  it("ignores empty, zero, and invalid numbers", () => {
    expect(resolveCssSize(undefined)).toBeUndefined();
    expect(resolveCssSize("")).toBeUndefined();
    expect(resolveCssSize("   ")).toBeUndefined();
    expect(resolveCssSize(0)).toBeUndefined();
    expect(resolveCssSize(-10)).toBeUndefined();
    expect(resolveCssSize(Number.NaN)).toBeUndefined();
  });
});

describe("resolvePxNumber", () => {
  it("only accepts positive finite numbers", () => {
    expect(resolvePxNumber(200)).toBe("200px");
    expect(resolvePxNumber(0)).toBeUndefined();
    expect(resolvePxNumber(undefined)).toBeUndefined();
    expect(resolvePxNumber(Number.NaN)).toBeUndefined();
  });
});

describe("resolveListBoxStyle", () => {
  it("defaults height to 200px without min or max", () => {
    const style = resolveListBoxStyle({});
    expect(style.height).toBe(DEFAULT_TRANSFER_LIST_HEIGHT);
    expect(style.height).toBe("200px");
    expect(style.minHeight).toBeUndefined();
    expect(style.maxHeight).toBeUndefined();
    expect(style.boxSizing).toBe("border-box");
  });

  it("uses listStyle pixel numbers and CSS values", () => {
    expect(resolveListBoxStyle({ height: 360 }).height).toBe("360px");
    const style = resolveListBoxStyle({
      height: "calc(100vh - 240px)",
      minHeight: 280,
      maxHeight: "calc(100vh - 280px)",
    });
    expect(style.height).toBe("calc(100vh - 240px)");
    expect(style.minHeight).toBe("280px");
    expect(style.maxHeight).toBe("calc(100vh - 280px)");
  });

  it("lets numeric top-level props win over listStyle", () => {
    const style = resolveListBoxStyle(
      {
        height: "calc(100vh - 240px)",
        minHeight: "20vh",
        maxHeight: "80vh",
      },
      { height: 400, minHeight: 240, maxHeight: 800 },
    );
    expect(style.height).toBe("400px");
    expect(style.minHeight).toBe("240px");
    expect(style.maxHeight).toBe("800px");
  });

  it("does not let a missing top-level number wipe listStyle CSS", () => {
    const style = resolveListBoxStyle(
      { height: "70vh" },
      {},
    );
    expect(style.height).toBe("70vh");
  });
});
