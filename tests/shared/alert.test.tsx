/** @jsxImportSource @dreamer/view */
/**
 * Alert：关闭钮为正方形（不随行高拉伸）；closable 时输出关闭按钮。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Alert } from "../../src/shared/feedback/Alert.tsx";

async function html(
  props: Partial<Parameters<typeof Alert>[0]> = {},
): Promise<string> {
  return String(
    await renderToString(() => <Alert message="可关闭的提示" {...props} />),
  );
}

describe("Alert", () => {
  it("closable 时渲染关闭钮，且为 self-center + size-6 的正方形", async () => {
    const h = await html({ closable: true });
    expect(h).toContain('role="alert"');
    expect(h).toContain("可关闭的提示");
    expect(h).toContain('aria-label="关闭"');
    expect(h).toContain("self-center");
    expect(h).toContain("size-6");
    expect(h).toContain("shrink-0");
    const btn = h.slice(
      h.indexOf("<button"),
      h.indexOf("</button>") + 9,
    );
    expect(btn).toContain("size-6");
    expect(btn).toContain("self-center");
  });

  it("带描述的横幅样式里，关闭钮仍是正方形类，不会只用 stretch 撑满行高", async () => {
    const h = await html({
      closable: true,
      banner: true,
      description: "未认证账号部分功能暂不可用。",
    });
    const btn = h.slice(
      h.indexOf("<button"),
      h.indexOf("</button>") + 9,
    );
    expect(btn).toContain("self-center");
    expect(btn).toContain("size-6");
    expect(btn).toContain("inline-flex");
  });

  it("默认不可关闭", async () => {
    const h = await html();
    expect(h).not.toContain('aria-label="关闭"');
  });
});
