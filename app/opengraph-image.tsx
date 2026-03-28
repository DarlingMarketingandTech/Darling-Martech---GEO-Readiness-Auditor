import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'GEO Readiness Auditor — Is Your Site Visible to AI?'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

/** Sample score shown in the OG image preview */
const SAMPLE_SCORE = 68

/** Radius of the score gauge circle (SVG user units) */
const GAUGE_RADIUS = 70

/** Full circumference of the gauge circle: 2πr */
const CIRCUMFERENCE = Math.round(2 * Math.PI * GAUGE_RADIUS)

/** SVG viewport size — coordinate space the gauge is drawn in */
const GAUGE_SIZE = 180

/** Map a 0–100 score to a stroke-dashoffset for the SVG arc */
function scoreToDashOffset(score: number): number {
  return CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent GEO Readiness'
  if (score >= 60) return 'Good Foundation'
  if (score >= 40) return 'Needs Improvement'
  return 'Critical Issues Found'
}

export default function Image() {
  const color = scoreColor(SAMPLE_SCORE)
  const label = scoreLabel(SAMPLE_SCORE)
  const dashOffset = scoreToDashOffset(SAMPLE_SCORE)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          }}
        />

        {/* Brand badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,77,0,0.12)',
            border: '1px solid rgba(255,77,0,0.3)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF4D00',
            }}
          />
          <span style={{ color: '#FF4D00', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
            FREE GEO AUDIT TOOL
          </span>
        </div>

        {/* Heading */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 16,
            maxWidth: 800,
          }}
        >
          Is Your Site{' '}
          <span style={{ color: '#FF4D00' }}>Visible to AI?</span>
        </div>

        <div
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 48,
          }}
        >
          Find out in 60 seconds — free GEO Readiness Score
        </div>

        {/* Score gauge preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 48,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: '32px 48px',
          }}
        >
          {/* SVG gauge */}
          <div style={{ display: 'flex', position: 'relative', width: GAUGE_SIZE, height: GAUGE_SIZE }}>
            <svg width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}>
              {/* Track */}
              <circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={GAUGE_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="12"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
              />
              {/* Fill */}
              <circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={GAUGE_RADIUS}
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
              />
              <text x={GAUGE_SIZE / 2} y={GAUGE_SIZE / 2 + 5} textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="800">
                {SAMPLE_SCORE}
              </text>
              <text x={GAUGE_SIZE / 2} y={GAUGE_SIZE / 2 + 25} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12">
                out of 100
              </text>
            </svg>
          </div>

          {/* Score breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'inline-flex',
                background: `${color}18`,
                border: `1px solid ${color}44`,
                borderRadius: 999,
                padding: '4px 14px',
                color,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
            {[
              { icon: '✅', text: 'AI Bot Permissions', pass: true },
              { icon: '⚠️', text: 'Schema Markup', pass: false },
              { icon: '✅', text: 'Heading Structure', pass: true },
              { icon: '❌', text: 'FAQ / Q&A Content', pass: false },
            ].map(item => (
              <div
                key={item.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Domain badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            color: 'rgba(255,255,255,0.25)',
            fontSize: 14,
          }}
        >
          geo.darlingmartech.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
