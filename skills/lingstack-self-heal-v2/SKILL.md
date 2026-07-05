---
name: lingstack-self-heal
description: "Drive phase-aware self-repair, chain verification, code health cleanup, memory alignment, and self-bootstrap task closure for the LingStack desktop local AI Agent / desktop AI workbench. Use when working on G:\\LingStack-nexT, LingStack release reports, project memory files, Skill Runner, Knowledge Sync, Workspace Context, Chat/model provider chains, packaging/updater flows, installer/uninstaller identity, dead-code cleanup, or any LingStack round that must scan current truth, distinguish real capability from unverified implementation or shell UI, choose the highest-leverage next repair, validate exact user paths, and write structured progress back to the two LingStack memory files."
---

# LingStack Self Heal v2

## 0. Purpose

Use this skill to make LingStack progressively repair, verify, and bootstrap itself as a **desktop local AI Agent / desktop AI workbench**.

Treat LingStack as a product entering the **beta usable workbench / self-bootstrap transition** stage, not as a generic web app, SaaS dashboard, marketing site, or throwaway prototype.

The default goal is not to add more surface area. The default goal is to make the current product more truthful, more usable, more verifiable, and more capable of helping build itself.

---

## 1. Core Doctrine

Always preserve these truths:

1. LingStack is a **desktop local AI Agent / desktop AI workbench**.
2. The mainline is `G:\LingStack-nexT` using **Tauri + Vue 3 + TypeScript**.
3. Prefer **real usable chains** over visible placeholders. If a user-visible surface is not functional, connect it, hide it, or delete it.
4. Prefer **verified product paths** over code that merely exists.
5. Prefer **connecting existing modules** over creating parallel systems.
6. Prefer **small, validated repair rounds** over broad speculative rewrites.
7. Preserve the product temperament: Codex-like restraint, Uiverse-like local polish, tool-first, brand-light.
8. If memory files, reports, and code disagree, rebuild truth from current code + latest report + validation output, not from old memory.

---

## 2. Required Project Memory Sync

Before proposing, prompting, implementing, or judging any LingStack task, read these files first if they exist:

- `G:\codex-vibecoding\LingStack-协同共享记忆.md`
- `G:\codex-vibecoding\LingStack-项目进度记忆.md`

Also read the latest relevant report in:

