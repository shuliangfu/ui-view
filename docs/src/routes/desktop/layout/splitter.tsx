/**
 * Splitter 文档页。路由: /desktop/layout/splitter
 */

import type { LoadContext } from "@dreamer/dweb";
import { Splitter } from "@dreamer/ui-view/layout";
import { Paragraph, Title } from "@dreamer/ui-view/basic";
import { CodeBlock } from "@dreamer/ui-view/data-display";
import {
  DocsApiTable,
  type DocsApiTableRow,
} from "../../../components/DocsApiTable.tsx";
import { DOCS_DEMO_CODE_MAX_HEIGHT } from "../../../components/DocsDemo.tsx";

/** load() 把请求 Cookie 头交给首屏，服务端和浏览器用同一份记住的比例。 */
export interface SplitterDocLoadData {
  /** `Cookie` 请求头原文；没有则为空字符串 */
  cookie: string;
}

/**
 * 读取请求 Cookie，供 Splitter 的 `cookie` 在 SSR 时复用上次拖拽位置。
 */
export function load(ctx: LoadContext): SplitterDocLoadData {
  const fromHeader = ctx.req?.headers?.get("cookie");
  if (fromHeader) return { cookie: fromHeader };
  const rec = ctx.cookies ?? {};
  const cookie = Object.entries(rec)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return { cookie };
}

const API: DocsApiTableRow[] = [
  {
    name: "orientation",
    type: "horizontal | vertical",
    default: "horizontal",
    description: "方向：horizontal 为左右，vertical 为上下",
  },
  {
    name: "sizes",
    type: "number[] | Signal<number[]> | () => number[]",
    default: "均分",
    description:
      "各面板宽度／高度百分比。请传 Signal 或 getter，勿传 sizes={sig.value} 快照；未传时由组件内部保存拖拽结果。非受控且开启 persist 时，初始比例优先读 cookie",
  },
  {
    name: "onSizesChange",
    type: "(sizes: number[]) => void",
    default: "-",
    description: "拖拽过程中尺寸变化回调",
  },
  {
    name: "persist",
    type: "string",
    default: "-",
    description:
      "记住拖拽位置的名字（如 editor-split）。传入即开启，拖拽结束写入 cookie，有效期一年；不传不记住。同一页多个 Splitter 须用不同名字",
  },
  {
    name: "cookie",
    type: "string | null",
    default: "document.cookie",
    description:
      "服务端渲染时传入请求的 Cookie 头。浏览器可省略。这样首屏就能用上次的比例，不会先画成均分再跳一下",
  },
  { name: "minSize", type: "number", default: "10", description: "最小百分比" },
  { name: "class", type: "string", default: "-", description: "额外 class" },
];

const importCode = `import { Splitter } from "@dreamer/ui-view/layout";

<Splitter>
  <div class="p-3">左侧面板</div>
  <div class="p-3">右侧面板</div>
</Splitter>`;

const exampleHorizontal = `<div class="h-48 border rounded-lg overflow-hidden">
  <Splitter>
    <div class="p-3 bg-slate-50">左</div>
    <div class="p-3">右</div>
  </Splitter>
</div>`;

const exampleVertical = `<div class="h-48 border rounded-lg overflow-hidden">
  <Splitter orientation="vertical">
    <div class="p-3 bg-slate-50">上</div>
    <div class="p-3">下</div>
  </Splitter>
</div>`;

const examplePersist = `import type { LoadContext } from "@dreamer/dweb";

export function load(ctx: LoadContext) {
  return {
    cookie: ctx.req?.headers?.get("cookie") ?? "",
  };
}

export default function Page({ data }: { data?: { cookie: string } }) {
  return (
    <Splitter
      persist="editor-split"
      cookie={data?.cookie}
    >
      <div>左</div>
      <div>右</div>
    </Splitter>
  );
}`;

/** 路由元数据：浏览器 <title> / SEO（dweb resolveMetadata） */
export const metadata = {
  title: "Splitter · ui-view",
};

