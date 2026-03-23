/**
 * Upload 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/form/upload
 */

import {
  CodeBlock,
  Form,
  FormItem,
  Paragraph,
  Title,
  Upload,
} from "@dreamer/ui-view";
import type { UploadFile } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const UPLOAD_API: ApiRow[] = [
  {
    name: "fileList",
    type: "UploadFile[] | (() => UploadFile[])",
    default: "-",
    description: "受控文件列表（uid、name、status、progress）",
  },
  {
    name: "onChange",
    type: "(e: Event) => void",
    default: "-",
    description: "选择文件变更（e.target.files）",
  },
  {
    name: "onRemove",
    type: "(index: number) => void",
    default: "-",
    description: "移除某一项",
  },
  {
    name: "onDrop",
    type: "(files: File[]) => void",
    default: "-",
    description: "拖拽放下回调",
  },
  {
    name: "multiple",
    type: "boolean",
    default: "false",
    description: "是否多选",
  },
  {
    name: "accept",
    type: "string",
    default: "-",
    description: "原生 accept（如 image/*）",
  },
  {
    name: "drag",
    type: "boolean",
    default: "false",
    description: "是否启用拖拽区域",
  },
  {
    name: "dragPlaceholder",
    type: "string",
    default: "-",
    description: "拖拽区占位文案",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
  { name: "name", type: "string", default: "-", description: "原生 name" },
  { name: "id", type: "string", default: "-", description: "原生 id" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const importCode = `import { Upload, Form, FormItem } from "@dreamer/ui-view";
import type { UploadFile } from "@dreamer/ui-view";
import { createSignal } from "@dreamer/view";

const fileList = createSignal<UploadFile[]>([]);
<FormItem label="上传">
  <Upload
    multiple
    fileList={fileList.value}
    onRemove={(i) => fileList.value = (prev) => prev.filter((_, idx) => idx !== i)}
    onChange={(e) => { /* 处理 e.target.files */ }}
  />
</FormItem>`;

export default function FormUpload() {
  const fileList = createSignal<UploadFile[]>([]);
  const fileListWithProgress = createSignal<
    UploadFile[]
  >([
    { uid: "1", name: "a.txt", status: "pending" },
    { uid: "2", name: "b.pdf", status: "uploading", progress: 60 },
    { uid: "3", name: "c.jpg", status: "done" },
    { uid: "4", name: "d.zip", status: "error" },
  ]);

  const handleChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const files = el.files;
    if (!files?.length) return;
    const next: UploadFile[] = Array.from(files).map((f, i) => ({
      uid: `f-${Date.now()}-${i}`,
      name: f.name,
      status: "pending" as const,
    }));
    fileList.value = (prev) => [...prev, ...next];
  };

  const handleDrop = (files: File[]) => {
    const next: UploadFile[] = files.map((f, i) => ({
      uid: `d-${Date.now()}-${i}`,
      name: f.name,
      status: "pending" as const,
    }));
    fileList.value = (prev) => [...prev, ...next];
  };

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Upload 文件上传</Title>
        <Paragraph class="mt-2">
          文件上传：支持
          multiple、accept、fileList、onChange、onRemove、onDrop、drag、dragPlaceholder、disabled。宽度由
          class 控制，表单中需占满一列时传 class="w-full"。Tailwind v4 +
          light/dark。
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

        <Form layout="vertical" class="w-full space-y-6">
          <section class="space-y-4">
            <Title level={3}>拖拽 + 列表 + 移除</Title>
            <FormItem label="点击或拖拽">
              <Upload
                multiple
                fileList={fileList.value}
                onRemove={(i) =>
                  fileList.value = (prev) => prev.filter((_, idx) => idx !== i)}
                onDrop={handleDrop}
                drag
                dragPlaceholder="点击或拖拽文件到此处"
                onChange={handleChange}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Upload
  multiple
  fileList={fileList.value}
  onRemove={(i) => fileList.value = ...}
  onDrop={handleDrop}
  drag
  dragPlaceholder="点击或拖拽文件到此处"
  onChange={handleChange}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>
              文件列表（pending/uploading/done/error + progress）
            </Title>
            <FormItem label="各状态展示">
              <Upload
                fileList={fileListWithProgress.value}
                onRemove={(i) =>
                  fileListWithProgress.value = (prev) =>
                    prev.filter((_, idx) => idx !== i)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`fileList: [{ uid, name, status: "pending"|"uploading"|"done"|"error", progress?: number }]`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>仅选择（无 drag、无 fileList）</Title>
            <FormItem label="原生 file input">
              <Upload
                multiple
                accept="image/*"
                onChange={(e) =>
                  console.log("选中", (e.target as HTMLInputElement).files)}
              />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Upload
  multiple
  accept="image/*"
  onChange={(e) => ...}
/>`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>

          <section class="space-y-4">
            <Title level={3}>disabled</Title>
            <FormItem label="禁用">
              <Upload disabled />
            </FormItem>
            <CodeBlock
              title="代码示例"
              code={`<Upload disabled />`}
              language="tsx"
              showLineNumbers
              copyable
              wrapLongLines
            />
          </section>
        </Form>
      </section>

      <section class="space-y-3">
        <Title level={2}>API</Title>
        <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
          组件接收以下属性（均为可选）。UploadFile：uid、name、status（pending|uploading|done|error）、progress?。
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
              {UPLOAD_API.map((row) => (
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
