import { z } from 'zod'
import type { CheckResult } from './auditor'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const RobotsEntrySchema = z.object({
  userAgent: z.string(),
  disallows: z.array(z.string()),
  allows: z.array(z.string()),
})
type RobotsEntry = z.infer<typeof RobotsEntrySchema>

/** AI bots we care about (product spec), keyed by canonical name → lowercase alias list */
const AI_BOTS: Record<string, string[]> = {
  GPTBot: ['gptbot'],
  ClaudeBot: ['claudebot', 'anthropic-ai'],
  PerplexityBot: ['perplexitybot'],
  'Google-Extended': ['google-extended'],
}

const CANONICAL_NAMES = Object.keys(AI_BOTS) // display order

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function parseRobotsTxt(text: string): RobotsEntry[] {
  const entries: RobotsEntry[] = []
  let current: RobotsEntry | null = null

  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim() // strip inline comments
    if (!line) {
      // blank line ends the current block
      if (current) {
        entries.push(RobotsEntrySchema.parse(current))
        current = null
      }
      continue
    }

    const sep = line.indexOf(':')
    if (sep === -1) continue
    const directive = line.slice(0, sep).trim().toLowerCase()
    const value = line.slice(sep + 1).trim()

    if (directive === 'user-agent') {
      if (!current) {
        current = { userAgent: value.toLowerCase(), disallows: [], allows: [] }
      } else {
        // multiple User-agent lines in one block → keep a composite key
        current.userAgent += `|${value.toLowerCase()}`
      }
    } else if (directive === 'disallow' && current) {
      current.disallows.push(value)
    } else if (directive === 'allow' && current) {
      current.allows.push(value)
    }
  }

  // flush last entry (files without trailing newline)
  if (current) entries.push(RobotsEntrySchema.parse(current))

  return entries
}

// ---------------------------------------------------------------------------
// Bot access resolver
// ---------------------------------------------------------------------------

type BotAccess = 'allowed' | 'blocked' | 'not-mentioned'

function resolveBotAccess(entries: RobotsEntry[], botAliases: string[]): BotAccess {
  // Look for an explicit block first, then fall back to wildcard
  let wildcardEntry: RobotsEntry | undefined
  let specificEntry: RobotsEntry | undefined

  for (const entry of entries) {
    const agents = entry.userAgent.split('|')
    const matchesBot = agents.some(a => botAliases.includes(a))
    const isWildcard = agents.includes('*')

    if (matchesBot) specificEntry = entry
    if (isWildcard) wildcardEntry = entry
  }

  // Specific block wins over wildcard
  const applicable = specificEntry ?? wildcardEntry
  if (!applicable) return 'not-mentioned'

  const isBlocked = applicable.disallows.some(path => path === '/')
  if (isBlocked) {
    // Check if there's a specific Allow: / that overrides
    const hasRootAllow = applicable.allows.some(path => path === '/')
    return hasRootAllow ? 'allowed' : 'blocked'
  }

  return 'allowed'
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function checkRobots(url: string): Promise<CheckResult> {
  let robotsText: string

  try {
    const base = new URL(url)
    const robotsUrl = `${base.protocol}//${base.host}/robots.txt`
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(8000) })

    if (!res.ok) {
      return {
        id: 'robots-ai-access',
        label: 'AI Bot Access',
        status: 'warn',
        weight: 17,
        message: `robots.txt not found (HTTP ${res.status})`,
        fix: 'Create a robots.txt that explicitly allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended',
      }
    }

    robotsText = await res.text()
  } catch {
    return {
      id: 'robots-ai-access',
      label: 'AI Bot Access',
      status: 'warn',
      weight: 17,
      message: 'Could not fetch robots.txt — defaulting to open access assumption',
      fix: 'Ensure robots.txt is publicly accessible at /robots.txt',
    }
  }

  const entries = parseRobotsTxt(robotsText)

  const blocked: string[] = []
  const notMentioned: string[] = []
  const allowed: string[] = []

  for (const name of CANONICAL_NAMES) {
    const access = resolveBotAccess(entries, AI_BOTS[name])
    if (access === 'blocked') blocked.push(name)
    else if (access === 'not-mentioned') notMentioned.push(name)
    else allowed.push(name)
  }

  // Scoring logic
  if (blocked.length === 0 && notMentioned.length === 0) {
    return {
      id: 'robots-ai-access',
      label: 'AI Bot Access',
      status: 'pass',
      weight: 17,
      message: `All AI crawlers explicitly allowed: ${allowed.join(', ')}`,
    }
  }

  if (blocked.length === 0) {
    // Some bots not explicitly mentioned — likely allowed via wildcard or default
    return {
      id: 'robots-ai-access',
      label: 'AI Bot Access',
      status: 'warn',
      weight: 17,
      message: `${notMentioned.length} AI bot(s) not explicitly addressed: ${notMentioned.join(', ')}`,
      fix: `Add explicit User-agent blocks for ${notMentioned.join(', ')} with Allow: /`,
    }
  }

  const status = blocked.length >= Math.ceil(CANONICAL_NAMES.length / 2) ? 'fail' : 'warn'

  return {
    id: 'robots-ai-access',
    label: 'AI Bot Access',
    status,
    weight: 17,
    message: `${blocked.length} AI bot(s) blocked from crawling: ${blocked.join(', ')}`,
    fix: `Remove Disallow: / rules (or add Allow: /) for ${blocked.join(', ')} in robots.txt`,
  }
}
