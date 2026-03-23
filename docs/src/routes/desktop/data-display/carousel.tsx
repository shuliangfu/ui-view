/**
 * Carousel 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/carousel
 */

import { Carousel, CodeBlock, Paragraph, Title } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const CAROUSEL_API: ApiRow[] = [
  {
    name: "images",
    type: "string[]",
    default: "-",
    description: "图片地址列表，传此项时内部渲染 img，无需传 children",
  },
  {
    name: "children",
    type: "unknown[]",
    default: "-",
    description: "轮播项（不传 images 时使用）",
  },
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
  {
    name: "height",
    type: "string",
    default: "横向 h-48，纵向 h-64",
    description: "容器高度，如 200px、16rem、50%；也可用 class 覆盖",
  },
  {
    name: "contentFit",
    type: "contain | cover | fill",
    default: "contain",
    description:
      "单项内图片显示方式：contain 完整显示不裁切，cover 铺满裁切，fill 铺满可拉伸",
  },
  {
    name: "class",
    type: "string",
    default: "-",
    description: "容器 class（可覆盖默认高度，如 h-64）",
  },
  {
    name: "lazySlides",
    type: "boolean",
    default: "false",
    description:
      "是否按需加载图片（仅当前及相邻 slide 加载大图，其余占位以降低内存；默认 false 保证全部显示）",
  },
];

/**
 * 文档示例图片：使用 placehold.co 直接返回 200 图片（无重定向）。
 * 尺寸适中以控制解码内存（约 800×320 单张约 1MB 解码，避免多张叠加到 1G+）。
 */
const DEMO_IMAGE_WIDTH = 800;
const DEMO_IMAGE_HEIGHT = 320;
const DEMO_CAROUSEL_HEIGHT = "20rem";

/** 文档示例使用的网络图片 URL 列表（placehold.co 无重定向，直接返回图片） */
const DEMO_IMAGES = [
  `https://placehold.co/${DEMO_IMAGE_WIDTH}x${DEMO_IMAGE_HEIGHT}/1e3a5f/fff?text=1`,
  `https://placehold.co/${DEMO_IMAGE_WIDTH}x${DEMO_IMAGE_HEIGHT}/2d5016/fff?text=2`,
  `https://placehold.co/${DEMO_IMAGE_WIDTH}x${DEMO_IMAGE_HEIGHT}/4a1c4a/fff?text=3`,
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Carousel } from "@dreamer/ui-view";

const current = createSignal(0);
const images = [
  "https://placehold.co/800x320/1e3a5f/fff?text=1",
  "https://placehold.co/800x320/2d5016/fff?text=2",
];
<Carousel
  current={current.value}
  onChange={(i) => current.value = i}
  images={images}
  height="20rem"
  dots
  arrows
/>`;

const exampleDotsArrows = `<Carousel
  current={current.value}
  onChange={(i) => current.value = i}
  images={images}
  height="20rem"
  dots
  arrows
/>`;

const exampleAutoplay = `<Carousel
  current={current.value}
  onChange={(i) => current.value = i}
  height="20rem"
  dots
  autoplay
  autoplayInterval={3000}
>
  {slides}
</Carousel>`;

export default function DataDisplayCarousel() {
  const current = createSignal(0);
  /** autoplay 示例用独立 current，避免与 dots+arrows 共用导致双份 patch、闪烁与乱跳 */
  const currentAutoplay = createSignal(0);

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Carousel 轮播图</Title>
        <Paragraph class="mt-2">
          轮播图：children、current、onChange、height（可设置高度）、autoplay、direction、dots、arrows
          等。宽度随容器，高度通过 height 或 class（如 h-64）设置。示例使用
          placehold.co 网络图片（直接 200，无重定向），传 images 数组即可。
        </Paragraph>
        <Paragraph class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          图片默认{" "}
          <code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
            contentFit="contain"
          </code>，完整显示不裁切；可传{" "}
          <code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
            cover
          </code>{" "}
          铺满裁切、<code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
            fill
          </code>{" "}
          铺满可拉伸，图片宽高由使用者自行控制。
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
          <Title level={3}>dots + arrows（网络图片，高度可设置）</Title>
          <div class="w-full">
            {/* 传 current getter，状态在 Carousel 内管理；包一层使展开在 dynamic effect 内，返回的 getter 每次被调用时读 current.value 再渲染，图片才能切换 */}
            {() => (
              <Carousel
                current={current.value}
                onChange={(i) => current.value = i}
                images={DEMO_IMAGES}
                height={DEMO_CAROUSEL_HEIGHT}
                dots
                arrows
              />
            )}
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
            {() => (
              <Carousel
                current={currentAutoplay.value}
                onChange={(i) => currentAutoplay.value = i}
                images={DEMO_IMAGES}
                height={DEMO_CAROUSEL_HEIGHT}
                dots
                autoplay
                autoplayInterval={3000}
              />
            )}
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
