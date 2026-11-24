/**
 * DatePicker viewport 浮层：相对 transform 包含块换算 left／top，超出视口下沿时翻到上方并夹紧。
 */
import "./happy-dom-setup.ts";
import { describe, expect, it } from "@dreamer/test";
import {
  computePickerPortalOffset,
  computePickerPortalStyle,
  PICKER_OVERLAY_ATTR,
  pinPickerPanelToViewport,
  sanitizePickerPanelMinWidth,
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

  it("测到接近视口宽度时不把 left 夹到左缘", () => {
    const pos = computePickerPortalOffset(
      { left: 900, bottom: 200 },
      1280,
      { left: 0, top: 0 },
      { panelMinWidth: 1280 },
    );
    expect(pos.left).toBe(900);
    expect(pos.top).toBe(204);
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

  it("测量宽度等于视口时仍把 left 留在触发器处", () => {
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
        left: 900,
        top: 200,
        bottom: 236,
        width: 360,
        height: 36,
      }),
    });
    Object.defineProperty(panel, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        top: 240,
        bottom: 480,
        width: 1280,
        height: 240,
      }),
    });
    try {
      const style = computePickerPortalStyle(
        trigger,
        { panelMinWidth: 360 },
        panel,
      );
      expect(style.left).toBe("900px");
      expect(style.top).toBe("240px");
    } finally {
      if (width) Object.defineProperty(globalThis, "innerWidth", width);
      else Reflect.deleteProperty(globalThis, "innerWidth");
      if (height) Object.defineProperty(globalThis, "innerHeight", height);
      else Reflect.deleteProperty(globalThis, "innerHeight");
    }
  });
});

describe("sanitizePickerPanelMinWidth", () => {
  it("接近视口宽的读数视为无效", () => {
    expect(sanitizePickerPanelMinWidth(1280, 1280)).toBe(0);
    expect(sanitizePickerPanelMinWidth(1260, 1280)).toBe(0);
    expect(sanitizePickerPanelMinWidth(435, 1280)).toBe(435);
  });
});

describe("pinPickerPanelToViewport", () => {
  it("挂到 body 后 left 按视口算，不受 transform 祖先影响", () => {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.transform = "translate(120px, 40px)";
    modal.style.left = "80px";
    modal.style.top = "60px";
    const host = document.createElement("div");
    const panel = document.createElement("div");
    host.appendChild(panel);
    modal.appendChild(host);
    document.body.appendChild(modal);
    const trigger = document.createElement("div");
    document.body.appendChild(trigger);
    Object.defineProperty(trigger, "getBoundingClientRect", {
      value: () => ({
        left: 200,
        top: 180,
        bottom: 216,
        width: 360,
        height: 36,
      }),
    });
    Object.defineProperty(modal, "getBoundingClientRect", {
      value: () => ({
        left: 80,
        top: 60,
        bottom: 560,
        width: 640,
        height: 500,
      }),
    });
    const unpin = pinPickerPanelToViewport(panel);
    expect(panel.parentElement).toBe(document.body);
    expect(panel.getAttribute(PICKER_OVERLAY_ATTR)).toBe("");
    expect(panel.style.position).toBe("fixed");
    const style = computePickerPortalStyle(
      trigger,
      { panelMinWidth: 360 },
      panel,
    );
    /** 已挂到 body：不该再扣 Modal 的 transform 包含块原点 */
    expect(style.left).toBe("200px");
    expect(style.top).toBe("220px");
    unpin();
    expect(panel.parentElement).toBe(host);
    expect(panel.hasAttribute(PICKER_OVERLAY_ATTR)).toBe(false);
    trigger.remove();
    modal.remove();
  });

  it("discard 拆除旧浮层，不把它移回原父级", () => {
    const home = document.createElement("div");
    const panel = document.createElement("div");
    home.appendChild(panel);
    document.body.appendChild(home);
    const unpin = pinPickerPanelToViewport(panel);
    expect(panel.parentElement).toBe(document.body);
    unpin({ discard: true });
    expect(panel.parentElement).toBe(null);
    expect(home.contains(panel)).toBe(false);
    expect(home.childNodes.length).toBe(0);
    home.remove();
  });
});
