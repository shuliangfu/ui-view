/**
 * ConfigProvider 与全局配置（ANALYSIS 3.10）。
 * ConfigProvider 直接返回 VNode（与 @dreamer/view 及 shared/basic 约定一致）。
 */
export { ConfigProvider } from "./ConfigProvider.tsx";
export type {
  ConfigProviderBatchConfig,
  ConfigProviderProps,
} from "./ConfigProvider.tsx";
export { getConfig, setConfig } from "./config-store.ts";
export type { ConfigProviderConfig, ThemeMode } from "./config-store.ts";
