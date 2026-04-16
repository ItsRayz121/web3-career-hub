import Sidebar from '@/components/layout/Sidebar'
import AutoAuth from '@/components/layout/AutoAuth'
import ChatAssistant from '@/components/layout/ChatAssistant'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AutoAuth />
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ChatAssistant />
    </div>
  )
}
