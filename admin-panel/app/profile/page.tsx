'use client'

import { useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
    ShieldCheck, Smartphone, Key, Check, Copy,
    AlertCircle, ShieldAlert, Lock, Eye, EyeOff
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminProfilePage() {
    const { user } = useAuth()
    const [mfaSetup, setMfaSetup] = useState<any>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Password state
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    })
    const [showPasswords, setShowPasswords] = useState(false)

    const initiateMFASetup = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await api.get('/api/admin/auth/mfa/setup')
            setMfaSetup(res.data)
        } catch (err: any) {
            setError('Failed to initiate MFA setup')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyMFA = async () => {
        if (!verificationCode) return
        try {
            setLoading(true)
            setError(null)
            await api.post('/api/admin/auth/mfa/enable', {
                secret: mfaSetup.secret,
                token: verificationCode
            })
            setSuccess('MFA enabled successfully!')
            setMfaSetup(null)
            setVerificationCode('')
        } catch (err: any) {
            setError(err.message || 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.new !== passwords.confirm) {
            setError('New passwords do not match')
            return
        }

        try {
            setPasswordLoading(true)
            setError(null)
            await api.patch('/api/admin/auth/password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            })
            setSuccess('Password updated successfully!')
            setPasswords({ current: '', new: '', confirm: '' })
        } catch (err: any) {
            setError(err.message || 'Failed to update password')
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <AdminLayout>
            <PageHeader
                title="Admin Security Profile"
                description="Manage your credentials and multi-factor authentication."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Profile' }
                ]}
            />

            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Global Message */}
                {(success || error) && (
                    <div className={`p-4 rounded-xl flex gap-3 items-center ${success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-sm font-medium">{success || error}</p>
                        <button onClick={() => { setSuccess(null); setError(null) }} className="ml-auto text-xs opacity-50 hover:opacity-100">Dismiss</button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* MFA Card */}
                    <Card className="h-full">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-blue-600" /> Multi-Factor Auth
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!mfaSetup ? (
                                <div className="flex flex-col items-center text-center py-4">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Enhance Account Security</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        MFA adds an extra layer of protection by requiring a 6-digit code whenever you log in.
                                    </p>
                                    <Button variant="primary" onClick={initiateMFASetup} isLoading={loading}>
                                        Setup Authenticator
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm">
                                            <img src={mfaSetup.qrCodeUrl} alt="MFA QR Code" className="w-40 h-40" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-tight">Manual Key</p>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg font-mono text-xs">
                                                <span className="truncate max-w-[120px]">{mfaSetup.secret}</span>
                                                <button onClick={() => navigator.clipboard.writeText(mfaSetup.secret)} className="text-blue-600 hover:text-blue-800">
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-50">
                                        <Input
                                            label="Verification Code"
                                            placeholder="Verify Code"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            className="text-center font-bold tracking-widest"
                                        />
                                        <div className="flex gap-2">
                                            <Button variant="primary" className="flex-1" onClick={handleVerifyMFA} isLoading={loading}>
                                                Verify & Enable
                                            </Button>
                                            <Button variant="outline" onClick={() => setMfaSetup(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Change Password Card */}
                    <Card className="h-full">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-emerald-600" /> Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type={showPasswords ? 'text' : 'password'}
                                            label="Current Password"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <Input
                                        type={showPasswords ? 'text' : 'password'}
                                        label="New Password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type={showPasswords ? 'text' : 'password'}
                                        label="Confirm New Password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button variant="primary" type="submit" className="w-full" isLoading={passwordLoading}>
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Account Info */}
                <Card>
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-widest">Administrative Context</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">IDENTIFIER</p>
                                <p className="font-mono text-sm">{user?.id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">EMAIL ADDRESS</p>
                                <p className="text-sm font-bold">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">SECURITY ROLE</p>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <p className="text-sm font-black text-slate-900">{user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
