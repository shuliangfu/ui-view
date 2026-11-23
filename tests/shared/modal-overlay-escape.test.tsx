/** @jsxImportSource @dreamer/view */
/**
 * Modal 内弹出层须逃出正文 overflow 与底栏叠层：默认 anchored 的 Select 应自动改为视口 fixed。
 * 同时确认未处于裁切祖先时仍保持 absolute。
 */
import "./happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Modal } from "../../src/desktop/feedback/Modal.tsx";
import { Select } from "../../src/shared/form/Select.tsx";
import {
  ancestorClipsAnchoredOverlay,
  resolvePickerViewportAttach,
} from "../../src/shared/form/picker-portal-utils.ts";

const OPTIONS = [
  { value: "hk", label: "香港 (HK)" },
  { value: "cn", label: "中国 (CN)" },
  { value: "us", label: "美国 (US)" },
];

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 30);
  });
}

describe("ancestorClipsAnchoredOverlay", () => {
  it("treats overflow:hidden ancestors (except html/body) as clipping", () => {
    const host = document.createElement("div");
    host.style.overflow = "hidden";
    const child = document.createElement("button");
    host.appendChild(child);
    document.body.appendChild(host);
    expect(ancestorClipsAnchoredOverlay(child)).toBe(true);
    expect(resolvePickerViewportAttach("anchored", child)).toBe(true);
    expect(resolvePickerViewportAttach("viewport", child)).toBe(true);
    host.remove();
  });

  it("ignores unclipped parents and still honors explicit viewport", () => {
    const host = document.createElement("div");
    const child = document.createElement("button");
    host.appendChild(child);
    document.body.appendChild(host);
    expect(ancestorClipsAnchoredOverlay(child)).toBe(false);
    expect(resolvePickerViewportAttach("anchored", child)).toBe(false);
    expect(resolvePickerViewportAttach("viewport", child)).toBe(true);
    host.remove();
  });

  it("recognizes data-ui-modal-body even without computed overflow", () => {
    const host = document.createElement("div");
    host.setAttribute("data-ui-modal-body", "");
    const child = document.createElement("button");
    host.appendChild(child);
    document.body.appendChild(host);
    expect(ancestorClipsAnchoredOverlay(child)).toBe(true);
    host.remove();
  });
});

describe("Modal + Select overlay escape", () => {
  it("keeps Select anchored when no ancestor would clip the listbox", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const stop = mount(
      () => <Select size="sm" value="hk" options={OPTIONS} />,
      host,
    );
    await flush();
    const toggle = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    toggle.click();
    await flush();
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(listbox.className.includes("fixed")).toBe(false);
    expect(listbox.className.includes("absolute")).toBe(true);
    stop();
    host.remove();
  });

  it("auto-attaches Select to the viewport inside an overflow:hidden parent", async () => {
    const host = document.createElement("div");
    host.style.cssText = "width:80px;overflow:hidden";
    document.body.appendChild(host);
    const stop = mount(
      () => <Select size="sm" value="hk" options={OPTIONS} />,
      host,
    );
    await flush();
    const toggle = host.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    toggle.click();
    await flush();
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(listbox.className.includes("fixed")).toBe(true);
    stop();
    host.remove();
  });

  it("auto-attaches a bottom Select in Modal so the listbox is not covered by the footer", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const body = (
      <div>
        <p>昵称</p>
        <p>姓</p>
        <p>名</p>
        <p>电话</p>
        <Select size="sm" value="hk" options={OPTIONS} />
      </div>
    );
    const stop = mount(
      () => (
        <Modal
          open
          title="编辑"
          footer={
            <div>
              <button type="button">更新</button>
              <button type="button">取消</button>
            </div>
          }
          // deno-lint-ignore jsx-no-children-prop
          children={body}
        />
      ),
      host,
    );
    await flush();
    const panel = document.querySelector(
      "[data-ui-modal-panel]",
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    const toggle = panel.querySelector(
      'button[aria-haspopup="listbox"]',
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    await flush();
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox).toBeTruthy();
    expect(listbox.className.includes("fixed")).toBe(true);
    const modalBody = panel.querySelector("[data-ui-modal-body]");
    const footer = [...panel.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").includes("更新")
    );
    expect(modalBody).toBeTruthy();
    expect(footer).toBeTruthy();
    const z = Number.parseFloat(listbox.style.zIndex || "0");
    expect(z >= 100000 || listbox.className.includes("z-1070")).toBe(true);
    stop();
    host.remove();
  });
});
