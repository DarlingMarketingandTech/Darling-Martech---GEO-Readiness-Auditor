import type { CheckResult } from './auditor'

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'anthropic-ai', 'CCBot']

export async function checkRobots(url: string): Promise<CheckResult> {
  try {
    const base = new URL(url)
    const robotsUrl = `${base.protocol}//${base.host}/robots.txt`

    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      return {
        id: 'robots-txt',
        label: 'AI Bot Permissions (robots.txt)',
        status: 'warn',
        weight: 20,
        message: 'robots.txt not found or not accessible',
        fix: 'Create a robots.txt and explicitly allow GPTBot, ClaudeBot, and PerplexityBot',
      }
    }

    const text = await res.text()
    const lines = text.split('\n').map(l => l.trim())

    const blocked: string[] = []
    const allowed: string[] = []

    for (const bot of AI_BOTS) {
      const botLower = bot.toLowerCase()
      // Find User-agent: <bot> blocks
      let inBlock = false
      for (const line of lines) {
        const lineLower = line.toLowerCase()
        if (lineLower.startsWith('user-agent:')) {
          const agent = lineLower.replace('user-agent:', '').trim()
          inBlock = agent === botLower || agent === '*'
        }
        if (inBlock && lineLower.startsWith('disallow:')) {
          const path = lineLower.replace('disallow:', '').trim()
          if (path === '/' || path === '') {
            if (path === '/') blocked.push(bot)
            break
          }
        }
      }
      if (!blocked.includes(bot)) allowed.push(bot)
    }

    const blockedCount = blocked.length

    return {
      id: 'robots-txt',
      label: 'AI Bot Permissions (robots.txt)',
      status: blockedCount === 0 ? 'pass' : blockedCount >= AI_BOTS.length / 2 ? 'fail' : 'warn',
      weight: 20,
      message:
        blockedCount === 0
          ? `All AI crawlers allowed (${allowed.slice(0, 3).join(', ')}…)`
          : `${blockedCount} AI bot(s) blocked: ${blocked.join(', ')}`,
      fix:
        blockedCount > 0
          ? `Add explicit Allow rules for ${blocked.join(', ')} in robots.txt`
          : undefined,
    }
  } catch {
    return {
      id: 'robots-txt',
      label: 'AI Bot Permissions (robots.txt)',
      status: 'warn',
      weight: 20,
      message: 'Could not fetch robots.txt',
      fix: 'Ensure robots.txt is accessible and allows AI crawlers',
    }
  }
}
