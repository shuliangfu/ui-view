# 组件文档页标准结构

后续组件文档页可参考 **Button**
文档页（`src/routes/desktop/basic/button.tsx`）的写法，按以下顺序组织内容。

## 1. 概述

- **Title level={1}**：组件中英文名（如「Button 按钮」）。
- **Paragraph**：一句话说明组件用途、适用场景，必要时补充主题/依赖说明。

## 2. 引入

- **Title level={2}**：引入。
- **CodeBlock**：包含 `import`
  与最简用法示例（一行或少量代码），`language="tsx"`、`showLineNumbers`、**`title="代码示例"`**、**`wrapLongLines`**（长行自动换行，避免被截断）。代码块外层可用
  `class="w-full"` 以全宽展示。

## 3. 示例

- **Title level={2}**：示例。
- 按 **prop 或场景** 分小节，每小节：
  - **Title level={3}**：小节名（如「variant 变体」「disabled」）。
  - 需要时加 **Paragraph** 说明。
  - **实时演示**：先展示组件效果，与代码一一对应。
  - **CodeBlock**：该示例的完整代码放在演示下方，`language="tsx"`、`showLineNumbers`、`copyable`、**`title="代码示例"`**、**`wrapLongLines`**；代码块外层用
    `class="w-full"` 以全宽展示，方便用户直接复制使用。

## 4. API

- **Title level={2}**：API。
- **Paragraph**：简短说明（如「组件接收以下属性（均为可选）」）。
- **表格**：表头为「属性」「类型」「默认值」「说明」；每行对应一个
  prop，类型与默认值与组件定义一致，说明可摘自 JSDoc 或精简表述。

## 约定

- 使用 `section` 包住大块，用 `space-y-*` 控制区块间距。
- API 表格用 `table` + Tailwind 边框/背景，保证在深色模式下可读。
- 示例中涉及交互的，使用 `createSignal` 等保持状态，与现有示例一致。
