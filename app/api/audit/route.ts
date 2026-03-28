import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runAudit } from '@/lib/auditor'

const RequestSchema = z.object({
  url: z
    .string()
    .url('Please enter a valid URL')
    .refine(
      val => val.startsWith('http://') || val.startsWith('https://'),
      'URL must start with http:// or https://'
    ),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }

    const { url } = parsed.data
    const result = await runAudit(url)

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Audit failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
