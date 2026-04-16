import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, jobTitle, jobDescription, companyName, tone, customPrompt } = await req.json()

  // Fetch all user data
  const [pRes, eRes, edRes, sRes, cRes, prRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('experiences').select('*').eq('user_id', user.id),
    supabase.from('education').select('*').eq('user_id', user.id),
    supabase.from('skills').select('*').eq('user_id', user.id),
    supabase.from('certifications').select('*').eq('user_id', user.id),
    supabase.from('projects').select('*').eq('user_id', user.id),
  ])

  const profile = pRes.data
  const experiences = eRes.data || []
  const education = edRes.data || []
  const skills = sRes.data || []
  const certifications = cRes.data || []
  const projects = prRes.data || []

  if (!profile?.full_name) {
    return NextResponse.json({ error: 'Please complete your profile before generating documents' }, { status: 400 })
  }

  const profileContext = `
CANDIDATE PROFILE:
Name: ${profile.full_name}
Title: ${profile.professional_title}
Email: ${profile.email}
Phone: ${profile.phone}
Location: ${profile.city}, ${profile.country}
LinkedIn: ${profile.linkedin_url || 'N/A'}
Portfolio: ${profile.portfolio_url || 'N/A'}
GitHub: ${profile.github_url || 'N/A'}
Summary: ${profile.professional_summary}
Target Role: ${profile.target_role}
Years Experience: ${profile.years_experience}
Work Type: ${profile.work_type}
${profile.wallet_address ? `Wallet: ${profile.wallet_address}` : ''}

EXPERIENCE:
${experiences.map((e: Record<string, unknown>) => `
- ${e.role_title} at ${e.company_name} (${e.start_date} - ${e.is_current ? 'Present' : e.end_date})
  Location: ${e.location}
  Responsibilities: ${e.responsibilities}
  Achievements: ${e.achievements}
  Tools: ${Array.isArray(e.tools_used) ? (e.tools_used as string[]).join(', ') : e.tools_used}
`).join('')}

EDUCATION:
${education.map((e: Record<string, unknown>) => `- ${e.degree} at ${e.institution} (${e.start_date} - ${e.end_date})${e.grade ? `, Grade: ${e.grade}` : ''}`).join('\n')}

SKILLS:
${skills.map((s: Record<string, unknown>) => `${s.name} (${s.category}, ${s.level})`).join(', ')}

CERTIFICATIONS:
${certifications.map((c: Record<string, unknown>) => `${c.name} by ${c.issuer} (${c.issue_date})`).join('\n')}

PROJECTS:
${projects.map((p: Record<string, unknown>) => `- ${p.name} (${p.role}): ${p.description}. Impact: ${p.impact}`).join('\n')}
`

  const targetContext = jobTitle || companyName
    ? `\nTARGET JOB:\nTitle: ${jobTitle}\nCompany: ${companyName}\nDescription: ${jobDescription}`
    : ''

  const toneInstructions: Record<string, string> = {
    professional: 'Write in a polished, professional tone. Strong and clear.',
    confident: 'Write with confident, direct energy. Lead with impact. No filler.',
    conversational: 'Write naturally, like a real human. Warm but professional. Avoid buzzwords.',
    academic: 'Write in a formal, scholarly tone appropriate for academic applications.',
    'web3-native': 'Write like someone who lives and breathes Web3. Use appropriate industry language naturally.',
    creative: 'Write with personality and creativity while staying professional.',
  }

  const toneInstruction = toneInstructions[tone] || toneInstructions.professional

  let systemPrompt = ''
  let userPrompt = ''

  if (type === 'cv') {
    systemPrompt = `You are an expert CV writer who creates genuinely impressive, human-quality CVs. Your CVs are consistently better than what most professionals write for themselves. You never sound like an AI. You transform raw career information into compelling narratives that make recruiters want to hire the person immediately.`
    userPrompt = `${customPrompt || ''}

Create a comprehensive, professional CV for this candidate. ${toneInstruction}

CRITICAL RULES:
- Sound completely human — a real professional wrote this, not AI
- Only use the real information provided below — do not invent anything
- Use strong action verbs and quantify achievements wherever the data supports it
- Make it ATS-friendly with proper keyword density
- Format it clearly with proper sections

${profileContext}${targetContext}

Format the CV with these sections: Contact Info, Professional Summary, Experience (detailed, achievement-focused), Skills, Education, Certifications, Projects. Use clean formatting with proper spacing.`
  }

  if (type === 'resume') {
    systemPrompt = `You are an expert resume writer who creates targeted, high-impact resumes. Your resumes land interviews. You write like a human career strategist who knows exactly what recruiters want. You never use AI clichés.`
    userPrompt = `${customPrompt || ''}

Create a targeted, concise resume for this candidate. ${toneInstruction}

CRITICAL RULES:
- Keep it focused and impactful — every word earns its place
- Sound 100% human — no AI phrases like "passionate about", "results-driven", "leverage synergies"
- Only use real provided information — never invent data
- Tailor everything to the target role if job info is provided
- Lead with your strongest achievements, not just duties
- ATS-optimized but human-readable

${profileContext}${targetContext}

Format: Contact, Summary (2-3 impactful lines), Experience (achievement bullets, not duty lists), Skills (relevant ones first), Education, Certifications.`
  }

  if (type === 'cover_letter') {
    systemPrompt = `You are an expert cover letter writer who creates letters that actually get read and remembered. Your letters are warm, specific, and human — the opposite of the generic AI cover letters that get ignored. You write like someone who genuinely cares about helping people get hired.`
    userPrompt = `${customPrompt || ''}

Write a compelling cover letter. ${toneInstruction}

CRITICAL RULES:
- Sound genuinely human — this is the most important rule
- Be specific about why THIS company and THIS role
- Never use these phrases: "I am writing to express", "I am passionate about", "team player", "fast-paced environment", "dynamic", "leverage"
- Open with something that grabs attention immediately
- Show you understand the company's mission/work
- Connect 2-3 specific achievements to their needs
- Close confidently, not desperately
- Keep it to 3-4 paragraphs, under 350 words

${profileContext}${targetContext}`
  }

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
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
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  })
}
