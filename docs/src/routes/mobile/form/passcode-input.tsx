/**
 * PasscodeInput 文档页。路由: /mobile/form/passcode-input
 */

import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_PASSCODE_INPUT } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入" },
  { name: "value", type: "MaybeSignal<string>", default: "-", description: "受控值" },
  { name: "length", type: "number", default: "6", description: "位数" },
  { name: "mask", type: "boolean", default: "false", description: "掩码" },
  { name: "onFinish", type: "(v)=>void", default: "-", description: "填满回调" },
  {
    name: "messages",
    type: "Partial<PasscodeInputMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },

];

const importCode = `import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";

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
        <Title level={3}>size（xs / sm / md / lg）</Title>
        <MobileDocDemo>
          <div class="p-4 flex flex-col items-center gap-3">
            <PasscodeInput size="xs" length={4} />
            <PasscodeInput size="sm" length={4} />
            <PasscodeInput size="md" length={4} />
            <PasscodeInput size="lg" length={4} />
          </div>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`<PasscodeInput size="xs" length={4} />
<PasscodeInput size="sm" length={4} />
<PasscodeInput size="md" length={4} />
<PasscodeInput size="lg" length={4} />`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
        />
      </section>
      <DocsMessagesSection
        interfaceName="PasscodeInputMessages"
        defaultExportName="defaultPasscodeInputMessages"
        rows={MESSAGES_PASSCODE_INPUT}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
