/**
 * Modal shell width — cap to the viewport so fixed-width forms cannot overflow.
 */
import { describe, expect, it } from "@dreamer/test";
import {
  DEFAULT_MODAL_IFRAME_SANDBOX,
  MODAL_SLOT_HEIGHT_PRESETS,
  MODAL_VIEWPORT_MAX_WIDTH,
  modalShellSizeStyle,
  resolveModalSlotHeight,
  resolveModalWidthCss,
} from "../../src/desktop/feedback/Modal.tsx";

describe("modalShellSizeStyle", () => {
  it("caps a preset width to the viewport and allows shrinking", () => {
    const s = modalShellSizeStyle({ fullscreen: false, width: "520px" });
    expect(s.width).toBe("520px");
    expect(s.maxWidth).toBe(MODAL_VIEWPORT_MAX_WIDTH);
    expect(s.minWidth).toBe("0");
    expect(s.boxSizing).toBe("border-box");
    expect(s.maxHeight).toBe("90vh");
  });

  it("uses a custom maxHeight and treats numbers as pixels", () => {
    const css = modalShellSizeStyle({
      fullscreen: false,
      width: "520px",
      maxHeight: "80vh",
    });
    expect(css.maxHeight).toBe("80vh");
    const px = modalShellSizeStyle({
      fullscreen: false,
      width: "520px",
      maxHeight: 600,
    });
    expect(px.maxHeight).toBe("600px");
  });

  it("lets a bottom sheet use the full wrap width", () => {
    const s = modalShellSizeStyle({
      fullscreen: false,
      width: "100%",
      placement: "bottom",
    });
    expect(s.maxWidth).toBe("100%");
    expect(s.minWidth).toBe("0");
  });

  it("fullscreen still fills the viewport", () => {
    const s = modalShellSizeStyle({
      fullscreen: true,
      width: "520px",
      maxHeight: "80vh",
    });
    expect(s.width).toBe("100%");
    expect(s.maxWidth).toBe("100vw");
    expect(s.height).toBe("100%");
    expect(s.maxHeight).toBe("100vh");
  });
});

describe("resolveModalWidthCss", () => {
  it("maps size tokens and treats numbers as pixels", () => {
    expect(resolveModalWidthCss("xs")).toBe("400px");
    expect(resolveModalWidthCss("sm")).toBe("520px");
    expect(resolveModalWidthCss("md")).toBe("640px");
    expect(resolveModalWidthCss("lg")).toBe("800px");
    expect(resolveModalWidthCss("xl")).toBe("960px");
    expect(resolveModalWidthCss(480)).toBe("480px");
    expect(resolveModalWidthCss("70%")).toBe("70%");
  });
});

describe("modalShellSizeStyle height", () => {
  it("sets an explicit numeric or CSS height without dropping maxHeight", () => {
    const px = modalShellSizeStyle({
      fullscreen: false,
      width: "520px",
      height: 600,
    });
    expect(px.height).toBe("600px");
    expect(px.width).toBe("520px");
    expect(px.maxHeight).toBe("90vh");
    const css = modalShellSizeStyle({
      fullscreen: false,
      width: "520px",
      height: "70vh",
      maxHeight: "80vh",
    });
    expect(css.height).toBe("70vh");
    expect(css.maxHeight).toBe("80vh");
  });

  it("leaves height unset when not provided", () => {
    const s = modalShellSizeStyle({ fullscreen: false, width: "520px" });
    expect(s.height).toBeUndefined();
    expect(s.maxHeight).toBe("90vh");
  });
});

describe("resolveModalSlotHeight", () => {
  it("maps xs/sm/md/lg and treats numbers as pixels", () => {
    expect(resolveModalSlotHeight("xs")).toBe("40px");
    expect(resolveModalSlotHeight("sm")).toBe("48px");
    expect(resolveModalSlotHeight("md")).toBe("56px");
    expect(resolveModalSlotHeight("lg")).toBe("72px");
    expect(resolveModalSlotHeight(64)).toBe("64px");
    expect(resolveModalSlotHeight("3rem")).toBe("3rem");
  });

  it("treats the ms typo as sm and ignores empty values", () => {
    expect(resolveModalSlotHeight("ms")).toBe(MODAL_SLOT_HEIGHT_PRESETS.sm);
    expect(resolveModalSlotHeight(undefined)).toBeUndefined();
    expect(resolveModalSlotHeight("")).toBeUndefined();
  });
});

describe("DEFAULT_MODAL_IFRAME_SANDBOX", () => {
  it("allows same-origin admin use without leaving the frame unsandboxed", () => {
    const tokens = DEFAULT_MODAL_IFRAME_SANDBOX.split(/\s+/);
    expect(tokens.includes("allow-scripts")).toBe(true);
    expect(tokens.includes("allow-same-origin")).toBe(true);
    expect(tokens.includes("allow-forms")).toBe(true);
    expect(tokens.includes("allow-popups")).toBe(false);
    expect(tokens.includes("allow-popups-to-escape-sandbox")).toBe(false);
    expect(tokens.includes("allow-top-navigation")).toBe(false);
    expect(tokens.includes("allow-top-navigation-by-user-activation")).toBe(
      false,
    );
  });
});
