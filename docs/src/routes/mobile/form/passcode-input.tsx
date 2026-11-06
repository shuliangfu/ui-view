/**
 * PasscodeInput 文档页。路由: /mobile/form/passcode-input
 */

import { PasscodeInput } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "value", type: "MaybeSignal<string>", default: "-", description: "受控值" },
  { name: "length", type: "number", default: "6", description: "位数" },
  { name: "mask", type: "boolean", default: "false", description: "掩码" },
  { name: "onFinish", type: "(v)=>void", default: "-", description: "填满回调" }
];

const importCode = `import { PasscodeInput } from "@dreamer/ui-view/mobile";

<PasscodeInput
  length={6}
  mask
  onChange={(v) => console.log("change", v)}
  onFinish={(v) => console.log("finish", v)}
/>`;


const exampleDemo = `<PasscodeInput length={6} />`;


export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>PasscodeInput</Title>
        <Paragraph>等宽验证码／密码格输入。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="p-4 flex justify-center"><PasscodeInput length={6} /></div>
        </MobileDocDemo>
        <CodeBlock title="代码示例" code={exampleDemo} language="tsx" showLineNumbers copyable wrapLongLines />
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
