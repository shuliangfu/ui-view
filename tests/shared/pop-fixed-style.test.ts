/**
 * Shared auto-flip placement: opposite side when an edge would clip the overlay.
 */
import { describe, expect, it } from "@dreamer/test";
import {
  arrowAnchorOffset,
  computeArrowAnchorStyle,
  flipPlacementToFit,
  oppositePopPlacement,
  popBoxForPlacement,
  resolveAutoPopPlacement,
  resolvePointFixedPosition,
} from "../../src/shared/feedback/popFixedStyle.ts";

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

const viewport = { width: 1000, height: 800 };
const gap = 8;
const popup = { width: 220, height: 90 };

describe("oppositePopPlacement", () => {
  it("flips primary axis and keeps alignment suffix", () => {
    expect(oppositePopPlacement("top")).toBe("bottom");
    expect(oppositePopPlacement("topRight")).toBe("bottomRight");
    expect(oppositePopPlacement("leftTop")).toBe("rightTop");
    expect(oppositePopPlacement("rightBottom")).toBe("leftBottom");
  });
});

describe("resolveAutoPopPlacement", () => {
  it("keeps a written placement unchanged even when it would overflow", () => {
    const tr = rect(960, 400, 32, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "top",
      popup,
      viewport,
      gap,
    });
    expect(got).toBe("top");
  });

  it("returns autoPrefers when popup size is unknown", () => {
    const tr = rect(960, 400, 32, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup: { width: 0, height: 0 },
      viewport,
      gap,
      autoPrefers: "top",
    });
    expect(got).toBe("top");
  });

  it("flips a right-edge trigger from centered top to topRight (opens left)", () => {
    const tr = rect(960, 400, 32, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup,
      viewport,
      gap,
      autoPrefers: "top",
    });
    expect(got).toBe("topRight");
    const box = popBoxForPlacement(tr, got, popup, gap);
    expect(box.right).toBeLessThanOrEqual(viewport.width);
    expect(box.left).toBeLessThan(tr.left);
  });

  it("flips a left-edge trigger from centered top to topLeft (opens right)", () => {
    const tr = rect(8, 400, 32, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup,
      viewport,
      gap,
      autoPrefers: "top",
    });
    expect(got).toBe("topLeft");
    const box = popBoxForPlacement(tr, got, popup, gap);
    expect(box.left).toBeGreaterThanOrEqual(0);
  });

  it("flips from top to bottom when there is no room above", () => {
    const tr = rect(400, 10, 40, 20);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup,
      viewport,
      gap,
      autoPrefers: "top",
    });
    expect(got).toBe("bottom");
  });

  it("flips a top-right corner trigger to bottomRight", () => {
    const tr = rect(960, 10, 32, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup,
      viewport,
      gap,
      autoPrefers: "top",
    });
    expect(got).toBe("bottomRight");
  });

  it("keeps top when both axes have enough space", () => {
    const tr = rect(400, 400, 40, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup,
      viewport,
      gap,
      autoPrefers: "top",
    });
    expect(got).toBe("top");
  });

  it("flips left to right when the left edge would clip", () => {
    const tr = rect(20, 400, 32, 24);
    const got = resolveAutoPopPlacement({
      trigger: tr,
      preferred: "auto",
      popup,
      viewport,
      gap,
      autoPrefers: "left",
    });
    expect(got).toBe("right");
  });
});

describe("flipPlacementToFit", () => {
  it("picks the side with more room when neither fully fits", () => {
    const tall = { width: 100, height: 700 };
    const tr = rect(400, 80, 40, 24);
    // 80-8=72 above, 800-104-8=688 below — both short of 700, below has more
    const got = flipPlacementToFit("top", tr, tall, viewport, gap);
    expect(got).toBe("bottom");
  });
});

describe("resolvePointFixedPosition", () => {
  it("opens to the right and down when there is room", () => {
    const got = resolvePointFixedPosition(
      100,
      100,
      { width: 160, height: 120 },
      viewport,
    );
    expect(got).toEqual({ x: 100, y: 100, flippedX: false, flippedY: false });
  });

  it("flips left when the right edge would clip", () => {
    const got = resolvePointFixedPosition(
      920,
      200,
      { width: 160, height: 120 },
      viewport,
    );
    expect(got.flippedX).toBe(true);
    expect(got.flippedY).toBe(false);
    expect(got.x).toBe(920 - 160);
    expect(got.y).toBe(200);
  });

  it("flips up when the bottom edge would clip", () => {
    const got = resolvePointFixedPosition(
      100,
      740,
      { width: 160, height: 120 },
      viewport,
    );
    expect(got.flippedY).toBe(true);
    expect(got.y).toBe(740 - 120);
  });

  it("flips both ways in the bottom-right corner", () => {
    const got = resolvePointFixedPosition(
      920,
      740,
      { width: 160, height: 120 },
      viewport,
    );
    expect(got.flippedX).toBe(true);
    expect(got.flippedY).toBe(true);
    expect(got.x).toBe(920 - 160);
    expect(got.y).toBe(740 - 120);
  });

  it("does not flip when size is unknown", () => {
    const got = resolvePointFixedPosition(
      920,
      740,
      { width: 0, height: 0 },
      viewport,
    );
    expect(got).toEqual({ x: 920, y: 740, flippedX: false, flippedY: false });
  });
});

describe("arrowAnchorOffset", () => {
  it("on topRight (panel opens left) aligns to the trigger horizontal center, not the panel midline", () => {
    const trigger = rect(1169, 254, 90, 38);
    const panel = rect(1013, 154, 246, 92);
    const got = arrowAnchorOffset("topRight", trigger, panel);
    const triggerCenterX = 1169 + 90 / 2; // 1214
    expect(got.side).toBe("bottom");
    expect(got.axis).toBe("left");
    expect(got.offset).toBe(triggerCenterX - 1013);
    // not the panel midline (123)
    expect(got.offset).not.toBe(246 / 2);
  });

  it("on top (centered panel) lands at the panel midline, which is the trigger center", () => {
    const trigger = rect(400, 400, 40, 24);
    const panel = rect(310, 302, 220, 90);
    const got = arrowAnchorOffset("top", trigger, panel);
    expect(got.offset).toBe((400 + 20) - 310);
    expect(got.offset).toBe(110);
  });

  it("clamps to the inner safe inset when the raw center would pass the panel corner", () => {
    const trigger = rect(980, 400, 40, 24);
    const panel = rect(100, 302, 220, 90);
    const got = arrowAnchorOffset("topLeft", trigger, panel, 12);
    // raw = 980+20-100 = 900, far past panel.width-12=208
    expect(got.offset).toBe(220 - 12);
  });

  it("for a left placement aligns to the trigger vertical center", () => {
    const trigger = rect(400, 200, 32, 40);
    const panel = rect(172, 140, 220, 160);
    const got = arrowAnchorOffset("left", trigger, panel);
    expect(got.side).toBe("right");
    expect(got.axis).toBe("top");
    expect(got.offset).toBe((200 + 20) - 140);
  });

  it("computeArrowAnchorStyle writes left + bottom for topRight and keeps the tip on the trigger mid-x", () => {
    const trigger = rect(1169, 254, 90, 38);
    const panel = rect(1013, 154, 246, 92);
    const style = computeArrowAnchorStyle("topRight", trigger, panel);
    expect(style.left).toBe(`${1169 + 45 - 1013}px`);
    expect(style.bottom).toBe("0px");
    expect(style.top).toBe("auto");
    expect(style.transform).toBe("translate(-50%, 50%) rotate(45deg)");
  });
});
