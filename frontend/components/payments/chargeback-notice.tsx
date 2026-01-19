'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Clock, FileText, Phone } from 'lucide-react';
import { ChargebackNotice } from '@/lib/types/payment';
import { Progress } from '@/components/ui/progress';

interface ChargebackNoticeComponentProps {
  chargebackId: string;
}

export function ChargebackNoticeComponent({ chargebackId }: ChargebackNoticeComponentProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [chargeback, setChargeback] = useState<ChargebackNotice | null>(null);

  useEffect(() => {
    fetchChargeback();
  }, [chargebackId]);

  const fetchChargeback = async () => {
    try {
      const response = await fetch(`/api/payments/chargebacks/${chargebackId}`, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setChargeback(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load chargeback notice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (!chargeback) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Chargeback not found</p>
      </Card>
    );
  }

  const getStatusColor = () => {
    switch (chargeback.status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'initiated':
        return 'bg-red-100 text-red-800';
      case 'under-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'appealed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const daysRemaining = Math.ceil(
    (new Date(chargeback.responseDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const progressPercent = Math.max(0, Math.min(100, ((45 - daysRemaining) / 45) * 100));

  const submittedDocs = chargeback.requiredDocuments.filter((doc) => doc.submitted).length;
  const totalDocs = chargeback.requiredDocuments.length;

  return (
    <div className="space-y-4">
      {/* Alert Header */}
      <Alert className="border-red-300 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800 font-semibold">
          URGENT: Chargeback Case Filed
        </AlertDescription>
      </Alert>

      {/* Case Information */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">Chargeback Case #{chargeback.caseNumber}</h3>
            <p className="text-sm text-gray-600">Filed on {new Date(chargeback.initiatedDate).toLocaleDateString()}</p>
          </div>
          <Badge className={getStatusColor()}>{chargeback.status.toUpperCase()}</Badge>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Amount in Dispute</p>
          <p className="text-3xl font-bold text-red-600">${(chargeback.amount / 100).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{chargeback.currency}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Merchant</p>
            <p className="text-sm font-semibold">{chargeback.merchantName}</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Card</p>
            <p className="text-sm font-mono font-semibold">•••• {chargeback.cardLast4}</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Bank</p>
            <p className="text-sm font-semibold">{chargeback.bankName}</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500">Reason</p>
            <p className="text-sm font-semibold capitalize">{chargeback.reason.replace('-', ' ')}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Description</p>
          <p className="text-sm">{chargeback.description}</p>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Case Timeline
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">Case Progress</span>
              <span className="text-sm text-gray-600">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="border-l-2 border-gray-300 pl-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-semibold">INITIATED</p>
              <p className="text-sm text-gray-700">{new Date(chargeback.initiatedDate).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1">
                {daysRemaining > 0 ? '🟡 RESPONSE DUE' : '⛔ OVERDUE'}
              </p>
              <p className="text-sm text-gray-700">
                {new Date(chargeback.responseDeadline).toLocaleDateString()}
              </p>
              {daysRemaining > 0 && (
                <p className="text-xs text-yellow-700 mt-1">{daysRemaining} days remaining</p>
              )}
              {daysRemaining <= 0 && (
                <p className="text-xs text-red-700 mt-1">Deadline passed - immediate action required</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 font-semibold">DUE DATE</p>
              <p className="text-sm text-gray-700">{new Date(chargeback.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Required Documents */}
      <Card className="p-6">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Required Documents ({submittedDocs}/{totalDocs})
        </h4>

        <div className="space-y-2">
          {chargeback.requiredDocuments.map((doc, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border ${
                doc.submitted
                  ? 'bg-green-50 border-green-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{doc.name}</span>
                <Badge
                  className={
                    doc.submitted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {doc.submitted ? 'SUBMITTED' : 'PENDING'}
                </Badge>
              </div>
              {doc.submitted && doc.submittedAt && (
                <p className="text-xs text-gray-600 mt-1">
                  Submitted {new Date(doc.submittedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {submittedDocs < totalDocs && (
          <Alert className="mt-4 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 text-sm">
              Submit all required documents before the deadline to avoid losing your chargeback case.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Bank Contact */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Bank Contact Information
        </h4>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600">Phone</p>
            <p className="font-semibold text-blue-600">{chargeback.contactInfo.phone}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600">Email</p>
            <p className="font-semibold text-blue-600">{chargeback.contactInfo.email}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600">Mailing Address</p>
            <p className="font-semibold text-sm">{chargeback.contactInfo.address}</p>
          </div>
        </div>

        <Button className="w-full mt-4 bg-brand-green hover:bg-brand-green/90">
          Contact Bank Now
        </Button>
      </Card>

      {/* Outcome (if decided) */}
      {chargeback.outcome && (
        <Card className={`p-6 ${
          chargeback.outcome.decision === 'chargeback-upheld'
            ? 'border-red-200 bg-red-50'
            : 'border-green-200 bg-green-50'
        }`}>
          <h4 className="font-bold mb-4">Case Resolution</h4>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Decision</p>
              <Badge
                className={
                  chargeback.outcome.decision === 'chargeback-upheld'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }
              >
                {chargeback.outcome.decision === 'chargeback-upheld'
                  ? 'CHARGEBACK UPHELD'
                  : 'CHARGEBACK REVERSED'}
              </Badge>
            </div>

            <div>
              <p className="text-xs text-gray-600">Decided On</p>
              <p className="font-semibold">
                {new Date(chargeback.outcome.decidedAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600">Amount Awarded</p>
              <p className="text-xl font-bold text-green-600">
                ${(chargeback.outcome.amountAwarded / 100).toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded p-3 border">
              <p className="text-xs text-gray-600 mb-1">Notes</p>
              <p className="text-sm">{chargeback.outcome.notes}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
