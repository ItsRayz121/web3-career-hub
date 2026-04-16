export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  professional_title: string
  email: string
  phone: string
  country: string
  city: string
  nationality?: string
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
  twitter_url?: string
  telegram_url?: string
  wallet_address?: string
  professional_summary: string
  target_role: string
  years_experience: number
  work_type: 'remote' | 'hybrid' | 'onsite' | 'contract' | 'freelance' | 'full-time' | 'part-time'
  profile_image_url?: string
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  user_id: string
  company_name: string
  role_title: string
  employment_type: string
  location: string
  start_date: string
  end_date?: string
  is_current: boolean
  responsibilities: string
  achievements: string
  tools_used: string[]
  industry_tags: string[]
}

export interface Education {
  id: string
  user_id: string
  degree: string
  institution: string
  location: string
  start_date: string
  end_date?: string
  grade?: string
  achievements?: string
  thesis?: string
}

export interface Skill {
  id: string
  user_id: string
  name: string
  category: 'technical' | 'soft' | 'language' | 'tool' | 'blockchain' | 'marketing'
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface Certification {
  id: string
  user_id: string
  name: string
  issuer: string
  issue_date: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string
  file_url?: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  role: string
  description: string
  technologies: string[]
  impact: string
  project_url?: string
}

export interface GeneratedDocument {
  id: string
  user_id: string
  type: 'cv' | 'resume' | 'cover_letter'
  title: string
  content: string
  job_title?: string
  company_name?: string
  tone: string
  ai_score?: number
  created_at: string
  updated_at: string
}

export interface Job {
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
  experience_level?: string
  salary?: string
}

export interface SavedOpportunity {
  id: string
  user_id: string
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
}

export interface PromptTemplate {
  id: string
  name: string
  category: 'cv' | 'resume' | 'cover_letter' | 'ats' | 'linkedin'
  sector: string
  description: string
  prompt: string
  tone: string
}
