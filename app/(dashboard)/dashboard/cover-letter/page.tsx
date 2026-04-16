import { createClient } from '@/lib/supabase/server'
import DocumentGenerator from '@/components/documents/DocumentGenerator'

export default async function CoverLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; company?: string; desc?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: prompts } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('category', 'cover_letter')

  return (
    <DocumentGenerator
      type="cover_letter"
      title="Cover Letter Maker"
      description="Write personalized, human-quality cover letters tailored to each company and role"
      prompts={(prompts || []).map(p => ({ id: p.id, name: p.name, description: p.description, prompt: p.prompt, tone: p.tone }))}
      initialJobTitle={params.job || ''}
      initialCompanyName={params.company || ''}
      initialJobDescription={params.desc || ''}
    />
  )
}
