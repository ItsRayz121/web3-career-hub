'use client'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { Target, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface AtsResult {
  score: number
  keyword_score: number
  format_score: number
  matched_keywords: string[]
  missing_keywords: string[]
  strengths: string[]
  improvements: string[]
  verdict: string
  summary: string
}

export default function ATSCheckerPage() {
  const [resume, setResume] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<AtsResult | null>(null)

  const check = async () => {
    if (!resume || !jobDescription) return toast.error('Paste both your resume and job description')
    setChecking(true)
    try {
      const res = await fetch('/api/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error('ATS check failed')
    }
    setChecking(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getVariant = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 75) return 'success'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">ATS Checker</h1>
        <p className="text-[#8888aa] text-sm mt-1">Check how well your resume matches a job description — real keyword analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <Textarea
              label="Your Resume (paste text)"
              value={resume}
              onChange={e => setResume(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={12}
            />
          </Card>
          <Card>
            <Textarea
              label="Job Description"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={8}
            />
          </Card>
          <Button onClick={check} loading={checking} className="w-full" size="lg">
            <Target size={17} /> Run ATS Check
          </Button>
        </div>

        <div>
          {!result && !checking && (
            <Card className="flex flex-col items-center py-20 text-center">
              <Target size={32} className="text-[#555577] mb-3" />
              <p className="text-sm font-medium text-white">No analysis yet</p>
              <p className="text-xs text-[#555577] mt-1">Paste resume + job description and click Run ATS Check</p>
            </Card>
          )}

          {checking && (
            <Card className="flex flex-col items-center py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-[#8888aa]">Analyzing your resume...</p>
            </Card>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              {/* Score */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">ATS Score</h2>
                  <Badge variant={getVariant(result.score)}>{result.verdict}</Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}</p>
                    <p className="text-xs text-[#555577]">Overall</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8888aa]">Keyword Match</span>
                        <span className={getScoreColor(result.keyword_score)}>{result.keyword_score}%</span>
                      </div>
                      <div className="h-2 bg-[#1e1e35] rounded-full">
                        <div className="h-2 bg-[#6c63ff] rounded-full transition-all" style={{ width: `${result.keyword_score}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8888aa]">Format Score</span>
                        <span className={getScoreColor(result.format_score)}>{result.format_score}%</span>
                      </div>
                      <div className="h-2 bg-[#1e1e35] rounded-full">
                        <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${result.format_score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#8888aa]">{result.summary}</p>
              </Card>

              {/* Keywords */}
              <Card>
                <h3 className="font-medium text-white mb-3 text-sm">Keyword Analysis</h3>
                {result.matched_keywords?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-green-400 mb-2 flex items-center gap-1"><CheckCircle size={12} /> Matched ({result.matched_keywords.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched_keywords.map(k => (
                        <span key={k} className="text-xs bg-green-900/30 text-green-400 border border-green-900/50 px-2 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.missing_keywords?.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 mb-2 flex items-center gap-1"><XCircle size={12} /> Missing ({result.missing_keywords.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_keywords.map(k => (
                        <span key={k} className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <Card>
                  <h3 className="font-medium text-white mb-3 text-sm flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#6c63ff]" /> Improvements
                  </h3>
                  <ul className="space-y-2">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="text-sm text-[#8888aa] flex gap-2">
                        <span className="text-[#6c63ff] mt-0.5 shrink-0">→</span>{imp}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
