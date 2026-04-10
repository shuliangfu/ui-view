/**
 * 根布局：顶栏 + 子路由 + 全局 Toast/Message/Notification（页脚在各页主栏/首页滚动区内，见 SiteFooter）。
 * 占满 #app（h-full），中间区 flex-1 min-h-0 overflow-hidden；桌面/移动子布局内 aside 与 main 各自 overflow-y-auto。
 * 勿用 min-h-screen 作为最外层高度：会破坏 min-h-0 传递，导致侧栏与正文无法成为独立滚动容器。
 * 使用 @dreamer/ui-view：NavBar、Link、Divider、IconBrandGithub 等。
 */

import {
  Divider,
  IconBrandGithub,
  IconExternalLink,
  IconMenu,
  IconMoreHorizontal,
  Link,
  MessageContainer,
  NavBar,
  NotificationContainer,
  ToastContainer,
} from "@dreamer/ui-view";
import {
  createEffect,
  createSignal,
  onCleanup,
  Portal,
  Show,
  type VNode,
} from "@dreamer/view";
import DocsSiteBrand from "../components/DocsSiteBrand.tsx";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import {
  docsNavDrawerOpen,
  docsNavSidebarAttached,
} from "../state/docs-nav-drawer.ts";

interface RootLayoutProps {
  children?: VNode | VNode[];
}

/**
 * 文档站顶栏单独成组件：仅在此读取 {@link docsNavSidebarAttached}，把订阅限制在顶栏子树。
 *
 * 若放在 RootLayout 根组件里读该 signal，子路由的 desktop/mobile `_layout` 在 onMount 里写 `true` 会触发
 * **整棵根布局**重渲染，子布局可能被卸掉并执行 onCleanup（写 `false`），再挂载 onMount（写 `true`），
 * 形成 true/false 震荡直至卡死。顶栏隔离后，路由子树不因该 signal 被整段重建。
 *
 * **仅小屏（max-md）**：徽标用 NavBar `center` 在**容器宽度内**绝对居中（`left-1/2` + `-translate-x-1/2`，不传 `centerNudgeX`）；
 * `nav` 占位区设 `max-md:pointer-events-none`，避免透明 flex 层压在徽标上挡点击。右侧「更多」打开全宽顶栏菜单。
 * **宽屏（md+）**：`nav` 内平铺分区链接；`end` 内竖线 + 三图标平铺。
 * 桌面顶栏 `Container` 使用 `!px-0` 去掉默认水平 padding，与下方文档 `max-w-[1800px]` 主行左缘对齐；`brand` 使用与侧栏同宽 `w-72` 并
 * 桌面 `brand` 使用 `md:-translate-x-8`，在 `w-72` 内把徽标再往左移，对齐相对左侧菜单的视觉居中（仅 `translate-x-2` 仍偏右）。
 */
/** 宽屏顶栏分区链接（与历史文档站一致：平铺在 nav 右侧） */
const docsNavPartitionLinkClass =
  "rounded-lg px-1.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300 transition-colors sm:px-2 sm:py-2 sm:text-xs md:px-3.5 md:text-sm";

/** 小屏全宽顶栏菜单内：分区入口行（大块触控） */
const docsMobileSheetRowLinkClass =
  "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-slate-800 hover:bg-teal-50 active:bg-teal-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700 transition-colors";

/** 小屏菜单底部：仅图标的 JSR、GitHub 外链按钮（与 ThemeToggle 尺寸对齐） */
const docsMobileSheetIconLinkClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

/**
 * 小屏专用：横向三点打开**视口全宽**顶栏菜单（`fixed` 贴顶栏下缘），内含桌面、移动分区；其下为主题与外链**仅图标**一行居中。
 * 菜单层经 {@link Portal} 挂到 `document.body`，避免落在顶栏 `z-50` 子树内导致正文区仍抢点击；点击下方半透明区关闭。
 * 宽屏不展示（根节点 `md:hidden`）。
 */
