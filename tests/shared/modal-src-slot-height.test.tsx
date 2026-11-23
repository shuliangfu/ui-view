/** @jsxImportSource @dreamer/view */
/**
 * Modal `src` iframe、title/footer 高度，以及外壳 width/height 数字像素。
 */
import "./happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import {
  DEFAULT_MODAL_IFRAME_SANDBOX,
  Modal,
} from "../../src/desktop/feedback/Modal.tsx";

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

describe("Modal src iframe", () => {
  it("fills the body with a sandboxed iframe and keeps title/footer", async () => {
    const { stop } = mountModal(
      <Modal
        open
        title="帮助"
        src="https://example.com/help"
        footer={<button type="button">关闭</button>}
      >
        <p data-testid="modal-child">不应出现</p>
      </Modal>,
    );
    await flush();
    const panel = document.querySelector(
      "[data-ui-modal-panel]",
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    const iframe = panel.querySelector(
      "[data-ui-modal-iframe]",
    ) as HTMLIFrameElement;
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute("src")).toBe("https://example.com/help");
    expect(iframe.getAttribute("sandbox")).toBe(DEFAULT_MODAL_IFRAME_SANDBOX);
    expect(iframe.getAttribute("title")).toBe("帮助");
    expect(panel.querySelector("#modal-title")?.textContent).toBe("帮助");
    expect(panel.querySelector("[data-ui-modal-footer]")?.textContent)
      .toContain(
        "关闭",
      );
    expect(panel.querySelector("[data-testid=modal-child]")).toBeNull();
    const shell = panel.querySelector(
      "[data-ui-modal-shell]",
    ) as HTMLElement;
    expect(shell.style.height).toBe("90vh");
    stop();
  });

  it("keeps children when src is omitted", async () => {
    const { stop } = mountModal(
      <Modal open title="详情">
        <p data-testid="modal-child">正文</p>
      </Modal>,
    );
    await flush();
    const panel = document.querySelector(
      "[data-ui-modal-panel]",
    ) as HTMLElement;
    expect(panel.querySelector("[data-testid=modal-child]")?.textContent).toBe(
      "正文",
    );
    expect(panel.querySelector("[data-ui-modal-iframe]")).toBeNull();
    stop();
  });

  it("drops a dangerous src and does not render an iframe", async () => {
    for (
      const src of [
        "javascript:alert(1)",
        "vbscript:msgbox(1)",
        "data:text/html,hi",
      ]
    ) {
      const { stop } = mountModal(
        <Modal open title="危险" src={src}>
          <p data-testid="modal-child">回退正文</p>
        </Modal>,
      );
      await flush();
      const panel = document.querySelector(
        "[data-ui-modal-panel]",
      ) as HTMLElement;
      expect(panel.querySelector("[data-ui-modal-iframe]")).toBeNull();
      expect(panel.querySelector("[data-testid=modal-child]")?.textContent)
        .toBe(
          "回退正文",
        );
      stop();
    }
  });

  it("omits sandbox when sandbox is false", async () => {
    const { stop } = mountModal(
      <Modal
        open
        src="https://example.com/admin"
        sandbox={false}
      />,
    );
    await flush();
    const iframe = document.querySelector(
      "[data-ui-modal-iframe]",
    ) as HTMLIFrameElement;
    expect(iframe).toBeTruthy();
    expect(iframe.hasAttribute("sandbox")).toBe(false);
    stop();
  });
});

