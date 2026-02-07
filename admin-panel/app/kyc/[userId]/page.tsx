'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { kycService } from '@/lib/services/kyc.service';
import { ArrowLeft, CheckCircle, XCircle, FileText, Camera, MapPin, AlertCircle, Clock, User } from 'lucide-react';
import Image from 'next/image';

interface KYCData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    kycStatus: string;
    accountStatus: string;
    emailVerified: boolean;
    phoneNumber?: string;
    createdAt: string;
    lastLogin?: string;
  };
  kyc: {
    id: string;
    documentType: string;
    documentNumber: string;
    status: string;
    frontImageUrl: string;
    backImageUrl?: string;
    selfieImageUrl?: string;
    rejectionReason?: string;
    submittedAt: string;
    reviewedAt?: string;
  } | null;
}

export default function KYCReviewPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [data, setData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userId) {
      fetchKYCData();
    }
  }, [userId]);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const data = await kycService.getKYCByUserId(userId);
      setData(data);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      setError('Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    // We allow approving even if doc is missing IF the admin really wants to (via a "force" mechanic, 
    // but for now we'll stick to requiring it, OR handle the error if it fails).
    // Actually, let's fix the undefined 'api' error first.

    // SAFE ID: If data.kyc is null, we pass empty string. Backend should handle user update if it can find the user.
    // However, backend requires kycId for the kycDoc lookup. 
    // If we want to approve a user without a doc, we might need a different endpoint or update the backend.
    // For now, let's assume we proceed with kycService.approveKYC.

    if (!data?.kyc) {
      setError('Cannot approve: No KYC document record found. Please ask user to resubmit.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await kycService.approveKYC(userId, data.kyc.id, notes);

      setSuccess('KYC application approved successfully!');
      setTimeout(() => {
        router.push('/kyc');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    // Use safe ID if available, or empty string. Backend handles empty kycId by just updating the user.
    const safeKycId = data?.kyc?.id || '';

    try {
      await kycService.rejectKYC(userId, safeKycId, rejectionReason, notes);
      setSuccess('KYC application rejected');
      setTimeout(() => {
        router.push('/kyc');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleRequestReupload = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for re-upload');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const safeKycId = data?.kyc?.id || '';

    try {
      await kycService.requestReupload(userId, safeKycId, rejectionReason, notes);
      setSuccess('Re-upload requested successfully');
      setTimeout(() => {
        router.push('/kyc');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to request re-upload');
    } finally {
      setActionLoading(false);
      setShowReuploadModal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  // REMOVED early return for !data.kyc to allow handling users with missing docs
  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-600 mb-4">Could not load user data.</p>
          <button
            onClick={() => router.push('/kyc')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to KYC List
          </button>
        </div>
      </div>
    );
  }

  // Helper ID for actions - use real ID or empty string (service will handle it)
  const targetKycId = data.kyc?.id || '';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/kyc')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to KYC List
        </button>
        <h1 className="text-3xl font-bold text-gray-900">KYC Review</h1>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {data.user.firstName} {data.user.lastName}
                </h3>
                <p className="text-sm text-gray-600">{data.user.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">KYC Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${data.user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  data.user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    data.user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {data.user.kycStatus || 'Not Submitted'}
                </span>
              </div>

              <div>
                <p className="text-gray-500">Account Status</p>
                <p className="font-medium text-gray-900">{data.user.accountStatus}</p>
              </div>

              <div>
                <p className="text-gray-500">Email Verified</p>
                <p className="font-medium text-gray-900">
                  {data.user.emailVerified ? '✓ Yes' : '✗ No'}
                </p>
              </div>

              {data.user.phoneNumber && (
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{data.user.phoneNumber}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(data.user.createdAt).toLocaleDateString()}
                </p>
              </div>

              {data.user.lastLogin && (
                <div>
                  <p className="text-gray-500">Last Login</p>
                  <p className="font-medium text-gray-900">
                    {new Date(data.user.lastLogin).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="mt-6 pt-6 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Add internal notes..."
              />
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Info Card */}
          {data.kyc ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Information
              </h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Document Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {data.kyc.documentType.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Document Number</p>
                  <p className="font-medium text-gray-900">{data.kyc.documentNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(data.kyc.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${data.kyc.status === 'approved' ? 'bg-green-100 text-green-800' :
                    data.kyc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      data.kyc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {data.kyc.status}
                  </span>
                </div>
              </div>

              {data.kyc.rejectionReason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-700">{data.kyc.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500 italic border border-dashed border-gray-300">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Record Found</h3>
              <p className="mb-4 text-sm">The user has a pending status but no KYC document was found in the database (likely a submission error).</p>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
              >
                Reject & Reset User
              </button>
            </div>
          )}

          {/* ID Front - Only if kyc exists */}
          {data.kyc && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ID Front
              </h3>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                {data.kyc.frontImageUrl ? (
                  <Image
                    src={`http://localhost:5000${data.kyc.frontImageUrl}`}
                    alt="ID Front"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ID Back */}
          {data.kyc?.backImageUrl && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ID Back
              </h3>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={`http://localhost:5000${data.kyc.backImageUrl}`}
                  alt="ID Back"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Selfie */}
          {data.kyc?.selfieImageUrl && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Selfie Verification
              </h3>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={`http://localhost:5000${data.kyc.selfieImageUrl}`}
                  alt="Selfie"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Action Buttons - Show if status is pending (either user or kyc) */}
          {(data.user.kycStatus === 'pending' || data.kyc?.status === 'pending') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Actions</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleApprove}
                  title={!data.kyc ? "Documents missing - cannot approve" : "Approve this application"}
                  disabled={actionLoading || !data.kyc} // Disable approve if no doc
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  {actionLoading ? 'Processing...' : 'Approve KYC'}
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                  Reject KYC
                </button>

                <button
                  onClick={() => setShowReuploadModal(true)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <AlertCircle className="h-5 w-5" />
                  Request Re-upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject KYC Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejection. The user will see this message.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              rows={4}
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-upload Modal */}
      {showReuploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Document Re-upload</h3>
            <p className="text-sm text-gray-600 mb-4">
              Explain what needs to be corrected. The user will be able to resubmit.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              rows={4}
              placeholder="What needs to be corrected..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReuploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReupload}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Request Re-upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
