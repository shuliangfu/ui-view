/**
 * 服务端入口
 * View + @dreamer/dweb
 * 配置由框架自动加载，无需手动导入合并
 */

import { App } from "@dreamer/dweb";
import { uiViewTailwindPlugin } from "@dreamer/ui-view/plugin";
import { staticPlugin } from "@dreamer/plugins/static";
import { themePlugin } from "@dreamer/plugins/theme";
import { tailwindPlugin } from "@dreamer/plugins/tailwindcss";
import {
  deleteExpiredUploadFiles,
  startUploadCleanupScheduler,
} from "./routes/api/upload/cleanup-schedule.ts";

const app = new App();

/** 先注册：收集 @dreamer/ui-view 引用并生成 @source 文件，供 tailwind.css @import */
app.registerPlugin(uiViewTailwindPlugin({
  outputPath: "src/assets/ui-view-sources.css",
  scanPath: "src",
}));

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
  cookieName: "ui-view-docs-theme",
  injectScript: true,
}));

app.registerPlugin(staticPlugin({
  statics: [
    { root: "src/assets", prefix: "/assets" },
    { root: "dist/client/assets", prefix: "/assets" },
  ],
}));

void app.start().then(() => {
  // 演示上传目录：约 10 分钟前的文件由 cleanup-schedule 每分钟扫描删除
  startUploadCleanupScheduler();
  void deleteExpiredUploadFiles();
});
