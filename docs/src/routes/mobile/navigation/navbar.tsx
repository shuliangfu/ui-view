/**
 * NavBar 文档与示例。路由: /mobile/navigation/navbar
 */

import { NavBar } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

export default function MobileNavBarDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <div>
        <Title level={1} class="text-2xl sm:text-3xl">
          NavBar
        </Title>
        <Paragraph class="mt-2 text-slate-600 dark:text-slate-400">
          移动端顶栏：标题、左侧返回、右侧操作；支持{" "}
          <code class="text-sm">fixed</code> 与占位等。
        </Paragraph>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900">
        <NavBar
          title="页面标题"
          leftText="返回"
          leftArrow
          rightText="操作"
          onClickLeft={() => {}}
          onClickRight={() => {}}
          border
        />
        <div class="p-4 text-sm text-slate-500">下方为页面内容区示意</div>
      </div>

      <CodeBlock
        language="tsx"
        copyable
        code={`import { NavBar } from "@dreamer/ui-view/mobile";

<NavBar title="标题" leftArrow leftText="返回" onClickLeft={() => {}} />`}
      />
    </div>
  );
}
