/** @jsxImportSource @dreamer/view */
/**
 * Icon 默认继承 currentColor，不再强制灰阶。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Icon } from "../../src/shared/basic/Icon.tsx";

describe("Icon currentColor", () => {
  it("uses text-current and does not force gray", async () => {
    const h = String(await renderToString(() => <Icon>★</Icon>));
    expect(h).toContain("text-current");
    expect(h).not.toContain("text-gray-700");
    expect(h).not.toContain("text-gray-300");
  });
});
