"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Shield, Globe, DollarSign } from "lucide-react";

export function AccountSettings() {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        twoFactorAuth: false,
        marketingEmails: true,
        securityAlerts: true,
    });

    const handleToggle = (key: string) => {
        setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Notifications */}
            <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription className="text-sm">Manage how you receive updates and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-6 px-4 sm:px-6">
                    <div className="flex flex-row items-center justify-between gap-2 p-2.5 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-0 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="email" className="text-sm sm:text-base font-medium cursor-pointer block">Email Notifications</Label>
                                <p className="text-xs sm:text-sm text-gray-500">Receive account updates via email</p>
                            </div>
                        </div>
                        <Switch
                            id="email"
                            checked={settings.emailNotifications}
                            onCheckedChange={() => handleToggle("emailNotifications")}
                            className="shrink-0 scale-75 sm:scale-100 origin-right data-[state=checked]:bg-brand-green"
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 p-2.5 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-0 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="sms" className="text-sm sm:text-base font-medium cursor-pointer block">SMS Notifications</Label>
                                <p className="text-xs sm:text-sm text-gray-500">Get text messages for important events</p>
                            </div>
                        </div>
                        <Switch
                            id="sms"
                            checked={settings.smsNotifications}
                            onCheckedChange={() => handleToggle("smsNotifications")}
                            className="shrink-0 scale-75 sm:scale-100 origin-right data-[state=checked]:bg-brand-green"
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 p-2.5 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-0 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="push" className="text-sm sm:text-base font-medium cursor-pointer block">Push Notifications</Label>
                                <p className="text-xs sm:text-sm text-gray-500">Browser notifications for updates</p>
                            </div>
                        </div>
                        <Switch
                            id="push"
                            checked={settings.pushNotifications}
                            onCheckedChange={() => handleToggle("pushNotifications")}
                            className="shrink-0 scale-75 sm:scale-100 origin-right data-[state=checked]:bg-brand-green"
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 p-2.5 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-0 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="marketing" className="text-sm sm:text-base font-medium cursor-pointer block">Marketing Emails</Label>
                                <p className="text-xs sm:text-sm text-gray-500">Tips, offers, and product updates</p>
                            </div>
                        </div>
                        <Switch
                            id="marketing"
                            checked={settings.marketingEmails}
                            onCheckedChange={() => handleToggle("marketingEmails")}
                            className="shrink-0 scale-75 sm:scale-100 origin-right data-[state=checked]:bg-brand-green"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
                        Security Settings
                    </CardTitle>
                    <CardDescription className="text-sm">Enhance your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                    <div className="flex flex-row items-center justify-between gap-2 p-2.5 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green mt-0.5 sm:mt-0 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="2fa" className="text-sm sm:text-base font-medium cursor-pointer block">Two-Factor Authentication</Label>
                                <p className="text-xs sm:text-sm text-gray-600">Add an extra layer of security</p>
                            </div>
                        </div>
                        <Switch
                            id="2fa"
                            checked={settings.twoFactorAuth}
                            onCheckedChange={() => handleToggle("twoFactorAuth")}
                            className="shrink-0 scale-75 sm:scale-100 origin-right data-[state=checked]:bg-brand-green"
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between gap-2 p-2.5 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 sm:mt-0 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="security" className="text-sm sm:text-base font-medium cursor-pointer block">Security Alerts</Label>
                                <p className="text-xs sm:text-sm text-gray-500">Get notified of suspicious activity</p>
                            </div>
                        </div>
                        <Switch
                            id="security"
                            checked={settings.securityAlerts}
                            onCheckedChange={() => handleToggle("securityAlerts")}
                            className="shrink-0 scale-75 sm:scale-100 origin-right data-[state=checked]:bg-brand-green"
                        />
                    </div>

                    <Button variant="outline" className="w-full sm:w-auto border-gray-300 text-sm sm:text-base">
                        View Active Sessions
                    </Button>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-0 bg-white rounded-2xl sm:rounded-3xl shadow-lg">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
                        Preferences
                    </CardTitle>
                    <CardDescription className="text-sm">Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <div className="space-y-2">
                        <Label>Language</Label>
                        <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white">
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white">
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                            <option>GBP (£)</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <Button className="w-full md:w-auto bg-brand-green hover:bg-brand-green/90">
                            Save Preferences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
