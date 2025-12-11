// Security tab for account settings
"use client";

import React from "react";
import styles from "./account-settings.module.scss";
import { Security } from "./SettingsForm.types";

interface SecurityTabProps {
  security: Security;
  setSecurity: (s: Security) => void;
  saving: boolean;
  onChangePassword: (e: React.FormEvent) => Promise<void> | void;
}

export function SecurityTab(props: SecurityTabProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Security</h2>
      <form onSubmit={props.onChangePassword} className={styles.gridGap}>
        <div>
          <label className={styles.label}>Current Password</label>
          <input
            className={styles.input}
            type="password"
            value={props.security.currentPassword}
            onChange={(e) => props.setSecurity({ ...props.security, currentPassword: (e.target as HTMLInputElement).value })}
            required
          />
        </div>
        <div>
          <label className={styles.label}>New Password</label>
          <input
            className={styles.input}
            type="password"
            value={props.security.newPassword}
            onChange={(e) => props.setSecurity({ ...props.security, newPassword: (e.target as HTMLInputElement).value })}
            required
          />
        </div>
        <div>
          <label className={styles.label}>Confirm New Password</label>
          <input
            className={styles.input}
            type="password"
            value={props.security.confirmPassword}
            onChange={(e) => props.setSecurity({ ...props.security, confirmPassword: (e.target as HTMLInputElement).value })}
            required
          />
        </div>
        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={props.saving}>
            {props.saving ? "Saving…" : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
}