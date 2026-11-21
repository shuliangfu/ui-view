/** @jsxImportSource @dreamer/view */
/**
 * MarkdownEditor tab-bar / focus line stays a 1px border, not a stacked
 * 2px ring plus toolbar divider.
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { MarkdownEditor } from "../../src/shared/form/MarkdownEditor.tsx";

function textareaClass(html: string): string {
  const match = html.match(/<textarea\b[^>]*\sclass="([^"]*)"/);
  if (match == null) throw new Error("textarea class not found");
  return match[1];
}

function toolbarClass(html: string): string {
  const match = html.match(/role="toolbar"[^>]*\sclass="([^"]*)"/) ??
    html.match(/class="([^"]*)"[^>]*role="toolbar"/);
  if (match == null) throw new Error("toolbar class not found");
  return match[1];
}

function shellClass(html: string): string {
  const match =
    html.match(/<div\b[^>]*\sclass="([^"]*group\/md-editor[^"]*)"/) ??
      html.match(
        /<div\b[^>]*\sclass="([^"]*has-\[textarea:focus\]:border-blue-500[^"]*)"/,
      );
  if (match == null) throw new Error("shell class not found");
  return match[1];
}

describe("MarkdownEditor focus / tab line", () => {
  it("tabs and autoFocus use a 1px tab divider without a stacked focus ring", async () => {
    const html = String(
      await renderToString(() => <MarkdownEditor autoFocus preview="tabs" />),
    );
    const ta = textareaClass(html);
    const bar = toolbarClass(html);
    const shell = shellClass(html);

    expect(ta).toContain("focus:ring-0");
    expect(ta).toContain("border-t-0");
    expect(ta).not.toContain("focus:ring-2");
    expect(bar).toContain("border-b");
    expect(bar).toContain(
      "group-has-[textarea:focus]/md-editor:border-blue-500",
    );
    expect(shell).toContain("has-[textarea:focus]:border-blue-500");
    expect(shell).not.toContain("focus:ring-2");
    expect(shell).not.toContain("ring-2");
  });

  it("preview=off without a toolbar keeps the inner field focus ring", async () => {
    const html = String(
      await renderToString(() => <MarkdownEditor preview="off" />),
    );
    const ta = textareaClass(html);
    expect(ta).toContain("focus:ring-2");
    expect(ta).not.toContain("focus:ring-0");
    expect(html).not.toContain('role="toolbar"');
  });
});
