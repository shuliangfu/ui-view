/**
 * NavBar 顶栏导航（View，桌面/通用）。
 * 用于页面顶部：左侧品牌、中间/右侧导航链接、右侧操作区；支持 sticky、边框、毛玻璃。
 * 内部使用 Container 控制最大宽度，适合与 Link、Divider、图标等组合。
 */

import { twMerge } from "tailwind-merge";
import { Container } from "../../shared/layout/Container.tsx";
import type { ContainerSize } from "../../shared/layout/Container.tsx";

export interface NavBarProps {
  /** 左侧品牌区（如 logo + 名称） */
  brand?: unknown;
  /** 导航区（主链接、可选 Divider + 控件） */
  nav?: unknown;
  /** 菜单对齐方式：左 / 中 / 右，默认 "right" */
  menuAlign?: "left" | "center" | "right";
  /** 右侧操作区（如主题切换、外链图标） */
  end?: unknown;
  /** 内层容器最大宽度，默认 "xl" */
  containerMaxWidth?: ContainerSize;
  /** 是否粘性顶栏，默认 true */
  sticky?: boolean;
  /** 是否显示下边框，默认 true */
  border?: boolean;
  /** 是否毛玻璃背景，默认 true */
  blur?: boolean;
  /** 额外 class（应用在 <header> 上） */
  class?: string;
  /** 内层容器额外 class（应用在 Container 内的 flex 容器上） */
  containerClass?: string;
}

const defaultHeaderClass =
  "z-50 border-slate-200 bg-white/98 dark:border-slate-700/80 dark:bg-slate-900/98 shadow-sm shadow-slate-200/50 dark:shadow-slate-950/50 backdrop-blur-md";
const defaultContainerInnerClass =
  "flex h-16 w-full items-center justify-between gap-6";

/**
 * 顶栏导航组件。渲染语义化 <header>，内层为 Container + 三区布局：brand | nav | end。
 */
export function NavBar(props: NavBarProps) {
  const {
    brand,
    nav,
    menuAlign = "right",
    end,
    containerMaxWidth = "xl",
    sticky = true,
    border = true,
    blur = true,
    class: className,
    containerClass,
  } = props;

  const menuJustifyClass = menuAlign === "center"
    ? "justify-center"
    : menuAlign === "right"
    ? "justify-end"
    : "justify-start";

  const headerClass = twMerge(
    "border-b",
    border && "border-slate-200 dark:border-slate-700/80",
    sticky && "sticky top-0",
    blur && defaultHeaderClass,
    className,
  );

  const innerClass = twMerge(defaultContainerInnerClass, containerClass);

  return (
    <header class={headerClass} role="banner">
      <Container maxWidth={containerMaxWidth} class={innerClass}>
        {brand != null && <div class="shrink-0">{brand}</div>}
        {nav != null && (
          <nav
            class={twMerge(
              "flex flex-1 min-w-0 items-center gap-1",
              menuJustifyClass,
            )}
            aria-label="主导航"
          >
            {nav}
          </nav>
        )}
        {end != null && (
          <div class="flex items-center gap-1 shrink-0">{end}</div>
        )}
      </Container>
    </header>
  );
}
