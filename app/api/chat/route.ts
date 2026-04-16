import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are a personal career assistant for a Web3/blockchain professional using Web3 Career Hub.

You help with:
- Career advice for Web3, blockchain, crypto, and remote jobs
- Reviewing and improving CVs, resumes, cover letters
- Drafting cold outreach messages and emails
- Explaining Web3 concepts and job requirements
- Suggesting skills to learn for specific roles
- Optimizing LinkedIn profiles and portfolios
- Interview preparation for Web3 roles
- Freelance and remote work strategies

Context: The user is based in Pakistan, focused on remote/freelance Web3 opportunities globally.

Be direct, practical, and specific. Give actionable advice. Keep responses concise unless detail is needed. Use bullet points for lists. Don't be generic.`,
    messages: messages.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
