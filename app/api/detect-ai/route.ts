import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are an AI writing detection expert. Analyze this text and determine how likely it was written by AI vs a human.

Look for these AI writing patterns:
- Generic, vague phrasing ("passionate about", "results-driven", "leverage", "dynamic team", "fast-paced")
- Repetitive sentence structure
- Overly formal/robotic tone
- Missing specific personal details
- Cliché phrases
- Perfect grammar with no natural variation
- Lists of skills/traits without real examples
- Opening with "I am writing to" or similar
- Excessive use of transition words

Return a JSON object:
{
  "ai_score": <0-100, where 100 = definitely AI, 0 = definitely human>,
  "verdict": "<Human|Likely Human|Mixed|Likely AI|AI-Generated>",
  "flagged_phrases": ["<phrase1>", "<phrase2>"],
  "suggestions": ["<specific improvement 1>", "<specific improvement 2>"],
  "summary": "<1-2 sentence explanation>"
}

Text to analyze:
${text.slice(0, 5000)}`
    }],
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
