'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Zap } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import ChatAssistant from '@/components/layout/ChatAssistant'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  // Lock background scroll and close on Escape while the drawer is open
  useEffect(() => {
    if (!navOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [navOpen])

  return (
    <div className="flex min-h-dvh bg-[#0a0a0f]">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 pt-[env(safe-area-inset-top)] box-content bg-[#0f0f1a]/95 backdrop-blur border-b border-[#1e1e35] flex items-center gap-3 px-4">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
          className="-ml-2 w-11 h-11 flex items-center justify-center rounded-lg text-[#8888aa] hover:text-white hover:bg-[#1a1a2e]"
        >
          <Menu size={22} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#6c63ff] flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white truncate">Web3 Career Hub</span>
        </Link>
      </header>

      <main className="flex-1 min-w-0 min-h-dvh pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 lg:ml-60">
        <div className="p-4 sm:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ChatAssistant />
    </div>
  )
}