- `G:\LingStack-nexT\release\`

When operating on this skill itself, also read:

- `C:\Users\Administrator\.codex\skills\lingstack-self-heal\SKILL.md`
- `C:\Users\Administrator\.codex\skills\lingstack-self-heal\references\lingstack-operating-rules.md`

After every meaningful LingStack round, append concise factual updates to both memory files.

Do not write secrets, plaintext API keys, server passwords, private signing keys, database credentials, or panel passwords into memory files.

---

## 3. Truth Hierarchy

When sources disagree, trust them in this order:

1. Current source code and configuration.
2. Latest build/test/validation output.
3. Latest release report.
4. Two memory files.
5. Older reports.
6. Conversation assumptions.

Never trust old memory blindly.

Always classify each capability as one of:

- **Truly usable**: implemented and verified through the real user path.
- **Implemented but unverified**: code exists, but no real workflow proof.
- **Mock-only**: works only through mock, fallback, or dev simulation.
- **Shell / placeholder**: visible UI or route exists but does not perform real work.
- **Duplicate / transitional**: overlaps with a newer canonical layer.
- **Dead / obsolete**: no longer referenced or should be removed.
- **Risky**: works but has identity, persistence, security, deployment, or version consistency risk.

---

## 4. Phase Awareness

Before choosing work, identify the current LingStack phase.

### 4.1 Alpha shell phase

Signs:

- UI shell exists but many visible panels are fake.
- Workspace or Chat chain is mostly placeholder.
- Packaging is not stable.

Preferred work:

1. product shell truthfulness
2. project entry
3. file tree/editor/save
4. basic Chat chain
5. installer identity

### 4.2 Beta usable workbench phase

Signs:

- Installer/updater/workspace/settings/chat/skills mostly exist.
- Some chains still rely on mock or unverified external calls.
- There are duplicate shells or stale components.

Preferred work:

1. verify real chains
2. remove fake/dead surfaces
3. align memory/version/config
4. stabilize model/provider consumption
5. tighten workspace-aware AI

### 4.3 Self-bootstrap transition phase

Signs:

- Skill Runner exists.
- Knowledge Sync exists or is reserved.
- Workspace Context is injected.
- Self-Heal can produce task items.
- LingStack begins helping iterate LingStack.

Preferred work:

1. make self-heal outputs taskable
2. verify skill payload quality with real models
3. close task → validation → report → memory loop
4. clean dead code and shell surfaces
5. enforce version/config/memory consistency

### 4.4 Release candidate phase

Signs:

- Real API chains verified.
- Updater smoke test verified.
- Installer/uninstaller stable.
- User data survival verified.
- No misleading primary UI surfaces.

Preferred work:

1. install/update/reinstall regression
2. data persistence and rollback safety
3. crash/error state handling
4. final smoke checklist
5. release report accuracy

---

**Phase detection rule**: Before each round, determine the current phase by scanning memory files, latest reports, and actual code state — not from any hardcoded baseline in this skill. The four phases above are heuristics; always trust current evidence over skill text.

---

## 5. Priority Ladder v2

Unless the user explicitly overrides, choose the highest-leverage unresolved item in this order:

1. **Truth rebuild / memory alignment**
   - memory vs report vs code mismatch
   - version mismatch
   - over-optimistic "completed" descriptions
2. **Install / launch / identity / update stability**
   - product name
   - identifier
   - icon
   - installer/uninstaller
   - online updater
   - version consistency
3. **AI main chain real usability**
   - active model selection
   - provider config
   - real API request
   - error handling
   - SSE/non-SSE response
4. **Workspace-aware AI**
   - project path
   - active file path
   - active file content
   - open tabs
   - context injection into real request
5. **Skill Runner / Knowledge Sync / Self-Heal loop**
   - skill execution payload
   - remote knowledge augmentation
   - self-heal task extraction
   - validation record
   - report/memory writeback
6. **Workspace product loop**
   - open folder
   - file tree
   - editor
   - multi-tab
   - save
   - recent project recovery
7. **Code health**
   - dead files
   - duplicate stores
   - duplicate services
   - shell-only panels
   - obsolete transitional layers
8. **Persistence**
   - session
   - chat history
   - model config
   - theme
   - task state
9. **Native desktop capability**
   - window memory
   - tray
   - file associations
   - local command execution
10. **Polish**
   - visual cleanup
   - microinteraction
   - copywriting
   - spacing
   - animations

Important rule:  
If a feature is implemented but unverified, prefer a **verification round** before adding adjacent features.

---

## 6. Standard Workflow

### Step 1: Rebuild current truth

Read the minimum required files:

- two memory files
- latest relevant report in `G:\LingStack-nexT\release\`
- current source files in `src/`
- current Tauri files in `src-tauri/`
- `package.json`
- `Cargo.toml`
- `tauri.conf.json`

Then classify:

- truly usable
- implemented but unverified
- mock-only
- shell/placeholder
- duplicate/transitional
- dead/obsolete
- risky

Do not proceed from memory alone.

---

### Step 2: Determine phase and leverage

State:

- current phase
- top unresolved risk
- highest-leverage next repair target

If the user has already chosen a specific round, keep the chosen direction but still warn about any higher-priority blocker.

---

### Step 3: Decide connect / verify / hide / delete

For each incomplete or suspicious surface:

- **connect** if the missing chain is valuable and small enough.
- **verify** if implementation exists but real proof is missing.
- **hide** if the surface is visible but not ready.
- **delete** if it is legacy clutter, duplicate, or misleading.
- **defer** only if it is not user-visible or not on the current critical path.

Never leave a fake primary surface without explicitly classifying it.

---

### Step 4: Patch with minimal surface area

When changing code:

- reuse existing stores/services/composables first.
- avoid creating parallel provider, chat, skill, workspace, or context systems.
- keep one canonical source of truth per domain.
- keep naming consistent with current LingStack conventions.
- keep UI entry points consistent with real behavior.
- avoid broad rewrites unless a blocker demands it.

Prefer:

- unify action sources
- route UI entries into canonical services
- pass missing context into existing chains
- remove dead placeholder rendering
- tighten build/package/update config
- add validation and status feedback

Avoid:

- another shell
- another store for the same state
- another provider abstraction
- another hidden mock path
- a feature that only works in console
- visual work that masks product gaps

---

### Step 5: Validate the exact chain

Validate the affected real path, not just compilation.

Common commands:

```powershell
npm run build
npm run tauri build
npx vue-tsc --noEmit
```

Use the narrowest meaningful validation:

- updater change → old version detects new version and upgrades
- model provider change → real API key request succeeds or fails cleanly
- workspace context change → request payload contains active file context
- skill change → skill payload reaches Chat with workspace/memory/knowledge
- self-heal change → task items persist and validation records are saved
- cleanup change → build passes and references are gone

---

### Step 6: Report and write memory

Every meaningful round must produce:

1. current phase
2. scanned files/reports
3. what is truly usable
4. what is unverified/mock/shell/dead
5. chosen target
6. concrete changes
7. validation result
8. remaining risks
9. next best step
10. memory writeback summary

Append a short factual update to both memory files.

---

## 7. Chain Verification Standards

### 7.1 Install / update chain

Truly usable only if verified:

- installer launches
- product name stable
- icon stable
- identifier stable
- uninstall works
- reinstall works
- user data behavior is known
- updater endpoint reachable
- old version can detect new version
- download/install/restart completes

Code/config alone is not enough.

---

### 7.2 Workspace chain

Truly usable only if verified:

- open folder
- drag folder if supported
- file tree loads
- file opens
- tab opens
- tab switch works
- edit works
- Ctrl+S saves
- close/reopen preserves intended state

---

### 7.3 Model/provider chain

Truly usable only if verified:

- model config persists
- active model can be selected
- Chat consumes active config
- empty key is blocked
- invalid key errors clearly
- correct endpoint/model/key are used
- at least one real provider response is verified

Mock response means **mock-only**, not complete.

---

### 7.4 Chat chain

Truly usable only if verified:

- user message sends
- request reaches the intended provider
- response renders
- loading state clears
- error state is visible
- command bar and Chat panel agree on sending state
- no silent failure

---

### 7.5 Workspace Context chain

Truly usable only if verified:

- projectPath is included
- activeFilePath is included
- activeFileContent is included
- active tab changes update context
- no-project and no-file states degrade cleanly
- context enters the actual model request, not only UI or console

---

### 7.6 Skill Runner chain

Truly usable only if verified:

- skill is discovered
- SKILL.md is read
- workspace context is collected
- memory/report paths are included
- knowledge augmentation is attempted or cleanly skipped
- payload is sent to Chat
- Chat consumes structured payload, not just raw text

---

### 7.7 Knowledge Sync chain

Truly usable only if verified:

- remote index is fetched from `https://ai.tadanpay.cn/knowledge/index.json`
- item list is parsed
- relevant item can be downloaded
- failure is non-blocking
- local cache behavior is known

