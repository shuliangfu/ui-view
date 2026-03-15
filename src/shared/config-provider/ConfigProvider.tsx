/**
 * ConfigProvider 全局配置（View）。
 * 为子树提供主题、语言、组件默认尺寸等；子组件可通过 getConfig() 读取。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";
import { setConfig } from "./config-store.ts";
import type { ThemeMode } from "./config-store.ts";

export type { ConfigProviderConfig, ThemeMode } from "./config-store.ts";
export { getConfig } from "./config-store.ts";

export interface ConfigProviderProps {
  /** 主题：light / dark / system；system 时依 prefers-color-scheme，无则 light */
  theme?: ThemeMode;
  /** 语言/地区，如 zh-CN、en-US */
  locale?: string;
  /** 组件默认尺寸（如 Button、Input 的 size） */
  componentSize?: SizeVariant;
  /** 自定义 class 前缀（可选） */
  prefixCls?: string;
  /** 子节点 */
  children?: unknown;
  /** 额外 class（作用于包装 div） */
  class?: string;
}

export function ConfigProvider(props: ConfigProviderProps) {
  const {
    theme = "light",
    locale,
    componentSize,
    prefixCls,
    children,
    class: className,
  } = props;

  setConfig({
    theme,
    locale,
    componentSize,
    prefixCls,
  });

  const resolvedTheme = theme === "system"
    ? (typeof globalThis.matchMedia !== "undefined" && globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  const themeClass = resolvedTheme === "dark" ? "dark" : "";

  return () => (
    <div
      class={twMerge("config-provider", themeClass, className)}
      data-theme={resolvedTheme}
      data-locale={locale ?? undefined}
    >
      {children}
    </div>
  );
}
