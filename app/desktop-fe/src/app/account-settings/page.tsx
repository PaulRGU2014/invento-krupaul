"use client";

import React from "react";
import SettingsForm from "@/components/dashboard/account-settings/SettingsForm";
import { UserProfileProvider } from "@/components/providers/user-profile-context";
import { useSupabaseSession } from "@/components/providers/supabase-provider";

export default function AccountSettingsPage() {
  const { session } = useSupabaseSession();
  const displayName = (session?.user?.user_metadata as any)?.full_name || "";
  const email = session?.user?.email || "";

  return (
    <UserProfileProvider initialName={displayName} initialEmail={email}>
      <main className="container grid gap-6 py-6">
        <header className="grid gap-1">
          <h1 className="text-2xl">Account Settings</h1>
          <p className="text-muted">Manage your profile, security, and preferences.</p>
        </header>
        <SettingsForm />
      </main>
    </UserProfileProvider>
  );
}
