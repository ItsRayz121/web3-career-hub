import { createClient } from '@/lib/supabase/server'
import DocumentGenerator from '@/components/documents/DocumentGenerator'

export default async function ResumeMakerPage() {
  const supabase = await createClient()
  const { data: prompts } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('category', 'resume')

  return (
    <DocumentGenerator
      type="resume"
      title="Resume Maker"
      description="Build a targeted, concise resume tailored to your specific role or job description"
      prompts={(prompts || []).map(p => ({ id: p.id, name: p.name, description: p.description, prompt: p.prompt, tone: p.tone }))}
    />
  )
}
