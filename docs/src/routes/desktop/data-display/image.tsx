/**
 * Image 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/data-display/image
 */

import { CodeBlock, Image, Paragraph, Title } from "@dreamer/ui-view";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const IMAGE_API: ApiRow[] = [
  { name: "src", type: "string", default: "-", description: "图片地址" },
  { name: "alt", type: "string", default: "-", description: "替代文案" },
  { name: "width", type: "number | string", default: "-", description: "宽度" },
  {
    name: "height",
    type: "number | string",
    default: "-",
    description: "高度",
  },
  {
    name: "fit",
    type: "contain | cover | fill | none",
    default: "-",
    description: "填充方式",
  },
  { name: "placeholder", type: "unknown", default: "-", description: "占位图" },
  {
    name: "fallback",
    type: "string | unknown",
    default: "-",
    description: "加载失败时显示",
  },
  {
    name: "lazy",
    type: "boolean",
    default: "false",
    description: "是否懒加载",
  },
  {
    name: "preview",
    type: "boolean",
    default: "false",
    description: "是否支持点击预览",
  },
  {
    name: "previewDisabled",
    type: "boolean",
    default: "false",
    description: "是否禁用预览",
  },
  {
    name: "rounded",
    type: "boolean | string",
    default: "-",
    description: "圆角",
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const importCode = `import { Image } from "@dreamer/ui-view";

<Image src="https://example.com/photo.jpg" alt="示例" width={200} height={150} fit="cover" preview />`;

const exampleBasicPreview =
  `<Image src="..." alt="示例图" width={200} height={150} fit="cover" rounded preview />`;

const exampleFallbackLazy =
  `<Image src="invalid" alt="失败" width={120} height={120} fallback="加载失败" />
<Image src="..." alt="lazy" width={100} height={100} lazy rounded="lg" />`;

export default function DataDisplayImage() {
  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Image 图片</Title>
        <Paragraph class="mt-2">
          图片：src、alt、width、height、fit、placeholder、fallback、lazy、preview、previewDisabled、rounded。
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
          <Title level={3}>基础 + fit + preview + rounded</Title>
          <div class="flex gap-4 flex-wrap">
            <Image
              src="https://picsum.photos/200/150"
              alt="示例图"
              width={200}
              height={150}
              fit="cover"
              rounded
              preview
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleBasicPreview}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>fallback / lazy</Title>
          <div class="flex gap-4 flex-wrap">
            <Image
              src="https://invalid-url-404"
              alt="失败"
              width={120}
              height={120}
              fallback="加载失败"
            />
            <Image
              src="https://picsum.photos/100/100"
              alt="lazy"
              width={100}
              height={100}
              lazy
              rounded="lg"
            />
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleFallbackLazy}
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
          组件接收以下属性，src 为必填。
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
              {IMAGE_API.map((row) => (
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
