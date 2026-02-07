/**
 * KYC Verification Middleware
 * Enforces KYC requirements on protected endpoints
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { User } from '../models/auth.model';
import { connectDB } from '../config/db';

/**
 * Middleware to require KYC verification
 * Use this on any endpoint that requires KYC approval
 * 
 * Example:
 * router.post('/wallet/withdraw', authenticateToken, requireKycVerification, async (req, res) => {
 *   // Only KYC-approved users can reach here
 * });
 */
export const requireKycVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await connectDB();
    
    // Get user from database
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check KYC status
    if (user.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        code: 'KYC_REQUIRED',
        error: 'KYC verification required to access this feature',
        data: {
          currentStatus: user.kycStatus || 'not_submitted',
          message: getKycMessage(user.kycStatus),
          actionRequired: getKycAction(user.kycStatus)
        }
      });
    }
    
    // KYC is approved, continue
    next();
  } catch (error) {
    console.error('KYC verification middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify KYC status'
    });
  }
};

/**
 * Optional middleware - allows access but warns if KYC not done
 * Useful for features that work better with KYC but don't require it
 */
export const recommendKycVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await connectDB();
    
    const user = await User.findById(req.userId);
    
    if (user && user.kycStatus !== 'approved') {
      // Attach warning to request
      (req as any).kycWarning = {
        status: user.kycStatus,
        message: 'Complete KYC verification to unlock full features'
      };
    }
    
    // Always continue
    next();
  } catch (error) {
    // Don't fail request if this check fails
    console.error('KYC recommendation check error:', error);
    next();
  }
};

/**
 * Check if user has minimum KYC level
 * @param requiredLevel - 'basic' | 'verified' | 'premium'
 */
export const requireKycLevel = (requiredLevel: 'basic' | 'verified' | 'premium') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await connectDB();
      
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const userLevel = (user as any).accountTier || 'basic';
      const levels = ['basic', 'verified', 'premium'];
      
      const userLevelIndex = levels.indexOf(userLevel);
      const requiredLevelIndex = levels.indexOf(requiredLevel);
      
      if (userLevelIndex < requiredLevelIndex) {
        return res.status(403).json({
          success: false,
          code: 'KYC_LEVEL_INSUFFICIENT',
          error: `${requiredLevel} account tier required`,
          data: {
            currentLevel: userLevel,
            requiredLevel,
            message: `Upgrade to ${requiredLevel} tier to access this feature`
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('KYC level check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify account tier'
      });
    }
  };
};

// Helper functions
function getKycMessage(status: string): string {
  switch (status) {
    case 'not_submitted':
      return 'Please complete KYC verification to access this feature';
    case 'pending':
      return 'Your KYC is under review. You will be notified once approved';
    case 'rejected':
      return 'Your KYC was rejected. Please review the feedback and resubmit';
    default:
      return 'KYC verification required';
  }
}

function getKycAction(status: string): string {
  switch (status) {
    case 'not_submitted':
      return 'Submit KYC documents';
    case 'pending':
      return 'Wait for review';
    case 'rejected':
      return 'Resubmit with corrections';
    default:
      return 'Complete KYC';
  }
}
