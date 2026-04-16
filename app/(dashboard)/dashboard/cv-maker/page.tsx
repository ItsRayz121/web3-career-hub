import { createClient } from '@/lib/supabase/server'
import DocumentGenerator from '@/components/documents/DocumentGenerator'

export default async function CVMakerPage() {
  const supabase = await createClient()
  const { data: prompts } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('category', 'cv')

  return (
    <DocumentGenerator
      type="cv"
      title="CV Maker"
      description="Generate a comprehensive, professional CV that sounds human-written and is ATS-optimized"
      prompts={(prompts || []).map(p => ({ id: p.id, name: p.name, description: p.description, prompt: p.prompt, tone: p.tone }))}
    />
  )
}
