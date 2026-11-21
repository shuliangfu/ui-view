/** @jsxImportSource @dreamer/view */
/**
 * Accordion：点击标题应能展开/收起；整段 return () => 会导致 createSignal 被重建、点不动。
 */
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Accordion } from "../../src/shared/layout/Accordion.tsx";

const items = [
  { key: "1", header: "第一项", children: "内容一" },
  { key: "2", header: "第二项", children: "内容二" },
];

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

/** 实例前缀后 id 为 accordion-header-{instanceId}-{key}，不可只用 item.key。 */
function header(host: HTMLElement, key: string): HTMLButtonElement {
  const el = host.querySelector(
    `button[id^="accordion-header-"][id$="-${key}"]`,
  );
  if (!el) {
    throw new Error(`missing accordion header for key ${key}`);
  }
  return el as HTMLButtonElement;
}

describe("Accordion toggle", () => {
  it("非受控：点击标题展开后再点收回", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const stop = mount(
      () => <Accordion items={items} defaultExpandedKeys={["1"]} />,
      host,
    );
    try {
      await flush();
      expect(header(host, "1").getAttribute("aria-expanded")).toBe("true");
      expect(header(host, "2").getAttribute("aria-expanded")).toBe("false");
      header(host, "2").click();
      await flush();
      expect(header(host, "1").getAttribute("aria-expanded")).toBe("true");
      expect(header(host, "2").getAttribute("aria-expanded")).toBe("true");
      header(host, "1").click();
      await flush();
      expect(header(host, "1").getAttribute("aria-expanded")).toBe("false");
      expect(header(host, "2").getAttribute("aria-expanded")).toBe("true");
    } finally {
      stop();
      host.remove();
    }
  });

  it("受控 getter + allowMultiple=false：一次只展开一项", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const keys = createSignal<string[]>(["1"]);
    const stop = mount(
      () => (
        <Accordion
          items={items}
          expandedKeys={() => keys.value}
          onChange={(next) => (keys.value = next)}
          allowMultiple={false}
        />
      ),
      host,
    );
    try {
      await flush();
      expect(header(host, "1").getAttribute("aria-expanded")).toBe("true");
      header(host, "2").click();
      await flush();
      expect(keys.value).toEqual(["2"]);
      expect(header(host, "1").getAttribute("aria-expanded")).toBe("false");
      expect(header(host, "2").getAttribute("aria-expanded")).toBe("true");
      header(host, "2").click();
      await flush();
      expect(keys.value).toEqual([]);
      expect(header(host, "2").getAttribute("aria-expanded")).toBe("false");
    } finally {
      stop();
      host.remove();
    }
  });
});
