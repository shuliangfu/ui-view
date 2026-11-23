/** @jsxImportSource @dreamer/view */
/**
 * Modal 同域 iframe：target=_blank/_top/_parent、修饰键／中键点击与 window.open
 * 均在 iframe 内导航，不打开新窗口、不替换父页。
 */
import "./happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Modal } from "../../src/desktop/feedback/Modal.tsx";

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 30);
  });
}

function mountModal(node: unknown): { stop: () => void; host: HTMLElement } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const stop = mount(() => node, host);
  return {
    stop: () => {
      stop();
      host.remove();
    },
    host,
  };
}

function setDocsUrl(): void {
  const happy = (globalThis as unknown as {
    window?: { happyDOM?: { setURL?: (url: string) => void } };
  }).window?.happyDOM;
  happy?.setURL?.("http://127.0.0.1:3000/desktop");
}

function parentHref(): string {
  return globalThis.location?.href ??
    (globalThis.window as { location?: { href?: string } } | undefined)
      ?.location?.href ??
    "";
}

function getIframe(): HTMLIFrameElement {
  const iframe = document.querySelector(
    "[data-ui-modal-iframe]",
  ) as HTMLIFrameElement;
  expect(iframe).toBeTruthy();
  return iframe;
}

function spyAssign(iframe: HTMLIFrameElement): {
  calls: string[];
  parentHref: string;
  openCalls: unknown[][];
} {
  const win = iframe.contentWindow;
  expect(win).toBeTruthy();
  const calls: string[] = [];
  const loc = win!.location;
  loc.assign = (url: string | URL) => {
    calls.push(String(url));
  };
  const href = parentHref();
  const openCalls: unknown[][] = [];
  const parent = globalThis.window as unknown as {
    open?: (...args: unknown[]) => unknown;
  };
  const originalOpen = parent.open?.bind(parent);
  if (typeof parent.open === "function") {
    parent.open = (...args: unknown[]) => {
      openCalls.push(args);
      return originalOpen?.(...args) ?? null;
    };
  }
  return { calls, parentHref: href, openCalls };
}

function writeFrame(
  iframe: HTMLIFrameElement,
  html: string,
): Document {
  const doc = iframe.contentDocument;
  expect(doc).toBeTruthy();
  if (doc!.body == null) {
    doc!.documentElement.appendChild(doc!.createElement("body"));
  }
  doc!.body.innerHTML = html;
  iframe.dispatchEvent(new Event("load"));
  const live = iframe.contentDocument;
  expect(live).toBeTruthy();
  expect(live!.body?.innerHTML).toBeTruthy();
  return live!;
}

function mouse(
  type: string,
  init: MouseEventInit,
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
}

