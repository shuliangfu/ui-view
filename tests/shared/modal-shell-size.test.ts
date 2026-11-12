/**
 * Modal shell width — cap to the viewport so fixed-width forms cannot overflow.
 */
import { describe, expect, it } from "@dreamer/test";
import {
  MODAL_VIEWPORT_MAX_WIDTH,
  modalShellSizeStyle,
} from "../../src/desktop/feedback/Modal.tsx";

describe("modalShellSizeStyle", () => {
  it("caps a preset width to the viewport and allows shrinking", () => {
    const s = modalShellSizeStyle({ fullscreen: false, width: "520px" });
    expect(s.width).toBe("520px");
    expect(s.maxWidth).toBe(MODAL_VIEWPORT_MAX_WIDTH);
    expect(s.minWidth).toBe("0");
    expect(s.boxSizing).toBe("border-box");
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
    const s = modalShellSizeStyle({ fullscreen: true, width: "520px" });
    expect(s.width).toBe("100%");
    expect(s.maxWidth).toBe("100vw");
    expect(s.height).toBe("100%");
  });
});
