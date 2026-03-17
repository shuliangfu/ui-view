/**
 * Pagination 工具函数单元测试：getPaginationState。
 */

import { describe, expect, it } from "@dreamer/test";
import { getPaginationState } from "../../src/shared/navigation/pagination-utils.ts";

describe("pagination-utils", () => {
  describe("getPaginationState", () => {
    it("总页数：total 120、pageSize 10 => 12 页", () => {
      const s = getPaginationState(1, 10, 120);
      expect(s.totalPages).toBe(12);
      expect(s.safeCurrent).toBe(1);
      expect(s.canPrev).toBe(false);
      expect(s.canNext).toBe(true);
      expect(s.from).toBe(1);
      expect(s.to).toBe(10);
    });

    it("总页数：total 0 时至少 1 页", () => {
      const s = getPaginationState(1, 10, 0);
      expect(s.totalPages).toBe(1);
      expect(s.safeCurrent).toBe(1);
    });

    it("totalPagesProp 优先于 total", () => {
      const s = getPaginationState(1, 10, 100, 5);
      expect(s.totalPages).toBe(5);
      expect(s.from).toBe(1);
      expect(s.to).toBe(10);
    });

    it("safeCurrent 钳在 1..totalPages", () => {
      expect(getPaginationState(0, 10, 50).safeCurrent).toBe(1);
      expect(getPaginationState(-1, 10, 50).safeCurrent).toBe(1);
      expect(getPaginationState(100, 10, 50).safeCurrent).toBe(5);
    });

    it("from/to：第 2 页、每页 10、共 25 条 => 11-20", () => {
      const s = getPaginationState(2, 10, 25);
      expect(s.from).toBe(11);
      expect(s.to).toBe(20);
    });

    it("from/to：最后一页不足一页时 to 为 total", () => {
      const s = getPaginationState(3, 10, 25);
      expect(s.from).toBe(21);
      expect(s.to).toBe(25);
    });

    it("仅 totalPages 无 total 时 from 为 0、to 按 pageSize 算", () => {
      const s = getPaginationState(2, 10, undefined, 5);
      expect(s.from).toBe(0);
      expect(s.to).toBe(20);
    });

    it("总页数 ≤7 时 pages 为 [1..totalPages]", () => {
      const s = getPaginationState(1, 10, 70);
      expect(s.pages).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("总页数 >7、当前页靠前时出现省略号", () => {
      const s = getPaginationState(2, 10, 200);
      expect(s.totalPages).toBe(20);
      expect(s.pages).toContain(1);
      expect(s.pages).toContain(20);
      expect(s.pages.some((p) => p < 0)).toBe(true);
      expect(s.pages.filter((p) => p > 0)).toContain(2);
    });

    it("总页数 >7、当前页靠后时前后省略", () => {
      const s = getPaginationState(19, 10, 200);
      expect(s.pages[0]).toBe(1);
      expect(s.pages[s.pages.length - 1]).toBe(20);
      expect(s.pages.some((p) => p < 0)).toBe(true);
    });

    it("canPrev/canNext", () => {
      expect(getPaginationState(1, 10, 50).canPrev).toBe(false);
      expect(getPaginationState(1, 10, 50).canNext).toBe(true);
      expect(getPaginationState(5, 10, 50).canPrev).toBe(true);
      expect(getPaginationState(5, 10, 50).canNext).toBe(false);
    });
  });
});