If only index template exists locally, classify as implemented but unverified.

---

### 7.8 Self-Heal task loop

Truly usable only if verified:

- lingstack-self-heal output is parsed
- task items are created
- task state changes
- task state persists
- validation records can be saved
- a round summary can be produced

If it only displays model text, it is not a self-heal loop.

---

## 8. Code Health Rules

### 8.1 Dead code scan

Actively look for:

- zero-reference components
- old stores replaced by feature stores
- old provider types replaced by model config schema
- old layout shells
- obsolete router/page systems
- duplicate context panels
- unused composer/command/timeline shells

Known R26.5 suspects include:

- `app-provider.ts`
- `provider/types.ts`
- `RailNavItem.vue`
- `composer/`
- command-palette shell
- context-panel shell
- timeline shell
- servers/models view shell

Do not delete blindly. First verify references.

---

### 8.2 Duplicate layer detection

Flag duplicate state or service layers, especially:

- `settings.store` vs `model-configs.store`
- old provider config vs new model config schema
- context panel vs right context panel
- old Chat service vs new provider-consuming Chat service
- old skill prompt builder vs SkillExecutionPayload chain

Resolve by choosing one canonical layer.

---

### 8.3 Shell lifecycle

Every shell must have a lifecycle decision:

- keep and connect now
- hide until ready
- delete as misleading
- mark internal only

