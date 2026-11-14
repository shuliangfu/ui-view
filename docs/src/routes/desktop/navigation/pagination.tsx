/**
 * Pagination 组件文档页（标准文档结构：概述、引入、示例、API）
 * 路由: /desktop/navigation/pagination
 */

import { Paragraph, Title } from "@dreamer/ui-view/basic";

import { CodeBlock } from "@dreamer/ui-view/data-display";

import { Pagination } from "@dreamer/ui-view/navigation";
import { DocsMessagesSection } from "../../../components/DocsMessagesSection.tsx";
import { MESSAGES_PAGINATION } from "../../../data/component-messages-rows.ts";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

/** API 属性行类型 */
interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const PAGINATION_API: ApiRow[] = [
  {
    name: "preset",
    type: '"full" | "default" | "simple"',
    default: '"default"',
    description:
      '能力档，与富文本 toolbarPreset 相同的三档用词（分页无工具栏，故名为 preset）。"full" 全部能力：第一页（IconChevronsLeft 双箭头）、上一页、页码、下一页、最后一页（IconChevronsRight）；默认开启快速跳转；传入 total 时显示总条数；传入 pageSizeOptions 时显示每页条数。"default" 一般能力（默认）：上一页、页码、下一页；无第一页／最后一页／跳转。"simple" 极简：上一页、「第 n / m 页」、下一页；无页码、无第一页／最后一页／跳转。显式传入的 showFirstLast、showPrevNext、showPageNumbers、showQuickJumper、showTotal 会覆盖该档默认值。',
  },
  {
    name: "current",
    type: "number | (() => number)",
    default: "-",
    description: "当前页码（受控）；不传则用 defaultCurrent 且组件内部维护",
  },
  {
    name: "defaultCurrent",
    type: "number",
    default: "1",
    description: "非受控时的默认当前页",
  },
  {
    name: "total",
    type: "number",
    default: "-",
    description: "总条数（与 totalPages 二选一）",
  },
  {
    name: "totalPages",
    type: "number",
    default: "-",
    description: "总页数（与 total 二选一）",
  },
  {
    name: "pageSize",
    type: "number | (() => number)",
    default: "-",
    description: "每页条数（受控）；不传则用 defaultPageSize 且组件内部维护",
  },
  {
    name: "defaultPageSize",
    type: "number",
    default: "10",
    description: "非受控时的默认每页条数",
  },
  {
    name: "pageSizeOptions",
    type: "number[]",
    default: "-",
    description:
      "每页条数选项（如 [10, 20, 50]）；渲染库内 Select 自绘下拉，无原生 <select>。任意档在传入此数组且同时有 total 时都会显示条数切换器",
  },
  {
    name: "onChange",
    type: "(page: number, pageSize?: number) => void",
    default: "-",
    description:
      "页码/条数变化回调；切换每页条数时第二个参数为新的 pageSize，并回到第 1 页",
  },
  {
    name: "showFirstLast",
    type: "boolean",
    default: "跟随 preset",
    description:
      "是否显示第一页／最后一页（双箭头）。不传时跟随 preset：full 为 true，default / simple 为 false。在第一页时第一页与上一页禁用，在最后一页时最后一页与下一页禁用",
  },
  {
    name: "showPrevNext",
    type: "boolean",
    default: "跟随 preset（三档均为 true）",
    description: "是否显示上一页/下一页；不传时跟随 preset",
  },
  {
    name: "showPageNumbers",
    type: "boolean",
    default: "跟随 preset",
    description:
      "是否显示页码；不传时跟随 preset（full / default 为 true，simple 为 false）",
  },
  {
    name: "showQuickJumper",
    type: "boolean",
    default: "跟随 preset",
    description:
      "是否显示快速跳转（输入框）；不传时跟随 preset（仅 full 为 true）。输入越界页码会夹到 1..总页数",
  },
  {
    name: "showTotal",
    type: "boolean | ((total: number, range: [number, number]) => unknown)",
    default: "跟随 preset",
    description:
      "是否显示总条数/范围。true 时显示「共 total 条」，也可传函数 (total, [from, to]) => 节点。不传时跟随 preset（仅 full 默认 true，且须有 total 才渲染）",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用全部页码、跳转与条数切换",
  },
  {
    name: "syncUrl",
    type: "boolean",
    default: "false",
    description:
      "为 true 时，页码/每页条数变化会写入 URL（?page=1&pageSize=10），不刷新页面。初始值需由调用方从 URL 读取后传入 current / pageSize 或 defaultCurrent / defaultPageSize",
  },
  {
    name: "size",
    type: '"xs" | "sm" | "md" | "lg"',
    default: '"md"',
    description:
      "尺寸：同步作用于页码按钮、每页条数 Select、快速跳转；四档 xs｜sm｜md｜lg，默认 md 与改造前视觉一致；条数触发器宽度随文案＋箭头自适应、单行不换行",
  },
  {
    name: "testIdPrefix",
    type: "string",
    default: '"pagination"',
    description:
      '测试 id 前缀。会输出 {prefix}-first、{prefix}-prev、{prefix}-page-N、{prefix}-next、{prefix}-last、{prefix}-jump、{prefix}-pagesize、{prefix}-simple-current。数据面板传入 "dp"',
  },
  { name: "class", type: "string", default: "-", description: "额外 class" },
  {
    name: "messages",
    type: "Partial<PaginationMessages>",
    default: "-",
    description:
      "本地化文案；字段见上文「文案（messages）」表（含 first / last / simpleCurrent），勿将键摊入本表",
  },
];

