import AuditForm from '@/components/AuditForm'
import type { Metadata } from 'next'

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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a
            href="https://darlingmartech.com"
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            ← Darling Marketing &amp; Tech
          </a>
          <a
            href="https://darlingmartech.com/services/website-ux/geo-optimization"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            GEO Optimization Service
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Free GEO Audit Tool
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Is your site{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            visible to AI?
          </span>
        </h1>

        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
          Find out in 60 seconds. Get a 0–100 GEO Readiness Score with exactly
          what&apos;s blocking your site from appearing in ChatGPT, Perplexity,
          and Claude results.
        </p>

        <AuditForm />

        <p className="mt-4 text-xs text-slate-500">
          Free · No login required · Results in ~30 seconds
        </p>
      </section>

      {/* What We Check */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
          What we check
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHECKS_PREVIEW.map(item => (
            <div
              key={item.label}
              className="rounded-xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm"
            >
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-white text-sm mb-1">{item.label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / CTA strip */}
      <section className="border-t border-white/8 bg-white/2 px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-300 text-base mb-2">
            &ldquo;I built this tool to demonstrate exactly how I audit client sites before starting GEO work.&rdquo;
          </p>
          <p className="text-slate-500 text-sm mb-8">— Darling Marketing &amp; Tech</p>
          <a
            href="https://darlingmartech.com/services/website-ux/geo-optimization"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150"
          >
            Learn About Our GEO Optimization Service →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6 text-center">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Darling Marketing &amp; Tech ·{' '}
          <a
            href="https://darlingmartech.com"
            className="hover:text-slate-400 transition-colors"
          >
            darlingmartech.com
          </a>
        </p>
      </footer>
    </main>
  )
}
