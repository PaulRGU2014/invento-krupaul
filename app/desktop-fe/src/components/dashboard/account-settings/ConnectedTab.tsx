// Connected accounts tab for account settings
"use client";

import React from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import styles from "./account-settings.module.scss";
import { ConnectedGoogleRow } from "./ConnectedGoogleRow";

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
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Connected Accounts</h2>
      <div className={styles.gridGap}>
        <p>Manage external login providers linked to your account.</p>
        <div className={styles.gridGap}>
          <ConnectedGoogleRow session={props.session} supabase={props.supabase} onStatus={props.onStatus} />
          <div className={styles.gridGap}>
            <label className={styles.label}>Email & Password</label>
            <p>Set up or update a password login for this account.</p>
            <p style={{ margin: 0, color: '#374151' }}>
              Status: {props.isEmailConnected ? 'Connected' : 'Not connected'}
            </p>
            <form onSubmit={props.handleLinkEmailLogin} className={styles.gridGap}>
              <div>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={props.emailLogin.email}
                  onChange={(e) => props.setEmailLogin({ ...props.emailLogin, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={props.emailLogin.password}
                  onChange={(e) => props.setEmailLogin({ ...props.emailLogin, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Confirm Password</label>
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
                  {props.linkingEmail ? "Saving…" : props.isEmailConnected ? "Update login" : "Add email login"}
                </button>
              </div>
            </form>
          </div>
          <div>
            <label className={styles.label}>Facebook</label>
            <div className={styles.actions}>
              <button className={styles.button} type="button" disabled>Connect</button>
              {props.isFacebookConnected && (
                <button className={styles.button} type="button" disabled>Disconnect</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}