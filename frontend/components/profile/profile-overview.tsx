"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, MapPin, Shield, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileOverview() {
    const { profile: user, loading } = useProfile();

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
                    <CardContent className="p-4 sm:p-6 md:p-8">
                        <div className="flex items-center gap-6">
                            <Skeleton className="w-24 h-24 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Profile Header Card */}
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl sm:rounded-3xl shadow-lg card-hover">
                <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-xl">
                                <AvatarImage src={user?.profileImage || user?.profilePicture?.url || "/placeholder-user.jpg"} alt={`${user?.firstName} ${user?.lastName}`} />
                                <AvatarFallback className="bg-brand-green text-white text-2xl font-bold">
                                    {user?.firstName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            {/* Assuming we can determine verification status from somewhere, otherwise hardcoding check for now if we want dynamic, we need that field in ProfileData or derive it */}
                            {user?.phoneVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-brand-green rounded-full p-1.5 border-2 border-white">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Basic Member
                                </Badge>
                                {/* {user?.kycVerified && (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                                        <Shield className="w-3 h-3" />
                                        KYC Verified
                                    </Badge>
                                )} */}
                            </div>
                            <p className="text-gray-600">
                                {user?.bio || "No bio added yet."}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</CardTitle>
                    <CardDescription className="text-sm">Your verified contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="p-2 sm:p-3 bg-brand-green/10 rounded-lg">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 font-medium">Email Address</p>
                            <p className="text-base text-gray-900 font-semibold">{user?.email || "user@example.com"}</p>
                        </div>
                        {user?.emailVerified && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="p-3 bg-brand-green/10 rounded-lg">
                            <Phone className="w-5 h-5 text-brand-green" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                            <p className="text-base text-gray-900 font-semibold">{user?.phoneNumber || user?.phone || "Not provided"}</p>
                        </div>
                        {user?.phoneVerified && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Personal Details */}
            <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Personal Details</CardTitle>
                    <CardDescription className="text-sm">Your personal information</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-6">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Date of Birth</p>
                            <p className="text-base text-gray-900">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Location</p>
                            <p className="text-base text-gray-900">{user?.address?.city || "Not provided"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

