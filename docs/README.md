# @dreamer/ui-view 文档站

基于 `@dreamer/dweb` + `@dreamer/view`（hybrid）的组件库文档与示例。

## 本地运行

```bash
cd docs
deno task dev
```

默认开发地址见 `src/config/main.dev.ts`（一般为 `http://127.0.0.1:3000`）。

## 构建

```bash
deno task build
deno task start
```

## 结构说明

| 路径                      | 说明                                                   |
| ------------------------- | ------------------------------------------------------ |
| `src/routes/_layout.tsx`  | 全站顶栏、页脚、主题切换                               |
| `src/routes/index.tsx`    | 首页 `/`                                               |
| `src/routes/desktop/`     | 桌面组件文档与侧栏 `_layout.tsx`                       |
| `src/routes/mobile/`      | 移动组件文档（`/mobile`）与侧栏                        |
| `src/assets/tailwind.css` | Tailwind v4 入口 + `@import` ui-view-sources           |
| `src/config/main.ts`      | 应用配置（含客户端 `alias` 指向上一级 `ui-view` 源码） |

移动端路由此前缺失会导致顶栏「移动版」链到空页；现已补全与 `src/mobile`
导出一致的示例页。
