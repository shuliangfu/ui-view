/** @jsxImportSource @dreamer/view */
/**
 * Form control `autoFocus` writes the native autofocus attribute only when true.
 */
import { describe, expect, it } from "@dreamer/test";
import { renderToString } from "@dreamer/view/ssr";
import type { JSXRenderable } from "@dreamer/view";
import { Input } from "../../src/shared/form/Input.tsx";
import { Password } from "../../src/shared/form/Password.tsx";
import { Textarea } from "../../src/shared/form/Textarea.tsx";
import { Search } from "../../src/shared/form/Search.tsx";
import { InputNumber } from "../../src/shared/form/InputNumber.tsx";
import { AutoComplete } from "../../src/shared/form/AutoComplete.tsx";
import { Mentions } from "../../src/shared/form/Mentions.tsx";
import { Select } from "../../src/shared/form/Select.tsx";
import { MultiSelect } from "../../src/shared/form/MultiSelect.tsx";
import { Cascader } from "../../src/shared/form/Cascader.tsx";
import { TreeSelect } from "../../src/shared/form/TreeSelect.tsx";
import { DatePicker } from "../../src/shared/form/DatePicker.tsx";
import { DateTimePicker } from "../../src/shared/form/DateTimePicker.tsx";
import { TimePicker } from "../../src/shared/form/TimePicker.tsx";
import { ColorPicker } from "../../src/shared/form/ColorPicker.tsx";
import { MarkdownEditor } from "../../src/shared/form/MarkdownEditor.tsx";
import { RichTextEditor } from "../../src/shared/form/RichTextEditor.tsx";
import { PasscodeInput } from "../../src/mobile/form/PasscodeInput.tsx";

const SELECT_OPTIONS = [{ value: "a", label: "A" }];
const TREE_OPTIONS = [{
  value: "a",
  label: "A",
  children: [{ value: "b", label: "B" }],
}];

/**
 * SSR 渲染后断言：仅 `autoFocus` 为 true 时输出原生 autofocus。
 *
 * @param onNode - 带 autoFocus 的控件
 * @param offNode - 不带 autoFocus 的对照
 */
async function assertSsrAutoFocus(
  onNode: JSXRenderable,
  offNode: JSXRenderable,
): Promise<void> {
  const on = String(await renderToString(() => onNode)).toLowerCase();
  const off = String(await renderToString(() => offNode)).toLowerCase();
  expect(on).toContain("autofocus");
  expect(off).not.toContain("autofocus");
}

describe("form autoFocus SSR", () => {
  it("Input outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<Input autoFocus />, <Input />);
  });

  it("Password outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<Password autoFocus />, <Password />);
  });

  it("Textarea outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<Textarea autoFocus />, <Textarea />);
  });

  it("Search outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<Search autoFocus />, <Search />);
  });

  it("InputNumber outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<InputNumber autoFocus />, <InputNumber />);
  });

  it("AutoComplete outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<AutoComplete autoFocus />, <AutoComplete />);
  });

  it("Mentions outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<Mentions autoFocus />, <Mentions />);
  });

  it("Select outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(
      <Select autoFocus options={SELECT_OPTIONS} />,
      <Select options={SELECT_OPTIONS} />,
    );
  });

  it("MultiSelect outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(
      <MultiSelect autoFocus options={SELECT_OPTIONS} />,
      <MultiSelect options={SELECT_OPTIONS} />,
    );
  });

  it("Cascader outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(
      <Cascader autoFocus options={TREE_OPTIONS} />,
      <Cascader options={TREE_OPTIONS} />,
    );
  });

  it("TreeSelect outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(
      <TreeSelect autoFocus options={TREE_OPTIONS} />,
      <TreeSelect options={TREE_OPTIONS} />,
    );
  });

  it("DatePicker outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<DatePicker autoFocus />, <DatePicker />);
  });

  it("DateTimePicker outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<DateTimePicker autoFocus />, <DateTimePicker />);
  });

  it("TimePicker outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<TimePicker autoFocus />, <TimePicker />);
  });

  it("ColorPicker outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<ColorPicker autoFocus />, <ColorPicker />);
  });

  it("MarkdownEditor outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<MarkdownEditor autoFocus />, <MarkdownEditor />);
  });

  it("RichTextEditor outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<RichTextEditor autoFocus />, <RichTextEditor />);
  });

  it("PasscodeInput outputs autofocus only when autoFocus is true", async () => {
    await assertSsrAutoFocus(<PasscodeInput autoFocus />, <PasscodeInput />);
  });
});
