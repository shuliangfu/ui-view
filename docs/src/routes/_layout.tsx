/**
 * 根布局：顶栏导航 + 子路由内容 + 全局 Toast/Notification + 页脚。
 * 使用库内组件：Navbar、Link、Divider、IconBrandGithub、ToastContainer、NotificationContainer。
 * 桌面版（desktop）等子布局继承本布局，仅提供侧栏+主内容区。
 */

import {
  Divider,
  IconBrandGithub,
  Link,
  Navbar,
  NotificationContainer,
  ToastContainer,
} from "@dreamer/ui-view";
import type { VNode } from "@dreamer/view";
import { ThemeToggle } from "../components/ThemeToggle.tsx";

interface DesktopLayoutProps {
  children?: VNode | VNode[];
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* 顶栏：Navbar（品牌 + 主导航 + 右侧操作） */}
      <Navbar
        menuAlign="right"
        brand={
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100"
          >
            <span className="rounded-lg bg-teal-500 px-2.5 py-1 font-mono text-sm text-white dark:bg-teal-600">
              UI-VIEW
            </span>
          </Link>
        }
        nav={
          <>
            <Link
              href="/desktop"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              桌面版
            </Link>
            <Link
              href="/mobile"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
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

      {/* 子布局/页面内容（desktop 会在此处渲染侧栏+主内容） */}
      {children}

      <ToastContainer />
      <NotificationContainer />

      <footer className="border-t border-slate-100 dark:border-slate-700 py-6 text-center text-sm text-slate-400 dark:text-slate-400">
        <p>© 2024 @dreamer/ui-view · 使用 @dreamer/dweb 构建</p>
      </footer>
    </div>
  );
}
