/**
 * skill-loader.service.ts — Skill 文件发现与解析
 *
 * 职责：
 *   1. 扫描 skills/ 目录，识别所有合法 skill
 *   2. 解析 SKILL.md，提取 frontmatter (name/description)
 *   3. 提取 references 路径
 *   4. 浏览器环境：通过 fetch 读取静态文件
 *
 * Skill 目录结构约定：
 *   skills/
 *     └─ <skill-name>/
 *          ├─ SKILL.md        ← 技能定义（YAML frontmatter + Markdown body）
 *          └─ references/     ← 可选的引用文件目录
 */

export interface SkillMeta {
  /** skill 目录名 */
  id: string
  /** skill 名称 (from frontmatter or fallback) */
  name: string
  /** skill 描述 (from frontmatter) */
  description: string
  /** SKILL.md 文件路径 */
  sourcePath: string
  /** SKILL.md 正文（去 frontmatter） */
  instructions: string
  /** references 目录中所有文件的相对路径 */
  references: string[]
  /** 是否加载成功 */
  loaded: boolean
  /** 加载失败原因 */
  loadError?: string
  /** UI fields */
  enabled?: boolean
  category?: string
  source?: string
  path?: string
}

/**
 * 解析 YAML frontmatter
 * 格式：---\nkey: value\nkey2: value2\n---
 */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: raw }
  const lines = m[1]!.split('\n')
  const meta: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    meta[key] = val
  }
  return { meta, body: m[2]!.trim() }
}

/** 已知 skill 清单 — 设计为可声明式扩展 */
const SKILL_REGISTRY: { id: string; dir: string; category?: string }[] = [
  { id: 'lingstack-self-heal', dir: 'lingstack-self-heal', category: 'project' },
  { id: 'ui-ux-pro-max-lingstack', dir: 'ui-ux-pro-max-lingstack', category: 'ui' },
  { id: 'react-bits-ui', dir: 'react-bits-ui', category: 'ui' },
  { id: 'karpathy-ui-engineering', dir: 'karpathy-ui-engineering', category: 'engineering' },
  { id: 'impeccable-workflow', dir: 'impeccable-workflow', category: 'design' },
]

/**
 * 加载单个 skill 的 SKILL.md
 * 浏览器环境通过 fetch 读取 Vite public 目录下的 skills/
 */
async function loadSkillMarkdown(skillDir: string): Promise<{ raw: string; path: string }> {
  // 从 public/skills/ 读取（Vite 构建时复制到 dist/skills/）
  const url = `/skills/${skillDir}/SKILL.md`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`加载 SKILL.md 失败：${resp.status} — ${url}`)
  const raw = await resp.text()
  return { raw, path: `skills/${skillDir}/SKILL.md` }
}

/**
 * 列出 skill 的 references 目录文件
 */
async function listReferences(skillDir: string): Promise<string[]> {
  // 浏览器无法直接列目录，使用已知的引用文件路径探测
  const knownRefs = [
    `skills/${skillDir}/references/lingstack-operating-rules.md`,
  ]
  const found: string[] = []
  for (const ref of knownRefs) {
    try {
      const r = await fetch(`/${ref}`, { method: 'HEAD' })
      if (r.ok) found.push(ref)
    } catch {
      // 忽略不可达的文件
    }
  }
  return found
}

// ========== 公开 API ==========

/** 获取已注册的所有 skill ID */
export function getSkillIds(): string[] {
  return SKILL_REGISTRY.map(s => s.id)
}

/** 获取 skill 注册信息 */
export function getSkillRegistryEntry(
  id: string,
): { id: string; dir: string } | undefined {
  return SKILL_REGISTRY.find(s => s.id === id)
}

/** 加载并解析一个 skill */
export async function loadSkill(id: string): Promise<SkillMeta> {
  const entry = getSkillRegistryEntry(id)
  if (!entry) return fail(id, `未知 skill: ${id}`)

  try {
    const { raw, path } = await loadSkillMarkdown(entry.dir)
    const { meta, body } = parseFrontmatter(raw)
    const references = await listReferences(entry.dir)

    return {
      id,
      name: meta['name'] || meta['Name'] || id,
      description: meta['description'] || meta['Description'] || '',
      sourcePath: path,
      instructions: body,
      references,
      loaded: true,
    }
  } catch (e: any) {
    return fail(id, e.message ?? '未知加载错误')
  }
}

/** 加载所有注册的 skill */
export async function loadAllSkills(): Promise<SkillMeta[]> {
  const results = await Promise.allSettled(
    SKILL_REGISTRY.map(e => loadSkill(e.id)),
  )
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return fail(SKILL_REGISTRY[i]!.id, '加载失败')
  })
}

function fail(id: string, error: string): SkillMeta {
  return {
    id, name: id, description: '', sourcePath: '', instructions: '',
    references: [], loaded: false, loadError: error,
  }
}
