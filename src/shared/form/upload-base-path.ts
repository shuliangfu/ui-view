/**
 * 已挂载 {@link uiViewUploadPlugin}（非 standalone）时，把主插件 `basePath` 告诉前端。
 * 未挂插件时不设值，Upload／富文本保持原来的显式 `action`／data URL 行为。
 */

/** 与服务端插件默认 `basePath` 对齐，勿写死 `/upload`。 */
export const DEFAULT_UI_VIEW_UPLOAD_BASE_PATH = "/ui-view-upload";

/**
 * 未指定 init `path` 时，自动走插件的对象键前缀（落在 `localDir/files/`）。
 * 头像、学习资料等专用目录请显式传 `path` 或用独立 `basePath`。
 */
export const DEFAULT_UI_VIEW_UPLOAD_OBJECT_PATH = "files";

export const UI_VIEW_UPLOAD_BASE_PATH_GLOBAL = "__UI_VIEW_UPLOAD_BASE_PATH__";

export const UI_VIEW_UPLOAD_BASE_PATH_META = "ui-view-upload-base-path";

/** 只允许相对站点根的简单路径，避免注入脚本。 */
export function isSafeUiViewUploadBasePath(path: string): boolean {
  return /^\/[A-Za-z0-9._~/-]+$/.test(path) && !path.includes("..");
}

export function normalizeUiViewUploadBasePath(path: string): string {
  const t = path.trim().replace(/\/+$/, "");
  return t || DEFAULT_UI_VIEW_UPLOAD_BASE_PATH;
}

export function setConfiguredUiViewUploadBasePath(
  path: string | undefined,
): void {
  const g = globalThis as Record<string, unknown>;
  if (path == null || !String(path).trim()) {
    delete g[UI_VIEW_UPLOAD_BASE_PATH_GLOBAL];
    return;
  }
  const n = normalizeUiViewUploadBasePath(path);
  if (!isSafeUiViewUploadBasePath(n)) return;
  g[UI_VIEW_UPLOAD_BASE_PATH_GLOBAL] = n;
}

export function getConfiguredUiViewUploadBasePath(): string | undefined {
  const g = globalThis as Record<string, unknown>;
  const v = g[UI_VIEW_UPLOAD_BASE_PATH_GLOBAL];
  if (typeof v === "string" && v.trim()) {
    const n = normalizeUiViewUploadBasePath(v);
    return isSafeUiViewUploadBasePath(n) ? n : undefined;
  }
  const doc = (globalThis as {
    document?: {
      querySelector?: (
        sel: string,
      ) => { getAttribute?: (n: string) => string | null } | null;
    };
  }).document;
  const el = doc?.querySelector?.(
    `meta[name="${UI_VIEW_UPLOAD_BASE_PATH_META}"]`,
  );
  const c = el?.getAttribute?.("content")?.trim();
  if (c) {
    const n = normalizeUiViewUploadBasePath(c);
    return isSafeUiViewUploadBasePath(n) ? n : undefined;
  }
  return undefined;
}

/**
 * 显式 `action`／`uploadAction` 优先；否则用已挂载主插件的 `basePath`。
 */
export function resolveUiViewUploadAction(action?: string): string | undefined {
  const explicit = (action ?? "").trim();
  if (explicit) return explicit;
  return getConfiguredUiViewUploadBasePath();
}

/**
 * 仅当应走 `uiViewUploadPlugin` 的路径协议（`/init|chunk|complete`）时返回 basePath。
 * 其它显式 `action`（如文档站 `/api/upload`）仍走 `?phase=`／整文件协议。
 */
export function resolveUiViewUploadPluginBase(
  action?: string,
): string | undefined {
  const configured = getConfiguredUiViewUploadBasePath();
  const explicit = (action ?? "").trim();
  if (!explicit) return configured;
  const n = normalizeUiViewUploadBasePath(explicit);
  if (!isSafeUiViewUploadBasePath(n)) return undefined;
  if (configured) return n === configured ? n : undefined;
  return n === DEFAULT_UI_VIEW_UPLOAD_BASE_PATH ? n : undefined;
}

/** 把主插件 `basePath` 写入 HTML，供浏览器端 {@link getConfiguredUiViewUploadBasePath} 读取。 */
export function injectUiViewUploadBasePathHtml(
  html: string,
  basePath: string,
): string {
  const n = normalizeUiViewUploadBasePath(basePath);
  if (!isSafeUiViewUploadBasePath(n)) return html;
  if (
    html.includes(`name="${UI_VIEW_UPLOAD_BASE_PATH_META}"`) ||
    html.includes(UI_VIEW_UPLOAD_BASE_PATH_GLOBAL)
  ) {
    return html;
  }
  const snippet =
    `<meta name="${UI_VIEW_UPLOAD_BASE_PATH_META}" content="${n}">` +
    `<script>window.${UI_VIEW_UPLOAD_BASE_PATH_GLOBAL}=${
      JSON.stringify(n)
    };</script>`;
  const lower = html.toLowerCase();
  const headClose = lower.lastIndexOf("</head>");
  if (headClose >= 0) {
    return html.slice(0, headClose) + snippet + html.slice(headClose);
  }
  const bodyClose = lower.lastIndexOf("</body>");
  if (bodyClose >= 0) {
    return html.slice(0, bodyClose) + snippet + html.slice(bodyClose);
  }
  return snippet + html;
}
