---
name: react-bits-ui
description: 将 react-bits 作为 LingStack UI 组件与微交互参考库使用。适用于为桌面 AI 工作台补充高质量 hover、active、focus、入场节奏、轻动效、组件结构参考的场景。使用本技能时，应提取适合 LingStack 的克制表达，不要照搬炫技动画或展示页效果。
---

# React Bits UI

## 核心用途

把 react-bits 当成 **组件实现与微交互灵感源**，而不是直接照抄的模板库。

它最适合帮助 Trae：

1. 找到高质量交互表达方式
2. 提炼适合 LingStack 的轻量动效
3. 参考组件结构与视觉层次
4. 改善按钮、卡片、输入器、标签、状态块的精致度

## 本地参考源

- `G:\codex-vibecoding\trae-skills-local\react-bits\react-bits-main\README.md`
- `G:\codex-vibecoding\trae-skills-local\react-bits\react-bits-main\src\`
- `G:\codex-vibecoding\trae-skills-local\react-bits\react-bits-main\public\`
- `references/source-map.md`

## 对 LingStack 的使用原则

### 1. 只借表达，不照搬风格
LingStack 要的是：

- Codex 式简洁主工作台
- Uiverse 式精致局部反馈

所以 react-bits 只能拿来提炼：

- hover
- active
- focus
- shadow
- entrance rhythm
- subtle motion

不要把它变成：

- 炫技 landing page
- 组件秀场
- 动效堆叠 demo

### 2. 优先参考这些区域
对 LingStack 最值的区域通常是：

- TopBar 小控件
- ProjectPanel 卡片
- AgentWelcome 行动卡
- CommandBar
- TabBar
- 状态 badge
- 空状态 / 反馈状态

### 3. 控制动效强度
推荐：

- `140ms ~ 220ms`
- 轻位移
- 轻阴影增强
- 轻描边变化

避免：

- 大幅缩放
- 炫光
- 多段弹跳
- 页面级戏剧化过渡

## 对 Trae 的输出要求

当使用本技能时，Trae 应输出：

1. 借用了哪些交互思想
2. 哪些效果被刻意压制
3. 为什么这些表达适合 LingStack
4. 如何落到现有 token / class / DOM 体系里

## 成功标准

如果一轮改动后：

- LingStack 更精致了
- 但没有变花
- 更像桌面工具
- 而不是更像展示页

那就说明使用方向是对的。