Visible shell-only features should not remain in primary UI.

---

### 8.4 Version consistency

Always check these together:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- visible app version
- updater `latest.json`
- release report version

Version mismatch is a product risk, not a cosmetic issue.

---

## 9. Memory Alignment Rules

### 9.1 Compare memory with code

When reading memory, detect:

- features marked complete but only mock exists
- features marked complete but no real validation exists
- missing rounds
- stale version numbers
- stale paths
- stale server endpoints
- optimistic descriptions

### 9.2 Write memory conservatively

Use factual wording:

Good:

- "R23 implemented responsive model config consumption and preflight validation; real provider smoke test still needed."

Bad:

- "Chat fully completed."

Good:

- "Knowledge Sync index endpoint exists; remote item download still unverified."

Bad:

- "Knowledge Sync completed."

### 9.3 Never store secrets

Do not write:

- API keys
- server passwords
- Baota credentials
- database credentials
- private signing keys
- private key passwords

Store only non-sensitive paths, endpoints, and task facts.

---

## 10. Workspace-Aware AI Rules

For any Chat or Skill work, progressively ensure the model sees:

1. project path
2. project name
3. active file path
4. active file name
5. active file content
6. open tabs
7. selected model
8. memory/report paths
9. later: selection, diagnostics, git diff, terminal output

Current active file is higher priority than whole-workspace dumping.

Use truncation:

- active file may be included with a reasonable limit
- open tabs should usually be metadata only
- do not inject whole directories blindly

---

## 11. Model Provider Rules

The canonical configuration source should be the model/provider schema introduced around R22.

Prefer one unified model config object containing:

- providerId
- modelId
- displayName
- apiKey
- baseUrl
- apiFormat
- modelFamily
- context window
- tool/multimodal flags
- enabled / active
- createdAt / updatedAt

Do not create temporary Chat-only provider configs unless migrating them back into the canonical model config store.

For real API verification:

- empty key must be intercepted before request
- invalid key must show clear UI error
- endpoint/model/key must not cross between providers
- mock fallback must be labeled mock

---

## 12. Skill Runner / Knowledge Sync / Self-Bootstrap Rules

### 12.1 Skill execution payload

Prefer one unified payload:

- skill
- workspace
- memory
- knowledge
- model

Do not let Skill Runner, Knowledge Sync, Workspace Context, and Chat each build unrelated prompts.

### 12.2 Local first, remote augment

Order of authority:

1. current workspace context
2. local skill instruction
3. memory/report paths
4. remote knowledge augmentation
5. model metadata

Remote knowledge must enhance, not block.

### 12.3 Self-heal loop

For `lingstack-self-heal`, prefer this loop:

1. scan current truth
2. choose one repair target
3. generate structured repair plan
4. convert to tasks
5. let user accept/skip/complete/fail tasks
6. record validation
7. produce report
8. update memory

