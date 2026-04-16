'use client'
import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Handshake, ExternalLink, RefreshCw, Bookmark, Globe } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

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
  curated?: boolean
}

// Curated ambassador / collab programs — real, always available
const curatedPrograms: CollabItem[] = [
  {
    id: 'layer3_quests',
    title: 'Layer3 Ambassador Program',
    organization: 'Layer3',
    type: 'Ambassador',
    description: 'Complete Web3 quests, earn rewards, and become a Layer3 ambassador. Open to everyone globally including Pakistan.',
    apply_url: 'https://layer3.xyz',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['Web3', 'Quests', 'Rewards', 'Ambassador'],
    curated: true,
  },
  {
    id: 'galxe_ambassador',
    title: 'Galxe Ambassador Program',
    organization: 'Galxe (formerly Project Galaxy)',
    type: 'Ambassador',
    description: 'Join the Galxe ambassador network — help grow Web3 communities, earn credentials and rewards. Remote, global.',
    apply_url: 'https://galxe.com',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['Galxe', 'Web3', 'Community', 'NFT'],
    curated: true,
  },
  {
    id: 'binance_angel',
    title: 'Binance Angels Program',
    organization: 'Binance',
    type: 'Community',
    description: 'Volunteer community program for Binance. Help users, moderate communities, earn rewards. Pakistan-friendly.',
    apply_url: 'https://www.binance.com/en/binance-angels',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['Binance', 'Community', 'Volunteer', 'Crypto'],
    curated: true,
  },
  {
    id: 'chainlink_advocates',
    title: 'Chainlink Developer Advocates',
    organization: 'Chainlink Labs',
    type: 'Ambassador',
    description: 'Become a Chainlink developer advocate. Create content, build demos, speak at events. Paid program, remote.',
    apply_url: 'https://chain.link/community/advocates',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['Chainlink', 'Developer', 'Content', 'Paid'],
    curated: true,
  },
  {
    id: 'polygon_advocates',
    title: 'Polygon Advocates Program',
    organization: 'Polygon',
    type: 'Ambassador',
    description: 'Official ambassador program for Polygon. Organize events, create educational content, grow local Web3 communities.',
    apply_url: 'https://polygon.technology/community',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['Polygon', 'MATIC', 'Community', 'Events'],
    curated: true,
  },
  {
    id: 'near_community',
    title: 'NEAR Community Guilds',
    organization: 'NEAR Protocol',
    type: 'Community',
    description: 'Join or create a NEAR Guild — earn rewards for community building, education, and content creation. Remote.',
    apply_url: 'https://near.org/guilds',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['NEAR', 'Guild', 'Community', 'Grants'],
    curated: true,
  },
  {
    id: 'debank_kol',
    title: 'DeBank KOL Program',
    organization: 'DeBank',
    type: 'KOL',
    description: 'Key Opinion Leader program for DeFi/Web3 creators. Share insights, grow your audience, earn rewards.',
    apply_url: 'https://debank.com',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['DeFi', 'KOL', 'Content', 'Web3'],
    curated: true,
  },
  {
    id: 'coinmarketcap_airdrop',
    title: 'CoinMarketCap Content Creator',
    organization: 'CoinMarketCap',
    type: 'Content Creator',
    description: 'Write crypto content, reviews, and analysis for CoinMarketCap. Open to global writers including Pakistan.',
    apply_url: 'https://coinmarketcap.com/community',
    source: 'Curated',
    posted_date: new Date().toISOString(),
    tags: ['Writing', 'Crypto', 'Content', 'CMC'],
    curated: true,
  },
]

async function fetchLiveCollabs(): Promise<CollabItem[]> {
  try {
    const res = await fetch('/api/jobs?sector=blockchain&keyword=ambassador')
    const data = await res.json()
    const collabKeywords = ['ambassador', 'community', 'partnership', 'collaboration', 'growth', 'advocate', 'moderator', 'kol', 'creator', 'influencer']
    return (data.jobs || [])
      .filter((j: { title: string; description: string }) =>
        collabKeywords.some(k => j.title.toLowerCase().includes(k) || j.description.toLowerCase().includes(k))
      )
      .map((j: { id: string; title: string; company: string; sector: string; description: string; apply_url: string; source: string; posted_date: string; skills: string[] }) => ({
        id: j.id,
        title: j.title,
        organization: j.company,
        type: detectCollabType(j.title),
        description: j.description,
        apply_url: j.apply_url,
        source: j.source,
        posted_date: j.posted_date,
        tags: j.skills,
        curated: false,
      }))
  } catch {
    return []
  }
}

