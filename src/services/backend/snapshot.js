import { ENV } from '@/config/env'

// ─────────────────────────────────────────
// Persistent Snapshot Cloud Service (Option A)
// Stores and fetches public profile snapshots via Upstash Redis REST
// Eliminates pausing SQL database dependency completely
// ─────────────────────────────────────────

const SNAPSHOT_PREFIX = 'mb_snapshot:'

/**
 * Executes a REST command against Upstash Redis
 */
const upstashCommand = async (command, ...args) => {
  const url = ENV.UPSTASH_REDIS_REST_URL
  const token = ENV.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Upstash Redis credentials not configured. Please add VITE_UPSTASH_REDIS_REST_URL and VITE_UPSTASH_REDIS_REST_TOKEN in Vercel project settings.')
  }

  const endpoint = `${url.replace(/\/$/, '')}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  })

  if (!response.ok) {
    throw new Error(`Upstash error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.result
}

/**
 * Publish or update an unlisted profile snapshot
 * @param {string} shareToken - high-entropy unique share identifier
 * @param {object} snapshotData - sanitized public presentation payload
 */
export const publishSnapshot = async (shareToken, snapshotData) => {
  const key = `${SNAPSHOT_PREFIX}${shareToken}`
  const payload = JSON.stringify({
    ...snapshotData,
    publishedAt: new Date().toISOString(),
  })

  const result = await upstashCommand('SET', key, payload)
  return result
}

/**
 * Fetch a published snapshot by token
 * @param {string} shareToken
 * @returns {Promise<object|null>}
 */
export const getSnapshot = async (shareToken) => {
  const key = `${SNAPSHOT_PREFIX}${shareToken}`
  const raw = await upstashCommand('GET', key)
  if (!raw) return null

  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

/**
 * Revoke or delete a published profile snapshot
 * @param {string} shareToken
 */
export const deleteSnapshot = async (shareToken) => {
  const key = `${SNAPSHOT_PREFIX}${shareToken}`
  return await upstashCommand('DEL', key)
}
