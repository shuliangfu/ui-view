/** 路由: /data-display/code-block */
import { createSignal } from "@dreamer/view";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

const sampleJS = `function hello(name) {
  console.log("Hello, " + name);
}
hello("World");
`;

const sampleJSON = `{
  "name": "@dreamer/ui-view",
  "version": "0.1.0"
}
`;

const sampleTS = `interface CodeBlockProps {
  code: string;
  language?: CodeBlockLanguage;
  showLineNumbers?: boolean;
}
`;

export default function DataDisplayCodeBlock() {
  const [copied, setCopied] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>CodeBlock</Title>
      <Paragraph>
        代码块：code、language、showLineNumbers、lineNumberStart、maxHeight、title、copyable、showWindowDots、onCopy、wrapLongLines、preClass、codeClass。
      </Paragraph>

      <div class="space-y-4">
        <CodeBlock
          code={sampleJS}
          language="javascript"
          title="example.js"
          copyable
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        />
        {copied() && <p class="text-sm text-green-600">已复制到剪贴板</p>}

        <CodeBlock
          code={sampleJSON}
          language="json"
          showLineNumbers
          lineNumberStart={1}
          maxHeight="12rem"
        />

        <CodeBlock
          code={sampleTS}
          language="typescript"
          title="CodeBlock.tsx"
          showLineNumbers
          copyable={false}
        />

        <CodeBlock
          code="echo 'no highlight'"
          language="plaintext"
          title="plaintext"
        />
      </div>
    </div>
  );
}
