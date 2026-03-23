/**
 * BottomSheet 文档与示例。路由: /mobile/feedback/bottom-sheet
 */

import { BottomSheet } from "@dreamer/ui-view/mobile";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function MobileBottomSheetDoc() {
  const open = createSignal(false);

  return () => (
    <div class="w-full max-w-lg space-y-8">
      <div>
        <Title level={1} class="text-2xl sm:text-3xl">
          BottomSheet
        </Title>
        <Paragraph class="mt-2 text-slate-600 dark:text-slate-400">
          自底部滑出的半屏/全屏面板，支持标题、遮罩关闭、高度模式与{" "}
          <code class="text-sm">destroyOnClose</code>。
        </Paragraph>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-900 min-h-[200px]">
        <Button type="button" onClick={() => (open.value = true)}>
          打开 BottomSheet
        </Button>
        <BottomSheet
          open={open.value}
          onClose={() => (open.value = false)}
          title="示例标题"
          height="half"
        >
          <Paragraph>面板内容区域，可放表单或列表。</Paragraph>
        </BottomSheet>
      </div>

      <CodeBlock
        language="tsx"
        copyable
        code={`import { BottomSheet } from "@dreamer/ui-view/mobile";
import { createSignal } from "@dreamer/view";

const open = createSignal(false);
// 在渲染 getter 内使用 open.value 绑定受控开关`}
      />
    </div>
  );
}
