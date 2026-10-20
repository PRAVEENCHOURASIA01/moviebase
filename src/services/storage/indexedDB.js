// ─────────────────────────────────────────
// IndexedDB Local-First Engine
// High-capacity, asynchronous client-side store
// Preserves user collections without server/SQL dependency
// ─────────────────────────────────────────

const DB_NAME = 'moviebase_db'
const DB_VERSION = 1
const STORE_MOVIES = 'movies'
const STORE_SETTINGS = 'settings'

let dbPromise = null

const getDB = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (e) => {
        const db = e.target.result

        // Movies Store
        if (!db.objectStoreNames.contains(STORE_MOVIES)) {
          const movieStore = db.createObjectStore(STORE_MOVIES, { keyPath: 'movieId' })
          movieStore.createIndex('by_category', 'category', { unique: false })
          movieStore.createIndex('by_updatedAt', 'updatedAt', { unique: false })
        }

        // Settings / Profile Store
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return dbPromise
}

// ── Generic Promise-based Transaction Helpers ──
const executeTx = async (storeName, mode, callback) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    let result

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)

    result = callback(store)
  })
}

// ── Movies Operations ─────────────────────

export const dbGetMovies = async () => {
  return executeTx(STORE_MOVIES, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  })
}

export const dbGetMovie = async (movieId) => {
  const numericId = Number(movieId)
  return executeTx(STORE_MOVIES, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(numericId)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  })
}

export const dbSaveMovie = async (movieRecord) => {
  const normalized = {
    ...movieRecord,
    movieId: Number(movieRecord.movieId || movieRecord.id || movieRecord.movie_id),
    updatedAt: movieRecord.updatedAt || new Date().toISOString(),
  }

  return executeTx(STORE_MOVIES, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put(normalized)
      request.onsuccess = () => resolve(normalized)
      request.onerror = () => reject(request.error)
    })
  })
}

export const dbRemoveMovie = async (movieId) => {
  const numericId = Number(movieId)
  return executeTx(STORE_MOVIES, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(numericId)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  })
}

export const dbClearMovies = async () => {
  return executeTx(STORE_MOVIES, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  })
}

// ── Settings / Profile Store Operations ────

export const dbGetSetting = async (key, defaultValue = null) => {
  return executeTx(STORE_SETTINGS, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value ?? defaultValue)
      request.onerror = () => reject(request.error)
    })
  })
}

export const dbSaveSetting = async (key, value) => {
  return executeTx(STORE_SETTINGS, 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: new Date().toISOString() })
      request.onsuccess = () => resolve(value)
      request.onerror = () => reject(request.error)
    })
  })
}

// ── Import / Export Utilities ──────────────

export const exportLocalBackup = async () => {
  const movies = await dbGetMovies()
  const profile = await dbGetSetting('profile', null)
  const shareConfig = await dbGetSetting('share_config', null)

  const backupData = {
    app: 'MovieBase',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    shareConfig,
    movies,
  }

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moviebase-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { success: true, count: movies.length }
}

export const importLocalBackup = async (jsonString) => {
  const data = JSON.parse(jsonString)
  if (!data || !Array.isArray(data.movies)) {
    throw new Error('Invalid backup file format: Missing movies list')
  }

  for (const m of data.movies) {
    await dbSaveMovie(m)
  }

  if (data.profile) {
    await dbSaveSetting('profile', data.profile)
  }
  if (data.shareConfig) {
    await dbSaveSetting('share_config', data.shareConfig)
  }

  return { success: true, count: data.movies.length }
}