Do not claim self-repair if the result is only a Chat message.

---

## 13. Training Data Rules

The training data layer is currently Phase 0 unless current code proves otherwise.

Phase 0 means:

- local structured collection only
- no cloud upload by default
- no model training by default
- redaction required
- quality scoring allowed
- JSONL export allowed

If adding data capture:

- record task context
- redact secrets
- store user feedback
- distinguish accepted/copied/rejected/regenerated
- do not silently upload

---

## 14. Packaging / Updater Rules

Preserve these locked identity fields unless explicitly instructed:

- bundle identifier: `com.lingstack.app`
- product line: `灵栈 LingStack`
- Windows-first target
- current-user install mode unless changed deliberately
- icon source consistency

Updater rules:

- app update uses Tauri updater
- knowledge/rules/skills sync is separate from app binary update
- `https://ai.tadanpay.cn/updates/latest.json` is the update endpoint unless current config says otherwise
- `/home/www/lingstack/updates/` is for updater artifacts
- `/home/www/lingstack/knowledge/` is for remote knowledge
- `/home/www/lingstack/www/` is for website
- `/home/www/lingstack/app/` is reserved for future cloud app

Always distinguish:

- app binary update
- remote knowledge sync
- source code deployment
- website deployment

---

## 15. UI / Product Temperament Rules

LingStack UI should remain:

- clean
- calm
- functional
- Codex-like overall
- subtle Uiverse-like locally
- tool-first
- brand-light

Do not overuse logo or marketing language.

For UI work:

- avoid fake panels
- avoid admin-dashboard feeling
- avoid decorative complexity
- avoid adding panels before they work
- prefer fewer, truer surfaces

---

## 16. Anti-Patterns

Avoid:

- calling a chain complete because code exists
- adding another shell while existing shells are unverified
- keeping duplicate stores alive without migration reason
- exposing panels that are not operable
- treating UI completion as product completion
- making the welcome page more branded instead of more useful
- adding chat abilities without project/file context
- adding skill features without sending structured payload to Chat
- creating mock success that looks like real success
- writing "completed" into memory without validation proof
- expanding architecture while version/config/memory are inconsistent
- starting large refactors during beta stabilization unless a blocker demands it

---

## 17. Output Contract

When using this skill, respond or report in this structure unless the user asks for a specific format:

### 1. Current phase

One sentence.

### 2. Current truth

List what is:

- truly usable
- implemented but unverified
- mock-only
- shell/placeholder
- dead/duplicate/risky

### 3. Chosen target

Name the single highest-leverage target and why it wins now.

### 4. Scope boundary

List what this round will not touch.

### 5. Concrete changes or prompt

List exact files/layers/actions, or provide a Trae-ready prompt.

### 6. Validation

List exact commands and exact workflow checks.

### 7. Result criteria

State what must be true for the round to count as complete.

### 8. Memory writeback

State what should be appended to both memory files.

---

## 18. References

- **Trae Prompt Contract**: For how to structure Trae-ready LingStack prompts (model selection, scope boundaries, validation commands, report output, memory writeback), see `references/trae-prompt-contract.md`.
- **LingStack Operating Rules**: For concise quick-reference rules (verification ladder, decision rules, reporting format), see `references/lingstack-operating-rules.md`.

---

## 19. Completion Standard

A LingStack round is good only if it:

- closes or verifies a real user-facing chain
- reduces fake surface or confusion
- improves workspace-aware AI capability
- preserves desktop AI workbench identity
- avoids duplicate architecture
- validates build or exact workflow
- writes conservative memory updates
- leaves one clear next step

For the self-bootstrap stage, a round is especially good if it helps LingStack move from:

- "can chat"
- to "can see the workspace"
- to "can run a skill"
- to "can produce tasks"
- to "can validate tasks"
- to "can update its own project memory"
