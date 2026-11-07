/**
 * @fileoverview Modal constrainToViewport — clampModalTranslateToViewport 边界单测（无浏览器 DOM）
 */

import { describe, expect, it } from "@dreamer/test";
import { clampModalTranslateToViewport } from "../../src/desktop/feedback/Modal.tsx";

describe("clampModalTranslateToViewport", () => {
  const startPos = { x: 0, y: 0 };
  const startRect = { left: 100, top: 80, width: 400, height: 300 };
  const viewport = { width: 1000, height: 800 };

  it("keeps modal inside viewport when dragging far left/up", () => {
    const next = clampModalTranslateToViewport(
      { x: -500, y: -500 },
      startPos,
      startRect,
      viewport,
    );
    // left >= 0 → x = 0 - 100 = -100; top >= 0 → y = 0 - 80 = -80
    expect(next.x).toBe(-100);
    expect(next.y).toBe(-80);
  });

  it("keeps modal inside viewport when dragging far right/down", () => {
    const next = clampModalTranslateToViewport(
      { x: 2000, y: 2000 },
      startPos,
      startRect,
      viewport,
    );
    // maxLeft = 1000-400=600 → x = 0+(600-100)=500
    // maxTop = 800-300=500 → y = 0+(500-80)=420
    expect(next.x).toBe(500);
    expect(next.y).toBe(420);
  });

  it("passes through when already inside", () => {
    const next = clampModalTranslateToViewport(
      { x: 20, y: 30 },
      startPos,
      startRect,
      viewport,
    );
    expect(next.x).toBe(20);
    expect(next.y).toBe(30);
  });

  it("when modal larger than viewport, clamps to edge range", () => {
    const big = { left: -50, top: -40, width: 1200, height: 900 };
    const next = clampModalTranslateToViewport(
      { x: 100, y: 100 },
      startPos,
      big,
      viewport,
    );
    // minLeft = 1000-1200 = -200, maxLeft = 0
    // left = -50+100 = 50 → clamp to 0 → x = 0 - (-50) wait:
    // x = startPos.x + (left - big.left) = 0 + (0 - (-50)) = 50 if clamped to 0
    expect(next.x).toBe(50);
    // top = -40+100=60 → clamp to 0 → y = 0 - (-40) = 40
    expect(next.y).toBe(40);
  });
});