function detectCollabType(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('ambassador')) return 'Ambassador'
  if (t.includes('community')) return 'Community'
  if (t.includes('partnership') || t.includes('partner')) return 'Partnership'
  if (t.includes('moderator')) return 'Moderator'
  if (t.includes('creator') || t.includes('content')) return 'Content Creator'
  if (t.includes('kol') || t.includes('influencer')) return 'KOL'
  return 'Collaboration'
}

const typeColors: Record<string, 'purple' | 'info' | 'success' | 'warning'> = {
  Ambassador: 'purple',
  Community: 'info',
  Partnership: 'success',
  'Content Creator': 'warning',
  KOL: 'warning',
  Moderator: 'info',
}

export default function CollaborationsPage() {
  const [liveItems, setLiveItems] = useState<CollabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [tab, setTab] = useState<'curated' | 'live'>('curated')
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchLiveCollabs()
      setLiveItems(data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveItem = async (item: CollabItem) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('saved_opportunities').insert({
      user_id: user.id, opportunity_id: item.id, opportunity_type: 'collaboration',
      title: item.title, company: item.organization, url: item.apply_url, status: 'saved', priority: 'medium',
    })
    toast.success('Saved to tracker!')
  }

  const activeItems = tab === 'curated' ? curatedPrograms : liveItems
  const types = ['all', ...Array.from(new Set(activeItems.map(i => i.type)))]
  const filtered = filterType === 'all' ? activeItems : activeItems.filter(i => i.type === filterType)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Collaborations</h1>
          <p className="text-[#8888aa] text-sm mt-1">Ambassador programs, community roles, KOL opportunities, and partnerships</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}><RefreshCw size={14} /> Refresh</Button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => { setTab('curated'); setFilterType('all') }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'curated' ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'}`}>
          Curated Programs ({curatedPrograms.length})
        </button>
        <button onClick={() => { setTab('live'); setFilterType('all') }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'live' ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'}`}>
          Live Feed {!loading && `(${liveItems.length})`}
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filterType === t ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading && tab === 'live' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Handshake size={32} className="text-[#555577] mx-auto mb-3" />
          <p className="text-sm font-medium text-white">No opportunities found</p>
          <p className="text-xs text-[#555577] mt-1">Try refreshing or switching to Curated Programs</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => (
            <Card key={item.id} hover className="flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                      {item.curated && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#6c63ff20] text-[#a78bfa] border border-[#6c63ff30]">Verified</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8888aa] mt-0.5 flex items-center gap-1"><Globe size={10} />{item.organization}</p>
                  </div>
                  <Badge variant={typeColors[item.type] || 'default'} className="shrink-0">{item.type}</Badge>
                </div>
                <p className="text-xs text-[#8888aa] line-clamp-2">{item.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 4).map(t => (
                    <span key={t} className="text-xs bg-[#1a1a2e] text-[#8888aa] px-2 py-0.5 rounded border border-[#1e1e35]">{t}</span>
                  ))}
                </div>
                {!item.curated && (
                  <p className="text-[10px] text-[#555577] mt-2">Posted {formatDate(item.posted_date)} · {item.source}</p>
                )}
              </div>
              <div className="flex gap-2">
                <a href={item.apply_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] text-white text-xs font-medium transition-colors">
                  Apply <ExternalLink size={11} />
                </a>
                <button onClick={() => saveItem(item)}
                  className="px-3 py-2 rounded-lg bg-[#1a1a2e] hover:bg-[#222240] text-[#8888aa] hover:text-white border border-[#1e1e35] transition-colors">
                  <Bookmark size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
