import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * Response wrapper for consistent API responses
 */
export function apiSuccess(data: any, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

export function apiError(message: string, statusCode: number = 400, errors?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errors && { errors }),
    },
    { status: statusCode }
  );
}

/**
 * Auth middleware for protecting API routes
 * Usage: const auth = await authenticateRequest(req);
 */
export async function authenticateRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        authenticated: false,
        userId: null,
        email: null,
        error: 'Missing authentication token',
      };
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        authenticated: false,
        userId: null,
        email: null,
        error: 'Invalid or expired token',
      };
    }

    return {
      authenticated: true,
      userId: decoded.userId,
      email: decoded.email,
      error: null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: 'Authentication failed',
    };
  }
}

/**
 * Protected route wrapper
 * Usage: const auth = await withAuth(req);
 *        if (!auth.authenticated) return apiError(..., 401);
 */
export async function withAuth(req: NextRequest) {
  const auth = await authenticateRequest(req);

  if (!auth.authenticated) {
    return {
      authenticated: false,
      response: apiError(auth.error || 'Unauthorized', 401),
    };
  }

  return {
    authenticated: true,
    userId: auth.userId,
    email: auth.email,
    response: null,
  };
}

