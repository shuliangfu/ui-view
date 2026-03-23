/**
 * 开发环境配置
 * 只需写增量覆盖，框架会自动与 main.ts 深度合并
 */
export default {
  server: {
    host: "127.0.0.1",
    port: 3000,
    dev: {
      hmr: { enabled: true, path: "/__hmr" },
      watch: {
        paths: ["./src", "../src"],
        ignore: ["node_modules", ".git", "dist"],
      },
    },
  },
  logger: {
    level: "debug",
    format: "text",
  },
  hotReload: true,

  render: {
    // debug: true,
  },
  // 服务端 match 调试 + 浏览器 [@dreamer/router/client:click]（由 dweb 注入 __DWEB_ROUTER_DEBUG__，与 render.debug 无关）
  // router: { debug: true },
};
