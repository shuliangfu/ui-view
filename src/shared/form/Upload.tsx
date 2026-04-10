/**
 * Upload 文件上传（View）。
 * 必须提供 `action` 或 `requestUpload`：选文件后自动校验并上传（整文件 multipart 或同 URL 的 `phase` 分片），
 * 结果写入隐藏域 `name`；可见 `type="file"` 不带 `name`。分片约定见 `upload-http.ts`。
 */

import { createSignal, getOwner, type Owner, type Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconUpload } from "../basic/icons/Upload.tsx";
import { DEFAULT_UPLOAD_CHUNK_SIZE } from "./chunked-upload.ts";
import {
  fileMatchesAccept,
  uploadFilePhasedChunks,
  uploadFileSimple,
} from "./upload-http.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

/** 文件项状态（用于列表展示与进度） */
export type UploadFileStatus = "pending" | "uploading" | "done" | "error";

/** 列表项数据结构（导出供类型标注） */
export interface UploadFile {
  /** 唯一标识 */
  uid: string;
  /** 文件名 */
  name: string;
  /** 状态 */
  status?: UploadFileStatus;
  /** 上传进度 0–100（status 为 uploading 时有效） */
  progress?: number;
  /** 文件大小（字节） */
  size?: number;
  /** 失败时的说明 */
  errorMessage?: string;
  /** 上传成功后的远程地址 */
  resultUrl?: string;
}

/**
 * 将字节格式化为简短可读字符串（B / KB / MB），用于列表展示。
 *
 * @param bytes 字节数（非负）
 */
export function formatUploadFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 多文件时隐藏域如何拼接多个 URL */
export type UploadMultipleValueMode = "json" | "comma";

/** 除上传端点外的公共属性 */
export interface UploadCoreProps {
  /** 是否多选 */
  multiple?: boolean;
  /** 接受的文件类型，如 "image/*"、".pdf" */
  accept?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否展示拖拽区域，默认 true；为 false 时为 IconUpload + 文案触发条 */
  drag?: boolean;
  /** 拖拽区占位文案（图标在上方） */
  dragPlaceholder?: string;
  /** 是否显示 IconUpload（拖拽区与非拖拽触发条），默认 true */
  showTriggerIcon?: boolean;
  /** `drag=false` 时触发条文案，默认「选择文件」；图片场景可传「上传图片」 */
  triggerLabel?: string;
  /** 为 true 时关闭触发/拖拽区的 focus-within ring */
  hideFocusRing?: boolean;
  /**
   * 为 true 时上传成功后在列表项下展示图片缩略图；默认 false。
   * `accept` 含 `image` 时任意成功 URL 均尝试预览，否则按 URL 后缀 / `data:image/` 判断。
   */
  preview?: boolean;
  /** 额外 class（作用于包裹容器） */
  class?: string;
  /** 隐藏域 name（上传结果）；可见 file input 不带 name */
  name?: string;
  /** 可见 file input 的 id；隐藏域 id 为 `${id}-value` */
  id?: string;
  /** HTTP 方法，默认 POST */
  method?: string;
  /** 附加请求头 */
  headers?: Record<string, string>;
  /** 是否携带 Cookie */
  withCredentials?: boolean;
  /** 非分片时 multipart 文件字段名，默认 `file` */
  fileFieldName?: string;
  /** 单文件最大字节 */
  maxFileSize?: number;
  /** 多选时列表最大条数 */
  maxCount?: number;
  /**
   * 是否分片：`true` 强制；`auto` 当 `file.size > chunkThreshold` 时分片；`false` 始终整文件。
   * 默认 `auto`。
   */
  chunked?: boolean | "auto";
  /** 与 `chunked: auto` 配合，默认 2MiB */
  chunkThreshold?: number;
  /** 分片大小，默认 {@link DEFAULT_UPLOAD_CHUNK_SIZE} */
  chunkSize?: number;
  /** 从响应解析隐藏域字符串；默认 JSON `url` / `data.url` 或纯文本 */
  getValueFromResponse?: (res: Response) => Promise<string>;
  /** 多文件隐藏域：`json` 与列表对齐（含 null）；`comma` 逗号拼接 */
  multipleValueMode?: UploadMultipleValueMode;
  /** 受控：隐藏域值；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
  /** 非受控隐藏域初值 */
  defaultValue?: string;
  /** 隐藏值变化 */
  onValueChange?: (value: string) => void;
  onUploadSuccess?: (p: {
    url: string;
    file: File;
    response?: Response;
  }) => void;
  onUploadError?: (err: Error, file: File) => void;
}

