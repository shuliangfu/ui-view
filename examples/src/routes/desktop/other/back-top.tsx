/** 路由: /other/back-top */
import { createSignal } from "@dreamer/view";
import { BackTop, Paragraph, Title } from "@dreamer/ui-view";

export default function OtherBackTop() {
  const [visible, setVisible] = createSignal(false);

  return (
    <div class="space-y-6">
      <Title level={1}>BackTop</Title>
      <Paragraph>
        长列表/长页时显示「回到顶部」按钮；超过 visibilityHeight
        后显示，点击平滑滚动到顶部。
      </Paragraph>

      <div class="h-[200vh] space-y-4">
        <p class="text-sm text-slate-500">
          向下滚动后，右下角会出现回到顶部按钮。
        </p>
        <div class="h-48 rounded-lg bg-slate-100 dark:bg-slate-700 p-4">
          占位内容 1
        </div>
        <div class="h-48 rounded-lg bg-slate-100 dark:bg-slate-700 p-4">
          占位内容 2
        </div>
        <div class="h-48 rounded-lg bg-slate-100 dark:bg-slate-700 p-4">
          占位内容 3
        </div>
      </div>

      <BackTop
        visibilityHeight={200}
        visible={visible()}
        onVisibilityChange={setVisible}
        right={24}
        bottom={24}
      />
    </div>
  );
}
