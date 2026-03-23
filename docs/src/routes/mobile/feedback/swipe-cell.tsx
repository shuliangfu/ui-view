/**
 * SwipeCell 文档与示例。路由: /mobile/feedback/swipe-cell
 */

import { SwipeCell } from "@dreamer/ui-view/mobile";
import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

export default function MobileSwipeCellDoc() {
  return (
    <div class="w-full max-w-lg space-y-8">
      <div>
        <Title level={1} class="text-2xl sm:text-3xl">
          SwipeCell
        </Title>
        <Paragraph class="mt-2 text-slate-600 dark:text-slate-400">
          列表行左右滑动露出操作按钮，支持删除/更多等配置。
        </Paragraph>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-800/50">
        <SwipeCell
          rightActions={[
            { text: "删除", style: "danger", onClick: () => {} },
            { text: "更多", style: "default", onClick: () => {} },
          ]}
        >
          <div class="px-4 py-3 text-slate-800 dark:text-slate-100">
            向左滑动本条查看操作
          </div>
        </SwipeCell>
      </div>

      <CodeBlock
        language="tsx"
        copyable
        code={`import { SwipeCell } from "@dreamer/ui-view/mobile";

<SwipeCell
  rightActions={[{ text: "删除", style: "danger", onClick: () => {} }]}
>
  {children}
</SwipeCell>`}
      />
    </div>
  );
}
