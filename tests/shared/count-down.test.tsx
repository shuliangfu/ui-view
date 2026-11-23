/** CountDown must terminate when mounted with an already-finished value. */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import {
  CountDown,
  type CountDownProps,
} from "../../src/shared/data-display/CountDown.tsx";

describe("CountDown expired initial render", () => {
  for (
    const [name, props] of [
      ["past numeric target", { target: 1 }],
      ["past Date target", { target: new Date(1) }],
      ["zero remaining", { remaining: 0 }],
      ["negative remaining", { remaining: -1 }],
      ["remaining takes priority over future target", {
        remaining: 0,
        target: 8_000_000_000_000,
      }],
      ["missing target", {}],
    ] satisfies [string, CountDownProps][]
  ) {
    it(name + " renders zero and finishes exactly once", async () => {
      let finishes = 0;
      const html = String(
        await renderToString(() => (
          <CountDown
            {...props}
            onFinish={() => {
              finishes++;
            }}
          />
        )),
      );
      expect(html.includes('role="timer"')).toBe(true);
      expect(html.includes("00:00:00")).toBe(true);
      expect(finishes).toBe(1);
    });
  }
});
