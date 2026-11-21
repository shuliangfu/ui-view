/**
 * DatePicker viewport 浮层：相对 transform 包含块换算 left／top，超出视口下沿时翻到上方并夹紧。
 */
import "./happy-dom-setup.ts";
import { describe, expect, it } from "@dreamer/test";
import {
  computePickerPortalOffset,
  computePickerPortalStyle,
} from "../../src/shared/form/picker-portal-utils.ts";

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

describe("picker viewport clamp", () => {
  it("picker viewport clamps using measured calendar-plus-time width, not only minimum", () => {
    const width = Object.getOwnPropertyDescriptor(globalThis, "innerWidth"),
      height = Object.getOwnPropertyDescriptor(globalThis, "innerHeight");
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 720,
    });
    const trigger = document.createElement("button"),
      panel = document.createElement("div");
    Object.defineProperty(trigger, "getBoundingClientRect", {
      value: () => ({
        left: 1080,
        top: 380,
        bottom: 415,
        width: 169,
        height: 35,
      }),
    });
    Object.defineProperty(panel, "getBoundingClientRect", {
      value: () => ({
        left: 984,
        top: 419,
        bottom: 692,
        width: 435,
        height: 273,
      }),
    });
    try {
      const style = computePickerPortalStyle(
        trigger,
        { panelMinWidth: 288 },
        panel,
      );
      expect(style.left).toBe("837px");
      expect(style.top).toBe("419px");
      expect(Number.parseFloat(style.left) + 435).toBe(1272);
    } finally {
      if (width) Object.defineProperty(globalThis, "innerWidth", width);
      else Reflect.deleteProperty(globalThis, "innerWidth");
      if (height) Object.defineProperty(globalThis, "innerHeight", height);
      else Reflect.deleteProperty(globalThis, "innerHeight");
    }
  });
});
