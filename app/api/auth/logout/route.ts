import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

/**
 * POST /api/auth/logout
 * Clear user session and logout
 */
export async function POST(req: NextRequest) {
  try {
    // Get authorization header to verify user is authenticated
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return apiError('Missing authentication token', 401);
    }

    // In real implementation, you would:
    // 1. Invalidate the token in database (blacklist)
    // 2. Clear any session data
    // 3. Log the logout action

    // For now, just return success
    // Client will handle clearing localStorage

    return apiSuccess(
      {
        message: 'Logged out successfully',
        redirectTo: '/auth/login',
      },
      200
    );
  } catch (error) {
    console.error('Logout error:', error);
    return apiError('Failed to logout', 500);
  }
}
