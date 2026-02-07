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



export function useReferrals() {
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReferrals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<any>('/api/referrals');

            if (response.success && response.data) {
                // Handle double-wrapped response: { success, data: { success, data: {...} } }
                const rawData = response.data?.data || response.data;
                
                // Map backend response to frontend ReferralData interface
                const code = rawData.referralCode || '';
                const mappedData: ReferralData = {
                    referralCode: code,
                    referralLink: code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?ref=${code}` : '',
                    friendsInvited: rawData.totalReferrals || 0,
                    qualifiedReferrals: rawData.totalReferrals || 0, // Assuming all are qualified for now
                    totalEarnings: rawData.totalEarnings || 0,
                    pendingEarnings: rawData.pendingEarnings || 0,
                };
                setData(mappedData);
            } else {
                setError(response.error?.error || 'Failed to fetch referral data');
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
