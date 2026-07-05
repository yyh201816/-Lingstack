---
name: ui-ux-pro-max-lingstack
description: 将 ui-ux-pro-max-skill 作为 LingStack 的主 UI/UX 改版技能使用。适用于桌面 AI 工作台的界面重构、设计系统收敛、组件视觉统一、布局优化、交互细节增强、工作流导向的产品化改版等场景。使用本技能时，应围绕 LingStack 的桌面工具身份工作，而不是生成营销官网或炫技型展示页。
---

# UI UX Pro Max LingStack

## 核心用途

把 ui-ux-pro-max-skill 作为 LingStack 后续 UI/UX 改版的 **主设计技能层**。

它最适合帮助 Trae：

1. 规划工作台级 UI 改版
2. 收敛设计 token 与组件规则
3. 优化信息层级与布局结构
4. 给出高质量组件升级路径
5. 在不偏离产品主线的前提下增强体验

## 本地参考源

优先读取：

- `G:\codex-vibecoding\trae-skills-local\ui-ux-pro-max-skill\ui-ux-pro-max-skill-main\README.md`
- `G:\codex-vibecoding\trae-skills-local\ui-ux-pro-max-skill\ui-ux-pro-max-skill-main\README.zh.md`
- `G:\codex-vibecoding\trae-skills-local\ui-ux-pro-max-skill\ui-ux-pro-max-skill-main\skill.json`
- `G:\codex-vibecoding\trae-skills-local\ui-ux-pro-max-skill\ui-ux-pro-max-skill-main\cli\assets\skills\ui-ux-pro-max\SKILL.md`
- `G:\codex-vibecoding\trae-skills-local\ui-ux-pro-max-skill\ui-ux-pro-max-skill-main\cli\assets\skills\design-system\SKILL.md`
- `G:\codex-vibecoding\trae-skills-local\ui-ux-pro-max-skill\ui-ux-pro-max-skill-main\cli\assets\skills\ui-styling\SKILL.md`

补充读取：

- `references/source-map.md`

## LingStack 专属约束

### 1. 产品身份
LingStack 是：

- 桌面本地 AI Agent
- 桌面 AI 工作台
- 工具优先

不是：

- 营销官网
- 组件展示站
- SaaS 后台
- 只会聊天的页面

### 2. 风格目标
整体：

- 像 Codex
- 简洁、克制、连续工作流

局部：

- 像 Uiverse
- 精致 hover / active / focus / 轻反馈

### 3. 优先改造对象
在 LingStack 中，本技能优先服务：

- WorkbenchLayout
- TopBar
- SidebarNav
- ProjectPanel
- AgentWelcome
- CommandBar
- WorkspaceHeader
- EditorTabs
- SettingsPanel
- SkillsPanel / Skill Runner

### 4. 输出必须落到现有工程
所有建议必须回到：

- 现有 token 体系
- 现有 DOM 结构
- 现有组件命名
- 现有桌面工作台交互逻辑

不要产出脱离项目实际的“概念设计”。

## 推荐工作流

使用本技能处理 LingStack UI 改版时，按这个顺序：

1. 先读取 LingStack 长期记忆
2. 再读取最新 release 报告
3. 再扫描当前组件真实状态
4. 只选一个最高价值 UI/UX 目标
5. 输出结构化改版方案
6. 再落到代码与验证

## 对 Trae 的输出要求

使用本技能时，Trae 应该输出：

1. 当前 UI 问题是什么
2. 这轮只改哪一个最高价值目标
3. 结构怎么改
4. token / 排版 / 交互怎么改
5. 为什么这样改更符合 LingStack 的桌面工作台身份
6. build / smoke 验证结果

## 成功标准

如果一轮改版后：

- 界面更清楚
- 工作流更连续
- 工具感更强
- 品牌感更克制
- 不再新增假入口或空面板

说明本技能的使用方向是正确的。
