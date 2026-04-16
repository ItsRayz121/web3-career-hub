'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Sparkles, Save, Copy, AlertCircle, CheckCircle, RefreshCw, Pencil, Check } from 'lucide-react'

interface Props {
  type: 'cv' | 'resume' | 'cover_letter'
  title: string
  description: string
  prompts: { id: string; name: string; description: string; prompt: string; tone: string }[]
  initialJobTitle?: string
  initialCompanyName?: string
  initialJobDescription?: string
}

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'confident', label: 'Confident' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'web3-native', label: 'Web3 Native' },
  { value: 'academic', label: 'Academic' },
  { value: 'creative', label: 'Creative' },
]

interface AiResult {
  ai_score: number
  verdict: string
  flagged_phrases: string[]
  suggestions: string[]
  summary: string
}

export default function DocumentGenerator({ type, title, description, prompts, initialJobTitle = '', initialCompanyName = '', initialJobDescription = '' }: Props) {
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [jobDescription, setJobDescription] = useState(initialJobDescription)
  const [tone, setTone] = useState('professional')
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [editMode, setEditMode] = useState(false)

  const supabase = createClient()

  const generate = async () => {
    setGenerating(true)
    setContent('')
    setAiResult(null)

    const selectedP = prompts.find(p => p.id === selectedPrompt)
    const customPrompt = selectedP?.prompt || ''

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, jobTitle, jobDescription, companyName, tone: selectedP?.tone || tone, customPrompt }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setContent(full)
      }

      if (!docTitle) setDocTitle(`${type.toUpperCase()} - ${jobTitle || 'General'} ${new Date().toLocaleDateString()}`)
      toast.success('Generated successfully!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    }
    setGenerating(false)
  }

  const checkAI = async () => {
    if (!content) return toast.error('Generate content first')
    setChecking(true)
    try {
      const res = await fetch('/api/detect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })
      const data = await res.json()
      setAiResult(data)
    } catch {
      toast.error('AI detection failed')
    }
    setChecking(false)
  }

  const saveDocument = async () => {
    if (!content) return toast.error('Nothing to save')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('generated_documents').insert({
      user_id: user.id,
      type,
      title: docTitle || `${type} - ${new Date().toLocaleDateString()}`,
      content,
      job_title: jobTitle,
      company_name: companyName,
      tone,
      ai_score: aiResult?.ai_score,
    })

    if (error) toast.error('Failed to save')
    else toast.success('Saved to your documents!')
    setSaving(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const getScoreColor = (score: number) => {
    if (score <= 20) return 'text-green-400'
    if (score <= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreVariant = (score: number): 'success' | 'warning' | 'danger' => {
    if (score <= 20) return 'success'
    if (score <= 50) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-[#8888aa] text-sm mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-white mb-4">Target Job (Optional)</h2>
            <div className="space-y-3">
              <Input label="Job Title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Web3 Business Developer" />
              <Input label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Uniswap Labs" />
              <Textarea label="Job Description / Requirements" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description here for a tailored output..." rows={6} />
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-white mb-4">Writing Style</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-[#8888aa] block mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        tone === t.value
                          ? 'bg-[#6c63ff] text-white'
                          : 'bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {prompts.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-[#8888aa] block mb-2">Prompt Template (Optional)</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedPrompt('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                        selectedPrompt === ''
                          ? 'bg-[#6c63ff15] border-[#6c63ff40] text-white'
                          : 'bg-[#0f0f1a] border-[#1e1e35] text-[#8888aa] hover:text-white'
                      }`}
                    >
                      Default (no special prompt)
                    </button>
                    {prompts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPrompt(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                          selectedPrompt === p.id
                            ? 'bg-[#6c63ff15] border-[#6c63ff40] text-white'
                            : 'bg-[#0f0f1a] border-[#1e1e35] text-[#8888aa] hover:text-white'
                        }`}
                      >
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-[#555577] mt-0.5">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Button onClick={generate} loading={generating} className="w-full" size="lg">
            <Sparkles size={17} /> Generate {title}
          </Button>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          {content && (
            <>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <Input
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    placeholder="Document title..."
                    className="border-0 bg-transparent p-0 text-sm font-medium focus:ring-0"
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(m => !m)}>
                      {editMode ? <><Check size={14} /> Done</> : <><Pencil size={14} /> Edit</>}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      <Copy size={14} /> Copy
                    </Button>
                    <Button variant="secondary" size="sm" onClick={saveDocument} loading={saving}>
                      <Save size={14} /> Save
                    </Button>
                  </div>
                </div>
                <div className="bg-[#0f0f1a] rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  {editMode ? (
                    <textarea
                      className="w-full bg-transparent text-sm text-[#d0d0ee] whitespace-pre-wrap font-sans leading-relaxed resize-none focus:outline-none min-h-[400px]"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  ) : (
                    <pre className="text-sm text-[#d0d0ee] whitespace-pre-wrap font-sans leading-relaxed">
                      {content}
                    </pre>
                  )}
                </div>
              </Card>

              {/* AI Detection */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white text-sm">AI Detection Check</h3>
                  <Button variant="secondary" size="sm" onClick={checkAI} loading={checking}>
                    <RefreshCw size={13} /> Check
                  </Button>
                </div>

                {!aiResult && (
                  <p className="text-xs text-[#555577]">Click &quot;Check&quot; to verify this sounds human-written</p>
                )}

                {aiResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {aiResult.ai_score <= 30
                          ? <CheckCircle size={16} className="text-green-400" />
                          : <AlertCircle size={16} className="text-yellow-400" />
                        }
                        <span className="text-sm font-medium text-white">{aiResult.verdict}</span>
                      </div>
                      <Badge variant={getScoreVariant(aiResult.ai_score)}>
                        <span className={getScoreColor(aiResult.ai_score)}>
                          {aiResult.ai_score}% AI
                        </span>
                      </Badge>
                    </div>

                    <p className="text-xs text-[#8888aa]">{aiResult.summary}</p>

                    {aiResult.flagged_phrases?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#8888aa] mb-1">Flagged phrases:</p>
                        <div className="flex flex-wrap gap-1">
                          {aiResult.flagged_phrases.map((p, i) => (
                            <span key={i} className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResult.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#8888aa] mb-1">Suggestions:</p>
                        <ul className="space-y-1">
                          {aiResult.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-[#8888aa] flex gap-1.5">
                              <span className="text-[#6c63ff] mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </>
          )}

          {!content && !generating && (
            <Card className="flex flex-col items-center py-16 text-center">
              <Sparkles size={32} className="text-[#555577] mb-3" />
              <p className="text-sm font-medium text-white">No output yet</p>
              <p className="text-xs text-[#555577] mt-1">Configure your options and click Generate</p>
            </Card>
          )}

          {generating && (
            <Card className="flex flex-col items-center py-16 text-center">
              <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-[#8888aa]">Writing your {type.replace('_', ' ')}...</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
