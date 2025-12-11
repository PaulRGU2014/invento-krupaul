// Connected account row for Google
"use client";

import React from "react";
import styles from "./account-settings.module.scss";

export function ConnectedGoogleRow({ session, supabase, onStatus }: { session: any; supabase: any; onStatus: (msg: string) => void }) {
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
      </div>
    </div>
  );
}