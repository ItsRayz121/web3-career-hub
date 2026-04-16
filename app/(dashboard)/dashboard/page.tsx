import { createClient } from '@/lib/supabase/server'
import { FileText, Briefcase, Bookmark, Target, TrendingUp, Zap, ArrowRight, Download } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { count: docCount },
    { count: savedCount },
    { data: recentDocs },
    { count: expCount },
    { count: skillCount },
    { count: eduCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('generated_documents').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('saved_opportunities').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('generated_documents').select('id, title, type, created_at, job_title, company_name, ai_score').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('skills').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('education').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  // Smarter profile completeness: basic fields + experience, skills, education
  const profileFields = ['full_name', 'professional_title', 'professional_summary', 'country', 'phone']
  const filledFields = profile ? profileFields.filter(f => profile[f as keyof typeof profile]).length : 0
  const hasExp = (expCount || 0) > 0
  const hasSkills = (skillCount || 0) > 0
  const hasEdu = (eduCount || 0) > 0
  const totalFields = profileFields.length + 3
  const totalFilled = filledFields + (hasExp ? 1 : 0) + (hasSkills ? 1 : 0) + (hasEdu ? 1 : 0)
  const profileComplete = Math.round((totalFilled / totalFields) * 100)

  const typeColors: Record<string, 'info' | 'success' | 'warning'> = { cv: 'info', resume: 'success', cover_letter: 'warning' }
  const typeLabels: Record<string, string> = { cv: 'CV', resume: 'Resume', cover_letter: 'Cover Letter' }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back{profile?.full_name ? `, ${String(profile.full_name).split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-[#8888aa] mt-1 text-sm">Here&apos;s your career hub overview</p>
      </div>

      {/* Profile completion banner */}
      {profileComplete < 80 && (
        <div className="bg-[#6c63ff10] border border-[#6c63ff30] rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6c63ff20] flex items-center justify-center shrink-0">
              <Zap size={18} className="text-[#6c63ff]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Complete your profile ({profileComplete}%)</p>
              <p className="text-xs text-[#8888aa] mt-0.5">
                Missing: {!hasExp && 'Experience · '}{!hasSkills && 'Skills · '}{!hasEdu && 'Education · '}
                {profileFields.filter(f => !profile?.[f as keyof typeof profile]).slice(0, 2).join(' · ')}
              </p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="flex items-center gap-1.5 text-sm text-[#6c63ff] hover:underline shrink-0">
            Complete now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Profile', value: `${profileComplete}%`, icon: Target, color: '#6c63ff', href: '/dashboard/profile' },
          { label: 'Documents', value: docCount ?? 0, icon: FileText, color: '#22c55e', href: '/dashboard/saved' },
          { label: 'Saved', value: savedCount ?? 0, icon: Bookmark, color: '#f59e0b', href: '/dashboard/saved' },
          { label: 'Jobs Live', value: '200+', icon: Briefcase, color: '#60a5fa', href: '/dashboard/jobs' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}20` }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-[#555577]">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#8888aa] mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Build a Resume', desc: 'AI-powered, human-quality output tailored to a job', href: '/dashboard/resume-maker', icon: FileText, color: '#6c63ff' },
            { title: 'Find Web3 Jobs', desc: 'Browse 200+ real-time blockchain, crypto & freelance listings', href: '/dashboard/jobs', icon: Briefcase, color: '#22c55e' },
            { title: 'Write Cover Letter', desc: 'Tailored, human-sounding cover letters in seconds', href: '/dashboard/cover-letter', icon: TrendingUp, color: '#f59e0b' },
          ].map((action) => (
            <Link key={action.title} href={action.href}>
              <Card hover className="h-full">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${action.color}20` }}>
                  <action.icon size={17} style={{ color: action.color }} />
                </div>
                <p className="font-semibold text-white text-sm">{action.title}</p>
                <p className="text-xs text-[#555577] mt-1 leading-relaxed">{action.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider">Recent Documents</h2>
          <Link href="/dashboard/saved" className="text-xs text-[#6c63ff] hover:underline">View all</Link>
        </div>

        {!recentDocs || recentDocs.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-8 text-center">
              <FileText size={32} className="text-[#555577] mb-3" />
              <p className="text-sm font-medium text-white">No documents yet</p>
              <p className="text-xs text-[#555577] mt-1">Generate your first CV or resume to get started</p>
              <Link href="/dashboard/cv-maker" className="mt-4 text-sm text-[#6c63ff] hover:underline flex items-center gap-1">
                Create CV <ArrowRight size={13} />
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentDocs.map(doc => (
              <Card key={String(doc.id)} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#6c63ff20] flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-[#6c63ff]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white truncate">{String(doc.title || 'Untitled')}</p>
                      <Badge variant={typeColors[String(doc.type)] || 'default'}>{typeLabels[String(doc.type)] || String(doc.type)}</Badge>
                    </div>
                    <p className="text-xs text-[#555577] mt-0.5">
                      {doc.job_title ? `${String(doc.job_title)}${doc.company_name ? ` @ ${String(doc.company_name)}` : ''}  · ` : ''}
                      {formatDate(String(doc.created_at))}
                      {doc.ai_score != null && (
                        <span className={`ml-2 ${Number(doc.ai_score) <= 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {Number(doc.ai_score)}% AI
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/dashboard/cover-letter?job=${encodeURIComponent(String(doc.job_title || ''))}&company=${encodeURIComponent(String(doc.company_name || ''))}`}
                    className="p-1.5 rounded-lg bg-[#1a1a2e] text-[#8888aa] hover:text-[#6c63ff] border border-[#1e1e35] transition-colors text-xs px-2"
                  >
                    Cover Letter
                  </Link>
                  <Link href="/dashboard/saved" className="p-1.5 rounded-lg bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35] transition-colors">
                    <Download size={13} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
