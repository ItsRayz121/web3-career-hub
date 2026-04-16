'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Zap, ArrowLeft, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#6c63ff] flex items-center justify-center mb-3">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-[#8888aa] mt-1">
            {sent ? 'Check your inbox' : "We'll send you a reset link"}
          </p>
        </div>

        <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-6">
          {sent ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#6c63ff20] flex items-center justify-center">
                <MailCheck size={22} className="text-[#6c63ff]" />
              </div>
              <p className="text-white font-medium">Email sent!</p>
              <p className="text-sm text-[#8888aa]">
                A password reset link was sent to <span className="text-white">{email}</span>. Check your inbox and click the link.
              </p>
              <Link href="/login" className="mt-2 text-sm text-[#6c63ff] hover:underline flex items-center gap-1">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Your Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Send Reset Link
                </Button>
              </form>
              <Link href="/login" className="flex items-center justify-center gap-1 mt-4 text-sm text-[#8888aa] hover:text-white transition-colors">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
