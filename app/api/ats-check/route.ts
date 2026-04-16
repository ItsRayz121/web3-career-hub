import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { resume, jobDescription } = await req.json()
  if (!resume || !jobDescription) {
    return NextResponse.json({ error: 'Resume and job description required' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

Return a JSON object:
{
  "score": <0-100 overall ATS compatibility score>,
  "keyword_score": <0-100 keyword match score>,
  "format_score": <0-100 format/structure score>,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword1", "keyword2"],
  "strengths": ["strength1", "strength2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "verdict": "<Excellent|Good|Fair|Poor>",
  "summary": "<2-3 sentence honest assessment>"
}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

RESUME:
${resume.slice(0, 5000)}`
    }],
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
