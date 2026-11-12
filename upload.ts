/**
 * @module @dreamer/ui-view/plugin (upload)
 * @packageDocumentation
 *
 * @description
 * **服务端**上传插件：包装 `@dreamer/upload` 的 MultipartUploadHandler + local-cloud，
 * 可选 `@dreamer/image` 双档（原图 AVIF + cover 缩略 AVIF）。
 *
 * - 应用（如 dweb-admin）**必须**显式传 `localDir`（禁隐式默认目录；缺则挂载失败）＋鉴权／可选 `virusScan`／`image.dual`／`afterComplete`。
 * - 默认路由前缀 **`/ui-view-upload`**（勿用易与业务冲突的 `/upload`；可用 `basePath` 覆盖）。
 * - **勿**在浏览器／client 做 AVIF 双档；ImageMagick 由部署保证。
 * - 杀毒：透传 {@link UiViewUploadPluginOptions.virusScan} 到 upload Handler（默认关）；
 *   `afterComplete` 留给 dual 以外的业务钩子，**勿**再外包强制 ClamAV。
 * - 文件下载：插件 `onRequest` 挂 `${basePath}/file?key=`（可关 `serveFiles:false`）。
 *
 * @see {@link uiViewUploadPlugin}
 * @see {@link uiViewTailwindPlugin}
 */

import type { Plugin } from "@dreamer/plugin";
import type { ServiceContainer } from "@dreamer/service";
import { createLocalCloudStorageAdapter } from "@dreamer/upload/adapters";
import type { CloudStorageAdapter } from "@dreamer/upload/adapters";
import { createMultipartUploadHandler } from "@dreamer/upload/server";

/** 与 dweb UploadAppConfig／MultipartUploadHandler 对齐的松散鉴权上下文 */
export type UiViewUploadAuthContext = {
  userId?: string;
  claims?: Record<string, unknown>;
};

/** complete 成功后的钩子上下文（业务钩子；杀毒请用 virusScan） */
export interface UiViewUploadAfterCompleteContext {
  /** 合并后的对象键 */
  key: string;
  /** 预签名／公开 URL（若有） */
  url?: string;
  mimeType?: string;
  filename?: string;
  /** 全量字节（钩子可扫毒；大文件注意内存） */
  bytes: Uint8Array;
  storage: UiViewUploadStorage;
  request: Request;
  /** 原始 complete 成功响应 */
  response: Response;
  /** 已解析的 complete JSON */
  body: UiViewUploadCompleteBody;
}

/**
 * afterComplete 返回值：
 * - `Response` → 替换 complete 响应（拒传／改写）
 * - `{ url?, thumbUrl?, data?, key? }` → 合并进返回体（双档前可改）
 * - `void` → 不改
 */
export type UiViewUploadAfterCompleteResult =
  | void
  | Response
  | {
    url?: string;
    thumbUrl?: string;
    data?: Record<string, unknown>;
    key?: string;
  };

export type UiViewUploadAfterComplete = (
  ctx: UiViewUploadAfterCompleteContext,
) =>
  | UiViewUploadAfterCompleteResult
  | Promise<UiViewUploadAfterCompleteResult>;

/** complete 返回体（url／thumbUrl 在顶层或 data 内） */
export interface UiViewUploadCompleteBody {
  fileId?: string;
  url?: string;
  thumbUrl?: string;
  data?: Record<string, unknown>;
  [k: string]: unknown;
}

/** 插件用到的最小存储面 */
export interface UiViewUploadStorage {
  download: (key: string) => Promise<Uint8Array>;
  upload: (key: string, content: Uint8Array, options?: { contentType?: string }) => Promise<void>;
  delete: (key: string) => Promise<void>;
  exists?: (key: string) => Promise<boolean>;
  getPresignedUrl: (
    key: string,
    options?: { expiresIn?: number; method?: string },
  ) => Promise<string>;
}

/** 双档选项：服务端 cover→avif 缩略 + 原图 avif */
export interface UiViewUploadImageOptions {
  /**
   * true：complete 后写双 key
   * - orig = convert(avif)
   * - thumb = resize(cover) → convert(avif)
   */
  dual?: boolean;
  /** cover 缩略边长（px），默认 320 */
  thumbSize?: number;
  /** AVIF 质量 0–100，默认 75 */
  quality?: number;
}


