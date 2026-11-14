import { describe, expect, it } from "@dreamer/test";
import { resolveStepsDirection } from "../../src/shared/navigation/Steps.tsx";

describe("Steps 按容器宽度收敛方向", () => {
  it("显式 vertical 始终垂直", () => {
    expect(resolveStepsDirection(undefined, "vertical")).toBe("vertical");
    expect(resolveStepsDirection(1440, "vertical")).toBe("vertical");
    expect(resolveStepsDirection(390, "vertical")).toBe("vertical");
  });

  it("水平在宽度未知（SSR）时保持水平，移动端改为垂直", () => {
    expect(resolveStepsDirection(undefined, "horizontal")).toBe("horizontal");
    expect(resolveStepsDirection(Number.NaN, "horizontal")).toBe("horizontal");
    expect(resolveStepsDirection(640, "horizontal")).toBe("horizontal");
    expect(resolveStepsDirection(639.98, "horizontal")).toBe("vertical");
    expect(resolveStepsDirection(390, "horizontal")).toBe("vertical");
    expect(resolveStepsDirection(1280)).toBe("horizontal");
  });
});
