// Aggregates live job listings from many free, no-auth-required sources plus
// a handful of direct-ATS company boards (Greenhouse / Lever / Ashby) curated
// from the Web3/crypto + top-tech target lists used by the sibling lead-gen
// project (G:\Leads Generator\config\target-companies). Shared by the public
// /api/jobs route (per-request, cache-window revalidate) and the daily
// /api/cron/refresh-jobs route, which forces a fetch of every source at least
// once every 24h even if nobody visits the site in between.

import { unstable_cache } from 'next/cache'

export interface JobItem {
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

export const JOB_SOURCE_COUNT = 19

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractXml(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return (match?.[1] || match?.[2] || '').trim()
}

function extractCompanyFromTitle(title: string): string {
  const atMatch = title.match(/ at (.+?)( -|$)/i)
  if (atMatch) return atMatch[1].trim()
  const dashMatch = title.match(/- (.+?)$/)
  if (dashMatch) return dashMatch[1].trim()
  return 'Company'
}

function cleanTitle(title: string, company: string): string {
  return title.replace(` at ${company}`, '').replace(` - ${company}`, '').trim()
}

function extractSkillsFromText(text: string): string[] {
  const keywords = [
    'Solidity', 'Rust', 'TypeScript', 'JavaScript', 'Python', 'React', 'Node.js',
    'Web3', 'DeFi', 'NFT', 'DAO', 'Ethereum', 'Bitcoin', 'Blockchain', 'Smart Contracts',
    'Go', 'Move', 'Anchor', 'Hardhat', 'Foundry', 'Ethers.js', 'Wagmi',
    'Community', 'Discord', 'Telegram', 'Marketing', 'BD', 'Partnerships',
    'Content', 'Writing', 'SEO', 'Social Media', 'PHP', 'Laravel', 'Vue', 'Angular',
    'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Redis', 'GraphQL',
    'Figma', 'UI/UX', 'Design', 'Photoshop', 'Illustrator',
  ]
  return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).slice(0, 6)
}

function detectSector(title: string, tags: string[]): string {
  const text = (title + ' ' + tags.join(' ')).toLowerCase()
  if (/blockchain|web3|crypto|defi|nft|solidity|ethereum|dao|token/i.test(text)) return 'blockchain'
  if (/marketing|content|social|community|seo|copywrite/i.test(text)) return 'marketing'
  if (/design|ui|ux|figma|graphic/i.test(text)) return 'design'
  if (/product|pm|product manager/i.test(text)) return 'product'
  if (/engineer|developer|dev|software|backend|frontend|fullstack|full.stack/i.test(text)) return 'engineering'
  return 'general'
}

function detectWorkType(title: string, description: string, defaultType: string): string {
  const text = (title + ' ' + description).toLowerCase()
  if (/freelance|contract|per.project|gig/i.test(text)) return 'freelance'
  if (/hybrid/i.test(text)) return 'hybrid'
  if (/on.?site|in.?office|in.?person/i.test(text)) return 'onsite'
  if (/remote/i.test(text)) return 'remote'
  return defaultType
}

function formatSalary(min: number, max: number, currency = 'USD'): string {
  if (!min && !max) return ''
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency + ' '
  if (min && max) return `${symbol}${fmt(min)}–${fmt(max)}/yr`
  if (min) return `${symbol}${fmt(min)}+/yr`
  return `Up to ${symbol}${fmt(max)}/yr`
}

const UA = { 'User-Agent': 'Web3CareerHub/1.0' }

// Cache window for free/high-rate-limit sources hit on every request.
const REVALIDATE = 900

// ── Source Parsers — public job board APIs / RSS feeds ────────────────────────

