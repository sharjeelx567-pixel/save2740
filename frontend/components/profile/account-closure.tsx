"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, Lock, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { API } from "@/lib/constants";

export function AccountClosure() {
    const router = useRouter(); const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");

    const handleDelete = async () => {
        if (confirmation !== "DELETE") {
            setError('Please type "DELETE" to confirm');
            return;
        }

        if (!password) {
            setError("Please enter your password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API.BASE_URL}/api/account`, {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ password, confirm: confirmation === "DELETE" }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete account");
            }

            // Redirect to goodbye page
            router.push("/goodbye");
        } catch (err: any) {
            setError(err.message || "Failed to delete account");
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="space-y-6 animate-fade-in">
                <Alert className="border-2 border-red-200 bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <AlertDescription className="text-red-700 ml-2">
                        <strong>Warning:</strong> Account deletion is permanent and cannot be undone.
                    </AlertDescription>
                </Alert>

                <Card className="border-2 border-red-200 bg-white rounded-3xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            <Trash2 className="w-6 h-6" />
                            Delete Account
                        </CardTitle>
                        <CardDescription>Permanently remove your account and all associated data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="font-semibold text-gray-900 text-lg">What will be deleted:</h3>
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>All your personal information and profile data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>Your savings goals and transaction history</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>All documents and KYC verification data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>Access to Save2740 services and features</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-900">
                                <strong>Note:</strong> You have a 30-day grace period. Your account will be deactivated immediately,
                                but you can contact support within 30 days to restore it.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => setStep(2)}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Continue with Deletion
                            </Button>
                            <Button
                                variant="outline"
                                className="border-gray-300 flex-1 sm:flex-none"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
            )}

            <Card className="border-2 border-red-200 bg-white rounded-3xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <Lock className="w-6 h-6" />
                        Confirm Account Deletion
                    </CardTitle>
                    <CardDescription>This action requires verification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Enter Your Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Current password"
                                className="border-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmation">
                                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                            </Label>
                            <Input
                                id="confirmation"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value)}
                                placeholder="Type DELETE"
                                className="border-gray-300"
                            />
                        </div>
                    </div>

                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <AlertDescription className="text-red-700 ml-2">
                            <strong>Final Warning:</strong> Once confirmed, your account will be permanently deleted after 30 days.
                        </AlertDescription>
                    </Alert>

                    <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleDelete}
                            disabled={loading || confirmation !== "DELETE"}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting Account...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete My Account
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-gray-300 flex-1 sm:flex-none"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

