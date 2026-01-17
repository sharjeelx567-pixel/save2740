import { IGroup, IGroupMember } from '@/lib/models/group.model';

// Generate unique 6-character join code
export function generateJoinCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate referral link from code
export function generateReferralLink(code: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://save2740.app';
    return `${baseUrl}/join/${code}`;
}

// Check if group is ready for contributions
export function isGroupReadyForContributions(group: any): boolean {
    return group.status === 'filled' || group.status === 'active';
}

// Calculate payout positions based on rule
export function calculatePayoutPosition(
    currentMembersCount: number,
    rule: 'as-joined' | 'random' | 'rotating'
): number {
    // For new members joining, usually just append to end 
    // Re-shuffling happens when group fills if rule is 'random'
    return currentMembersCount + 1;
}

// Format currency
export function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}
