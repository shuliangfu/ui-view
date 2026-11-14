/**
 * DataPanel 就地编辑器宽度：按草稿内容估算，不再使用固定 9.5rem 最小宽。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  ED_WRAP_CLS,
  inlineEditorContentCh,
  inlineEditorInputCssWidth,
  inlineEditorInputWidthStyle,
} from "../../src/desktop/data-display/data-panel-chrome.tsx";

describe("inlineEditorContentCh", () => {
  it("gives number editors at least 3ch so 2-digit sort values stay readable", () => {
    expect(inlineEditorContentCh("", "number")).toBe(3);
    expect(inlineEditorContentCh("9", "number")).toBe(3);
    expect(inlineEditorContentCh("90", "number")).toBe(3);
    expect(inlineEditorContentCh("100", "number")).toBe(3);
  });

  it("grows with longer numeric drafts and caps at 12", () => {
    expect(inlineEditorContentCh("1234", "number")).toBe(4);
    expect(inlineEditorContentCh("123456789012345", "number")).toBe(12);
    expect(inlineEditorContentCh("-12.5", "number")).toBe(5);
  });

  it("uses type-specific floors and caps for date, datetime, text, and textarea", () => {
    expect(inlineEditorContentCh("", "date")).toBe(10);
    expect(inlineEditorContentCh("2026-11-13", "date")).toBe(10);
    expect(inlineEditorContentCh("", "datetime")).toBe(16);
    expect(inlineEditorContentCh("hi", "text")).toBe(6);
    expect(inlineEditorContentCh("abcdefghij", "text")).toBe(10);
    expect(inlineEditorContentCh("x".repeat(40), "text")).toBe(24);
    expect(inlineEditorContentCh("", "textarea")).toBe(12);
    expect(inlineEditorContentCh("x".repeat(40), "textarea")).toBe(32);
  });
});

describe("inlineEditorInputCssWidth", () => {
  it("adds sm px-3 padding (1.5rem) on top of the content ch", () => {
    expect(inlineEditorInputCssWidth("90", "number")).toBe(
      "calc(3ch + 1.5rem)",
    );
    expect(inlineEditorInputCssWidth("12345", "number")).toBe(
      "calc(5ch + 1.5rem)",
    );
  });

  it("returns a style object that DataPanel can bind as --dp-ed-input-w", () => {
    expect(inlineEditorInputWidthStyle("90", "number")).toEqual({
      "--dp-ed-input-w": "calc(3ch + 1.5rem)",
    });
  });
});

describe("ED_WRAP_CLS", () => {
  it("hugs content instead of forcing a 9.5rem minimum width", () => {
    expect(ED_WRAP_CLS.includes("min-w-[9.5rem]")).toBe(false);
    expect(ED_WRAP_CLS.includes("w-fit")).toBe(true);
    expect(ED_WRAP_CLS.includes("dp-ed-wrap")).toBe(true);
    expect(ED_WRAP_CLS.includes("--dp-ed-input-w")).toBe(true);
    expect(ED_WRAP_CLS.includes("field-sizing:content")).toBe(true);
  });
});
