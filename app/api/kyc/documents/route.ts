/**
 * KYC Documents API
 * POST /api/kyc/documents - Upload KYC document
 * GET /api/kyc/documents - Get user's KYC documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { KycDocument } from '@/lib/models/kyc-document';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/services/audit-service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      documentType,
      documentNumber,
      frontImageUrl,
      backImageUrl,
      selfieImageUrl,
      metadata,
    } = body;

    // Validation
    if (!documentType || !frontImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Document type and front image are required' },
        { status: 400 }
      );
    }

    const validTypes = ['passport', 'drivers-license', 'national-id', 'utility-bill', 'bank-statement'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create KYC document
    const kycDocument = await KycDocument.create({
      userId,
      documentType,
      documentNumber,
      frontImageUrl,
      backImageUrl,
      selfieImageUrl,
      status: 'pending',
      metadata,
    });

    // Update user KYC status
    await User.findOneAndUpdate(
      { userId },
      { kycStatus: 'pending' }
    );

    // Audit log
    await logAuditEvent({
      userId,
      action: 'kyc_document_uploaded',
      resourceType: 'kyc',
      resourceId: kycDocument._id.toString(),
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      metadata: {
        documentType,
        hasBackImage: !!backImageUrl,
        hasSelfie: !!selfieImageUrl,
      },
      severity: 'info',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          documentId: kycDocument._id.toString(),
          status: kycDocument.status,
          message: 'KYC document submitted for review',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading KYC document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload KYC document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const documents = await KycDocument.find({ userId }).sort({ createdAt: -1 });

    // Get user KYC status
    const user = await User.findOne({ userId });
    const kycStatus = user?.kycStatus || 'pending';

    return NextResponse.json(
      {
        success: true,
        data: {
          documents: documents.map((doc) => ({
            id: doc._id.toString(),
            documentType: doc.documentType,
            status: doc.status,
            rejectionReason: doc.rejectionReason,
            verifiedAt: doc.verifiedAt,
            createdAt: doc.createdAt,
          })),
          kycStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching KYC documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KYC documents' },
      { status: 500 }
    );
  }
}
