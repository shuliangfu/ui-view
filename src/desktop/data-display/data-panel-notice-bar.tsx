/**
 * DataPanel／DataView 页面通知条：复用共享 NoticeBar，统一解析配置与关闭态。
 * 关闭态用组件级稳定 signal 保存，勿在每次渲染里 createSignal。
 */
import { createSignal, type JSXRenderable } from "@dreamer/view";
import { isAlertClosed } from "../feedback/Alert.tsx";
import { NoticeBar, type NoticeBarProps } from "../feedback/NoticeBar.tsx";
import { NOTICE_BAR_WRAP_CLS } from "./data-panel-chrome.tsx";

/**
 * 面板／详情页通知条配置：完整透传 {@link NoticeBarProps} 全部字段，
 * 另加 `show`（按条件隐藏）与可选 `key`（关闭后换一条时用来识别）。
 */
export interface DataNoticeBarConfig extends NoticeBarProps {
  /**
   * 为 `false`（或函数返回 false）时不渲染通知条，配置本身可保留。
   * 写法与字段／按钮的 `show` 一致。
   */
  show?: boolean | (() => boolean);
  /**
   * 可选识别键。与 `tone`／`content` 一起构成通知身份；
   * 身份变化后，先前关闭的通知会再次显示。
   */
  key?: string;
}

/**
 * `noticeBar` 属性：字符串简写、完整配置、关闭，或渲染时求值的函数。
 * `false`／`null`／省略／空字符串／`show: false` 均不渲染。
 */
export type DataNoticeBarProp =
  | string
  | DataNoticeBarConfig
  | false
  | null
  | (() => string | DataNoticeBarConfig | false | null | undefined);

function contentKey(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string" || typeof content === "number") {
    return String(content);
  }
  if (Array.isArray(content)) return content.map(contentKey).join("\n");
  return "";
}

/** 把 `noticeBar` 收成可渲染的配置；无效或显式隐藏时返回 null。 */
export function resolveDataNoticeBar(
  noticeBar: DataNoticeBarProp | undefined,
): DataNoticeBarConfig | null {
  const raw = typeof noticeBar === "function" ? noticeBar() : noticeBar;
  if (raw == null || raw === false) return null;
  if (typeof raw === "string") {
    if (raw === "") return null;
    return { content: raw };
  }
  if (typeof raw !== "object") return null;
  const show = raw.show;
  if (typeof show === "function") {
    if (!show()) return null;
  } else if (show === false) {
    return null;
  }
  return raw;
}

/** 稳定身份：可选 key + tone + content。 */
export function dataNoticeBarIdentity(
  cfg: DataNoticeBarConfig | null,
): string {
  if (!cfg) return "";
  return `${cfg.key ?? ""}\0${cfg.tone ?? "info"}\0${contentKey(cfg.content)}`;
}

/** 组件级关闭态。在 DataPanel／DataView 函数体里创建一次即可。 */
export function createDataNoticeBarState(): DataNoticeBarState {
  const lastId = createSignal("");
  const dismissed = createSignal(false);

  function visible(
    noticeBar: DataNoticeBarProp | undefined,
  ): DataNoticeBarConfig | null {
    const cfg = resolveDataNoticeBar(noticeBar);
    const id = dataNoticeBarIdentity(cfg);
    if (id !== lastId.value) {
      lastId.value = id;
      if (dismissed.value) dismissed.value = false;
    }
    if (!cfg || dismissed.value) return null;
    if (cfg.closeKey && isAlertClosed(cfg.closeKey)) return null;
    return cfg;
  }

  function close(): void {
    dismissed.value = true;
  }

  return { visible, close };
}

export interface DataNoticeBarState {
  visible: (
    noticeBar: DataNoticeBarProp | undefined,
  ) => DataNoticeBarConfig | null;
  close: () => void;
}

/**
 * 工具栏下方、表格／详情正文上方的通知条，与页面提示条同一位置。
 * 本插槽默认 `closable` 为 true（页面通知通常可关闭），
 * `rounded` 默认 `md`；均可显式覆盖。关闭时先记下已关闭，再调用配置里的 `onClose`。
 */
export function DataChromeNoticeBar(props: {
  noticeBar?: DataNoticeBarProp;
  testId: string;
  state: DataNoticeBarState;
}): JSXRenderable {
  // 必须返回 thunk：组件 setup 在 untrack 中执行，顶层读 dismissed 不会订阅，
  // 关闭后子树不会重绘。insert 会对返回的函数建立追踪 Effect。
  return () => {
    const cfg = props.state.visible(props.noticeBar);
    if (!cfg) return null;
    const {
      show: _show,
      key: _key,
      closable,
      rounded,
      onClose,
      ...rest
    } = cfg;
    return (
      <div class={NOTICE_BAR_WRAP_CLS} data-testid={props.testId}>
        <NoticeBar
          {...rest}
          rounded={rounded ?? "md"}
          closable={closable ?? true}
          onClose={() => {
            props.state.close();
            onClose?.();
          }}
        />
      </div>
    );
  };
}
