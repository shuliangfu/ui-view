/**
 * DataView / DataPanel 详情字段展示：与 DataPanel `plainCell` 同一套渲染
 *（tag／image／link／money／formatter／可信 HTML）。供 DataView 复用，不改 DataPanel。
 */
import type { JSXRenderable } from "@dreamer/view";
import { TONE } from "./data-panel-chrome.tsx";
import type {
  Column,
  Messages,
  Row,
  ViewItem,
} from "./data-panel-types.ts";
import {
  colProp,
  displayValue,
  formatMoney,
  looksLikeHtml,
  resolveColumnFn,
} from "./data-panel-utils.ts";

/**
 * 可信 HTML 字符串 → 节点（@dreamer/view 禁 JSX innerHTML prop，经 ref 写入）。
 * 仅用于列 value／formatter 明确返回的可信片段，勿喂不可信用户输入。
 */
function TrustedHtml(p: { html: string; class?: string }): JSXRenderable {
  return (
    <span
      class={p.class}
      ref={(el: HTMLElement) => {
        if (el && el.innerHTML !== p.html) el.innerHTML = p.html;
      }}
    />
  );
}

/** 原始文本 + 可选 color／tag → dp-tag；自定义节点原样返回 */
function coerceFnResult(
  result: unknown,
  c: Column,
  row: Row,
): unknown {
  if (result === null || result === undefined) return "—";
  if (typeof result === "string") {
    if (looksLikeHtml(result)) return <TrustedHtml html={result} />;
    const tone = typeof c.color === "function" ? c.color(row) : undefined;
    if (c.type === "tag" || tone) {
      return (
        <span
          class={`inline-block rounded px-1.5 py-0.5 text-xs ${
            TONE[tone ?? "default"]
          }`}
        >
          {result === "" ? "—" : result}
        </span>
      );
    }
    return result === "" ? "—" : result;
  }
  if (typeof result === "number" || typeof result === "boolean") {
    const text = String(result);
    const tone = typeof c.color === "function" ? c.color(row) : undefined;
    if (c.type === "tag" || tone) {
      return (
        <span
          class={`inline-block rounded px-1.5 py-0.5 text-xs ${
            TONE[tone ?? "default"]
          }`}
        >
          {text}
        </span>
      );
    }
    return text;
  }
  return result;
}

/** 非编辑态的单元格／详情字段展示（与 DataPanel `plainCell` 对齐）。 */
export function plainCell(
  c: Column,
  row: Row,
  raw: unknown,
  m: Pick<Messages, "yes" | "no">,
): unknown {
  const fn = resolveColumnFn(c, row);
  if (fn !== undefined) return coerceFnResult(fn, c, row);
  switch (c.type) {
    case "tag": {
      if (Array.isArray(raw)) {
        return raw.length === 0
          ? "—"
          : (
            <span class="inline-flex flex-wrap gap-1">
              {raw.map((v) => {
                const oo = c.options?.find((x) => x.value === String(v));
                return (
                  <span
                    class={`inline-block rounded px-1.5 py-0.5 text-xs ${
                      TONE[oo?.tone ?? "default"]
                    }`}
                  >
                    {oo?.label ?? String(v)}
                  </span>
                );
              })}
            </span>
          );
      }
      const o = c.options?.find((x) => x.value === String(raw));
      return (
        <span
          class={`inline-block rounded px-1.5 py-0.5 text-xs ${
            TONE[o?.tone ?? "default"]
          }`}
        >
          {o?.label ?? String(raw ?? "")}
        </span>
      );
    }
    case "image":
      return raw
        ? (
          <img
            src={String(raw)}
            alt=""
            class="h-8 w-8 rounded object-cover"
          />
        )
        : "—";
    case "link":
      return raw
        ? (
          <a
            href={String(raw)}
            class="text-blue-600 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            {String(raw)}
          </a>
        )
        : "—";
    case "money":
      return <span class="tabular-nums">{formatMoney(raw) || "—"}</span>;
    default: {
      const v = displayValue(c, row, m);
      return v === "" ? "—" : v;
    }
  }
}

export interface ViewDescriptionItem {
  label: string;
  children: unknown;
}

/** 按 DataPanel view 字段区规则构建 Descriptions items（含字段级 render 与 click）。 */
export function buildViewDescriptionItems(
  fields: readonly ViewItem[] | undefined,
  row: Row,
  m: Pick<Messages, "yes" | "no">,
  onFieldClick?: (item: ViewItem, prop: string, row: Row) => void,
): ViewDescriptionItem[] {
  const items: ViewDescriptionItem[] = [];
  if (!fields) return items;
  for (const f of fields) {
    const prop = colProp(f);
    let children: unknown = plainCell(f, row, row[prop], m);
    if (children === undefined || children === null || children === "") {
      children = "—";
    }
    const defaultNode = children;
    if (typeof f.render === "function") {
      children = f.render({
        item: f,
        prop,
        row,
        raw: row[prop],
        defaultNode,
      });
    }
    const click = f.click;
    if (click) {
      children = (
        <button
          type="button"
          class="cursor-pointer appearance-none border-0 bg-transparent p-0 text-left text-inherit"
          data-testid={`dv-view-click-${prop}`}
          onClick={() => onFieldClick?.(f, prop, row)}
        >
          {children}
        </button>
      );
    }
    items.push({ label: f.label ?? prop, children });
  }
  return items;
}
