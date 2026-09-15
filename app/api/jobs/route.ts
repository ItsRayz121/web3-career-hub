import { NextRequest, NextResponse } from 'next/server'
import { getAllJobs, type JobItem } from '@/lib/jobs'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('sector') || 'all'
  const keyword = searchParams.get('keyword') || ''

  let jobs: JobItem[] = await getAllJobs()

  if (filter === 'telegram') {
    jobs = jobs.filter(j => j.source.startsWith('Telegram'))
  } else if (filter === 'freelance') {
    jobs = jobs.filter(j => j.work_type === 'freelance')
  } else if (filter === 'pakistan') {
    jobs = jobs.filter(j => j.location.toLowerCase().includes('pakistan'))
  } else if (filter === 'hybrid') {
    jobs = jobs.filter(j => j.work_type === 'hybrid')
  } else if (filter === 'remote') {
    jobs = jobs.filter(j => j.work_type === 'remote')
  } else if (filter !== 'all') {
    jobs = jobs.filter(j => j.sector === filter)
  }

  if (keyword) {
    const kw = keyword.toLowerCase()
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(kw) ||
      j.company.toLowerCase().includes(kw) ||
      j.description.toLowerCase().includes(kw) ||
      j.skills.some(s => s.toLowerCase().includes(kw))
    )
  }

  jobs.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())

  return NextResponse.json({ jobs: jobs.slice(0, 300), total: jobs.length })
}
