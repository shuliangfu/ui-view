/**
 * App root component
 * 主题由 @dreamer/plugins/theme 在 onResponse 中注入防闪脚本并设置 html class，无需在此写脚本。
 * 视口高度链：否则根布局 min-h-screen 会随内容无限增高，flex-1 min-h-0 无法收缩，
 * 侧栏/main 的 overflow-y-auto 不生效，滚轮只能作用在 body（表现为仅顶栏附近能滚动）。。。。
 *
 * 标题与 SEO 描述由各路由 `export const metadata` 经 `@dreamer/render` 的
 * `generateMetaTags` 注入 head；此处勿再写 `<title>` / `<meta name="description">`，
 * 否则会与 SSR 注入重复多条标签。
 */

import type { VNode } from "@dreamer/view";

interface AppProps {
  children?: VNode | VNode[];
}

export default function App({ children }: AppProps) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 antialiased h-dvh overflow-hidden">
        {
          /*
           * 固定视口高度链：否则根布局 min-h-screen 会随内容无限增高，flex-1 min-h-0 无法收缩，
           * 侧栏/main 的 overflow-y-auto 不生效，滚轮只能作用在 body（表现为仅顶栏附近能滚动）。。。。
           */
        }
        <div id="app" className="h-full min-h-0 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
