// Preferences tab for account settings
import React from "react";
import styles from "./account-settings.module.scss";
import { Preferences } from "./SettingsForm.types";

interface PreferencesTabProps {
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  saving: boolean;
  onSavePreferences: (e: React.FormEvent) => Promise<void> | void;
}

export function PreferencesTab(props: PreferencesTabProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Preferences</h2>
      <form onSubmit={props.onSavePreferences} className={styles.gridGap}>
        <div>
          <label className={styles.label}>Theme</label>
          <select
            className={styles.select}
            value={props.preferences.theme}
            onChange={(e) =>
              props.setPreferences({ ...props.preferences, theme: e.target.value as Preferences["theme"] })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={props.saving}>
            {props.saving ? "Saving…" : "Save Preferences"}
          </button>
        </div>
      </form>
    </section>
  );
}