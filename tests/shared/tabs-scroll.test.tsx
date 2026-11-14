/** @jsxImportSource @dreamer/view */
/**
 * Tabs：激活项被裁切时计算 tablist 滚动量；SSR 仍写出稳定的标签栏。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { createSignal } from "@dreamer/view";
import {
  tabListScrollDelta,
  Tabs,
} from "../../src/shared/layout/Tabs.tsx";

describe("tabListScrollDelta", () => {
  it("右侧被裁切时返回正位移，已完全可见则为 0", () => {
    expect(tabListScrollDelta(
      { left: 0, right: 280 },
      { left: 300, right: 420 },
    )).toBe(140);
    expect(tabListScrollDelta(
      { left: 0, right: 280 },
      { left: 100, right: 200 },
    )).toBe(0);
  });

  it("左侧被裁切时返回负位移", () => {
    expect(tabListScrollDelta(
      { left: 40, right: 280 },
      { left: 20, right: 80 },
    )).toBe(-20);
  });
});

describe("Tabs SSR", () => {
  it("写出稳定的 tablist 与各 data-tab-key", async () => {
    const activeKey = createSignal("profile");
    const html = String(
      await renderToString(() => (
        <Tabs
          hidePanel
          activeKey={activeKey}
          items={[
            { key: "profile", label: "资料", children: null },
            { key: "logins", label: "登录记录", children: null },
          ]}
        />
      )),
    );
    expect(html).toContain("role=\"tablist\"");
    expect(html).toContain("data-tab-key=\"profile\"");
    expect(html).toContain("data-tab-key=\"logins\"");
    expect(html).toContain("资料");
    expect(html).toContain("登录记录");
  });
});
