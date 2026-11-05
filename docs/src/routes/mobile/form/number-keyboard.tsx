/**
 * NumberKeyboard 文档页。路由: /mobile/form/number-keyboard
 */

import { NumberKeyboard, PasscodeInput } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "onInput", type: "(key)=>void", default: "-", description: "按键" },
  { name: "onDelete", type: "()=>void", default: "-", description: "删除" },
  { name: "decimal", type: "boolean", default: "false", description: "小数点" }
];

const importCode = `import { NumberKeyboard } from "@dreamer/ui-view/mobile";\n\n<NumberKeyboard open={open} onInput={…} onClose={…} />`;

export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NumberKeyboard</Title>
        <Paragraph>底部数字键盘，可配合 PasscodeInput。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <Paragraph class="text-sm text-slate-500 p-3">打开键盘示例见引入代码；与 PasscodeInput 联用。</Paragraph>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
