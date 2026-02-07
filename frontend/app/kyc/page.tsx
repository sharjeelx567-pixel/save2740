'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Upload, FileText, Camera, MapPin, AlertCircle } from 'lucide-react';

interface KYCStatus {
  status: string;
  level: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    documentType: 'drivers-license',
    documentNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    addressProof: null as File | null,
  });

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/kyc/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setKycStatus(data.data);
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, endpoint: string) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();

    if (endpoint === '/kyc/upload-id') {
      formData.append('idFront', file);
    } else if (endpoint === '/kyc/selfie') {
      formData.append('selfie', file);
    } else if (endpoint === '/kyc/address') {
      formData.append('document', file);
    }

    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let frontUrl = '';
      let backUrl = '';
      let selfieUrl = '';

      // Upload ID documents
      if (formData.idFront) {
        const idFormData = new FormData();
        idFormData.append('idFront', formData.idFront);
        if (formData.idBack) {
          idFormData.append('idBack', formData.idBack);
        }

        const token = localStorage.getItem('token');
        const idResponse = await fetch('http://localhost:5000/api/kyc/upload-id', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: idFormData,
        });
        const idData = await idResponse.json();

        if (!idData.success) {
          throw new Error(idData.error || 'Failed to upload ID');
        }

        frontUrl = idData.data.frontUrl;
        backUrl = idData.data.backUrl;
      }

      // Upload selfie
      if (formData.selfie) {
        const selfieFormData = new FormData();
        selfieFormData.append('selfie', formData.selfie);

        const token = localStorage.getItem('token');
        const selfieResponse = await fetch('http://localhost:5000/api/kyc/selfie', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: selfieFormData,
        });
        const selfieData = await selfieResponse.json();

        if (!selfieData.success) {
          throw new Error(selfieData.error || 'Failed to upload selfie');
        }
        selfieUrl = selfieData.data.selfieUrl;
      }

      // Upload address proof (Note: Backend submit might not accept this field in schema yet, but we'll upload it)
      if (formData.addressProof) {
        const addressFormData = new FormData();
        addressFormData.append('document', formData.addressProof);

        const token = localStorage.getItem('token');
        const addressResponse = await fetch('http://localhost:5000/api/kyc/address', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: addressFormData,
        });
        const addressData = await addressResponse.json();

        if (!addressData.success) {
          throw new Error(addressData.error || 'Failed to upload address proof');
        }
        // addressUrl = addressData.data.addressUrl; // Schema doesn't use this yet
      }

      // Submit final KYC application
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          documentFront: frontUrl,
          documentBack: backUrl,
          selfie: selfieUrl,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('KYC application submitted successfully! We will review it within 24-48 hours.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC application');
    } finally {
      setLoading(false);
    }
  };

  // If already approved
  if (kycStatus?.status === 'approved') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              KYC Verified
            </CardTitle>
            <CardDescription>Your identity has been verified</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Your KYC verification is complete. You have full access to all features.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If pending review
  if (kycStatus?.status === 'pending') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              KYC Under Review
            </CardTitle>
            <CardDescription>Please wait while we verify your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Your KYC application is being reviewed. This usually takes 24-48 hours.
                We'll notify you once the review is complete.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-sm text-gray-600">
              <p>Submitted: {kycStatus.submittedAt ? new Date(kycStatus.submittedAt).toLocaleDateString() : 'Just now'}</p>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If rejected
  if (kycStatus?.status === 'rejected') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              KYC Rejected
            </CardTitle>
            <CardDescription>Your application needs to be resubmitted</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <strong>Reason:</strong> {kycStatus.rejectionReason || 'Please provide clearer documents'}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                setKycStatus(null);
                setStep(1);
              }}
              className="mt-4"
            >
              Resubmit KYC
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <CardDescription>
            Complete your identity verification to unlock all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`w-20 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!formData.firstName || !formData.lastName || !formData.dateOfBirth}
              >
                Next Step
              </Button>
            </div>
          )}

          {/* Step 2: ID Document */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ID Document
              </h3>

              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers-license">Driver's License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national-id">National ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentNumber">Document Number</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Enter your ID number"
                />
              </div>

              <div>
                <Label htmlFor="idFront">ID Front (Required)</Label>
                <Input
                  id="idFront"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idFront', e.target.files?.[0] || null)}
                />
                {formData.idFront && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.idFront.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="idBack">ID Back (Optional for passport)</Label>
                <Input
                  id="idBack"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idBack', e.target.files?.[0] || null)}
                />
                {formData.idBack && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.idBack.name}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={!formData.idFront || !formData.documentNumber}
                >
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Selfie */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Selfie Verification
              </h3>

              <Alert>
                <AlertDescription>
                  Please upload a clear selfie holding your ID document next to your face.
                  Make sure your face and the ID are clearly visible.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="selfie">Selfie with ID (Required)</Label>
                <Input
                  id="selfie"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                />
                {formData.selfie && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.selfie.name}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1"
                  disabled={!formData.selfie}
                >
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Address Proof */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Proof of Address
              </h3>

              <Alert>
                <AlertDescription>
                  Upload a recent utility bill, bank statement, or government document showing your address.
                  The document must be dated within the last 3 months.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="addressProof">Address Proof (Required)</Label>
                <Input
                  id="addressProof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                />
                {formData.addressProof && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.addressProof.name}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={!formData.addressProof || loading}
                >
                  {loading ? 'Submitting...' : 'Submit KYC'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

