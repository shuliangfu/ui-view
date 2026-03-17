/**
 * 共享类型与常量单元测试：SizeVariant、ColorVariant 等运行时可用部分。
 * 纯类型无运行时，此处仅对可导出的常量或类型守卫（若有）做测试。
 */

import { describe, expect, it } from "@dreamer/test";
import type { ColorVariant, SizeVariant } from "../../src/shared/types.ts";

/** 合法的 SizeVariant 集合 */
const SIZE_VARIANTS: SizeVariant[] = ["xs", "sm", "md", "lg"];

/** 合法的 ColorVariant 集合 */
const COLOR_VARIANTS: ColorVariant[] = [
  "default",
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
  "ghost",
];

describe("types", () => {
  it("SizeVariant 数组长度为 4", () => {
    expect(SIZE_VARIANTS.length).toBe(4);
  });

  it("SizeVariant 包含 xs sm md lg", () => {
    expect(SIZE_VARIANTS).toContain("xs");
    expect(SIZE_VARIANTS).toContain("sm");
    expect(SIZE_VARIANTS).toContain("md");
    expect(SIZE_VARIANTS).toContain("lg");
  });

  it("ColorVariant 数组长度为 7", () => {
    expect(COLOR_VARIANTS.length).toBe(7);
  });

  it("ColorVariant 包含 primary、danger、ghost", () => {
    expect(COLOR_VARIANTS).toContain("primary");
    expect(COLOR_VARIANTS).toContain("danger");
    expect(COLOR_VARIANTS).toContain("ghost");
  });
});
