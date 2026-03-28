import type { CheerioAPI } from 'cheerio'
import type { CheckResult } from './auditor'

// ---------------------------------------------------------------------------
// 1. Heading Hierarchy
// ---------------------------------------------------------------------------

/**
 * Checks:
 *  - Exactly one H1
 *  - At least two H2 sections
 *  - H3s only appear after an H2 (no skipped levels)
 *  - No H4+ without an H3 parent (skipped levels)
 */
export function checkHeadingHierarchy($: CheerioAPI): CheckResult {
  const headings: { tag: number; text: string }[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = parseInt((el as { tagName: string }).tagName.slice(1), 10)
    const text = $(el).text().trim().slice(0, 60)
    headings.push({ tag, text })
  })

  const h1Count = headings.filter(h => h.tag === 1).length
  const h2Count = headings.filter(h => h.tag === 2).length

  const issues: string[] = []

  // H1 check
  if (h1Count === 0) issues.push('no H1 found — AI cannot determine primary topic')
  else if (h1Count > 1) issues.push(`${h1Count} H1 tags found — only one allowed`)

  // H2 check
  if (h2Count < 2) issues.push(`only ${h2Count} H2 section(s) — add at least 2 for content structure`)

  // Skipped-level check: walk the heading sequence
  const skippedLevels: string[] = []
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].tag
    const curr = headings[i].tag
    if (curr > prev + 1) {
      skippedLevels.push(`H${prev}→H${curr}`)
    }
  }
  if (skippedLevels.length > 0) {
    issues.push(`skipped heading level(s): ${skippedLevels.join(', ')}`)
  }

  const status: CheckResult['status'] =
    issues.length === 0 ? 'pass'
    : h1Count === 0 ? 'fail'
    : 'warn'

  return {
    id: 'heading-hierarchy',
    label: 'Heading Hierarchy',
    status,
    weight: 15,
    message:
      issues.length === 0
        ? `Correct heading structure: 1 H1 + ${h2Count} H2 sub-sections`
        : `Heading issues: ${issues.join('; ')}`,
    fix:
      issues.length > 0
        ? 'Use exactly one H1, at least two H2s, and never skip heading levels (H2→H4). AI uses heading structure to map your content.'
        : undefined,
  }
}

// ---------------------------------------------------------------------------
// 2. FAQ / Q&A Content
// ---------------------------------------------------------------------------

interface FAQPair {
  question: string
  answer: string
}

/**
 * Inspects:
 *  - FAQPage JSON-LD (Question/acceptedAnswer pairs)
 *  - <details>/<summary> accordion patterns with non-empty answer text
 *  - Elements with class/id containing "faq" that have visible Q→A structure
 */
function extractFAQPairs($: CheerioAPI): FAQPair[] {
  const pairs: FAQPair[] = []

  // ── JSON-LD FAQPage ──────────────────────────────────────────────────────
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() ?? ''
      const parsed = JSON.parse(raw)
      const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        if (
          item &&
          typeof item === 'object' &&
          (item as Record<string, unknown>)['@type'] === 'FAQPage'
        ) {
          const entities = (item as Record<string, unknown>)['mainEntity']
          if (Array.isArray(entities)) {
            for (const q of entities) {
              const qObj = q as Record<string, unknown>
              const question = String(qObj['name'] ?? '').trim()
              const answerObj = qObj['acceptedAnswer'] as Record<string, unknown> | undefined
              const answer = String(answerObj?.['text'] ?? '').trim()
              if (question && answer) pairs.push({ question, answer })
            }
          }
        }
      }
    } catch {
      // malformed JSON-LD — skip
    }
  })

  // ── <details>/<summary> ────────────────────────────────────────────────
  $('details').each((_, details) => {
    const summary = $(details).find('summary').first()
    const question = summary.text().trim()
    // Answer = all text content of <details> minus the <summary>
    summary.remove()
    const answer = $(details).text().trim()
    if (question && answer.length > 20) {
      pairs.push({ question, answer: answer.slice(0, 200) })
    }
  })

  // ── Class/ID-based FAQ containers ────────────────────────────────────────
  $('[class*="faq" i], [id*="faq" i]').each((_, container) => {
    const $c = $(container)
    // Look for child elements that could be question/answer pairs
    const children = $c.children().toArray()
    for (let i = 0; i < children.length - 1; i++) {
      const questionText = $(children[i]).text().trim()
      const answerText = $(children[i + 1]).text().trim()
      const looksLikeQ =
        questionText.endsWith('?') ||
        /^(what|how|why|when|where|who|can|does|is|are|will|do)\b/i.test(questionText)
      if (looksLikeQ && answerText.length > 20) {
        pairs.push({ question: questionText, answer: answerText.slice(0, 200) })
        i++ // skip the answer element on next iteration
      }
    }
  })

  return pairs
}

