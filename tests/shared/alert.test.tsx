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

  it("closeConfirm 时渲染关闭钮，并由 Popconfirm 包裹", async () => {
    const h = await html({ closeConfirm: "关闭后将不再提示" });
    expect(h).toContain('aria-label="关闭"');
    expect(h).toContain("self-center");
    expect(h).toContain("size-6");
    expect(h).toContain("inline-flex");
  });

  it("closeKey 时默认渲染关闭钮", async () => {
    const h = await html({ closeKey: "docs-alert-close-confirm" });
    expect(h).toContain('role="alert"');
    expect(h).toContain('aria-label="关闭"');
  });

  it("单行时根节点 items-center，图标无 mt 偏移", async () => {
    const h = await html();
    const root = h.slice(h.indexOf("<div"), h.indexOf(">") + 1);
    expect(root).toContain('role="alert"');
    expect(root).toContain("items-center");
    expect(root).not.toContain("items-start");
    expect(h).not.toContain("mt-0.5");
  });

  it("有描述时根节点 items-start，图标与标题顶对齐", async () => {
    const h = await html({ description: "补充说明" });
    const root = h.slice(h.indexOf("<div"), h.indexOf(">") + 1);
    expect(root).toContain('role="alert"');
    expect(root).toContain("items-start");
    expect(root).not.toContain("items-center");
  });

  it("有描述时图标仍是 w-5 h-5，与单行相同", async () => {
    const withBody = await html({ description: "补充说明" });
    const icon = withBody.slice(
      withBody.indexOf("<span"),
      withBody.indexOf("</span>") + 7,
    );
    expect(icon).toContain("w-5");
    expect(icon).toContain("h-5");
    const single = await html();
    const singleIcon = single.slice(
      single.indexOf("<span"),
      single.indexOf("</span>") + 7,
    );
    expect(singleIcon).toContain("w-5");
    expect(singleIcon).toContain("h-5");
  });

  it("图标用 text-current，跟随根节点文字色，不被 Icon 默认灰覆盖", async () => {
    const h = await html({ type: "info" });
    const root = h.slice(h.indexOf("<div"), h.indexOf(">") + 1);
    expect(root).toContain("text-blue-800");
    const img = h.slice(
      h.indexOf('role="img"') - 80,
      h.indexOf('role="img"') + 200,
    );
    expect(img).toContain("text-current");
    expect(img).not.toContain("text-gray-700");
    expect(img).not.toContain("text-blue-600");
  });
});
