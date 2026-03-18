/**
 * Carousel 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/carousel
 */

import { createSignal } from "@dreamer/view";
import { Carousel, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const CAROUSEL_API: ApiRow[] = [
  { name: "children", type: "unknown[]", default: "-", description: "轮播项" },
  {
    name: "current",
    type: "number",
    default: "-",
    description: "当前页（受控，从 0 开始）",
  },
  {
    name: "onChange",
    type: "(index: number) => void",
    default: "-",
    description: "切换回调",
  },
  {
    name: "autoplay",
    type: "boolean",
    default: "false",
    description: "是否自动播放",
  },
  {
    name: "autoplayInterval",
    type: "number",
    default: "5000",
    description: "自动播放间隔（ms）",
  },
  {
    name: "direction",
    type: "horizontal | vertical",
    default: "horizontal",
    description: "方向",
  },
  {
    name: "slidesToShow",
    type: "number",
    default: "1",
    description: "一屏显示张数",
  },
  {
    name: "infinite",
    type: "boolean",
    default: "true",
    description: "是否循环",
  },
  {
    name: "dots",
    type: "boolean",
    default: "-",
    description: "是否显示指示点",
  },
  {
    name: "arrows",
    type: "boolean",
    default: "-",
    description: "是否显示箭头",
  },
  {
    name: "dotPosition",
    type: "bottom | top | left | right",
    default: "-",
    description: "指示点位置",
  },
  { name: "class", type: "string", default: "-", description: "容器 class" },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Carousel } from "@dreamer/ui-view";

const [current, setCurrent] = createSignal(0);
const slides = [<div key="1">幻灯片 1</div>, <div key="2">幻灯片 2</div>];
<Carousel
  current={current()}
  onChange={setCurrent}
  dots
  arrows
>
  {slides}
</Carousel>`;

const exampleDotsArrows = `<Carousel
  current={current()}
  onChange={setCurrent}
  dots
  arrows
>
  {slides}
</Carousel>`;

const exampleAutoplay = `<Carousel
  current={current()}
  onChange={setCurrent}
  dots
  autoplay
  autoplayInterval={3000}
>
  {slides}
</Carousel>`;

export default function DataDisplayCarousel() {
  const [current, setCurrent] = createSignal(0);

  const slides = [
    <div
      key="1"
      class="h-48 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg"
    >
      幻灯片 1
    </div>,
    <div
      key="2"
      class="h-48 flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg"
    >
      幻灯片 2
    </div>,
    <div
      key="3"
      class="h-48 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg"
    >
      幻灯片 3
    </div>,
  ];

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Carousel 轮播图</Title>
        <Paragraph class="mt-2">
          轮播图：children、current、onChange、autoplay、autoplayInterval、direction、slidesToShow、infinite、dots、arrows、dotPosition。
          使用 Tailwind v4，支持 light/dark 主题。
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
          <Title level={3}>dots + arrows</Title>
          <div class="w-full">
            <Carousel current={current()} onChange={setCurrent} dots arrows>
              {slides}
            </Carousel>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleDotsArrows}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>autoplay</Title>
          <div class="w-full">
            <Carousel
              current={current()}
              onChange={setCurrent}
              dots
              autoplay
              autoplayInterval={3000}
            >
              {slides}
            </Carousel>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleAutoplay}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性。
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
              {CAROUSEL_API.map((row) => (
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
