"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { User } from "@supabase/supabase-js";
// Supabase hooks already imported below in this file
import styles from "./account-settings.module.scss";
import { useUserProfile } from "@/components/providers/user-profile-context";
import { useSupabaseSession, useSupabase } from "@/components/providers/supabase-provider";
import { ProfileTab } from "./ProfileTab";
import { ConnectedTab } from "./ConnectedTab";
import { SecurityTab } from "./SecurityTab";
import { PreferencesTab } from "./PreferencesTab";
import { NotificationsTab } from "./NotificationsTab";
import { useI18n } from "@/lib/i18n";

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

type Identity = { provider?: string };

export default function SettingsForm() {
  const { t } = useI18n();
  const { profile: ctxProfile, setProfile: setCtxProfile } = useUserProfile();
  // Supabase session first so state initializers can consume it safely
  const { session } = useSupabaseSession();
  const { supabase } = useSupabase();
  const getProfileDefaults = (user: User | null): Profile => {
    const fullName = user?.user_metadata?.full_name as string | undefined;
    const email = user?.email as string | undefined;
    return {
      name: (fullName as string) || ctxProfile.name || "",
      email: (email as string) || ctxProfile.email || "",
    };
  };

  const [profile, setProfile] = useState<Profile>(() => getProfileDefaults(session?.user ?? null));
  const tabs: Tab[] = [
    { id: "profile", label: t('settings.tabs.profile', 'Profile') },
    { id: "connected", label: t('settings.tabs.connected', 'Connected Accounts') },
    { id: "security", label: t('settings.tabs.security', 'Security') },
    { id: "preferences", label: t('settings.tabs.preferences', 'Preferences') },
    { id: "notifications", label: t('settings.tabs.notifications', 'Notifications') },
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
  const frequencyOptions = useMemo(
    () =>
      ([
        { value: "immediate", label: t('settings.notifications.frequency.immediate', 'Immediate') },
        { value: "hourly", label: t('settings.notifications.frequency.hourly', 'Hourly digest') },
        { value: "daily", label: t('settings.notifications.frequency.daily', 'Daily digest') },
        { value: "weekly", label: t('settings.notifications.frequency.weekly', 'Weekly digest') },
      ] as const),
    [t]
  );
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

  const deriveNotificationPrefs = (user: User | null): NotificationPreferences => {
    const stored = user?.user_metadata?.notification_prefs as Partial<NotificationPreferences> | undefined;
    const freq = stored?.frequency;
    const allowedFreq = new Set(frequencyOptions.map((f) => f.value));
    const isValidFreq = freq && allowedFreq.has(freq);
    return {
      ...notificationDefaults,
      ...(typeof stored === "object" && stored ? stored : {}),
      frequency: isValidFreq ? freq : notificationDefaults.frequency,
    };
  };

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    deriveNotificationPrefs(session?.user ?? null)
  );
  const [notificationDirty, setNotificationDirty] = useState(false);
  const lowStockNotifyRef = useRef(false);
  const notificationSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [messageVisible, setMessageVisible] = useState(true);
  const [messageLeaving, setMessageLeaving] = useState(false);
  const noticeDismissTimer = useRef<NodeJS.Timeout | null>(null);
  const NOTICE_ANIMATION_MS = 280;

  useEffect(() => {
    setNotificationPrefs(deriveNotificationPrefs(session?.user ?? null));
    setNotificationDirty(false);
    setProfile(getProfileDefaults(session?.user ?? null));
    setEmailLogin((prev) => ({ ...prev, email: session?.user?.email || prev.email }));
    setMessageVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailLogin, setEmailLogin] = useState({ email: session?.user?.email || ctxProfile.email || "", password: "", confirmPassword: "" });
  const [linkingEmail, setLinkingEmail] = useState(false);
  const identities = Array.isArray(session?.user?.identities) ? (session.user.identities as Identity[]) : [];
  const providers = Array.isArray(session?.user?.app_metadata?.providers) ? (session?.user?.app_metadata?.providers as string[]) : [];
  const hasProvider = (name: string) => identities.some((id) => id?.provider === name) || providers.includes(name);
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
      setMessage(t('settings.profile.saved', 'Profile saved'));
    } catch {
      setMessage(t('settings.profile.saveFailed', 'Failed to update profile'));
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
      setMessage(t('settings.security.passwordSaved', 'Password saved'));
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setMessage(t('settings.security.passwordFailed', 'Failed to change password'));
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
      setMessage(t('settings.preferences.saved', 'Preferences saved'));
    } catch {
      setMessage(t('settings.preferences.saveFailed', 'Failed to save preferences'));
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
    setMessage(t('settings.notifications.saving', 'Saving notifications…'));
    setNotificationSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { notification_prefs: notificationPrefs },
      });
      if (error) throw error;
      try {
        await supabase.auth.refreshSession();
      } catch {}
      setMessage(t('settings.notifications.saved', 'Notifications saved'));
      setMessageVisible(true);
      setNotificationDirty(false);
    } catch {
      setMessage(t('settings.notifications.saveFailed', 'Failed to save notifications'));
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

  useEffect(
    () => () => {
      if (noticeDismissTimer.current) {
        clearTimeout(noticeDismissTimer.current);
        noticeDismissTimer.current = null;
      }
    },
    []
  );

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
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to request notification permission.");
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
      setMessage(t('signup.passwordMismatch', 'Passwords do not match'));
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
      setMessage(isEmailConnected ? t('settings.connected.loginUpdated', 'Login updated') : t('settings.connected.emailAdded', 'Email login added'));
      setEmailLogin((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch {
      setMessage(t('settings.connected.emailUpdateFailed', 'Failed to update email login'));
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
            aria-label={t('settings.notice.dismiss', 'Dismiss notification')}
          >
            ×
          </button>
        </div>
      )}

      <div>
        <h6>{t('settings.title', 'Account Settings')}</h6>
        <p>{t('settings.subtitle', 'Manage your account settings and preferences')}</p>
      </div>
      <div className={styles.tabs}>
        <div className={styles.tabSelectWrapper}>
          <select
            className={styles.tabSelect}
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            aria-label={t('settings.chooseSection', 'Choose settings section')}
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
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {/* Connected Accounts Section */}
        {activeTab === "connected" && (
          <ConnectedTab
            session={session}
            supabase={supabase}
            isEmailConnected={isEmailConnected}
            isFacebookConnected={isFacebookConnected}
            emailLogin={emailLogin}
            setEmailLogin={setEmailLogin}
            handleLinkEmailLogin={handleLinkEmailLogin}
            linkingEmail={linkingEmail}
            onStatus={(msg: string) => setMessage(msg)}
          />
        )}

        {/* Security Section */}
        {activeTab === "security" && (
          <SecurityTab
            security={security}
            setSecurity={setSecurity}
            saving={saving}
            onChangePassword={handleChangePassword}
          />
        )}

        {/* Preferences Section */}
        {activeTab === "preferences" && (
          <PreferencesTab
            preferences={preferences}
            setPreferences={setPreferences}
            saving={saving}
            onSavePreferences={handleSavePreferences}
          />
        )}

        {/* Notifications Section */}
        {activeTab === "notifications" && (
          <NotificationsTab
            notificationPrefs={notificationPrefs}
            updateNotificationPref={updateNotificationPref}
            frequencyOptions={frequencyOptions}
            requestWebPermission={requestWebPermission}
            notificationSaving={notificationSaving}
            notificationDirty={notificationDirty}
          />
        )}
      </div>
    </div>
  );
}
