'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AuditResult } from '@/lib/auditor'

interface EmailGateProps {
  result: AuditResult
  onUnlocked: () => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function EmailGate({ result, onUnlocked }: EmailGateProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), auditData: result }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Failed to send report. Please try again.')
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

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        border: '1px solid rgba(255,77,0,0.25)',
        background: 'rgba(255,77,0,0.06)',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="text-center py-4"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: '#22c55e' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p className="font-semibold text-white">Report sent to {email}, {name}.</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Check your inbox for the complete fix roadmap.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#FF4D00' }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3
                  className="font-semibold font-heading"
                  style={{ color: '#fff' }}
                >
                  Unlock full report
                </h3>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Enter your email to get the complete prioritized report — including every fix needed to appear in ChatGPT, Perplexity, and Claude.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3"
              noValidate
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="name-gate-input" className="sr-only">
                  Full name
                </label>
                <input
                  id="name-gate-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={loading}
                  autoComplete="name"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 focus:outline-none transition-all"
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
                  aria-describedby={error ? 'email-gate-error' : undefined}
                  aria-invalid={!!error}
                />
                <label htmlFor="email-gate-input" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-gate-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  disabled={loading}
                  autoComplete="email"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 focus:outline-none transition-all"
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
                  aria-describedby={error ? 'email-gate-error' : undefined}
                  aria-invalid={!!error}
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.03 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm whitespace-nowrap disabled:opacity-60 focus:outline-none focus-visible:ring-2"
                style={{ background: '#FF4D00' }}
              >
                {loading ? 'Sending…' : 'Get Full Report →'}
              </motion.button>
            </form>

            <div aria-live="assertive" aria-atomic="true">
              <AnimatePresence>
                {error && (
                  <motion.p
                    id="email-gate-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              We&apos;ll never spam you. Unsubscribe anytime.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
