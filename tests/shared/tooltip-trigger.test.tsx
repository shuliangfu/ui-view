/** @jsxImportSource @dreamer/view */
/**
 * Tooltip：首帧不展开；默认 hover，也可 click。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Tooltip } from "../../src/desktop/feedback/Tooltip.tsx";

describe("Tooltip trigger SSR", () => {
  it("默认 hover 首帧只渲染触发器，不输出提示", async () => {
    const h = String(
      await renderToString(() => (
        <Tooltip content="秘密提示">
          <span>悬停我</span>
        </Tooltip>
      )),
    );
    expect(h).toContain("悬停我");
    expect(h).not.toContain("秘密提示");
  });

  it("trigger=click 或 open=false 首帧同样不展开", async () => {
    const click = String(
      await renderToString(() => (
        <Tooltip trigger="click" content="点击后才看到">
          <button type="button">点击我</button>
        </Tooltip>
      )),
    );
    expect(click).toContain("点击我");
    expect(click).not.toContain("点击后才看到");
    const off = String(
      await renderToString(() => (
        <Tooltip open={false} content="不应出现">
          <span>触发器</span>
        </Tooltip>
      )),
    );
    expect(off).toContain("触发器");
    expect(off).not.toContain("不应出现");
  });
});
