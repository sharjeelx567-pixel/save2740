'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  _id: string;
  transactionId: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  paymentMethodId?: string;
  externalTransactionId?: string;
  metadata?: any;
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionDetails();
  }, [id]);

  const fetchTransactionDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<any>(`/wallet/transactions/${id}`);

      if (response.success && response.data) {
        setTransaction(response.data);
      } else {
        setError(response.error?.error || 'Failed to load transaction');
      }
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError('An error occurred while loading transaction details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'text-green-600';
      case 'withdraw':
      case 'withdrawal':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      case 'refund':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const downloadReceipt = () => {
    if (transaction?.metadata?.receiptNumber) {
      window.open(
        `/api/payments/receipts/${transaction.metadata.receiptNumber}/html`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The transaction you are looking for does not exist."}</p>
          <button
            onClick={() => router.push('/transactions')}
            className="w-full bg-brand-green text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/transactions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Transactions</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Details</h1>
              <p className="text-gray-600">Transaction ID: {transaction.transactionId}</p>
            </div>
            <div className={`px-4 py-2 rounded-full border ${getStatusColor(transaction.status)}`}>
              <span className="font-semibold capitalize">{transaction.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Amount</h2>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className={`text-4xl font-bold ${getTypeColor(transaction.type)}`}>
                {transaction.type === 'withdraw' || transaction.type === 'withdrawal' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </div>
              <p className="text-sm text-gray-500 mt-2 capitalize">
                {transaction.type.replace('_', ' ')}
              </p>
            </div>

            {/* Transaction Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h2>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                  <dd className="text-sm font-mono text-gray-900">{transaction.transactionId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm capitalize text-gray-900">
                    {transaction.type.replace('_', ' ')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd>
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900 text-right max-w-xs">
                    {transaction.description}
                  </dd>
                </div>
                {transaction.paymentMethodId && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                    <dd className="text-sm font-mono text-gray-900">
                      {transaction.paymentMethodId.substring(0, 20)}...
                    </dd>
                  </div>
                )}
                {transaction.externalTransactionId && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">External ID</dt>
                    <dd className="text-sm font-mono text-gray-900">
                      {transaction.externalTransactionId}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-brand-green rounded-full p-2">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>

                {transaction.completedAt && (
                  <div className="flex items-start gap-4">
                    <div className="bg-green-500 rounded-full p-2">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Completed</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.completedAt)}</p>
                    </div>
                  </div>
                )}

                {transaction.failureReason && (
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500 rounded-full p-2">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-600">Failed</p>
                      <p className="text-sm text-red-500">{transaction.failureReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {transaction.status === 'completed' && transaction.metadata?.receiptNumber && (
                  <button
                    onClick={downloadReceipt}
                    className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-2.5 px-4 rounded-lg hover:bg-brand-green/90 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </button>
                )}

                {transaction.status === 'failed' && (
                  <button
                    onClick={() => router.push(`/payments/${transaction.transactionId}/retry`)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Retry Payment
                  </button>
                )}

                <button
                  onClick={() => router.push('/support')}
                  className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:border-brand-green hover:text-brand-green transition-colors font-medium"
                >
                  Need Help?
                </button>
              </div>
            </div>

            {/* Additional Info */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                <dl className="space-y-3">
                  {Object.entries(transaction.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{key}</dt>
                      <dd className="text-sm text-gray-900 mt-1 break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
