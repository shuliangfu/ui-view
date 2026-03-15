/**
 * 首页：文档站风格，轻量 Hero + 入口链接 + 小示例。
 * 路由: /
 */

import { Link } from "@dreamer/ui-view";
import { Button } from "../components/Button.tsx";
import { createSignal } from "@dreamer/view";

export default function Home() {
  const [count, setCount] = createSignal(0);

  return (
    <div className="max-w-2xl">
      {/* Hero：留白多、标题+一句话，无大色块 */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          ui-view 组件示例
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          基于 @dreamer/dweb 与 @dreamer/ui-view 的 View
          示例，左侧可进入各组件分类查看用法。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/basic"
            className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 dark:text-white transition-colors"
          >
            基础组件
          </Link>
          <Link
            href="/form"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            表单组件
          </Link>
        </div>
      </section>

      {/* 特性：简洁列表，非卡片墙 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
          特性
        </h2>
        <ul className="space-y-2 text-slate-600 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <span className="text-teal-500">·</span>{" "}
            文件路由、SSR、TypeScript、View 细粒度渲染
          </li>
          <li className="flex items-center gap-2">
            <span className="text-teal-500">·</span>{" "}
            桌面/移动端组件分类，与 ANALYSIS 一致
          </li>
        </ul>
      </section>

      {/* 计数器：小区块，dark 下深色背景与清晰文字对比 */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/80 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          计数器示例
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          View 细粒度渲染：仅数字与按钮随 count 更新
        </p>
        {() => (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {count()}
            </span>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setCount(count() + 1)}>
                加一
              </Button>
              <Button variant="secondary" onClick={() => setCount(count() - 1)}>
                减一
              </Button>
              <Button variant="ghost" onClick={() => setCount(0)}>重置</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
