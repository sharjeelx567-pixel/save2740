/**
 * KYC Status Component - Enhanced Professional Version
 * Modern drag-and-drop upload with previews and animations
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, AlertCircle, Clock, XCircle, Camera, FileText, Upload, X, Eye, FileCheck } from 'lucide-react'

interface KYCStatus {
  status: 'not_started' | 'pending' | 'verified' | 'rejected'
  completionPercentage: number
  verificationDate?: string
  documents: {
    idFront?: { uploadedAt: string; status: string; url?: string }
    idBack?: { uploadedAt: string; status: string; url?: string }
    selfie?: { uploadedAt: string; status: string; url?: string }
    addressProof?: { uploadedAt: string; status: string; url?: string }
  }
  limits: {
    dailyTransactionLimit: number
    monthlyTransactionLimit: number
    dailyWithdrawalLimit: number
  }
  nextReviewDate?: string
  rejectionReason?: string
}

export function KYCStatus() {
  const [loading, setLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [kycStatus, setKYCStatus] = useState<KYCStatus | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  const fileInputRef = {
    idFront: useRef<HTMLInputElement>(null),
    idBack: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
    addressProof: useRef<HTMLInputElement>(null),
  }

  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        const response = await fetch('/api/kyc/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        })

        if (!response.ok) throw new Error('Failed to fetch KYC status')

        const { data } = await response.json()
        setKYCStatus(data)
      } catch (error) {
        console.error('Error fetching KYC status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKYCStatus()
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, docType: string) => {
    e.preventDefault()
    setDragOver(docType)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, docType: 'id_front' | 'id_back' | 'selfie' | 'address_proof') => {
    e.preventDefault()
    setDragOver(null)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file, docType)
    }
  }, [])

  const uploadFile = async (file: File, documentType: 'id_front' | 'id_back' | 'selfie' | 'address_proof') => {
    setUploadingType(documentType)
    setUploadProgress(0)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPreviewUrls(prev => ({ ...prev, [documentType]: previewUrl }))

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const response = await fetch('/api/kyc/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const { completionPercentage } = await response.json()
      setUploadProgress(100)

      if (kycStatus) {
        setKYCStatus({
          ...kycStatus,
          completionPercentage,
        })
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      setPreviewUrls(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[documentType]
        return newPreviews
      })
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setUploadingType(null)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: 'id_front' | 'id_back' | 'selfie' | 'address_proof'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFile(file, documentType)
    e.target.value = ''
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"><CheckCircle2 className="w-3 h-3" />Verified</Badge>
      case 'pending_review':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Clock className="w-3 h-3" />Under Review</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>
      default:
        return <Badge variant="outline" className="border-slate-300 gap-1"><Upload className="w-3 h-3" />Not Uploaded</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Loading KYC information...</p>
        </div>
      </div>
    )
  }

  if (!kycStatus) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700 text-sm">Failed to load KYC status. Please refresh the page.</AlertDescription>
      </Alert>
    )
  }

  const docStatus = [
    { key: 'idFront', label: 'Government ID (Front)', icon: FileText, ref: fileInputRef.idFront, type: 'id_front' as const, desc: 'Clear photo of front side' },
    { key: 'idBack', label: 'Government ID (Back)', icon: FileText, ref: fileInputRef.idBack, type: 'id_back' as const, desc: 'Clear photo of back side' },
    { key: 'selfie', label: 'Selfie with ID', icon: Camera, ref: fileInputRef.selfie, type: 'selfie' as const, desc: 'Hold your ID next to face' },
    { key: 'addressProof', label: 'Address Proof', icon: FileCheck, ref: fileInputRef.addressProof, type: 'address_proof' as const, desc: 'Utility bill or bank statement' },
  ]

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      {/* Status Alerts */}
      {kycStatus.status === 'rejected' && (
        <Alert className="border-2 border-red-200 bg-red-50 animate-fade-in">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <AlertDescription className="text-red-700 font-geist">
            <div className="font-bold text-base mb-1">Verification Rejected</div>
            <p className="text-sm">{kycStatus.rejectionReason || 'Your KYC verification was rejected. Please resubmit with clear documents.'}</p>
          </AlertDescription>
        </Alert>
      )}

      {kycStatus.status === 'pending' && (
        <Alert className="border-2 border-amber-200 bg-amber-50 animate-fade-in">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <AlertDescription className="text-amber-700 font-geist">
            <div className="font-bold text-base mb-1">Verification Under Review</div>
            <p className="text-sm">Your documents are being reviewed. This typically takes 1-2 business days.</p>
          </AlertDescription>
        </Alert>
      )}

      {kycStatus.status === 'verified' && (
        <Alert className="border-2 border-emerald-200 bg-emerald-50 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
          <AlertDescription className="text-emerald-700 font-geist">
            <div className="font-bold text-base mb-1">✅ Verification Complete</div>
            <p className="text-sm">Your identity has been verified. Your transaction limits have been increased.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Card */}
      <Card className="border-0 bg-[#1E293B] text-white rounded-3xl shadow-xl card-hover transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-white font-geist">Know Your Customer (KYC)</CardTitle>
              <CardDescription className="text-slate-300 text-base mt-2 font-geist">
                Complete your identity verification to unlock all features
              </CardDescription>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-5xl font-bold text-brand-green font-geist animate-pulse-scale">{kycStatus.completionPercentage}%</div>
              <p className="text-slate-400 text-sm mt-1 font-geist">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 font-geist">Verification Progress</span>
              <span className="text-slate-300 font-geist text-sm">{kycStatus.completionPercentage}%</span>
            </div>
            <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-green via-emerald-400 to-teal-400 transition-all duration-1000 rounded-full relative overflow-hidden"
                style={{ width: `${kycStatus.completionPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast"></div>
              </div>
            </div>
          </div>

          {/* Transaction Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-hover p-5 bg-slate-800 rounded-xl border border-slate-700 transition-all">
              <p className="text-slate-400 text-sm font-semibold mb-2 font-geist">Daily Limit</p>
              <p className="text-3xl font-bold text-brand-green font-geist">
                ${kycStatus.limits.dailyTransactionLimit.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1 font-geist">per transaction</p>
            </div>
            <div className="card-hover p-5 bg-slate-800 rounded-xl border border-slate-700 transition-all">
              <p className="text-slate-400 text-sm font-semibold mb-2 font-geist">Monthly Limit</p>
              <p className="text-3xl font-bold text-brand-green font-geist">
                ${kycStatus.limits.monthlyTransactionLimit.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1 font-geist">total per month</p>
            </div>
            <div className="card-hover p-5 bg-slate-800 rounded-xl border border-slate-700 transition-all">
              <p className="text-slate-400 text-sm font-semibold mb-2 font-geist">Withdrawal Limit</p>
              <p className="text-3xl font-bold text-brand-green font-geist">
                ${kycStatus.limits.dailyWithdrawalLimit.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-1 font-geist">daily withdrawal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Upload Card */}
      <Card className="border-0 bg-white rounded-3xl shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-slate-900 font-geist">Upload Documents</CardTitle>
          <CardDescription className="text-slate-600 text-base mt-2 font-geist">
            Drag and drop or click to upload. Required: {docStatus.filter(d => !kycStatus.documents[d.key as keyof KYCStatus['documents']]).length} more documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docStatus.map((doc) => {
              const IconComponent = doc.icon
              const isUploaded = !!kycStatus.documents[doc.key as keyof KYCStatus['documents']]
              const docData = kycStatus.documents[doc.key as keyof KYCStatus['documents']]
              const isUploading = uploadingType === doc.type
              const preview = previewUrls[doc.type]

              return (
                <div key={doc.key} className="relative">
                  <input
                    ref={doc.ref}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleDocumentUpload(e, doc.type)}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => handleDragOver(e, doc.type)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, doc.type)}
                    onClick={() => !isUploaded && doc.ref.current?.click()}
                    className={`
                      card-hover relative p-6 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
                      ${dragOver === doc.type ? 'border-brand-green bg-emerald-50 scale-105' : 'border-slate-300 bg-slate-50'}
                      ${isUploaded ? 'border-solid border-emerald-300 bg-emerald-50/50' : ''}
                      ${isUploading ? 'pointer-events-none' : 'hover:border-brand-green hover:bg-emerald-50/30'}
                    `}
                  >
                    <div className="text-center space-y-3">
                      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isUploaded ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                        ) : (
                          <IconComponent className={`w-8 h-8 ${isUploaded ? 'text-brand-green' : 'text-slate-500'}`} />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 font-geist">{doc.label}</h3>
                        <p className="text-sm text-slate-600 font-geist mt-1">{doc.desc}</p>
                      </div>

                      {isUploading && (
                        <div className="space-y-2">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-brand-green font-semibold">{uploadProgress}% uploaded</p>
                        </div>
                      )}

                      {isUploaded && docData ? (
                        <div className="space-y-2">
                          {getStatusBadge(docData.status)}
                          <p className="text-xs text-slate-500">
                            Uploaded {new Date(docData.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ) : !isUploading && (
                        <div className="flex items-center justify-center gap-2 text-brand-green font-semibold text-sm">
                          <Upload className="w-4 h-4" />
                          <span>Click or drag to upload</span>
                        </div>
                      )}

                      {preview && !isUploaded && (
                        <div className="mt-3">
                          <img src={preview} alt="Preview" className="mx-auto h-24 rounded-lg object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {kycStatus.status !== 'verified' && (
            <div className="pt-6 border-t border-slate-200">
              <Button
                disabled={kycStatus.status === 'pending'}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold py-4 rounded-xl transition-all text-base font-geist shadow-lg hover:shadow-xl"
              >
                {kycStatus.status === 'pending' ? (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Documents Under Review
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit KYC Verification
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl shadow-lg border border-emerald-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 font-geist flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-brand-green" />
            Verification Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-base text-slate-700 font-geist">
            <li className="flex gap-3 items-start">
              <span className="text-brand-green font-bold flex-shrink-0 mt-0.5 text-xl">✓</span>
              <span>Ensure all documents are <strong>clear and readable</strong></span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-green font-bold flex-shrink-0 mt-0.5 text-xl">✓</span>
              <span>All <strong>four corners</strong> of ID must be visible in photos</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-green font-bold flex-shrink-0 mt-0.5 text-xl">✓</span>
              <span>Use <strong>well-lit conditions</strong> with no glare or shadows</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-green font-bold flex-shrink-0 mt-0.5 text-xl">✓</span>
              <span>Address proof must be <strong>recent</strong> (within 3 months)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
