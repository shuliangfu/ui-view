/** @jsxImportSource @dreamer/view */
/**
 * CodeBlock：maxHeight 限制代码区（含行号）高度，超出可滚动。
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import { CodeBlock } from "../../src/shared/data-display/CodeBlock.tsx";

const LONG_CODE = Array.from({ length: 40 }, (_, i) => `const line${i} = ${i};`)
  .join("\n");

describe("CodeBlock maxHeight", () => {
  it("把 maxHeight 写到含行号的代码区，数字用 px", async () => {
    const h = String(
      await renderToString(() => (
        <CodeBlock
          code={LONG_CODE}
          language="typescript"
          showLineNumbers
          maxHeight={384}
        />
      )),
    );
    expect(h).toContain("max-height:384px");
    expect(h).toContain("overflow-auto");
    expect(h).toContain("overflow-visible");
  });

  it("字符串 maxHeight 原样写入", async () => {
    const h = String(
      await renderToString(() => (
        <CodeBlock
          code={LONG_CODE}
          language="tsx"
          showLineNumbers
          maxHeight="24rem"
        />
      )),
    );
    expect(h).toContain("max-height:24rem");
  });
});
