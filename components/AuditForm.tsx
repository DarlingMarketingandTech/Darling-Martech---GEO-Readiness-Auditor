'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuditForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function normalizeUrl(input: string): string {
    const trimmed = input.trim()
    if (!trimmed) return trimmed
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    return `https://${trimmed}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const normalized = normalizeUrl(url)
    if (!normalized) {
      setError('Please enter your website URL')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Audit failed. Please try again.')
        return
      }

      // Store result in sessionStorage then redirect to results page
      sessionStorage.setItem('auditResult', JSON.stringify(data))
      router.push('/results')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="yourdomain.com"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:opacity-50"
          aria-label="Website URL"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors duration-150 whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Auditing…
            </span>
          ) : (
            'Audit My Site →'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
