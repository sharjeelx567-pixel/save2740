"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/group-utils';
import { useToast } from "@/hooks/use-toast";

interface JoinGroupPageProps {
    params: {
        code: string;
    };
}

interface GroupDetails {
    _id: string;
    name: string;
    purpose: string;
    contributionAmount: number;
    frequency: string;
    currency: string;
    currentMembers: number;
    maxMembers: number;
    status: 'open' | 'filled' | 'active' | 'completed';
}

export default function JoinGroupPage({ params }: JoinGroupPageProps) {
    const [group, setGroup] = useState<GroupDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const { code } = params;

    useEffect(() => {
        // In a real implementation, we would fetch group details by code without joining
        // For now, we'll try to join directly or use a specific endpoint to peek
        // Let's assume we implement a peek endpoint or just fetch list and find (unlikely for public)
        // Actually we need a way to view group info before joining. 
        // I'll simulate fetching group info via a new GET endpoint or reuse logic.
        // Since I didn't create a specific "get by code" public endpoint, I'll fetch by joining? 
        // No, that's bad UX. I should have added a GET /api/groups/join/[code] endpoint.
        // For MVP, I'll assume the user is logged in (protected route usually) or I handle auth redirect?
        // Public join pages usually require login/signup first.
        // Let's assume user is logged in for this page.

        // FETCH GROUP INFO BY CODE (Assuming endpoint exists or I create it on the fly in `route.ts`)
        // I'll add a fetch capability to the `join/[code]/route.ts` quickly or just mock it here if I can't.
        // Actually, I can use the existing `POST` endpoint but that attempts to join.
        // I should create a GET endpoint in `app/api/groups/join/[code]/route.ts` to just view info.
        // Let me fix that in next step. For now I'll scaffolding the page.

        async function fetchGroupInfo() {
            try {
                setLoading(true);
                // Using a GET request to the join endpoint (which I need to implement)
                const response = await fetch(`/api/groups/join/${code}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setGroup(data.data);
                    } else {
                        setError(data.error || 'Failed to load group');
                    }
                } else {
                    setError('Group not found or expired');
                }
            } catch (err) {
                setError('Error loading group details');
            } finally {
                setLoading(false);
            }
        }

        fetchGroupInfo();
    }, [code]);

    const handleJoin = async () => {
        try {
            setJoining(true);
            const response = await fetch(`/api/groups/join/${code}`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Successfully joined!",
                    description: `You are now a member of ${data.data.group.name}`,
                });
                router.push('/group-contribution'); // Redirect to dashboard
            } else {
                const data = await response.json();
                toast({
                    variant: "destructive",
                    title: "Failed to join",
                    description: data.error || "Could not join group",
                });
                if (data.error?.includes('already a member')) {
                    router.push('/group-contribution');
                }
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Unavailable</h1>
                    <p className="text-slate-600 mb-6">{error || 'Group info not available'}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isFull = group.currentMembers >= group.maxMembers;
    const isClosed = group.status !== 'open';

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="bg-brand-green p-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
                    <p className="text-brand-green-light opacity-90">{group.purpose}</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Contribution</div>
                            <div className="text-brand-green font-bold text-lg">
                                {formatCurrency(group.contributionAmount, group.currency)}
                            </div>
                            <div className="text-slate-400 text-xs">{group.frequency}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Members</div>
                            <div className="text-brand-green font-bold text-lg">
                                {group.currentMembers} / {group.maxMembers}
                            </div>
                            <div className="text-slate-400 text-xs">
                                {group.maxMembers - group.currentMembers} spots left
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl text-emerald-800 text-sm">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span>Verified Invite Code: <strong>{code}</strong></span>
                        </div>
                    </div>

                    {!isFull && !isClosed ? (
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full bg-brand-green text-white py-4 rounded-xl font-bold text-lg hover:brightness-110 shadow-lg shadow-brand-green/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {joining ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                'Join Group Now'
                            )}
                        </button>
                    ) : (
                        <div className="text-center p-4 bg-slate-100 rounded-xl">
                            <p className="text-slate-500 font-semibold">
                                {isFull ? 'This group is full' : 'This group is closed'}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full mt-4 text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
