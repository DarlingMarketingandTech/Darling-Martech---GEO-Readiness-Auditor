import type { CheerioAPI } from 'cheerio'
import type { CheckResult } from './auditor'

const HIGH_VALUE_TYPES = [
  'LocalBusiness',
  'Organization',
  'Service',
  'FAQPage',
  'WebPage',
  'Article',
  'BreadcrumbList',
  'SiteNavigationElement',
]

export function checkSchema($: CheerioAPI): CheckResult {
  const scripts = $('script[type="application/ld+json"]')
  const count = scripts.length

  if (count === 0) {
    return {
      id: 'schema-markup',
      label: 'Schema Markup',
      status: 'fail',
      weight: 20,
      message: 'No JSON-LD schema found',
      fix: 'Add at minimum: LocalBusiness, Service, and FAQPage schema',
    }
  }

  const foundTypes: string[] = []
  scripts.each((_, el) => {
    try {
      const raw = $(el).html() ?? ''
      const parsed = JSON.parse(raw)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const type = item['@type']
        if (type) foundTypes.push(Array.isArray(type) ? type.join(', ') : type)
      }
    } catch {
      // malformed JSON-LD — skip
    }
  })

  const hasHighValue = foundTypes.some(t =>
    HIGH_VALUE_TYPES.some(hv => t.includes(hv))
  )

  return {
    id: 'schema-markup',
    label: 'Schema Markup',
    status: hasHighValue ? 'pass' : 'warn',
    weight: 20,
    message: hasHighValue
      ? `Found ${count} schema block(s): ${foundTypes.join(', ')}`
      : `Found ${count} schema block(s) but missing key types (${HIGH_VALUE_TYPES.slice(0, 3).join(', ')}…)`,
    fix: hasHighValue
      ? undefined
      : `Add high-value schema types: ${HIGH_VALUE_TYPES.slice(0, 3).join(', ')}`,
  }
}
