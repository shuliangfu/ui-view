/**
 * Pagination 纯逻辑：preset 解析、首页／末页可点状态。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  getPaginationState,
  PAGINATION_PRESET_FLAGS,
  resolvePaginationPreset,
} from "../../src/shared/navigation/pagination-utils.ts";

describe("resolvePaginationPreset", () => {
  it("缺省为 default：有页码与上下页，无第一页／最后一页／跳转", () => {
    const f = resolvePaginationPreset(undefined);
    expect(f).toEqual({
      showFirstLast: false,
      showPrevNext: true,
      showPageNumbers: true,
      showQuickJumper: false,
      showSimpleCurrent: false,
      showTotal: false,
    });
    expect(f).toEqual(resolvePaginationPreset("default"));
  });

  it("full：第一页／最后一页、页码、跳转，默认显示总条数", () => {
    const f = resolvePaginationPreset("full");
    expect(f.showFirstLast).toBe(true);
    expect(f.showPrevNext).toBe(true);
    expect(f.showPageNumbers).toBe(true);
    expect(f.showQuickJumper).toBe(true);
    expect(f.showSimpleCurrent).toBe(false);
    expect(f.showTotal).toBe(true);
    expect(PAGINATION_PRESET_FLAGS.full.showFirstLast).toBe(true);
  });

  it("simple：无页码／首页／末页／跳转，显示「第 n / m 页」", () => {
    const f = resolvePaginationPreset("simple");
    expect(f.showFirstLast).toBe(false);
    expect(f.showPrevNext).toBe(true);
    expect(f.showPageNumbers).toBe(false);
    expect(f.showQuickJumper).toBe(false);
    expect(f.showSimpleCurrent).toBe(true);
    expect(f.showTotal).toBe(false);
  });

  it("显式 show* 覆盖 preset 默认值", () => {
    const f = resolvePaginationPreset("full", {
      showFirstLast: false,
      showQuickJumper: false,
      showTotal: false,
    });
    expect(f.showFirstLast).toBe(false);
    expect(f.showQuickJumper).toBe(false);
    expect(f.showTotal).toBe(false);
    expect(f.showPageNumbers).toBe(true);
  });
});

describe("getPaginationState canFirst / canLast", () => {
  it("第一页时不可到首页／上一页，可到末页／下一页", () => {
    const s = getPaginationState(1, 10, 100);
    expect(s.safeCurrent).toBe(1);
    expect(s.totalPages).toBe(10);
    expect(s.canPrev).toBe(false);
    expect(s.canFirst).toBe(false);
    expect(s.canNext).toBe(true);
    expect(s.canLast).toBe(true);
  });

  it("最后一页时不可到末页／下一页，可到首页／上一页", () => {
    const s = getPaginationState(10, 10, 100);
    expect(s.safeCurrent).toBe(10);
    expect(s.canPrev).toBe(true);
    expect(s.canFirst).toBe(true);
    expect(s.canNext).toBe(false);
    expect(s.canLast).toBe(false);
  });
});
