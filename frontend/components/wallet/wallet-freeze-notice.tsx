/**
 * Wallet Freeze Notice Component
 * Displays notification when wallet is frozen due to security reasons
 */

'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertTriangle,
  Lock,
  Clock,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

interface WalletFreezeData {
  isFrozen: boolean
  freezeDate: string
  freezeReason: string
  estimatedUnfreezeDate?: string
  requiresVerification: boolean
  verificationCode?: string
}

interface FreezeNoticeProps {
  frozen: boolean
  freezeDate?: string
  freezeReason?: string
  estimatedUnfreezeDate?: string
}

export function WalletFreezeNotice({
  frozen,
  freezeDate,
  freezeReason = 'Security Review',
  estimatedUnfreezeDate,
}: FreezeNoticeProps) {
  const { toast } = useToast()
  const [unfreezingStep, setUnfreezingStep] = useState<'prompt' | 'code' | 'success'>('prompt')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)

  if (!frozen) {
    return null
  }

  const handleUnfreezeClick = () => {
    setUnfreezingStep('code')
  }

  const handleSubmitCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your verification code',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/wallet/unfreeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          verificationCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unfreeze wallet')
      }

      setUnfreezingStep('success')
      toast({
        title: 'Success',
        description: 'Your wallet has been unfrozen',
      })

      // Reload page after 3 seconds
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unfreeze wallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (unfreezingStep === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Wallet Unfrozen</h3>
              <p className="text-sm text-green-800">
                Your wallet has been successfully unfrozen. You can now perform transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Verification code screen
  if (unfreezingStep === 'code') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Verify to Unfreeze
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-white border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              We've sent a verification code to your email. Please check your inbox and enter it below.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmitCode}
            disabled={loading || !verificationCode}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Verifying...' : 'Verify and Unfreeze'}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setUnfreezingStep('prompt')}
            disabled={loading}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Main freeze notice
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Wallet Frozen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Freeze Information */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Reason</p>
            <p className="font-semibold text-gray-900">{freezeReason}</p>
          </div>

          {freezeDate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Freeze Date</p>
              <p className="text-gray-900">
                {new Date(freezeDate).toLocaleString()}
              </p>
            </div>
          )}

          {estimatedUnfreezeDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Expected Unfreeze Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(estimatedUnfreezeDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Impact Alert */}
        <Alert className="bg-red-100 border-red-300">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <AlertDescription className="text-red-800 text-sm">
            <p className="font-semibold mb-1">Your wallet is currently frozen.</p>
            <p>
              You cannot deposit, withdraw, or transfer funds while your wallet is frozen.
              This is typically a temporary security measure.
            </p>
          </AlertDescription>
        </Alert>

        {/* Reasons for Freeze */}
        <div className="bg-white rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-900">Common Reasons:</p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
            <li>Suspicious transaction activity detected</li>
            <li>Account security verification needed</li>
            <li>Compliance review in progress</li>
            <li>Multiple failed transaction attempts</li>
            <li>Unusual access pattern detected</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={handleUnfreezeClick}
          >
            <Lock className="mr-2 h-4 w-4" />
            Unfreeze Wallet
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </Button>
            <Button variant="outline" className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              Call Support
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-brand-green text-sm">
            <p className="font-semibold mb-2">Need Help?</p>
            <div className="space-y-1 text-xs">
              <p>Email: support@example.com</p>
              <p>Phone: 1-800-XXX-XXXX</p>
              <p>Available 24/7 for urgent issues</p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

