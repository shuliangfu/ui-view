/**
 * ConfigProvider 配置存储单元测试：getConfig、setConfig。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  type ConfigProviderConfig,
  getConfig,
  setConfig,
  type ThemeMode,
} from "../../src/shared/config-provider/config-store.ts";

describe("config-store", () => {
  it("初始 getConfig 返回空对象或默认", () => {
    setConfig({});
    const c = getConfig();
    expect(c).toBeDefined();
    expect(typeof c).toBe("object");
  });

  it("setConfig 后 getConfig 返回相同配置", () => {
    const config: ConfigProviderConfig = {
      theme: "dark" as ThemeMode,
      locale: "zh-CN",
      componentSize: "md",
    };
    setConfig(config);
    const c = getConfig();
    expect(c.theme).toBe("dark");
    expect(c.locale).toBe("zh-CN");
    expect(c.componentSize).toBe("md");
  });

  it("getConfig 返回新对象，与 setConfig 传入内容一致", () => {
    setConfig({ theme: "light" as ThemeMode });
    const c = getConfig();
    expect(c.theme).toBe("light");
  });

  it("setConfig 覆盖全部", () => {
    setConfig({ theme: "dark" as ThemeMode, locale: "en-US" });
    setConfig({ theme: "system" as ThemeMode });
    const c = getConfig();
    expect(c.theme).toBe("system");
    expect(c.locale).toBeUndefined();
  });
});