function DocsMobileTopSheet() {
  /** 菜单是否展开 */
  const menuOpen = createSignal(false);

  /** 关闭全宽菜单（路由跳转、遮罩点击、Esc 共用） */
  const closeMenu = () => {
    menuOpen.value = false;
  };

  /**
   * 展开时监听 Esc 关闭；依赖 `menuOpen` 以便开关变化时挂载/卸载监听。
   */
  createEffect(() => {
    if (!menuOpen.value || typeof globalThis.document === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    globalThis.document.addEventListener("keydown", onKeyDown);
    onCleanup(() =>
      globalThis.document.removeEventListener("keydown", onKeyDown)
    );
  });

  return (
    <div class="relative md:hidden">
      <button
        type="button"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        title="更多"
        aria-label="打开顶栏菜单"
        aria-expanded={() => menuOpen.value}
        aria-haspopup="true"
        onClick={(e: Event) => {
          e.stopPropagation();
          menuOpen.value = !menuOpen.value;
        }}
      >
        <IconMoreHorizontal class="h-5 w-5" aria-hidden />
      </button>

      <Show when={() => menuOpen.value}>
        <Portal>
          {
            /**
             * 根层 `pointer-events-none`：顶栏 h-16 区域不挡操作，点击仍落到顶栏汉堡/更多钮。
             * 遮罩 `pointer-events-auto` 盖住正文，点击即关闭（避免遮罩留在顶栏 z-index 子树内无法压住 main）。
             */
          }
          <div class="pointer-events-none fixed inset-0 z-[1000]">
            <button
              type="button"
              class="pointer-events-auto absolute inset-x-0 top-16 bottom-0 z-0 cursor-default border-0 bg-slate-900/35 p-0"
              aria-label="关闭顶栏菜单"
              onClick={closeMenu}
            />
            <div
              class="pointer-events-auto absolute inset-x-0 top-16 z-10 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
              role="menu"
              aria-label="站点菜单"
            >
              <Link
                href="/desktop"
                className={docsMobileSheetRowLinkClass}
                onClick={closeMenu}
              >
                桌面版
              </Link>
              <Link
                href="/mobile"
                className={docsMobileSheetRowLinkClass}
                onClick={closeMenu}
              >
                移动版
              </Link>
              <Divider
                type="horizontal"
                class="my-0 border-slate-200 dark:border-slate-700"
              />
              <div class="flex items-center justify-center gap-8 px-4 py-3.5">
                <ThemeToggle />
                <Link
                  href="https://jsr.io/@dreamer/ui-view"
                  target="_blank"
                  title="JSR 包页"
                  aria-label="JSR 包页"
                  className={docsMobileSheetIconLinkClass}
                  onClick={closeMenu}
                >
                  <IconExternalLink class="h-5 w-5" aria-hidden />
                </Link>
                <Link
                  href="https://github.com/shuliangfu/ui-view"
                  target="_blank"
                  title="GitHub 仓库"
                  aria-label="GitHub 仓库"
                  className={docsMobileSheetIconLinkClass}
                  onClick={closeMenu}
                >
                  <IconBrandGithub class="h-5 w-5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}

function DocsSiteTopBar() {
  return (
    <div class="shrink-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md supports-backdrop-filter:bg-white/70 dark:supports-backdrop-filter:bg-slate-900/70">
      <NavBar
        menuAlign="right"
        sticky={false}
        border={false}
        blur={false}
        containerMaxWidth="full"
        containerClass="max-w-[1800px] mx-auto !px-0 sm:!px-0 lg:!px-0 pr-3 sm:pr-6 lg:pr-8"
        class="border-0 bg-transparent shadow-none backdrop-blur-none dark:bg-transparent dark:shadow-none"
        center={
          <div class="md:hidden">
            <DocsSiteBrand />
          </div>
        }
        brand={
          <div class="hidden w-72 shrink-0 items-center justify-center md:flex md:-translate-x-8">
            <DocsSiteBrand />
          </div>
        }
        start={
          <Show when={() => docsNavSidebarAttached.value}>
            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
              onClick={() => {
                docsNavDrawerOpen.value = true;
              }}
              aria-label="打开文档导航菜单"
            >
              <IconMenu class="h-6 w-6" aria-hidden />
            </button>
          </Show>
        }
        nav={
          <div class="flex min-h-0 min-w-0 w-full flex-1 items-center max-md:pointer-events-none md:justify-end">
            <div class="hidden shrink-0 items-center gap-0.5 sm:gap-1 md:flex">
              <Link href="/desktop" className={docsNavPartitionLinkClass}>
                桌面版
              </Link>
              <Link href="/mobile" className={docsNavPartitionLinkClass}>
                移动版
              </Link>
            </div>
          </div>
        }
        end={
          <>
            <DocsMobileTopSheet />
            <div class="hidden md:contents">
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
            </div>
          </>
        }
      />
    </div>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div class="h-full min-h-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <DocsSiteTopBar />

      <div class="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>

      <ToastContainer />
      <MessageContainer />
      <NotificationContainer />
    </div>
  );
}
