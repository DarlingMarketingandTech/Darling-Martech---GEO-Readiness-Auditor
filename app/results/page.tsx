'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AuditResult } from '@/lib/auditor'
import ScoreGauge from '@/components/ScoreGauge'
import CheckItem from '@/components/CheckItem'
import EmailGate from '@/components/EmailGate'

const FREE_CHECK_LIMIT = 3

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<AuditResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('auditResult')
    if (!stored) {
      router.replace('/')
      return
    }
    try {
      setResult(JSON.parse(stored))
    } catch {
      router.replace('/')
    }
  }, [router])

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const visibleChecks = unlocked ? result.checks : result.checks.slice(0, FREE_CHECK_LIMIT)
  const hiddenChecks = unlocked ? [] : result.checks.slice(FREE_CHECK_LIMIT)

  const passCount = result.checks.filter(c => c.status === 'pass').length
  const failCount = result.checks.filter(c => c.status === 'fail').length
  const warnCount = result.checks.filter(c => c.status === 'warn').length

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← Audit Another Site
          </Link>
          <a
            href="https://darlingmartech.com/services/website-ux/geo-optimization"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Fix My Site →
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Score header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 mb-1 font-medium">GEO Readiness Score for</p>
          <p className="text-gray-700 font-semibold mb-6 truncate">{result.url}</p>

          <div className="flex justify-center mb-6">
            <ScoreGauge score={result.score} size={220} />
          </div>

          <p className="text-gray-600 text-sm max-w-md mx-auto">{result.summary}</p>

          {/* Quick stats */}
          <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{passCount}</div>
              <div className="text-xs text-gray-400">Passing</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-500">{warnCount}</div>
              <div className="text-xs text-gray-400">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-500">{failCount}</div>
              <div className="text-xs text-gray-400">Failing</div>
            </div>
          </div>
        </div>

        {/* Checks */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Results</h2>
          <div className="space-y-3">
            {visibleChecks.map(check => (
              <CheckItem key={check.id} check={check} />
            ))}
          </div>
        </div>

        {/* Gated checks */}
        {!unlocked && hiddenChecks.length > 0 && (
          <div className="space-y-3">
            {hiddenChecks.map(check => (
              <CheckItem key={check.id} check={check} blurred />
            ))}

            <div className="mt-2">
              <EmailGate result={result} onUnlocked={() => setUnlocked(true)} />
            </div>
          </div>
        )}

        {/* CTA */}
        {unlocked && (
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white text-center">
            <h3 className="text-xl font-bold mb-3">Want us to fix this for you?</h3>
            <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
              Our GEO Optimization service implements every fix above plus advanced AI
              visibility improvements your competitors haven&apos;t discovered yet.
            </p>
            <a
              href="https://darlingmartech.com/services/website-ux/geo-optimization"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Get a Free GEO Consultation →
            </a>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Audited at {new Date(result.fetchedAt).toLocaleString()} ·{' '}
          <Link href="/" className="underline hover:text-gray-600">
            Run another audit
          </Link>
        </p>
      </div>
    </main>
  )
}
