'use client'
import { useState, useEffect } from 'react'
import {
  getProfile, saveProfile, getExperiences, saveExperiences,
  getEducation, saveEducation, getSkills, saveSkills,
  getCertifications, saveCertifications, getProjects, saveProjects,
  uid,
  type Profile, type Experience, type Education, type Skill, type Certification, type Project,
} from '@/lib/storage'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { Upload, Plus, Trash2, User, Briefcase, GraduationCap, Award, Code, Link } from 'lucide-react'

const tabs = ['Personal', 'Experience', 'Education', 'Skills', 'Certifications', 'Projects', 'Import']

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Personal')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    full_name: '', professional_title: '', email: '', phone: '', country: '', city: '',
    nationality: '', linkedin_url: '', portfolio_url: '', github_url: '', twitter_url: '',
    telegram_url: '', wallet_address: '', professional_summary: '', target_role: '',
    years_experience: 0, work_type: 'remote',
  })
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [linkedinText, setLinkedinText] = useState('')
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    setProfile(getProfile())
    setExperiences(getExperiences())
    setEducation(getEducation())
    setSkills(getSkills())
    setCertifications(getCertifications())
    setProjects(getProjects())
  }, [])

  const handleSaveProfile = () => {
    setSaving(true)
    saveProfile(profile)
    toast.success('Profile saved!')
    setSaving(false)
  }

  const handleSaveExperiences = () => {
    setSaving(true)
    saveExperiences(experiences)
    toast.success('Experience saved!')
    setSaving(false)
  }

  const handleSaveEducation = () => {
    setSaving(true)
    saveEducation(education)
    toast.success('Education saved!')
    setSaving(false)
  }

  const handleSaveSkills = () => {
    setSaving(true)
    saveSkills(skills)
    toast.success('Skills saved!')
    setSaving(false)
  }

  const handleSaveCertifications = () => {
    setSaving(true)
    saveCertifications(certifications)
    toast.success('Certifications saved!')
    setSaving(false)
  }

  const handleSaveProjects = () => {
    setSaving(true)
    saveProjects(projects)
    toast.success('Projects saved!')
    setSaving(false)
  }

  const parseLinkedInText = async () => {
    if (!linkedinText.trim()) return toast.error('Paste your LinkedIn profile text first')
    setParsing(true)
    try {
      const res = await fetch('/api/parse-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: linkedinText }),
      })
      const data = await res.json()
      if (data.profile) {
        setProfile(prev => ({ ...prev, ...data.profile }))
        if (data.experiences) setExperiences(data.experiences.map((e: Partial<Experience>) => ({ ...e, id: uid(), created_at: new Date().toISOString() } as Experience)))
        if (data.education) setEducation(data.education.map((e: Partial<Education>) => ({ ...e, id: uid(), created_at: new Date().toISOString() } as Education)))
        if (data.skills) setSkills(data.skills.map((s: Partial<Skill>) => ({ ...s, id: uid(), created_at: new Date().toISOString() } as Skill)))
        toast.success('Profile populated from LinkedIn data!')
        setActiveTab('Personal')
      }
    } catch {
      toast.error('Failed to parse LinkedIn data')
    }
    setParsing(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Hub</h1>
        <p className="text-[#8888aa] text-sm mt-1">Your professional profile powers all CV, resume, and cover letter generation</p>
      </div>

      <div className="flex gap-1 bg-[#12121f] border border-[#1e1e35] rounded-lg p-1 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-[#6c63ff] text-white' : 'text-[#8888aa] hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Personal' && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <User size={18} className="text-[#6c63ff]" />
            <h2 className="font-semibold text-white">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
            <Input label="Professional Title" value={profile.professional_title} onChange={e => setProfile(p => ({ ...p, professional_title: e.target.value }))} placeholder="e.g. Web3 Business Developer" />
            <Input label="Email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
            <Input label="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            <Input label="Country" value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} placeholder="United States" />
            <Input label="City" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="New York" />
            <Input label="LinkedIn URL" value={profile.linkedin_url} onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/yourname" />
            <Input label="Portfolio / Website" value={profile.portfolio_url} onChange={e => setProfile(p => ({ ...p, portfolio_url: e.target.value }))} placeholder="https://yoursite.com" />
            <Input label="GitHub" value={profile.github_url} onChange={e => setProfile(p => ({ ...p, github_url: e.target.value }))} placeholder="https://github.com/username" />
            <Input label="Twitter / X" value={profile.twitter_url} onChange={e => setProfile(p => ({ ...p, twitter_url: e.target.value }))} placeholder="https://x.com/username" />
            <Input label="Telegram" value={profile.telegram_url} onChange={e => setProfile(p => ({ ...p, telegram_url: e.target.value }))} placeholder="@username" />
            <Input label="Wallet Address (Web3)" value={profile.wallet_address} onChange={e => setProfile(p => ({ ...p, wallet_address: e.target.value }))} placeholder="0x..." />
            <Input label="Target Role" value={profile.target_role} onChange={e => setProfile(p => ({ ...p, target_role: e.target.value }))} placeholder="e.g. Web3 BD Manager" />
            <Input label="Years of Experience" type="number" value={String(profile.years_experience)} onChange={e => setProfile(p => ({ ...p, years_experience: parseInt(e.target.value) || 0 }))} placeholder="5" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8888aa]">Work Type Preference</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg bg-[#12121f] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                value={profile.work_type}
                onChange={e => setProfile(p => ({ ...p, work_type: e.target.value }))}
              >
                {['remote', 'hybrid', 'onsite', 'contract', 'freelance', 'full-time', 'part-time'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Textarea label="Professional Summary" value={profile.professional_summary} onChange={e => setProfile(p => ({ ...p, professional_summary: e.target.value }))}
              placeholder="Write a strong 2-4 sentence professional summary..." rows={5} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveProfile} loading={saving}>Save Personal Info</Button>
          </div>
        </Card>
      )}

      {activeTab === 'Experience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Work Experience</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setExperiences(prev => [...prev, {
              id: uid(), company_name: '', role_title: '', employment_type: 'full-time', location: '',
              start_date: '', end_date: '', is_current: false, responsibilities: '', achievements: '',
              tools_used: '', created_at: new Date().toISOString(),
            }])}>
              <Plus size={14} /> Add Experience
            </Button>
          </div>
          {experiences.length === 0 && <Card><p className="text-center text-[#555577] text-sm py-6">No experience added yet.</p></Card>}
          {experiences.map((exp, i) => (
            <Card key={exp.id}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Experience #{i + 1}</span>
                <button onClick={() => setExperiences(prev => prev.filter((_, idx) => idx !== i))} className="text-[#555577] hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Company Name" value={exp.company_name} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, company_name: e.target.value } : x))} placeholder="Company Inc." />
                <Input label="Role Title" value={exp.role_title} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, role_title: e.target.value } : x))} placeholder="Senior Web3 Developer" />
                <Input label="Location" value={exp.location} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, location: e.target.value } : x))} placeholder="Remote / New York" />
                <Input label="Employment Type" value={exp.employment_type} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, employment_type: e.target.value } : x))} placeholder="Full-time" />
                <Input label="Start Date" type="date" value={exp.start_date} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, start_date: e.target.value } : x))} />
                <Input label="End Date (blank if current)" type="date" value={exp.end_date} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, end_date: e.target.value } : x))} />
                <Input label="Tools Used (comma separated)" value={exp.tools_used} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, tools_used: e.target.value } : x))} placeholder="Solidity, React, Hardhat" />
              </div>
              <div className="mt-4 space-y-4">
                <Textarea label="Responsibilities" value={exp.responsibilities} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, responsibilities: e.target.value } : x))} rows={3} />
                <Textarea label="Achievements & Impact" value={exp.achievements} onChange={e => setExperiences(prev => prev.map((x, idx) => idx === i ? { ...x, achievements: e.target.value } : x))} rows={3} />
              </div>
            </Card>
          ))}
          {experiences.length > 0 && <div className="flex justify-end"><Button onClick={handleSaveExperiences} loading={saving}>Save Experience</Button></div>}
        </div>
      )}

      {activeTab === 'Education' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Education</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEducation(prev => [...prev, {
              id: uid(), degree: '', institution: '', location: '', start_date: '', end_date: '',
              grade: '', thesis: '', created_at: new Date().toISOString(),
            }])}>
              <Plus size={14} /> Add Education
            </Button>
          </div>
          {education.length === 0 && <Card><p className="text-center text-[#555577] text-sm py-6">No education added yet.</p></Card>}
          {education.map((ed, i) => (
            <Card key={ed.id}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Education #{i + 1}</span>
                <button onClick={() => setEducation(prev => prev.filter((_, idx) => idx !== i))} className="text-[#555577] hover:text-red-400"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Degree" value={ed.degree} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, degree: e.target.value } : x))} placeholder="Bachelor of Science" />
                <Input label="Institution" value={ed.institution} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, institution: e.target.value } : x))} placeholder="University Name" />
                <Input label="Location" value={ed.location} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, location: e.target.value } : x))} placeholder="City, Country" />
                <Input label="Grade / CGPA" value={ed.grade} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, grade: e.target.value } : x))} placeholder="3.8/4.0" />
                <Input label="Start Date" type="date" value={ed.start_date} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, start_date: e.target.value } : x))} />
                <Input label="End Date" type="date" value={ed.end_date} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, end_date: e.target.value } : x))} />
              </div>
              <div className="mt-4">
                <Textarea label="Achievements / Thesis" value={ed.thesis} onChange={e => setEducation(prev => prev.map((x, idx) => idx === i ? { ...x, thesis: e.target.value } : x))} rows={2} />
              </div>
            </Card>
          ))}
          {education.length > 0 && <div className="flex justify-end"><Button onClick={handleSaveEducation} loading={saving}>Save Education</Button></div>}
        </div>
      )}

      {activeTab === 'Skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Skills</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setSkills(prev => [...prev, { id: uid(), name: '', category: 'technical', level: 'intermediate', created_at: new Date().toISOString() }])}>
              <Plus size={14} /> Add Skill
            </Button>
          </div>
          <Card>
            <div className="space-y-3">
              {skills.length === 0 && <p className="text-center text-[#555577] text-sm py-4">No skills added yet.</p>}
              {skills.map((skill, i) => (
                <div key={skill.id} className="flex gap-3 items-center">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                    value={skill.name}
                    onChange={e => setSkills(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Skill name (e.g. Solidity, DeFi)"
                  />
                  <select className="px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                    value={skill.category} onChange={e => setSkills(prev => prev.map((x, idx) => idx === i ? { ...x, category: e.target.value } : x))}>
                    {['technical', 'soft', 'language', 'tool', 'blockchain', 'marketing'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                    value={skill.level} onChange={e => setSkills(prev => prev.map((x, idx) => idx === i ? { ...x, level: e.target.value } : x))}>
                    {['beginner', 'intermediate', 'advanced', 'expert'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={() => setSkills(prev => prev.filter((_, idx) => idx !== i))} className="text-[#555577] hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </Card>
          {skills.length > 0 && <div className="flex justify-end"><Button onClick={handleSaveSkills} loading={saving}>Save Skills</Button></div>}
        </div>
      )}

      {activeTab === 'Certifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Certifications</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setCertifications(prev => [...prev, { id: uid(), name: '', issuer: '', issue_date: '', credential_id: '', credential_url: '', created_at: new Date().toISOString() }])}>
              <Plus size={14} /> Add Certification
            </Button>
          </div>
          {certifications.length === 0 && <Card><p className="text-center text-[#555577] text-sm py-6">No certifications added yet.</p></Card>}
          {certifications.map((cert, i) => (
            <Card key={cert.id}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Certification #{i + 1}</span>
                <button onClick={() => setCertifications(prev => prev.filter((_, idx) => idx !== i))} className="text-[#555577] hover:text-red-400"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Certificate Name" value={cert.name} onChange={e => setCertifications(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Certified Blockchain Developer" />
                <Input label="Issuing Organization" value={cert.issuer} onChange={e => setCertifications(prev => prev.map((x, idx) => idx === i ? { ...x, issuer: e.target.value } : x))} placeholder="Coursera / Udemy" />
                <Input label="Issue Date" type="date" value={cert.issue_date} onChange={e => setCertifications(prev => prev.map((x, idx) => idx === i ? { ...x, issue_date: e.target.value } : x))} />
                <Input label="Credential ID" value={cert.credential_id} onChange={e => setCertifications(prev => prev.map((x, idx) => idx === i ? { ...x, credential_id: e.target.value } : x))} placeholder="ABC123" />
                <Input label="Credential URL" value={cert.credential_url} onChange={e => setCertifications(prev => prev.map((x, idx) => idx === i ? { ...x, credential_url: e.target.value } : x))} placeholder="https://..." className="md:col-span-2" />
              </div>
            </Card>
          ))}
          {certifications.length > 0 && <div className="flex justify-end"><Button onClick={handleSaveCertifications} loading={saving}>Save Certifications</Button></div>}
        </div>
      )}

      {activeTab === 'Projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Projects</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setProjects(prev => [...prev, { id: uid(), name: '', role: '', description: '', technologies: '', impact: '', project_url: '', created_at: new Date().toISOString() }])}>
              <Plus size={14} /> Add Project
            </Button>
          </div>
          {projects.length === 0 && <Card><p className="text-center text-[#555577] text-sm py-6">No projects added yet.</p></Card>}
          {projects.map((proj, i) => (
            <Card key={proj.id}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Project #{i + 1}</span>
                <button onClick={() => setProjects(prev => prev.filter((_, idx) => idx !== i))} className="text-[#555577] hover:text-red-400"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Project Name" value={proj.name} onChange={e => setProjects(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="DeFi Yield Aggregator" />
                <Input label="Your Role" value={proj.role} onChange={e => setProjects(prev => prev.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))} placeholder="Lead Developer" />
                <Input label="Technologies (comma separated)" value={proj.technologies} onChange={e => setProjects(prev => prev.map((x, idx) => idx === i ? { ...x, technologies: e.target.value } : x))} placeholder="Solidity, React, Ethers.js" />
                <Input label="Project URL" value={proj.project_url} onChange={e => setProjects(prev => prev.map((x, idx) => idx === i ? { ...x, project_url: e.target.value } : x))} placeholder="https://github.com/..." />
              </div>
              <div className="mt-4 space-y-3">
                <Textarea label="Description" value={proj.description} onChange={e => setProjects(prev => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} rows={2} />
                <Textarea label="Impact / Results" value={proj.impact} onChange={e => setProjects(prev => prev.map((x, idx) => idx === i ? { ...x, impact: e.target.value } : x))} rows={2} />
              </div>
            </Card>
          ))}
          {projects.length > 0 && <div className="flex justify-end"><Button onClick={handleSaveProjects} loading={saving}>Save Projects</Button></div>}
        </div>
      )}

      {activeTab === 'Import' && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Link size={18} className="text-[#6c63ff]" />
            <h2 className="font-semibold text-white">Import from LinkedIn</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-4 text-sm text-[#8888aa]">
              <p className="font-medium text-white mb-2">How to import your LinkedIn profile:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Go to your LinkedIn profile</li>
                <li>Copy all the text from your profile page (Ctrl+A, Ctrl+C)</li>
                <li>Paste it in the box below</li>
                <li>Click &quot;Parse &amp; Import&quot; — AI will extract and fill your profile automatically</li>
              </ol>
            </div>
            <Textarea label="Paste your LinkedIn profile text here" value={linkedinText} onChange={e => setLinkedinText(e.target.value)}
              placeholder="Paste the full text copied from your LinkedIn profile page..." rows={12} />
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#555577]">Your data is processed privately and never stored externally</p>
              <Button onClick={parseLinkedInText} loading={parsing}>
                <Upload size={15} /> Parse &amp; Import Profile
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
