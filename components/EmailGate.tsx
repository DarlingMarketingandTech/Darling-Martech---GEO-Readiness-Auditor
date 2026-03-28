'use client'

import { useState } from 'react'
import type { AuditResult } from '@/lib/auditor'

interface EmailGateProps {
  result: AuditResult
  onUnlocked: () => void
}

export default function EmailGate({ result, onUnlocked }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          url: result.url,
          score: result.score,
          checks: result.checks,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send report. Please try again.')
        return
      }

      setSent(true)
      onUnlocked()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900">Full report sent!</p>
        <p className="text-sm text-gray-500 mt-1">Check your inbox for the complete fix roadmap.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Unlock Your Full Fix Roadmap</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Enter your email to get the complete prioritized report — including every fix needed to appear in ChatGPT, Perplexity, and Claude.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-blue-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 bg-white"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors duration-150 text-sm whitespace-nowrap"
        >
          {loading ? 'Sending…' : 'Get Full Report →'}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-400">No spam — just your report. Unsubscribe anytime.</p>
    </div>
  )
}
