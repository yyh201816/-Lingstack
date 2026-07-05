/**
 * knowledge-sync.service.ts — 远程知识同步服务
 *
 * 设计目标：
 *   1. 定义远程知识源 URL
 *   2. 拉取 knowledge/index.json 获取可用知识清单
 *   3. 预留 skill / prompt / rules 的同步入口
 *
 * 本层不处理 UI，仅提供数据与状态。
 * 当前阶段：最小可用预留层，后续逐步补齐。
 */

import { ref, readonly } from 'vue'

// ========== 类型定义 ==========

/** 单条知识条目元数据 */
export interface KnowledgeItemMeta {
  /** 知识 ID（唯一标识） */
  id: string
  /** 条目类型 */
  type: 'skill' | 'prompt' | 'rule' | 'release-note' | 'manifest' | 'guidance'
  /** 条目名称 */
  name: string
  /** 简短描述 */
  description: string
  /** 条目版本号 */
  version: string
  /** 远程下载 URL（相对或绝对） */
  downloadUrl: string
  /** 内容 SHA256（用于校验） */
  sha256?: string
  /** 最后更新时间（ISO 8601） */
  updatedAt: string
}

/** 远程知识索引结构 */
export interface KnowledgeIndex {
  /** 索引版本 */
  version: string
  /** 最后更新时间 */
  updatedAt: string
  /** 知识条目清单 */
  items: KnowledgeItemMeta[]
}

/** 同步状态 */
export type SyncPhase = 'idle' | 'fetching-index' | 'comparing' | 'downloading' | 'synced' | 'error'

export interface SyncStatus {
  phase: SyncPhase
  remoteVersion?: string
  itemCount?: number
  error?: string
}

// ========== 常量 ==========

/** 默认远程知识源 base URL */
const DEFAULT_KNOWLEDGE_BASE_URL = 'https://ai.tadanpay.cn/knowledge'

/** 知识索引文件名 */
const INDEX_FILENAME = 'index.json'

/** localStorage 键：上次成功拉取的索引 */
const LS_KEY_LAST_INDEX = 'lingstack_knowledge_index'

// ========== 状态 ==========

const _index = ref<KnowledgeIndex | null>(null)
const _syncStatus = ref<SyncStatus>({ phase: 'idle' })

/** 远程知识索引（只读） */
export const knowledgeIndex = readonly(_index)
/** 同步状态（只读） */
export const syncStatus = readonly(_syncStatus)

// ========== 公开 API ==========

/** 获取当前知识源 base URL */
export function getKnowledgeBaseUrl(): string {
  return DEFAULT_KNOWLEDGE_BASE_URL
}

/** 获取索引文件完整 URL */
export function getIndexUrl(): string {
  return `${DEFAULT_KNOWLEDGE_BASE_URL}/${INDEX_FILENAME}`
}

/**
 * 拉取远程知识索引
 * 返回 KnowledgeIndex 或 null（失败时）
 */
export async function fetchKnowledgeIndex(): Promise<KnowledgeIndex | null> {
  _syncStatus.value = { phase: 'fetching-index' }

  try {
    const url = getIndexUrl()
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!resp.ok) {
      throw new Error(`拉取知识索引失败: HTTP ${resp.status} — ${url}`)
    }

    const data: KnowledgeIndex = await resp.json()

    // 基本结构校验
    if (!data.version || !Array.isArray(data.items)) {
      throw new Error('知识索引格式异常：缺少 version 或 items')
    }

    _index.value = data
    _syncStatus.value = { phase: 'synced', remoteVersion: data.version, itemCount: data.items.length }

    // 缓存到 localStorage
    try {
      localStorage.setItem(LS_KEY_LAST_INDEX, JSON.stringify(data))
    } catch { /* 静默失败 */ }

    return data
  } catch (e: any) {
    _syncStatus.value = { phase: 'error', error: e.message ?? '拉取知识索引失败' }
    return null
  }
}

/**
 * 从缓存恢复上次成功拉取的索引
 */
export function restoreCachedIndex(): KnowledgeIndex | null {
  try {
    const raw = localStorage.getItem(LS_KEY_LAST_INDEX)
    if (!raw) return null
    const data: KnowledgeIndex = JSON.parse(raw)
    if (data?.version && Array.isArray(data.items)) {
      _index.value = data
      return data
    }
  } catch { /* ignore */ }
  return null
}

/**
 * 按类型过滤知识条目
 */
export function filterByType(type: KnowledgeItemMeta['type']): KnowledgeItemMeta[] {
  return (_index.value?.items ?? []).filter(item => item.type === type)
}

