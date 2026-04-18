/**
 * ConfigProvider 全局配置（View）。
 * 为子树提供主题、语言、组件默认尺寸等；子组件可通过 getConfig() 读取。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
import type { SizeVariant } from "../types.ts";
import { setConfig } from "./config-store.ts";
import type { ConfigProviderConfig, ThemeMode } from "./config-store.ts";

export type { ConfigProviderConfig, ThemeMode } from "./config-store.ts";
export { getConfig } from "./config-store.ts";

/**
 * `config` 属性接受的批量配置；`themeMode` 与 {@link ConfigProviderConfig.theme} 同义，便于与业务侧命名对齐。
 */
export type ConfigProviderBatchConfig = Partial<
  ConfigProviderConfig & {
    /** 与 `theme` 同义，写入全局时映射为 `theme` */
    themeMode?: ThemeMode;
  }
>;

export interface ConfigProviderProps {
  /**
   * 批量传入 theme / locale / componentSize / prefixCls（及 themeMode）。
   * 与顶层 `theme`、`locale` 等可同时使用：**顶层 props 优先**。
   */
  config?: ConfigProviderBatchConfig;
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

/**
 * 合并 `config` 与顶层 props，并将 `themeMode` 规范为 `theme` 写入 store。
 */
function resolveConfigProviderFields(props: ConfigProviderProps): {
  theme: ThemeMode;
  locale: string | undefined;
  componentSize: SizeVariant | undefined;
  prefixCls: string | undefined;
} {
  const batch = props.config;
  const themeFromBatch = batch?.theme ?? batch?.themeMode;
  const theme = props.theme ?? themeFromBatch ?? "light";
  return {
    theme,
    locale: props.locale ?? batch?.locale,
    componentSize: props.componentSize ?? batch?.componentSize,
    prefixCls: props.prefixCls ?? batch?.prefixCls,
  };
}

export function ConfigProvider(props: ConfigProviderProps): JSXRenderable {
  const { children, class: className } = props;
  const { theme, locale, componentSize, prefixCls } =
    resolveConfigProviderFields(props);

  setConfig({
    theme,
    locale,
    componentSize,
    prefixCls,
  });

  const resolvedTheme = theme === "system"
    ? (typeof globalThis.matchMedia !== "undefined" &&
        globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
    : theme;
  const themeClass = resolvedTheme === "dark" ? "dark" : "";

  /** 直接返回 VNode，与 @dreamer/view 及 shared/basic、charts 约定一致 */
  return (
    <div
      class={twMerge("config-provider", themeClass, className)}
      data-theme={resolvedTheme}
      data-locale={locale ?? undefined}
    >
      {children}
    </div>
  );
}