const importCode = `import { Pagination } from "@dreamer/ui-view/navigation";

<Pagination
  preset="full"
  defaultCurrent={1}
  defaultPageSize={10}
  total={120}
  pageSizeOptions={[10, 20, 50]}
  onChange={() => {}}
/>`;

const exampleFull = `<Pagination
  preset="full"
  defaultCurrent={1}
  defaultPageSize={10}
  total={120}
  pageSizeOptions={[10, 20, 50]}
  onChange={handleChange}
/>`;

const exampleDefault = `<Pagination
  preset="default"
  defaultCurrent={1}
  defaultPageSize={10}
  total={120}
  onChange={handleChange}
/>`;

const exampleSimple = `<Pagination
  preset="simple"
  defaultCurrent={1}
  defaultPageSize={10}
  total={120}
  onChange={handleChange}
/>`;

const exampleTotalPages = `<Pagination
  defaultCurrent={1}
  totalPages={5}
  onChange={() => {}}
/>`;

const exampleDisabled = `<Pagination
  current={2}
  total={50}
  pageSize={10}
  onChange={() => {}}
  disabled
/>`;

const exampleSyncUrl = `<Pagination
  preset="full"
  defaultCurrent={initial.page}
  defaultPageSize={initial.pageSize}
  total={120}
  pageSizeOptions={[10, 20, 50]}
  onChange={handleChange}
  syncUrl
/>`;

const exampleSizes = `<>
  <Pagination size="xs" defaultCurrent={1} defaultPageSize={10} total={80} pageSizeOptions={[10, 20, 50]} onChange={handleChange} showTotal />
  <Pagination size="sm" defaultCurrent={1} defaultPageSize={10} total={80} pageSizeOptions={[10, 20, 50]} onChange={handleChange} showTotal />
  <Pagination size="md" defaultCurrent={1} defaultPageSize={10} total={80} pageSizeOptions={[10, 20, 50]} onChange={handleChange} showTotal />
  <Pagination size="lg" defaultCurrent={1} defaultPageSize={10} total={80} pageSizeOptions={[10, 20, 50]} onChange={handleChange} showTotal />
</>`;

const examplePageSizeSelect = `<Pagination
  defaultCurrent={1}
  defaultPageSize={10}
  total={120}
  pageSizeOptions={[10, 20, 50]}
  onChange={handleChange}
  showTotal
/>
{/* pageSizeOptions 使用库内 Select，无原生 <select> */}`;

/** 从当前 URL 读取 page / pageSize（用于 syncUrl 场景的初始值） */
function getPageFromUrl(): { page: number; pageSize: number } {
  if (typeof globalThis.location === "undefined") {
    return { page: 1, pageSize: 10 };
  }
  const u = new URL(globalThis.location.href);
  const page = Math.max(
    1,
    parseInt(u.searchParams.get("page") ?? "1", 10) || 1,
  );
  const pageSize = Math.max(
    1,
    parseInt(u.searchParams.get("pageSize") ?? "10", 10) || 10,
  );
  return { page, pageSize };
}

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Pagination 分页 · ui-view",
};

