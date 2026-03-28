'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AuditResult } from '@/lib/auditor'
import { geoOptimizationUrl } from '@/lib/site'
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: '#FF4D00', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const visibleChecks = unlocked ? result.checks : result.checks.slice(0, FREE_CHECK_LIMIT)
  const hiddenChecks = unlocked ? [] : result.checks.slice(FREE_CHECK_LIMIT)

  const passCount = result.checks.filter(c => c.status === 'pass').length
  const failCount = result.checks.filter(c => c.status === 'fail').length
  const warnCount = result.checks.filter(c => c.status === 'warn').length

  return (
    <main className="min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* Nav */}
      <nav
        className="px-6 py-4 sticky top-0 z-10"
        style={{
          background: 'rgba(10,10,10,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium transition-colors flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            ← Audit Another Site
          </Link>
          <a
            href={geoOptimizationUrl()}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            style={{ background: '#FF4D00', color: '#fff' }}
          >
            Fix My Site →
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Score header */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <p className="text-sm mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            GEO Readiness Score for
          </p>
          <p className="font-semibold mb-6 truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {result.url}
          </p>

          <div className="flex justify-center mb-6">
            <ScoreGauge score={result.score} size={220} />
          </div>

          <p className="text-sm max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {result.summary}
          </p>

          {/* Quick stats */}
          <div
            className="flex justify-center gap-6 mt-6 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{passCount}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Passing</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400">{warnCount}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-400">{failCount}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Failing</div>
            </div>
          </div>
        </div>

        {/* Checks */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#fff' }}>Audit Results</h2>
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
          <div
            className="rounded-2xl p-8 text-white text-center"
            style={{
              background: 'linear-gradient(135deg, #FF4D00 0%, #cc3d00 100%)',
            }}
          >
            <h3 className="text-xl font-bold mb-3 font-heading">Want us to fix this for you?</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Our GEO Optimization service implements every fix above plus advanced AI
              visibility improvements your competitors haven&apos;t discovered yet.
            </p>
            <a
              href={geoOptimizationUrl()}
              className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors"
              style={{ background: '#fff', color: '#FF4D00' }}
            >
              Get a Free GEO Consultation →
            </a>
          </div>
        )}

        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Audited at {new Date(result.fetchedAt).toLocaleString()} ·{' '}
          <Link href="/" className="underline" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Run another audit
          </Link>
        </p>
      </div>
    </main>
  )
}
