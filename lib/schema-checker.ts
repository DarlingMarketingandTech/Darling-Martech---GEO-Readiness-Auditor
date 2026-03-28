import { z } from 'zod'
import type { CheerioAPI } from 'cheerio'
import type { CheckResult } from './auditor'

// ---------------------------------------------------------------------------
// Zod schemas for JSON-LD validation
// ---------------------------------------------------------------------------

/** Minimal required fields per schema type (SMB focus) */
const SMB_TYPE_REQUIREMENTS: Record<string, string[]> = {
  LocalBusiness: ['name', 'address', 'url', 'description'],
  Organization: ['name', 'url', 'description'],
  Service: ['name', 'description', 'provider'],
  FAQPage: ['mainEntity'],
  WebPage: ['name', 'url'],
  Article: ['headline', 'author', 'datePublished'],
  BreadcrumbList: ['itemListElement'],
}

/** SMB-critical types that should appear on an SMB site */
const SMB_PRIORITY_TYPES = ['LocalBusiness', 'Organization', 'Service', 'FAQPage']

const JsonLdItemSchema = z.looseObject({
  '@type': z.union([z.string(), z.array(z.string())]).optional(),
  '@context': z.string().optional(),
})

type JsonLdItem = z.infer<typeof JsonLdItemSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SchemaAnalysis {
  types: string[]
  missingFields: Record<string, string[]>  // type → missing required fields
  missingSMBTypes: string[]
  presentSMBTypes: string[]
  totalBlocks: number
  malformedBlocks: number
}

function flattenType(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

function extractJsonLdItems($: CheerioAPI): { items: JsonLdItem[]; malformed: number } {
  const items: JsonLdItem[] = []
  let malformed = 0

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() ?? ''
      if (!raw.trim()) return
      const parsed = JSON.parse(raw)
      const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of list) {
        const result = JsonLdItemSchema.safeParse(entry)
        if (result.success) items.push(result.data)
        else malformed++
      }
    } catch {
      malformed++
    }
  })

  return { items, malformed }
}

function analyzeSchema($: CheerioAPI): SchemaAnalysis {
  const { items, malformed } = extractJsonLdItems($)
  const types: string[] = []
  const missingFields: Record<string, string[]> = {}

  for (const item of items) {
    const typeList = flattenType(item['@type'])
    for (const t of typeList) {
      types.push(t)
      const required = SMB_TYPE_REQUIREMENTS[t]
      if (required) {
        const missing = required.filter(field => !(field in item))
        if (missing.length > 0) missingFields[t] = missing
      }
    }
  }

  const presentSMBTypes = SMB_PRIORITY_TYPES.filter(t =>
    types.some(found => found === t || found.endsWith(t))
  )
  const missingSMBTypes = SMB_PRIORITY_TYPES.filter(t => !presentSMBTypes.includes(t))

  return {
    types,
    missingFields,
    missingSMBTypes,
    presentSMBTypes,
    totalBlocks: items.length + malformed,
    malformedBlocks: malformed,
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function checkSchema($: CheerioAPI): CheckResult {
  const scripts = $('script[type="application/ld+json"]')
  const blockCount = scripts.length

  if (blockCount === 0) {
    return {
      id: 'schema-markup',
      label: 'Schema Markup',
      status: 'fail',
      weight: 17,
      message: 'No JSON-LD schema blocks found on this page',
      fix: `Add Schema.org JSON-LD for at least: ${SMB_PRIORITY_TYPES.join(', ')}. Use Google's Structured Data Markup Helper to get started.`,
    }
  }

  const analysis = analyzeSchema($)

  // ── No types extracted (all malformed) ──────────────────────────────────
  if (analysis.types.length === 0) {
    return {
      id: 'schema-markup',
      label: 'Schema Markup',
      status: 'fail',
      weight: 17,
      message: `Found ${blockCount} JSON-LD block(s) but all failed to parse — likely malformed JSON`,
      fix: 'Validate your JSON-LD with https://validator.schema.org and fix syntax errors',
    }
  }

  // ── Missing critical SMB types ────────────────────────────────────────────
  if (analysis.missingSMBTypes.length > 0) {
    const missingFieldMessages = Object.entries(analysis.missingFields)
      .map(([type, fields]) => `${type} missing: ${fields.join(', ')}`)

    const status: CheckResult['status'] =
      analysis.presentSMBTypes.length === 0 ? 'fail' : 'warn'

    const messageParts: string[] = []
    if (analysis.presentSMBTypes.length > 0) {
      messageParts.push(`Present: ${analysis.presentSMBTypes.join(', ')}`)
    }
    messageParts.push(`Missing SMB types: ${analysis.missingSMBTypes.join(', ')}`)
    if (missingFieldMessages.length > 0) {
      messageParts.push(`Field gaps — ${missingFieldMessages.join('; ')}`)
    }

    return {
      id: 'schema-markup',
      label: 'Schema Markup',
      status,
      weight: 17,
      message: messageParts.join(' · '),
      fix: `Add missing schema types: ${analysis.missingSMBTypes.join(', ')}. Ensure each block includes: name, address (LocalBusiness), url, and description fields.`,
    }
  }

  // ── All SMB types present — check field completeness ────────────────────
  const fieldIssues = Object.entries(analysis.missingFields)
  if (fieldIssues.length > 0) {
    const fieldDetails = fieldIssues
      .map(([type, fields]) => `${type} missing: ${fields.join(', ')}`)
      .join('; ')

    return {
      id: 'schema-markup',
      label: 'Schema Markup',
      status: 'warn',
      weight: 17,
      message: `All SMB schema types present but incomplete — ${fieldDetails}`,
      fix: `Fill in missing fields to maximise AI citation potential: ${fieldDetails}`,
    }
  }

  // ── Perfect ──────────────────────────────────────────────────────────────
  const malformedNote = analysis.malformedBlocks > 0
    ? ` (${analysis.malformedBlocks} malformed block(s) skipped)`
    : ''

  return {
    id: 'schema-markup',
    label: 'Schema Markup',
    status: 'pass',
    weight: 17,
    message: `Complete SMB schema markup found: ${analysis.presentSMBTypes.join(', ')}${malformedNote}`,
  }
}