export default function Page({ data }: { data?: SplitterDocLoadData }) {
  const cookie = data?.cookie;
  return (
    <div class="space-y-8">
      <section>
        <Title level={1}>Splitter 分割面板</Title>
        <Paragraph class="mt-2">
          把一块区域分成多块并排的面板，拖动中间的分隔线就能改相邻面板的大小。
          默认是左右分割（
          <code class="text-xs">orientation="horizontal"</code>
          ），也可以上下分割（
          <code class="text-xs">orientation="vertical"</code>
          ）。未传 <code class="text-xs">sizes</code>{" "}
          时，拖拽结果由组件自己记住；受控时请传 Signal 或 getter，不要传{" "}
          <code class="text-xs">sizes={"{"}sig.value{"}"}</code> 快照。
          <code class="text-xs">minSize</code> 限制每块最小占比，默认 10%。
        </Paragraph>
        <Paragraph class="mt-2">
          适合需要用户自己调整空间的界面，例如：左侧文件树或菜单、右侧编辑器或详情；上方预览或工具区、下方日志或终端；邮件列表和正文并排；代码和实时预览并排。面板比例会随拖拽变化，内容在各自区域内滚动，互不影响。
        </Paragraph>
        <Paragraph class="mt-2">
          若要在刷新或下次访问后仍保持位置，传入{" "}
          <code class="text-xs">persist</code>
          （cookie 名）即可，拖拽结束会写入，有效期一年。用 cookie 而不是
          localStorage，是因为 cookie 会随请求带到服务端，SSR
          首屏就能画成上次的比例。服务端请在 <code class="text-xs">load()</code>
          {" "}
          里把请求的 Cookie 头传给 <code class="text-xs">cookie</code>
          ；浏览器里可省略。不要用
          localStorage：服务端读不到，会先按均分渲染，客户端再跳到记住的位置。
        </Paragraph>
      </section>
      <section class="space-y-3">
        <Title level={2}>引入</Title>
        <CodeBlock
          code={importCode}
          language="tsx"
          maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
        />
      </section>
      <section class="space-y-8">
        <Title level={2}>示例</Title>
        <div class="space-y-3">
          <Title level={3}>左右分割</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <div class="h-48 border rounded-lg overflow-hidden">
              <Splitter>
                <div class="p-3 h-full bg-slate-50 dark:bg-slate-800">左</div>
                <div class="p-3 h-full">右</div>
              </Splitter>
            </div>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleHorizontal}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-3">
          <Title level={3}>上下分割</Title>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <div class="h-48 border rounded-lg overflow-hidden">
              <Splitter orientation="vertical">
                <div class="p-3 bg-slate-50 dark:bg-slate-800">上</div>
                <div class="p-3">下</div>
              </Splitter>
            </div>
          </div>
          <CodeBlock
            title="代码示例"
            code={exampleVertical}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
        <div class="space-y-3">
          <Title level={3}>记住拖拽位置</Title>
          <Paragraph class="text-sm text-slate-600 dark:text-slate-400">
            传入 <code class="text-xs">persist</code>{" "}
            后，拖开分隔线再刷新，比例会保持。本页示例已在{" "}
            <code class="text-xs">load()</code> 里把 Cookie 头传给{" "}
            <code class="text-xs">cookie</code>
            ，服务端首屏也会用记住的位置。
          </Paragraph>
          <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
            <div class="h-48 border rounded-lg overflow-hidden">
              <Splitter
                persist="ui-view-docs-splitter-persist"
                cookie={cookie}
              >
                <div class="p-3 h-full bg-slate-50 dark:bg-slate-800">左</div>
                <div class="p-3 h-full">右</div>
              </Splitter>
            </div>
          </div>
          <CodeBlock
            title="代码示例"
            code={examplePersist}
            language="tsx"
            showLineNumbers
            copyable
            wrapLongLines
            maxHeight={DOCS_DEMO_CODE_MAX_HEIGHT}
          />
        </div>
      </section>
      <section class="space-y-3">
        <Title level={2}>API</Title>
        <DocsApiTable rows={API} />
      </section>
    </div>
  );
}
