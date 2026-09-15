import DocumentGenerator from '@/components/documents/DocumentGenerator'
import { PROMPT_TEMPLATES } from '@/lib/prompt-templates'

export default function CVMakerPage() {
  const prompts = PROMPT_TEMPLATES.filter(p => p.category === 'cv')
  return (
    <DocumentGenerator
      type="cv"
      title="CV Maker"
      description="Generate a comprehensive, professional CV that sounds human-written and is ATS-optimized"
      prompts={prompts}
    />
  )
}
