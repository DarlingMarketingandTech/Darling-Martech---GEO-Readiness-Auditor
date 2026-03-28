'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CheckResult } from '@/lib/auditor'

interface CheckItemProps {
  check: CheckResult
  blurred?: boolean
}

const icons = {
  pass: (
    <svg
      className="w-5 h-5 shrink-0"
      style={{ color: '#22c55e' }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  warn: (
    <svg
      className="w-5 h-5 shrink-0"
      style={{ color: '#f59e0b' }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  ),
  fail: (
    <svg
      className="w-5 h-5 shrink-0"
      style={{ color: '#ef4444' }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

const borderColors = {
  pass: 'rgba(34,197,94,0.2)',
  warn: 'rgba(245,158,11,0.2)',
  fail: 'rgba(239,68,68,0.2)',
}

const bgColors = {
  pass: 'rgba(34,197,94,0.06)',
  warn: 'rgba(245,158,11,0.06)',
  fail: 'rgba(239,68,68,0.06)',
}

const badgeColors = {
  pass: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  warn: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  fail: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

export default function CheckItem({ check, blurred = false }: CheckItemProps) {
  const [open, setOpen] = useState(false)
  const hasfix = !!check.fix
  const badge = badgeColors[check.status]

  return (
    <div
      className={`rounded-xl border p-4 transition-colors${blurred ? ' select-none' : ''}`}
      style={{
        border: `1px solid ${borderColors[check.status]}`,
        background: bgColors[check.status],
      }}
    >
      <div className={blurred ? 'blur-sm pointer-events-none' : ''}>
        <div className="flex items-start gap-3">
          {icons[check.status]}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm" style={{ color: '#fff' }}>
                {check.label}
              </span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: badge.bg, color: badge.color }}
              >
                {check.status.toUpperCase()}
              </span>
              <span
                className="text-xs ml-auto"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {check.weight}pts
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {check.message}
            </p>

            {hasfix && (
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-medium focus:outline-none focus-visible:underline"
                style={{ color: '#FF4D00' }}
                aria-expanded={open}
                aria-controls={`fix-${check.id}`}
              >
                <motion.svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 2l4 4-4 4" />
                </motion.svg>
                {open ? 'Hide fix' : 'Show fix'}
              </button>
            )}

            <AnimatePresence initial={false}>
              {open && hasfix && (
                <motion.div
                  id={`fix-${check.id}`}
                  key="fix"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <p
                    className="mt-2 text-xs leading-relaxed rounded-lg px-3 py-2"
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="font-semibold" style={{ color: '#FF4D00' }}>
                      Fix:{' '}
                    </span>
                    {check.fix}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
