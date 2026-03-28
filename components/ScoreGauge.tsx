'use client'

import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

interface ScoreGaugeProps {
  score: number
  size?: number
}

function getGaugeColor(score: number): string {
  if (score >= 71) return '#22c55e' // green
  if (score >= 41) return '#FF4D00' // electric orange
  return '#ef4444'                  // red
}

function getGaugeLabel(score: number): string {
  if (score >= 71) return 'AI-Ready'
  if (score >= 41) return 'Getting There'
  return 'Needs Work'
}

export default function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [animatedOffset, setAnimatedOffset] = useState(0)

  const radius = (size / 2) * 0.7
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75

  const color = getGaugeColor(score)
  const label = getGaugeLabel(score)
  const center = size / 2
  const rotation = 135

  useEffect(() => {
    setAnimatedOffset(arcLength)
    setDisplayScore(0)

    const controls = animate(0, score, {
      duration: 1.3,
      ease: [0.4, 0, 0.2, 1],
      onUpdate(v) {
        setDisplayScore(Math.round(v))
        setAnimatedOffset(arcLength - (v / 100) * arcLength)
      },
    })

    return () => controls.stop()
    // arcLength is derived from `size` which doesn't change at runtime; safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score])

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
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={size * 0.07}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
          style={{ filter: `drop-shadow(0 0 ${size * 0.04}px ${color}66)` }}
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
          fontFamily="'Cabinet Grotesk', system-ui, sans-serif"
        >
          {displayScore}
        </text>
        {/* "/100" label */}
        <text
          x={center}
          y={center + size * 0.14}
          textAnchor="middle"
          fontSize={size * 0.09}
          fill="rgba(255,255,255,0.3)"
        >
          / 100
        </text>
      </svg>

      <span
        className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{
          background: `${color}22`,
          color,
          border: `1px solid ${color}44`,
        }}
      >
        {label}
      </span>

      {/* Invisible target for final value (used by aria) */}
      <span className="sr-only">{score} out of 100 — {label}</span>
    </div>
  )
}
