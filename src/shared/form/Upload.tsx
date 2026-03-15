/**
 * Upload 文件上传（View）。
 * 基于 input type="file"，支持 accept、multiple、disabled；
 * 可选文件列表展示、拖拽区域、上传进度；light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

/** 文件项状态（用于列表展示与进度） */
export type UploadFileStatus = "pending" | "uploading" | "done" | "error";

/** 文件列表项（受控，由父组件维护） */
export interface UploadFile {
  /** 唯一标识 */
  uid: string;
  /** 文件名 */
  name: string;
  /** 状态 */
  status?: UploadFileStatus;
  /** 上传进度 0–100（status 为 uploading 时有效） */
  progress?: number;
}

export interface UploadProps {
  /** 是否多选 */
  multiple?: boolean;
  /** 接受的文件类型，如 "image/*"、".pdf" */
  accept?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调（选择文件后） */
  onChange?: (e: Event) => void;
  /** 文件列表（受控，用于展示与进度；与 onChange 配合由父组件维护） */
  fileList?: UploadFile[];
  /** 移除某一项回调（传索引） */
  onRemove?: (index: number) => void;
  /** 拖拽松开回调（父组件可将 files 加入 fileList 或发起上传） */
  onDrop?: (files: File[]) => void;
  /** 是否展示拖拽区域（为 true 时渲染可拖拽区域并隐藏原生 file 按钮样式，需配合 onDrop 使用） */
  drag?: boolean;
  /** 拖拽区占位文案 */
  dragPlaceholder?: string;
  /** 额外 class（作用于包裹容器） */
  class?: string;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const inputCls =
  "block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-700 dark:file:text-slate-200 hover:file:bg-blue-100 dark:hover:file:bg-slate-600 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const dropZoneCls =
  "border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 transition-colors";
const dropZoneActiveCls = "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20";

export function Upload(props: UploadProps) {
  const {
    multiple = false,
    accept,
    disabled = false,
    onChange,
    fileList,
    onRemove,
    onDrop,
    drag = false,
    dragPlaceholder = "点击或拖拽文件到此处",
    class: className,
    name,
    id,
  } = props;

  const hasList = Array.isArray(fileList) && fileList.length > 0;
  const showDrag = drag && onDrop;

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove(dropZoneActiveCls);
    if (disabled || !onDrop || !e.dataTransfer?.files?.length) return;
    const files = multiple
      ? Array.from(e.dataTransfer.files)
      : [e.dataTransfer.files[0]!];
    onDrop(files);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
    if (!disabled && showDrag) {
      (e.currentTarget as HTMLElement).classList.add(dropZoneActiveCls);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove(dropZoneActiveCls);
  };

  const fileInput = (
    <input
      type="file"
      id={id}
      name={name}
      multiple={multiple}
      accept={accept}
      disabled={disabled}
      class={twMerge(
        inputCls,
        showDrag && "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
      )}
      onChange={onChange}
    />
  );

  return () => (
    <div class={twMerge("space-y-2", className)}>
      {showDrag
        ? (
          <div
            class={twMerge(
              dropZoneCls,
              "relative min-h-[120px] flex items-center justify-center",
            )}
            onDrop={handleDrop as unknown as (e: Event) => void}
            onDragOver={handleDragOver as unknown as (e: Event) => void}
            onDragLeave={handleDragLeave as unknown as (e: Event) => void}
          >
            {fileInput}
            <span class="pointer-events-none">{dragPlaceholder}</span>
          </div>
        )
        : fileInput}

      {hasList && (
        <ul
          class="space-y-1 text-sm text-slate-700 dark:text-slate-300"
          role="list"
        >
          {fileList!.map((file, index) => (
            <li
              key={file.uid}
              class="relative flex items-center gap-2 rounded px-2 py-1.5 bg-slate-100 dark:bg-slate-700/50"
            >
              <span class="truncate flex-1 min-w-0" title={file.name}>
                {file.name}
              </span>
              {file.status === "uploading" && file.progress != null && (
                <span class="shrink-0 w-12 text-right text-slate-500">
                  {Math.round(file.progress)}%
                </span>
              )}
              {file.status === "uploading" && (
                <div
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-600 rounded overflow-hidden"
                  role="progressbar"
                  aria-valuenow={file.progress ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    class="h-full bg-blue-500 rounded"
                    style={{ width: `${file.progress ?? 0}%` }}
                  />
                </div>
              )}
              {onRemove && (
                <button
                  type="button"
                  class="shrink-0 p-0.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label={`移除 ${file.name}`}
                  disabled={disabled}
                  onClick={() => onRemove(index)}
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
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
