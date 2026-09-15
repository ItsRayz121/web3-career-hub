import { NextResponse } from 'next/server'

interface CollabItem {
  id: string
  title: string
  organization: string
  type: string
  description: string
  apply_url: string
  source: string
  posted_date: string
  tags: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractXml(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return (match?.[1] || match?.[2] || '').trim()
}

function extractTagsFromText(text: string): string[] {
  const keywords = [
    'Ambassador', 'Community', 'KOL', 'Influencer', 'Partnership', 'Moderator',
    'Content Creator', 'Growth', 'Advocate', 'Discord', 'Telegram', 'Twitter', 'X',
    'Web3', 'DeFi', 'NFT', 'DAO', 'Ethereum', 'Blockchain', 'Crypto', 'Token',
    'Marketing', 'Social Media', 'Writing', 'Video', 'Grants',
  ]
  return keywords.filter(k => text.toLowerCase().includes(k.toLowerCase())).slice(0, 6)
}

function detectCollabType(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('ambassador')) return 'Ambassador'
  if (t.includes('kol') || t.includes('influencer') || t.includes('key opinion')) return 'KOL'
  if (t.includes('moderator') || t.includes('mod ')) return 'Moderator'
  if (t.includes('creator') || t.includes('content')) return 'Content Creator'
  if (t.includes('partner') || t.includes('partnership')) return 'Partnership'
  if (t.includes('community') || t.includes('guild') || t.includes('advocate')) return 'Community'
  if (t.includes('grant')) return 'Grant'
  return 'Collaboration'
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Signals that indicate a collaboration / ambassador / community opportunity
const COLLAB_SIGNALS = [
  /\bambassador\b/i,
  /\bkol\b/i,
  /\binfluencer\b/i,
  /\bcommunity manager\b/i,
  /\bcommunity (lead|role|position|head|director|builder)\b/i,
  /\badvocate\b/i,
  /\bmoderator\b/i,
  /\bcontent creator\b/i,
  /\bpartner(ship)?\b/i,
  /\bgrowth hacker\b/i,
  /\bgrant\b/i,
  /\bbrand (rep|ambassador|partner)\b/i,
  /\blooking for .*(ambassador|kol|partner|community|advocate)/i,
]

function isCollab(text: string): boolean {
  return COLLAB_SIGNALS.some(p => p.test(text))
}

// ── Telegram Collab Channels ──────────────────────────────────────────────────
// Mix of dedicated ambassador/community channels + verified job channels
// filtered for collab signals. All run with Promise.allSettled — failures ignored.

const TELEGRAM_COLLAB_CHANNELS = [
  // Dedicated ambassador / community / KOL channels
  { username: 'web3ambassador',      label: 'Web3 Ambassador'     },
  { username: 'cryptoambassadors',   label: 'Crypto Ambassadors'  },
  { username: 'kolcrypto',           label: 'KOL Crypto'          },
  { username: 'kolnetwork',          label: 'KOL Network'         },
  { username: 'web3community',       label: 'Web3 Community'      },
  { username: 'defi_ambassador',     label: 'DeFi Ambassador'     },
  { username: 'CryptoKolNetwork',    label: 'Crypto KOL Network'  },
  { username: 'ambassadornews',      label: 'Ambassador News'     },
  { username: 'web3grants',          label: 'Web3 Grants'         },
  { username: 'grantsnews',          label: 'Grants News'         },
  // Broad job channels — filtered for collab keywords below
  { username: 'cryptojobslist',      label: 'CryptoJobsList'      },
  { username: 'web3hiring',          label: 'Web3 Hiring'         },
  { username: 'DeFiJobs',            label: 'DeFi Jobs'           },
]

async function parseTelegramCollab(username: string, label: string): Promise<CollabItem[]> {
  try {
    const res = await fetch(`https://t.me/s/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Web3CareerHub/1.0)' },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const html = await res.text()

    const textBlocks = [...html.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
    const dateBlocks = [...html.matchAll(/datetime="([^"]+)"/g)]
    const urlBlocks  = [...html.matchAll(/href="(https:\/\/t\.me\/[a-zA-Z0-9_]+\/\d+)"/g)]

    const items: CollabItem[] = []
    for (let i = 0; i < textBlocks.length; i++) {
      const text = stripHtml(textBlocks[i][1])
      if (text.length < 30 || !isCollab(text)) continue

      const date   = dateBlocks[i]?.[1] || new Date().toISOString()
      const url    = urlBlocks[i]?.[1]  || `https://t.me/${username}`
      const lines  = text.split('\n').map(l => l.trim()).filter(l => l.length > 5)
      const title  = lines[0]?.slice(0, 100) || label

      items.push({
        id: `tg_collab_${username}_${url.split('/').pop()}`,
        title,
        organization: label,
        type: detectCollabType(title + ' ' + text),
        description: text.slice(0, 350),
        apply_url: url,
        source: `Telegram · ${label}`,
        posted_date: new Date(date).toISOString(),
        tags: extractTagsFromText(text),
      })
    }
    return items
  } catch {
    return []
  }
}

async function parseTelegramCollabs(): Promise<CollabItem[]> {
  const results = await Promise.allSettled(
    TELEGRAM_COLLAB_CHANNELS.map(ch => parseTelegramCollab(ch.username, ch.label))
  )
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

// ── CryptoJobsList RSS — filtered for collab roles ────────────────────────────

async function parseCryptoJobsList(): Promise<CollabItem[]> {
  try {
    const res = await fetch('https://cryptojobslist.com/rss.xml', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const text = await res.text()
    if (!text.includes('<item>')) return []
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items
      .slice(0, 100)
      .map((item, idx) => {
        const title = extractXml(item, 'title')
        const link  = extractXml(item, 'link')
        const desc  = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 350)
        const date  = extractXml(item, 'pubDate')
        return { title, link, desc, date, idx }
      })
      .filter(({ title, desc }) => isCollab(title + ' ' + desc))
      .map(({ title, link, desc, date, idx }) => ({
        id: `cjl_collab_${idx}`,
        title,
        organization: (() => {
          const m = title.match(/ at (.+?)( -|$)/i) || title.match(/- (.+?)$/)
          return m ? m[1].trim() : 'Web3 Company'
        })(),
        type: detectCollabType(title),
        description: desc,
        apply_url: link,
        source: 'CryptoJobsList',
        posted_date: date ? new Date(date).toISOString() : new Date().toISOString(),
        tags: extractTagsFromText(title + ' ' + desc),
      }))
  } catch {
    return []
  }
}

// ── Web3.career RSS — filtered for collab roles ───────────────────────────────

async function parseWeb3CareerCollabs(): Promise<CollabItem[]> {
  try {
    const res = await fetch('https://web3.career/web3-jobs.rss', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const text = await res.text()
    if (!text.includes('<item>')) return []
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items
      .slice(0, 100)
      .map((item, idx) => {
        const title = extractXml(item, 'title')
        const link  = extractXml(item, 'link')
        const desc  = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 350)
        const date  = extractXml(item, 'pubDate')
        return { title, link, desc, date, idx }
      })
      .filter(({ title, desc }) => isCollab(title + ' ' + desc))
      .map(({ title, link, desc, date, idx }) => {
        const m = title.match(/ at (.+?)( -|$)/i) || title.match(/- (.+?)$/)
        const org = m ? m[1].trim() : 'Web3 Company'
        return {
          id: `w3c_collab_${idx}`,
          title: title.replace(` at ${org}`, '').replace(` - ${org}`, '').trim(),
          organization: org,
          type: detectCollabType(title),
          description: desc,
          apply_url: link,
          source: 'Web3.career',
          posted_date: date ? new Date(date).toISOString() : new Date().toISOString(),
          tags: extractTagsFromText(title + ' ' + desc),
        }
      })
  } catch {
    return []
  }
}

// ── Remotive RSS — filtered for community/ambassador roles ────────────────────

async function parseRemotiveCollabs(): Promise<CollabItem[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=100&category=marketing', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs: Record<string, unknown>[] = data.jobs || []
    return jobs
      .filter(j => isCollab(String(j.title || '') + ' ' + String(j.description || '').slice(0, 200)))
      .map(j => ({
        id: `remotive_collab_${j.id}`,
        title: String(j.title || ''),
        organization: String(j.company_name || ''),
        type: detectCollabType(String(j.title || '')),
        description: String(j.description || '').replace(/<[^>]*>/g, '').slice(0, 350),
        apply_url: String(j.url || ''),
        source: 'Remotive',
        posted_date: j.publication_date ? new Date(String(j.publication_date)).toISOString() : new Date().toISOString(),
        tags: extractTagsFromText(String(j.title || '') + ' ' + String(j.description || '')),
      }))
  } catch {
    return []
  }
}

// ── WeWorkRemotely RSS — community roles ──────────────────────────────────────

async function parseWWRCollabs(): Promise<CollabItem[]> {
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-marketing-jobs.rss', {
      headers: { 'User-Agent': 'Web3CareerHub/1.0' },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const text = await res.text()
    if (!text.includes('<item>')) return []
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    return items
      .slice(0, 80)
      .map((item, idx) => {
        const title = extractXml(item, 'title')
        const link  = extractXml(item, 'link')
        const desc  = extractXml(item, 'description').replace(/<[^>]*>/g, '').slice(0, 350)
        const date  = extractXml(item, 'pubDate')
        return { title, link, desc, date, idx }
      })
      .filter(({ title, desc }) => isCollab(title + ' ' + desc))
      .map(({ title, link, desc, date, idx }) => {
        const m = title.match(/ at (.+?)( -|$)/i) || title.match(/- (.+?)$/)
        const org = m ? m[1].trim() : 'Company'
        return {
          id: `wwr_collab_${idx}`,
          title: title.replace(` at ${org}`, '').replace(` - ${org}`, '').trim(),
          organization: org,
          type: detectCollabType(title),
          description: desc,
          apply_url: link,
          source: 'WeWorkRemotely',
          posted_date: date ? new Date(date).toISOString() : new Date().toISOString(),
          tags: extractTagsFromText(title + ' ' + desc),
        }
      })
  } catch {
    return []
  }
}

// ── GET Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const results = await Promise.allSettled([
    parseTelegramCollabs(),
    parseCryptoJobsList(),
    parseWeb3CareerCollabs(),
    parseRemotiveCollabs(),
    parseWWRCollabs(),
  ])

  let items: CollabItem[] = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  // Deduplicate by title + org
  const seen = new Set<string>()
  items = items.filter(item => {
    const key = `${item.title.toLowerCase().slice(0, 40)}_${item.organization.toLowerCase().slice(0, 20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort newest first
  items.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())

  return NextResponse.json({ collabs: items.slice(0, 150), total: items.length })
}
