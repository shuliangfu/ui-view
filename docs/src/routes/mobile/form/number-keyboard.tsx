/**
 * NumberKeyboard 文档页。路由: /mobile/form/number-keyboard
 */

import { createSignal } from "@dreamer/view";
import {
  MobilePortalHostScope,
  NumberKeyboard,
  PasscodeInput,
} from "@dreamer/ui-view/mobile";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "onInput", type: "(key: string) => void", default: "-", description: "按键输入" },
  { name: "onDelete", type: "() => void", default: "-", description: "删除" },
  { name: "onConfirm", type: "() => void", default: "-", description: "确认" },
  { name: "decimal", type: "boolean", default: "false", description: "是否显示小数点" },
  { name: "onClose", type: "() => void", default: "-", description: "关闭" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { NumberKeyboard } from "@dreamer/ui-view/mobile";

const open = createSignal(false);

<NumberKeyboard
  open={open}
  decimal
  onInput={(key) => console.log("input", key)}
  onDelete={() => console.log("delete")}
  onClose={() => (open.value = false)}
/>`;

export default function Page() {
  const open = createSignal(false);
  const digits = createSignal("");
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>NumberKeyboard</Title>
        <Paragraph>底部数字键盘，可配合 PasscodeInput。示例限制在机内 Portal Scope。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo class="flex min-h-[360px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col gap-3">
            <div class="flex justify-center">
              <PasscodeInput
                length={6}
                value={digits}
                onChange={(v: string) => {
                  digits.value = v;
                }}
              />
            </div>
            <Button type="button" onClick={() => (open.value = true)}>
              打开数字键盘
            </Button>
            <NumberKeyboard
              open={open}
              onInput={(k: string) => {
                if (digits.value.length >= 6) return;
                digits.value = digits.value + k;
              }}
              onDelete={() => {
                digits.value = digits.value.slice(0, -1);
              }}
              onClose={() => (open.value = false)}
            />
          </MobilePortalHostScope>
        </MobileDocDemo>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