async function parseRemoteOK(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://remoteok.com/api', { headers: UA, next: { revalidate: REVALIDATE } })
    const data = await res.json()
    const jobs = Array.isArray(data) ? data.slice(1, 60) : []
    return jobs
      .filter((j: Record<string, unknown>) => j.position || j.company)
      .map((j: Record<string, unknown>) => ({
        id: `remoteok_${j.id}`,
        title: String(j.position || ''),
        company: String(j.company || ''),
        location: 'Remote',
        work_type: 'remote',
        description: String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
        skills: Array.isArray(j.tags) ? (j.tags as string[]).slice(0, 6) : [],
        posted_date: j.date ? new Date(String(j.date)).toISOString() : new Date().toISOString(),
        source: 'RemoteOK',
        apply_url: String(j.url || `https://remoteok.com/l/${j.id}`),
        sector: detectSector(String(j.position || ''), Array.isArray(j.tags) ? (j.tags as string[]) : []),
        salary: j.salary_min || j.salary_max
          ? formatSalary(Number(j.salary_min || 0), Number(j.salary_max || 0))
          : '',
      }))
  } catch {
    return []
  }
}

async function parseRemoteOKCrypto(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://remoteok.com/api?tags=crypto', { headers: UA, next: { revalidate: REVALIDATE } })
    const data = await res.json()
    const jobs = Array.isArray(data) ? data.slice(1, 80) : []
    return jobs
      .filter((j: Record<string, unknown>) => j.position || j.company)
      .map((j: Record<string, unknown>) => ({
        id: `remoteok_crypto_${j.id}`,
        title: String(j.position || ''),
        company: String(j.company || ''),
        location: 'Remote',
        work_type: 'remote',
        description: String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
        skills: Array.isArray(j.tags) ? (j.tags as string[]).slice(0, 6) : [],
        posted_date: j.date ? new Date(String(j.date)).toISOString() : new Date().toISOString(),
        source: 'RemoteOK',
        apply_url: String(j.url || `https://remoteok.com/l/${j.id}`),
        sector: 'blockchain',
        salary: j.salary_min || j.salary_max
          ? formatSalary(Number(j.salary_min || 0), Number(j.salary_max || 0))
          : '',
      }))
  } catch {
    return []
  }
}

async function parseRemotive(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=60', { headers: UA, next: { revalidate: REVALIDATE } })
    const data = await res.json()
    const jobs: Record<string, unknown>[] = data.jobs || []
    return jobs.map(j => ({
      id: `remotive_${j.id}`,
      title: String(j.title || ''),
      company: String(j.company_name || ''),
      location: String(j.candidate_required_location || 'Remote'),
      work_type: 'remote',
      description: String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
      skills: Array.isArray(j.tags) ? (j.tags as string[]).slice(0, 6) : [],
      posted_date: j.publication_date ? new Date(String(j.publication_date)).toISOString() : new Date().toISOString(),
      source: 'Remotive',
      apply_url: String(j.url || ''),
      sector: detectSector(String(j.title || ''), Array.isArray(j.tags) ? (j.tags as string[]) : [String(j.category || '')]),
      salary: j.salary ? String(j.salary) : '',
    }))
  } catch {
    return []
  }
}