/**
 * 下载指定知识条目内容
 * 返回内容字符串，或 null（失败时）
 */
export async function fetchKnowledgeItem(item: KnowledgeItemMeta): Promise<string | null> {
  try {
    // 支持相对 URL 和绝对 URL
    const url = item.downloadUrl.startsWith('http')
      ? item.downloadUrl
      : `${DEFAULT_KNOWLEDGE_BASE_URL}/${item.downloadUrl}`

    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`下载失败: HTTP ${resp.status}`)
    return await resp.text()
  } catch {
    return null
  }
}

/**
 * 获取当前同步状态的简洁描述（用于 UI）
 */
export function getStatusSummary(): string {
  const s = _syncStatus.value
  switch (s.phase) {
    case 'idle':           return '未同步'
    case 'fetching-index': return '正在获取知识索引...'
    case 'comparing':      return '正在比较版本...'
    case 'downloading':    return '正在下载更新...'
    case 'synced':         return `已同步 — 远程 v${s.remoteVersion}，${s.itemCount} 条目`
    case 'error':          return `同步失败：${s.error}`
  }
}

// ========== R25: Knowledge Augmentation for Skill Execution ==========

/** 知识增强结果 */
export interface KnowledgeAugmentation {
  /** 是否已尝试拉取 */
  attempted: boolean
  /** 匹配到的规则 */
  matchedRules: Array<{ id: string; name: string; content?: string }>
  /** 匹配到的提示 */
  matchedPrompts: Array<{ id: string; name: string; content?: string }>
  /** 匹配到的 guidance */
  matchedGuidance: Array<{ id: string; name: string; content?: string }>
}

/**
 * 根据 skill ID 解析相关远程知识增强
 *
 * 匹配逻辑：
 * 1. 尝试拉取远程 knowledge index（如果尚未拉取）
 * 2. 在 index 中查找与 skillId/name 相关的 rule / prompt / guidance
 * 3. 对匹配到的条目，下载其内容
 * 4. 失败时返回空结果（不阻塞 skill 执行）
 *
 * @param skillId skill 的唯一标识
 * @param skillName skill 名称（用于模糊匹配）
 * @param maxItems 每种类型最多拉取的条目数
 */
export async function resolveKnowledgeAugmentation(
  skillId: string,
  skillName?: string,
  maxItems = 3,
): Promise<KnowledgeAugmentation> {
  const empty: KnowledgeAugmentation = {
    attempted: true,
    matchedRules: [],
    matchedPrompts: [],
    matchedGuidance: [],
  }

  try {
    // 1. 确保有 index（先尝试缓存，再拉取远程）
    let index = _index.value
    if (!index) {
      index = restoreCachedIndex()
    }
    if (!index) {
      index = await fetchKnowledgeIndex()
    }
    if (!index || !index.items?.length) {
      return empty
    }

    // 2. 匹配相关条目（按 ID / 名称模糊匹配）
    const searchTerms = [skillId, skillName].filter(Boolean).map(t => t!.toLowerCase())

    function isRelated(item: KnowledgeItemMeta): boolean {
      if (searchTerms.length === 0) return true
      const itemName = (item.name || '').toLowerCase()
      const itemId = (item.id || '').toLowerCase()
      return searchTerms.some(term =>
        itemId.includes(term) || itemName.includes(term) || term.includes(itemId) || term.includes(itemName),
      )
    }

    const rules = index.items.filter(i => i.type === 'rule' && isRelated(i)).slice(0, maxItems)
    const prompts = index.items.filter(i => i.type === 'prompt' && isRelated(i)).slice(0, maxItems)
    const guidance = index.items.filter(i => i.type === 'guidance' && isRelated(i)).slice(0, maxItems)

    // 3. 并行下载匹配条目的内容（最多 maxItems * 3 个请求）
    const allItems = [...rules, ...prompts, ...guidance]
    const contentResults = await Promise.allSettled(
      allItems.map(item => fetchKnowledgeItem(item)),
    )

    // 4. 组装结果
    let contentIdx = 0
    function mapWithContent(items: KnowledgeItemMeta[]): Array<{ id: string; name: string; content?: string }> {
      return items.map(item => {
        const result = contentResults[contentIdx++]
        const content = result?.status === 'fulfilled' ? result.value ?? undefined : undefined
        return { id: item.id, name: item.name, content }
      })
    }

    return {
      attempted: true,
      matchedRules: mapWithContent(rules),
      matchedPrompts: mapWithContent(prompts),
      matchedGuidance: mapWithContent(guidance),
    }
  } catch {
    // 降级：返回空结果，不阻塞
    return empty
  }
}
