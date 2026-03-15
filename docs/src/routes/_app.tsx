/**
 * App root component
 * 主题由 @dreamer/plugins/theme 在 onResponse 中注入防闪脚本并设置 html class，无需在此写脚本。
 */

import type { VNode } from "@dreamer/view";

interface AppProps {
  children?: VNode | VNode[];
  title?: string;
  description?: string;
}

export default function App({
  children,
  title = "docs",
  description = "使用 @dreamer/dweb 构建",
}: AppProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <title>{title}</title>
      </head>
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 antialiased">
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