/**
 * 上传端点：`action` 与 `requestUpload` 至少其一。
 * 若同时传入，`requestUpload` 优先（`action` 仍可作文档/埋点用途）。
 */
export type UploadProps =
  & UploadCoreProps
  & (
    | {
      action: string;
      requestUpload?: (file: File, signal: AbortSignal) => Promise<string>;
    }
    | {
      action?: string;
      requestUpload: (file: File, signal: AbortSignal) => Promise<string>;
    }
  );

/** 覆盖全区域的透明 file input（拖拽区或自定义触发条内） */
const fileInputOverlayCls =
  "absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed";

const dropZoneCls =
  "border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 transition-colors";
const dropZoneActiveCls = "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20";

/**
 * 与 {@link Upload} 绑定的可变状态（列表、隐藏域副本、上传句柄）。
 * dweb 下父级 getter 重跑时每次可能是新 {@link Owner}，仅靠 WeakMap&lt;Owner&gt; 会 `miss` 并新建空信号；
 * 故优先用 props 的 `id` / `name` 作稳定键在 Map 中复用同一套状态（与 DOM 订阅、事件闭包对齐）。
 */
interface UploadRuntimeState {
  items: Signal<UploadFile[]>;
  innerHidden: Signal<string>;
  fileByUid: Map<string, File>;
  abortByUid: Map<string, AbortController>;
}

/** `id:` 或 `name:` 前缀 + 值，同页勿重复用同一键的两个 Upload */
const uploadRuntimeByStorageKey = new Map<string, UploadRuntimeState>();

/** 无 id/name 时退回按 Owner 缓存（仍可能在重跑时失效） */
const uploadRuntimeByOwner = new WeakMap<Owner, UploadRuntimeState>();

/**
 * 稳定键：`id` 优先，否则 `name`（与隐藏域 name 一致）。
 *
 * @returns 非空字符串则走 {@link uploadRuntimeByStorageKey}；`null` 则走 Owner 或匿名新建
 */
function resolveUploadStorageKey(
  id: string | undefined,
  name: string | undefined,
): string | null {
  const trimmedId = id?.trim();
  if (trimmedId) return `id:${trimmedId}`;
  const trimmedName = name?.trim();
  if (trimmedName) return `name:${trimmedName}`;
  return null;
}

/**
 * 获取或创建上传运行时状态：优先 `storageKey`，否则 Owner，再否则匿名。
 *
 * @param storageKey {@link resolveUploadStorageKey} 的返回值
 * @param owner {@link getOwner()}
 * @param defaultHidden 非受控隐藏域初值，仅在首次创建时使用
 */
function takeUploadRuntimeState(
  storageKey: string | null,
  owner: Owner | null,
  defaultHidden: string,
): UploadRuntimeState {
  if (storageKey != null) {
    const hit = uploadRuntimeByStorageKey.get(storageKey);
    if (hit) return hit;
    const created: UploadRuntimeState = {
      items: createSignal<UploadFile[]>([]),
      innerHidden: createSignal(defaultHidden),
      fileByUid: new Map(),
      abortByUid: new Map(),
    };
    uploadRuntimeByStorageKey.set(storageKey, created);
    return created;
  }
  if (owner != null) {
    const hit = uploadRuntimeByOwner.get(owner);
    if (hit) return hit;
    const created: UploadRuntimeState = {
      items: createSignal<UploadFile[]>([]),
      innerHidden: createSignal(defaultHidden),
      fileByUid: new Map(),
      abortByUid: new Map(),
    };
    uploadRuntimeByOwner.set(owner, created);
    return created;
  }
  return {
    items: createSignal<UploadFile[]>([]),
    innerHidden: createSignal(defaultHidden),
    fileByUid: new Map(),
    abortByUid: new Map(),
  };
}

