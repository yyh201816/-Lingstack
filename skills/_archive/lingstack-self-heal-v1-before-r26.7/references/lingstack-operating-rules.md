# LingStack Operating Rules

## Highest context

Always read these first for LingStack work:

- `G:\codex-vibecoding\LingStack-协同共享记忆.md`
- `G:\codex-vibecoding\LingStack-项目进度记忆.md`

## Product identity

LingStack is a **desktop local AI Agent / desktop AI workbench**, not a SaaS admin panel and not a generic web IDE clone.

## Decision rules

### Choose the next round by leverage

Pick the next task that most increases one of:

1. installability
2. truthful usability
3. workspace continuity
4. AI context awareness
5. internal testing stability

### Prefer these moves

- close an unfinished user chain
- remove or hide fake surfaces
- reuse one store/service/action instead of creating another
- validate through real build or smoke path
- produce a structured report after each round

### Avoid these moves

- parallel rewrites without a blocker
- placeholder-rich UI kept for appearance
- deep refactor during beta stabilization
- adding advanced features before core loop is stable

## Recommended validation ladder

### Packaging / identity

- `npm run build`
- `npm run tauri build`
- install / uninstall / reinstall
- icon / title / identifier consistency

### Workspace loop

- welcome -> open project
- drag folder -> workspace
- file tree -> open file
- multi-tab switch
- edit -> Ctrl+S save
- recent project reopen

### AI loop

- provider config loads
- command bar sends
- chat responds
- project/file context reaches the request
- empty-state and error-state behavior are clear

## Reporting format

Use concise sections:

1. current phase
2. what was scanned
3. what is truly usable
4. what is fake / placeholder / risky
5. chosen next round
6. scope boundaries
7. validation results
8. memory writeback summary