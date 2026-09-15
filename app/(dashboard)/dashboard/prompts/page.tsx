import { PROMPT_TEMPLATES } from '@/lib/prompt-templates'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

const categoryColors: Record<string, 'info' | 'success' | 'warning' | 'purple'> = {
  cv: 'info',
  resume: 'success',
  cover_letter: 'warning',
  linkedin: 'purple',
}

const categoryLabels: Record<string, string> = {
  cv: 'CV', resume: 'Resume', cover_letter: 'Cover Letter', linkedin: 'LinkedIn',
}

const categoryLinks: Record<string, string> = {
  cv: '/dashboard/cv-maker',
  resume: '/dashboard/resume-maker',
  cover_letter: '/dashboard/cover-letter',
}

export default function PromptsPage() {
  const grouped = PROMPT_TEMPLATES.reduce((acc: Record<string, typeof PROMPT_TEMPLATES>, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Prompt Library</h1>
        <p className="text-[#8888aa] text-sm mt-1">Specialized prompts for different roles, industries, and writing styles</p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant={categoryColors[category] || 'default'}>{categoryLabels[category] || category}</Badge>
              <span className="text-xs text-[#555577]">{items.length} prompts</span>
            </div>
            {categoryLinks[category] && (
              <Link href={categoryLinks[category]} className="text-xs text-[#6c63ff] hover:underline flex items-center gap-1">
                Use these prompts <ArrowRight size={12} />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(prompt => (
              <Card key={prompt.id} hover>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6c63ff20] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-[#6c63ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-white text-sm">{prompt.name}</p>
                      <span className="text-xs bg-[#1a1a2e] text-[#8888aa] px-2 py-0.5 rounded border border-[#1e1e35] capitalize">
                        {prompt.tone}
                      </span>
                    </div>
                    <p className="text-xs text-[#8888aa]">{prompt.description}</p>
                    <div className="mt-2 bg-[#0f0f1a] rounded-lg p-2 border border-[#1e1e35]">
                      <p className="text-xs text-[#555577] italic line-clamp-2">{prompt.prompt.slice(0, 120)}...</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
