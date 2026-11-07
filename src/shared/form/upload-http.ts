/**
 * Upload 自动模式下的 HTTP 实现：整文件 multipart、或同一 `action` 上 `phase=init|chunk|complete` 分片协议。
 * 与 {@link Upload} 的 `action` 搭配使用；业务后端需按文档实现对应接口，或改用自定义 `requestUpload`。
 */

import {
  DEFAULT_UPLOAD_CHUNK_SIZE,
  runChunkedUpload,
} from "./chunked-upload.ts";

/**
 * 与 {@link uiViewUploadPlugin} 默认 `basePath` 对齐的上传路由前缀。
 * RichText／Markdown／Upload 示例请用此常量，**勿**写死 `/upload`。
 */
export const DEFAULT_UI_VIEW_UPLOAD_BASE_PATH = "/ui-view-upload";


/**
 * 在 `action` URL 上设置查询参数 `phase`（保留已有 query）。
 *
 * @param action 绝对或相对上传地址
 * @param phase init | chunk | complete
 */
export function uploadActionWithPhase(action: string, phase: string): string {
  try {
    const base =
      typeof globalThis.location !== "undefined" && globalThis.location?.href
        ? globalThis.location.href
        : "http://localhost/";
    const u = new URL(action, base);
    u.searchParams.set("phase", phase);
    return u.toString();
  } catch {
    const sep = action.includes("?") ? "&" : "?";
    return `${action}${sep}phase=${encodeURIComponent(phase)}`;
  }
}

/**
 * 默认从响应解析要写入表单的值（通常为文件 URL）：
 * JSON 的 `url` 或 `data.url`，否则使用响应纯文本（trim）。
 *
 * @param res 已 `ok` 的 Response
 */
export async function defaultGetUploadResultUrl(
  res: Response,
): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = (await res.json()) as Record<string, unknown>;
    const top = j.url;
    if (typeof top === "string" && top.length > 0) return top;
    const data = j.data;
    if (data != null && typeof data === "object") {
      const u = (data as Record<string, unknown>).url;
      if (typeof u === "string" && u.length > 0) return u;
    }
    throw new Error("Upload response JSON missing url");
  }
  const t = (await res.text()).trim();
  if (t.length > 0) return t;
  throw new Error("Upload response body empty");
}

/**
 * 发起 fetch，非 2xx 时抛出带状态与片段正文的 Error。
 *
 * @param url 请求 URL
 * @param init fetch 选项
 */
