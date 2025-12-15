"use client";
// Preferences tab for account settings
import React from "react";
import styles from "./account-settings.module.scss";
import { Preferences } from "./SettingsForm.types";
import { useI18n } from "@/lib/i18n";

interface PreferencesTabProps {
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  saving: boolean;
  onSavePreferences: (e: React.FormEvent) => Promise<void> | void;
}

export function PreferencesTab(props: PreferencesTabProps) {
  const { t } = useI18n();
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('settings.tabs.preferences', 'Preferences')}</h2>
      <form onSubmit={props.onSavePreferences} className={styles.gridGap}>
        <div>
          <label className={styles.label}>{t('settings.preferences.theme', 'Theme')}</label>
          <select
            className={styles.select}
            value={props.preferences.theme}
            onChange={(e) =>
              props.setPreferences({ ...props.preferences, theme: e.target.value as Preferences["theme"] })
            }
          >
            <option value="system">{t('settings.preferences.system', 'System')}</option>
            <option value="light">{t('settings.preferences.light', 'Light')}</option>
            <option value="dark">{t('settings.preferences.dark', 'Dark')}</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={props.saving}>
            {props.saving ? t('common.saving', 'Saving…') : t('settings.preferences.save', 'Save Preferences')}
          </button>
        </div>
      </form>
    </section>
  );
}