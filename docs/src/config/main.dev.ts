import { getEnv } from "@dreamer/runtime-adapter";

/**
 * 开发环境配置
 * 只需写增量覆盖，框架会自动与 main.ts 深度合并
 */

/** 由 docs 浏览器 E2E（`tests/docs-browser/helpers.ts` 启动子进程时注入）关闭 HMR/watch，减轻长跑自动化负载 */
const docsBrowserE2e = getEnv("UI_VIEW_DOCS_BROWSER_E2E") === "1";

/** 与 dweb 示例一致：`PORT` 供 e2e 指定端口，避免占用时子进程与探测 URL 不一致 */
const portRaw = getEnv("PORT")?.trim();
const serverPort =
  portRaw !== undefined && /^\d+$/.test(portRaw) && Number(portRaw) > 0
    ? Number(portRaw)
    : 3000;

export default {
  server: {
    host: "127.0.0.1",
    port: serverPort,
    dev: docsBrowserE2e
      ? {
        /** 关闭 HMR WebSocket 与 HTML 注入，减轻 Playwright 大量页面负载 */
        hmr: { enabled: false },
        /**
         * `paths` 为空时不启动 watchFs（见 @dreamer/server DevTools），
         * 避免 e2e 期间仍监听 `../src` 等目录触发无意义重建。
         */
        watch: { paths: [] },
      }
      : {
        hmr: { enabled: true, path: "/__hmr" },
        watch: {
          paths: ["./src", "../src"],

          ignore: ["node_modules", ".git", "dist", "ui-view-sources.css"],
        },
      },
  },
  logger: {
    level: docsBrowserE2e ? "error" : "debug",
    format: "text",
  },
  hotReload: !docsBrowserE2e,

  render: {
    // debug: true,
  },
  // 服务端 match 调试 + 浏览器 [@dreamer/router/client:click]（由 dweb 注入 __DWEB_ROUTER_DEBUG__，与 render.debug 无关）
  // router: { debug: true },
};