export async function uploadFetchOk(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText}${body ? `: ${body.slice(0, 240)}` : ""}`,
    );
  }
  return res;
}

export interface UploadSimpleRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  fileFieldName?: string;
  signal?: AbortSignal;
  getValueFromResponse?: (res: Response) => Promise<string>;
}

/**
 * 整文件 multipart 上传：`FormData` 单一文件字段。
 *
 * @param action 上传地址
 * @param file 浏览器 File
 * @param options 方法、头、credentials、字段名、中止与解析
 */
export async function uploadFileSimple(
  action: string,
  file: File,
  options: UploadSimpleRequestOptions = {},
): Promise<string> {
  const {
    method = "POST",
    headers,
    withCredentials,
    fileFieldName = "file",
    signal,
    getValueFromResponse = defaultGetUploadResultUrl,
  } = options;
  const fd = new FormData();
  fd.set(fileFieldName, file);
  const res = await uploadFetchOk(action, {
    method,
    body: fd,
    headers,
    credentials: withCredentials ? "include" : "same-origin",
    signal,
  });
  return getValueFromResponse(res);
}

export interface UploadChunkedPhasedOptions {
  method?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  chunkSize?: number;
  signal?: AbortSignal;
  onProgress?: (loaded: number, total: number) => void;
  getValueFromResponse?: (res: Response) => Promise<string>;
}

/**
 * 分片上传：同一 `action` 上 `phase=init|chunk|complete`，协议与 `@dreamer/upload/server`
 * 中 `MultipartUploadHandler` / `createMultipartUploadHandler` 一致（可配本地磁盘适配器或 S3/OSS/COS）。
 *
 * - `phase=init`：JSON `{ filename, fileSize, mimeType, chunks }`（`chunks` 为分片数量）→ `{ uploadId, key }`
 * - `phase=chunk`：`FormData`：`uploadId`、`key`、`index`（从 0 起）、`file`（分片 Blob）
 * - `phase=complete`：JSON `{ uploadId, key, chunks: [{ index, etag }], filename }` → 响应含 `url`
 *
 * @param action 与简单上传相同的根地址
 * @param file 文件
 * @param options 分片大小、进度、解析等
 */
export async function uploadFilePhasedChunks(
  action: string,
  file: File,
  options: UploadChunkedPhasedOptions = {},
): Promise<string> {
  const {
    method = "POST",
    headers,
    withCredentials,
    chunkSize = DEFAULT_UPLOAD_CHUNK_SIZE,
    signal,
    onProgress,
    getValueFromResponse = defaultGetUploadResultUrl,
  } = options;

  const cred = withCredentials ? "include" : "same-origin";
  /** 与 {@link runChunkedUpload} 一致的分片数，供服务端 init 校验 */
  const chunks = Math.max(1, Math.ceil(file.size / chunkSize));

  const initRes = await uploadFetchOk(uploadActionWithPhase(action, "init"), {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      chunks,
    }),
    credentials: cred,
    signal,
  });
  const initJson = (await initRes.json()) as {
    uploadId?: string;
    key?: string;
  };
  if (typeof initJson.uploadId !== "string" || !initJson.uploadId) {
    throw new Error("init response missing uploadId");
  }
  if (typeof initJson.key !== "string" || !initJson.key) {
    throw new Error("init response missing key");
  }
  const uploadId = initJson.uploadId;
  const objectKey = initJson.key;

  /** 各片服务端返回的 ETag，complete 时按 index 排序提交 */
  const partRecords: Array<{ index: number; etag: string }> = [];

  let finalUrl = "";
  await runChunkedUpload({
    file,
    chunkSize,
    signal,
    onProgress,
    uploadChunk: async ({ chunk, chunkIndex, signal: sig }) => {
      const fd = new FormData();
      fd.set("uploadId", uploadId);
      fd.set("key", objectKey);
      fd.set("index", String(chunkIndex));
      fd.set("file", chunk, `part-${chunkIndex}`);
      const r = await uploadFetchOk(uploadActionWithPhase(action, "chunk"), {
        method,
        headers,
        body: fd,
        credentials: cred,
        signal: sig,
      });
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        throw new Error("chunk response must be application/json");
      }
      const chunkJson = (await r.json()) as { index?: number; etag?: string };
      if (
        typeof chunkJson.index !== "number" ||
        typeof chunkJson.etag !== "string"
      ) {
        throw new Error("chunk response missing index or etag");
      }
      partRecords.push({ index: chunkJson.index, etag: chunkJson.etag });
    },
    complete: async ({ signal: sig }) => {
      partRecords.sort((a, b) => a.index - b.index);
      const r = await uploadFetchOk(uploadActionWithPhase(action, "complete"), {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          uploadId,
          key: objectKey,
          chunks: partRecords,
          filename: file.name,
        }),
        credentials: cred,
        signal: sig,
      });
      finalUrl = await getValueFromResponse(r);
    },
  });
  return finalUrl;
}

/**
 * 判断文件是否满足 `accept`（用于拖拽；与原生 input accept 语义大致对齐）。
 *
 * @param file 文件
 * @param accept 逗号分隔，如 `image/*,.pdf`
 */
