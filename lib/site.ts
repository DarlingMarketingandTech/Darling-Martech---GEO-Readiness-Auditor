/**
 * Canonical public origin for this app (no trailing slash).
 * Set NEXT_PUBLIC_BASE_URL in Vercel / .env when the deployment URL changes.
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://darling-martech.vercel.app'
).replace(/\/$/, '')

/** Hostname only, for visible labels (e.g. footer, OG badge). */
export const SITE_HOSTNAME = new URL(SITE_ORIGIN).hostname

export const GEO_OPTIMIZATION_PATH = '/services/website-ux/geo-optimization'

export const geoOptimizationUrl = () => `${SITE_ORIGIN}${GEO_OPTIMIZATION_PATH}`
