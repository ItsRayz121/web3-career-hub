import { NextRequest, NextResponse } from 'next/server'
import { getAllJobs, JOB_SOURCE_COUNT } from '@/lib/jobs'

// Hit by a Vercel Cron Job (see vercel.json) once every 24h. This forces an
// actual network fetch of every job source, warming Next.js's fetch data
// cache — otherwise a source with a >24h-old cache entry would only ever
// refresh on the next real visitor request, which may not come for a while
// on a low-traffic site. Visitors then just get served the warm cache.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const startedAt = Date.now()
  const jobs = await getAllJobs()

  return NextResponse.json({
    ok: true,
    sourcesConfigured: JOB_SOURCE_COUNT,
    jobsFetched: jobs.length,
    durationMs: Date.now() - startedAt,
    refreshedAt: new Date().toISOString(),
  })
}
