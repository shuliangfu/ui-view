/**
 * CountDown 文档页。路由: /mobile/data-display/count-down
 */

import { CountDown } from "@dreamer/ui-view/mobile";
import { Paragraph, Title } from "@dreamer/ui-view/mobile/basic";
import { CodeBlock } from "@dreamer/ui-view/mobile/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { MobileDocDemo } from "../../../components/MobileDocDemo.tsx";

const API: DocsApiTableRow[] = [
  { name: "target", type: "MaybeSignal<number|Date>", default: "-", description: "结束时刻" },
  { name: "remaining", type: "MaybeSignal<number>", default: "-", description: "剩余毫秒" },
  { name: "onFinish", type: "() => void", default: "-", description: "结束回调" },
  { name: "render", type: "(parts)=>unknown", default: "-", description: "自定义展示" }
];

const importCode = `import { CountDown } from "@dreamer/ui-view/mobile";

<CountDown target={Date.now() + 3_661_000} />`;


const exampleDemo = `<CountDown target={Date.now() + 3_661_000} />`;


export default function Page() {
  return (
    <div class="space-y-8">
      <div>
        <Title level={1}>CountDown</Title>
        <Paragraph>目标时刻倒计时，可自定义渲染。</Paragraph>
      </div>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock code={importCode} language="tsx" />
      </section>
      <section class="space-y-3">
        <Title level={2}>示例</Title>
        <MobileDocDemo>
          <div class="p-4 text-center text-lg"><CountDown target={Date.now() + 3661000} /></div>
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
