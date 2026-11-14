/**
 * DatePicker viewport 浮层：相对 transform 包含块换算 left／top，超出视口下沿时翻到上方并夹紧。
 */
import { describe, expect, it } from "@dreamer/test";
import { computePickerPortalOffset } from "../../src/shared/form/picker-portal-utils.ts";

describe("computePickerPortalOffset", () => {
  it("无包含块时用视口坐标贴在触发器下方", () => {
    const pos = computePickerPortalOffset(
      { left: 120, bottom: 200 },
      1024,
      { left: 0, top: 0 },
    );
    expect(pos.left).toBe(120);
    expect(pos.top).toBe(204);
  });

  it("有 transform 包含块时减去容器视口原点，避免浮层飞出", () => {
    const pos = computePickerPortalOffset(
      { left: 420, bottom: 260 },
      1024,
      { left: 400, top: 80 },
    );
    expect(pos.left).toBe(20);
    expect(pos.top).toBe(184);
  });

  it("下方放不下且上方空间足够时，翻到触发器上方", () => {
    const pos = computePickerPortalOffset(
      { left: 120, top: 500, bottom: 536 },
      1024,
      { left: 0, top: 0 },
      { panelHeight: 320, viewportHeight: 600 },
    );
    expect(pos.left).toBe(120);
    // 500 - 4 - 320
    expect(pos.top).toBe(176);
  });

  it("翻转后仍相对 transform 包含块换算", () => {
    const pos = computePickerPortalOffset(
      { left: 420, top: 500, bottom: 536 },
      1024,
      { left: 400, top: 80 },
      { panelHeight: 320, viewportHeight: 600 },
    );
    expect(pos.left).toBe(20);
    // (500 - 4 - 320) - 80
    expect(pos.top).toBe(96);
  });

  it("上下都放不下时夹紧在视口内", () => {
    const pos = computePickerPortalOffset(
      { left: 120, top: 40, bottom: 76 },
      1024,
      { left: 0, top: 0 },
      { panelHeight: 500, viewportHeight: 400 },
    );
    expect(pos.left).toBe(120);
    // 浮层高于视口，钉在 inset
    expect(pos.top).toBe(8);
  });

  it("下方放得下时仍贴在触发器下方", () => {
    const pos = computePickerPortalOffset(
      { left: 120, top: 80, bottom: 116 },
      1024,
      { left: 0, top: 0 },
      { panelHeight: 200, viewportHeight: 800 },
    );
    expect(pos.left).toBe(120);
    expect(pos.top).toBe(120);
  });
});
