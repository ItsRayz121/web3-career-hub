'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DocumentGenerator from '@/components/documents/DocumentGenerator'
import { PROMPT_TEMPLATES } from '@/lib/prompt-templates'

function CoverLetterContent() {
  const params = useSearchParams()
  const prompts = PROMPT_TEMPLATES.filter(p => p.category === 'cover_letter')
  return (
    <DocumentGenerator
      type="cover_letter"
      title="Cover Letter Maker"
      description="Write personalized, human-quality cover letters tailored to each company and role"
      prompts={prompts}
      initialJobTitle={params.get('job') || ''}
      initialCompanyName={params.get('company') || ''}
      initialJobDescription={params.get('desc') || ''}
    />
  )
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={null}>
      <CoverLetterContent />
    </Suspense>
  )
}
