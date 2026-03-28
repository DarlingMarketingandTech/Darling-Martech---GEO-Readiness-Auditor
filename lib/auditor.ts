import * as cheerio from 'cheerio'
import { checkRobots } from './robots-checker'
import { checkSchema } from './schema-checker'
import {
  checkHeadingHierarchy,
  checkFAQContent,
  checkEEAT,
  checkMetaTags,
} from './content-checker'
import { calculateScore, buildSummary } from './scoring'

export interface AuditResult {
  url: string
  score: number
  checks: CheckResult[]
  summary: string
  fetchedAt: string
}

export interface CheckResult {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  weight: number
  message: string
  fix?: string
}

export async function runAudit(url: string): Promise<AuditResult> {
  const checks: CheckResult[] = []

  // 1. Fetch the page HTML
  const response = await fetch(url, {
    headers: { 'User-Agent': 'GEOAuditor/1.0 (+https://geo.darlingmartech.com)' },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // 2. robots.txt — AI bot permissions
  const robotsResult = await checkRobots(url)
  checks.push(robotsResult)

  // 3. Schema.org structured data
  checks.push(checkSchema($))

  // 4. Heading hierarchy
  checks.push(checkHeadingHierarchy($))

  // 5. FAQ / Q&A content
  checks.push(checkFAQContent($))

  // 6. E-E-A-T signals
  checks.push(checkEEAT($))

  // 7. Meta tags & canonical
  checks.push(checkMetaTags($))

  const score = calculateScore(checks)

  return {
    url,
    score,
    checks,
    summary: buildSummary(score),
    fetchedAt: new Date().toISOString(),
  }
}
