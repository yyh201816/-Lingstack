/**
 * updater.service.ts — Tauri 官方在线更新服务
 *
 * 职责：
 *   1. 检查更新（调用 tauri-plugin-updater）
 *   2. 下载更新包
 *   3. 安装并重启
 *
 * 设计：
 *   - 浏览器环境（dev）自动降级为 mock，不报错
 *   - Tauri 环境调用真实 updater API
 *   - 所有状态通过 reactive 对象暴露，UI 可直接绑定
 */

import { ref, readonly } from 'vue'

// ========== 类型 ==========

export type ReleaseChannel = 'nightly' | 'alpha' | 'beta' | 'rc' | 'stable-internal' | 'releases'

export interface UpdateInfo {
  version: string
  date: string
  body: string
  available: boolean
  channel?: ReleaseChannel
}

/** 细粒度错误分类，帮助用户和开发者诊断更新失败原因 */
export type UpdaterErrorKind =
  | 'network'       // DNS/连接/超时
  | 'signature'     // 签名校验失败 — latest.json 中 signature 为空或不匹配
  | 'server'        // HTTP 非200
  | 'no_update'     // 已是最新
  | 'platform'      // 不支持的平台
  | 'unknown'

export interface UpdaterError {
  kind: UpdaterErrorKind
  message: string
  raw?: string
}

export interface UpdateProgress {
  /** 下载进度百分比 0-100 */
  percent: number
  /** 已下载字节 */
  downloaded: number
  /** 总字节 */
  total: number
  /** 当前阶段 */
  phase: 'checking' | 'downloading' | 'installing' | 'done' | 'error' | 'idle'
  /** 错误信息 */
  error?: string
}

// ========== Channel-aware endpoint helpers ==========

const DEFAULT_CHANNEL: ReleaseChannel = 'beta'

const _currentChannel = ref<ReleaseChannel>(
  (() => {
    try {
      const raw = localStorage.getItem('lingstack_current_channel')
      if (raw) return raw as ReleaseChannel
    } catch { /* ignore */ }
    return DEFAULT_CHANNEL
  })(),
)

export const currentChannel = readonly(_currentChannel)

/** Set the current update channel (pulled from release strategy store or manual) */
export function setUpdateChannel(channel: ReleaseChannel) {
  _currentChannel.value = channel
  try {
    localStorage.setItem('lingstack_current_channel', channel)
  } catch { /* ignore */ }
}

/**
 * Build the channel-aware updater endpoint URL.
 * Format: https://ai.tadanpay.cn/updates/{channel}/latest.json
 */
export function getChannelEndpoint(channel?: ReleaseChannel): string {
  const ch = channel ?? _currentChannel.value
  return `https://ai.tadanpay.cn/updates/${ch}/latest.json`
}

// ========== 状态 ==========

const _isChecking = ref(false)
const _updateInfo = ref<UpdateInfo | null>(null)
const _progress = ref<UpdateProgress>({
  percent: 0, downloaded: 0, total: 0, phase: 'idle',
})
const _lastCheckTime = ref<string | null>(null)

export const isChecking = readonly(_isChecking)
export const updateInfo = readonly(_updateInfo)
export const progress = readonly(_progress)
export const lastCheckTime = readonly(_lastCheckTime)

// ========== 错误分类 ==========

/**
 * 将 Tauri updater 抛出的原始错误归类为可操作的诊断类别。
 * 签名错误最常见也最隐蔽 — Tauri 抛出的信息可能只是 "invalid signature"
 * 或 "failed to verify signature"，需要显式标记出来。
 */
function classifyError(e: any): UpdaterError {
  const msg: string = e?.message ?? e?.toString() ?? '未知错误'
  const lower = msg.toLowerCase()

  if (lower.includes('signature') || lower.includes('verify') || lower.includes('invalid')) {
    return {
      kind: 'signature',
      message: '更新签名校验失败 — 服务器 latest.json 中 signature 可能为空或不匹配',
      raw: msg,
    }
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout') || lower.includes('dns') || lower.includes('connect')) {
    return { kind: 'network', message: `网络错误: ${msg}`, raw: msg }
  }
  if (lower.includes('404') || lower.includes('500') || lower.includes('status')) {
    return { kind: 'server', message: `服务器响应异常: ${msg}`, raw: msg }
  }
  if (lower.includes('platform') || lower.includes('unsupported')) {
    return { kind: 'platform', message: `当前平台不支持更新: ${msg}`, raw: msg }
  }
  return { kind: 'unknown', message: msg, raw: msg }
}

// ========== 内部：浏览器 mock ==========

async function mockCheck(): Promise<UpdateInfo> {
  await new Promise(r => setTimeout(r, 800))
  // mock：返回"无更新"，避免误导用户
  return {
    version: '0.1.1',
    date: new Date().toISOString(),
    body: '当前为开发环境，更新检查不可用。',
    available: false,
  }
}

