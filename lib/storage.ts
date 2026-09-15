// localStorage-based data layer — no backend required

export interface Profile {
  full_name: string
  professional_title: string
  email: string
  phone: string
  country: string
  city: string
  nationality: string
  linkedin_url: string
  portfolio_url: string
  github_url: string
  twitter_url: string
  telegram_url: string
  wallet_address: string
  professional_summary: string
  target_role: string
  years_experience: number
  work_type: string
}

export interface Experience {
  id: string
  company_name: string
  role_title: string
  employment_type: string
  location: string
  start_date: string
  end_date: string
  is_current: boolean
  responsibilities: string
  achievements: string
  tools_used: string
  created_at: string
}

export interface Education {
  id: string
  degree: string
  institution: string
  location: string
  start_date: string
  end_date: string
  grade: string
  thesis: string
  created_at: string
}

export interface Skill {
  id: string
  name: string
  category: string
  level: string
  created_at: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  issue_date: string
  credential_id: string
  credential_url: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  role: string
  description: string
  technologies: string
  impact: string
  project_url: string
  created_at: string
}

export interface GeneratedDocument {
  id: string
  type: 'cv' | 'resume' | 'cover_letter'
  title: string
  content: string
  job_title: string
  company_name: string
  tone: string
  ai_score?: number
  created_at: string
}

export interface SavedOpportunity {
  id: string
  opportunity_id: string
  opportunity_type: 'job' | 'collaboration' | 'scholarship' | 'promotion'
  title: string
  company: string
  url: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  deadline?: string
  notes?: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

const K = {
  profile: 'w3ch_profile',
  experiences: 'w3ch_experiences',
  education: 'w3ch_education',
  skills: 'w3ch_skills',
  certifications: 'w3ch_certifications',
  projects: 'w3ch_projects',
  documents: 'w3ch_documents',
  opportunities: 'w3ch_opportunities',
} as const

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function uid(): string {
  return crypto.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2))
}

const defaultProfile: Profile = {
  full_name: '', professional_title: '', email: '', phone: '',
  country: '', city: '', nationality: '', linkedin_url: '',
  portfolio_url: '', github_url: '', twitter_url: '', telegram_url: '',
  wallet_address: '', professional_summary: '', target_role: '',
  years_experience: 0, work_type: 'remote',
}

export function getProfile(): Profile {
  return read<Profile>(K.profile, defaultProfile)
}
export function saveProfile(data: Profile): void {
  write(K.profile, data)
}

export function getExperiences(): Experience[] {
  return read<Experience[]>(K.experiences, [])
}
export function saveExperiences(items: Experience[]): void {
  write(K.experiences, items)
}

export function getEducation(): Education[] {
  return read<Education[]>(K.education, [])
}
export function saveEducation(items: Education[]): void {
  write(K.education, items)
}

export function getSkills(): Skill[] {
  return read<Skill[]>(K.skills, [])
}
export function saveSkills(items: Skill[]): void {
  write(K.skills, items)
}

export function getCertifications(): Certification[] {
  return read<Certification[]>(K.certifications, [])
}
export function saveCertifications(items: Certification[]): void {
  write(K.certifications, items)
}

export function getProjects(): Project[] {
  return read<Project[]>(K.projects, [])
}
export function saveProjects(items: Project[]): void {
  write(K.projects, items)
}

export function getDocuments(): GeneratedDocument[] {
  return read<GeneratedDocument[]>(K.documents, [])
}
export function addDocument(doc: Omit<GeneratedDocument, 'id' | 'created_at'>): GeneratedDocument {
  const newDoc: GeneratedDocument = { ...doc, id: uid(), created_at: new Date().toISOString() }
  write(K.documents, [newDoc, ...getDocuments()])
  return newDoc
}
export function deleteDocument(id: string): void {
  write(K.documents, getDocuments().filter(d => d.id !== id))
}

export function getOpportunities(): SavedOpportunity[] {
  return read<SavedOpportunity[]>(K.opportunities, [])
}
export function addOpportunity(opp: Omit<SavedOpportunity, 'id' | 'created_at' | 'updated_at'>): void {
  const newOpp: SavedOpportunity = {
    ...opp,
    id: uid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  write(K.opportunities, [newOpp, ...getOpportunities()])
}
export function updateOpportunity(id: string, updates: Partial<SavedOpportunity>): void {
  write(K.opportunities, getOpportunities().map(o =>
    o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
  ))
}
export function deleteOpportunity(id: string): void {
  write(K.opportunities, getOpportunities().filter(o => o.id !== id))
}

// Returns the full profile context to send to /api/generate
export function getFullProfile() {
  return {
    profile: getProfile(),
    experiences: getExperiences(),
    education: getEducation(),
    skills: getSkills(),
    certifications: getCertifications(),
    projects: getProjects(),
  }
}
