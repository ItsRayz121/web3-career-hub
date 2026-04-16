'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, User, FileText, ScrollText, Mail,
  Briefcase, Handshake, GraduationCap, Bookmark,
  Sparkles, Target, CheckSquare, Zap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: '' },
  { href: '/dashboard/profile', icon: User, label: 'Profile Hub', badge: '' },
  { divider: true, label: 'Documents' },
  { href: '/dashboard/cv-maker', icon: FileText, label: 'CV Maker', badge: '' },
  { href: '/dashboard/resume-maker', icon: ScrollText, label: 'Resume Maker', badge: '' },
  { href: '/dashboard/cover-letter', icon: Mail, label: 'Cover Letter', badge: '' },
  { href: '/dashboard/ats-checker', icon: Target, label: 'ATS Checker', badge: '' },
  { divider: true, label: 'Opportunities' },
  { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs', badge: 'Live' },
  { href: '/dashboard/collaborations', icon: Handshake, label: 'Collaborations', badge: '' },
  { href: '/dashboard/scholarships', icon: GraduationCap, label: 'Scholarships', badge: '' },
  { divider: true, label: 'Tools' },
  { href: '/dashboard/tracker', icon: CheckSquare, label: 'Opportunity Tracker', badge: '' },
  { href: '/dashboard/saved', icon: Bookmark, label: 'Saved Items', badge: '' },
  { href: '/dashboard/prompts', icon: Sparkles, label: 'Prompt Library', badge: '' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0f0f1a] border-r border-[#1e1e35] flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-[#1e1e35]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6c63ff] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Web3 Career</p>
            <p className="text-xs text-[#555577]">Hub</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item, i) => {
          if ('divider' in item) {
            return (
              <div key={i} className="pt-4 pb-1 px-2">
                <p className="text-[10px] uppercase tracking-widest text-[#555577] font-semibold">
                  {item.label}
                </p>
              </div>
            )
          }
          const Icon = item.icon!
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-[#6c63ff15] text-[#6c63ff] border border-[#6c63ff30]'
                  : 'text-[#8888aa] hover:bg-[#1a1a2e] hover:text-white'
              )}
            >
              <Icon size={16} className={isActive ? 'text-[#6c63ff]' : ''} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse inline-block" />
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
