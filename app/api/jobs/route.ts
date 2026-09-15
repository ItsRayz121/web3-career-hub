import { NextRequest, NextResponse } from 'next/server'

interface JobItem {
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

// ── Source Parsers ────────────────────────────────────────────────────────────

async function parseRemoteOK(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://remoteok.com/api?tags=crypto', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=60', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://arbeitnow.com/api/job-board-api', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://weworkremotely.com/remote-jobs.rss', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://rozee.pk/rss/jobs.xml', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://www.freelancer.com/jobs/rss/', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items.slice(0, 50).map((item, idx) => {
      const title = extractXml(item, 'title')
      const link = extractXml(item, 'link')
      const desc = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 300)
      const pubDate = extractXml(item, 'pubDate')
      // Extract budget from title e.g. "$250-750 USD"
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
    const res = await fetch('https://himalayas.app/jobs/api?limit=50', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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
    const res = await fetch('https://web3.career/web3-jobs.rss', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
    const text = await res.text()
    // Check it's actually RSS not HTML
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

async function parseReliefWebPakistan(): Promise<JobItem[]> {
  try {
    const res = await fetch('https://reliefweb.int/jobs/rss.xml?search=country%3A%22Pakistan%22', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 900 },
    })
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

// Extract plain text from Telegram HTML message content
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
      next: { revalidate: 900 },
    })
    if (!res.ok) return []
    const html = await res.text()

    // Extract all message text blocks
    const textBlocks = [...html.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
    const dateBlocks = [...html.matchAll(/datetime="([^"]+)"/g)]
    const urlBlocks  = [...html.matchAll(/href="(https:\/\/t\.me\/[a-zA-Z0-9_]+\/\d+)"/g)]

    const jobs: JobItem[] = []

    for (let i = 0; i < textBlocks.length; i++) {
      const rawHtml = textBlocks[i][1]
      const text    = stripTelegramHtml(rawHtml)
      if (text.length < 30) continue

      const date = dateBlocks[i]?.[ 1] || new Date().toISOString()
      const url  = urlBlocks[i]?.[1] || `https://t.me/${username}`

      // These ARE job channels — include all posts that have any job signal
      // (looser filter than general channels, since the channel itself is a job board)
      const JOB_SIGNALS = [
        /\bhiring\b/i, /\blooking for\b/i, /\bjob\b/i, /\bposition\b/i,
        /\brole\b/i, /\bvacancy\b/i, /\bopening\b/i, /\bremote\b/i,
        /\bapply\b/i, /\bsalary\b/i, /\bcompensation\b/i, /\b(cv|resume)\b/i,
        /\b(developer|engineer|designer|manager|analyst|marketer)\b/i,
        /\b(solidity|blockchain|web3|defi|nft|crypto|token)\b/i,
        /\$\d+/i, /\d+k\s*(usd|\/mo)/i,
      ]
      if (!JOB_SIGNALS.some(p => p.test(text))) continue

      // Use first non-emoji line as title
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

// ── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('sector') || 'all'
  const keyword = searchParams.get('keyword') || ''

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
    parseReliefWebPakistan(),
    parseJoobleJobs(),
    parseTelegramJobs(),
  ])

  let jobs: JobItem[] = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Deduplicate by title+company
  const seen = new Set<string>()
  jobs = jobs.filter(j => {
    const key = `${j.title.toLowerCase().slice(0, 40)}_${j.company.toLowerCase().slice(0, 20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Filter
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

  // Sort by date (newest first)
  jobs.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())

  return NextResponse.json({ jobs: jobs.slice(0, 200), total: jobs.length })
}
