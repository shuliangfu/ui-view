/** @jsxImportSource @dreamer/view */
/**
 * Popconfirm：confirmLoading 与 onConfirm Promise 完成后再关。
 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Popconfirm } from "../../src/desktop/feedback/Popconfirm.tsx";

/**
 * 把组件挂到临时节点，返回卸载函数。
 *
 * @param fn - 渲染函数
 */
async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.requestAnimationFrame(() => resolve());
  });
}

function mountTemp(fn: () => unknown): () => void {
  const root = globalThis.document.createElement("div");
  globalThis.document.body.appendChild(root);
  const dispose = mount(fn, root);
  return () => {
    dispose();
    root.remove();
  };
}

describe("Popconfirm confirmLoading", () => {
  it("confirmLoading 时确定钮带 data-loading，取消钮 disabled", () => {
    const open = createSignal(true);
    const unmount = mountTemp(() => (
      <Popconfirm
        open={open}
        title="确认发送？"
        okText="确定"
        cancelText="取消"
        confirmLoading
        onConfirm={() => {}}
      >
        <span>触发器</span>
      </Popconfirm>
    ));
    try {
      const panel = globalThis.document.querySelector(
        "[data-dreamer-popconfirm-panel]",
      );
      expect(panel).not.toBe(null);
      expect(panel!.textContent ?? "").toContain("确认发送？");
      expect(panel!.querySelector("[data-loading]")).not.toBe(null);
      const cancel = [...panel!.querySelectorAll("button")].find((b) =>
        (b.textContent ?? "").includes("取消")
      );
      expect(cancel?.disabled).toBe(true);
    } finally {
      unmount();
    }
  });

  it("onConfirm 返回的 Promise 成功后再关，pending 时保持打开", async () => {
    const open = createSignal(true);
    let resolve!: () => void;
    const pending = new Promise<void>((r) => {
      resolve = r;
    });
    const unmount = mountTemp(() => (
      <Popconfirm
        open={open}
        title="确认发送？"
        okText="确定"
        cancelText="取消"
        onConfirm={() => pending}
      >
        <span>触发器</span>
      </Popconfirm>
    ));
    try {
      const panel = globalThis.document.querySelector(
        "[data-dreamer-popconfirm-panel]",
      );
      const ok = [...panel!.querySelectorAll("button")].find((b) =>
        (b.textContent ?? "").includes("确定")
      );
      ok!.click();
      await flush();
      const opened = globalThis.document.querySelector(
        "[data-dreamer-popconfirm-panel]",
      );
      expect(opened).not.toBe(null);
      expect(opened!.querySelector("[data-loading]")).not.toBe(null);
      expect(open.value).toBe(true);
      resolve();
      await pending;
      await flush();
      expect(open.value).toBe(false);
      expect(
        globalThis.document.querySelector("[data-dreamer-popconfirm-panel]"),
      ).toBe(null);
    } finally {
      unmount();
    }
  });

  it("onConfirm 的 Promise 失败时保持打开并结束 loading", async () => {
    const open = createSignal(true);
    let reject!: (reason?: unknown) => void;
    const pending = new Promise<void>((_, r) => {
      reject = r;
    });
    const unmount = mountTemp(() => (
      <Popconfirm
        open={open}
        title="确认发送？"
        okText="确定"
        cancelText="取消"
        onConfirm={() => pending}
      >
        <span>触发器</span>
      </Popconfirm>
    ));
    try {
      const panel = globalThis.document.querySelector(
        "[data-dreamer-popconfirm-panel]",
      );
      const ok = [...panel!.querySelectorAll("button")].find((b) =>
        (b.textContent ?? "").includes("确定")
      );
      ok!.click();
      await flush();
      const opened = globalThis.document.querySelector(
        "[data-dreamer-popconfirm-panel]",
      );
      expect(opened).not.toBe(null);
      expect(opened!.querySelector("[data-loading]")).not.toBe(null);
      reject(new Error("fail"));
      await pending.catch(() => undefined);
      await flush();
      expect(open.value).toBe(true);
      const stayed = globalThis.document.querySelector(
        "[data-dreamer-popconfirm-panel]",
      );
      expect(stayed).not.toBe(null);
      expect(stayed!.querySelector("[data-loading]")).toBe(null);
    } finally {
      unmount();
    }
  });
});
