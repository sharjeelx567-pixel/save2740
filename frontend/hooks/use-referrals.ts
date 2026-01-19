/**
 * useReferrals Hook
 * Fetches referral data for the authenticated user
 */

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface ReferralData {
    referralCode: string;
    referralLink: string;
    friendsInvited: number;
    qualifiedReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
}

interface ApiResponse {
    success: boolean;
    data?: ReferralData;
    error?: string;
}

export function useReferrals() {
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReferrals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/referrals', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const result: ApiResponse = await response.json();

            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch referral data');
            }
        } catch (err) {
            console.error('[useReferrals] Error:', err);
            setError('Failed to load referral data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const refetch = useCallback(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    return {
        data,
        loading,
        error,
        refetch,
        referralCode: data?.referralCode || '',
        referralLink: data?.referralLink || '',
        friendsInvited: data?.friendsInvited || 0,
        qualifiedReferrals: data?.qualifiedReferrals || 0,
        totalEarnings: data?.totalEarnings || 0,
        pendingEarnings: data?.pendingEarnings || 0,
    };
}
