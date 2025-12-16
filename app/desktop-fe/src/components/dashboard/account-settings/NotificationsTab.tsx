"use client";
// Notifications tab for account settings
import React from "react";
import styles from "./account-settings.module.scss";
import { NotificationToggleRow } from "./NotificationToggleRow";
import { useI18n } from "@/lib/i18n";
import {
  NotificationPreferences,
  NotificationFrequency,
  frequencyOptions,
} from "./SettingsForm.types";

interface NotificationsTabProps {
  notificationPrefs: NotificationPreferences;
  updateNotificationPref: <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => void;
  frequencyOptions?: ReadonlyArray<{ value: NotificationFrequency; label: string }>;
  requestWebPermission: () => Promise<void> | void;
  // Optional flags (not required but acceptable):
  notificationSaving?: boolean;
  notificationDirty?: boolean;
}

export function NotificationsTab(props: NotificationsTabProps) {
  const { t } = useI18n();
  const { notificationPrefs, updateNotificationPref, requestWebPermission } = props;
  const options = props.frequencyOptions || frequencyOptions;
  const webPermission = notificationPrefs.webPermission;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('settings.tabs.notifications', 'Notifications')}</h2>
      <div className={styles.gridGap} role="form" aria-label={t('settings.notifications.aria', 'Notification preferences')}>
        <p style={{ margin: 0, color: "#4b5563" }}>
          {t('settings.notifications.intro', 'Choose how you want to be notified. We recommend keeping at least one channel on.')}
        </p>
        <div className={styles.gridGap}>
          <NotificationToggleRow
            label={t('settings.notifications.enable', 'Enable notifications')}
            description={t('settings.notifications.enableDesc', 'Master switch for all notifications.')}
            value={notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("enabled", next)}
          />
          <NotificationToggleRow
            label={t('settings.notifications.web', 'Web notifications')}
            description={t('settings.notifications.webDesc', 'Show alerts in your browser.')}
            value={notificationPrefs.browserPush}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("browserPush", next)}
            actionLabel={
              !notificationPrefs.enabled
                ? undefined
                : webPermission === "granted"
                ? t('settings.notifications.granted', 'Granted')
                : t('settings.notifications.enableAction', 'Enable')
            }
            onAction={!notificationPrefs.enabled ? undefined : requestWebPermission}
          />
          <NotificationToggleRow
            label={t('settings.notifications.email', 'Email notifications')}
            description={t('settings.notifications.emailDesc', 'Receive updates in your inbox.')}
            value={notificationPrefs.email}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("email", next)}
          />
          <NotificationToggleRow
            label={t('settings.notifications.sms', 'SMS alerts')}
            description={t('settings.notifications.smsDesc', 'Send important alerts via text.')}
            value={notificationPrefs.sms}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("sms", next)}
          />
          <NotificationToggleRow
            label={t('settings.notifications.product', 'Product updates')}
            description={t('settings.notifications.productDesc', 'Get tips, announcements, and new feature highlights.')}
            value={notificationPrefs.productUpdates}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("productUpdates", next)}
          />
          <NotificationToggleRow
            label={t('settings.notifications.lowStock', 'Low stock alerts')}
            description={t('settings.notifications.lowStockDesc', 'Notify when items fall below threshold.')}
            value={notificationPrefs.lowStock}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("lowStock", next)}
          />
          <div>
            <label className={styles.label}>{t('settings.notifications.cadence', 'Notification cadence')}</label>
            <select
              className={styles.select}
              value={notificationPrefs.frequency}
              onChange={(e) =>
                updateNotificationPref("frequency", e.target.value as NotificationFrequency)
              }
              disabled={!notificationPrefs.enabled}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`settings.notifications.frequency.${opt.value}`, opt.label)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}