/**
 * Audit Service
 * Logging for compliance and security
 */

import { AuditLog } from '@/lib/models/audit-log';
import { connectDB } from '@/lib/db';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType: 'user' | 'wallet' | 'transaction' | 'pocket' | 'kyc' | 'referral' | 'payment' | 'system';
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Create an audit log entry
 */
export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    await connectDB();

    const auditLog = await AuditLog.create({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      deviceFingerprint: entry.deviceFingerprint,
      changes: entry.changes,
      metadata: entry.metadata,
      severity: entry.severity || 'info',
    });

    return auditLog;
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  await connectDB();

  const query: any = {};

  if (filters.userId) query.userId = filters.userId;
  if (filters.resourceType) query.resourceType = filters.resourceType;
  if (filters.resourceId) query.resourceId = filters.resourceId;
  if (filters.action) query.action = filters.action;
  if (filters.severity) query.severity = filters.severity;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .skip(filters.offset || 0)
    .lean();

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    total,
    limit: filters.limit || 100,
    offset: filters.offset || 0,
  };
}

/**
 * Helper to get client IP from request
 */
export function getClientIP(request: any): string {
  return (
    request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers?.['x-real-ip'] ||
    request.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: any): string {
  return request.headers?.['user-agent'] || 'unknown';
}
