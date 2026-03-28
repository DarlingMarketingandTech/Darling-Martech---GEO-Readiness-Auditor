import AuditForm from '@/components/AuditForm'
import type { Metadata } from 'next'
import { SITE_ORIGIN, SITE_HOSTNAME, geoOptimizationUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'GEO Readiness Auditor — Is Your Site Visible to AI?',
  description:
    'Free tool: find out in 60 seconds if your website appears in ChatGPT, Perplexity & Claude results. Get your GEO Readiness Score with prioritized fixes.',
}

const CHECKS_PREVIEW = [
  { icon: '🤖', label: 'AI Bot Permissions', desc: 'Can GPTBot, ClaudeBot & PerplexityBot crawl your site?' },
  { icon: '🗂️', label: 'Schema Markup', desc: 'Do AI models understand your content structure?' },
  { icon: '📐', label: 'Heading Hierarchy', desc: 'Is your H1→H2→H3 structure machine-readable?' },
  { icon: '❓', label: 'FAQ / Q&A Content', desc: 'Do you have the Q&A format AI assistants love?' },
  { icon: '🏅', label: 'E-E-A-T Signals', desc: 'Do you demonstrate expertise, authority & trustworthiness?' },
  { icon: '🏷️', label: 'Meta Tags', desc: 'Title, description & canonical all properly configured?' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a
            href={SITE_ORIGIN}
            className="text-sm font-semibold transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            ← Darling Marketing &amp; Tech
          </a>
          <a
            href={geoOptimizationUrl()}
            className="text-sm font-semibold transition-colors"
            style={{ color: '#FF4D00' }}
          >
            GEO Optimization Service
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border"
          style={{
            background: 'rgba(255,77,0,0.1)',
            borderColor: 'rgba(255,77,0,0.25)',
            color: '#FF4D00',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF4D00' }} />
          Free GEO Audit Tool
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 font-heading"
          style={{ color: '#ffffff' }}
        >
          Is Your Site{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #FF4D00 0%, #FF8C42 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Visible to AI?
          </span>{' '}
          Find Out in 60 Seconds
        </h1>

        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Free GEO readiness audit — checks schema, content structure, AI bot
          access, and E-E-A-T signals
        </p>

        <AuditForm />

        <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Free · No login required · Results in ~30 seconds
        </p>
      </section>

      {/* What We Check */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p
          className="text-center text-sm font-semibold uppercase tracking-widest mb-8"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          What we check
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHECKS_PREVIEW.map(item => (
            <div
              key={item.label}
              className="rounded-xl p-5 backdrop-blur-sm"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#fff' }}>{item.label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / CTA strip */}
      <section
        className="px-6 py-12"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-base mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
            &ldquo;I built this tool to demonstrate exactly how I audit client sites before starting GEO work.&rdquo;
          </p>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>— Darling Marketing &amp; Tech</p>
          <a
            href={geoOptimizationUrl()}
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-colors duration-150"
            style={{ background: '#FF4D00', color: '#fff' }}
          >
            Learn About Our GEO Optimization Service →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-6 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} Darling Marketing &amp; Tech ·{' '}
          <a
            href={SITE_ORIGIN}
            className="transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {SITE_HOSTNAME}
          </a>
        </p>
      </footer>
    </main>
  )
}
