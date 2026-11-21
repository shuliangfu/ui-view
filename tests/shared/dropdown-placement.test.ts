/**
 * Dropdown 带箭头时，bottomLeft / bottomRight 展开方向须与无箭头时一致。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  computeDropdownFixedStyle,
  getDropdownArrowProps,
  panelBoxFromTrigger,
} from "../../src/desktop/navigation/Dropdown.tsx";

function triggerRect(
  left: number,
  width = 28,
  top = 8,
  height = 28,
): DOMRect {
  const right = left + width;
  const bottom = top + height;
  return {
    x: left,
    y: top,
    width,
    height,
    top,
    left,
    right,
    bottom,
    toJSON: () => ({
      x: left,
      y: top,
      width,
      height,
      top,
      left,
      right,
      bottom,
    }),
  } as DOMRect;
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

  it("arrow points at the trigger mid-line when trigger and panel rects are given", () => {
    withViewport(1280, () => {
      const leftTrigger = triggerRect(16, 80);
      const leftPanel = { left: 16, top: 44, width: 200, height: 80 };
      const leftArrow = getDropdownArrowProps(
        "bottomLeft",
        leftTrigger,
        leftPanel,
      );
      // 16 + 80/2 - 16 = 40
      expect(leftArrow.style.left).toEqual("40px");
      expect(leftArrow.style.right).toEqual("auto");

      const rightTrigger = triggerRect(1200, 28);
      const rightPanel = {
        left: 1228 - 200,
        top: 44,
        width: 200,
        height: 80,
      };
      const rightArrow = getDropdownArrowProps(
        "bottomRight",
        rightTrigger,
        rightPanel,
      );
      // trigger center 1214 - panel.left 1028 = 186
      expect(rightArrow.style.left).toEqual("186px");
      expect(rightArrow.style.right).toEqual("auto");
    });
  });

  it("panelBoxFromTrigger uses size plus placement, not a stale viewport origin", () => {
    withViewport(1280, () => {
      const tr = triggerRect(16, 80, 8, 28);
      const stale = {
        width: 200,
        height: 80,
        left: 0,
        top: 0,
        right: 200,
        bottom: 80,
      };
      const box = panelBoxFromTrigger(tr, "bottomLeft", stale, true);
      expect(box.left).toEqual(16);
      expect(box.top).toEqual(8 + 28 + 8); // trigger bottom + arrow gap
      const arrow = getDropdownArrowProps("bottomLeft", tr, box);
      expect(arrow.style.left).toEqual("40px"); // 16+40-16
    });
  });
});
