/** 路由: /navigation/affix */
import { Affix, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationAffix() {
  return (
    <div class="space-y-6">
      <Title level={1}>Affix</Title>
      <Paragraph>
        固钉：滚动时固定在视口顶部或底部；offsetTop/offsetBottom。需在客户端调用
        initAffix() 绑定滚动监听。
      </Paragraph>

      <Affix offsetTop={0} affixClass="shadow-md">
        <div class="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800 shadow">
          <span class="text-sm font-medium">
            此区域在滚动时可固定到顶部（需在应用内调用 initAffix()）
          </span>
        </div>
      </Affix>

      <div class="h-40 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 rounded">
        占位区域，用于产生滚动
      </div>
    </div>
  );
}
