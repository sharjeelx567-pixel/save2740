/**
 * Profile Page - Complete Account Management
 * Tabbed interface for Profile, Security, KYC, Settings, and Account Management
 */

"use client";

import { ProtectedPage } from "@/components/protected-page";
import { LoadingDelay } from "@/components/loading-delay";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { User, Lock, Shield, Settings, AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { EditProfile } from "@/components/profile/edit-profile";
import { ChangePassword } from "@/components/profile/change-password";
import { KYCStatus } from "@/components/profile/kyc-status";
import { AccountSettings } from "@/components/profile/account-settings";
import { AccountClosure } from "@/components/profile/account-closure";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "kyc", label: "KYC Verification", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "danger", label: "Account", icon: AlertTriangle },
];

function ProfilePageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [subTab, setSubTab] = useState<"overview" | "edit">("overview");

  // Update active tab if URL parameter changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return subTab === "overview" ? (
          <div className="space-y-6">
            <ProfileOverview />
            <div className="flex justify-center">
              <button
                onClick={() => setSubTab("edit")}
                className="px-8 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setSubTab("overview")}
              className="text-brand-green font-medium hover:underline mb-4"
            >
              ← Back to Overview
            </button>
            <EditProfile />
          </div>
        );
      case "security":
        return <ChangePassword />;
      case "kyc":
        return <KYCStatus />;
      case "settings":
        return <AccountSettings />;
      case "danger":
        return <AccountClosure />;
      default:
        return <ProfileOverview />;
    }
  };

  return (
    <LoadingDelay minDisplayTime={1000}>
      <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto flex flex-col">
          <DashboardHeader title="Profile" onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Page Header */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-5 md:px-8 lg:px-10 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-slate-900 mb-2">
                Account Settings
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Manage your profile, security, and preferences
              </p>
            </div>
          </div>

          {/* Tabs - Mobile Responsive with Horizontal Scroll */}
          <div className="bg-white border-b border-slate-200 sticky top-[73px] z-10">
            <div className="max-w-7xl mx-auto">
              {/* Horizontal scroll container for mobile */}
              <div className="overflow-x-auto hide-scrollbar">
                <div className="flex gap-1 px-2 sm:px-4 md:px-8 lg:px-10 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (tab.id === "profile") setSubTab("overview");
                        }}
                        className={`
                          flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b-2 transition-all whitespace-nowrap
                          ${isActive
                            ? "border-brand-green text-brand-green font-semibold"
                            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs sm:text-sm md:text-base">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 sm:px-5 md:px-8 lg:px-10 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
          </div>
        </main>
      </div>
    </LoadingDelay>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedPage>
      <ProfilePageContent />
    </ProtectedPage>
  );
}
