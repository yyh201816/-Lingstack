# Trae Prompt Contract

Reference for generating Trae-ready prompts for LingStack rounds.

## Prompt structure

When generating a prompt for Trae, always include:

1. Recommended model:
   - DeepSeek-V4-Flash for small scans/lists only
   - DeepSeek-V4-Pro for engineering implementation and verification
   - MIMO-v2.5-Pro for multi-system architecture, product-chain, skill, or self-bootstrap work
   - stronger design model for high-end UI/website visual direction
2. Why this model is recommended.
3. Required context files to read.
4. Required use of `lingstack-self-heal`.
5. Exact scope boundaries.
6. Exact files/directories likely involved.
7. Validation commands.
8. Real workflow checks.
9. Report output path.
10. Memory writeback requirement.
11. Definition of done.

Do not give vague prompts such as "optimize this" or "make it better".

## Good trigger examples

Use this skill for requests like:

- "看最新报告，下一步做什么"
- "给 Trae 下一轮提示词"
- "把 Rxx 报告转成下一步需求"
- "检查 LingStack 当前真实状态"
- "让灵栈自己修自己"
- "把 workspace 上下文注入 Chat"
- "打通 Skill Runner / Knowledge Sync"
- "清理假能力和死代码"
- "验证安装包/更新/模型/API"
- "更新 LingStack 项目记忆"
- "迭代 LingStack 项目专属 skill"
