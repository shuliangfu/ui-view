/**
 * 桌面版首页：桌面组件总览、Tailwind 插件用法与分类入口。
 * 路由: /desktop
 */

import { CodeBlock, Paragraph, Title } from "@dreamer/ui-view";

export default function DesktopIndex() {
  return (
    <div className="w-full">
      {/* 标题与说明 */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          桌面版组件
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          @dreamer/ui-view 桌面端组件库，适用于后台、文档站等 PC
          场景。左侧为组件分类导航，点击可进入各组件示例页查看用法与 API。
        </p>
      </section>

      {/* Tailwind 插件使用方法 */}
      <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-600">
        <Title level={2} class="mb-2">
          Tailwind 插件使用方法
        </Title>
        <Paragraph class="text-slate-600 dark:text-slate-400 mb-4">
          本库提供{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            uiViewTailwindContentPlugin
          </code>，在应用初始化（onInit）时扫描项目中对
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm mx-1">
            @dreamer/ui-view
          </code>
          的引用，自动生成一个只含{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            @source "path";
          </code>{" "}
          的 CSS 文件；在主 Tailwind 入口里{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            @import
          </code>{" "}
          该文件即可，Tailwind 只会扫描用到的组件源码，最终 CSS 体积小且 theme
          只出现一次。生成文件与{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            tailwind.css
          </code>{" "}
          默认可放在同一目录（由你自己配置{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            outputPath
          </code>）。
        </Paragraph>

        <Title level={3} class="mt-6 mb-2">
          步骤一：在应用入口注册插件
        </Title>
        <Paragraph class="text-slate-600 dark:text-slate-400 mb-2">
          务必在{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            tailwindPlugin
          </code>{" "}
          之前注册本插件；<code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            outputPath
          </code>{" "}
          为生成文件的路径（相对项目 cwd
          或绝对路径），<code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            scanPath
          </code>{" "}
          为要扫描的源码目录，<code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            packageRoot
          </code>{" "}
          可选（不传则使用插件所在包根）。
        </Paragraph>
        <CodeBlock
          language="ts"
          code={`import { App } from "@dreamer/dweb";
import { uiViewTailwindContentPlugin } from "@dreamer/ui-view/plugin";
import { tailwindPlugin } from "@dreamer/plugins/tailwindcss";

const app = new App();

// 先注册：生成 @source 文件
app.registerPlugin(uiViewTailwindContentPlugin({
  outputPath: "src/assets/ui-view-sources.css",  // 与 tailwind.css 同目录（可自定）
  scanPath: "src",
  // packageRoot: "./node_modules/@dreamer/ui-view",  // 可选
}));

app.registerPlugin(tailwindPlugin({
  output: "dist/client/assets",
  cssEntry: "src/assets/tailwind.css",
  assetsPath: "/assets",
}));

app.start();`}
        />

        <Title level={3} class="mt-6 mb-2">
          步骤二：在 Tailwind 入口 CSS 中引用生成的文件
        </Title>
        <Paragraph class="text-slate-600 dark:text-slate-400 mb-2">
          在{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            tailwind.css
          </code>{" "}
          顶部{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            @import
          </code>{" "}
          插件生成的文件；若生成文件与 tailwind.css 在同一目录，使用相对路径如
          {" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-sm">
            "./ui-view-sources.css"
          </code>。
        </Paragraph>
        <CodeBlock
          language="css"
          code={`/* 例如 tailwind.css 与 ui-view-sources.css 同在 src/assets/ */
@import "./ui-view-sources.css";
@source "../**/*.{ts,tsx}";

@import "tailwindcss";`}
        />

        <Paragraph class="text-slate-600 dark:text-slate-400 mt-4 text-sm">
          本站在{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5">
            src/assets
          </code>{" "}
          下放置{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5">
            tailwind.css
          </code>{" "}
          与{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5">
            ui-view-sources.css
          </code>，由{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5">
            outputPath
          </code>{" "}
          与{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5">
            cssEntry
          </code>{" "}
          自行配置即可。
        </Paragraph>
      </section>

      {/* 技术说明 */}
      <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-600">
        <Title level={2} class="mb-2">
          说明
        </Title>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
          <li>组件基于 View 细粒度渲染，与 Tailwind v4、明暗主题兼容。</li>
          <li>
            桌面版与移动版（/mobile）共用部分基础组件，按场景选用不同布局与交互。
          </li>
          <li>示例代码与 API 详见各组件子页。</li>
        </ul>
      </section>
    </div>
  );
}
