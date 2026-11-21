/** @jsxImportSource @dreamer/view */
import "./happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Upload, type UploadProps } from "../../src/shared/form/Upload.tsx";
const flush = () => new Promise((resolve) => setTimeout(resolve, 40));
function fixture(props: UploadProps) {
  const host = document.createElement("div");
  document.body.append(host);
  const stop = mount(
    () => <Upload {...props} id={crypto.randomUUID()} />,
    host,
  );
  return {
    host,
    close: () => {
      stop();
      host.remove();
    },
  };
}
function choose(host: HTMLElement, file: File) {
  const input = host.querySelector('input[type="file"]')! as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
function hidden(host: HTMLElement) {
  return (host.querySelector('input[type="hidden"]') as HTMLInputElement).value;
}
function press(host: HTMLElement, label: string) {
  const button = [...host.querySelectorAll("button")].find((el) =>
    el.textContent?.trim() === label || el.getAttribute("aria-label") === label
  );
  if (!button) throw new Error("missing " + label);
  button.click();
}
describe("Upload reactivity", () => {
  it("Upload drag class tokens enter/leave/drop without InvalidCharacterError", async () => {
    const { host, close } = fixture({
      multiple: true,
      requestUpload: () => Promise.resolve("/native.png"),
    });
    try {
      await flush();
      const input = host.querySelector('input[type="file"]')!,
        zone = input.parentElement!;
      const file = new File(["png"], "native.png", { type: "image/png" });
      const fire = (type: string) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, "dataTransfer", {
          value: { files: [file], dropEffect: "none" },
        });
        zone.dispatchEvent(event);
      };
      fire("dragover");
      expect(zone.classList.contains("border-blue-500")).toBe(true);
      fire("dragleave");
      expect(zone.classList.contains("border-blue-500")).toBe(false);
      fire("dragover");
      fire("drop");
      await flush();
      expect(zone.classList.contains("border-blue-500")).toBe(false);
      expect(hidden(host)).toBe('["/native.png"]');
    } finally {
      close();
    }
  });
  it("Upload invalid type/size rows are removable but never offer a no-op retry", async () => {
    let calls = 0;
    const { host, close } = fixture({
      accept: "image/*",
      multiple: true,
      maxFileSize: 2,
      requestUpload: () => {
        calls++;
        return Promise.resolve("/file");
      },
    });
    try {
      await flush();
      choose(host, new File(["txt"], "wrong.txt", { type: "text/plain" }));
      await flush();
      choose(host, new File(["long"], "large.png", { type: "image/png" }));
      await flush();
      expect(calls).toBe(0);
      expect(hidden(host)).toBe("[null,null]");
      expect(
        [...host.querySelectorAll("button")].some((b) =>
          b.textContent?.trim() === "重试"
        ),
      ).toBe(false);
      press(host, "移除 wrong.txt");
      press(host, "移除 large.png");
      await flush();
      expect(hidden(host)).toBe("[]");
      expect(host.querySelectorAll("li").length).toBe(0);
    } finally {
      close();
    }
  });
  it("Upload transport failure retains the original file for exactly one retry", async () => {
    let calls = 0;
    const seen: File[] = [];
    const { host, close } = fixture({
      requestUpload: (file) => {
        seen.push(file);
        return ++calls === 1
          ? Promise.reject(new Error("network-failure"))
          : Promise.resolve("/retried");
      },
    });
    try {
      await flush();
      const file = new File(["hello"], "retry.txt");
      choose(host, file);
      await flush();
      expect(host.textContent).toContain("network-failure");
      expect(hidden(host)).toBe("");
      press(host, "重试");
      await flush();
      expect(hidden(host)).toBe("/retried");
      expect(calls).toBe(2);
      expect(seen[0] === seen[1]).toBe(true);
    } finally {
      close();
    }
  });
  it("Upload a late custom success after cancel cannot resurrect a removed row", async () => {
    let signal: AbortSignal | undefined;
    const pending = Promise.withResolvers<string>();
    const { host, close } = fixture({
      requestUpload: (_file, incoming) => {
        signal = incoming;
        return pending.promise;
      },
    });
    try {
      await flush();
      choose(host, new File(["hello"], "cancel.txt"));
      await flush();
      press(host, "取消或移除 cancel.txt");
      await flush();
      expect(signal?.aborted).toBe(true);
      pending.resolve("/too-late");
      await flush();
      expect(host.querySelectorAll("li").length).toBe(0);
      expect(hidden(host)).toBe("");
    } finally {
      pending.resolve("/cleanup");
      close();
    }
  });

  it("Upload a replaced single-file request cannot later overwrite its replacement", async () => {
    const old = Promise.withResolvers<string>();
    const { host, close } = fixture({
      requestUpload: (file) =>
        file.name === "old.txt" ? old.promise : Promise.resolve("/new"),
    });
    try {
      await flush();
      choose(host, new File(["old"], "old.txt"));
      await flush();
      choose(host, new File(["new"], "new.txt"));
      await flush();
      expect(hidden(host)).toBe("/new");
      old.resolve("/stale");
      await flush();
      expect(hidden(host)).toBe("/new");
      expect(host.querySelectorAll("li").length).toBe(1);
      expect(host.textContent).toContain("new.txt");
      expect(host.textContent).not.toContain("old.txt");
    } finally {
      old.resolve("/cleanup");
      close();
    }
  });
});
