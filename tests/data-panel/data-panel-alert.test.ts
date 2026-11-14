/**
 * DataPanel／DataView 页面提示条：配置解析、关闭态与身份重置。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  createDataAlertState,
  dataAlertIdentity,
  resolveDataAlert,
} from "../../src/desktop/data-display/data-panel-alert.tsx";

describe("resolveDataAlert", () => {
  it("字符串简写变成 info 提示（只带 message）", () => {
    expect(resolveDataAlert("请先完成实名认证")).toEqual({
      message: "请先完成实名认证",
    });
  });

  it("false／null／undefined／空字符串不渲染", () => {
    expect(resolveDataAlert(false)).toBe(null);
    expect(resolveDataAlert(null)).toBe(null);
    expect(resolveDataAlert(undefined)).toBe(null);
    expect(resolveDataAlert("")).toBe(null);
  });

  it("show: false 或 show 函数返回 false 时隐藏", () => {
    expect(
      resolveDataAlert({ message: "请先完成实名认证", show: false }),
    ).toBe(null);
    expect(
      resolveDataAlert({ message: "请先完成实名认证", show: () => false }),
    ).toBe(null);
    expect(
      resolveDataAlert({ message: "请先完成实名认证", show: () => true })
        ?.message,
    ).toBe("请先完成实名认证");
  });

  it("函数形式在解析时求值", () => {
    expect(resolveDataAlert(() => "请先完成实名认证")).toEqual({
      message: "请先完成实名认证",
    });
    expect(resolveDataAlert(() => false)).toBe(null);
    expect(
      resolveDataAlert(() => ({
        type: "warning" as const,
        message: "请先完成实名认证",
        description: "未认证账号部分功能暂不可用。",
      }))?.type,
    ).toBe("warning");
  });

  it("对象配置保留 Alert 的全部字段", () => {
    const onClose = () => {};
    const cfg = resolveDataAlert({
      type: "error",
      message: "导入失败",
      description: "请检查文件格式",
      showIcon: false,
      closable: false,
      onClose,
      banner: false,
      action: "重试",
      class: "my-alert",
      children: "明细",
      messages: { close: "收起" },
      show: true,
      key: "import-error",
    });
    expect(cfg).not.toBe(null);
    expect(cfg!.type).toBe("error");
    expect(cfg!.message).toBe("导入失败");
    expect(cfg!.description).toBe("请检查文件格式");
    expect(cfg!.showIcon).toBe(false);
    expect(cfg!.closable).toBe(false);
    expect(cfg!.onClose).toBe(onClose);
    expect(cfg!.banner).toBe(false);
    expect(cfg!.action).toBe("重试");
    expect(cfg!.class).toBe("my-alert");
    expect(cfg!.children).toBe("明细");
    expect(cfg!.messages).toEqual({ close: "收起" });
    expect(cfg!.show).toBe(true);
    expect(cfg!.key).toBe("import-error");
  });
});

describe("dataAlertIdentity", () => {
  it("用 key／type／message／description 构成身份", () => {
    expect(dataAlertIdentity(null)).toBe("");
    expect(
      dataAlertIdentity({ message: "A" }) !==
        dataAlertIdentity({ message: "B" }),
    ).toBe(true);
    expect(
      dataAlertIdentity({ type: "warning", message: "A" }) !==
        dataAlertIdentity({ type: "error", message: "A" }),
    ).toBe(true);
    expect(
      dataAlertIdentity({ message: "A", description: "d1" }) !==
        dataAlertIdentity({ message: "A", description: "d2" }),
    ).toBe(true);
    expect(
      dataAlertIdentity({ message: "A", key: "k1" }) !==
        dataAlertIdentity({ message: "A", key: "k2" }),
    ).toBe(true);
  });
});

describe("createDataAlertState", () => {
  it("关闭后隐藏，并在更换文案或先置空再传入时重新显示", () => {
    const state = createDataAlertState();
    const tip = { message: "请先完成实名认证" };
    expect(state.visible(tip)?.message).toBe("请先完成实名认证");
    state.close();
    expect(state.visible(tip)).toBe(null);
    expect(state.visible({ message: "资料已更新，请刷新" })?.message).toBe(
      "资料已更新，请刷新",
    );
    state.close();
    expect(state.visible({ message: "资料已更新，请刷新" })).toBe(null);
    expect(state.visible(false)).toBe(null);
    expect(state.visible(tip)?.message).toBe("请先完成实名认证");
  });
});
