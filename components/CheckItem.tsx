import type { CheckResult } from '@/lib/auditor'

interface CheckItemProps {
  check: CheckResult
  blurred?: boolean
}

const icons = {
  pass: (
    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  warn: (
    <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  fail: (
    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

const bgColors = {
  pass: 'bg-green-50 border-green-100',
  warn: 'bg-amber-50 border-amber-100',
  fail: 'bg-red-50 border-red-100',
}

const badgeColors = {
  pass: 'bg-green-100 text-green-700',
  warn: 'bg-amber-100 text-amber-700',
  fail: 'bg-red-100 text-red-700',
}

export default function CheckItem({ check, blurred = false }: CheckItemProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${bgColors[check.status]} ${blurred ? 'select-none' : ''}`}
    >
      <div className={`${blurred ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="flex items-start gap-3">
          {icons[check.status]}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-sm">{check.label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[check.status]}`}>
                {check.status.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{check.weight}pts</span>
            </div>
            <p className="text-sm text-gray-600">{check.message}</p>
            {check.fix && (
              <p className="mt-1.5 text-xs text-gray-500 flex gap-1.5 items-start">
                <span className="font-medium text-gray-700 shrink-0">Fix:</span>
                {check.fix}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