/**
 * 将已上传结果序列化为隐藏域字符串。
 *
 * @param items 列表项
 * @param multiple 是否多选
 * @param mode json | comma
 */
function serializeUploadHiddenValue(
  items: UploadFile[],
  multiple: boolean,
  mode: UploadMultipleValueMode,
): string {
  const urls = items.map((it) =>
    it.status === "done" && it.resultUrl ? it.resultUrl : null
  );
  if (!multiple) {
    const u = urls.find((x): x is string => x != null);
    return u ?? "";
  }
  if (mode === "comma") {
    return urls.filter((x): x is string => x != null).join(",");
  }
  return JSON.stringify(urls);
}

function newUploadUid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 判断是否应对上传结果做 `<img>` 预览（避免对 PDF 等 URL 误用图片标签）。
 *
 * @param url 服务端或 `requestUpload` 返回的地址
 * @param accept 与组件 `accept` 一致，含 `image` 时放宽为「按图片处理」
 */
function canPreviewUploadedImage(url: string, accept?: string): boolean {
  const u = url.trim();
  if (!u) return false;
  if (accept && /\bimage\b/i.test(accept)) {
    return true;
  }
  if (u.startsWith("data:image/")) return true;
  /**
   * 常见文件下载路由：`/api/upload/file?key=子路径/xxx.jpg`；扩展名在 query 的 key 内而不在 pathname 末尾。
   */
  if (
    /\/file\?[^#]*\bkey=/.test(u) &&
    /[?&]key=[^&#]*\.(png|jpe?g|gif|webp|svg|avif|bmp)(?:&|#|$)/i.test(u)
  ) {
    return true;
  }
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp)(?:\?|#|$|&)/i.test(u) ||
    /[?&][^#]*\.(png|jpe?g|gif|webp|svg|avif|bmp)/i.test(u);
}

/**
 * 自动上传：校验、分片/整包、列表、隐藏域。
 */
export function Upload(props: UploadProps) {
  const {
    multiple = false,
    accept,
    disabled = false,
    drag = true,
    dragPlaceholder = "点击或拖拽文件到此处",
    showTriggerIcon = true,
    triggerLabel = "选择文件",
    hideFocusRing = false,
    preview = false,
    class: className,
    name,
    id,
    action,
    method,
    headers,
    withCredentials,
    fileFieldName,
    maxFileSize,
    maxCount,
    chunked = "auto",
    chunkThreshold = DEFAULT_UPLOAD_CHUNK_SIZE,
    chunkSize = DEFAULT_UPLOAD_CHUNK_SIZE,
    getValueFromResponse,
    multipleValueMode = "json",
    requestUpload,
    value: valueProp,
    defaultValue = "",
    onValueChange,
    onUploadSuccess,
    onUploadError,
  } = props;

  const storageKey = resolveUploadStorageKey(id, name);
  const owner = getOwner();
  const rt = takeUploadRuntimeState(storageKey, owner, defaultValue);
  const { items, innerHidden, fileByUid, abortByUid } = rt;

  const setHiddenAndNotify = (next: string) => {
    if (valueProp === undefined) {
      innerHidden.value = next;
    }
    commitMaybeSignal(valueProp, next);
    onValueChange?.(next);
  };

  const recomputeHidden = (list: UploadFile[]) => {
    const s = serializeUploadHiddenValue(
      list,
      multiple,
      multipleValueMode,
    );
    setHiddenAndNotify(s);
  };

  const pushErrorItem = (file: File, message: string) => {
    const uid = newUploadUid();
    items.value = [
      ...items.value,
      {
        uid,
        name: file.name,
        size: file.size,
        status: "error",
        errorMessage: message,
      },
    ];
  };

  const startUpload = (uid: string, file: File) => {
    const ac = new AbortController();
    abortByUid.set(uid, ac);

    /**
     * 合并单行补丁。若当前列表中已无该 uid（例如误触发 `tryAddFiles([])` 单选清空），则不再写入，
     * 避免 `[].map(...)` 反复生成新空数组触发无意义更新；成功收尾见下方对缺失 uid 的补行逻辑。
     */
    const updateItem = (patch: Partial<UploadFile>) => {
      const cur = items.value;
      if (!cur.some((it) => it.uid === uid)) return;
      items.value = cur.map((it) => it.uid === uid ? { ...it, ...patch } : it);
    };

    updateItem({ status: "uploading", progress: 0, errorMessage: undefined });

    const run = async () => {
      try {
        let url: string;
        if (requestUpload) {
          url = await requestUpload(file, ac.signal);
        } else if (action) {
          const useChunk = chunked === true ||
            (chunked === "auto" && file.size > chunkThreshold);
          const gv = getValueFromResponse;
          if (useChunk) {
            url = await uploadFilePhasedChunks(action, file, {
              method,
              headers,
              withCredentials,
              chunkSize,
              signal: ac.signal,
              onProgress: (loaded, total) => {
                const pct = total > 0 ? (loaded / total) * 100 : 0;
                updateItem({ progress: pct });
              },
              getValueFromResponse: gv,
            });
          } else {
            url = await uploadFileSimple(action, file, {
              method,
              headers,
              withCredentials,
              fileFieldName,
              signal: ac.signal,
              getValueFromResponse: gv,
            });
            updateItem({ progress: 100 });
          }
        } else {
          throw new Error("Upload 需要 action 或 requestUpload");
        }
        const cur = items.value;
        const hasRow = cur.some((it) => it.uid === uid);
        /**
         * 异步结束时若列表已被误清空，仍补一条完成项，保证缩略图/列表与隐藏域和接口结果一致。
         */
        const list: UploadFile[] = hasRow
          ? cur.map((it) =>
            it.uid === uid
              ? {
                ...it,
                status: "done" as const,
                progress: 100,
                resultUrl: url,
                errorMessage: undefined,
              }
              : it
          )
          : [
            ...cur,
            {
              uid,
              name: file.name,
              size: file.size,
              status: "done" as const,
              progress: 100,
              resultUrl: url,
              errorMessage: undefined,
            },
          ];
        fileByUid.set(uid, file);
        items.value = list;
        recomputeHidden(list);
        onUploadSuccess?.({ url, file });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        const msg = e instanceof Error ? e.message : String(e);
        updateItem({
          status: "error",
          progress: undefined,
          errorMessage: msg,
        });
        onUploadError?.(e instanceof Error ? e : new Error(msg), file);
      } finally {
        abortByUid.delete(uid);
      }
    };

    void run();
  };

  const tryAddFiles = (raw: File[]) => {
    if (disabled) return;
    /**
     * 无文件时直接返回：单选模式下否则会先执行 `items.value = []` 清空已有项，
     * 上传仍在进行时进度回调会对空列表 `map`，造成多次空快照且成功时无法对应 UI 行。
     */
    if (raw.length === 0) return;
    if (!multiple) {
      for (const it of items.value) {
        abortByUid.get(it.uid)?.abort();
        fileByUid.delete(it.uid);
      }
      items.value = [];
    }
    for (const file of raw) {
      if (!fileMatchesAccept(file, accept)) {
        pushErrorItem(file, "文件类型不在 accept 允许范围内");
        continue;
      }
      if (maxFileSize != null && file.size > maxFileSize) {
        pushErrorItem(
          file,
          `文件超过大小限制（最大 ${formatUploadFileSize(maxFileSize)}）`,
        );
        continue;
      }
      if (multiple && maxCount != null && items.value.length >= maxCount) {
        pushErrorItem(file, `最多只能选择 ${maxCount} 个文件`);
        break;
      }
      const uid = newUploadUid();
      fileByUid.set(uid, file);
      items.value = [
        ...items.value,
        {
          uid,
          name: file.name,
          size: file.size,
          status: "pending",
        },
      ];
      startUpload(uid, file);
      if (!multiple) break;
    }
    recomputeHidden(items.value);
  };

  const handleFileInputChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const fs = el.files;
    if (!fs?.length) return;
    tryAddFiles(Array.from(fs));
    el.value = "";
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove(dropZoneActiveCls);
    if (disabled || !e.dataTransfer?.files?.length) return;
    const files = multiple
      ? Array.from(e.dataTransfer.files)
      : [e.dataTransfer.files[0]!];
    tryAddFiles(files);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
    if (!disabled && drag) {
      (e.currentTarget as HTMLElement).classList.add(dropZoneActiveCls);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove(dropZoneActiveCls);
  };

  /**
   * 按 uid 移除列表项并中止对应上传；使用 uid 而非下标，避免重排后下标错位。
   *
   * @param uid 列表项 {@link UploadFile.uid}
   */
  const handleRemoveByUid = (uid: string) => {
    const row = items.value.find((it) => it.uid === uid);
    if (!row) return;
    abortByUid.get(row.uid)?.abort();
    fileByUid.delete(row.uid);
    const next = items.value.filter((it) => it.uid !== uid);
    items.value = next;
    recomputeHidden(next);
  };

  /**
   * 按 uid 重试失败的上传：重置该行状态后再次 {@link startUpload}。
   *
   * @param uid 列表项 {@link UploadFile.uid}
   */
  const handleRetryByUid = (uid: string) => {
    const row = items.value.find((it) => it.uid === uid);
    if (!row || row.status !== "error") return;
    const file = fileByUid.get(row.uid);
    if (!file) return;
    items.value = items.value.map((it) =>
      it.uid === uid
        ? {
          ...it,
          status: "pending" as const,
          progress: undefined,
          errorMessage: undefined,
          resultUrl: undefined,
        }
        : it
    );
    startUpload(row.uid, file);
  };

  const showDragZone = drag !== false;
  const hiddenId = id ? `${id}-value` : undefined;

  /** 透明 file input：覆盖可点击区域 */
  const fileInputOverlay = (
    <input
      type="file"
      id={id}
      multiple={multiple}
      accept={accept}
      disabled={disabled}
      class={fileInputOverlayCls}
      aria-label={triggerLabel}
      onChange={handleFileInputChange}
    />
  );

  /** 非拖拽：图标 + 文案 + 边框，与 ColorPicker 同类控件视觉一致 */
  const triggerBar = (
    <div
      class={twMerge(
        "relative flex min-h-10 w-full max-w-full items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
        !hideFocusRing &&
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent dark:focus-within:ring-blue-400",
        disabled && "opacity-50",
      )}
    >
      {fileInputOverlay}
      <div class="pointer-events-none flex min-h-10 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
        {showTriggerIcon && (
          <IconUpload
            size="sm"
            class="shrink-0 text-slate-500 dark:text-slate-400"
          />
        )}
        <span class="truncate">{triggerLabel}</span>
      </div>
    </div>
  );

  return (
    <div class={twMerge("space-y-2", className)}>
      <input
        type="hidden"
        name={name}
        id={hiddenId}
        value={() => {
          if (typeof valueProp === "function") return valueProp();
          if (valueProp !== undefined) return valueProp;
          return innerHidden.value;
        }}
        readOnly
        aria-hidden="true"
      />

      {showDragZone
        ? (
          <div
            class={twMerge(
              dropZoneCls,
              "relative min-h-[120px] flex items-center justify-center",
              !hideFocusRing &&
                "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent dark:focus-within:ring-blue-400",
            )}
            onDrop={handleDrop as unknown as (e: Event) => void}
            onDragOver={handleDragOver as unknown as (e: Event) => void}
            onDragLeave={handleDragLeave as unknown as (e: Event) => void}
          >
            {fileInputOverlay}
            <div class="pointer-events-none flex flex-col items-center gap-2 px-2 text-center">
              {showTriggerIcon && (
                <IconUpload
                  size="md"
                  class="text-slate-400 dark:text-slate-500"
                />
              )}
              <span class="text-sm">{dragPlaceholder}</span>
            </div>
          </div>
        )
        : triggerBar}

      {
        /**
         * `ul` 始终挂在模板里：`class` 与 `children` 各用函数读 `items.value`，由运行时分别建 effect。
         * 避免「整块 `() => { … return null : <ul>`」在 insert 展平 VNode 时与异步更新不同步，导致永远不出现 `ul`。
         */
      }
      <ul
        class={() =>
          twMerge(
            "grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            items.value.length === 0 ? "hidden" : "",
          )}
        role="list"
      >
        {() =>
          items.value.map((file) => (
            <li
              key={file.uid}
              class="relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-slate-200/90 bg-slate-100 p-2 dark:border-slate-600/70 dark:bg-slate-700/50"
            >
              {preview &&
                file.status === "done" &&
                file.resultUrl &&
                canPreviewUploadedImage(file.resultUrl, accept) && (
                <div class="aspect-square w-full shrink-0 overflow-hidden rounded-md border border-slate-200/80 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80">
                  <img
                    src={file.resultUrl}
                    alt={file.name}
                    class="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  class="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-100"
                  title={file.name}
                >
                  {file.name}
                  {file.size != null && file.size >= 0 && (
                    <span class="text-slate-500 dark:text-slate-400 font-normal">
                      {" "}
                      · {formatUploadFileSize(file.size)}
                    </span>
                  )}
                </span>
                {file.status === "pending" && (
                  <span
                    class="shrink-0 text-xs text-slate-400 dark:text-slate-500"
                    aria-label="等待上传"
                  >
                    …
                  </span>
                )}
                {file.status === "uploading" && file.progress != null && (
                  <span class="shrink-0 w-11 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {Math.round(file.progress)}%
                  </span>
                )}
                {file.status === "done" && (
                  <span
                    class="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    aria-label="已完成"
                  >
                    OK
                  </span>
                )}
                {file.status === "error" && (
                  <span
                    class="shrink-0 text-xs font-medium text-red-600 dark:text-red-400"
                    title={file.errorMessage}
                    aria-label="上传失败"
                  >
                    !
                  </span>
                )}
                {file.status === "error" && (
                  <button
                    type="button"
                    class="shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => handleRetryByUid(file.uid)}
                  >
                    重试
                  </button>
                )}
                <button
                  type="button"
                  class="shrink-0 p-0.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label={file.status === "uploading"
                    ? `取消或移除 ${file.name}`
                    : `移除 ${file.name}`}
                  disabled={disabled}
                  onClick={() => handleRemoveByUid(file.uid)}
                >
                  <svg
                    class="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {file.status === "error" && file.errorMessage && (
                <p class="text-xs text-red-600 dark:text-red-400 truncate pl-0.5">
                  {file.errorMessage}
                </p>
              )}
              {file.status === "uploading" && (
                <div
                  class="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b bg-slate-200 dark:bg-slate-600"
                  role="progressbar"
                  aria-valuenow={file.progress ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    class="h-full rounded bg-blue-500"
                    style={{ width: `${file.progress ?? 0}%` }}
                  />
                </div>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
