export interface PromptTemplate {
  id: string
  name: string
  category: 'cv' | 'resume' | 'cover_letter' | 'linkedin'
  sector: string
  description: string
  prompt: string
  tone: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'web3-resume',
    name: 'Web3 Resume',
    category: 'resume',
    sector: 'blockchain',
    description: 'Optimized for blockchain and Web3 roles',
    prompt: 'Generate a powerful, ATS-friendly resume for a Web3/blockchain professional. Focus on on-chain achievements, DeFi/NFT/DAO experience, and technical blockchain skills. Write in active voice, use strong action verbs, quantify impact wherever possible. Sound like a senior Web3 professional wrote this, not an AI.',
    tone: 'confident',
  },
  {
    id: 'blockchain-bd-resume',
    name: 'Blockchain BD Resume',
    category: 'resume',
    sector: 'blockchain',
    description: 'Business development in crypto/Web3 space',
    prompt: 'Create a business development resume for the blockchain/crypto industry. Emphasize partnership deals closed, ecosystem growth, community building, and revenue generated. Highlight Web3 network and protocol relationships. Write naturally with a growth-focused tone.',
    tone: 'professional',
  },
  {
    id: 'content-creator-resume',
    name: 'Content Creator Resume',
    category: 'resume',
    sector: 'content',
    description: 'For content creators and social media professionals',
    prompt: 'Build a resume for a content creator/social media professional. Focus on audience growth metrics, engagement rates, platform expertise, brand collaborations, and content performance. Include measurable results. Write in a creative but professional tone.',
    tone: 'creative',
  },
  {
    id: 'human-cover-letter',
    name: 'Human Cover Letter',
    category: 'cover_letter',
    sector: 'general',
    description: 'Sounds genuinely human, warm and personalized',
    prompt: 'Write a cover letter that sounds like a real, thoughtful human wrote it — not AI. Be specific about why this company and role matter. Show genuine enthusiasm without being generic. Use natural sentence variation. Avoid cliches like passionate about, fast-paced, team player. Make it memorable and authentic.',
    tone: 'conversational',
  },
  {
    id: 'web3-cover-letter',
    name: 'Web3 Cover Letter',
    category: 'cover_letter',
    sector: 'blockchain',
    description: 'Tailored for Web3 companies and DAOs',
    prompt: 'Write a cover letter for a Web3/crypto/blockchain company. Show deep understanding of the space — mention relevant protocols, trends, or the company mission specifically. Sound like someone who lives and breathes Web3, not someone who just learned what a blockchain is. Be direct, confident, and value-focused.',
    tone: 'confident',
  },
  {
    id: 'ats-optimizer',
    name: 'ATS Optimizer',
    category: 'resume',
    sector: 'general',
    description: 'Maximize ATS keyword matching',
    prompt: 'Rewrite this resume to maximize ATS (Applicant Tracking System) compatibility. Extract all keywords from the job description and naturally incorporate them. Maintain readability while ensuring critical keywords appear. Do not stuff keywords unnaturally — integrate them into real achievement statements.',
    tone: 'professional',
  },
  {
    id: 'scholarship-sop',
    name: 'Scholarship SOP',
    category: 'cv',
    sector: 'academic',
    description: 'Statement of purpose for scholarships',
    prompt: 'Write a compelling statement of purpose / personal statement for a scholarship application. Be authentic, specific about academic goals, research interests, and how this scholarship advances those goals. Show intellectual curiosity and concrete plans. Sound like a passionate, focused graduate student.',
    tone: 'academic',
  },
  {
    id: 'linkedin-summary',
    name: 'LinkedIn Summary',
    category: 'linkedin',
    sector: 'general',
    description: 'Compelling LinkedIn About section',
    prompt: 'Write a LinkedIn About section that grabs attention in the first line, tells a compelling professional story, and ends with a clear call to action. Write in first person, sound human and approachable, avoid corporate buzzwords. Make it memorable within 200 words.',
    tone: 'conversational',
  },
  {
    id: 'veterinary-resume',
    name: 'Veterinary Resume',
    category: 'resume',
    sector: 'veterinary',
    description: 'For veterinary professionals',
    prompt: 'Create a professional resume for a veterinary professional. Highlight clinical skills, species experience, surgical procedures, diagnostic abilities, and client communication. Include any research, publications, or specialized training. Professional and clinical in tone.',
    tone: 'professional',
  },
  {
    id: 'marketing-growth-resume',
    name: 'Marketing & Growth Resume',
    category: 'resume',
    sector: 'marketing',
    description: 'For marketing and growth roles',
    prompt: 'Build a resume for a marketing/growth professional. Lead with the most impactful metrics — traffic grown, conversions improved, campaigns managed, budgets handled. Show both strategy and execution skills. Write in a results-driven, direct style.',
    tone: 'confident',
  },
]