export default function NavigationPagination() {
  const initial = getPageFromUrl();

  const handleChange = (_p: number, _ps?: number) => {
    // 可选：根据业务处理页码/每页条数变化
  };

  return (
    <div class="space-y-10">
      <section>
        <Title level={1}>Pagination 分页</Title>
        <Paragraph class="mt-2">
          分页：preset（"full"｜"default"｜"simple"）、current、total、totalPages、pageSize、pageSizeOptions、onChange、showFirstLast、showPrevNext、showPageNumbers、showQuickJumper、showTotal、disabled、syncUrl、size、testIdPrefix、class、messages。
          <code class="text-xs">preset="full"</code>{" "}
          为全部能力，含第一页／最后一页（现成图标
          IconChevronsLeft／IconChevronsRight 双箭头，上一页／下一页为
          IconChevronLeft／IconChevronRight）。
          <code class="text-xs">preset="default"</code>{" "}
          为一般能力（上一页／页码／下一页）。
          <code class="text-xs">preset="simple"</code>{" "}
          为极简（上一页、「第 n / m 页」、下一页）。显式 show*
          可覆盖该档默认值。 每页条数切换使用库内 Select（自绘下拉），不渲染原生
          {" "}
          {"<select>"}。尺寸 size 为 xs｜sm｜md｜lg，默认
          md；条数触发器随文案＋箭头贴紧、单行不换行。 使用 Tailwind v4，支持
          light/dark
          主题。数据面板默认按断点选用：电脑端（≥1280px）full，平板（640px–1279.98px）default，移动端（≤639.98px）simple，也可用
          pagination.preset 指定。
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
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>

      <section class="space-y-8">
        <Title level={2}>示例</Title>

        <div class="space-y-4" data-testid="demo-pagination-preset-full">
          <Title level={3}>
            preset=&quot;full&quot;（全部能力）
          </Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            第一页、上一页、页码、下一页、最后一页，以及总条数、每页条数和快速跳转。在第一页时第一页／上一页禁用，在最后一页时最后一页／下一页禁用。
          </Paragraph>
          <Pagination
            preset="full"
            defaultCurrent={1}
            defaultPageSize={10}
            total={120}
            pageSizeOptions={[10, 20, 50]}
            onChange={handleChange}
          />
          <CodeBlock
            title="代码示例"
            code={exampleFull}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4" data-testid="demo-pagination-preset-default">
          <Title level={3}>
            preset=&quot;default&quot;（一般能力）
          </Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            上一页、页码、下一页。无第一页／最后一页，也无快速跳转。
          </Paragraph>
          <Pagination
            preset="default"
            defaultCurrent={1}
            defaultPageSize={10}
            total={120}
            onChange={handleChange}
          />
          <CodeBlock
            title="代码示例"
            code={exampleDefault}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4" data-testid="demo-pagination-preset-simple">
          <Title level={3}>
            preset=&quot;simple&quot;（极简）
          </Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            上一页、「第 n / m
            页」、下一页。无数字页码、无第一页／最后一页、无跳转。
          </Paragraph>
          <Pagination
            preset="simple"
            defaultCurrent={1}
            defaultPageSize={10}
            total={120}
            onChange={handleChange}
          />
          <CodeBlock
            title="代码示例"
            code={exampleSimple}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>totalPages 直接指定总页数</Title>
          <Pagination
            defaultCurrent={1}
            totalPages={5}
            onChange={() => {}}
          />
          <CodeBlock
            title="代码示例"
            code={exampleTotalPages}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>disabled</Title>
          <Pagination
            current={2}
            total={50}
            pageSize={10}
            onChange={() => {}}
            disabled
          />
          <CodeBlock
            title="代码示例"
            code={exampleDisabled}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4">
          <Title level={3}>syncUrl（与 URL ?page=1&pageSize=10 同步）</Title>
          <Pagination
            preset="full"
            defaultCurrent={initial.page}
            defaultPageSize={initial.pageSize}
            total={120}
            pageSizeOptions={[10, 20, 50]}
            onChange={handleChange}
            syncUrl
          />
          <CodeBlock
            title="代码示例"
            code={exampleSyncUrl}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4" data-testid="demo-pagination-sizes">
          <Title level={3}>尺寸 size（xs｜sm｜md｜lg）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            默认 md。四档同步作用于页码按钮、每页条数 Select
            与快速跳转；条数触发器宽度随文案＋箭头自适应、单行不换行。
          </Paragraph>
          <div class="space-y-4">
            <div class="space-y-2">
              <Paragraph class="text-xs text-slate-500">xs</Paragraph>
              <Pagination
                size="xs"
                defaultCurrent={1}
                defaultPageSize={10}
                total={80}
                pageSizeOptions={[10, 20, 50]}
                onChange={handleChange}
                showTotal
              />
            </div>
            <div class="space-y-2">
              <Paragraph class="text-xs text-slate-500">sm</Paragraph>
              <Pagination
                size="sm"
                defaultCurrent={1}
                defaultPageSize={10}
                total={80}
                pageSizeOptions={[10, 20, 50]}
                onChange={handleChange}
                showTotal
              />
            </div>
            <div class="space-y-2">
              <Paragraph class="text-xs text-slate-500">md（默认）</Paragraph>
              <Pagination
                size="md"
                defaultCurrent={1}
                defaultPageSize={10}
                total={80}
                pageSizeOptions={[10, 20, 50]}
                onChange={handleChange}
                showTotal
              />
            </div>
            <div class="space-y-2">
              <Paragraph class="text-xs text-slate-500">lg</Paragraph>
              <Pagination
                size="lg"
                defaultCurrent={1}
                defaultPageSize={10}
                total={80}
                pageSizeOptions={[10, 20, 50]}
                onChange={handleChange}
                showTotal
              />
            </div>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleSizes}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>

        <div class="space-y-4" data-testid="demo-pagination-pagesize-select">
          <Title level={3}>每页条数：库内 Select（无原生 select）</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            传入 pageSizeOptions 后渲染组件库 Select 自绘下拉；完整示例同上。
          </Paragraph>
          <Pagination
            defaultCurrent={1}
            defaultPageSize={10}
            total={120}
            pageSizeOptions={[10, 20, 50]}
            onChange={handleChange}
            showTotal
          />
          <CodeBlock
            title="代码示例"
            code={examplePageSizeSelect}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>

      <DocsMessagesSection
        interfaceName="PaginationMessages"
        defaultExportName="defaultPaginationMessages"
        rows={MESSAGES_PAGINATION}
      />

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
              {PAGINATION_API.map((row) => (
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
