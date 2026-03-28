# GEO Readiness Auditor

> **"Is your site visible to AI? Find out in 60 seconds."**

A free SMB-focused GEO (Generative Engine Optimization) audit tool that scores your website's AI visibility and delivers a prioritized fix roadmap. Live at [geo.darlingmartech.com](https://geo.darlingmartech.com).

---

## What It Does

Users enter their domain. The tool checks:

| Check | Weight | What It Measures |
|---|---|---|
| 🤖 AI Bot Permissions | 20 pts | robots.txt allows GPTBot, ClaudeBot, PerplexityBot |
| 🗂️ Schema Markup | 20 pts | JSON-LD structured data presence & quality |
| 📐 Heading Hierarchy | 15 pts | H1→H2→H3 structure for machine readability |
| ❓ FAQ / Q&A Content | 15 pts | Q&A format AI assistants love |
| 🏅 E-E-A-T Signals | 15 pts | Author, About, citations, contact signals |
| 🏷️ Meta Tags | 10 pts | Title, description, canonical configured |

Returns a **0–100 GEO Readiness Score** with prioritized fixes. First 3 checks shown free; full report unlocked via email gate → leads directly to `/services/website-ux/geo-optimization`.

---

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Cheerio** — server-side HTML parsing
- **Zod** — request validation
- **Resend** — email gate / full report delivery
- **Vercel** — deployment target

---

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing: hero + domain input form
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── audit/route.ts    # Main audit endpoint — fetches + analyzes URL
│   │   └── capture/route.ts  # Email gate — sends full report via Resend
│   └── results/
│       └── page.tsx          # Score display + partial results + email gate
├── lib/
│   ├── auditor.ts            # Core audit orchestration
│   ├── schema-checker.ts     # Schema.org validation
│   ├── robots-checker.ts     # robots.txt AI bot permission parsing
│   ├── content-checker.ts    # Heading hierarchy + FAQ + E-E-A-T + meta tags
│   └── scoring.ts            # Weighted score calculation + labels
└── components/
    ├── AuditForm.tsx          # Domain input form with loading state
    ├── ScoreGauge.tsx         # Animated SVG 0–100 gauge
    ├── CheckItem.tsx          # Pass/warn/fail item with fix explanation
    └── EmailGate.tsx          # Email capture to unlock full report
```

---

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your keys — see Environment Variables below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes (email gate) | [Get from resend.com](https://resend.com) |
| `NEXT_PUBLIC_BASE_URL` | Yes (sitemap / OG) | e.g. `https://geo.darlingmartech.com` |
| `UPSTASH_REDIS_REST_URL` | Recommended | [Upstash Redis](https://upstash.com) REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash Redis REST token |

> **Tip:** `UPSTASH_REDIS_*` are required for persistent rate-limiting across serverless instances. Without them the tool falls back to an in-process store that resets on every cold start.

Copy `.env.example` to `.env.local` and fill in your values. `.env.local` is already git-ignored.

---

## Monetization Path

**Free tool → Email capture → GEO audit service ($2,500) → GEO optimization retainer ($1,500/mo)**

Every result page includes a "Want us to fix this?" CTA directly to `/services/website-ux/geo-optimization`.

---

## Deployment

Deploy to Vercel. Add the following environment variables in the Vercel dashboard:

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for email delivery |
| `NEXT_PUBLIC_BASE_URL` | `https://geo.darlingmartech.com` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
