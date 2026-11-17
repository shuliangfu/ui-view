/**
 * Dropdown 带箭头时，bottomLeft / bottomRight 展开方向须与无箭头时一致。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  computeDropdownFixedStyle,
  getDropdownArrowProps,
} from "../../src/desktop/navigation/Dropdown.tsx";

function triggerRect(left: number, width = 28, top = 8, height = 28): DOMRect {
  return new DOMRect(left, top, width, height);
}

function withViewport(width: number, fn: () => void): void {
  const w = globalThis as unknown as { window?: { innerWidth: number } };
  const prev = w.window;
  w.window = { innerWidth: width };
  try {
    fn();
  } finally {
    if (prev === undefined) {
      delete w.window;
    } else {
      w.window = prev;
    }
  }
}

describe("Dropdown placement with arrow", () => {
  it("bottomRight keeps the panel's right edge on the trigger when arrow is on", () => {
    withViewport(1280, () => {
      const tr = triggerRect(1200, 28);
      const withArrow = computeDropdownFixedStyle(tr, "bottomRight", true);
      const noArrow = computeDropdownFixedStyle(tr, "bottomRight", false);
      expect(withArrow.right).toEqual(noArrow.right);
      expect(withArrow.right).toEqual(`${1280 - tr.right}px`);
      expect(withArrow.left).toEqual("auto");
      const arrow = getDropdownArrowProps("bottomRight");
      expect(arrow.style.right).toEqual("12px");
      expect(arrow.style.left).toEqual("auto");
    });
  });

  it("bottomLeft keeps the panel's left edge on the trigger when arrow is on", () => {
    withViewport(1280, () => {
      const tr = triggerRect(16, 28);
      const withArrow = computeDropdownFixedStyle(tr, "bottomLeft", true);
      const noArrow = computeDropdownFixedStyle(tr, "bottomLeft", false);
      expect(withArrow.left).toEqual(noArrow.left);
      expect(withArrow.left).toEqual(`${tr.left}px`);
      expect(withArrow.right).toEqual("auto");
      const arrow = getDropdownArrowProps("bottomLeft");
      expect(arrow.style.left).toEqual("12px");
      expect(arrow.style.right).toEqual("auto");
    });
  });
});
