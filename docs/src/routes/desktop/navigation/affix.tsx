/**
 * Affix 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/navigation/affix
 */

import { Affix, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const AFFIX_API: ApiRow[] = [
  { name: "children", type: "unknown", default: "-", description: "子节点" },
  {
    name: "offsetTop",
    type: "number",
    default: "-",
    description: "距离视口顶部的偏移（px）",
  },
  {
    name: "offsetBottom",
    type: "number",
    default: "-",
    description: "距离视口底部的偏移（px），与 offsetTop 二选一",
  },
  { name: "class", type: "string", default: "-", description: "包装器 class" },
  {
    name: "affixClass",
    type: "string",
    default: "-",
    description: "固定时的 class（如 shadow）",
  },
];

const importCode = `import { Affix } from "@dreamer/ui-view";

<Affix
  offsetTop={0}
  affixClass="shadow-md"
>
  <div class="...">固定到顶部的内容</div>
</Affix>`;

const exampleOffsetTop = `<Affix
  offsetTop={0}
  affixClass="shadow-md"
>
  <div class="...">此区域在滚动时可固定到顶部（需在应用内调用 initAffix()）</div>
</Affix>`;

const exampleOffsetBottom = `<Affix
  offsetBottom={0}
  affixClass="shadow-md"
>
  <div class="...">可固定到底部（offsetBottom=0）</div>
</Affix>`;

export default function NavigationAffix() {
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Affix 固钉</Title>
        <Paragraph class="mt-2">
          固钉：children、offsetTop、offsetBottom、class、affixClass。滚动时固定到视口顶部或底部，需在应用内调用
          initAffix() 绑定滚动监听。 使用 Tailwind v4，支持 light/dark 主题。
        </Paragraph>
      </section>

      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          title="代码示例"
          code={importCode}
          language="tsx"
          showLineNumbers
          wrapLongLines
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4">
          <Title level={3}>offsetTop 固定到顶部</Title>
          <Affix offsetTop={0} affixClass="shadow-md">
            <div class="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800 shadow">
              <span class="text-sm font-medium">
                此区域在滚动时可固定到顶部（需在应用内调用 initAffix()）
              </span>
            </div>
          </Affix>
          <CodeBlock
            title="代码示例"
            code={exampleOffsetTop}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>offsetBottom 固定到底部</Title>
          <div class="h-40 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 rounded">
            占位区域
          </div>
          <Affix offsetBottom={0} affixClass="shadow-md">
            <div class="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-800">
              <span class="text-sm font-medium">
                可固定到底部（offsetBottom=0）
              </span>
            </div>
          </Affix>
          <CodeBlock
            title="代码示例"
            code={exampleOffsetBottom}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="h-40 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 rounded">
          占位区域，用于产生滚动
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性。需在应用内调用 initAffix()
          绑定滚动监听后固钉才生效。
        </Paragraph>
        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
          <table class="w-full min-w-lg text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80">
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  属性
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  类型
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  默认值
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              {AFFIX_API.map((row) => (
                <tr
                  key={row.name}
                  class="border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <td class="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                    {row.name}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.type}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.default}
                  </td>
                  <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
