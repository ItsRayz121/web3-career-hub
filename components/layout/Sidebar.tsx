'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, User, FileText, ScrollText, Mail,
  Briefcase, Handshake, GraduationCap, Bookmark,
  Sparkles, Target, CheckSquare, Zap, X
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

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <>
    {/* Mobile backdrop */}
    <div
      onClick={onClose}
      aria-hidden="true"
      className={cn(
        'lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    />
    <aside className={cn(
      'fixed left-0 top-0 h-dvh w-[17rem] max-w-[85vw] lg:w-60 bg-[#0f0f1a] border-r border-[#1e1e35] flex flex-col z-[60]',
      'transition-transform duration-200 ease-out lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>
      {/* Logo */}
      <div className="p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] lg:pt-5 border-b border-[#1e1e35] flex items-center justify-between">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6c63ff] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Web3 Career</p>
            <p className="text-xs text-[#555577]">Hub</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close navigation menu"
          className="lg:hidden -mr-2 w-11 h-11 flex items-center justify-center rounded-lg text-[#8888aa] hover:text-white hover:bg-[#1a1a2e]"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-0.5">
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
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-3 lg:py-2 rounded-lg text-sm transition-all',
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
    </>
  )
}
