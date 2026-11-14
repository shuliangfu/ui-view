/**
 * DataPanel／DataView 页面提示条：复用共享 Alert，统一解析配置与关闭态。
 * 关闭态用组件级稳定 signal 保存，勿在每次渲染里 createSignal。
 */
import { createSignal, type JSXRenderable } from "@dreamer/view";
import { Alert, type AlertProps } from "../feedback/Alert.tsx";
import { ALERT_WRAP_CLS } from "./data-panel-chrome.tsx";

/**
 * 面板／详情页提示条配置：完整透传 {@link AlertProps} 全部字段，
 * 另加 `show`（按条件隐藏）与可选 `key`（关闭后换一条时用来识别）。
 */
export interface DataAlertConfig extends AlertProps {
  /**
   * 为 `false`（或函数返回 false）时不渲染提示条，配置本身可保留。
   * 写法与字段／按钮的 `show` 一致。
   */
  show?: boolean | (() => boolean);
  /**
   * 可选识别键。与 `message`／`type`／`description` 一起构成提示身份；
   * 身份变化后，先前关闭的提示会再次显示。
   */
  key?: string;
}

/**
 * `alert` 属性：字符串简写、完整配置、关闭，或渲染时求值的函数。
 * `false`／`null`／省略／空字符串／`show: false` 均不渲染。
 */
export type DataAlertProp =
  | string
  | DataAlertConfig
  | false
  | null
  | (() => string | DataAlertConfig | false | null | undefined);

/** 把 `alert` 收成可渲染的配置；无效或显式隐藏时返回 null。 */
export function resolveDataAlert(
  alert: DataAlertProp | undefined,
): DataAlertConfig | null {
  const raw = typeof alert === "function" ? alert() : alert;
  if (raw == null || raw === false) return null;
  if (typeof raw === "string") {
    if (raw === "") return null;
    return { message: raw };
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

/** 稳定身份：可选 key + type + message + description。 */
export function dataAlertIdentity(cfg: DataAlertConfig | null): string {
  if (!cfg) return "";
  return `${cfg.key ?? ""}\0${cfg.type ?? "info"}\0${cfg.message ?? ""}\0${
    cfg.description ?? ""
  }`;
}

/** 组件级关闭态。在 DataPanel／DataView 函数体里创建一次即可。 */
export function createDataAlertState(): DataAlertState {
  const lastId = createSignal("");
  const dismissed = createSignal(false);

  function visible(alert: DataAlertProp | undefined): DataAlertConfig | null {
    const cfg = resolveDataAlert(alert);
    const id = dataAlertIdentity(cfg);
    if (id !== lastId.value) {
      lastId.value = id;
      if (dismissed.value) dismissed.value = false;
    }
    if (!cfg || dismissed.value) return null;
    return cfg;
  }

  function close(): void {
    dismissed.value = true;
  }

  return { visible, close };
}

export interface DataAlertState {
  visible: (alert: DataAlertProp | undefined) => DataAlertConfig | null;
  close: () => void;
}

/**
 * 工具栏下方、表格／详情正文上方的提示条。
 * 本插槽默认 `closable`／`banner` 为 true（页面提示通常可关闭、通栏样式）；
 * 调用方可显式覆盖。关闭时先记下已关闭，再调用配置里的 `onClose`。
 */
export function DataChromeAlert(props: {
  alert?: DataAlertProp;
  testId: string;
  state: DataAlertState;
}): JSXRenderable {
  // 必须返回 thunk：组件 setup 在 untrack 中执行，顶层读 dismissed 不会订阅，
  // 关闭后子树不会重绘。insert 会对返回的函数建立追踪 Effect。
  return () => {
    const cfg = props.state.visible(props.alert);
    if (!cfg) return null;
    const {
      show: _show,
      key: _key,
      closable,
      banner,
      onClose,
      ...rest
    } = cfg;
    return (
      <div class={ALERT_WRAP_CLS} data-testid={props.testId}>
        <Alert
          {...rest}
          closable={closable ?? true}
          banner={banner ?? true}
          onClose={() => {
            props.state.close();
            onClose?.();
          }}
        />
      </div>
    );
  };
}
