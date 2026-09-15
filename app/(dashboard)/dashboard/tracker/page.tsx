'use client'
import { useState, useEffect } from 'react'
import { getOpportunities, updateOpportunity, deleteOpportunity, type SavedOpportunity } from '@/lib/storage'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { CheckSquare, ExternalLink, Trash2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const statuses = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const
const statusColors: Record<string, 'info' | 'success' | 'warning' | 'purple' | 'danger'> = {
  saved: 'info', applied: 'success', interview: 'warning', offer: 'purple', rejected: 'danger',
}
const priorityColors: Record<string, string> = {
  low: 'text-[#555577]', medium: 'text-yellow-400', high: 'text-red-400',
}

export default function TrackerPage() {
  const [opportunities, setOpportunities] = useState<SavedOpportunity[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => { setOpportunities(getOpportunities()) }, [])

  const handleStatusChange = (id: string, status: string) => {
    updateOpportunity(id, { status: status as SavedOpportunity['status'] })
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: status as SavedOpportunity['status'] } : o))
    toast.success('Status updated')
  }

  const handleNotesBlur = (id: string, notes: string) => {
    const opp = opportunities.find(o => o.id === id)
    if (opp?.notes === notes) return
    updateOpportunity(id, { notes })
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, notes } : o))
  }

  const handleDelete = (id: string) => {
    deleteOpportunity(id)
    setOpportunities(prev => prev.filter(o => o.id !== id))
    toast.success('Removed from tracker')
  }

  const filtered = filterStatus === 'all' ? opportunities : opportunities.filter(o => o.status === filterStatus)
  const counts = statuses.reduce((acc, s) => { acc[s] = opportunities.filter(o => o.status === s).length; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Opportunity Tracker</h1>
        <p className="text-[#8888aa] text-sm mt-1">Track every application from saved to offer — never miss a deadline</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`rounded-lg p-3 text-center border transition-all ${filterStatus === s ? 'border-[#6c63ff] bg-[#6c63ff10]' : 'border-[#1e1e35] bg-[#12121f] hover:border-[#6c63ff30]'}`}>
            <p className="text-xl font-bold text-white">{counts[s] || 0}</p>
            <p className="text-xs text-[#555577] capitalize mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === 'all' ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'}`}>
          All ({opportunities.length})
        </button>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === s ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'}`}>
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CheckSquare size={32} className="text-[#555577] mx-auto mb-3" />
          <p className="text-sm font-medium text-white">No opportunities here</p>
          <p className="text-xs text-[#555577] mt-1">Save jobs from the Jobs tab to track them here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(opp => (
            <Card key={opp.id} className="group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white text-sm truncate">{opp.title}</h3>
                    <Badge variant={statusColors[opp.status]} className="capitalize">{opp.status}</Badge>
                    <span className={`text-xs ${priorityColors[opp.priority]} capitalize`}>• {opp.priority}</span>
                  </div>
                  <p className="text-xs text-[#8888aa] mt-0.5">{opp.company} • {opp.opportunity_type} • Saved {formatDate(opp.created_at)}</p>
                  {opp.deadline && <p className="text-xs text-yellow-400 mt-0.5">Deadline: {formatDate(opp.deadline)}</p>}
                  <textarea
                    className="mt-2 w-full text-xs bg-[#0f0f1a] border border-[#1e1e35] rounded-lg px-2 py-1.5 text-[#8888aa] placeholder:text-[#333355] focus:outline-none focus:border-[#6c63ff] resize-none"
                    rows={1}
                    placeholder="Add notes..."
                    defaultValue={opp.notes || ''}
                    onBlur={e => handleNotesBlur(opp.id, e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <select
                      className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-[#1a1a2e] border border-[#1e1e35] text-white text-xs focus:outline-none focus:border-[#6c63ff] cursor-pointer"
                      value={opp.status}
                      onChange={e => handleStatusChange(opp.id, e.target.value)}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555577] pointer-events-none" />
                  </div>
                  <a href={opp.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35] transition-colors">
                    <ExternalLink size={13} />
                  </a>
                  <button onClick={() => handleDelete(opp.id)}
                    className="p-1.5 rounded-lg bg-[#1a1a2e] text-[#555577] hover:text-red-400 border border-[#1e1e35] transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
