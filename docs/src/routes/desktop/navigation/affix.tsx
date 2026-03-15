/** 路由: /navigation/affix */
import { Affix, Paragraph, Title } from "@dreamer/ui-view";

export default function NavigationAffix() {
  return (
    <div class="space-y-6">
      <Title level={1}>Affix</Title>
      <Paragraph>
        固钉：children、offsetTop、offsetBottom、class、affixClass。滚动时固定到视口顶部或底部，需在应用内调用 initAffix() 绑定滚动监听。
      </Paragraph>

      <Affix offsetTop={0} affixClass="shadow-md">
        <div class="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800 shadow">
          <span class="text-sm font-medium">
            此区域在滚动时可固定到顶部（需在应用内调用 initAffix()）
          </span>
        </div>
      </Affix>

      <Title level={2}>offsetBottom 固定到底部</Title>
      <div class="h-40 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 rounded">
        占位区域
      </div>
      <Affix offsetBottom={0} affixClass="shadow-md">
        <div class="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800">
          <span class="text-sm font-medium">可固定到底部（offsetBottom=0）</span>
        </div>
      </Affix>

      <div class="h-40 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 rounded">
        占位区域，用于产生滚动
      </div>
    </div>
  );
}
