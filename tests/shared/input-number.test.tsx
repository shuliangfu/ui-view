/** @jsxImportSource @dreamer/view */
/**
 * InputNumber 用普通 text input，不用 type=number，避免原生微调箭头与自定义 +/- 重叠。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  InputNumber,
  isPartialNumber,
  stepInputNumberValue,
} from "../../src/shared/form/InputNumber.tsx";

describe("InputNumber 使用 text input，不用 type=number", () => {
  it("SSR 输出 type=text，保留自定义 − ＋，且没有 type=number 或原生 spinner 隐藏类", async () => {
    const h = String(
      await renderToString(() => <InputNumber value={90} />),
    );
    expect(h).toContain('type="text"');
    expect(h).not.toContain('type="number"');
    expect(h).toContain("−");
    expect(h).toContain("+");
    expect(h).toContain('aria-label="减少"');
    expect(h).toContain('aria-label="增加"');
    expect(h).toContain("90");
    expect(h).not.toContain("[appearance:textfield]");
    expect(h).not.toContain("::-webkit-inner-spin-button");
    expect(h).not.toContain("::-webkit-outer-spin-button");
  });
});

describe("stepInputNumberValue", () => {
  it("increments and decrements numerically by step", () => {
    expect(stepInputNumberValue(90, 1, 1)).toBe(91);
    expect(stepInputNumberValue(90, -1, 1)).toBe(89);
    expect(stepInputNumberValue("90", 1, 10)).toBe(100);
  });

  it("clamps to min and max", () => {
    expect(stepInputNumberValue(1, -1, 1, 0, 10)).toBe(0);
    expect(stepInputNumberValue(0, -1, 1, 0, 10)).toBe(0);
    expect(stepInputNumberValue(10, 1, 1, 0, 10)).toBe(10);
  });

  it("empty or invalid current starts at min when decreasing and step when increasing", () => {
    expect(stepInputNumberValue("", -1, 1, 0)).toBe(0);
    expect(stepInputNumberValue(undefined, -1, 1)).toBe(0);
    expect(stepInputNumberValue("", 1, 1)).toBe(1);
    expect(stepInputNumberValue("", 1, 0.1)).toBe(0.1);
  });

  it("rounds by step precision so 0.1 increments stay decimal", () => {
    expect(stepInputNumberValue(0.1, 1, 0.1)).toBe(0.2);
    expect(stepInputNumberValue(1.19, 1, 0.1)).toBe(1.3);
  });
});

describe("isPartialNumber", () => {
  it("accepts numeric drafts and rejects letters", () => {
    expect(isPartialNumber("")).toBe(true);
    expect(isPartialNumber("-")).toBe(true);
    expect(isPartialNumber("+")).toBe(true);
    expect(isPartialNumber("90")).toBe(true);
    expect(isPartialNumber("1.")).toBe(true);
    expect(isPartialNumber(".5")).toBe(true);
    expect(isPartialNumber("-12.5")).toBe(true);
    expect(isPartialNumber("abc")).toBe(false);
    expect(isPartialNumber("10e2")).toBe(false);
    expect(isPartialNumber("1.2.3")).toBe(false);
  });
});
