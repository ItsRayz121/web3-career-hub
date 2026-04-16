'use client'
import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Briefcase, Search, Bookmark, RefreshCw, MapPin, Clock, DollarSign, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Job {
  id: string
  title: string
  company: string
  location: string
  work_type: string
  description: string
  skills: string[]
  posted_date: string
  source: string
  apply_url: string
  sector: string
  salary: string
}

const filters = [
  { value: 'all', label: 'All Jobs' },
  { value: 'remote', label: 'Remote' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'pakistan', label: 'Pakistan' },
  { value: 'blockchain', label: 'Blockchain / Web3' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'product', label: 'Product' },
]

const sectorColors: Record<string, 'purple' | 'info' | 'success' | 'warning'> = {
  blockchain: 'purple',
  marketing: 'info',
  design: 'success',
  product: 'warning',
  engineering: 'info',
}

const workTypeBadge: Record<string, string> = {
  remote: 'bg-green-900/40 text-green-400 border-green-800/50',
  freelance: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
  hybrid: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  onsite: 'bg-[#1a1a2e] text-[#8888aa] border-[#1e1e35]',
}

function formatExactDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const supabase = createClient()

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeFilter !== 'all') params.set('sector', activeFilter)
      if (search) params.set('keyword', search)
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {
      toast.error('Failed to fetch jobs')
    }
    setLoading(false)
  }, [activeFilter, search])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const saveJob = async (job: Job) => {
    setSaving(job.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('saved_opportunities').insert({
      user_id: user.id,
      opportunity_id: job.id,
      opportunity_type: 'job',
      title: job.title,
      company: job.company,
      url: job.apply_url,
      status: 'saved',
      priority: 'medium',
    })
    if (error && error.code !== '23505') toast.error('Failed to save')
    else toast.success('Job saved to tracker!')
    setSaving(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-[#8888aa] text-sm mt-1">Live opportunities from 10 global sources — remote, freelance, Pakistan &amp; worldwide</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchJobs}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Search + Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555577]" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm placeholder:text-[#555577] focus:outline-none focus:border-[#6c63ff]"
              placeholder="Search by title, company, or skill..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(keyword) }}
            />
          </div>
          <Button size="sm" onClick={() => setSearch(keyword)}>
            <Search size={14} /> Search
          </Button>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === f.value
                  ? 'bg-[#6c63ff] text-white'
                  : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-[#1e1e35] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#1e1e35] rounded w-1/2 mb-4" />
              <div className="h-10 bg-[#1e1e35] rounded" />
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase size={32} className="text-[#555577] mx-auto mb-3" />
          <p className="text-sm font-medium text-white">No jobs found</p>
          <p className="text-xs text-[#555577] mt-1">Try a different keyword or filter</p>
        </Card>
      ) : (
        <>
          <p className="text-xs text-[#555577]">{jobs.length} jobs found — live from 10 sources</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <Card key={job.id} hover className="flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight">{job.title}</h3>
                      <p className="text-[#8888aa] text-xs mt-0.5">{job.company}</p>
                    </div>
                    <Badge variant={sectorColors[job.sector] || 'default'} className="shrink-0 capitalize">
                      {job.sector}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-[#555577] mb-3">
                    <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-medium capitalize ${workTypeBadge[job.work_type] || workTypeBadge.onsite}`}>
                      {job.work_type}
                    </span>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatExactDate(job.posted_date)}</span>
                    {job.salary && (
                      <span className="flex items-center gap-1 text-green-400 font-medium">
                        <DollarSign size={11} />{job.salary}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#8888aa] leading-relaxed line-clamp-2">{job.description}</p>

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skills.slice(0, 4).map(s => (
                        <span key={s} className="text-xs bg-[#1a1a2e] text-[#8888aa] px-2 py-0.5 rounded border border-[#1e1e35]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-1">
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => saveJob(job)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] text-white text-xs font-medium transition-colors"
                  >
                    <CheckCircle size={11} /> Apply & Track
                  </a>
                  <Link
                    href={`/dashboard/cover-letter?job=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&desc=${encodeURIComponent(job.description)}`}
                    className="px-3 py-2 rounded-lg bg-[#1a1a2e] hover:bg-[#222240] text-[#8888aa] hover:text-white border border-[#1e1e35] transition-colors"
                    title="Write Cover Letter"
                  >
                    <Mail size={14} />
                  </Link>
                  <button
                    onClick={() => saveJob(job)}
                    disabled={saving === job.id}
                    className="px-3 py-2 rounded-lg bg-[#1a1a2e] hover:bg-[#222240] text-[#8888aa] hover:text-white border border-[#1e1e35] transition-colors disabled:opacity-50"
                    title="Save to tracker"
                  >
                    <Bookmark size={14} />
                  </button>
                </div>

                <p className="text-[10px] text-[#555577]">Source: {job.source}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