describe("Modal same-origin iframe stays inside the dialog", () => {
  it("keeps target=_blank clicks in the iframe and does not open a window", async () => {
    setDocsUrl();
    const { stop } = mountModal(
      <Modal open title="嵌入页面" src="about:blank" height={480} />,
    );
    try {
      await flush();
      const iframe = getIframe();
      const doc = writeFrame(
        iframe,
        `<a id="go" href="http://127.0.0.1:3000/desktop/basic/button" target="_blank">go</a>`,
      );
      const { calls, parentHref: href, openCalls } = spyAssign(iframe);
      const link = doc.getElementById("go") as HTMLAnchorElement;
      expect(link).toBeTruthy();
      link.dispatchEvent(mouse("click", {}));
      expect(calls.length).toBe(1);
      expect(calls[0]!.includes("/desktop/basic/button")).toBe(true);
      expect(parentHref()).toBe(href);
      expect(openCalls.length).toBe(0);
    } finally {
      stop();
    }
  });

  it("keeps target=_top clicks in the iframe and does not replace the parent", async () => {
    setDocsUrl();
    const { stop } = mountModal(
      <Modal open title="嵌入页面" src="about:blank" height={480} />,
    );
    try {
      await flush();
      const iframe = getIframe();
      const doc = writeFrame(
        iframe,
        `<a id="go" href="http://127.0.0.1:3000/mobile" target="_top">go</a>`,
      );
      const { calls, parentHref: href } = spyAssign(iframe);
      const link = doc.getElementById("go") as HTMLAnchorElement;
      expect(link).toBeTruthy();
      link.dispatchEvent(mouse("click", {}));
      expect(calls.length).toBe(1);
      expect(calls[0]!.includes("/mobile")).toBe(true);
      expect(parentHref()).toBe(href);
    } finally {
      stop();
    }
  });

  it("routes window.open to the iframe instead of a popup", async () => {
    setDocsUrl();
    const { stop } = mountModal(
      <Modal open title="嵌入页面" src="about:blank" height={480} />,
    );
    try {
      await flush();
      const iframe = getIframe();
      writeFrame(iframe, `<p>page</p>`);
      const { calls, parentHref: href, openCalls } = spyAssign(iframe);
      const result = iframe.contentWindow!.open(
        "http://127.0.0.1:3000/desktop/basic/icon",
        "_blank",
      );
      expect(result === iframe.contentWindow).toBe(true);
      expect(calls.length).toBe(1);
      expect(calls[0]!.includes("/desktop/basic/icon")).toBe(true);
      expect(parentHref()).toBe(href);
      expect(openCalls.length).toBe(0);
    } finally {
      stop();
    }
  });

  it("keeps modifier and middle clicks in the iframe", async () => {
    setDocsUrl();
    const { stop } = mountModal(
      <Modal open title="嵌入页面" src="about:blank" height={480} />,
    );
    try {
      await flush();
      const iframe = getIframe();
      const doc = writeFrame(
        iframe,
        `<a id="go" href="http://127.0.0.1:3000/desktop/basic/link">go</a>`,
      );
      const { calls, parentHref: href, openCalls } = spyAssign(iframe);
      const link = doc.getElementById("go") as HTMLAnchorElement;
      expect(link).toBeTruthy();
      link.dispatchEvent(mouse("click", { metaKey: true }));
      link.dispatchEvent(mouse("click", { ctrlKey: true }));
      link.dispatchEvent(mouse("click", { shiftKey: true }));
      link.dispatchEvent(mouse("click", { altKey: true }));
      link.dispatchEvent(mouse("auxclick", { button: 1 }));
      expect(calls.length).toBe(5);
      for (const url of calls) {
        expect(url.includes("/desktop/basic/link")).toBe(true);
      }
      expect(parentHref()).toBe(href);
      expect(openCalls.length).toBe(0);
    } finally {
      stop();
    }
  });

  it("keeps target=_parent clicks in the iframe and does not replace the parent", async () => {
    setDocsUrl();
    const { stop } = mountModal(
      <Modal open title="嵌入页面" src="about:blank" height={480} />,
    );
    try {
      await flush();
      const iframe = getIframe();
      const doc = writeFrame(
        iframe,
        `<a id="go" href="http://127.0.0.1:3000/desktop/basic/button" target="_parent">go</a>`,
      );
      const { calls, parentHref: href, openCalls } = spyAssign(iframe);
      const link = doc.getElementById("go") as HTMLAnchorElement;
      expect(link).toBeTruthy();
      link.dispatchEvent(mouse("click", {}));
      expect(calls.length).toBe(1);
      expect(calls[0]!.includes("/desktop/basic/button")).toBe(true);
      expect(parentHref()).toBe(href);
      expect(openCalls.length).toBe(0);
    } finally {
      stop();
    }
  });

  it("rewrites form target=_blank/_top so submit stays in the iframe", async () => {
    setDocsUrl();
    const { stop } = mountModal(
      <Modal open title="嵌入页面" src="about:blank" height={480} />,
    );
    try {
      await flush();
      const iframe = getIframe();
      const href = parentHref();
      for (const target of ["_blank", "_top"]) {
        const doc = writeFrame(
          iframe,
          `<form id="f" action="http://127.0.0.1:3000/submitted" target="${target}"><button type="submit">go</button></form>`,
        );
        const form = doc.getElementById("f") as HTMLFormElement;
        expect(form).toBeTruthy();
        expect(form.target).toBe(target);
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
        expect(form.target).toBe("_self");
        expect(parentHref()).toBe(href);
      }
    } finally {
      stop();
    }
  });
});
