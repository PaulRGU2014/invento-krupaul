"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
};

type NotificationPreferences = {
  enabled: boolean;
  browserPush: boolean;
  email: boolean;
  sms: boolean;
  productUpdates: boolean;
  lowStock: boolean;
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  webPermission?: NotificationPermission;
};

type TabId = "profile" | "connected" | "security" | "preferences" | "notifications";
type Tab = { id: TabId; label: string };

export default function SettingsForm() {
  const { profile: ctxProfile, setProfile: setCtxProfile } = useUserProfile();
  // Supabase session first so state initializers can consume it safely
  const { session } = useSupabaseSession();
  const { supabase } = useSupabase();
  const getProfileDefaults = (user: any): Profile => {
    const fullName = user?.user_metadata?.full_name;
    const email = user?.email;
    return {
      name: (fullName as string) || ctxProfile.name || "",
      email: (email as string) || ctxProfile.email || "",
    };
  };

  const [profile, setProfile] = useState<Profile>(() => getProfileDefaults(session?.user));
  const tabs: Tab[] = [
    { id: "profile", label: "Profile" },
    { id: "connected", label: "Connected Accounts" },
    { id: "security", label: "Security" },
    { id: "preferences", label: "Preferences" },
    { id: "notifications", label: "Notifications" },
  ];
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [security, setSecurity] = useState<Security>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferences, setPreferences] = useState<Preferences>({
    theme: "system",
  });
  const frequencyOptions = useMemo(() => ([
    { value: "immediate", label: "Immediate" },
    { value: "hourly", label: "Hourly digest" },
    { value: "daily", label: "Daily digest" },
    { value: "weekly", label: "Weekly digest" },
  ] as const), []);
  const notificationDefaults: NotificationPreferences = {
    enabled: true,
    browserPush: true,
    email: true,
    sms: false,
    productUpdates: true,
    lowStock: true,
    frequency: "immediate",
    webPermission: undefined,
  };

  const deriveNotificationPrefs = (user: any): NotificationPreferences => {
    const stored = user?.user_metadata?.notification_prefs;
    const freq = stored?.frequency;
    const allowedFreq = new Set(frequencyOptions.map((f) => f.value));
    const isValidFreq = freq && allowedFreq.has(freq);
    return {
      ...notificationDefaults,
      ...(typeof stored === "object" && stored ? stored : {}),
      frequency: isValidFreq ? freq : notificationDefaults.frequency,
    };
  };

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => deriveNotificationPrefs(session?.user));
  const [notificationDirty, setNotificationDirty] = useState(false);
  const lowStockNotifyRef = useRef(false);
  const notificationSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [messageVisible, setMessageVisible] = useState(true);
  const [messageLeaving, setMessageLeaving] = useState(false);
  const noticeDismissTimer = useRef<NodeJS.Timeout | null>(null);
  const NOTICE_ANIMATION_MS = 280;

  useEffect(() => {
    setNotificationPrefs(deriveNotificationPrefs(session?.user));
    setNotificationDirty(false);
    setProfile(getProfileDefaults(session?.user));
    setEmailLogin((prev) => ({ ...prev, email: session?.user?.email || prev.email }));
    setMessageVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailLogin, setEmailLogin] = useState({ email: session?.user?.email || ctxProfile.email || "", password: "", confirmPassword: "" });
  const [linkingEmail, setLinkingEmail] = useState(false);
  const identities = Array.isArray(session?.user?.identities) ? session.user.identities : [];
  const providers = Array.isArray(session?.user?.app_metadata?.providers) ? session?.user?.app_metadata?.providers : [];
  const hasProvider = (name: string) => identities.some((id: any) => id?.provider === name) || providers.includes(name);
  const isEmailConnected = hasProvider("email");
  const isFacebookConnected = hasProvider("facebook");

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
      setMessage("Profile saved");
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
      setMessage("Password saved");
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

  const updateNotificationPref = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
    setNotificationDirty(true);
  };

  const persistNotificationPrefs = async (autoSave: boolean) => {
    if (notificationSaving) return;
    if (!autoSave) setSaving(true);
    setMessage("Saving notifications…");
    setNotificationSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { notification_prefs: notificationPrefs },
      });
      if (error) throw error;
      try {
        await supabase.auth.refreshSession();
      } catch {}
      setMessage("Notifications saved");
      setMessageVisible(true);
      setNotificationDirty(false);
    } catch (err) {
      setMessage("Failed to save notifications");
      setMessageVisible(true);
    } finally {
      setNotificationSaving(false);
      if (!autoSave) setSaving(false);
    }
  };

  const dismissNotice = useCallback(() => {
    if (messageLeaving) return;
    if (noticeDismissTimer.current) {
      clearTimeout(noticeDismissTimer.current);
      noticeDismissTimer.current = null;
    }
    setMessageLeaving(true);
    setTimeout(() => {
      setMessageVisible(false);
      setMessage(null);
      setMessageLeaving(false);
    }, NOTICE_ANIMATION_MS);
  }, [messageLeaving, NOTICE_ANIMATION_MS]);

  useEffect(() => {
    if (!message) return;
    if (messageLeaving) return;
    setMessageVisible(true);
    setMessageLeaving(false);
    if (noticeDismissTimer.current) clearTimeout(noticeDismissTimer.current);
    noticeDismissTimer.current = setTimeout(() => {
      dismissNotice();
    }, 10000);
    return () => {
      if (noticeDismissTimer.current) {
        clearTimeout(noticeDismissTimer.current);
        noticeDismissTimer.current = null;
      }
    };
  }, [message, dismissNotice, messageLeaving]);

  useEffect(() => () => {
    if (noticeDismissTimer.current) {
      clearTimeout(noticeDismissTimer.current);
      noticeDismissTimer.current = null;
    }
  }, []);

  const requestWebPermission = async () => {
    const hasNotificationSupport = typeof window !== "undefined" && typeof Notification !== "undefined";
    if (!hasNotificationSupport) {
      setMessage("Browser notifications not supported here.");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      updateNotificationPref("webPermission", result);
      if (result === "granted") {
        setMessage("Browser notifications enabled.");
      } else if (result === "denied") {
        setMessage("Browser notifications blocked by the browser.");
      } else {
        setMessage("Browser notification permission dismissed.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to request notification permission.");
    }
  };

  useEffect(() => {
    const hasNotificationSupport = typeof window !== "undefined" && typeof Notification !== "undefined";
    const shouldNotify =
      notificationPrefs.enabled &&
      notificationPrefs.browserPush &&
      notificationPrefs.lowStock &&
      notificationPrefs.webPermission === "granted";
    if (!shouldNotify) return;
    if (!hasNotificationSupport) return;
    if (Notification.permission !== "granted") return;
    if (lowStockNotifyRef.current) return;
    try {
      // Avoid spamming: one per session/page load
      new Notification("Low stock alert", { body: "Some items are low on stock. Review inventory." });
      lowStockNotifyRef.current = true;
    } catch {
      // Swallow errors to avoid UI noise
    }
  }, [notificationPrefs.enabled, notificationPrefs.browserPush, notificationPrefs.lowStock, notificationPrefs.webPermission]);

  useEffect(() => {
    if (!notificationDirty) return;
    if (notificationSaveTimer.current) {
      clearTimeout(notificationSaveTimer.current);
    }
    notificationSaveTimer.current = setTimeout(() => {
      persistNotificationPrefs(true);
    }, 800);
    return () => {
      if (notificationSaveTimer.current) clearTimeout(notificationSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationPrefs, notificationDirty]);


  async function handleLinkEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLinkingEmail(true);
    setMessage(null);
    if (emailLogin.password !== emailLogin.confirmPassword) {
      setMessage("Passwords do not match");
      setLinkingEmail(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailLogin.email,
        password: emailLogin.password,
      });
      if (error) throw error;
      try {
        await supabase.auth.refreshSession();
      } catch {}
      setMessage(isEmailConnected ? "Login updated" : "Email login added");
      setEmailLogin((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setMessage("Failed to update email login");
    } finally {
      setLinkingEmail(false);
    }
  }

  return (
    <div className={styles.container}>
      {message && messageVisible && (
        <div
          className={`${styles.floatingNotice} ${messageLeaving ? styles.floatingNoticeLeaving : styles.floatingNoticeEntering}`}
          role="status"
          aria-live="polite"
        >
          <span>{message}</span>
          <button
            type="button"
            className={styles.floatingClose}
            onClick={dismissNotice}
            aria-label="Dismiss notification"
          >
            ×
          </button>
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
                <div className={styles.gridGap}>
                  <label className={styles.label}>Email &amp; Password</label>
                  <p>Set up or update a password login for this account.</p>
                  <p style={{ margin: 0, color: '#374151' }}>
                    Status: {isEmailConnected ? 'Connected' : 'Not connected'}
                  </p>
                  <form onSubmit={handleLinkEmailLogin} className={styles.gridGap}>
                    <div>
                      <label className={styles.label}>Email</label>
                      <input
                        className={styles.input}
                        type="email"
                        value={emailLogin.email}
                        onChange={(e) => setEmailLogin({ ...emailLogin, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Password</label>
                      <input
                        className={styles.input}
                        type="password"
                        value={emailLogin.password}
                        onChange={(e) => setEmailLogin({ ...emailLogin, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Confirm Password</label>
                      <input
                        className={styles.input}
                        type="password"
                        value={emailLogin.confirmPassword}
                        onChange={(e) => setEmailLogin({ ...emailLogin, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.button} type="submit" disabled={linkingEmail}>
                        {linkingEmail ? "Saving…" : isEmailConnected ? "Update login" : "Add email login"}
                      </button>
                    </div>
                  </form>
                </div>
                <div>
                  <label className={styles.label}>Facebook</label>
                  <div className={styles.actions}>
                    <button className={styles.button} type="button" disabled>Connect</button>
                    {isFacebookConnected && (
                      <button className={styles.button} type="button" disabled>Disconnect</button>
                    )}
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
              <div className={styles.actions}>
                <button className={styles.button} type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Notifications Section */}
        {activeTab === 'notifications' && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Notifications</h2>
            <div className={styles.gridGap} role="form" aria-label="Notification preferences">
              <p style={{ margin: 0, color: '#4b5563' }}>
                Choose how you want to be notified. We recommend keeping at least one channel on.
              </p>
              <div className={styles.gridGap}>
                <NotificationToggleRow
                  label="Enable notifications"
                  description="Master switch for all notifications."
                  value={notificationPrefs.enabled}
                  onToggle={(next) => updateNotificationPref("enabled", next)}
                />
                <NotificationToggleRow
                  label="Web notifications"
                  description="Show alerts in your browser."
                  value={notificationPrefs.browserPush}
                  disabled={!notificationPrefs.enabled}
                  onToggle={(next) => updateNotificationPref("browserPush", next)}
                  actionLabel={!notificationPrefs.enabled
                    ? undefined
                    : notificationPrefs.webPermission === "granted"
                      ? "Granted"
                      : "Enable"}
                  onAction={!notificationPrefs.enabled
                    ? undefined
                    : requestWebPermission}
                />
                <NotificationToggleRow
                  label="Email notifications"
                  description="Receive updates in your inbox."
                  value={notificationPrefs.email}
                  disabled={!notificationPrefs.enabled}
                  onToggle={(next) => updateNotificationPref("email", next)}
                />
                <NotificationToggleRow
                  label="SMS alerts"
                  description="Send important alerts via text."
                  value={notificationPrefs.sms}
                  disabled={!notificationPrefs.enabled}
                  onToggle={(next) => updateNotificationPref("sms", next)}
                />
                <NotificationToggleRow
                  label="Product updates"
                  description="Get tips, announcements, and new feature highlights."
                  value={notificationPrefs.productUpdates}
                  disabled={!notificationPrefs.enabled}
                  onToggle={(next) => updateNotificationPref("productUpdates", next)}
                />
                <NotificationToggleRow
                  label="Low stock alerts"
                  description="Notify when items fall below threshold."
                  value={notificationPrefs.lowStock}
                  disabled={!notificationPrefs.enabled}
                  onToggle={(next) => updateNotificationPref("lowStock", next)}
                />
                <div>
                  <label className={styles.label}>Notification cadence</label>
                  <select
                    className={styles.select}
                    value={notificationPrefs.frequency}
                    onChange={(e) => updateNotificationPref("frequency", e.target.value as NotificationPreferences["frequency"])}
                    disabled={!notificationPrefs.enabled}
                  >
                    {frequencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ConnectedGoogleRow({ session, supabase, onStatus }: { session: any; supabase: any; onStatus: (msg: string) => void }) {
  const identities = Array.isArray(session?.user?.identities) ? session.user.identities : [];
  const providers = Array.isArray(session?.user?.app_metadata?.providers) ? session.user.app_metadata.providers : [];
  const isConnected = identities.some((id: any) => id?.provider === 'google') || providers.includes('google') || (!!session?.user?.app_metadata?.provider && session.user.app_metadata.provider === 'google');

  const connectGoogle = async () => {
    try {
      onStatus("");
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const redirectTo = origin ? `${origin}/login` : undefined;
      if (isConnected) {
        onStatus("Google already connected.");
        return;
      }
      if (session) {
        const { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        if (error) throw error;
      }
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
        {isConnected && (
          <button className={styles.button} type="button" onClick={disconnectGoogle}>
            Disconnect
          </button>
        )}
        {/* <button className={styles.button} type="button" onClick={async () => { try { await supabase.auth.refreshSession(); onStatus("Session refreshed."); } catch { onStatus("Failed to refresh session."); } }}>
          Refresh
        </button> */}
      </div>
    </div>
  );
}

function NotificationToggleRow({
  label,
  description,
  value,
  disabled = false,
  onToggle,
  actionLabel,
  onAction,
}: {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // avoid double-trigger when clicking buttons
    onToggle(!value);
  };

  return (
    <div className={styles.toggleRow} onClick={handleRowClick} role="presentation">
      <div>
        <p className={styles.toggleLabel} style={{ margin: 0 }}>
          {label}
        </p>
        {description && (
          <p className={styles.toggleDescription}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-disabled={disabled}
        disabled={disabled}
        className={`${styles.toggle} ${value ? styles.toggleOn : ""} ${disabled ? styles.toggleDisabled : ""}`}
        onClick={() => onToggle(!value)}
      >
        <span className={styles.toggleKnob} />
      </button>
      {onAction && actionLabel && (
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
