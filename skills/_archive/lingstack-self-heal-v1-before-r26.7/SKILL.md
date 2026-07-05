---
name: lingstack-self-heal
description: "Drive continuous self-repair, gap-closing, code completion, and regression control for the LingStack desktop AI workbench. Use when working on G:\LingStack-nexT or related LingStack reports/memory files and the goal is to scan current project state, identify the highest-value missing link, connect unfinished workflow chains, remove misleading placeholder UI, inject workspace-aware AI context, stabilize packaging/install/uninstall, validate the app after changes, and write back structured progress reports. Trigger this skill for requests such as improving LingStack itself, making the app complete its own missing product loop, filling unfinished code paths, reducing fake/placeholder surfaces, preparing beta/internal testing, or turning reports into the next concrete implementation round."
---

# LingStack Self Heal

## Overview

Use this skill to make LingStack progressively complete itself as a desktop local AI Agent / desktop AI workbench.

Treat the project as a product under controlled self-improvement, not as a generic web app. Prefer closing the most valuable missing workflow over adding shiny new features.

## Core Doctrine

Always preserve these project truths:

1. Keep LingStack on the main line: **desktop local AI Agent / desktop AI workbench**.
2. Prefer **real usable chains** over visible placeholders.
3. Prefer **connecting existing modules** over creating new parallel systems.
4. Prefer **small, validated repair rounds** over broad speculative rewrites.
5. Preserve the product temperament: **tool-first, brand-light, Codex-like overall, restrained interaction**.
6. If a surface is visible to users but not functional, either connect it or hide/remove it.
7. If AI can answer but cannot see the user's current project/file context, that is an incomplete workbench chain.

## Required Project Memory Sync

Before proposing or implementing LingStack changes, always read these files first if they exist:

- `G:\codex-vibecoding\LingStack-??????.md`
- `G:\codex-vibecoding\LingStack-??????.md`

Use them as the highest long-term context. After each meaningful round, append a concise update back to both files.

For additional rules, read `references/lingstack-operating-rules.md`.

## Workflow

### Step 1: Rebuild current truth from source

Scan the minimum set of source artifacts needed to understand the current round:

- project memory files
- latest report in `G:\LingStack-nexT\release\`
- relevant code in `src/`, `src-tauri/`, `package.json`, `Cargo.toml`, `tauri.conf.json`

Distinguish clearly between:

- truly usable
- implemented but unverified
- placeholder / shell only
- obsolete / duplicate / transitional

Never trust old assumptions if current code or reports disagree.

### Step 2: Choose one highest-value repair target

Pick the next round by product leverage, not by novelty.

Use this priority ladder unless the user overrides it:

1. install / launch / identity / uninstall / repackaging
2. project entry / workspace chain / file tree / editor / save
3. AI main chain / command bar / workspace context injection
4. misleading placeholders / dead entries / fake panels
5. state recovery / recent projects / settings persistence
6. polish / visual cleanup / minor ergonomics
7. optional expansions such as multi-session, true terminal, automation

Do not choose a lower-priority task while a higher-priority user-facing break still exists.

### Step 3: Decide connect vs hide vs delete

For every incomplete feature, decide explicitly:

- **connect** if the missing chain is small and valuable now
- **hide** if the feature is visible but not ready
- **delete** if it is legacy clutter or misleading duplication

Never leave a user-visible half-feature without justification.

### Step 4: Patch with minimal surface area

When changing code:

- patch the smallest stable layer that fixes the chain
- reuse existing stores/services/actions first
- avoid creating duplicate shells, stores, or alternate flows
- keep naming aligned with current LingStack conventions
- keep UI entrypoints consistent with real behavior

Prefer these kinds of repairs:

- unify action sources
- route multiple UI entries into one service action
- pass missing context into existing chain
- remove dead placeholder rendering
- tighten packaging/build configuration

Avoid these unless explicitly required:

- broad architectural rewrites
- new frameworks
- large visual redesigns
- speculative abstractions

### Step 5: Validate the exact user path affected

After each repair, validate the real path, not just compilation.

Typical validation commands:

- `npm run build`
- `npm run tauri build`
- `cargo build --release`

Typical workflow checks:

- install -> launch
- welcome -> open project -> workspace
- file tree -> open file -> multi-tab -> save
- command bar -> chat request -> response
- close -> reopen -> recent project recovery

If a task changes only one chain, validate that chain deeply instead of doing shallow global claims.

### Step 6: Write structured round output

After each round, produce:

1. what changed
2. what chain was closed
3. what remains intentionally not done
4. validation result
5. next best step

Then append a short memory update to both LingStack memory files.

## Repair Heuristics for LingStack

### A. Placeholder handling

If a panel says or implies "coming soon", "????", "??", or has visible shell-only UI:

- hide it from primary UI, or
- connect it immediately if the gap is small

A cleaner smaller product is better than a larger fake one.

### B. Workspace-aware AI handling

If chat exists, ensure it progressively sees:

1. `projectPath`
2. `activeFilePath`
3. `activeFileContent`
4. later: selected text / open tabs / diagnostics

A desktop AI workbench without workspace context is still only chat.

### C. Packaging discipline

For beta/internal testing rounds, preserve stability of:

- product name
- identifier
- executable naming
- installer/uninstaller identity
- icon sources

Windows must keep recognizing new builds as the same product line.

### D. Persistence discipline

Prefer persistence for:

- recent projects
- provider config
- theme/settings
- current project/session recovery when valuable

Document what is intentionally kept or intentionally disposable.

## Output Contract

When using this skill for a LingStack round, return decisions in this structure:

### 1. Current phase
One sentence only.

### 2. Chosen repair target
Name the single highest-value target and why it wins now.

### 3. Scope boundary
List what this round will not touch.

### 4. Concrete changes
List files/layers/actions to change.

### 5. Validation
List exact commands and exact workflow checks.

### 6. Result
State whether the round moved LingStack toward:

- more installable
- more usable
- more truthful
- more workspace-aware
- more stable for internal testing

## LingStack-Specific Anti-Patterns

Avoid these recurring mistakes:

- adding another shell while two shells already overlap
- keeping duplicate stores alive without migration reason
- exposing panels that are not operable
- treating UI completion as product completion
- making the welcome page more branded instead of more useful
- adding chat abilities without project/file context
- starting large refactors during beta stabilization unless a real blocker demands it

## Good Trigger Examples

Use this skill for requests like:

- "??? LingStack??????????"
- "??????????"
- "????????????"
- "? Chat ?????????"
- "????????????????"
- "???????????????"
- "??????????????????"

## Completion Standard

A LingStack round is good only if it satisfies all of these:

- closes a real user-facing gap
- reduces confusion or increases utility
- stays aligned with the desktop AI workbench main line
- is validated by build or workflow, not just code presence
- leaves a clear next step
