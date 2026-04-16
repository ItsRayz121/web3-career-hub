'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Zap, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase puts the access token in the URL hash after redirect
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidSession(true)
    })
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
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
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-sm text-[#8888aa] mt-1">Choose a strong password</p>
        </div>

        <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-6">
          {done ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center">
                <CheckCircle size={22} className="text-green-400" />
              </div>
              <p className="text-white font-medium">Password updated!</p>
              <p className="text-sm text-[#8888aa]">Redirecting you to the dashboard...</p>
            </div>
          ) : !validSession ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-[#8888aa]">This reset link is invalid or has expired.</p>
              <Link href="/forgot-password" className="text-sm text-[#6c63ff] hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                error={confirm && password !== confirm ? 'Passwords do not match' : undefined}
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