/** 与 `@dreamer/upload` VirusScanOptions 对齐（松散，避免强依赖 scanner 类型） */
export interface UiViewUploadVirusScanOptions {
  /** 是否启用；默认 false（须显式 true） */
  enable?: boolean;
  /** 引擎不可用／扫描异常时是否拒传；默认 true */
  required?: boolean;
  /** clamd host，默认 127.0.0.1 */
  host?: string;
  /** clamd port，默认 3310 */
  port?: number;
  /** 扫描超时（毫秒） */
  timeout?: number;
  /** 注入扫描器（单测／自定义） */
  scanner?: unknown;
}

export interface UiViewUploadPluginOptions {
  /**
   * 本地保存根目录（**必填**；禁隐式默认）。
   * 缺／空字符串 → `uiViewUploadPlugin` 抛错，挂载失败。
   */
  localDir: string;
  /** 路由前缀，默认 `/ui-view-upload`（可用选项覆盖；勿默认 `/upload`） */
  basePath?: string;
  /** 公开下载前缀，默认 `${basePath}/file` */
  publicFileBasePath?: string;
  /** 自定义 storage；默认 local-cloud(localDir) */
  storage?: UiViewUploadStorage | CloudStorageAdapter;
  /** 图片双档（仅服务端；client 勿做） */
  image?: UiViewUploadImageOptions;
  /**
   * 透传 `@dreamer/upload` MultipartUploadHandler `virusScan`（默认关）。
   * `false`／省略＝不扫；`{ enable: true }`＝complete 内建杀毒（可配 host／port／required／scanner）。
   */
  virusScan?: false | UiViewUploadVirusScanOptions;
  /**
   * complete 成功后钩子（dual 前；杀毒请用 virusScan，勿在此强制 ClamAV）。
   * 返回 Response 则替换响应；勿把扫描硬塞进 image 包。
   */
  afterComplete?: UiViewUploadAfterComplete;
  /**
   * 是否由插件 `onRequest` 提供 `${basePath}/file?key=` 下载。默认 true。
   */
  serveFiles?: boolean;
  /**
   * 文件下载授权（在 authenticate 之后）。返回 false → 403；Response 则原样回复。
   * 默认：要求 key 落在 pathPrefix（若有）下。
   */
  authorizeFile?: (
    ctx: UiViewUploadAuthContext | undefined,
    key: string,
    request: Request,
  ) => boolean | Response | Promise<boolean | Response>;
  requireAuth?: boolean;
  authenticate?: (
    request: Request,
  ) =>
    | UiViewUploadAuthContext
    | null
    | undefined
    | Response
    | Promise<UiViewUploadAuthContext | null | undefined | Response>;
  authorizeUpload?: (
    ctx: unknown,
    init: unknown,
    request: Request,
  ) => boolean | Response | Promise<boolean | Response>;
  maxFileSize?: number;
  maxPartSize?: number;
  allowedMimeTypes?: string[];
  pathPrefix?: string;
  verifyContentAfterComplete?: boolean;
  sessionTtlMs?: number;
  onEvent?: (event: unknown) => void;
  /**
   * Plugin registry name. Default `"ui-view-upload"`.
   * Must be unique when more than one upload plugin is registered on the same app.
   */
  name?: string;
  /**
   * When true, this plugin creates and serves its own MultipartUploadHandler at
   * `basePath` (upload + file) and does not wrap `AppConfig.upload`'s handler.
   * Use this for additional mounts with their own size / MIME limits.
   * Default false.
   */
  standalone?: boolean;
}

export interface UiViewUploadPlugin extends Plugin {
  /** 供 AppConfig.upload 挂载（同形 options） */
  uploadConfig: Record<string, unknown>;
  /** 与 uploadConfig.storage 同一实例，供 file 路由复用 */
  storage: UiViewUploadStorage;
}

/** 与 client {@link DEFAULT_UI_VIEW_UPLOAD_BASE_PATH} 对齐的默认路由前缀 */
export const DEFAULT_UI_VIEW_UPLOAD_BASE_PATH = "/ui-view-upload";

const DEFAULT_THUMB_SIZE = 320;
const DEFAULT_AVIF_QUALITY = 75;

function sniffMimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  if (ext === "pdf") return "application/pdf";
  if (ext === "webm") return "video/webm";
  if (ext === "mp4" || ext === "m4a") return "video/mp4";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "ogg") return "audio/ogg";
  if (ext === "txt") return "text/plain";
  if (ext === "zip") return "application/zip";
  return "application/octet-stream";
}



