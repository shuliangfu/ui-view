/** @jsxImportSource @dreamer/view */
/**
 * @fileoverview Form 使用 method="dialog"，避免原生提交整页刷新。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { Form } from "../../src/shared/form/Form.tsx";

describe("Form ajax submit", () => {
  it("SSR 输出 method=dialog，原生提交不会导航离开当前页", async () => {
    const h = String(
      await renderToString(() => (
        <Form onFinish={() => {}}>
          <button type="submit">ok</button>
        </Form>
      )),
    );
    expect(h).toContain('method="dialog"');
    expect(h).toContain('action="#"');
  });
});
