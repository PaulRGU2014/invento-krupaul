"use client";

import React from "react";
import SettingsForm from "@/components/dashboard/account-settings/SettingsForm";

export default function AccountSettingsPage() {
  return (
    <main className="container grid gap-6 py-6">
      <header className="grid gap-1">
        <h1 className="text-2xl">Account Settings</h1>
        <p className="text-muted">Manage your profile, security, and preferences.</p>
      </header>
      <SettingsForm />
    </main>
  );
}
