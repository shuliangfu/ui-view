/** @jsxImportSource @dreamer/view */
/** Unit-only public-context contract, not native browser coverage. */
import "../shared/happy-dom-setup.ts";
import { mount } from "@dreamer/view";
import { describe, expect, it } from "@dreamer/test";
import {
  DataPanel,
  openDataPanelForm,
  openDataViewForm,
} from "../../src/desktop/data-display/DataPanel.tsx";
import { DataView } from "../../src/desktop/data-display/DataView.tsx";
import type {
  FormConfig,
  FormFieldRenderCtx,
} from "../../src/desktop/data-display/data-panel-types.ts";
const flush = () => new Promise<void>((r) => setTimeout(r, 40));
describe("DataPanel dynamic form options", () => {
  for (const kind of ["panel", "view"] as const) {
    it(
      "dynamic form options " + kind +
        ": current values update labels; equal option lists preserve sibling/input nodes",
      async () => {
        const host = document.createElement("div");
        document.body.appendChild(host);
        const key = "dynamic-options-" + kind,
          prefix = kind === "panel" ? "dp" : "dv";
        const row = {
          id: "1",
          role: "viewer",
          name: "seed",
          scope: "self",
          tags: ["self"],
        };
        let role: FormFieldRenderCtx | undefined,
          name: FormFieldRenderCtx | undefined;
        const form: FormConfig = {
          props: [
            {
              prop: "role",
              initial: "viewer",
              render: (c) => {
                role = c;
                return <input value={c.value} />;
              },
            },
            {
              prop: "name",
              initial: "seed",
              render: (c) => {
                name = c;
                return <input value={c.value} />;
              },
            },
            {
              prop: "scope",
              type: "select",
              initial: "self",
              options: (
                { values },
              ) => [{
                value: "self",
                label: values.role === "admin" ? "Admin self" : "Viewer self",
              }],
            },
            {
              prop: "tags",
              type: "multiselect",
              initial: "self",
              options: (
                { values },
              ) => [{
                value: "self",
                label: values.role === "admin" ? "Admin tag" : "Viewer tag",
              }],
            },
            {
              prop: "email",
              disabled: ({ values }) => values.role === "viewer",
            },
          ],
        };
        const stop = mount(
          () =>
            kind === "panel"
              ? (
                <DataPanel
                  panelKey={key}
                  title="test"
                  syncUrl={false}
                  data={[row]}
                  columns={[{ prop: "name" }]}
                  form={form}
                />
              )
              : (
                <DataView
                  panelKey={key}
                  title="test"
                  data={row}
                  form={form}
                  view={{ props: [{ prop: "name" }] }}
                />
              ),
          host,
        );
        const field = (prop: string) =>
          document.querySelector(`[data-testid="${prefix}-fld-${prop}"]`)!;
        try {
          await flush();
          if (kind === "panel") openDataPanelForm(key);
          else openDataViewForm(key, row);
          await flush();
          if (!role || !name) throw new Error("Missing public field contexts");
          const input = field("name").querySelector("input")!;
          expect(field("scope").textContent).toContain("Viewer self");
          expect(field("tags").textContent).toContain("Viewer tag");
          expect(
            (field("email").querySelector("input") as HTMLInputElement)
              .disabled,
          ).toBe(true);
          role.value.value = "admin";
          await flush();
          expect(field("scope").textContent).toContain("Admin self");
          expect(field("tags").textContent).toContain("Admin tag");
          expect(
            (field("email").querySelector("input") as HTMLInputElement)
              .disabled,
          ).toBe(false);
          const select = field("scope"), multi = field("tags");
          for (const draft of ["d", "dr", "draft-kept"]) {
            name.value.value = draft;
            await flush();
            expect(field("name").querySelector("input")).toBe(input);
            expect(input.value).toBe(draft);
            expect(field("scope")).toBe(select);
            expect(field("tags")).toBe(multi);
          }
          role.value.value = "viewer";
          await flush();
          expect(field("scope").textContent).toContain("Viewer self");
          expect(field("tags").textContent).toContain("Viewer tag");
          expect(input.value).toBe("draft-kept");
          expect(field("name").querySelector("input")).toBe(input);
        } finally {
          stop();
          host.remove();
          await flush();
        }
      },
    );
  }
});
