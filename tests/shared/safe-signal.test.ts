/**
 * @fileoverview safe-signal 轻量单元测（无浏览器；用 @dreamer/view createSignal）
 */

import { createSignal } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import {
  readSignalValue,
  safeIsSignal,
  writeSignalValue,
} from "../../src/shared/safe-signal.ts";

describe("safe-signal", () => {
  it("safeIsSignal 识别 createSignal 返回值，拒普通函数／对象", () => {
    const sig = createSignal(1);
    expect(safeIsSignal(sig)).toBe(true);
    expect(safeIsSignal(() => 1)).toBe(false);
    expect(safeIsSignal({ value: 1 })).toBe(false);
    expect(safeIsSignal(null)).toBe(false);
  });

  it("readSignalValue / writeSignalValue 以调用形式读写", () => {
    const sig = createSignal("a");
    expect(readSignalValue(sig)).toBe("a");
    writeSignalValue(sig, "b");
    expect(readSignalValue(sig)).toBe("b");
  });
});
