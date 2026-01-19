'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Download, Mail } from 'lucide-react';
import { PaymentReceipt } from '@/lib/types/payment';

interface PaymentReceiptProps {
  receipt: PaymentReceipt;
  onDownload?: () => void;
}

export function PaymentReceiptComponent({ receipt, onDownload }: PaymentReceiptProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: 'Success',
      description: 'Receipt downloaded',
    });

    if (onDownload) {
      onDownload();
    }
  };

  const handleEmailReceipt = () => {
    toast({
      title: 'Success',
      description: 'Receipt sent to your email',
    });
  };

  return (
    <Card className="w-full max-w-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-bold">Payment Receipt</h3>
      </div>

      <div className="space-y-4 mb-6">
        {/* Header */}
        <div className="text-center pb-4 border-b">
          <p className="text-sm text-gray-600">Received by</p>
          <p className="text-lg font-bold">{receipt.merchantName}</p>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
          <p className="text-3xl font-bold text-green-600">
            ${(receipt.amount / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{receipt.currency}</p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Receipt Number</span>
            <span className="font-mono font-semibold">{receipt.receiptNumber}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Authorization Code</span>
            <span className="font-mono font-semibold">{receipt.authorizationCode}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Date & Time</span>
            <span className="font-semibold">{new Date(receipt.timestamp).toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-semibold font-mono">•••• {receipt.paymentMethodLast4}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status</span>
            <Badge className="bg-green-100 text-green-800">
              {receipt.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>${(receipt.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span>${(receipt.tax / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Fee</span>
            <span className="text-orange-600">-${(receipt.processingFee / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span className="text-green-600">${(receipt.total / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Description */}
        {receipt.description && (
          <div className="bg-gray-50 rounded p-3 text-sm">
            <p className="text-gray-600 mb-1">Description</p>
            <p className="font-medium">{receipt.description}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={handleDownload}
          className="w-full bg-brand-green hover:bg-brand-green/90"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Receipt
        </Button>

        <Button
          onClick={handleEmailReceipt}
          variant="outline"
          className="w-full"
        >
          <Mail className="mr-2 h-4 w-4" />
          Email Receipt
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Receipt saved to your account history
      </p>
    </Card>
  );
}