async function parseArbeitnow(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://arbeitnow.com/api/job-board-api', { headers: UA, next: { revalidate: REVALIDATE } })
    const data = await res.json()
    const jobs: Record<string, unknown>[] = (data.data || []).slice(0, 60)
    return jobs.map((j, idx) => {
      const title = String(j.title || '')
      const desc = String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 300)
      return {
        id: `arbeitnow_${j.slug || idx}`,
        title,
        company: String(j.company_name || ''),
        location: j.remote ? 'Remote' : String(j.location || 'Remote'),
        work_type: detectWorkType(title, desc, j.remote ? 'remote' : 'hybrid'),
        description: desc,
        skills: Array.isArray(j.tags) ? (j.tags as string[]).slice(0, 6) : [],
        posted_date: j.created_at ? new Date(Number(j.created_at) * 1000).toISOString() : new Date().toISOString(),
        source: 'Arbeitnow',
        apply_url: String(j.url || ''),
        sector: detectSector(title, Array.isArray(j.tags) ? (j.tags as string[]) : []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseJobicy(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', { headers: UA, next: { revalidate: REVALIDATE } })
    const data = await res.json()
    const jobs: Record<string, unknown>[] = data.jobs || []
    return jobs.map(j => {
      const title = String(j.jobTitle || '')
      const desc = String(j.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 300)
      const jobType = String(j.jobType || '').toLowerCase()
      return {
        id: `jobicy_${j.id}`,
        title,
        company: String(j.companyName || ''),
        location: String(j.jobGeo || 'Remote'),
        work_type: jobType.includes('freelance') ? 'freelance' : jobType.includes('contract') ? 'freelance' : 'remote',
        description: desc,
        skills: typeof j.jobSkills === 'string'
          ? (j.jobSkills as string).split(',').map((s: string) => s.trim()).slice(0, 6)
          : [],
        posted_date: j.pubDate ? new Date(String(j.pubDate)).toISOString() : new Date().toISOString(),
        source: 'Jobicy',
        apply_url: String(j.url || ''),
        sector: detectSector(title, [String(j.jobIndustry || '')]),
        salary: j.annualSalaryMin || j.annualSalaryMax
          ? formatSalary(Number(j.annualSalaryMin || 0), Number(j.annualSalaryMax || 0))
          : '',
      }
    })
  } catch {
    return []
  }
}

async function parseWeWorkRemotely(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://weworkremotely.com/remote-jobs.rss', { headers: UA, next: { revalidate: REVALIDATE } })
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 50).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const desc = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 300)
      const pubDate = extractXml(item, 'pubDate')
      const company = extractCompanyFromTitle(title)
      return {
        id: `wwr_${idx}_${Date.now()}`,
        title: cleanTitle(title, company),
        company,
        location: 'Remote',
        work_type: 'remote',
        description: desc,
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: 'WeWorkRemotely',
        apply_url: link,
        sector: detectSector(title, []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseRozeePk(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://rozee.pk/rss/jobs.xml', { headers: UA, next: { revalidate: REVALIDATE } })
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 50).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const desc = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 300)
      const pubDate = extractXml(item, 'pubDate')
      const company = extractCompanyFromTitle(title)
      const titleLower = title.toLowerCase()
      return {
        id: `rozee_${idx}_${Date.now()}`,
        title: cleanTitle(title, company),
        company,
        location: 'Pakistan',
        work_type: titleLower.includes('remote') ? 'remote' : titleLower.includes('hybrid') ? 'hybrid' : 'onsite',
        description: desc,
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: 'Rozee.pk',
        apply_url: link,
        sector: detectSector(title, []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseFreelancer(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://www.freelancer.com/jobs/rss/', { headers: UA, next: { revalidate: REVALIDATE } })
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 50).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const desc = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 300)
      const pubDate = extractXml(item, 'pubDate')
      const budgetMatch = title.match(/\$[\d,]+(?:\s*[-–]\s*[\d,]+)?\s*(?:USD|EUR|GBP)?/i)
      return {
        id: `fl_${idx}_${Date.now()}`,
        title: title.replace(/\s*\$[\d,]+.*$/, '').trim(),
        company: 'Freelance Client',
        location: 'Remote / Worldwide',
        work_type: 'freelance',
        description: desc,
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: 'Freelancer.com',
        apply_url: link,
        sector: detectSector(title, []),
        salary: budgetMatch ? budgetMatch[0].trim() : '',
      }
    })
  } catch {
    return []
  }
}

async function parseHimalayas(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://himalayas.app/jobs/api?limit=50', { headers: UA, next: { revalidate: REVALIDATE } })
    const data = await res.json()
    const jobs: Record<string, unknown>[] = data.jobs || []
    return jobs.map(j => {
      const title = String(j.title || '')
      const desc = String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 300)
      const empType = String(j.employmentType || '').toLowerCase()
      const minSal = Number(j.minSalary || 0)
      const maxSal = Number(j.maxSalary || 0)
      const currency = String(j.currency || 'USD')
      return {
        id: `himalayas_${String(j.guid || j.title || Math.random()).replace(/\s/g, '_').slice(0, 30)}`,
        title,
        company: String(j.companyName || ''),
        location: Array.isArray(j.locationRestrictions) && j.locationRestrictions.length > 0
          ? (j.locationRestrictions as string[]).join(', ')
          : 'Remote',
        work_type: empType.includes('contract') || empType.includes('freelance') ? 'freelance' : 'remote',
        description: desc,
        skills: Array.isArray(j.categories) ? (j.categories as string[]).slice(0, 6) : extractSkillsFromText(title + ' ' + desc),
        posted_date: j.pubDate ? new Date(String(j.pubDate)).toISOString() : new Date().toISOString(),
        source: 'Himalayas',
        apply_url: String(j.applicationLink || ''),
        sector: detectSector(title, Array.isArray(j.categories) ? (j.categories as string[]) : []),
        salary: minSal || maxSal ? formatSalary(minSal, maxSal, currency) : '',
      }
    })
  } catch {
    return []
  }
}

