'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { getPaymentDetails, refundPayment, approvePayment, rejectPayment } from '@/lib/services/payments.service';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.transactionId as string;

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Approval State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Rejection State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [transactionId]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      const response = await getPaymentDetails(transactionId);
      setPayment(response);
      setRefundAmount(response.transaction.amount.toString());
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundAmount || !refundReason) {
      alert('Please enter refund amount and reason');
      return;
    }

    setRefunding(true);
    try {
      await refundPayment(transactionId, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      });
      alert('Refund processed successfully');
      setRefundModalOpen(false);
      fetchPaymentDetails(); // Refresh data
    } catch (error: any) {
      console.error('Error processing refund:', error);
      alert(`Failed to process refund: ${error.message}`);
    } finally {
      setRefunding(false);
    }
  };

  /* Handlers */

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approvePayment(transactionId, { notes: approvalNotes });
      alert('Payout approved successfully');
      setApproveModalOpen(false);
      fetchPaymentDetails();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      alert(`Failed to approve: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      alert('Please enter a rejection reason');
      return;
    }
    setRejecting(true);
    try {
      await rejectPayment(transactionId, { reason: rejectReason });
      alert('Payout rejected successfully');
      setRejectModalOpen(false);
      fetchPaymentDetails();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      alert(`Failed to reject: ${error.message}`);
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!payment) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Payment not found</p>
          <Button onClick={() => router.push('/payments')} className="mt-4">
            Back to Payments
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { transaction, receipt, webhookEvents, wallet } = payment;

  return (
    <AdminLayout>
      <PageHeader
        title="Payment Details"
        description={`Transaction ID: ${transaction.transactionId}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Transaction Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono">{transaction.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge
                  variant={
                    transaction.status === 'completed'
                      ? 'success'
                      : transaction.status === 'pending'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {transaction.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span>{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              {transaction.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span>{formatDate(transaction.completedAt)}</span>
                </div>
              )}
              {transaction.failureReason && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Failure Reason:</span>
                  <span className="text-red-600">{transaction.failureReason}</span>
                </div>
              )}
              {transaction.externalTransactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Stripe Payment Intent:</span>
                  <span className="font-mono text-sm">
                    {transaction.externalTransactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>
                  {transaction.userId.firstName} {transaction.userId.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span>{transaction.userId.email}</span>
              </div>
              {transaction.userId.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span>{transaction.userId.phone}</span>
                </div>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/users/${transaction.userId._id}`)}
                >
                  View User Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Receipt Info */}
          {receipt && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Receipt</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt Number:</span>
                  <span className="font-mono">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="capitalize">
                    {receipt.paymentMethod.brand || receipt.paymentMethod.type}
                    {receipt.paymentMethod.last4 && ` ****${receipt.paymentMethod.last4}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span>{formatDate(receipt.paymentDate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Events */}
          {webhookEvents && webhookEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Webhook Events</h2>
              <div className="space-y-2">
                {webhookEvents.map((event: any) => (
                  <div
                    key={event._id}
                    className="border rounded p-3 text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{event.eventType}</span>
                      <Badge
                        variant={
                          event.status === 'processed'
                            ? 'success'
                            : event.status === 'failed'
                              ? 'danger'
                              : 'default'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {formatDate(event.createdAt)}
                    </div>
                    {event.lastProcessingError && (
                      <div className="text-red-600 text-xs mt-1">
                        Error: {event.lastProcessingError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              {transaction.status === 'completed' &&
                transaction.type === 'deposit' && (
                  <Button
                    onClick={() => setRefundModalOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Issue Refund
                  </Button>
                )}

              {/* Pending Withdrawal Actions */}
              {transaction.status === 'pending' &&
                (transaction.type === 'withdrawal' || transaction.type === 'payout' || transaction.type === 'withdraw') && (
                  <>
                    <Button
                      onClick={() => setApproveModalOpen(true)}
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Approve Payout
                    </Button>
                    <Button
                      onClick={() => setRejectModalOpen(true)}
                      variant="danger"
                      className="w-full"
                    >
                      Reject Payout
                    </Button>
                  </>
                )}

              <Button
                onClick={() => router.push('/payments')}
                variant="outline"
                className="w-full"
              >
                Back to Payments
              </Button>
            </div>
          </div>

          {/* Wallet Info */}
          {wallet && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Wallet Balance</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Balance:</span>
                  <span className="font-semibold">
                    {formatCurrency(wallet.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(wallet.availableBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Locked:</span>
                  <span className="font-semibold">
                    {formatCurrency(wallet.locked)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Issue Refund"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount
            </label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              max={transaction.amount}
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {formatCurrency(transaction.amount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setRefundModalOpen(false)}
              disabled={refunding}
            >
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={refunding}>
              {refunding ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Payout"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to approve this payout of <strong>{formatCurrency(transaction.amount)}</strong>?
            This will mark the transaction as completed.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Notes (Optional)
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Internal notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setApproveModalOpen(false)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approving ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Payout"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rejecting this payout will refund <strong>{formatCurrency(transaction.amount)}</strong> back to the user's wallet.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason (Required)
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (visible to user)..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejecting}
              variant="danger"
            >
              {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
