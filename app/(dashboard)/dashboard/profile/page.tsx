'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [profile, setProfile] = useState<Record<string, string>>({
    full_name: '', professional_title: '', email: '', phone: '', country: '', city: '',
    nationality: '', linkedin_url: '', portfolio_url: '', github_url: '', twitter_url: '',
    telegram_url: '', wallet_address: '', professional_summary: '', target_role: '',
    years_experience: '', work_type: 'remote',
  })

  const [experiences, setExperiences] = useState<Record<string, string>[]>([])
  const [education, setEducation] = useState<Record<string, string>[]>([])
  const [skills, setSkills] = useState<Record<string, string>[]>([])
  const [certifications, setCertifications] = useState<Record<string, string>[]>([])
  const [projects, setProjects] = useState<Record<string, string>[]>([])
  const [linkedinText, setLinkedinText] = useState('')
  const [parsing, setParsing] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [pRes, eRes, edRes, sRes, cRes, prRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('experiences').select('*').eq('user_id', user.id),
      supabase.from('education').select('*').eq('user_id', user.id),
      supabase.from('skills').select('*').eq('user_id', user.id),
      supabase.from('certifications').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
    ])

    if (pRes.data) setProfile({ ...profile, ...pRes.data, years_experience: String(pRes.data.years_experience ?? '') })
    if (eRes.data) setExperiences(eRes.data.map((e: Record<string, unknown>) => ({ ...e, start_date: String(e.start_date ?? ''), end_date: String(e.end_date ?? ''), tools_used: Array.isArray(e.tools_used) ? e.tools_used.join(', ') : '' })))
    if (edRes.data) setEducation(edRes.data.map((e: Record<string, unknown>) => ({ ...e, start_date: String(e.start_date ?? ''), end_date: String(e.end_date ?? '') })))
    if (sRes.data) setSkills(sRes.data as Record<string, string>[])
    if (cRes.data) setCertifications(cRes.data.map((c: Record<string, unknown>) => ({ ...c, issue_date: String(c.issue_date ?? '') })))
    if (prRes.data) setProjects(prRes.data.map((p: Record<string, unknown>) => ({ ...p, technologies: Array.isArray(p.technologies) ? (p.technologies as string[]).join(', ') : '' })))
  }

  const saveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').upsert({
      ...profile,
      user_id: user.id,
      years_experience: parseInt(profile.years_experience) || 0,
      updated_at: new Date().toISOString(),
    })

    if (error) toast.error('Failed to save profile')
    else toast.success('Profile saved!')
    setSaving(false)
  }

  const saveExperiences = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('experiences').delete().eq('user_id', user.id)
    if (experiences.length > 0) {
      const rows = experiences.map(e => ({
        ...e, user_id: user.id,
        tools_used: e.tools_used ? e.tools_used.split(',').map((s: string) => s.trim()) : [],
        industry_tags: [],
      }))
      const { error } = await supabase.from('experiences').insert(rows)
      if (error) toast.error('Failed to save experiences')
      else toast.success('Experience saved!')
    } else {
      toast.success('Experience cleared!')
    }
    setSaving(false)
  }

  const saveSkills = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('skills').delete().eq('user_id', user.id)
    if (skills.length > 0) {
      const { error } = await supabase.from('skills').insert(skills.map(s => ({ ...s, user_id: user.id })))
      if (error) toast.error('Failed to save skills')
      else toast.success('Skills saved!')
    }
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
        if (data.experiences) setExperiences(data.experiences)
        if (data.education) setEducation(data.education)
        if (data.skills) setSkills(data.skills)
        toast.success('Profile populated from LinkedIn data!')
        setActiveTab('Personal')
      }
    } catch {
      toast.error('Failed to parse LinkedIn data')
    }
    setParsing(false)
  }

  const addItem = (setter: React.Dispatch<React.SetStateAction<Record<string, string>[]>>, template: Record<string, string>) => {
    setter(prev => [...prev, { ...template, id: Date.now().toString() }])
  }

  const updateItem = (setter: React.Dispatch<React.SetStateAction<Record<string, string>[]>>, index: number, field: string, value: string) => {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeItem = (setter: React.Dispatch<React.SetStateAction<Record<string, string>[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Hub</h1>
        <p className="text-[#8888aa] text-sm mt-1">Your professional profile powers all CV, resume, and cover letter generation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#12121f] border border-[#1e1e35] rounded-lg p-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-[#6c63ff] text-white' : 'text-[#8888aa] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Personal Tab */}
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
            <Input label="Years of Experience" type="number" value={profile.years_experience} onChange={e => setProfile(p => ({ ...p, years_experience: e.target.value }))} placeholder="5" />
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
            <Textarea
              label="Professional Summary"
              value={profile.professional_summary}
              onChange={e => setProfile(p => ({ ...p, professional_summary: e.target.value }))}
              placeholder="Write a strong 2-4 sentence professional summary highlighting your expertise, focus areas, and key achievements..."
              rows={5}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile} loading={saving}>Save Personal Info</Button>
          </div>
        </Card>
      )}

      {/* Experience Tab */}
      {activeTab === 'Experience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Work Experience</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => addItem(setExperiences, {
              company_name: '', role_title: '', employment_type: 'full-time',
              location: '', start_date: '', end_date: '', is_current: 'false',
              responsibilities: '', achievements: '', tools_used: '',
            })}>
              <Plus size={14} /> Add Experience
            </Button>
          </div>

          {experiences.length === 0 && (
            <Card>
              <p className="text-center text-[#555577] text-sm py-6">No experience added yet. Click &quot;Add Experience&quot; to start.</p>
            </Card>
          )}

          {experiences.map((exp, i) => (
            <Card key={i}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Experience #{i + 1}</span>
                <button onClick={() => removeItem(setExperiences, i)} className="text-[#555577] hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Company Name" value={exp.company_name} onChange={e => updateItem(setExperiences, i, 'company_name', e.target.value)} placeholder="Company Inc." />
                <Input label="Role Title" value={exp.role_title} onChange={e => updateItem(setExperiences, i, 'role_title', e.target.value)} placeholder="Senior Web3 Developer" />
                <Input label="Location" value={exp.location} onChange={e => updateItem(setExperiences, i, 'location', e.target.value)} placeholder="Remote / New York" />
                <Input label="Employment Type" value={exp.employment_type} onChange={e => updateItem(setExperiences, i, 'employment_type', e.target.value)} placeholder="Full-time" />
                <Input label="Start Date" type="date" value={exp.start_date} onChange={e => updateItem(setExperiences, i, 'start_date', e.target.value)} />
                <Input label="End Date (leave blank if current)" type="date" value={exp.end_date} onChange={e => updateItem(setExperiences, i, 'end_date', e.target.value)} />
                <Input label="Tools Used (comma separated)" value={exp.tools_used} onChange={e => updateItem(setExperiences, i, 'tools_used', e.target.value)} placeholder="Solidity, React, Hardhat, Web3.js" />
              </div>
              <div className="mt-4 space-y-4">
                <Textarea label="Responsibilities" value={exp.responsibilities} onChange={e => updateItem(setExperiences, i, 'responsibilities', e.target.value)} placeholder="Describe your key responsibilities..." rows={3} />
                <Textarea label="Achievements & Impact" value={exp.achievements} onChange={e => updateItem(setExperiences, i, 'achievements', e.target.value)} placeholder="Quantify your impact: grew X by Y%, shipped Z, saved $W..." rows={3} />
              </div>
            </Card>
          ))}

          {experiences.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={saveExperiences} loading={saving}>Save Experience</Button>
            </div>
          )}
        </div>
      )}

      {/* Education Tab */}
      {activeTab === 'Education' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Education</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => addItem(setEducation, {
              degree: '', institution: '', location: '', start_date: '', end_date: '', grade: '', achievements: '', thesis: '',
            })}>
              <Plus size={14} /> Add Education
            </Button>
          </div>

          {education.length === 0 && (
            <Card>
              <p className="text-center text-[#555577] text-sm py-6">No education added yet.</p>
            </Card>
          )}

          {education.map((ed, i) => (
            <Card key={i}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Education #{i + 1}</span>
                <button onClick={() => removeItem(setEducation, i)} className="text-[#555577] hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Degree" value={ed.degree} onChange={e => updateItem(setEducation, i, 'degree', e.target.value)} placeholder="Bachelor of Science" />
                <Input label="Institution" value={ed.institution} onChange={e => updateItem(setEducation, i, 'institution', e.target.value)} placeholder="University Name" />
                <Input label="Location" value={ed.location} onChange={e => updateItem(setEducation, i, 'location', e.target.value)} placeholder="City, Country" />
                <Input label="Grade / CGPA" value={ed.grade} onChange={e => updateItem(setEducation, i, 'grade', e.target.value)} placeholder="3.8/4.0" />
                <Input label="Start Date" type="date" value={ed.start_date} onChange={e => updateItem(setEducation, i, 'start_date', e.target.value)} />
                <Input label="End Date" type="date" value={ed.end_date} onChange={e => updateItem(setEducation, i, 'end_date', e.target.value)} />
              </div>
              <div className="mt-4">
                <Textarea label="Achievements / Thesis" value={ed.thesis || ed.achievements} onChange={e => updateItem(setEducation, i, 'thesis', e.target.value)} placeholder="Thesis, notable projects, awards..." rows={2} />
              </div>
            </Card>
          ))}

          {education.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={async () => {
                setSaving(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                await supabase.from('education').delete().eq('user_id', user.id)
                if (education.length > 0) await supabase.from('education').insert(education.map(e => ({ ...e, user_id: user.id })))
                toast.success('Education saved!')
                setSaving(false)
              }} loading={saving}>Save Education</Button>
            </div>
          )}
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'Skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Skills</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => addItem(setSkills, { name: '', category: 'technical', level: 'intermediate' })}>
              <Plus size={14} /> Add Skill
            </Button>
          </div>

          <Card>
            <div className="space-y-3">
              {skills.length === 0 && (
                <p className="text-center text-[#555577] text-sm py-4">No skills added yet.</p>
              )}
              {skills.map((skill, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                    value={skill.name}
                    onChange={e => updateItem(setSkills, i, 'name', e.target.value)}
                    placeholder="Skill name (e.g. Solidity, DeFi, Content Writing)"
                  />
                  <select
                    className="px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                    value={skill.category}
                    onChange={e => updateItem(setSkills, i, 'category', e.target.value)}
                  >
                    {['technical', 'soft', 'language', 'tool', 'blockchain', 'marketing'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    className="px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                    value={skill.level}
                    onChange={e => updateItem(setSkills, i, 'level', e.target.value)}
                  >
                    {['beginner', 'intermediate', 'advanced', 'expert'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(setSkills, i)} className="text-[#555577] hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {skills.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={saveSkills} loading={saving}>Save Skills</Button>
            </div>
          )}
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'Certifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Certifications</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => addItem(setCertifications, {
              name: '', issuer: '', issue_date: '', credential_id: '', credential_url: '',
            })}>
              <Plus size={14} /> Add Certification
            </Button>
          </div>

          {certifications.length === 0 && (
            <Card><p className="text-center text-[#555577] text-sm py-6">No certifications added yet.</p></Card>
          )}

          {certifications.map((cert, i) => (
            <Card key={i}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Certification #{i + 1}</span>
                <button onClick={() => removeItem(setCertifications, i)} className="text-[#555577] hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Certificate Name" value={cert.name} onChange={e => updateItem(setCertifications, i, 'name', e.target.value)} placeholder="Certified Blockchain Developer" />
                <Input label="Issuing Organization" value={cert.issuer} onChange={e => updateItem(setCertifications, i, 'issuer', e.target.value)} placeholder="Coursera / Udemy / etc." />
                <Input label="Issue Date" type="date" value={cert.issue_date} onChange={e => updateItem(setCertifications, i, 'issue_date', e.target.value)} />
                <Input label="Credential ID" value={cert.credential_id} onChange={e => updateItem(setCertifications, i, 'credential_id', e.target.value)} placeholder="ABC123" />
                <Input label="Credential URL" value={cert.credential_url} onChange={e => updateItem(setCertifications, i, 'credential_url', e.target.value)} placeholder="https://..." className="md:col-span-2" />
              </div>
            </Card>
          ))}

          {certifications.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={async () => {
                setSaving(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                await supabase.from('certifications').delete().eq('user_id', user.id)
                await supabase.from('certifications').insert(certifications.map(c => ({ ...c, user_id: user.id })))
                toast.success('Certifications saved!')
                setSaving(false)
              }} loading={saving}>Save Certifications</Button>
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'Projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-[#6c63ff]" />
              <h2 className="font-semibold text-white">Projects</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => addItem(setProjects, {
              name: '', role: '', description: '', technologies: '', impact: '', project_url: '',
            })}>
              <Plus size={14} /> Add Project
            </Button>
          </div>

          {projects.length === 0 && (
            <Card><p className="text-center text-[#555577] text-sm py-6">No projects added yet.</p></Card>
          )}

          {projects.map((proj, i) => (
            <Card key={i}>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium text-[#6c63ff]">Project #{i + 1}</span>
                <button onClick={() => removeItem(setProjects, i)} className="text-[#555577] hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Project Name" value={proj.name} onChange={e => updateItem(setProjects, i, 'name', e.target.value)} placeholder="DeFi Yield Aggregator" />
                <Input label="Your Role" value={proj.role} onChange={e => updateItem(setProjects, i, 'role', e.target.value)} placeholder="Lead Developer" />
                <Input label="Technologies (comma separated)" value={proj.technologies} onChange={e => updateItem(setProjects, i, 'technologies', e.target.value)} placeholder="Solidity, React, Ethers.js" />
                <Input label="Project URL" value={proj.project_url} onChange={e => updateItem(setProjects, i, 'project_url', e.target.value)} placeholder="https://github.com/..." />
              </div>
              <div className="mt-4 space-y-3">
                <Textarea label="Description" value={proj.description} onChange={e => updateItem(setProjects, i, 'description', e.target.value)} placeholder="What did this project do and why did you build it?" rows={2} />
                <Textarea label="Impact / Results" value={proj.impact} onChange={e => updateItem(setProjects, i, 'impact', e.target.value)} placeholder="e.g. Processed $2M in transactions, 500+ active users..." rows={2} />
              </div>
            </Card>
          ))}

          {projects.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={async () => {
                setSaving(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                await supabase.from('projects').delete().eq('user_id', user.id)
                await supabase.from('projects').insert(projects.map(p => ({
                  ...p, user_id: user.id,
                  technologies: p.technologies ? p.technologies.split(',').map((s: string) => s.trim()) : [],
                })))
                toast.success('Projects saved!')
                setSaving(false)
              }} loading={saving}>Save Projects</Button>
            </div>
          )}
        </div>
      )}

      {/* Import Tab */}
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
                <li>Copy all the text from your profile page (Ctrl+A, Ctrl+C on the page)</li>
                <li>Paste it in the box below</li>
                <li>Click &quot;Parse & Import&quot; — AI will extract and fill your profile automatically</li>
              </ol>
            </div>

            <Textarea
              label="Paste your LinkedIn profile text here"
              value={linkedinText}
              onChange={e => setLinkedinText(e.target.value)}
              placeholder="Paste the full text copied from your LinkedIn profile page..."
              rows={12}
            />

            <div className="flex justify-between items-center">
              <p className="text-xs text-[#555577]">Your data is processed privately and never stored externally</p>
              <Button onClick={parseLinkedInText} loading={parsing}>
                <Upload size={15} /> Parse & Import Profile
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
