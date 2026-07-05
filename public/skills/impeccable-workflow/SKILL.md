---
name: impeccable-workflow
description: 将 impeccable 作为 LingStack 的产品级开发工作流约束层使用。适用于需要先扫描、再决策、再实施、再验证的 UI 改版、产品收口、交付质量控制、内测前检查、重构边界控制等场景。使用本技能时，应读取本地 impeccable 仓库中与 Trae 相关的规则文件，并把这些规则转化为 LingStack 的实际开发节奏，而不是照搬其品牌或模板。
---

# Impeccable Workflow

## 核心用途

把 impeccable 用作 **LingStack 的开发流程控制器**，而不是视觉素材库。

它最适合帮助 Trae：

1. 在改 UI 前先建立约束
2. 在迭代中避免失控重构
3. 在每轮结束后要求验证与报告
4. 在“产品真实可用”与“表面看起来丰富”之间做取舍

## 本地参考源

优先读取这些文件：

- `G:\codex-vibecoding\trae-skills-local\impeccable\impeccable-main\README.md`
- `G:\codex-vibecoding\trae-skills-local\impeccable\impeccable-main\AGENTS.md`
- `G:\codex-vibecoding\trae-skills-local\impeccable\impeccable-main\.trae\skills\impeccable\SKILL.md`
- `G:\codex-vibecoding\trae-skills-local\impeccable\impeccable-main\.trae-cn\skills\impeccable\SKILL.md`

如需补充，再查看：

- `references/source-map.md`

## 对 LingStack 的使用原则

### 1. 先扫描再改
任何 LingStack 改版前，先读取：

- `G:\codex-vibecoding\LingStack-协同共享记忆.md`
- `G:\codex-vibecoding\LingStack-项目进度记忆.md`
- 最新 release 报告

### 2. 只选一轮最高价值目标
不要同时做：

- 大改 UI
- 改 Chat 主链
- 改安装链路
- 改技能系统

一次只打一轮最有价值的仗。

### 3. 真实链路优先于可见壳层
对 LingStack 来说：

- 能点但不能用 = 要么接通，要么隐藏
- 只会展示但没有工作流价值 = 优先级降低

### 4. 每轮必须验证
至少验证本轮影响的真实链路：

- `npm run build`
- 必要时 `npm run tauri build`
- 受影响的 smoke path

## 对 Trae 的输出要求

当使用本技能时，Trae 应该输出：

1. 当前阶段一句话判断
2. 本轮最高优先级任务
3. 本轮不做什么
4. 改动范围
5. 验证方式
6. 结果与下一步

## 禁止偏航

不要把 impeccable 用成：

- 品牌设计模板
- 官网文案模板
- 营销展示工作流

对 LingStack，它的价值在于：

**让 Trae 的开发节奏更像一个稳定的产品工程团队。**
