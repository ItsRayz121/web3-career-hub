'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
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
          <h1 className="text-2xl font-bold text-white">Web3 Career Hub</h1>
          <p className="text-sm text-[#8888aa] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="space-y-1">
              <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-[#6c63ff] hover:underline">Forgot password?</Link>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Sign In</Button>
          </form>
          <p className="text-center text-sm text-[#8888aa] mt-4">
            No account?{' '}
            <Link href="/register" className="text-[#6c63ff] hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