function sniffImageMime(bytes: Uint8Array): string | undefined {
  if (bytes.length < 12) return undefined;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  // ISO BMFF ftyp brands often used by AVIF (ftyp at offset 4)
  if (
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = new TextDecoder().decode(bytes.subarray(8, 12));
    if (brand.startsWith("avif") || brand.startsWith("avis") || brand === "mif1") {
      return "image/avif";
    }
  }
  return undefined;
}

function isImageMime(mime?: string): boolean {
  if (!mime) return false;
  const m = mime.toLowerCase().split(";")[0]!.trim();
  return m.startsWith("image/") && m !== "image/svg+xml";
}

/** 将对象键扩展名改为 .avif；thumb 则插 `.thumb` */
export function dualObjectKeys(originalKey: string): {
  origKey: string;
  thumbKey: string;
} {
  const slash = originalKey.lastIndexOf("/");
  const base = slash >= 0 ? originalKey.slice(slash + 1) : originalKey;
  const dir = slash >= 0 ? originalKey.slice(0, slash + 1) : "";
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return {
    origKey: `${dir}${stem}.avif`,
    thumbKey: `${dir}${stem}.thumb.avif`,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * 包装 MultipartUploadHandler.handle：complete 成功后跑 afterComplete → 可选双档，
 * 返回体带 `{ url, thumbUrl }`（thumbUrl 亦进 `data`）。
 */
export function wrapUploadCompletePipeline(
  handler: {
    handle: (
      request: Request,
      basePath?: string,
    ) => Promise<Response | null> | Response | null;
  },
  opts: {
    storage: UiViewUploadStorage;
    basePath: string;
    image?: UiViewUploadImageOptions;
    afterComplete?: UiViewUploadAfterComplete;
  },
): void {
  const orig = handler.handle.bind(handler);
  const basePath = opts.basePath.replace(/\/$/, "") || DEFAULT_UI_VIEW_UPLOAD_BASE_PATH;
  const dual = opts.image?.dual === true;
  const thumbSize = opts.image?.thumbSize ?? DEFAULT_THUMB_SIZE;
  const quality = opts.image?.quality ?? DEFAULT_AVIF_QUALITY;

  handler.handle = async (request: Request, bp = basePath) => {
    const url = new URL(request.url);
    const pathBase = (bp || basePath).replace(/\/$/, "") || DEFAULT_UI_VIEW_UPLOAD_BASE_PATH;
    const isComplete =
      request.method === "POST" &&
      url.pathname === `${pathBase}/complete`;
    const result = await orig(request, bp);
    if (!isComplete || !result || !result.ok) return result;

    let body: UiViewUploadCompleteBody;
    try {
      body = JSON.parse(await result.clone().text()) as UiViewUploadCompleteBody;
    } catch {
      return result;
    }
    const key = String(body.fileId ?? "").trim();
    if (!key) return result;

    let bytes: Uint8Array;
    try {
      bytes = await opts.storage.download(key);
    } catch {
      return result;
    }

    // Infer mime from body data or key extension (session mime not always in complete JSON)
    const mimeFromData = typeof body.data?.mimeType === "string"
      ? body.data.mimeType
      : undefined;
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const mimeGuess = mimeFromData ||
      (ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
        ? "image/webp"
        : ext === "gif"
        ? "image/gif"
        : ext === "avif"
        ? "image/avif"
        : ext === "bmp"
        ? "image/bmp"
        : undefined) ||
      sniffImageMime(bytes);

    if (opts.afterComplete) {
      const hookResult = await opts.afterComplete({
        key,
        url: body.url,
        mimeType: mimeGuess,
        bytes,
        storage: opts.storage,
        request,
        response: result,
        body,
      });
      if (hookResult instanceof Response) return hookResult;
      if (hookResult && typeof hookResult === "object") {
        if (hookResult.url) body.url = hookResult.url;
        if (hookResult.thumbUrl) body.thumbUrl = hookResult.thumbUrl;
        if (hookResult.key) body.fileId = hookResult.key;
        if (hookResult.data) {
          body.data = { ...(body.data ?? {}), ...hookResult.data };
        }
      }
    }

    if (dual && isImageMime(mimeGuess)) {
      try {
        const { createImageProcessor } = await import("@dreamer/image");
        const processor = await createImageProcessor();
        const { origKey, thumbKey } = dualObjectKeys(key);

        const origAvif = await processor.convert(bytes, {
          format: "avif",
          quality,
        });
        const resized = await processor.resize(bytes, {
          width: thumbSize,
          height: thumbSize,
          fit: "cover",
        });
        const thumbAvif = await processor.convert(resized, {
          format: "avif",
          quality,
        });

        await opts.storage.upload(origKey, origAvif, {
          contentType: "image/avif",
        });
        await opts.storage.upload(thumbKey, thumbAvif, {
          contentType: "image/avif",
        });

        if (origKey !== key) {
          try {
            await opts.storage.delete(key);
          } catch {
            /* ignore */
          }
        }

        const origUrl = await opts.storage.getPresignedUrl(origKey, {
          expiresIn: 3600,
          method: "GET",
        });
        const thumbUrl = await opts.storage.getPresignedUrl(thumbKey, {
          expiresIn: 3600,
          method: "GET",
        });

        body.fileId = origKey;
        body.url = origUrl;
        body.thumbUrl = thumbUrl;
        body.data = {
          ...(body.data ?? {}),
          url: origUrl,
          thumbUrl,
          mimeType: "image/avif",
          thumbKey,
        };
        return jsonResponse(body, result.status);
      } catch (e) {
        console.error("[ui-view-upload] dual image failed", e);
        // Fall through with original complete body (no dual)
      }
    }

    // Ensure thumbUrl surfaces in data when set by hook without dual
    if (body.thumbUrl || body.url) {
      body.data = {
        ...(body.data ?? {}),
        ...(body.url ? { url: body.url } : {}),
        ...(body.thumbUrl ? { thumbUrl: body.thumbUrl } : {}),
      };
      return jsonResponse(body, result.status);
    }
    return result;
  };
}

/**
 * 创建 ui-view 上传插件。
 *
 * - {@link UiViewUploadPlugin.uploadConfig} → 放进 `AppConfig.upload`
 * - `onStart` 包装 `uploadHandler`：afterComplete + 可选 image.dual（杀毒已在 Handler virusScan）
 * - `onRequest` 可选提供 `${basePath}/file?key=` 下载
 *
 * @example
 * ```ts
 * const upload = uiViewUploadPlugin({
 *   localDir: "./runtime/uploads",
 *   image: { dual: true },
 *   virusScan: { enable: true },
 *   authenticate: ...,
 * });
 * // config.upload = upload.uploadConfig
 * // app.registerPlugin(upload)
 * ```
 */
export function uiViewUploadPlugin(
  options: UiViewUploadPluginOptions,
): UiViewUploadPlugin {
  const localDir = String(options.localDir ?? "").trim();
  if (!localDir) {
    throw new Error(
      "[ui-view-upload] localDir is required (no implicit default upload directory)",
    );
  }
  const basePath = (options.basePath ?? DEFAULT_UI_VIEW_UPLOAD_BASE_PATH).replace(/\/$/, "") ||
    DEFAULT_UI_VIEW_UPLOAD_BASE_PATH;
  const publicFileBasePath = options.publicFileBasePath ?? `${basePath}/file`;

  const storage = (options.storage ??
    createLocalCloudStorageAdapter({
      baseDir: localDir,
      publicFileBasePath,
    })) as UiViewUploadStorage;

  const uploadConfig: Record<string, unknown> = {
    basePath,
    localDir,
    publicFileBasePath,
    storage,
    requireAuth: options.requireAuth ?? true,
    authenticate: options.authenticate,
    authorizeUpload: options.authorizeUpload,
    maxFileSize: options.maxFileSize,
    maxPartSize: options.maxPartSize,
    allowedMimeTypes: options.allowedMimeTypes,
    pathPrefix: options.pathPrefix,
    verifyContentAfterComplete: options.verifyContentAfterComplete,
    sessionTtlMs: options.sessionTtlMs,
    onEvent: options.onEvent,
    virusScan: options.virusScan,
  };

  /** Strip undefined so dweb createMultipartUploadHandler gets clean opts */
  for (const k of Object.keys(uploadConfig)) {
    if (uploadConfig[k] === undefined) delete uploadConfig[k];
  }

  const serveFiles = options.serveFiles !== false;
  const pathPrefix = (options.pathPrefix ?? "").replace(/^\/+|\/+$/g, "");
  const pluginName = String(options.name ?? "ui-view-upload").trim() ||
    "ui-view-upload";
  const standalone = options.standalone === true;

  type UploadHandler = {
    handle: (
      request: Request,
      basePath?: string,
    ) => Promise<Response | null> | Response | null;
  };
  let standaloneHandler: UploadHandler | undefined;
  if (standalone) {
    standaloneHandler = createMultipartUploadHandler({
      storage,
      requireAuth: options.requireAuth ?? true,
      authenticate: options.authenticate,
      authorizeUpload: options.authorizeUpload,
      maxFileSize: options.maxFileSize,
      maxPartSize: options.maxPartSize,
      allowedMimeTypes: options.allowedMimeTypes,
      pathPrefix: options.pathPrefix,
      onEvent: options.onEvent,
      verifyContentAfterComplete: options.verifyContentAfterComplete,
      sessionTtlMs: options.sessionTtlMs,
      virusScan: options.virusScan === false ? undefined : options.virusScan,
    } as Parameters<typeof createMultipartUploadHandler>[0]);
    wrapUploadCompletePipeline(standaloneHandler, {
      storage,
      basePath,
      image: options.image,
      afterComplete: options.afterComplete,
    });
  }

  const pathOnMount = (path: string): boolean =>
    path === basePath ||
    path.startsWith(`${basePath}/`) ||
    path.endsWith(basePath) ||
    path.includes(`${basePath}/`);

  return {
    name: pluginName,
    version: "0.1.0",
    uploadConfig,
    storage,

    async onStart(container: ServiceContainer): Promise<void> {
      // Additional mounts serve their own handler; do not wrap AppConfig.upload.
      if (standalone) return;
      if (!container.has("uploadHandler")) {
        console.warn(
          "[ui-view-upload] uploadHandler missing; skip complete pipeline (set AppConfig.upload = plugin.uploadConfig)",
        );
        return;
      }
      const handler = container.get("uploadHandler") as UploadHandler;
      wrapUploadCompletePipeline(handler, {
        storage,
        basePath,
        image: options.image,
        afterComplete: options.afterComplete,
      });
    },

    /**
     * GET `${basePath}/file?key=` — 鉴权后从 storage 读字节。
     * 顺序无关：complete（含 virusScan）→ dual 由 Handler／onStart 管；本钩子只做下载。
     */
    async onRequest(ctx, _container) {
      const filePath = `${basePath}/file`;
      const isFileReq =
        (ctx.method === "GET" || ctx.method === "HEAD") &&
        (ctx.path === filePath || ctx.path.endsWith(filePath));
      if (serveFiles && isFileReq) {

      const key = (ctx.url.searchParams.get("key") ?? "").trim();
      if (!key || key.includes("..")) {
        return new Response("Bad key", { status: 400 });
      }
      if (pathPrefix && !key.startsWith(`${pathPrefix}/`)) {
        return new Response("Bad key", { status: 400 });
      }

      let auth: UiViewUploadAuthContext | undefined;
      if (options.authenticate) {
        const a = await options.authenticate(ctx.request);
        if (a instanceof Response) return a;
        if (a == null) {
          return new Response(
            JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
            { status: 401, headers: { "content-type": "application/json" } },
          );
        }
        auth = a;
      } else if (options.requireAuth !== false) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }

      if (options.authorizeFile) {
        const allowed = await options.authorizeFile(auth, key, ctx.request);
        if (allowed instanceof Response) return allowed;
        if (allowed === false) {
          return new Response("Forbidden", { status: 403 });
        }
      }

      try {
        if (storage.exists) {
          const ok = await storage.exists(key);
          if (!ok) return new Response("Not found", { status: 404 });
        }
        const bytes = await storage.download(key);
        const mime = sniffMimeFromKey(key);
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: {
            "content-type": mime,
            "cache-control": "private, max-age=3600",
            "x-content-type-options": "nosniff",
          },
        });
      } catch (e) {
        console.error("[ui-view-upload] file serve", e);
        return new Response("Error", { status: 500 });
      }
      }

      if (standalone && standaloneHandler && pathOnMount(ctx.path)) {
        const result = await standaloneHandler.handle(ctx.request, basePath);
        if (result) return result;
      }
    },
  };
}

/**
 * 仅生成与 {@link uiViewUploadPlugin} 同形的 `AppConfig.upload` 对象（不含 Plugin 生命周期）。
 * 双档／afterComplete 仍须再 `registerPlugin(uiViewUploadPlugin(...))` 或手动 {@link wrapUploadCompletePipeline}。
 */
export function createUiViewUploadAppConfig(
  options: UiViewUploadPluginOptions,
): Record<string, unknown> {
  return uiViewUploadPlugin(options).uploadConfig;
}
