/**
 * ActionSheet 文档与示例。路由: /mobile/feedback/action-sheet
 */

import { ActionSheet } from "@dreamer/ui-view/mobile";
import { Button, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

export default function MobileActionSheetDoc() {
  const open = createSignal(false);

  const actions = [
    { label: "分享", onClick: () => {} },
    { label: "删除", danger: true, onClick: () => {} },
  ];

  return () => (
    <div class="w-full max-w-lg space-y-8">
      <div>
        <Title level={1} class="text-2xl sm:text-3xl">
          ActionSheet
        </Title>
        <Paragraph class="mt-2 text-slate-600 dark:text-slate-400">
          底部操作列表，常用于 iOS 风格菜单；支持取消行、危险样式与图标位。
        </Paragraph>
      </div>

      <div class="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-900">
        <Button type="button" onClick={() => (open.value = true)}>
          打开 ActionSheet
        </Button>
        <ActionSheet
          open={open.value}
          onClose={() => (open.value = false)}
          title="请选择操作"
          actions={actions}
          cancelText="取消"
        />
      </div>

      <CodeBlock
        language="tsx"
        copyable
        code={`import { ActionSheet } from "@dreamer/ui-view/mobile";

<ActionSheet
  open={open}
  onClose={...}
  actions={[{ label: "项", onClick: () => {} }]}
  cancelText="取消"
/>`}
      />
    </div>
  );
}
