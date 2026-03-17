/**
 * ImageViewer 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/image-viewer
 */

import { createSignal } from "@dreamer/view";
import {
  Button,
  CodeBlock,
  ImageViewer,
  Paragraph,
  Title,
} from "@dreamer/ui-view";

const DEMO_IMAGES = [
  "https://picsum.photos/id/1/800/600",
  "https://picsum.photos/id/10/800/600",
  "https://picsum.photos/id/100/800/600",
  "https://picsum.photos/id/1000/800/600",
  "https://picsum.photos/id/1001/800/600",
];

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const IMAGE_VIEWER_API: ApiRow[] = [
  {
    name: "open",
    type: "boolean",
    default: "-",
    description: "是否打开（受控）",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "-",
    description: "关闭回调",
  },
  {
    name: "images",
    type: "string | string[]",
    default: "-",
    description: "图片列表",
  },
  {
    name: "currentIndex",
    type: "number",
    default: "-",
    description: "当前展示索引（受控）",
  },
  {
    name: "defaultIndex",
    type: "number",
    default: "-",
    description: "默认索引（非受控）",
  },
  {
    name: "onIndexChange",
    type: "(index: number) => void",
    default: "-",
    description: "索引变化回调",
  },
  {
    name: "maskClosable",
    type: "boolean",
    default: "true",
    description: "点击遮罩是否关闭",
  },
  {
    name: "keyboard",
    type: "boolean",
    default: "true",
    description: "Esc 关闭、左右键切换",
  },
  {
    name: "showThumbnails",
    type: "boolean",
    default: "true",
    description: "是否显示底部缩略图",
  },
];

const importCode = `import { createSignal } from "@dreamer/view";
import { Button, ImageViewer } from "@dreamer/ui-view";

const [open, setOpen] = createSignal(false);
const [index, setIndex] = createSignal(0);
<ImageViewer open={open()} onClose={() => setOpen(false)} images={images} currentIndex={index()} onIndexChange={setIndex} />`;

const exampleBasic =
  `<ImageViewer open={open()} onClose={() => setOpen(false)} images={DEMO_IMAGES} currentIndex={index()} onIndexChange={setIndex} maskClosable keyboard showThumbnails />`;

export default function DataDisplayImageViewer() {
  const [open, setOpen] = createSignal(false);
  const [index, setIndex] = createSignal(0);

  return () => (
    <div class="space-y-10">
      <section>
        <Title level={1}>ImageViewer 图片查看器</Title>
        <Paragraph class="mt-2">
          全屏遮罩内大图查看，支持多图切换、缩放、旋转、底部缩略图；Esc
          关闭，左右键切换图片。 使用 Tailwind v4，支持 light/dark 主题。
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
          <Title level={3}>多图切换 + 缩略图</Title>
          <div class="flex flex-wrap gap-3">
            {DEMO_IMAGES.map((src, i) => (
              <button
                type="button"
                key={src}
                class="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 hover:ring-2 hover:ring-teal-500 transition-shadow"
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
              >
                <img
                  src={src}
                  alt={`预览 ${i + 1}`}
                  class="w-24 h-24 object-cover block"
                />
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => {
              setIndex(0);
              setOpen(true);
            }}
          >
            打开查看器
          </Button>
          <ImageViewer
            open={open()}
            onClose={() => setOpen(false)}
            images={DEMO_IMAGES}
            currentIndex={index()}
            onIndexChange={setIndex}
            maskClosable
            keyboard
            showThumbnails
          />
          <CodeBlock
            title="代码示例"
            code={exampleBasic}
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
              {IMAGE_VIEWER_API.map((row) => (
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
