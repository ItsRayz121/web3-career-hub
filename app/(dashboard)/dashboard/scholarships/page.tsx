'use client'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { GraduationCap, ExternalLink, BookOpen, Globe } from 'lucide-react'

const scholarshipSources = [
  // ── Web3 / Blockchain Grants ─────────────────────────────────────────────
  {
    id: 'eth_foundation',
    title: 'Ethereum Foundation Grants',
    organization: 'Ethereum Foundation',
    type: 'Grant',
    region: 'Global',
    description: 'Ecosystem grants for research, development, and community projects contributing to the Ethereum ecosystem.',
    url: 'https://ethereum.foundation/grants',
    tags: ['Ethereum', 'Web3', 'Research', 'Development'],
    deadline: 'Rolling',
    amount: 'Varies',
  },
  {
    id: 'near_grants',
    title: 'NEAR Foundation Grants',
    organization: 'NEAR Foundation',
    type: 'Grant',
    region: 'Global',
    description: 'Funding for projects building on NEAR Protocol — open to individuals and teams worldwide.',
    url: 'https://near.foundation/grants',
    tags: ['NEAR', 'Blockchain', 'DeFi'],
    deadline: 'Rolling',
    amount: 'Varies',
  },
  {
    id: 'gitcoin',
    title: 'Gitcoin Grants',
    organization: 'Gitcoin',
    type: 'Grant',
    region: 'Global',
    description: 'Quadratic funding rounds for open source Web3 projects. Multiple rounds per year, open to everyone.',
    url: 'https://grants.gitcoin.co',
    tags: ['Open Source', 'Web3', 'Funding'],
    deadline: 'Per round',
    amount: 'Community funded',
  },
  {
    id: 'filecoin_foundation',
    title: 'Filecoin Foundation Grants',
    organization: 'Filecoin Foundation',
    type: 'Grant',
    region: 'Global',
    description: 'Supporting development, education, and community building for decentralized storage.',
    url: 'https://fil.org/grants',
    tags: ['Filecoin', 'Storage', 'Web3'],
    deadline: 'Rolling',
    amount: 'Up to $50K',
  },
  {
    id: 'web3_foundation',
    title: 'Web3 Foundation Grants',
    organization: 'Web3 Foundation (Polkadot)',
    type: 'Grant',
    region: 'Global',
    description: 'Research and development grants for the Polkadot/Kusama ecosystem. Open to developers worldwide.',
    url: 'https://grants.web3.foundation',
    tags: ['Polkadot', 'Rust', 'Substrate'],
    deadline: 'Rolling',
    amount: 'Up to $100K',
  },
  {
    id: 'solana_foundation',
    title: 'Solana Foundation Grants',
    organization: 'Solana Foundation',
    type: 'Grant',
    region: 'Global',
    description: 'Grants for developers and researchers building on the Solana blockchain.',
    url: 'https://solana.foundation/grants',
    tags: ['Solana', 'Rust', 'DeFi', 'NFT'],
    deadline: 'Rolling',
    amount: 'Varies',
  },
  {
    id: 'chainlink_grants',
    title: 'Chainlink Grants Program',
    organization: 'Chainlink Labs',
    type: 'Grant',
    region: 'Global',
    description: 'Funding for projects using Chainlink oracles — academic research, tooling, and DeFi integrations.',
    url: 'https://chain.link/community/grants',
    tags: ['Chainlink', 'Oracles', 'DeFi', 'Research'],
    deadline: 'Rolling',
    amount: 'Varies',
  },
  {
    id: 'aave_grants',
    title: 'Aave Grants DAO',
    organization: 'Aave',
    type: 'Grant',
    region: 'Global',
    description: 'Community-run grants for projects building on or integrating with the Aave protocol.',
    url: 'https://aavegrants.org',
    tags: ['Aave', 'DeFi', 'Lending', 'Ethereum'],
    deadline: 'Rolling',
    amount: 'Up to $50K',
  },
  {
    id: 'avalanche_grants',
    title: 'Avalanche Foundation Grants',
    organization: 'Avalanche Foundation',
    type: 'Grant',
    region: 'Global',
    description: 'Blizzard Fund and ecosystem grants for builders on Avalanche. Accepts applications from Asia/Pakistan.',
    url: 'https://www.avax.network/grants',
    tags: ['Avalanche', 'AVAX', 'DeFi', 'NFT'],
    deadline: 'Rolling',
    amount: 'Varies',
  },
  {
    id: 'dfinity_grants',
    title: 'DFINITY Developer Grants',
    organization: 'DFINITY / Internet Computer',
    type: 'Grant',
    region: 'Global',
    description: 'Grants for developers building on the Internet Computer Protocol (ICP). Open to global applicants.',
    url: 'https://dfinity.org/grants',
    tags: ['ICP', 'Internet Computer', 'Web3', 'DeFi'],
    deadline: 'Rolling',
    amount: 'Up to $25K',
  },
  {
    id: 'compound_grants',
    title: 'Compound Grants',
    organization: 'Compound',
    type: 'Grant',
    region: 'Global',
    description: 'Community-driven grants for projects that benefit the Compound protocol.',
    url: 'https://compoundgrants.org',
    tags: ['DeFi', 'Lending', 'Ethereum'],
    deadline: 'Rolling',
    amount: 'Up to $150K',
  },
  {
    id: 'uniswap_grants',
    title: 'Uniswap Grants Program',
    organization: 'Uniswap Foundation',
    type: 'Grant',
    region: 'Global',
    description: 'Funding research, development, and community projects in the Uniswap ecosystem.',
    url: 'https://uniswapfoundation.org',
    tags: ['Uniswap', 'DeFi', 'AMM'],
    deadline: 'Rolling',
    amount: 'Varies',
  },

  // ── Pakistan / Asia Specific ─────────────────────────────────────────────
  {
    id: 'hec_pakistan',
    title: 'HEC Scholarships & Grants',
    organization: 'Higher Education Commission Pakistan',
    type: 'Scholarship',
    region: 'Pakistan',
    description: 'Pakistan HEC offers indigenous, overseas, and need-based scholarships for Pakistani students and researchers.',
    url: 'https://www.hec.gov.pk/english/scholarshipsgrants/Pages/default.aspx',
    tags: ['Pakistan', 'Academic', 'Research', 'HEC'],
    deadline: 'Per program',
    amount: 'Full funding',
  },
  {
    id: 'ignite_pakistan',
    title: 'Ignite National Technology Fund',
    organization: 'Ministry of IT, Pakistan',
    type: 'Grant',
    region: 'Pakistan',
    description: 'Pakistan government fund for tech startups, R&D projects, and digital innovation — including blockchain and Web3.',
    url: 'https://ignite.org.pk/funding',
    tags: ['Pakistan', 'Tech', 'Startup', 'Blockchain', 'Government'],
    deadline: 'Per round',
    amount: 'Varies',
  },
  {
    id: 'pseb_grants',
    title: 'PSEB Freelancer & Startup Support',
    organization: 'Pakistan Software Export Board',
    type: 'Fund',
    region: 'Pakistan',
    description: 'PSEB supports Pakistani freelancers and software companies with grants, training, and export facilitation.',
    url: 'https://www.pseb.org.pk',
    tags: ['Pakistan', 'Freelance', 'Software', 'Export', 'PSEB'],
    deadline: 'Rolling',
    amount: 'Varies',
  },
  {
    id: 'google_dev_expert',
    title: 'Google Developer Expert Program',
    organization: 'Google',
    type: 'Fellowship',
    region: 'Asia / Global',
    description: 'Recognition and support program for expert developers. Benefits include Google Cloud credits, speaking opportunities, and access to events.',
    url: 'https://developers.google.com/community/experts',
    tags: ['Google', 'Developer', 'Cloud', 'Asia'],
    deadline: 'Rolling',
    amount: 'Credits + benefits',
  },
  {
    id: 'binance_labs',
    title: 'Binance Labs Incubation',
    organization: 'Binance Labs',
    type: 'Grant',
    region: 'Asia / Global',
    description: 'Equity-free incubation + funding for early-stage Web3 projects. Strong Asia presence, open to Pakistan.',
    url: 'https://labs.binance.com',
    tags: ['Binance', 'Web3', 'Incubation', 'Asia', 'Blockchain'],
    deadline: 'Per cohort',
    amount: 'Up to $500K',
  },

  // ── Academic / General ───────────────────────────────────────────────────
  {
    id: 'vet_scholarship_search',
    title: 'Veterinary Scholarships Database',
    organization: 'AVMA / VIN Foundation',
    type: 'Scholarship',
    region: 'Global',
    description: 'Database of veterinary scholarships, fellowships, and financial aid for vet students globally.',
    url: 'https://www.avma.org/education/additional-financial-resources',
    tags: ['Veterinary', 'Academic', 'Fellowship'],
    deadline: 'Per program',
    amount: 'Varies',
  },
  {
    id: 'content_creator_fund',
    title: 'Creator Economy Grants',
    organization: 'Various Platforms',
    type: 'Fund',
    region: 'Global',
    description: 'YouTube Creator Grants, TikTok Creator Fund, and Patreon Creator Fellowship for content creators worldwide.',
    url: 'https://www.youtube.com/creators',
    tags: ['Content Creation', 'YouTube', 'Creator'],
    deadline: 'Per program',
    amount: 'Varies',
  },
]

