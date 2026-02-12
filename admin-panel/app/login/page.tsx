'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Shield, Lock, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [showMFA, setShowMFA] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password, showMFA ? mfaToken : undefined)
      if (result?.mfaRequired) {
        setShowMFA(true)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
      if (showMFA) setMfaToken('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${showMFA ? 'bg-amber-500 rotate-12 scale-110' : 'bg-brand-green'}`}>
              {showMFA ? <ShieldCheck className="h-10 w-10 text-white" /> : <Shield className="h-10 w-10 text-white" />}
            </div>
          </div>

          <h1 className="text-3xl font-black text-center text-slate-900 mb-2 tracking-tight">
            {showMFA ? 'Secure Verification' : 'SuperAdmin Portal'}
          </h1>
          <p className="text-center text-slate-500 mb-8 font-medium">
            {showMFA ? 'Provide your authentication code to continue' : 'Enterprise Access Management'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-center animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!showMFA ? (
              <div className="space-y-5 animate-slide-up">
                <Input
                  label="Administrative Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@save2740.com"
                  required
                  className="rounded-xl h-12"
                />
                <Input
                  label="Secure Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-xl h-12"
                />
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800">Two-factor authentication is enabled for this account. Please enter the 6-digit code from your authenticator app.</p>
                </div>
                <Input
                  label="6-Digit Auth Code"
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="000 000"
                  required
                  autoFocus
                  maxLength={6}
                  className="text-center text-2xl font-black tracking-[0.5em] h-16 rounded-2xl"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all ${showMFA ? 'bg-amber-600 hover:bg-amber-700' : 'bg-brand-green hover:bg-brand-green/90'}`}
              isLoading={loading}
            >
              {showMFA ? 'Verify & Continue' : 'Initialize Session'}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            {showMFA && (
              <button
                type="button"
                onClick={() => setShowMFA(false)}
                className="w-full text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
              >
                Back to credentials
              </button>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">v2.4.0 High-Security</span>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
