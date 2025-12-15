// Connected account row for Google
"use client";

import React from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import styles from "./account-settings.module.scss";
import { useI18n } from "@/lib/i18n";

type ConnectedGoogleRowProps = {
  session: Session | null;
  supabase: SupabaseClient;
  onStatus: (msg: string) => void;
};

type Identity = { provider?: string; identity_id?: string };

export function ConnectedGoogleRow({ session, supabase, onStatus }: ConnectedGoogleRowProps) {
  const { t } = useI18n();
  const identities = Array.isArray(session?.user?.identities) ? (session.user.identities as Identity[]) : [];
  const providers = Array.isArray(session?.user?.app_metadata?.providers) ? (session.user.app_metadata.providers as string[]) : [];
  const isConnected = identities.some((id) => id?.provider === 'google') || providers.includes('google') || (!!session?.user?.app_metadata?.provider && session.user.app_metadata.provider === 'google');

  const connectGoogle = async () => {
    try {
      onStatus("");
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const redirectTo = origin ? `${origin}/login` : undefined;
      if (isConnected) {
        onStatus(t('settings.connected.google.already', 'Google already connected.'));
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
      onStatus(t('settings.connected.google.redirecting', 'Redirecting to Google OAuth…'));
    } catch (err: unknown) {
      onStatus(err instanceof Error ? err.message : t('settings.connected.google.failedStart', 'Failed to start Google connect'));
    }
  };

  const disconnectGoogle = async () => {
    try {
      onStatus("");
      const identitiesForDisconnect: Identity[] = (session?.user?.identities as Identity[]) || [];
      const googleIdentity = identitiesForDisconnect.find((i) => i?.provider === 'google');
      if (!googleIdentity) {
        onStatus(t('settings.connected.google.notConnected', 'Google is not connected.'));
        return;
      }
      const identityId = googleIdentity.identity_id;
      if (!identityId) {
        onStatus(t('settings.connected.google.identityMissing', 'Google identity missing.'));
        return;
      }
      const unlinkPayload = { identity_id: identityId } as Parameters<typeof supabase.auth.unlinkIdentity>[0];
      const { error } = await supabase.auth.unlinkIdentity(unlinkPayload);
      if (error) throw error;
      onStatus(t('settings.connected.google.disconnected', 'Google disconnected.'));
      // Attempt to refresh the session so UI updates immediately
      try {
        await supabase.auth.refreshSession();
      } catch {}
    } catch (err: unknown) {
      onStatus(err instanceof Error ? err.message : t('settings.connected.google.failedDisconnect', 'Failed to disconnect Google'));
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
        <label className={styles.label}>{t('settings.connected.google.label', 'Google')}</label>
      </div>
      <div className={styles.actions}>
        <button className={styles.button} type="button" onClick={connectGoogle} disabled={isConnected}>
          {isConnected ? t('settings.connected.connected', 'Connected') : t('settings.connected.connect', 'Connect')}
        </button>
        {isConnected && (
          <button className={styles.button} type="button" onClick={disconnectGoogle}>
            {t('settings.connected.disconnect', 'Disconnect')}
          </button>
        )}
      </div>
    </div>
  );
}