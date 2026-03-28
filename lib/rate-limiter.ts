/**
 * rate-limiter.ts
 *
 * Dual-mode rate limiter:
 *  - PRODUCTION: Upstash Redis sliding-window (requires UPSTASH_REDIS_REST_URL +
 *    UPSTASH_REDIS_REST_TOKEN env vars — set them in Vercel project settings).
 *  - DEV / FALLBACK: In-process sliding-window map (resets per cold start).
 *
 * Usage:
 *   const { allowed, remaining, resetIn } = await checkRateLimit(ip, 'audit')
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type LimiterKey = 'audit' | 'capture'

const LIMITS: Record<LimiterKey, { requests: number; window: number }> = {
  audit:   { requests: 10, window: 60 * 60 }, // 10 req / hour
  capture: { requests: 5,  window: 60 * 60 }, // 5  req / hour (email gate)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** seconds until the oldest request expires and a slot opens */
  resetIn: number
}

// ---------------------------------------------------------------------------
// Upstash path (persistent, multi-instance safe)
// ---------------------------------------------------------------------------

/** Lazily created per limiter key — reused across warm invocations */
const upstashLimiters = new Map<LimiterKey, Ratelimit>()

function getUpstashLimiter(key: LimiterKey): Ratelimit {
  if (!upstashLimiters.has(key)) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    const { requests, window } = LIMITS[key]
    upstashLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, `${window} s`),
        prefix: `geo-auditor:${key}`,
      })
    )
  }
  return upstashLimiters.get(key)!
}

async function checkUpstash(ip: string, key: LimiterKey): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(key)
  const { success, remaining, reset } = await limiter.limit(ip)
  return {
    allowed: success,
    remaining: Math.max(remaining, 0),
    resetIn: Math.max(Math.ceil((reset - Date.now()) / 1000), 0),
  }
}

// ---------------------------------------------------------------------------
// In-process sliding-window fallback
// ---------------------------------------------------------------------------

interface WindowEntry {
  timestamps: number[]
}

/**
 * Simple LRU-ish sliding-window map.
 * Keyed by `${limiterKey}:${ip}`.
 * Entries older than the window are pruned on each access.
 */
const localWindows = new Map<string, WindowEntry>()

function checkLocal(ip: string, key: LimiterKey): RateLimitResult {
  const { requests: limit, window: windowSecs } = LIMITS[key]
  const windowMs = windowSecs * 1000
  const now = Date.now()
  const mapKey = `${key}:${ip}`

  const entry = localWindows.get(mapKey) ?? { timestamps: [] }
  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  const allowed = entry.timestamps.length < limit
  if (allowed) entry.timestamps.push(now)
  localWindows.set(mapKey, entry)

  const oldest = entry.timestamps[0] ?? now
  const resetIn = Math.max(Math.ceil((oldest + windowMs - now) / 1000), 0)

  return {
    allowed,
    remaining: Math.max(limit - entry.timestamps.length, 0),
    resetIn,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  ip: string,
  key: LimiterKey
): Promise<RateLimitResult> {
  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN

  if (hasUpstash) {
    try {
      return await checkUpstash(ip, key)
    } catch (err) {
      // If Redis is temporarily unavailable, fall through to local limiter
      console.warn('[rate-limiter] Upstash error — falling back to local store:', err)
    }
  }

  return checkLocal(ip, key)
}

/**
 * Extract the real client IP from a Next.js request.
 * Respects Vercel's x-forwarded-for header.
 */
export function getClientIp(req: Request): string {
  const xff = (req as { headers: Headers }).headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return '127.0.0.1'
}
