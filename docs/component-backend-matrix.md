# ui-view 组件 × 后台能力矩阵（2026-11-07 DIG）

## ① 须走后台

| 组件 | 后台能力 | 建议插件路由／挂载 |
|------|----------|-------------------|
| **Upload**（shared／desktop／mobile） | 分片 `init`／`chunk`／`complete`／`abort`／`status`；可选 `virusScan`；可选双档 AVIF；鉴权；文件下载 | `uiViewUploadPlugin`（**必填** `localDir`，禁隐式默认）→ `AppConfig.upload`（Handler 默认 `/ui-view-upload/*`，可 `basePath` 覆盖）＋`virusScan`；`onRequest` → `GET /ui-view-upload/file?key=`；`onStart` wrap → `afterComplete`／`image.dual` → `{url,thumbUrl}` |
| RichTextEditor／MarkdownEditor 插图 | **可选** `uploadAction`（推荐 `/ui-view-upload`＝`DEFAULT_UI_VIEW_UPLOAD_BASE_PATH`）／`onUploadImage`／`onPasteImage`；皆无则 dataURL | 可设路由对齐 `uiViewUploadPlugin.basePath`；走 `${uploadAction}/init|chunk|complete`；**勿**写死 `/upload` |
| SignaturePad | **可选** 业务把 `toDataURL` 上传 | 复用 Upload |

> WS／登录／客服 API **不**属 ui-view 组件面，留业务仓（如 dweb-admin）。

## ② 纯前端（大类＋例外）

- **basic**：Avatar Badge Button FloatButton Icon Link Skeleton Spinner Typography（icons 全量；Tailwind 经 `mergeIntrinsicIconSources`）
- **form**（除 Upload）：AutoComplete Cascader Checkbox* ColorPicker Date* Form* Input* Mentions MultiSelect Password Radio* Rate Search Select Slider Switch Textarea TimePicker Transfer TreeSelect；mobile：NumberKeyboard PasscodeInput SignaturePad（本地画布）
- **data-display**：Calendar Card Carousel Cell CodeBlock Collapse Comment CountDown Descriptions Empty Image ImageViewer List QRCode Segmented Statistic Tag Timeline Tree VirtualList Watermark；desktop DataPanel／Table；mobile ScrollList
- **feedback**：Alert ContextMenu Dialog Drawer Message Modal（`constrainToViewport` 默认 true，拖动不出可视区）NoticeBar Notification Overlay Popconfirm Popover Progress Result Toast Tooltip Tour；mobile ActionSheet BottomSheet FloatingPanel PullRefresh ShareSheet SwipeCell
- **layout／navigation／charts／config-provider**：全部纯前端（charts＝Chart.js 客户端）
- **例外**：上述「可选回调」可由业务接远程，组件本身不绑死路由

## ③ 现有插件 vs 缺口

| 项 | 状态 |
|----|------|
| `uiViewTailwindPlugin`＋COMPONENT_PATHS | 已有；Nov5–7 缺表已补 |
| `uiViewUploadPlugin` **必填** `localDir`／dual／afterComplete | 已有；缺 `localDir` 挂载抛错 |
| `virusScan` 透传到 Handler | **已补**（本刀） |
| `GET /ui-view-upload/file`（默认前缀；勿 `/upload`） | **已收进**插件 `onRequest`；admin 薄跟显式 `localDir`＋前缀 |
| WS／鉴权路由进 ui-view | **不做**（非组件后台面） |

## ④ 拟／已收进插件的路由

- **已收**：默认 `/ui-view-upload/init|chunk|complete|abort|status`（via dweb `AppConfig.upload`＋Handler；`basePath` 可覆盖）；`GET /ui-view-upload/file?key=`（`uiViewUploadPlugin.onRequest`）
- **必填**：`localDir`（应用显式传入；插件无隐式默认目录）
- **顺序**：complete（含可选 virusScan）→ afterComplete（业务）→ dual → `{url,thumbUrl}`
- **不收**：客服 WS、`/cs/*`、登录——留 dweb-admin

## ⑤ 本批 API 备忘（2026-11-07）

- **Modal**：`constrainToViewport`／`keepInView` 默认 **true**（仅 `draggable` 时生效）
- **uiViewUploadPlugin**：`localDir` **必填**；默认 `basePath=/ui-view-upload`；`virusScan` 透传；`GET ${basePath}/file?key=`
- **RichText／Markdown**：可设 `uploadAction` 对齐插件 `basePath`（推荐 `DEFAULT_UI_VIEW_UPLOAD_BASE_PATH`）
