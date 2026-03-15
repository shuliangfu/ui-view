/**
 * 服务端入口
 * View + @dreamer/dweb
 * 配置由框架自动加载，无需手动导入合并
 */

import { App } from "@dreamer/dweb";
import { staticPlugin } from "@dreamer/plugins/static";
import { themePlugin } from "@dreamer/plugins/theme";
import { tailwindPlugin } from "@dreamer/plugins/tailwindcss";

const app = new App();

app.registerPlugin(tailwindPlugin({
  output: "dist/client/assets",
  cssEntry: "src/assets/tailwind.css",
  assetsPath: "/assets",
}));

/** 主题插件：在 onResponse 中向 <head> 注入防闪脚本并依 cookie 设置 html class，cookieName 需与 _client 中绑定一致 */
app.registerPlugin(themePlugin({
  defaultMode: "light",
  strategy: "class",
  darkClass: "dark",
  cookieName: "ui-view-examples-theme",
  injectScript: true,
}));

app.registerPlugin(staticPlugin({
  statics: [
    { root: "src/assets", prefix: "/assets" },
    { root: "dist/client/assets", prefix: "/assets" },
  ],
}));

app.start();
