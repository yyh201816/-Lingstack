# LingStack Operating Rules

Quick-reference rules for LingStack rounds. This file complements, does not replace, `SKILL.md`. Read `SKILL.md` first for the full workflow and phase framework.

## 1. Highest Context

Always read before any LingStack task:

- `G:\codex-vibecoding\LingStack-协同共享记忆.md`
- `G:\codex-vibecoding\LingStack-项目进度记忆.md`
- latest relevant report in `G:\LingStack-nexT\release\`
- current `src/`, `src-tauri/`, `package.json`, `Cargo.toml`, `tauri.conf.json`
- this skill: `C:\Users\Administrator\.codex\skills\lingstack-self-heal\SKILL.md`
- operating rules: `C:\Users\Administrator\.codex\skills\lingstack-self-heal\references\lingstack-operating-rules.md`

## 2. Product Identity

LingStack is a **desktop local AI Agent / desktop AI workbench**.
Mainline: `G:\LingStack-nexT`, built on Tauri + Vue 3 + TypeScript.

Identifier: `com.lingstack.app`
Product name: `LingStack`
Display name: `灵栈 LingStack`
Windows primary target.

Updater endpoint: `https://ai.tadanpay.cn/updates/latest.json`
Knowledge endpoint: `https://ai.tadanpay.cn/knowledge/index.json`
Server root: `/home/www/lingstack/`

## 3. Decision Rules

### 3.1 Phase detection

Before each round, determine the current phase by scanning memory files, latest reports, and actual code state — not from any hardcoded baseline.

Four phases: alpha shell → beta usable → self-bootstrap transition → release candidate.

### 3.2 Priority

Unless user overrides, choose the highest-leverage unresolved item:

1. truth rebuild / memory alignment
2. install / launch / identity / update
3. AI main chain real usability
4. workspace-aware AI
5. skill runner / knowledge sync / self-heal loop
6. workspace product loop
7. code health
8. persistence
9. native desktop capability
10. polish

### 3.3 Connect / verify / hide / delete

For incomplete or suspicious surfaces:
- **connect** if valuable and small to implement
- **verify** if implementation exists but proof missing
- **hide** if visible but not ready
- **delete** if legacy, duplicate, or misleading
- **defer** only if not user-visible or not on critical path

## 4. Verification Ladder

Before calling a chain "usable", verify:

| Level | Check |
|-------|-------|
| L1 | Code compiles (`vue-tsc --noEmit` + `vite build` pass) |
| L2 | UI renders without error |
| L3 | Core interaction works (send message, open file, run skill) |
| L4 | Real external dependency works (API call, Tauri FS, updater endpoint) |
| L5 | Error/degradation states are handled (no silent failure) |

"Implemented but unverified" means below L3. "Truly usable" means L4+.

## 5. Self-Bootstrap Ladder

LingStack self-bootstrap progression (7 levels):

1. **chat shell**: basic Chat UI renders
2. **workspace-aware chat**: model receives project/file/tab context
3. **skill-enhanced chat**: structured SkillExecutionPayload reaches Chat
4. **task-producing self-heal**: skill output is parsed into task items
5. **validation-aware self-heal**: task items can be validated (build pass, API test, path check)
6. **memory-updating self-heal**: validation results update project memory files
7. **model-readiness-tracking self-heal**: training data layer tracks quality for future model distillation

## 6. Reporting Format

Every meaningful round must include:

1. current phase
2. scanned files/reports
3. what is truly usable
4. what is unverified/mock/shell/dead
5. chosen target
6. concrete changes
7. validation result
8. remaining risks
9. next best step

## 7. Memory Writeback Rules

- use factual, conservative wording
- distinguish "completed" from "implemented but unverified"
- never write secrets (API keys, passwords, credentials)
- always include: round number, date, what changed, validation result, next step

## 8. Anti-Patterns

- calling a chain "complete" without verification
- adding shells while existing shells are unverified
- duplicate stores/services
- exposing inoperable panels
- UI completion treated as product completion
- branded welcome over useful entry
- Chat without workspace context
- Skill without structured payload to Chat
- mock success presented as real success
- "completed" written into memory without validation proof
- architecture expansion while version/config/memory are inconsistent
