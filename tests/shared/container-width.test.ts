import { describe, expect, it } from "@dreamer/test";
import { isUsableContainerWidthPx,
  normalizeContainerWidthPx } from "../../src/shared/container-width.ts";

describe("normalizeContainerWidthPx", () => {
  it("把亚像素宽度四舍五入到百分之一，避免边框盒与 contentRect 来回跳", () => {
    expect(normalizeContainerWidthPx(639.984)).toBe(639.98);
    expect(normalizeContainerWidthPx(639.985)).toBe(639.99);
    expect(normalizeContainerWidthPx(640)).toBe(640);
    expect(normalizeContainerWidthPx(767.996)).toBe(768);
  });

  it("同一容器上边框盒与略小的 contentRect 会收成相同值", () => {
    const border = 768.004;
    const content = 767.996;
    expect(normalizeContainerWidthPx(border)).toBe(
      normalizeContainerWidthPx(content),
    );
  });
});

describe("isUsableContainerWidthPx", () => {
  it("只接受大于 0 的有限宽度，避免把未布局的 0 写进 signal", () => {
    expect(isUsableContainerWidthPx(0)).toBe(false);
    expect(isUsableContainerWidthPx(-1)).toBe(false);
    expect(isUsableContainerWidthPx(Number.NaN)).toBe(false);
    expect(isUsableContainerWidthPx(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isUsableContainerWidthPx(0.01)).toBe(true);
    expect(isUsableContainerWidthPx(640)).toBe(true);
  });
});
