import type { CheckResult } from './auditor'

export function calculateScore(checks: CheckResult[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight === 0) return 0
  const earned = checks.reduce((sum, c) => {
    if (c.status === 'pass') return sum + c.weight
    if (c.status === 'warn') return sum + c.weight * 0.5
    return sum
  }, 0)
  return Math.round((earned / totalWeight) * 100)
}

export function buildSummary(score: number): string {
  if (score >= 80) return 'Excellent GEO readiness — your site is well-positioned for AI visibility.'
  if (score >= 60) return 'Good foundation, but key gaps are limiting your AI visibility.'
  if (score >= 40) return 'Moderate GEO readiness — significant improvements needed to appear in AI results.'
  return 'Critical issues found — your site is largely invisible to AI assistants and search engines.'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green
  if (score >= 60) return '#f59e0b' // amber
  if (score >= 40) return '#f97316' // orange
  return '#ef4444' // red
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Critical'
}
