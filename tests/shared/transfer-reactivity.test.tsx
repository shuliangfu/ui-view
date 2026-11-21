/** @jsxImportSource @dreamer/view */
// Supplemental DOM ownership regression; real native selection lives in docs-browser.
import "./happy-dom-setup.ts";
import { createSignal, mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import { Form } from "../../src/shared/form/Form.tsx";
import { Transfer } from "../../src/shared/form/Transfer.tsx";
const flush = () => new Promise((resolve) => setTimeout(resolve, 40));
describe("Transfer reactivity", () => {
  it("Transfer target changes preserve enclosing Form siblings and search draft nodes", async () => {
    const target = createSignal<string[]>([]),
      other = createSignal<string[]>([]);
    const data = [{ key: "1", title: "苹果" }, { key: "3", title: "橙子" }];
    let mounts = 0;
    function Witness() {
      mounts++;
      return <input data-testid="draft" />;
    }
    const host = document.createElement("div");
    document.body.append(host);
    const stop = mount(() => (
      <Form>
        <Witness />
        <Transfer
          dataSource={data}
          targetKeys={target}
          showSearch
          searchPlaceholder={["first", "second"]}
        />
        <Transfer
          dataSource={data}
          targetKeys={other}
          showSearch
          searchPlaceholder={["sibling", "sibling-right"]}
        />
      </Form>
    ), host);
    try {
      await flush();
      const search = host.querySelector(
        'input[placeholder="first"]',
      ) as HTMLInputElement;
      const sibling = host.querySelector(
        'input[placeholder="sibling"]',
      ) as HTMLInputElement;
      const draft = host.querySelector(
        '[data-testid="draft"]',
      ) as HTMLInputElement;
      search.value = "橙";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      sibling.value = "苹";
      sibling.dispatchEvent(new Event("input", { bubbles: true }));
      draft.value = "unsaved sibling draft";
      await flush();
      target.value = ["3"];
      await flush();
      expect(mounts).toBe(1);
      expect(host.querySelector('input[placeholder="first"]')).toBe(search);
      expect(search.value).toBe("橙");
      expect(host.querySelector('input[placeholder="sibling"]')).toBe(sibling);
      expect(sibling.value).toBe("苹");
      expect(host.querySelector('[data-testid="draft"]')).toBe(draft);
      expect(draft.value).toBe("unsaved sibling draft");
      expect(
        [...host.querySelectorAll("select")[1].options].map((o) => o.value),
      )
        .toEqual(["3"]);
      target.value = [];
      await flush();
      expect(mounts).toBe(1);
      expect(search.value).toBe("橙");
      expect(
        [...host.querySelectorAll("select")[0].options].map((o) => o.value),
      )
        .toEqual(["3"]);
    } finally {
      stop();
      host.remove();
    }
  });
});
