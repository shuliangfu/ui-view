/**
 * 根布局：顶栏 + 子路由 + 全局 Toast/Message/Notification（页脚在各页主栏/首页滚动区内，见 SiteFooter）。
 * 占满 #app（h-full），中间区 flex-1 min-h-0 overflow-hidden；桌面/移动子布局内 aside 与 main 各自 overflow-y-auto。
 * 勿用 min-h-screen 作为最外层高度：会破坏 min-h-0 传递，导致侧栏与正文无法成为独立滚动容器。
 * 使用 @dreamer/ui-view：NavBar、Link、Divider、IconBrandGithub 等。
 */

import {
  Divider,
  IconBrandGithub,
  Link,
  MessageContainer,
  NavBar,
  NotificationContainer,
  ToastContainer,
} from "@dreamer/ui-view";
import type { VNode } from "@dreamer/view";
import DocsSiteBrand from "../components/DocsSiteBrand.tsx";
import { ThemeToggle } from "../components/ThemeToggle.tsx";

interface RootLayoutProps {
  children?: VNode | VNode[];
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div class="h-full min-h-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {
        /*
         * 顶栏：Container 左无 padding，与 desktop/mobile 内层 max-w-[1800px] 侧栏左缘对齐；右侧保留 pr。
         * 品牌区 w-72 + justify-center，与 Sidebar 同宽并在该列居中。
         */
      }
      <div class="shrink-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md supports-backdrop-filter:bg-white/70 dark:supports-backdrop-filter:bg-slate-900/70">
        <NavBar
          menuAlign="right"
          sticky={false}
          border={false}
          blur={false}
          containerMaxWidth="full"
          containerClass="max-w-[1800px] mx-auto !pl-0 sm:!pl-0 lg:!pl-0 pr-4 sm:pr-6 lg:pr-8"
          class="border-0 bg-transparent shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
          nav={
            <>
              {
                /*
                 * 与 Sidebar 同宽 w-72，品牌在该列内水平居中，与左侧菜单视觉对齐。
                 */
              }
              <div class="mr-auto flex w-72 shrink-0 justify-center">
                <DocsSiteBrand />
              </div>
              <Link
                href="/desktop"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors"
              >
                桌面版
              </Link>
              <Link
                href="/mobile"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors"
              >
                移动版
              </Link>
            </>
          }
          end={
            <>
              <Divider type="vertical" class="h-6 self-center" />
              <ThemeToggle />
              <Link
                href="https://jsr.io/@dreamer/ui-view"
                target="_blank"
                title="JSR 包页"
                aria-label="JSR 包页"
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors"
              >
                JSR
              </Link>
              <Link
                href="https://github.com/shuliangfu/ui-view"
                target="_blank"
                title="GitHub 仓库"
                aria-label="GitHub 仓库"
                className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors inline-flex items-center justify-center"
              >
                <IconBrandGithub class="w-5 h-5" />
              </Link>
            </>
          }
        />
      </div>

      <div class="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>

      <ToastContainer />
      <MessageContainer />
      <NotificationContainer />
    </div>
  );
}
