'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { AuditResult } from '@/lib/auditor'

interface AuditFormProps {
  onResult?: (result: AuditResult) => void
  onError?: (error: string) => void
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function validateUrl(input: string): boolean {
  try {
    const u = new URL(input)
    return u.hostname.includes('.')
  } catch {
    return false
  }
}

/** Demo URL shown when the user clicks "Try with example domain" */
const DEMO_URL = 'https://darlingmartech.com'

export default function AuditForm({ onResult, onError }: AuditFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runAuditFor(target: string) {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data.error ?? 'Audit failed. Please try again.'
        setError(msg)
        onError?.(msg)
        return
      }

      if (onResult) {
        onResult(data as AuditResult)
      } else {
        sessionStorage.setItem('auditResult', JSON.stringify(data))
        router.push('/results')
      }
    } catch {
      const msg = 'Network error. Please check your connection and try again.'
      setError(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDemo() {
    setUrl(DEMO_URL)
    await runAuditFor(DEMO_URL)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const normalized = normalizeUrl(url)
    if (!normalized) {
      const msg = 'Please enter your website URL'
      setError(msg)
      onError?.(msg)
      return
    }
    if (!validateUrl(normalized)) {
      const msg = 'Please enter a valid domain (e.g. example.com)'
      setError(msg)
      onError?.(msg)
      return
    }
    await runAuditFor(normalized)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto" noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="audit-url" className="sr-only">
          Website URL
        </label>
        <input
          id="audit-url"
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="yourdomain.com"
          disabled={loading}
          autoComplete="url"
          className="flex-1 px-4 py-3 rounded-xl text-base disabled:opacity-50 focus:outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
          }}
          onFocus={e => {
            e.currentTarget.style.border = '1px solid #FF4D00'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,77,0,0.15)'
          }}
          onBlur={e => {
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          aria-describedby={error ? 'audit-form-error' : undefined}
          aria-invalid={!!error}
        />
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.03 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="px-6 py-3 rounded-xl font-semibold text-white whitespace-nowrap disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2"
          style={{ background: '#FF4D00' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <motion.svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </motion.svg>
              Auditing…
            </span>
          ) : (
            'Audit My Site →'
          )}
        </motion.button>
      </div>

      <div aria-live="assertive" aria-atomic="true">
        <AnimatePresence>
          {error && (
            <motion.p
              id="audit-form-error"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Demo shortcut */}
      <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Not sure what to enter?{' '}
        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="underline underline-offset-2 transition-colors disabled:opacity-40"
          style={{ color: 'rgba(255,77,0,0.8)' }}
        >
          Try with darlingmartech.com →
        </button>
      </p>
    </form>
  )
}
