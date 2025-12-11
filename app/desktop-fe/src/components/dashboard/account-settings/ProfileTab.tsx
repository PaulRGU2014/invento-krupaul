// Profile tab for account settings
import React from "react";
import styles from "./account-settings.module.scss";
import { Profile } from "./SettingsForm.types";

interface ProfileTabProps {
  profile: Profile;
  setProfile: (p: Profile) => void;
  saving: boolean;
  onSaveProfile: (e: React.FormEvent) => Promise<void> | void;
}

export function ProfileTab(props: ProfileTabProps) {
  return (
    <div className={styles.sectionGridTwo}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Profile</h2>
        <form onSubmit={props.onSaveProfile} className={styles.gridGap}>
          <div>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              type="text"
              value={props.profile.name}
              onChange={(e) => props.setProfile({ ...props.profile, name: e.target.value })}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={props.profile.email}
              onChange={(e) => props.setProfile({ ...props.profile, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={props.saving}>
              {props.saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

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
  );
}