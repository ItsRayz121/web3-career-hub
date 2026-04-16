import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Extract structured professional profile data from this LinkedIn profile text. Return a valid JSON object with these fields:

{
  "profile": {
    "full_name": "",
    "professional_title": "",
    "city": "",
    "country": "",
    "professional_summary": "",
    "linkedin_url": "",
    "years_experience": ""
  },
  "experiences": [
    {
      "company_name": "",
      "role_title": "",
      "employment_type": "full-time",
      "location": "",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or empty if current",
      "is_current": "true or false",
      "responsibilities": "",
      "achievements": "",
      "tools_used": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "grade": "",
      "achievements": ""
    }
  ],
  "skills": [
    { "name": "", "category": "technical", "level": "intermediate" }
  ]
}

Only return the JSON, nothing else. If a field cannot be found, use empty string.

LinkedIn profile text:
${text.slice(0, 8000)}`
    }],
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse profile' }, { status: 422 })

  const parsed = JSON.parse(jsonMatch[0])
  return NextResponse.json(parsed)
}
