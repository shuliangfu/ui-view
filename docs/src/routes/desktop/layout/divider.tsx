/** 路由: /layout/divider */
import { Divider, Paragraph, Title } from "@dreamer/ui-view";

export default function LayoutDivider() {
  return (
    <div class="space-y-6">
      <Title level={1}>Divider</Title>
      <Paragraph>分割线：水平/垂直，可选虚线、中间文案与对齐。</Paragraph>

      <div class="max-w-md">
        <p class="text-sm text-slate-600 dark:text-slate-400">上方</p>
        <Divider />
        <p class="text-sm text-slate-600 dark:text-slate-400">下方</p>
      </div>

      <div class="max-w-md">
        <Divider>中间文案</Divider>
      </div>

      <div class="max-w-md">
        <Divider orientation="left">左侧</Divider>
        <Divider orientation="right">右侧</Divider>
      </div>

      <div class="max-w-md">
        <Divider dashed />
      </div>

      <div class="flex gap-4 h-24 items-stretch">
        <span class="text-sm text-slate-500">左</span>
        <Divider type="vertical" />
        <span class="text-sm text-slate-500">中</span>
        <Divider type="vertical" dashed />
        <span class="text-sm text-slate-500">右</span>
      </div>
    </div>
  );
}
