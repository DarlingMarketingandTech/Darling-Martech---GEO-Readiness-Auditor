import * as cheerio from 'cheerio'
import { checkRobots } from './robots-checker'
import { checkSchema } from './schema-checker'
import {
  checkHeadingHierarchy,
  checkFAQContent,
  checkParagraphLength,
  checkDefinitionPatterns,
  checkEEAT,
  checkMetaTags,
} from './content-checker'
import { calculateScore, buildSummary } from './scoring'

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

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
  /** 0–100 scale per check; weights in a run sum to 100 */
  weight: number
  message: string
  fix?: string
}

// ---------------------------------------------------------------------------
// Weight allocation (actual weights come from each checker function)
//
//  robots-ai-access      17   AI access gate — high impact
//  schema-markup         17   Structured data richness — high impact
//  heading-hierarchy     13   Content structure signal
//  faq-content           13   Q&A / direct-answer readiness
//  eeat-signals          13   Trust signals (author, about, citations)
//  meta-tags              9   Discoverability baseline
//  paragraph-length       9   Citation-friendliness
//  definition-patterns    9   Semantic clarity
//
//  Score is calculated as earned/totalWeight × 100 (self-normalising).
// ---------------------------------------------------------------------------

export async function runAudit(url: string): Promise<AuditResult> {
  const checks: CheckResult[] = []

  // 1. Fetch the page HTML — hard timeout keeps API response under 10 s
  const response = await fetch(url, {
    headers: { 'User-Agent': 'GEOAuditor/1.0 (+https://geo.darlingmartech.com)' },
    signal: AbortSignal.timeout(10000), // 10 s max per the product spec
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // 2. robots.txt — AI bot permissions (async, runs first in parallel)
  const robotsResult = await checkRobots(url)
  checks.push(robotsResult)

  // 3. Schema.org structured data — SMB-focused validation
  checks.push(checkSchema($))

  // 4. Heading hierarchy — H1 uniqueness + level-skip detection
  checks.push(checkHeadingHierarchy($))

  // 5. FAQ / Q&A — actual Q+A pair extraction from JSON-LD, details, and containers
  checks.push(checkFAQContent($))

  // 6. E-E-A-T signals — author, citations, trust links
  checks.push(checkEEAT($))

  // 7. Meta tags & canonical URL
  checks.push(checkMetaTags($))

  // 8. Paragraph length distribution — AI citation-friendliness
  checks.push(checkParagraphLength($))

  // 9. Definition patterns — semantic clarity signals
  checks.push(checkDefinitionPatterns($))

  const score = calculateScore(checks)

  return {
    url,
    score,
    checks,
    summary: buildSummary(score),
    fetchedAt: new Date().toISOString(),
  }
}
