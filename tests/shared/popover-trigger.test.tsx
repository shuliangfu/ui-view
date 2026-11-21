/** @jsxImportSource @dreamer/view */
/**
 * Popover：首帧不展开面板；trigger 默认为 hover，也可为 click。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Popover } from "../../src/desktop/feedback/Popover.tsx";

describe("Popover trigger SSR", () => {
  it("默认 hover 首帧只渲染触发器，不输出面板内容", async () => {
    const h = String(
      await renderToString(() => (
        <Popover title="标题" content="面板里的秘密说明">
          <span>悬停我</span>
        </Popover>
      )),
    );
    expect(h).toContain("悬停我");
    expect(h).not.toContain("面板里的秘密说明");
    expect(h).not.toContain("标题");
  });

  it("trigger=click 首帧同样不展开，只输出触发器", async () => {
    const h = String(
      await renderToString(() => (
        <Popover trigger="click" title="说明" content="点击后才看到">
          <button type="button">点击我</button>
        </Popover>
      )),
    );
    expect(h).toContain("点击我");
    expect(h).not.toContain("点击后才看到");
    expect(h).not.toContain(">说明<");
  });

  it("disabled 或 open=false 时首帧不展开", async () => {
    const off = String(
      await renderToString(() => (
        <Popover open={false} title="标题" content="不应出现">
          <span>触发器</span>
        </Popover>
      )),
    );
    expect(off).toContain("触发器");
    expect(off).not.toContain("不应出现");
    const dis = String(
      await renderToString(() => (
        <Popover disabled trigger="click" title="标题" content="不应出现">
          <span>触发器</span>
        </Popover>
      )),
    );
    expect(dis).toContain("触发器");
    expect(dis).not.toContain("不应出现");
  });
});
