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

export type ReleaseChannel = 'nightly' | 'alpha' | 'beta' | 'rc' | 'stable-internal'

export interface UpdateInfo {
  version: string
  date: string
  body: string
  available: boolean
  channel?: ReleaseChannel
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

/** 检查更新 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  _isChecking.value = true
  _progress.value = { ..._progress.value, phase: 'checking', error: undefined }

  try {
    // 尝试加载 Tauri updater API
    const updater = await import('@tauri-apps/plugin-updater').catch(() => null)

    if (updater) {
      const update = await updater.check()
      if (update) {
        const info: UpdateInfo = {
          version: update.version,
          date: update.date ?? '',
          body: update.body ?? '',
          available: true,
        }
        _updateInfo.value = info
        _lastCheckTime.value = new Date().toLocaleTimeString()
        _progress.value = { ..._progress.value, phase: 'idle' }
        return info
      } else {
        const info: UpdateInfo = {
          version: '',
          date: '',
          body: '',
          available: false,
        }
        _updateInfo.value = info
        _lastCheckTime.value = new Date().toLocaleTimeString()
        _progress.value = { ..._progress.value, phase: 'idle' }
        return info
      }
    } else {
      // 浏览器环境
      const info = await mockCheck()
      _updateInfo.value = info
      _lastCheckTime.value = new Date().toLocaleTimeString()
      _progress.value = { ..._progress.value, phase: 'idle' }
      return info
    }
  } catch (e: any) {
    _progress.value = { ..._progress.value, phase: 'error', error: e.message ?? '检查更新失败' }
    throw e
  } finally {
    _isChecking.value = false
  }
}

/** 下载并安装更新 */
export async function downloadAndInstall(): Promise<void> {
  _progress.value = { ..._progress.value, phase: 'downloading', percent: 0, error: undefined }

  try {
    const updater = await import('@tauri-apps/plugin-updater').catch(() => null)
    if (!updater) {
      _progress.value = { ..._progress.value, phase: 'error', error: '当前环境不支持更新（需要 Tauri 桌面环境）' }
      return
    }

    const update = await updater.check()
    if (!update) {
      _progress.value = { ..._progress.value, phase: 'error', error: '没有可用的更新' }
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
    _progress.value = { ..._progress.value, phase: 'error', error: e.message ?? '下载安装失败' }
    throw e
  }
}

/** 重置更新状态 */
export function resetUpdateState(): void {
  _updateInfo.value = null
  _progress.value = { percent: 0, downloaded: 0, total: 0, phase: 'idle' }
  _lastCheckTime.value = null
}
