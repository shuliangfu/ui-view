/** @jsxImportSource @dreamer/view */
/**
 * Button：link 变体与 block 宽度。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Button } from "../../src/shared/basic/Button.tsx";
import { Form } from "../../src/shared/form/Form.tsx";

describe("Button variant / block", () => {
  it("variant=link 写出 data-variant=link 且无实心底", async () => {
    const h = String(
      await renderToString(() => <Button variant="link">文字链</Button>),
    );
    expect(h).toContain('data-variant="link"');
    expect(h).toContain("文字链");
    expect(h).toContain("text-blue-600");
    expect(h).not.toContain("bg-blue-600");
  });

  it("block 时带 w-full", async () => {
    const h = String(
      await renderToString(() => <Button block>撑满</Button>),
    );
    expect(h).toContain("w-full");
    expect(h).toContain("撑满");
  });
});

describe("Button Form disabled context", () => {
  function disabledButtons(html: string): boolean[] {
    const tags = html.match(/<button\b[^>]*>/g);
    if (!tags) throw new Error("expected rendered buttons");
    return tags.map((tag) => /\sdisabled(?:=|\s|>)/.test(tag));
  }

  it("Form disabled propagates through a wrapper and explicit false does not escape it", async () => {
    const html = String(
      await renderToString(() => (
        <Form disabled>
          <div>
            <Button type="submit">默认</Button>
            <Button disabled={false}>false</Button>
          </div>
        </Form>
      )),
    );
    expect(disabledButtons(html)).toEqual([true, true]);
  });

  it("enabled Form keeps normal buttons active but respects explicit disabled and loading", async () => {
    const html = String(
      await renderToString(() => (
        <Form>
          <Button>可用</Button>
          <Button disabled>禁用</Button>
          <Button loading>加载中</Button>
        </Form>
      )),
    );
    expect(disabledButtons(html)).toEqual([false, true, true]);
  });

  it("disabled context does not leak to following siblings outside Form", async () => {
    const html = String(
      await renderToString(() => (
        <div>
          <Form disabled>
            <Button>表内</Button>
          </Form>
          <Button>表外</Button>
        </div>
      )),
    );
    expect(disabledButtons(html)).toEqual([true, false]);
  });
});
