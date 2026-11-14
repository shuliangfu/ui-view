/**
 * DatePicker viewport 浮层：相对 transform 包含块换算 left／top。
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
});