describe("Modal titleHeight / footerHeight / shell size", () => {
  it("applies token and numeric heights on title and footer", async () => {
    const { stop } = mountModal(
      <Modal
        open
        title="标题"
        titleHeight="sm"
        footerHeight={64}
        footer={<button type="button">确定</button>}
      >
        <p>正文</p>
      </Modal>,
    );
    await flush();
    const title = document.querySelector(
      "[data-ui-modal-title]",
    ) as HTMLElement;
    const footer = document.querySelector(
      "[data-ui-modal-footer]",
    ) as HTMLElement;
    expect(title.style.height).toBe("48px");
    expect(footer.style.height).toBe("64px");
    stop();
  });

  it("applies numeric width and height on the shell", async () => {
    const { stop } = mountModal(
      <Modal open title="尺寸" width={480} height={600}>
        <p>正文</p>
      </Modal>,
    );
    await flush();
    const shell = document.querySelector(
      "[data-ui-modal-shell]",
    ) as HTMLElement;
    expect(shell.style.width).toBe("480px");
    expect(shell.style.height).toBe("600px");
    stop();
  });

  it("applies ms typo, CSS slot heights, and CSS shell size", async () => {
    const { stop } = mountModal(
      <Modal
        open
        title="标题"
        titleHeight="ms"
        footerHeight="3rem"
        width="70%"
        height="70vh"
        footer={<button type="button">确定</button>}
      >
        <p>正文</p>
      </Modal>,
    );
    await flush();
    const title = document.querySelector(
      "[data-ui-modal-title]",
    ) as HTMLElement;
    const footer = document.querySelector(
      "[data-ui-modal-footer]",
    ) as HTMLElement;
    const shell = document.querySelector(
      "[data-ui-modal-shell]",
    ) as HTMLElement;
    expect(title.style.height).toBe("48px");
    expect(footer.style.height).toBe("3rem");
    expect(shell.style.width).toBe("70%");
    expect(shell.style.height).toBe("70vh");
    stop();
  });
});

describe("Modal shell clips rounded corners without a footer", () => {
  function classOf(sel: string): string {
    const el = document.querySelector(sel) as HTMLElement;
    expect(el).toBeTruthy();
    return el.className;
  }

  it("clips overflow on the rounded shell and rounds the body/iframe when footer is omitted", async () => {
    const { stop } = mountModal(
      <Modal
        open
        title="嵌入页面"
        src="https://example.com/help"
        height={480}
      />,
    );
    await flush();
    const shell = classOf("[data-ui-modal-shell]");
    expect(shell.includes("rounded-xl")).toBe(true);
    expect(shell.includes("overflow-hidden")).toBe(true);
    const body = classOf("[data-ui-modal-body]");
    expect(body.includes("rounded-b-xl")).toBe(true);
    expect(body.includes("rounded-t-xl")).toBe(false);
    const iframe = classOf("[data-ui-modal-iframe]");
    expect(iframe.includes("rounded-b-xl")).toBe(true);
    expect(iframe.includes("rounded-t-xl")).toBe(false);
    stop();
  });

  it("does not round the body bottom when a footer is present", async () => {
    const { stop } = mountModal(
      <Modal
        open
        title="嵌入页面"
        src="https://example.com/help"
        footer={<button type="button">确定</button>}
      />,
    );
    await flush();
    const body = classOf("[data-ui-modal-body]");
    expect(body.includes("rounded-b-xl")).toBe(false);
    const footer = classOf("[data-ui-modal-footer]");
    expect(footer.includes("rounded-b-xl")).toBe(true);
    const shell = classOf("[data-ui-modal-shell]");
    expect(shell.includes("overflow-hidden")).toBe(true);
    stop();
  });

  it("rounds the body top when title is omitted, and both ends when title and footer are omitted", async () => {
    const titled = mountModal(
      <Modal open src="https://example.com/help">
        <p>unused</p>
      </Modal>,
    );
    await flush();
    let body = classOf("[data-ui-modal-body]");
    expect(body.includes("rounded-t-xl")).toBe(true);
    expect(body.includes("rounded-b-xl")).toBe(true);
    const iframe = classOf("[data-ui-modal-iframe]");
    expect(iframe.includes("rounded-t-xl")).toBe(true);
    expect(iframe.includes("rounded-b-xl")).toBe(true);
    titled.stop();

    const { stop } = mountModal(
      <Modal
        open
        src="https://example.com/help"
        footer={<button type="button">确定</button>}
      />,
    );
    await flush();
    body = classOf("[data-ui-modal-body]");
    expect(body.includes("rounded-t-xl")).toBe(true);
    expect(body.includes("rounded-b-xl")).toBe(false);
    stop();
  });
});