async function parseWeb3Career(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://web3.career/web3-jobs.rss', { headers: UA, next: { revalidate: REVALIDATE } })
    const text = await res.text()
    if (!text.includes('<item>')) return []
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 50).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const desc = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 300)
      const pubDate = extractXml(item, 'pubDate')
      const company = extractCompanyFromTitle(title)
      return {
        id: `w3c_${idx}_${Date.now()}`,
        title: cleanTitle(title, company),
        company,
        location: 'Remote',
        work_type: 'remote',
        description: desc,
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: 'Web3.career',
        apply_url: link,
        sector: 'blockchain',
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseCryptoJobsList(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://api.cryptojobslist.com/jobs.rss', { headers: UA, next: { revalidate: REVALIDATE } })
    const text = await res.text()
    if (!text.includes('<item>')) return []
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 60).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const desc = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 300)
      const pubDate = extractXml(item, 'pubDate')
      const [rolePart, companyPart] = title.split(/\s+at\s+/i)
      const company = companyPart?.trim() || extractCompanyFromTitle(title)
      return {
        id: `cjl_${idx}_${Date.now()}`,
        title: (rolePart ?? title).trim(),
        company,
        location: 'Remote',
        work_type: 'remote',
        description: desc,
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: 'CryptoJobsList',
        apply_url: link,
        sector: 'blockchain',
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseReliefWebPakistan(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://reliefweb.int/jobs/rss.xml?search=country%3A%22Pakistan%22', { headers: UA, next: { revalidate: REVALIDATE } })
    const text = await res.text()
    if (!text.includes('<item>')) return []
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 50).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const pubDate = extractXml(item, 'pubDate')
      const rawDesc = extractXml(item, 'description')
      const desc = rawDesc
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const orgMatch = rawDesc.match(/Organization:\s*([^&<]+)/)
      const company = orgMatch ? orgMatch[1].trim() : 'NGO / Development Org'
      return {
        id: `reliefweb_${idx}_${Date.now()}`,
        title,
        company,
        location: 'Pakistan',
        work_type: detectWorkType(title, desc, 'onsite'),
        description: desc.slice(0, 300),
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: 'ReliefWeb',
        apply_url: link,
        sector: 'general',
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseJoobleJobs(): Promise<JobItem[]> {
  const apiKey = process.env.JOOBLE_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(`https://pk.jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: '', location: 'Pakistan' }),
      // 24h cache — Jooble's free key has a 500-lifetime-request cap, not a monthly one
      next: { revalidate: 86400 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs: Record<string, unknown>[] = Array.isArray(data.jobs) ? data.jobs : []
    return jobs.map((j) => {
      const title = String(j.title || '')
      const desc = String(j.snippet || '').replace(/\s+/g, ' ').trim().slice(0, 300)
      const location = String(j.location || 'Pakistan')
      return {
        id: `jooble_${j.id}`,
        title,
        company: String(j.company || 'Company'),
        location,
        work_type: detectWorkType(title, desc, /remote/i.test(location) ? 'remote' : 'onsite'),
        description: desc,
        skills: extractSkillsFromText(title + ' ' + desc),
        posted_date: j.updated ? new Date(String(j.updated)).toISOString() : new Date().toISOString(),
        source: 'Jooble',
        apply_url: String(j.link || ''),
        sector: detectSector(title, []),
        salary: j.salary ? String(j.salary) : '',
      }
    })
  } catch {
    return []
  }
}

// ── Direct-ATS company boards ───────────────────────────────────────────────
// Public, no-key JSON endpoints for the specific companies' own career pages.
// Company lists curated from the sibling lead-gen project's target-company
// config (G:\Leads Generator\config\target-companies) — the same boards it
// monitors for hiring signals, reused here as direct job listings.

const GREENHOUSE_BOARDS = [
  'coinbase', 'anthropic', 'scaleai', 'ripple', 'consensys', 'gemini',
  'fireblocks', 'aptoslabs', 'galaxy', 'blockchain', 'jumpcrypto', 'messari',
  'nearfoundation',
]

const LEVER_COMPANIES = [
  'crypto', 'gate', 'gauntlet', 'immutable', 'animocabrands', 'anchorage',
  'kraken', 'celestia',
]

const ASHBY_BOARDS = [
  'openai', 'perplexity', 'cohere', 'runway', 'character', 'suno', 'elevenlabs',
  'cursor', 'replit', 'lovable', 'uniswap', 'opensea', 'paradigm', 'alchemy',
  'dune', 'blockworks', 'turnkey', 'phantom', 'magiceden', 'mystenlabs',
]

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  updated_at?: string
  content?: string
  location?: { name?: string }
}

async function fetchGreenhouseBoard(token: string): Promise<JobItem[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
      headers: UA,
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs: GreenhouseJob[] = data.jobs || []
    return jobs.map(j => {
      const desc = (j.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
      const location = j.location?.name || 'Remote'
      return {
        id: `gh_${token}_${j.id}`,
        title: j.title,
        company: token,
        location,
        work_type: detectWorkType(j.title, desc, /remote/i.test(location) ? 'remote' : 'onsite'),
        description: desc,
        skills: extractSkillsFromText(j.title + ' ' + desc),
        posted_date: j.updated_at ? new Date(j.updated_at).toISOString() : new Date().toISOString(),
        source: 'Greenhouse',
        apply_url: j.absolute_url,
        sector: detectSector(j.title, []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseGreenhouse(): Promise<JobItem[]> {
  const results = await Promise.allSettled(GREENHOUSE_BOARDS.map(fetchGreenhouseBoard))
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  createdAt?: number
  categories?: { location?: string; commitment?: string }
  descriptionPlain?: string
}

async function fetchLeverCompany(slug: string): Promise<JobItem[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
      headers: UA,
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return []
    const postings: LeverPosting[] = await res.json()
    return postings.map(p => {
      const desc = (p.descriptionPlain || '').slice(0, 300)
      const location = p.categories?.location || 'Remote'
      const commitment = (p.categories?.commitment || '').toLowerCase()
      return {
        id: `lever_${slug}_${p.id}`,
        title: p.text,
        company: slug,
        location,
        work_type: commitment.includes('freelance') || commitment.includes('contract')
          ? 'freelance'
          : detectWorkType(p.text, desc, /remote/i.test(location) ? 'remote' : 'onsite'),
        description: desc,
        skills: extractSkillsFromText(p.text + ' ' + desc),
        posted_date: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        source: 'Lever',
        apply_url: p.hostedUrl,
        sector: detectSector(p.text, []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseLever(): Promise<JobItem[]> {
  const results = await Promise.allSettled(LEVER_COMPANIES.map(fetchLeverCompany))
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

interface AshbyJob {
  id: string
  title: string
  jobUrl: string
  publishedAt?: string
  location?: string
  descriptionPlain?: string
  employmentType?: string
}

async function fetchAshbyBoard(boardName: string): Promise<JobItem[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${boardName}`, {
      headers: UA,
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs: AshbyJob[] = data.jobs || []
    return jobs.map(j => {
      const desc = (j.descriptionPlain || '').slice(0, 300)
      const location = j.location || 'Remote'
      const empType = (j.employmentType || '').toLowerCase()
      return {
        id: `ashby_${boardName}_${j.id}`,
        title: j.title,
        company: boardName,
        location,
        work_type: empType.includes('contract') || empType.includes('freelance')
          ? 'freelance'
          : detectWorkType(j.title, desc, /remote/i.test(location) ? 'remote' : 'onsite'),
        description: desc,
        skills: extractSkillsFromText(j.title + ' ' + desc),
        posted_date: j.publishedAt ? new Date(j.publishedAt).toISOString() : new Date().toISOString(),
        source: 'Ashby',
        apply_url: j.jobUrl,
        sector: detectSector(j.title, []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

async function parseAshby(): Promise<JobItem[]> {
  const results = await Promise.allSettled(ASHBY_BOARDS.map(fetchAshbyBoard))
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

// ── Telegram Job Channels (scraped directly from t.me/s/ — verified public) ───
// RSSHub was blocked (403). t.me/s/{channel} is Telegram's own public preview,
// always works for channels with public preview enabled.

const TELEGRAM_JOB_CHANNELS = [
  { username: 'cryptojobslist',   label: 'CryptoJobsList'    },
  { username: 'DeFiJobs',         label: 'DeFi Jobs'         },
  { username: 'CryptoDevJobs',    label: 'Crypto Dev Jobs'   },
  { username: 'web3hiring',       label: 'Web3 Hiring'       },
  { username: 'cryptodevjobs',    label: 'Crypto Dev Jobs 2' },
  { username: 'remotecryptojobs', label: 'Remote Crypto Jobs'},
]

function stripTelegramHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function parseTelegramChannel(username: string, label: string): Promise<JobItem[]> {
  try {
    const res = await fetch(`https://t.me/s/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Web3CareerHub/1.0)' },
      next: { revalidate: REVALIDATE },
    })
    if (!res.ok) return []
    const html = await res.text()

    const textBlocks = [...html.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
    const dateBlocks = [...html.matchAll(/datetime="([^"]+)"/g)]
    const urlBlocks  = [...html.matchAll(/href="(https:\/\/t\.me\/[a-zA-Z0-9_]+\/\d+)"/g)]

    const jobs: JobItem[] = []

    for (let i = 0; i < textBlocks.length; i++) {
      const rawHtml = textBlocks[i][1]
      const text    = stripTelegramHtml(rawHtml)
      if (text.length < 30) continue

      const date = dateBlocks[i]?.[1] || new Date().toISOString()
      const url  = urlBlocks[i]?.[1] || `https://t.me/${username}`

      const JOB_SIGNALS = [
        /\bhiring\b/i, /\blooking for\b/i, /\bjob\b/i, /\bposition\b/i,
        /\brole\b/i, /\bvacancy\b/i, /\bopening\b/i, /\bremote\b/i,
        /\bapply\b/i, /\bsalary\b/i, /\bcompensation\b/i, /\b(cv|resume)\b/i,
        /\b(developer|engineer|designer|manager|analyst|marketer)\b/i,
        /\b(solidity|blockchain|web3|defi|nft|crypto|token)\b/i,
        /\$\d+/i, /\d+k\s*(usd|\/mo)/i,
      ]
      if (!JOB_SIGNALS.some(p => p.test(text))) continue

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5)
      const title = lines[0]?.slice(0, 100) || label

      jobs.push({
        id: `tg_${username}_${url.split('/').pop()}`,
        title,
        company: extractCompanyFromTitle(title) || label,
        location: 'Remote',
        work_type: detectWorkType(title, text, 'remote'),
        description: text.slice(0, 350),
        skills: extractSkillsFromText(text),
        posted_date: new Date(date).toISOString(),
        source: `Telegram · ${label}`,
        apply_url: url,
        sector: detectSector(title, extractSkillsFromText(text)),
        salary: '',
      })
    }
    return jobs
  } catch {
    return []
  }
}

async function parseTelegramJobs(): Promise<JobItem[]> {
  const results = await Promise.allSettled(
    TELEGRAM_JOB_CHANNELS.map(ch => parseTelegramChannel(ch.username, ch.label))
  )
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

// ── Twitter/X hiring-signal search (twitterapi.io, paid, optional) ───────────
// Ported from workers/connectors/twitter/hiring-signals.ts. Off by default —
// only runs once TWITTERAPI_IO_KEY is set. A tweet has no structured
// title/company, so — same approach as the Telegram parser above — the first
// line of the tweet becomes the title and a best-effort company guess comes
// from it; the tweet itself is the "listing".

interface TwitterApiIoTweet {
  id: string
  url: string
  text: string
  createdAt: string
  author: { userName: string; name: string }
}

interface TwitterApiIoResponse {
  tweets: TwitterApiIoTweet[]
  has_next_page: boolean
  next_cursor: string
}

const HIRING_PHRASES = ['"we\'re hiring"', '"we are hiring"', '"now hiring"', '"join our team"']
const HIRING_TOPICS = ['web3', 'crypto', 'blockchain', 'defi', 'nft']

function buildTwitterHiringQuery(): string {
  const topicClause = `(${HIRING_TOPICS.join(' OR ')})`
  const hiringClause = `(${HIRING_PHRASES.join(' OR ')})`
  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return `${topicClause} ${hiringClause} since:${sinceDate}`
}

async function parseTwitterHiringSignals(): Promise<JobItem[]> {
  const apiKey = process.env.TWITTERAPI_IO_KEY
  if (!apiKey) return []
  try {
    const params = new URLSearchParams({ query: buildTwitterHiringQuery(), queryType: 'Latest' })
    const res = await fetch(`https://api.twitterapi.io/twitter/tweet/advanced_search?${params}`, {
      headers: { 'X-API-Key': apiKey },
      // Paid per-call API — cache an hour rather than the default 15 min to bound cost.
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data: TwitterApiIoResponse = await res.json()
    const tweets = data.tweets || []
    return tweets.map(tweet => {
      const text = tweet.text.trim()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const title = (lines[0] || text).slice(0, 100)
      const company = extractCompanyFromTitle(title) !== 'Company'
        ? extractCompanyFromTitle(title)
        : (tweet.author.name || tweet.author.userName)
      return {
        id: `twitter_${tweet.id}`,
        title,
        company,
        location: 'Remote',
        work_type: detectWorkType(text, text, 'remote'),
        description: text.slice(0, 350),
        skills: extractSkillsFromText(text),
        posted_date: tweet.createdAt ? new Date(tweet.createdAt).toISOString() : new Date().toISOString(),
        source: `Twitter · @${tweet.author.userName}`,
        apply_url: tweet.url,
        sector: detectSector(text, []),
        salary: '',
      }
    })
  } catch {
    return []
  }
}

// ── Claude-powered live web search (Anthropic, optional, cost-capped) ────────
// Uses the same ANTHROPIC_API_KEY already configured for CV/cover-letter
// generation, so no new signup is needed — but a web-search-augmented model
// call costs real money per request. `unstable_cache` (Next's persistent,
// cross-request/cross-deployment Data Cache — distinct from the per-fetch
// `next.revalidate` used everywhere else in this file, which doesn't reliably
// cache POST requests) pins this to running at most once every 24h no matter
// how many times getAllJobs() is called across all visitors and the daily
// cron combined.

interface ClaudeJobResult {
  title: string
  company: string
  location?: string
  workType?: string
  description: string
  sourceUrl: string
}

function extractClaudeText(data: { content?: { type?: string; text?: string }[] }): string {
  return (data.content ?? [])
    .filter(b => b.type === 'text' && typeof b.text === 'string')
    .map(b => b.text)
    .join('')
}

function parseClaudeJobResults(text: string): ClaudeJobResult[] {
  const withoutFences = text.replace(/```(?:json)?/gi, '').trim()
  const start = withoutFences.indexOf('[')
  const end = withoutFences.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return []
  try {
    const parsed = JSON.parse(withoutFences.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
      .map(r => ({
        title: String(r.title || '').trim(),
        company: String(r.company || '').trim(),
        location: typeof r.location === 'string' ? r.location : undefined,
        workType: typeof r.workType === 'string' ? r.workType : undefined,
        description: String(r.description || '').trim(),
        sourceUrl: String(r.sourceUrl || '').trim(),
      }))
      .filter(r => r.title && r.company && /^https?:\/\//i.test(r.sourceUrl))
  } catch {
    return []
  }
}

// Errors deliberately propagate (no try/catch here) rather than resolving to
// `[]` — unstable_cache persists whatever this function returns, so
// swallowing a transient failure into an empty array would pin "no results"
// in the cache for the full 24h revalidate window. getAllJobs() below calls
// this through Promise.allSettled, which handles the rejection per-source
// without caching it.
async function runClaudeLiveSearch(): Promise<JobItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const prompt = [
    'Use your live web search tool right now to find real, currently-open Web3/crypto job listings',
    '— do not answer from memory. Look across company career pages, job boards, and other public',
    'postings for open roles in engineering, marketing, community management, design, or product at',
    'Web3/crypto companies, remote-friendly where possible.',
    '',
    'Find up to 12 distinct openings. For each you must have found a real, specific page during this',
    'search — never invent a company, role, or URL. Skip anything you cannot back with an actual page.',
    '',
    'Respond with ONLY a JSON array (no markdown fences, no prose). Each item:',
    '{ "title": string, "company": string, "location": string | null,',
    '  "workType": "remote" | "hybrid" | "onsite" | "freelance" | null,',
    '  "description": string, // one sentence on the role',
    '  "sourceUrl": string    // the exact page URL you found this on',
    '}',
  ].join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
    }),
  })
  if (!res.ok) throw new Error(`Claude live search error: ${res.status}`)
  const data = await res.json()
  const results = parseClaudeJobResults(extractClaudeText(data))
  const now = new Date().toISOString()
  return results.map((r, idx) => {
    const location = r.location || 'Remote'
    return {
      id: `claude_live_${idx}_${now.slice(0, 10)}`,
      title: r.title,
      company: r.company,
      location,
      work_type: r.workType || detectWorkType(r.title, r.description, /remote/i.test(location) ? 'remote' : 'onsite'),
      description: r.description.slice(0, 300),
      skills: extractSkillsFromText(r.title + ' ' + r.description),
      posted_date: now,
      source: 'Claude Live Search',
      apply_url: r.sourceUrl,
      sector: detectSector(r.title, []),
      salary: '',
    }
  })
}

const fetchClaudeLiveJobs = unstable_cache(
  runClaudeLiveSearch,
  ['jobs-claude-live-search'],
  { revalidate: 86400, tags: ['jobs-claude-live-search'] }
)

// ── Aggregate ───────────────────────────────────────────────────────────────

/**
 * Fetches every source and returns a deduped, unfiltered job list. Calling
 * this is what actually performs the network fetches — Next.js's fetch cache
 * (`next.revalidate` above) is what makes repeated calls within the window
 * cheap, not what triggers the fetch in the first place. The daily cron route
 * calls this directly so every source gets hit at least once every 24h even
 * with zero site visitors; regular page loads call it too and get a warm
 * cache the rest of the time.
 */
export async function getAllJobs(): Promise<JobItem[]> {
  const results = await Promise.allSettled([
    parseRemoteOK(),
    parseRemoteOKCrypto(),
    parseRemotive(),
    parseArbeitnow(),
    parseJobicy(),
    parseWeWorkRemotely(),
    parseRozeePk(),
    parseFreelancer(),
    parseHimalayas(),
    parseWeb3Career(),
    parseCryptoJobsList(),
    parseReliefWebPakistan(),
    parseJoobleJobs(),
    parseTelegramJobs(),
    parseGreenhouse(),
    parseLever(),
    parseAshby(),
    parseTwitterHiringSignals(),
    fetchClaudeLiveJobs(),
  ])

  let jobs: JobItem[] = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  const seen = new Set<string>()
  jobs = jobs.filter(j => {
    const key = `${j.title.toLowerCase().slice(0, 40)}_${j.company.toLowerCase().slice(0, 20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return jobs
}