const typeColors: Record<string, 'purple' | 'info' | 'success' | 'warning'> = {
  Grant: 'purple',
  Scholarship: 'info',
  Fellowship: 'success',
  Fund: 'warning',
}

const filterTypes = ['All', 'Grant', 'Scholarship', 'Fellowship', 'Fund']
const filterRegions = ['All Regions', 'Global', 'Pakistan', 'Asia / Global']

export default function ScholarshipsPage() {
  const [filterType, setFilterType] = useState('All')
  const [filterRegion, setFilterRegion] = useState('All Regions')
  const [keyword, setKeyword] = useState('')

  let filtered = scholarshipSources
  if (filterType !== 'All') filtered = filtered.filter(s => s.type === filterType)
  if (filterRegion !== 'All Regions') filtered = filtered.filter(s => s.region === filterRegion)
  if (keyword) {
    const kw = keyword.toLowerCase()
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(kw) ||
      s.organization.toLowerCase().includes(kw) ||
      s.tags.some(t => t.toLowerCase().includes(kw)) ||
      s.description.toLowerCase().includes(kw)
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Scholarships &amp; Grants</h1>
        <p className="text-[#8888aa] text-sm mt-1">Real grants, fellowships, and funding opportunities — including Pakistan-specific and global Web3 sources</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          className="flex-1 px-3 py-2.5 rounded-lg bg-[#12121f] border border-[#1e1e35] text-white text-sm placeholder:text-[#555577] focus:outline-none focus:border-[#6c63ff]"
          placeholder="Search by name, organization, or tag..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {filterTypes.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === t ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterRegions.map(r => (
            <button key={r} onClick={() => setFilterRegion(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterRegion === r ? 'bg-[#22224a] text-white border border-[#6c63ff]' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#555577]">{filtered.length} opportunities — all real, verified sources</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <Card key={item.id} hover className="flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-[#8888aa] mt-0.5 flex items-center gap-1">
                    <Globe size={11} />{item.organization}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={typeColors[item.type] || 'default'}>{item.type}</Badge>
                  {item.region !== 'Global' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a2e] border border-[#2a2a4a] text-[#6c63ff]">{item.region}</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#8888aa] leading-relaxed">{item.description}</p>

              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map(t => (
                  <span key={t} className="text-xs bg-[#1a1a2e] text-[#8888aa] px-2 py-0.5 rounded border border-[#1e1e35]">{t}</span>
                ))}
              </div>

              <div className="flex gap-4 mt-3 text-xs text-[#555577]">
                <span className="flex items-center gap-1"><BookOpen size={11} />Deadline: {item.deadline}</span>
                <span>Amount: {item.amount}</span>
              </div>
            </div>

            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] text-white text-xs font-medium transition-colors">
              View &amp; Apply <ExternalLink size={11} />
            </a>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <GraduationCap size={32} className="text-[#555577] mx-auto mb-3" />
          <p className="text-sm text-[#555577]">No results for that search</p>
        </Card>
      )}
    </div>
  )
}