// ========== 公开 API ==========

/** 上次错误（用于 UI 展示诊断信息） */
const _lastError = ref<UpdaterError | null>(null)
export const lastError = readonly(_lastError)

/**
 * 检查更新（带通道回退）。
 * 优先检查当前通道，如果失败且错误为 signature/server，
 * 自动回退到 releases 通道（最稳定的正式版通道）。
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  _isChecking.value = true
  _lastError.value = null
  _progress.value = { ..._progress.value, phase: 'checking', error: undefined }

  const channelsToTry: ReleaseChannel[] = [
    _currentChannel.value,
    ...(_currentChannel.value !== 'releases' ? ['releases' as ReleaseChannel] : []),
  ]

  let lastErr: UpdaterError | null = null

  for (const channel of channelsToTry) {
    try {
      const updater = await import('@tauri-apps/plugin-updater').catch(() => null)

      if (updater) {
        const update = await updater.check()
        if (update) {
          const info: UpdateInfo = {
            version: update.version,
            date: update.date ?? '',
            body: update.body ?? '',
            available: true,
            channel,
          }
          _updateInfo.value = info
          _lastCheckTime.value = new Date().toLocaleTimeString()
          _progress.value = { ..._progress.value, phase: 'idle' }
          return info
        } else {
          const info: UpdateInfo = {
            version: '', date: '', body: '',
            available: false, channel,
          }
          _updateInfo.value = info
          _lastCheckTime.value = new Date().toLocaleTimeString()
          _progress.value = { ..._progress.value, phase: 'idle' }
          return info
        }
      } else {
        const info = await mockCheck()
        _updateInfo.value = info
        _lastCheckTime.value = new Date().toLocaleTimeString()
        _progress.value = { ..._progress.value, phase: 'idle' }
        return info
      }
    } catch (e: any) {
      lastErr = classifyError(e)
      // 签名或网络错误 → 尝试下一个通道
      if (lastErr.kind === 'signature' || lastErr.kind === 'network') {
        console.warn(`[Updater] 通道 ${channel} 失败: ${lastErr.message}, 回退到下一通道`)
        continue
      }
      // 其他错误直接抛出
      _lastError.value = lastErr
      _progress.value = { ..._progress.value, phase: 'error', error: lastErr.message }
      throw lastErr
    }
  }

  // 所有通道都失败了
  _lastError.value = lastErr
  _progress.value = { ..._progress.value, phase: 'error', error: lastErr?.message ?? '所有更新通道均不可用' }
  throw lastErr ?? new Error('所有更新通道均不可用')
}

/** 下载并安装更新 */
export async function downloadAndInstall(): Promise<void> {
  _lastError.value = null
  _progress.value = { ..._progress.value, phase: 'downloading', percent: 0, error: undefined }

  try {
    const updater = await import('@tauri-apps/plugin-updater').catch(() => null)
    if (!updater) {
      const err: UpdaterError = { kind: 'platform', message: '当前环境不支持更新（需要 Tauri 桌面环境）' }
      _lastError.value = err
      _progress.value = { ..._progress.value, phase: 'error', error: err.message }
      return
    }

    const update = await updater.check()
    if (!update) {
      const err: UpdaterError = { kind: 'no_update', message: '没有可用的更新' }
      _lastError.value = err
      _progress.value = { ..._progress.value, phase: 'error', error: err.message }
      return
    }

    // 下载 + 安装
    await update.downloadAndInstall((event: any) => {
      switch (event.event) {
        case 'Started':
          _progress.value = {
            ..._progress.value,
            phase: 'downloading',
            total: event.data?.contentLength ?? 0,
          }
          break
        case 'Progress':
          _progress.value = {
            ..._progress.value,
            phase: 'downloading',
            downloaded: _progress.value.downloaded + (event.data?.chunkLength ?? 0),
            total: _progress.value.total || (event.data?.contentLength ?? 0),
            percent: _progress.value.total > 0
              ? Math.round(((_progress.value.downloaded + (event.data?.chunkLength ?? 0)) / _progress.value.total) * 100)
              : 0,
          }
          break
        case 'Finished':
          _progress.value = { ..._progress.value, phase: 'done', percent: 100 }
          break
      }
    })

    // 安装完成后重启
    _progress.value = { ..._progress.value, phase: 'installing' }
    const process = await import('@tauri-apps/plugin-process').catch(() => null)
    if (process) {
      await process.relaunch()
    }
  } catch (e: any) {
    const err = classifyError(e)
    _lastError.value = err
    _progress.value = { ..._progress.value, phase: 'error', error: err.message }
    throw err
  }
}

/** 重置更新状态 */
export function resetUpdateState(): void {
  _updateInfo.value = null
  _lastError.value = null
  _progress.value = { percent: 0, downloaded: 0, total: 0, phase: 'idle' }
  _lastCheckTime.value = null
}
