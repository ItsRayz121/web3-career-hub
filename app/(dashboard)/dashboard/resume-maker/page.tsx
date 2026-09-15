import DocumentGenerator from '@/components/documents/DocumentGenerator'
import { PROMPT_TEMPLATES } from '@/lib/prompt-templates'

export default function ResumeMakerPage() {
  const prompts = PROMPT_TEMPLATES.filter(p => p.category === 'resume')
  return (
    <DocumentGenerator
      type="resume"
      title="Resume Maker"
      description="Build a targeted, concise resume tailored to your specific role or job description"
      prompts={prompts}
    />
  )
}
