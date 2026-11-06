/**
 * ShareSheet 文档页。路由: /mobile/feedback/share-sheet
 */

import { createSignal } from "@dreamer/view";
import { MobilePortalHostScope } from "@dreamer/ui-view/mobile/portal";
import { ShareSheet } from "@dreamer/ui-view/mobile/feedback";
import { Button, Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "open", type: "ControlledOpenInput", default: "-", description: "是否打开" },
  { name: "options", type: "ShareSheetOption[]", default: "-", description: "分享选项" },
  { name: "title", type: "string | null", default: "-", description: "标题" },
  { name: "onClose", type: "() => void", default: "-", description: "关闭" },
  { name: "cancelText", type: "string | null", default: "取消", description: "取消文案" },
];

const importCode = `import { createSignal } from "@dreamer/view";

const open = createSignal(false);

<ShareSheet
  open={open}
  title="分享到"
  options={[
    { key: "wechat", label: "微信", onClick: () => {} },
    { key: "link", label: "复制链接", onClick: () => {} },
  ]}
  onClose={() => (open.value = false)}
/>`;


const exampleDemo = `const open = createSignal(false);
<Button onClick={() => (open.value = true)}>分享</Button>
<ShareSheet open={open} onClose={() => (open.value = false)} options={[/* … */]} />`;


export default function Page() {
  const open = createSignal(false);
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>ShareSheet</Title>
        <Paragraph>底部分享宫格；文档示例限制在机内 Portal Scope。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo class="flex min-h-[280px] flex-col p-4">
          <MobilePortalHostScope class="flex min-h-0 flex-1 flex-col">
            <Button type="button" onClick={() => (open.value = true)}>
              打开分享面板
            </Button>
            <ShareSheet
              open={open}
              title="分享到"
              options={[
                { key: "wx", label: "微信", icon: "微" },
                { key: "qq", label: "QQ", icon: "Q" },
                { key: "link", label: "链接", icon: "链" },
                { key: "more", label: "更多", icon: "…" },
              ]}
              onClose={() => (open.value = false)}
            />
          </MobilePortalHostScope>
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