export function checkFAQContent($: CheerioAPI): CheckResult {
  const pairs = extractFAQPairs($)
  const count = pairs.length

  if (count === 0) {
    return {
      id: 'faq-content',
      label: 'FAQ / Q&A Content',
      status: 'warn',
      weight: 15,
      message: 'No Q&A structures detected (JSON-LD FAQPage, <details>/<summary>, or FAQ containers)',
      fix: 'Add 3–5 Q&A pairs per service page using FAQPage schema + <details>/<summary> HTML. AI assistants use Q&A content for direct answers.',
    }
  }

  const status: CheckResult['status'] = count >= 5 ? 'pass' : count >= 3 ? 'warn' : 'warn'

  return {
    id: 'faq-content',
    label: 'FAQ / Q&A Content',
    status,
    weight: 15,
    message:
      count >= 5
        ? `Strong Q&A content: ${count} question/answer pair(s) detected`
        : `Partial Q&A content: ${count} pair(s) found — aim for 5+ per page`,
    fix:
      count < 5
        ? `Add ${5 - count} more Q&A pair(s). Target the exact questions users ask your business (use Google Search Console "Queries" for ideas).`
        : undefined,
  }
}

// ---------------------------------------------------------------------------
// 3. Paragraph Length / Content Density
// ---------------------------------------------------------------------------

/**
 * AI models (GPT-4, Claude, Perplexity) parse and cite individual paragraphs.
 * Optimal paragraph length for citation is 150–300 characters.
 *
 * Checks:
 *  - Blocks that are too short (<80 chars) — shallow, low signal
 *  - Blocks that are too long (>400 chars) — AI may truncate or skip
 *  - Distribution within the 150–300 char "sweet spot"
 */
export function checkParagraphLength($: CheerioAPI): CheckResult {
  const paragraphs: string[] = []

  $('p').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text.length > 30) paragraphs.push(text) // ignore trivial <p> tags
  })

  if (paragraphs.length === 0) {
    return {
      id: 'paragraph-length',
      label: 'Paragraph Length & Density',
      status: 'warn',
      weight: 10,
      message: 'No substantial paragraph content found — AI cannot extract citable snippets',
      fix: 'Structure your main content in <p> tags. Aim for 150–300 characters per paragraph for AI citation.',
    }
  }

  const tooShort = paragraphs.filter(p => p.length < 80).length
  const tooLong = paragraphs.filter(p => p.length > 400).length
  const ideal = paragraphs.filter(p => p.length >= 150 && p.length <= 300).length
  const total = paragraphs.length
  const idealPct = Math.round((ideal / total) * 100)

  const issues: string[] = []
  if (tooShort > 0) issues.push(`${tooShort} paragraph(s) under 80 chars (too brief to cite)`)
  if (tooLong > 0) issues.push(`${tooLong} paragraph(s) over 400 chars (may be truncated by AI)`)

  const status: CheckResult['status'] =
    issues.length === 0 && idealPct >= 50 ? 'pass'
    : issues.length === 0 || idealPct >= 30 ? 'warn'
    : 'fail'

  return {
    id: 'paragraph-length',
    label: 'Paragraph Length & Density',
    status,
    weight: 10,
    message:
      issues.length === 0
        ? `${total} paragraphs — ${idealPct}% in the AI-optimal 150–300 char range`
        : `${total} paragraphs — ${idealPct}% optimal; issues: ${issues.join('; ')}`,
    fix:
      issues.length > 0
        ? 'Break long paragraphs into 150–300 character chunks. Combine or expand very short paragraphs into complete thoughts.'
        : undefined,
  }
}

// ---------------------------------------------------------------------------
// 4. Definition Patterns
// ---------------------------------------------------------------------------

/**
 * AI assistants are trained to recognise and cite definitional content.
 * Checks for:
 *  - <dfn> elements
 *  - Textual patterns: "is defined as", "means that", "refers to", "is known as"
 *  - "X is a Y that…" sentence openers
 */
