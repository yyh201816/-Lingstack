---
name: karpathy-ui-engineering
description: 将 andrej-karpathy-skills 作为 LingStack UI 重构与工程实现的思维约束层使用。适用于需要减少废代码、减少假抽象、提高实现清晰度、保持产品主线一致、避免低价值复杂化的场景。使用本技能时，应优先吸收其工程判断与表达方式，而不是把它当作具体视觉组件库。
---

# Karpathy UI Engineering

## 核心用途

把这个仓库当成 **工程判断与实现纪律** 的强化器。

它最适合帮助 Trae：

1. 在 UI 改版时保持实现简单
2. 避免为了“架构感”制造无意义层次
3. 避免在 beta 阶段进行低收益大重构
4. 让 LingStack 的改动更直接、更清楚、更可验证

## 本地参考源

- `G:\codex-vibecoding\trae-skills-local\andrej-karpathy-skills\andrej-karpathy-skills-main\README.md`
- `G:\codex-vibecoding\trae-skills-local\andrej-karpathy-skills\andrej-karpathy-skills-main\CURSOR.md`
- `G:\codex-vibecoding\trae-skills-local\andrej-karpathy-skills\andrej-karpathy-skills-main\CLAUDE.md`
- `G:\codex-vibecoding\trae-skills-local\andrej-karpathy-skills\andrej-karpathy-skills-main\skills\karpathy-guidelines\SKILL.md`
- `references/source-map.md`

## 对 LingStack 的使用原则

### 1. 少造新层
优先：

- 复用现有 store
- 复用现有 service
- 复用现有 action

不要轻易：

- 新建平行 store
- 新建第二套 shell
- 为了“优雅”引入新抽象

### 2. 每轮只解决一个最值的问题
LingStack 在 beta 阶段最怕的是：

- 一轮改太多
- 每层都动
- 最后没有一个链路真正闭合

### 3. 以真实链路为中心
每轮问自己：

- 用户到底能不能完成这个路径？
- 这个改动是减少困惑，还是增加复杂度？

### 4. 少解释，多验证
对 LingStack 的工程推进，优先给：

- 具体改动文件
- 具体链路说明
- 具体 build / smoke test 结果

## 对 Trae 的输出要求

使用本技能时，Trae 应该清楚写出：

1. 为什么这轮不做别的
2. 为什么当前方案是最短闭环
3. 避免了哪些无效重构
4. 验证了哪些真实路径

## 成功标准

如果一轮改动后：

- 代码更少更清晰
- 功能链路更完整
- 报告更明确
- 没有出现新的平行体系

说明本技能用对了。
