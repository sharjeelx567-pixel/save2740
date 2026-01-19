// lib/referral-fraud-detection.ts - Prevent referral abuse

export interface ReferralAttempt {
  referrerId: string
  refereeId: string
  refereeEmail: string
  refereePhone: string
  refereeIP: string
  deviceFingerprint: string
  timestamp: Date
}

export interface FraudDetectionResult {
  isFraudulent: boolean
  riskScore: number // 0-100
  reasons: string[]
  action: "approve" | "flag" | "reject"
}

/**
 * Detect fraudulent referral attempts
 */
export function detectFraudulentReferral(
  attempt: ReferralAttempt,
  referralHistory: ReferralAttempt[]
): FraudDetectionResult {
  const reasons: string[] = []
  let riskScore = 0

  // Check 1: Duplicate email (same email can't be referred twice)
  const duplicateEmail = referralHistory.some(
    (h) => h.refereeEmail.toLowerCase() === attempt.refereeEmail.toLowerCase() && h.timestamp
  )
  if (duplicateEmail) {
    reasons.push("Duplicate email: This email has already been referred")
    riskScore += 40
  }

  // Check 2: Duplicate phone (same phone can't be referred twice)
  if (attempt.refereePhone) {
    const duplicatePhone = referralHistory.some(
      (h) => h.refereePhone === attempt.refereePhone
    )
    if (duplicatePhone) {
      reasons.push("Duplicate phone: This phone has already been referred")
      riskScore += 35
    }
  }

  // Check 3: Same IP address with multiple referrals in short time (likely bot/automated)
  const sameIPLastHour = referralHistory.filter(
    (h) =>
      h.refereeIP === attempt.refereeIP &&
      Date.now() - h.timestamp.getTime() < 3600000 // Last hour
  )
  if (sameIPLastHour.length >= 5) {
    reasons.push("Suspicious activity: Multiple referrals from same IP in short time")
    riskScore += 50
  }

  // Check 4: Same referrer multiple referrals in very short time (likely mass referral attempt)
  const sameReferrerLastMin = referralHistory.filter(
    (h) =>
      h.referrerId === attempt.referrerId &&
      Date.now() - h.timestamp.getTime() < 60000 // Last minute
  )
  if (sameReferrerLastMin.length >= 3) {
    reasons.push("Suspicious activity: Too many referrals in short time")
    riskScore += 45
  }

  // Check 5: Device fingerprint mismatch (same person using different devices for multiple referrals)
  const sameDeviceMultipleReferrals = referralHistory.filter(
    (h) =>
      h.deviceFingerprint === attempt.deviceFingerprint &&
      h.referrerId !== attempt.referrerId // Different referrer IDs
  )
  if (sameDeviceMultipleReferrals.length >= 3) {
    reasons.push("Device reuse detected: Same device used for multiple referrer accounts")
    riskScore += 55
  }

  // Check 6: Self-referral (referrer and referee can't be same person)
  if (attempt.referrerId === attempt.refereeId) {
    reasons.push("Invalid: Cannot refer yourself")
    riskScore = 100
  }

  // Check 7: Suspicious email patterns
  const suspiciousEmailPatterns = [
    /\+\d+@/, // Gmail +number pattern (temp emails)
    /test@/i,
    /demo@/i,
    /fake@/i,
    /temp@/i,
  ]

  if (suspiciousEmailPatterns.some((pattern) => pattern.test(attempt.refereeEmail))) {
    reasons.push("Suspicious email format")
    riskScore += 20
  }

  // Check 8: Temporary email service detection
  const tempEmailDomains = [
    "tempmail.com",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
    "throwaway.email",
  ]

  const emailDomain = attempt.refereeEmail.split("@")[1]?.toLowerCase()
  if (tempEmailDomains.includes(emailDomain)) {
    reasons.push("Temporary email service detected")
    riskScore += 60
  }

  // Determine action
  let action: "approve" | "flag" | "reject" = "approve"
  if (riskScore >= 70) {
    action = "reject"
  } else if (riskScore >= 40) {
    action = "flag" // Manual review needed
  }

  return {
    isFraudulent: riskScore >= 70,
    riskScore: Math.min(riskScore, 100),
    reasons,
    action,
  }
}

/**
 * Validate referral bonus eligibility
 */
export function validateReferralBonus(
  refereeId: string,
  referreeActivationData: {
    accountCreatedDate: Date
    kycCompletedDate?: Date
    firstSavingsDate?: Date
    activeSaverPockets: number
  }
): {
  eligible: boolean
  reasons: string[]
  bonusAmount: number
} {
  const reasons: string[] = []
  let bonusAmount = 0
  let eligible = true

  // Check 1: Account must be older than 24 hours
  const accountAge = Date.now() - referreeActivationData.accountCreatedDate.getTime()
  if (accountAge < 86400000) {
    // 24 hours in milliseconds
    reasons.push("Account must be at least 24 hours old")
    eligible = false
  }

  // Check 2: KYC must be completed
  if (!referreeActivationData.kycCompletedDate) {
    reasons.push("KYC verification must be completed")
    eligible = false
  }

  // Check 3: User must have made at least one $27.40 saving
  if (!referreeActivationData.firstSavingsDate) {
    reasons.push("Referee must complete at least one daily saving")
    eligible = false
  }

  // Bonus calculation (progressive based on engagement)
  if (eligible) {
    bonusAmount = 50 // Base bonus

    // Extra bonus if saving streak
    if (referreeActivationData.activeSaverPockets >= 1) {
      bonusAmount += 10
    }
    if (referreeActivationData.activeSaverPockets >= 3) {
      bonusAmount += 15
    }
  }

  return {
    eligible,
    reasons,
    bonusAmount,
  }
}

/**
 * Get referral fraud statistics
 */
export function getReferralFraudStats(referralHistory: ReferralAttempt[]) {
  const totalAttempts = referralHistory.length
  const fraudulentAttempts = referralHistory.filter(
    (attempt) => detectFraudulentReferral(attempt, referralHistory).isFraudulent
  ).length

  const flaggedAttempts = referralHistory.filter(
    (attempt) => detectFraudulentReferral(attempt, referralHistory).action === "flag"
  ).length

  const fraudPercentage = totalAttempts > 0 ? (fraudulentAttempts / totalAttempts) * 100 : 0

  return {
    totalAttempts,
    fraudulentAttempts,
    flaggedAttempts,
    approvedAttempts: totalAttempts - fraudulentAttempts - flaggedAttempts,
    fraudPercentage: fraudPercentage.toFixed(2),
  }
}

/**
 * Blacklist a referrer/referee
 */
export function blacklistUser(
  userId: string,
  reason: string,
  duration: "permanent" | "7days" | "30days"
) {
  return {
    userId,
    reason,
    duration,
    blacklistedAt: new Date(),
    expiresAt:
      duration === "permanent"
        ? null
        : new Date(
          Date.now() +
          (duration === "7days" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)
        ),
  }
}
