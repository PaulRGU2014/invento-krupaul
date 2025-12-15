// Connected accounts tab for account settings
"use client";

import React from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import styles from "./account-settings.module.scss";
import { ConnectedGoogleRow } from "./ConnectedGoogleRow";
import { useI18n } from "@/lib/i18n";

interface ConnectedTabProps {
  session: Session | null;
  supabase: SupabaseClient;
  isEmailConnected: boolean;
  isFacebookConnected: boolean;
  emailLogin: { email: string; password: string; confirmPassword: string };
  setEmailLogin: (p: { email: string; password: string; confirmPassword: string }) => void;
  handleLinkEmailLogin: (e: React.FormEvent) => Promise<void> | void;
  linkingEmail: boolean;
  onStatus: (msg: string) => void;
}

export function ConnectedTab(props: ConnectedTabProps) {
  const { t } = useI18n();
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('settings.connected.title', 'Connected Accounts')}</h2>
      <div className={styles.gridGap}>
        <p>{t('settings.connected.description', 'Manage external login providers linked to your account.')}</p>
        <div className={styles.gridGap}>
          <ConnectedGoogleRow session={props.session} supabase={props.supabase} onStatus={props.onStatus} />
          <div className={styles.gridGap}>
            <label className={styles.label}>{t('settings.connected.emailPass', 'Email & Password')}</label>
            <p>{t('settings.connected.emailPassDescription', 'Set up or update a password login for this account.')}</p>
            <p style={{ margin: 0, color: '#374151' }}>
              {t('settings.connected.statusLabel', 'Status:')} {props.isEmailConnected ? t('settings.connected.connected', 'Connected') : t('settings.connected.notConnected', 'Not connected')}
            </p>
            <form onSubmit={props.handleLinkEmailLogin} className={styles.gridGap}>
              <div>
                <label className={styles.label}>{t('login.email', 'Email')}</label>
                <input
                  className={styles.input}
                  type="email"
                  value={props.emailLogin.email}
                  onChange={(e) => props.setEmailLogin({ ...props.emailLogin, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>{t('login.password', 'Password')}</label>
                <input
                  className={styles.input}
                  type="password"
                  value={props.emailLogin.password}
                  onChange={(e) => props.setEmailLogin({ ...props.emailLogin, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>{t('signup.confirmPassword', 'Confirm Password')}</label>
                <input
                  className={styles.input}
                  type="password"
                  value={props.emailLogin.confirmPassword}
                  onChange={(e) => props.setEmailLogin({ ...props.emailLogin, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <div className={styles.actions}>
                <button className={styles.button} type="submit" disabled={props.linkingEmail}>
                  {props.linkingEmail
                    ? t('common.saving', 'Saving…')
                    : props.isEmailConnected
                      ? t('settings.connected.updateLogin', 'Update login')
                      : t('settings.connected.addEmailLogin', 'Add email login')}
                </button>
              </div>
            </form>
          </div>
          <div>
            <label className={styles.label}>{t('settings.connected.facebook', 'Facebook')}</label>
            <div className={styles.actions}>
              <button className={styles.button} type="button" disabled>{t('settings.connected.connect', 'Connect')}</button>
              {props.isFacebookConnected && (
                <button className={styles.button} type="button" disabled>{t('settings.connected.disconnect', 'Disconnect')}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}