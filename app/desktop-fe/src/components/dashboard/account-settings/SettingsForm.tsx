"use client";

import React, { useState } from "react";
// Supabase hooks already imported below in this file
import styles from "./account-settings.module.scss";
import { useUserProfile } from "@/components/providers/user-profile-context";
import { useSupabaseSession, useSupabase } from "@/components/providers/supabase-provider";

type Profile = {
  name: string;
  email: string;
};

type Security = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type Preferences = {
  theme: "system" | "light" | "dark";
  notifications: boolean;
};

type TabId = "profile" | "connected" | "security" | "preferences";
type Tab = { id: TabId; label: string };

export default function SettingsForm() {
  const { profile: ctxProfile, setProfile: setCtxProfile } = useUserProfile();
  const [profile, setProfile] = useState<Profile>({ name: ctxProfile.name || "", email: ctxProfile.email || "" });
  const tabs: Tab[] = [
    { id: "profile", label: "Profile" },
    { id: "connected", label: "Connected Accounts" },
    { id: "security", label: "Security" },
    { id: "preferences", label: "Preferences" },
  ];
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  // Using existing Supabase session and client declarations in this component
  const { session } = useSupabaseSession();
  const { supabase } = useSupabase();
  const [security, setSecurity] = useState<Security>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferences, setPreferences] = useState<Preferences>({
    theme: "system",
    notifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // Persist to Supabase user metadata (full_name)
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profile.name },
      });
      if (error) throw error;
      // Best-effort refresh session so new metadata is loaded
      try {
        await supabase.auth.refreshSession();
      } catch {}
      // Update local context so header reflects changes immediately
      setCtxProfile({ name: profile.name, email: profile.email });
      setMessage("Profile updated");
    } catch (err) {
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    if (security.newPassword !== security.confirmPassword) {
      setSaving(false);
      setMessage("New passwords do not match");
      return;
    }
    try {
      // TODO: Integrate with real auth API
      await new Promise((r) => setTimeout(r, 600));
      setMessage("Password changed");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage("Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // TODO: Persist preferences to user settings
      await new Promise((r) => setTimeout(r, 400));
      setMessage("Preferences saved");
    } catch (err) {
      setMessage("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      {message && (
        <div className={styles.notice}>
          <span>{message}</span>
        </div>
      )}

      <div>
        <h6>Account Settings</h6>
        <p>Manage your account settings and preferences</p>
      </div>
      <div className={styles.tabs}>
        <div className={styles.tabSelectWrapper}>
          <select
            className={styles.tabSelect}
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            aria-label="Choose settings section"
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.tabHeader}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`${styles.tabButton} ${activeTab === t.id ? styles.active : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-pressed={activeTab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Section */}
        {activeTab === 'profile' && (
          <div className={styles.sectionGridTwo}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Profile</h2>
              <form onSubmit={handleSaveProfile} className={styles.gridGap}>
                <div>
                  <label className={styles.label}>Name</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className={styles.actions}>
                  <button className={styles.button} type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>

            {/* Optional extra card for avatar or bio to fill grid */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Avatar</h2>
              <div className={styles.gridGap}>
                <p>Upload or change your profile picture (placeholder).</p>
                <div className={styles.actions}>
                  <button className={styles.button} type="button">Upload</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Connected Accounts Section */}
        {activeTab === 'connected' && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Connected Accounts</h2>
            <div className={styles.gridGap}>
              <p>Manage external login providers linked to your account.</p>
              <div className={styles.gridGap}>
                <ConnectedGoogleRow session={session} supabase={supabase} onStatus={(msg) => setMessage(msg)} />
                <div>
                  <label className={styles.label}>Facebook</label>
                  <div className={styles.actions}>
                    <button className={styles.button} type="button" disabled>Connect</button>
                    <button className={styles.button} type="button" disabled>Disconnect</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Security Section */}
        {activeTab === 'security' && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Security</h2>
            <form onSubmit={handleChangePassword} className={styles.gridGap}>
              <div>
                <label className={styles.label}>Current Password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={security.currentPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className={styles.label}>New Password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={security.newPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Confirm New Password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={security.confirmPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.actions}>
                <button className={styles.button} type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Change Password"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Preferences Section */}
        {activeTab === 'preferences' && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Preferences</h2>
            <form onSubmit={handleSavePreferences} className={styles.gridGap}>
              <div>
                <label className={styles.label}>Theme</label>
                <select
                  className={styles.select}
                  value={preferences.theme}
                  onChange={(e) =>
                    setPreferences({ ...preferences, theme: e.target.value as Preferences["theme"] })
                  }
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notifications: e.target.checked })
                  }
                />
                <span>Enable notifications</span>
              </label>
              <div className={styles.actions}>
                <button className={styles.button} type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

function ConnectedGoogleRow({ session, supabase, onStatus }: { session: any; supabase: any; onStatus: (msg: string) => void }) {
  const isConnected = Array.isArray(session?.user?.identities)
    ? session.user.identities.some((id: any) => id?.provider === 'google')
    : !!session?.user?.app_metadata?.provider && session.user.app_metadata.provider === 'google';

  const connectGoogle = async () => {
    try {
      onStatus("");
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const redirectTo = origin ? `${origin}/login` : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      // Supabase will redirect; if using PKCE without redirect, handle accordingly.
      onStatus("Redirecting to Google OAuth…");
    } catch (err: any) {
      onStatus(err?.message || "Failed to start Google connect");
    }
  };

  const disconnectGoogle = async () => {
    try {
      onStatus("");
      const identities: any[] = session?.user?.identities || [];
      const googleIdentity = identities.find((i: any) => i?.provider === 'google');
      if (!googleIdentity) {
        onStatus("Google is not connected.");
        return;
      }
      const { error } = await supabase.auth.unlinkIdentity({ provider: 'google', identity_id: googleIdentity?.identity_id });
      if (error) throw error;
      onStatus("Google disconnected.");
      // Attempt to refresh the session so UI updates immediately
      try {
        await supabase.auth.refreshSession();
      } catch {}
    } catch (err: any) {
      onStatus(err?.message || "Failed to disconnect Google");
    }
  };

  return (
    <div className={styles.providerRow}>
      <div className={styles.providerLeft}>
        <span className={styles.providerLogo} aria-hidden>
          {/* Minimal Google "G" logo */}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" fillRule="evenodd">
              <path d="M12 10.2v3.9h5.6c-.24 1.44-1.7 4.22-5.6 4.22-3.37 0-6.12-2.8-6.12-6.25S8.63 5.82 12 5.82c1.92 0 3.22.82 3.96 1.53l2.7-2.61C17.16 3.34 14.8 2.5 12 2.5 6.93 2.5 2.8 6.63 2.8 11.7S6.93 20.9 12 20.9c6.3 0 9.3-4.41 9.3-8.95 0-.6-.06-1.02-.14-1.45H12z" fill="#4285F4"/>
            </g>
          </svg>
        </span>
        <label className={styles.label}>Google</label>
      </div>
      <div className={styles.actions}>
        <button className={styles.button} type="button" onClick={connectGoogle} disabled={isConnected}>
          {isConnected ? "Connected" : "Connect"}
        </button>
        <button className={styles.button} type="button" onClick={disconnectGoogle} disabled={!isConnected}>
          Disconnect
        </button>
        {/* <button className={styles.button} type="button" onClick={async () => { try { await supabase.auth.refreshSession(); onStatus("Session refreshed."); } catch { onStatus("Failed to refresh session."); } }}>
          Refresh
        </button> */}
      </div>
    </div>
  );
}
