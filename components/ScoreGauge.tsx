'use client'

import { useEffect, useRef } from 'react'
import { getScoreColor, getScoreLabel } from '@/lib/scoring'

interface ScoreGaugeProps {
  score: number
  size?: number
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const progressRef = useRef<SVGCircleElement>(null)

  const radius = (size / 2) * 0.7
  const circumference = 2 * Math.PI * radius
  // Only fill the top 270° of the circle (bottom gap)
  const arcLength = circumference * 0.75
  const offset = arcLength - (score / 100) * arcLength

  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  useEffect(() => {
    const el = progressRef.current
    if (!el) return
    el.style.strokeDashoffset = String(arcLength) // start empty
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.strokeDashoffset = String(offset)
    })
    return () => cancelAnimationFrame(raf)
  }, [score, arcLength, offset])

  const center = size / 2
  const rotation = 135 // start from bottom-left

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`GEO Readiness Score: ${score} out of 100 — ${label}`}
        role="img"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={size * 0.07}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
        />
        {/* Progress arc */}
        <circle
          ref={progressRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={arcLength}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
        />
        {/* Score number */}
        <text
          x={center}
          y={center - size * 0.03}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
        {/* "/100" label */}
        <text
          x={center}
          y={center + size * 0.14}
          textAnchor="middle"
          fontSize={size * 0.09}
          fill="#9ca3af"
        >
          / 100
        </text>
      </svg>
      <span
        className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{ background: `${color}22`, color }}
      >
        {label}
      </span>
    </div>
  )
}
