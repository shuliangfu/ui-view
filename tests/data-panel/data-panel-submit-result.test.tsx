/** @jsxImportSource @dreamer/view */
/** Unit-only context/signal contract; physical docs proof lives in form-continue-physical. */
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
  DataSource,
  FormActionContext,
  FormConfig,
  FormFieldRenderCtx,
  WriteResult,
} from "../../src/desktop/data-display/data-panel-types.ts";
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 40));
describe("DataPanel submit result", () => {
  for (const kind of ["panel", "view"] as const) {
    it(
      "submit result " + kind +
        ": validation/field/server/network/busy false; only successful write true",
      async () => {
        const host = document.createElement("div");
        document.body.appendChild(host);
        const key = "submit-result-" + kind, row = { id: "1", name: "seed" };
        let ctx: FormActionContext | undefined,
          field: FormFieldRenderCtx | undefined,
          calls = 0,
          mode = "message",
          resolveWrite: ((r: WriteResult) => void) | undefined;
        const write = async (): Promise<WriteResult> => {
          calls++;
          if (mode === "throw") throw new Error("offline-test");
          if (mode === "fields") {
            return { ok: false, messages: { name: "server field failure" } };
          }
          if (mode === "pending") {
            return await new Promise<WriteResult>((resolve) =>
              resolveWrite = resolve
            );
          }
          return { ok: false, message: "server message failure" };
        };
        const source: DataSource = {
          list: () => ({ rows: [row], total: 1 }),
          view: () => row,
          create: write,
          update: write,
        };
        const form: FormConfig = {
          props: [{
            prop: "name",
            label: "Name",
            required: true,
            render: (c) => {
              field = c;
              return <input value={c.value} />;
            },
          }],
          actions: {
            probe: {
              title: (c) => {
                ctx = c;
                return "capture";
              },
              action: () => {},
            },
          },
        };
        const stop = mount(
          () =>
            kind === "panel"
              ? (
                <DataPanel
                  panelKey={key}
                  title="test"
                  syncUrl={false}
                  columns={[{ prop: "name" }]}
                  dataSource={source}
                  form={form}
                />
              )
              : (
                <DataView
                  panelKey={key}
                  title="test"
                  data={row}
                  dataSource={source}
                  form={form}
                  view={{ props: [{ prop: "name" }] }}
                />
              ),
          host,
        );
        const prefix = kind === "panel" ? "dp" : "dv";
        const input = () =>
          document.querySelector(
            `[data-testid="${prefix}-fld-name"] input`,
          ) as HTMLInputElement;
        const enter = async (text: string) => {
          if (!field) throw new Error("missing field context");
          field.value.value = text;
          await flush();
        };
        try {
          await flush();
          if (kind === "view") openDataViewForm(key, row);
          else openDataPanelForm(key);
          await flush();
          if (!ctx) throw new Error("missing footer context");
          await enter("");
          expect(await ctx.submit()).toBe(false);
          expect(calls).toBe(0);
          await flush();
          await enter("kept-value");
          for (const rejected of ["message", "fields", "throw"]) {
            mode = rejected;
            expect(await ctx.submit()).toBe(false);
            await flush();
            expect(input().value).toBe("kept-value");
          }
          expect(calls).toBe(3);
          mode = "pending";
          const pending = ctx.submit();
          await flush();
          expect(await ctx.submit()).toBe(false);
          expect(calls).toBe(4);
          if (!resolveWrite) throw new Error("write did not start");
          resolveWrite({ ok: true });
          expect(await pending).toBe(true);
          await flush();
          expect(document.querySelector(`[data-testid="${prefix}-form"]`))
            .toBeNull();
        } finally {
          resolveWrite?.({ ok: true });
          stop();
          host.remove();
        }
      },
    );
  }
});
