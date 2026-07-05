/**
 * indexed-db.ts  轻量 IndexedDB 封装
 *
 * 用于 chat-session store 的持久化层，替代 localStorage。
 * 支持更大的存储容量（无 5MB 限制）和结构化查询。
 */

type UpgradeCallback = (db: IDBDatabase) => void

class SimpleDB {
  private db: IDBDatabase | null = null
  private name = ''
  private ready: Promise<void> | null = null

  async open(name: string, version: number, upgrade: UpgradeCallback): Promise<void> {
    if (this.db && this.name === name) return
    this.name = name
    this.ready = new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version)
      req.onupgradeneeded = () => {
        upgrade(req.result)
      }
      req.onsuccess = () => {
        this.db = req.result
        resolve()
      }
      req.onerror = () => {
        reject(req.error)
      }
    })
    await this.ready
  }

  private async ensureReady(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.ready) await this.ready
    if (!this.db) throw new Error('IndexedDB not opened')
    return this.db
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    const db = await this.ensureReady()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  }

  async put<T>(store: string, key: string, value: T): Promise<void> {
    const db = await this.ensureReady()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      const req = tx.objectStore(store).put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async delete(store: string, key: string): Promise<void> {
    const db = await this.ensureReady()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      const req = tx.objectStore(store).delete(key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async getAll<T>(store: string): Promise<T[]> {
    const db = await this.ensureReady()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).getAll()
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => reject(req.error)
    })
  }

  async getAllKeys(store: string): Promise<string[]> {
    const db = await this.ensureReady()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).getAllKeys()
      req.onsuccess = () => resolve(req.result as string[] ?? [])
      req.onerror = () => reject(req.error)
    })
  }
}

/** 全局单例 */
export const chatDB = new SimpleDB()
