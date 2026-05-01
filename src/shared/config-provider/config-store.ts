/**
 * ConfigProvider 全局配置存储。
 * 供 ConfigProvider 写入、子组件通过 getConfig() 读取（主题、语言、组件默认尺寸等）。
 *
 * 使用 Signal 实现响应式：当 ConfigProvider 更新配置时，所有通过 getConfig() 订阅的组件会自动重渲染。
 */

import { createSignal } from "@dreamer/view";
import type { SizeVariant } from "../types.ts";

export type ThemeMode = "light" | "dark" | "system";

export interface ConfigProviderConfig {
  /** 主题：light / dark / system（system 依 prefers-color-scheme 或未设置则 light） */
  theme?: ThemeMode;
  /** 语言/地区，如 zh-CN、en-US */
  locale?: string;
  /** 组件默认尺寸（如 Button、Input） */
  componentSize?: SizeVariant;
  /** 自定义前缀 class（如 ant- 风格时用 ant-btn） */
  prefixCls?: string;
}

/** 全局配置 Signal（响应式） */
const configSignal = createSignal<ConfigProviderConfig>({});

/**
 * 获取当前全局配置（由最近的 ConfigProvider 设置）。
 * 响应式：在 Signal 追踪上下文中调用会自动订阅配置变更。
 */
export function getConfig(): Readonly<ConfigProviderConfig> {
  return configSignal.value;
}

/**
 * 判断两处配置是否一致（仅比较已知字段），避免无意义的 signal 写入。
 *
 * @remarks
 * ConfigProvider 在**每次渲染**都会调用 setConfig；若无条件 `value = {...}`，
 * 则每次都会通知订阅者。文档页等场景会在 JSX 中直接调用 `getConfig()`，
 * 从而订阅全局配置 → 重渲染 → ConfigProvider 再渲染 → **无限更新**，
 * 浏览器主线程占满，外部表现为 E2E 导航「卡住」、esbuild 并发异常等。
 */
function configFieldsEqual(
  a: ConfigProviderConfig,
  b: ConfigProviderConfig,
): boolean {
  return (
    Object.is(a.theme, b.theme) &&
    Object.is(a.locale, b.locale) &&
    Object.is(a.componentSize, b.componentSize) &&
    Object.is(a.prefixCls, b.prefixCls)
  );
}

/**
 * 设置全局配置（供 ConfigProvider 内部调用）。
 * 仅在字段相对当前值有变化时写入 Signal，避免无谓的通知与渲染循环。
 */
export function setConfig(config: ConfigProviderConfig): void {
  const next = { ...config };
  if (configFieldsEqual(configSignal.value, next)) {
    return;
  }
  configSignal.value = next;
}
