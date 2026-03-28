import type { CheerioAPI } from 'cheerio'
import type { CheckResult } from './auditor'

export function checkHeadingHierarchy($: CheerioAPI): CheckResult {
  const h1Count = $('h1').length
  const h2Count = $('h2').length

  let status: 'pass' | 'warn' | 'fail'
  let message: string

  if (h1Count === 1 && h2Count >= 2) {
    status = 'pass'
    message = `Single H1 + ${h2Count} H2 sections — good structure`
  } else if (h1Count === 1) {
    status = 'warn'
    message = `Single H1 found but only ${h2Count} H2 tags — add more structure`
  } else if (h1Count === 0) {
    status = 'fail'
    message = 'No H1 tag found — AI models cannot determine the primary topic'
  } else {
    status = 'warn'
    message = `Found ${h1Count} H1 tags — AI models prefer a single H1 per page`
  }

  return {
    id: 'heading-hierarchy',
    label: 'Heading Hierarchy',
    status,
    weight: 15,
    message,
    fix:
      status !== 'pass'
        ? 'Use exactly one H1 as the primary topic signal and at least two H2 sub-sections'
        : undefined,
  }
}

export function checkFAQContent($: CheerioAPI): CheckResult {
  const faqElements = $('[class*="faq" i], [id*="faq" i], details, summary').length
  const hasSchemaFAQ = $('script[type="application/ld+json"]')
    .toArray()
    .some(el => {
      try {
        const parsed = JSON.parse($(el).html() ?? '')
        const items = Array.isArray(parsed) ? parsed : [parsed]
        return items.some(i => i['@type'] === 'FAQPage')
      } catch {
        return false
      }
    })

  const hasFAQ = faqElements > 0 || hasSchemaFAQ

  return {
    id: 'faq-content',
    label: 'FAQ / Q&A Content',
    status: hasFAQ ? 'pass' : 'warn',
    weight: 15,
    message: hasFAQ
      ? `FAQ content detected (${faqElements} elements${hasSchemaFAQ ? ' + FAQPage schema' : ''})`
      : 'No FAQ content detected',
    fix: hasFAQ
      ? undefined
      : 'Add 3–5 Q&A pairs per service page using <details>/<summary> or FAQ schema markup',
  }
}

export function checkEEAT($: CheerioAPI): CheckResult {
  const signals: string[] = []

  // Author signals
  if ($('[class*="author" i], [rel="author"], [itemprop="author"]').length > 0)
    signals.push('author attribution')

  // About page link
  if ($('a[href*="/about"]').length > 0) signals.push('about page link')

  // Contact page link
  if ($('a[href*="/contact"]').length > 0) signals.push('contact page link')

  // Citations / external links — detect links going to a different hostname
  const canonicalHref = $('link[rel="canonical"]').attr('href') ?? ''
  let ownHost = ''
  try {
    ownHost = new URL(canonicalHref).hostname
  } catch {
    // canonical not set or malformed — fall back to no host filter
  }
  const externalLinks = $('a[href^="http"]').filter((_, el) => {
    const href = $(el).attr('href') ?? ''
    try {
      const linkHost = new URL(href).hostname
      return ownHost ? linkHost !== ownHost : true
    } catch {
      return false
    }
  }).length
  if (externalLinks >= 2) signals.push(`${externalLinks} external citations`)

  // Privacy policy
  if ($('a[href*="privacy"]').length > 0) signals.push('privacy policy')

  const count = signals.length

  return {
    id: 'eeat-signals',
    label: 'E-E-A-T Signals',
    status: count >= 3 ? 'pass' : count >= 1 ? 'warn' : 'fail',
    weight: 15,
    message:
      count >= 3
        ? `Strong E-E-A-T signals found: ${signals.join(', ')}`
        : count >= 1
        ? `Partial E-E-A-T signals: ${signals.join(', ')}`
        : 'No E-E-A-T signals detected',
    fix:
      count < 3
        ? 'Add author pages, a visible About section, external citations, and contact info'
        : undefined,
  }
}

export function checkMetaTags($: CheerioAPI): CheckResult {
  const title = $('title').text().trim()
  const metaDesc = $('meta[name="description"]').attr('content')?.trim()
  const canonical = $('link[rel="canonical"]').attr('href')

  const issues: string[] = []
  const good: string[] = []

  if (!title) issues.push('missing <title>')
  else if (title.length < 30 || title.length > 70) issues.push(`title length ${title.length} (aim 30–70)`)
  else good.push('title tag')

  if (!metaDesc) issues.push('missing meta description')
  else if (metaDesc.length < 100 || metaDesc.length > 160) issues.push(`description length ${metaDesc.length} (aim 100–160)`)
  else good.push('meta description')

  if (!canonical) issues.push('missing canonical tag')
  else good.push('canonical tag')

  const status: 'pass' | 'warn' | 'fail' =
    issues.length === 0 ? 'pass' : issues.length <= 1 ? 'warn' : 'fail'

  return {
    id: 'meta-tags',
    label: 'Meta Tags & Canonical',
    status,
    weight: 10,
    message:
      issues.length === 0
        ? `All meta tags present: ${good.join(', ')}`
        : `Issues found: ${issues.join('; ')}`,
    fix:
      issues.length > 0
        ? 'Ensure every page has a unique 30–70 char title, 100–160 char meta description, and a canonical URL'
        : undefined,
  }
}
