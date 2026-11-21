/**
 * Typography 排版：Title、Text、Paragraph。Tailwind v4 + light/dark。
 */
import { createSignal, type JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconCopy } from "./icons/Copy.tsx";

export type TypographyType = "secondary" | "success" | "warning" | "danger";

const typeClasses: Record<TypographyType, string> = {
  secondary: "text-gray-500 dark:text-gray-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

export interface TypographyMessages {
  /** 复制按钮文案 */
  copy: string;
  /** 复制成功后的按钮文案 */
  copied: string;
}

export const defaultTypographyMessages: TypographyMessages = {
  copy: "复制",
  copied: "已复制",
};

interface TypographyExtras {
  type?: TypographyType;
  strong?: boolean;
  code?: boolean;
  copyable?: boolean;
  messages?: Partial<TypographyMessages>;
}

function typographyPlainText(children: unknown): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  return "";
}

function CopyableButton(props: { text: string; messages: TypographyMessages }) {
  const copied = createSignal(false);
  return (
    <button
      type="button"
      class="relative -top-0.5 ml-1 inline-flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      aria-label={() =>
        copied.value ? props.messages.copied : props.messages.copy}
      onClick={(e: Event) => {
        e.preventDefault();
        const write = globalThis.navigator?.clipboard?.writeText;
        if (!write) return;
        void write.call(globalThis.navigator.clipboard, props.text).then(() => {
          copied.value = true;
          globalThis.setTimeout(() => {
            copied.value = false;
          }, 1500);
        });
      }}
    >
      <IconCopy class="h-3.5 w-3.5" />
    </button>
  );
}

function typographyInner(props: TypographyExtras & { children?: unknown }) {
  let inner: unknown = props.children;
  if (props.strong) {
    inner = <strong class="font-semibold">{inner}</strong>;
  }
  if (props.code) {
    inner = (
      <code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-gray-800">
        {inner}
      </code>
    );
  }
  const m = { ...defaultTypographyMessages, ...props.messages };
  const text = typographyPlainText(props.children);
  return (
    <>
      {inner}
      {props.copyable && text !== "" && (
        <CopyableButton text={text} messages={m} />
      )}
    </>
  );
}

export interface TitleProps extends TypographyExtras {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  class?: string;
  /** 透传到标题标签，便于文档锚点 */
  id?: string;
  children?: unknown;
}

const titleSizeClasses: Record<number, string> = {
  1: "text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-200",
  2: "text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200",
  3: "text-xl font-semibold text-gray-900 dark:text-gray-200",
  /** h4/h5：dark 与 h2/h3 同级亮度，避免小标题在深色底上过暗 */
  4: "text-lg font-medium text-gray-800 dark:text-gray-300",
  5: "text-base font-medium text-gray-800 dark:text-gray-300",
  6: "text-sm font-medium text-gray-700 dark:text-gray-300",
};

/** 标题，默认 h2 */
export function Title(props: TitleProps): JSXRenderable {
  const { level = 2, class: className, id, type } = props;
  const base = titleSizeClasses[level];
  const cls = twMerge(base, type ? typeClasses[type] : undefined, className);
  const headingProps = id ? { class: cls, id } : { class: cls };
  const inner = typographyInner(props);
  if (level === 1) return <h1 {...headingProps}>{inner}</h1>;
  if (level === 2) return <h2 {...headingProps}>{inner}</h2>;
  if (level === 3) return <h3 {...headingProps}>{inner}</h3>;
  if (level === 4) return <h4 {...headingProps}>{inner}</h4>;
  if (level === 5) return <h5 {...headingProps}>{inner}</h5>;
  return <h6 {...headingProps}>{inner}</h6>;
}

export interface TextProps extends TypographyExtras {
  class?: string;
  /** 是否省略号 */
  truncate?: boolean;
  children?: unknown;
}

/** 正文 */
export function Text(props: TextProps): JSXRenderable {
  const { class: className, truncate, type } = props;
  const base = "text-gray-700 dark:text-gray-300";
  return (
    <span
      class={twMerge(
        base,
        type ? typeClasses[type] : undefined,
        truncate && "truncate block",
        className,
      )}
    >
      {typographyInner(props)}
    </span>
  );
}

export interface ParagraphProps extends TypographyExtras {
  class?: string;
  children?: unknown;
}

/** 段落 */
export function Paragraph(props: ParagraphProps): JSXRenderable {
  const { class: className, type } = props;
  const base = "text-gray-600 dark:text-gray-400 leading-relaxed";
  return (
    <p class={twMerge(base, type ? typeClasses[type] : undefined, className)}>
      {typographyInner(props)}
    </p>
  );
}