export function checkDefinitionPatterns($: CheerioAPI): CheckResult {
  const signals: string[] = []
  let definitionCount = 0

  // <dfn> elements
  const dfnCount = $('dfn').length
  if (dfnCount > 0) {
    signals.push(`${dfnCount} <dfn> element(s)`)
    definitionCount += dfnCount
  }

  // Textual patterns in paragraph and heading text
  const DEFINITION_PATTERNS = [
    /\bis defined as\b/i,
    /\bmeans that\b/i,
    /\brefers to\b/i,
    /\bis known as\b/i,
    /\bis a type of\b/i,
    /\bis an? \w+ that\b/i,
    /\btermed? ["']?\w/i,
    /\bin other words\b/i,
    /\bsimply put,?\b/i,
  ]

  const textNodes = $('p, li, h2, h3').toArray()
  const matchedPatterns = new Set<string>()

  for (const el of textNodes) {
    const text = $(el).text()
    for (const pattern of DEFINITION_PATTERNS) {
      if (pattern.test(text)) {
        const key = pattern.source.replace(/\\b|\\?/g, '').replace(/\(.*?\)/g, '').trim()
        matchedPatterns.add(key)
        definitionCount++
        break // count one match per element max
      }
    }
  }

  if (matchedPatterns.size > 0) {
    signals.push(`definition phrases: "${[...matchedPatterns].slice(0, 3).join('", "')}"`)
  }

  const status: CheckResult['status'] =
    definitionCount >= 5 ? 'pass'
    : definitionCount >= 2 ? 'warn'
    : 'fail'

  return {
    id: 'definition-patterns',
    label: 'Definition & Clarity Patterns',
    status,
    weight: 10,
    message:
      definitionCount >= 2
        ? `${definitionCount} definition signal(s) found: ${signals.join(', ')}`
        : 'No definition patterns detected — AI models struggle to extract clear answers',
    fix:
      definitionCount < 5
        ? 'Add explicit definitions using <dfn> tags or phrases like "X is defined as…", "refers to…", or "means that…". These anchor phrases help AI extract factual answers about your services.'
        : undefined,
  }
}

// ---------------------------------------------------------------------------
// 5. E-E-A-T Signals (unchanged from starter, kept for compatibility)
// ---------------------------------------------------------------------------

export function checkEEAT($: CheerioAPI): CheckResult {
  const signals: string[] = []

  if ($('[class*="author" i], [rel="author"], [itemprop="author"]').length > 0)
    signals.push('author attribution')
  if ($('a[href*="/about"]').length > 0) signals.push('about page link')
  if ($('a[href*="/contact"]').length > 0) signals.push('contact page link')

  const canonicalHref = $('link[rel="canonical"]').attr('href') ?? ''
  let ownHost = ''
  try { ownHost = new URL(canonicalHref).hostname } catch { /* ignore */ }

  const externalLinks = $('a[href^="http"]').filter((_, el) => {
    const href = $(el).attr('href') ?? ''
    try {
      return ownHost ? new URL(href).hostname !== ownHost : true
    } catch { return false }
  }).length

  if (externalLinks >= 2) signals.push(`${externalLinks} external citations`)
  if ($('a[href*="privacy"]').length > 0) signals.push('privacy policy')

  const count = signals.length
  return {
    id: 'eeat-signals',
    label: 'E-E-A-T Signals',
    status: count >= 3 ? 'pass' : count >= 1 ? 'warn' : 'fail',
    weight: 15,
    message:
      count >= 3
        ? `Strong E-E-A-T signals: ${signals.join(', ')}`
        : count >= 1
        ? `Partial E-E-A-T signals: ${signals.join(', ')}`
        : 'No E-E-A-T signals detected',
    fix:
      count < 3
        ? 'Add author pages, a visible About section, external citations, and contact info'
        : undefined,
  }
}

// ---------------------------------------------------------------------------
// 6. Meta Tags & Canonical (unchanged from starter, kept for compatibility)
// ---------------------------------------------------------------------------

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

  const status: CheckResult['status'] =
    issues.length === 0 ? 'pass' : issues.length <= 1 ? 'warn' : 'fail'

  return {
    id: 'meta-tags',
    label: 'Meta Tags & Canonical',
    status,
    weight: 10,
    message:
      issues.length === 0
        ? `All meta tags present: ${good.join(', ')}`
        : `Issues: ${issues.join('; ')}`,
    fix:
      issues.length > 0
        ? 'Ensure every page has a unique 30–70 char title, 100–160 char meta description, and a canonical URL'
        : undefined,
  }
}
