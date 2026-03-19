/**
 * 应用配置
 * 框架会自动加载本文件
 * 完整配置项说明见文档: docs/zh-CN/APP_CONFIG.md
 */
import type { AppConfig } from "@dreamer/dweb";

const config: AppConfig = {
  // ========== Basic ==========
  name: "docs",
  version: "1.0.0",
  /** 框架语言（根据用户环境自动检测，可改为 "en-US"） （init 时按环境检测，可改为 zh-CN / en-US） */
  language: "zh-CN",

  // envPrefix: "APP_",
  hotReload: true,

  // ========== Plugin manager (optional) ==========
  // pluginManagerOptions: {
  //   autoActivate: false,
  //   continueOnError: true,
  //   enableHotReload: false,
  //   hotReloadInterval: 1000,
  // },

  // ========== Server ==========
  // host / port 在 main.dev.ts（127.0.0.1:3000）与 main.prod.ts（0.0.0.0:3000）中配置
  server: {
    // dev: {
    //   hmr: { enabled: true, path: "/__hmr" },
    //   watch: {
    //     paths: ["./src"],
    //     ignore: ["node_modules", ".git", "dist"],
    //   },
    // },
    // mode: "dev",
    // onListen: ({ host, port }) => { console.log(`http://${host}:${port}`); },
    // onError: (error) => { console.error(error); return new Response("Error", { status: 500 }); },
    // debug: false,
    // shutdownTimeout: 10000,
  },

  // ========== Router ==========
  router: {
    routesDir: "./src/routes",
    // apiMode: "restful",
    // redirects: [{ source: "/old", destination: "/new", permanent: true }],
    // skipAppValidation: false,
  },

  // ========== Render ==========
  // 完整说明见 docs/zh-CN/APP_CONFIG.md 或 docs/en-US/APP_CONFIG.md（含 SSR/SSG 客户端激活）
  render: {
    engine: "view",
    mode: "hybrid",
    // debug: false,
    /** 关闭客户端激活：不注入 _client.js，仅输出服务端 HTML，链接点击整页跳转，可避免刷新时 hydrate 导致的闪动 */
    // ssr: {
    //   // hydrate: false,
    // },
    // ssg: {
    //   outputDir: "dist/static",
    //   routes: ["/", "/about"],
    //   /** 支持路径段（/user/[id]→/user/1）与 query（/user?id=[id]→/user?id=1）两种形式 */
    //   dynamicRoutes: { "/user/[id]": ["1", "2", "3"] }, // 或 "/user?id=[id]": ["1", "2", "3"]
    //   hydrate: true,
    // },
  },

  // ========== Build ==========
  build: {
    server: {
      useNativeCompile: false,
      // entry: "src/main.ts",
      // output: "dist",
      // target: "deno",
      // compile: { minify: true, sourcemap: true, platform: ["linux", "darwin", "windows"] },
      // external: ["tailwindcss", "lightningcss"],
      // externalNpm: true,
      // excludePaths: ["node_modules", ".bun/install"],
      // debug: false,
    },
    /** 客户端构建：alias 让打包器解析 @dreamer/ui-view 为上一级 ui-view 的 src（docs 在 ui-view 下） */
    client: {
      output: "dist/client",
      engine: "view",
      bundle: {
        alias: {
          "@dreamer/ui-view": "../src/mod.ts",
        },
      },
    },
    // client: { entry: "...", output: "dist/client", engine: "view", bundle: {}, html: {}, sourcemap: true, debug: false },
    // assets: { css: { extract: true, minify: true, autoprefix: true }, images: {}, publicDir: "public", assetsDir: "assets" },
    // build: { mode: "prod", clean: true, cache: true, incremental: true, silent: false, logLevel: "info" },
  },

  // ========== Logger ==========
  logger: {
    level: "info",
    format: "text",
    output: {
      console: true,
      file: {
        path: "runtime/logs/app.log",
        rotate: true,
        strategy: "size",
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
    },
    // color: true,
    // showTime: true,
    // showLevel: true,
    // tags: ["app"],
    // filter: { includeTags: ["app", "http"], excludeTags: ["debug"] },
    // maxMessageLength: 32 * 1024,
  },
  // ========== Database (optional; uncomment and configure to use) ==========
  // database: {
  //   default: {
  //     adapter: "sqlite",
  //     connection: { filename: "./data.db" },
  //   },
  //   // or postgresql: connection: { host, port, database, username, password }
  //   // connections: { read: { ... }, mongodb: { ... } },
  //   // managerOptions: {},
  // },

  // ========== Socket / WebSocket (optional) ==========
  // socket: {
  //   adapter: "socketio",
  //   config: { path: "/socket.io/", allowCORS: true, pingTimeout: 20000, pingInterval: 25000, transports: ["websocket", "polling"], allowPolling: true, debug: false },
  // },
  // socket: { adapter: "websocket", config: { path: "/ws", pingTimeout: 60000, pingInterval: 30000, debug: false } },

  // ========== Session (optional; @dreamer/session; requires store, e.g. createFileStore) ==========
  // session: {
  //   store: createFileStore(await getDreamerDwebCacheDir(), "sessions"),
  //   name: "sid",
  //   maxAge: 86400,
  //   cookie: { path: "/", httpOnly: true, secure: false, sameSite: "lax" },
  //   autoSave: true,
  // },

  // ========== Plugins (optional) ==========
  // plugins: [
  //   "./plugins/auth-plugin.ts",
  //   { name: "custom-plugin", version: "1.0.0", dependencies: [], config: {}, async onInit(container) {}, async onRequest(ctx, container) {} },
  // ],

  // ========== Middlewares (optional) ==========
  // middlewares: [
  //   { middleware: async (_req, _res, next) => { await next(); }, name: "request-logger" },
  //   "./middlewares/cors.ts",
  //   { middleware: "./middlewares/auth.ts", condition: (req) => req.url.startsWith("/admin"), name: "admin-auth" },
  // ],
};

export default config;
