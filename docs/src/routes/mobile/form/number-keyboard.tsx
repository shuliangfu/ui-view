/**
 * NumberKeyboard 文档页。路由: /mobile/form/number-keyboard
 */

import { createSignal } from "@dreamer/view";
import { MobilePortalHostScope } from "@dreamer/ui-view/mobile/portal";
import { NumberKeyboard } from "@dreamer/ui-view/mobile/form/number-keyboard";
import { PasscodeInput } from "@dreamer/ui-view/mobile/form/passcode-input";
import { Button, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_NUMBER_KEYBOARD } from "../../../data/component-messages-rows.ts";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "尺寸：xs、sm、md、lg；也可由外层 Form 的 size 注入" },
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "onInput", type: "(key: string) => void", default: "-", description: "按键输入" },
  { name: "onDelete", type: "() => void", default: "-", description: "删除" },
  { name: "onConfirm", type: "() => void", default: "-", description: "确认" },
  { name: "decimal", type: "boolean", default: "false", description: "是否显示小数点" },
  { name: "onClose", type: "() => void", default: "-", description: "关闭" },
  {
    name: "messages",
    type: "Partial<NumberKeyboardMessages>",
    default: "-",
    description: "本地化文案；字段见上文「文案（messages）」表，勿将键摊入本表",
  },

];

const importCode = `import { createSignal } from "@dreamer/view";
import { NumberKeyboard } from "@dreamer/ui-view/mobile/form/number-keyboard";

const open = createSignal(false);

<NumberKeyboard
  open={open}
  decimal
  onInput={(key) => console.log("input", key)}
  onDelete={() => console.log("delete")}
  onClose={() => (open.value = false)}
/>`;


const exampleDemo = `const open = createSignal(false);
const value = createSignal("");
<NumberKeyboard open={open} value={value} onClose={() => (open.value = false)} />`;


export default function Page() {
  const open = createSignal(false);
  const digits = createSignal("");
  const sizeOpen = createSignal(false);
  const kbSize = createSignal<"xs" | "sm" | "md" | "lg">("md");
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
        <CodeBlock title="代码示例" code={exampleDemo} language="tsx" showLineNumbers copyable wrapLongLines />
        <Title level={3}>size（xs / sm / md / lg）</Title>
        <MobileDocDemo class="flex min-h-[360px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col gap-3">
            <div class="flex flex-wrap justify-center gap-2">
              {(["xs", "sm", "md", "lg"] as const).map((s) => (
                <Button
                  type="button"
                  onClick={() => {
                    kbSize.value = s;
                    sizeOpen.value = true;
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
            {() => (
              <NumberKeyboard
                size={kbSize.value}
                open={sizeOpen}
                onClose={() => (sizeOpen.value = false)}
              />
            )}
          </MobilePortalHostScope>
        </MobileDocDemo>
        <CodeBlock
          title="代码示例"
          code={`<NumberKeyboard size="xs" open={open} />
<NumberKeyboard size="sm" open={open} />
<NumberKeyboard size="md" open={open} />
<NumberKeyboard size="lg" open={open} />`}
          language="tsx"
          showLineNumbers
          copyable
          wrapLongLines
        />
      </section>
      <DocsMessagesSection
        interfaceName="NumberKeyboardMessages"
        defaultExportName="defaultNumberKeyboardMessages"
        rows={MESSAGES_NUMBER_KEYBOARD}
      />

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