export function fileMatchesAccept(file: File, accept?: string): boolean {
  if (accept == null || accept.trim() === "") return true;
  const tokens = accept.split(",").map((s) => s.trim()).filter(Boolean);
  for (const t of tokens) {
    if (t.startsWith(".")) {
      const ext = t.toLowerCase();
      if (file.name.toLowerCase().endsWith(ext)) return true;
      continue;
    }
    if (t.endsWith("/*")) {
      const prefix = t.slice(0, -1);
      if (file.type.startsWith(prefix)) return true;
      continue;
    }
    if (file.type === t || file.type === t.toLowerCase()) return true;
  }
  return false;
}

export interface UploadViaUiViewBaseOptions {
  method?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  chunkSize?: number;
  signal?: AbortSignal;
  onProgress?: (loaded: number, total: number) => void;
  /** 透传 init JSON 的 path（会话目录等） */
  path?: string;
  getValueFromResponse?: (res: Response) => Promise<string>;
}

/**
 * 按 `uiViewUploadPlugin`／`MultipartUploadHandler` **路径协议**上传：
 * `POST ${basePath}/init|chunk|complete`（**不是** `?phase=`）。
 *
 * @param basePath 路由前缀，推荐 {@link DEFAULT_UI_VIEW_UPLOAD_BASE_PATH}
 * @param file 浏览器 File（粘贴 Blob 请先 `new File([blob], name, { type })`）
 */
export async function uploadFileViaUiViewBase(
  basePath: string,
  file: File,
  options: UploadViaUiViewBaseOptions = {},
): Promise<string> {
  const root = (basePath || DEFAULT_UI_VIEW_UPLOAD_BASE_PATH).replace(/\/$/, "") ||
    DEFAULT_UI_VIEW_UPLOAD_BASE_PATH;
  const {
    method = "POST",
    headers,
    withCredentials,
    chunkSize = DEFAULT_UPLOAD_CHUNK_SIZE,
    signal,
    onProgress,
    path,
    getValueFromResponse = defaultGetUploadResultUrl,
  } = options;
  const cred = withCredentials ? "include" : "same-origin";
  const chunks = Math.max(1, Math.ceil(file.size / chunkSize));

  const initRes = await uploadFetchOk(`${root}/init`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      chunks,
      ...(path ? { path } : {}),
    }),
    credentials: cred,
    signal,
  });
  const initJson = (await initRes.json()) as {
    uploadId?: string;
    key?: string;
  };
  if (typeof initJson.uploadId !== "string" || !initJson.uploadId) {
    throw new Error("init response missing uploadId");
  }
  if (typeof initJson.key !== "string" || !initJson.key) {
    throw new Error("init response missing key");
  }
  const uploadId = initJson.uploadId;
  const objectKey = initJson.key;
  const partRecords: Array<{ index: number; etag: string }> = [];

  let finalUrl = "";
  await runChunkedUpload({
    file,
    chunkSize,
    signal,
    onProgress,
    uploadChunk: async ({ chunk, chunkIndex, signal: sig }) => {
      const fd = new FormData();
      fd.set("uploadId", uploadId);
      fd.set("key", objectKey);
      fd.set("index", String(chunkIndex));
      fd.set("file", chunk, `part-${chunkIndex}`);
      const r = await uploadFetchOk(`${root}/chunk`, {
        method,
        headers,
        body: fd,
        credentials: cred,
        signal: sig,
      });
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        throw new Error("chunk response must be application/json");
      }
      const chunkJson = (await r.json()) as { index?: number; etag?: string };
      if (
        typeof chunkJson.index !== "number" ||
        typeof chunkJson.etag !== "string"
      ) {
        throw new Error("chunk response missing index or etag");
      }
      partRecords.push({ index: chunkJson.index, etag: chunkJson.etag });
    },
    complete: async ({ signal: sig }) => {
      partRecords.sort((a, b) => a.index - b.index);
      const r = await uploadFetchOk(`${root}/complete`, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          uploadId,
          key: objectKey,
          chunks: partRecords,
          filename: file.name,
        }),
        credentials: cred,
        signal: sig,
      });
      finalUrl = await getValueFromResponse(r);
    },
  });
  return finalUrl;
}

