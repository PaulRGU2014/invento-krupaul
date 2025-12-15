"use client";
// Profile tab for account settings
import React from "react";
import styles from "./account-settings.module.scss";
import { Profile } from "./SettingsForm.types";
import { useI18n } from "@/lib/i18n";

interface ProfileTabProps {
  profile: Profile;
  setProfile: (p: Profile) => void;
  saving: boolean;
  onSaveProfile: (e: React.FormEvent) => Promise<void> | void;
}

export function ProfileTab(props: ProfileTabProps) {
  const { t } = useI18n();
  return (
    <div className={styles.sectionGridTwo}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.tabs.profile', 'Profile')}</h2>
        <form onSubmit={props.onSaveProfile} className={styles.gridGap}>
          <div>
            <label className={styles.label}>{t('settings.profile.name', 'Name')}</label>
            <input
              className={styles.input}
              type="text"
              value={props.profile.name}
              onChange={(e) => props.setProfile({ ...props.profile, name: e.target.value })}
              placeholder={t('settings.profile.placeholderName', 'Your name')}
              required
            />
          </div>
          <div>
            <label className={styles.label}>{t('login.email', 'Email')}</label>
            <input
              className={styles.input}
              type="email"
              value={props.profile.email}
              onChange={(e) => props.setProfile({ ...props.profile, email: e.target.value })}
              placeholder={t('signup.placeholderEmail', 'you@example.com')}
              required
            />
          </div>
          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={props.saving}>
              {props.saving ? t('common.saving', 'Saving…') : t('settings.profile.save', 'Save Profile')}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.avatar.title', 'Avatar')}</h2>
        <div className={styles.gridGap}>
          <p>{t('settings.avatar.description', 'Upload or change your profile picture (placeholder).')}</p>
          <div className={styles.actions}>
            <button className={styles.button} type="button">{t('settings.avatar.upload', 'Upload')}</button>
          </div>
        </div>
      </section>
    </div>
  );
}