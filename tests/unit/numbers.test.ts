/**
 * 数字工具单元测试：clamp、stepSnap。
 */

import { describe, expect, it } from "@dreamer/test";
import { clamp, stepSnap } from "../../src/shared/utils/numbers.ts";

describe("numbers", () => {
  describe("clamp", () => {
    it("在范围内则返回原值", () => {
      expect(clamp(0, 100, 50)).toBe(50);
    });
    it("小于 min 则返回 min", () => {
      expect(clamp(0, 100, -1)).toBe(0);
      expect(clamp(10, 20, 5)).toBe(10);
    });
    it("大于 max 则返回 max", () => {
      expect(clamp(0, 100, 101)).toBe(100);
      expect(clamp(10, 20, 25)).toBe(20);
    });
    it("min 等于 max 时恒为该值", () => {
      expect(clamp(5, 5, 3)).toBe(5);
      expect(clamp(5, 5, 5)).toBe(5);
    });
  });

  describe("stepSnap", () => {
    it("从 min 起按 step 对齐", () => {
      expect(stepSnap(0, 10, 12)).toBe(10);
      expect(stepSnap(0, 10, 15)).toBe(20);
      expect(stepSnap(0, 10, 10)).toBe(10);
    });
    it("step <= 0 时返回原 value", () => {
      expect(stepSnap(0, 0, 7)).toBe(7);
      expect(stepSnap(0, -1, 7)).toBe(7);
    });
    it("min 非 0 时正确对齐", () => {
      expect(stepSnap(5, 2, 8)).toBe(9);
      expect(stepSnap(1, 3, 4)).toBe(4);
    });
  });
});
