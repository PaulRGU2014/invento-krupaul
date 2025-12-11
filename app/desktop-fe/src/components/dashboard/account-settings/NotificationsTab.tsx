// Notifications tab for account settings
import React from "react";
import styles from "./account-settings.module.scss";
import { NotificationToggleRow } from "./NotificationToggleRow";
import {
  NotificationPreferences,
  NotificationFrequency,
  frequencyOptions,
} from "./SettingsForm.types";

interface NotificationsTabProps {
  notificationPrefs: NotificationPreferences;
  updateNotificationPref: <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => void;
  frequencyOptions: typeof import("./SettingsForm.types").frequencyOptions;
  requestWebPermission: () => Promise<void> | void;
  // Optional flags (not required but acceptable):
  notificationSaving?: boolean;
  notificationDirty?: boolean;
}

export function NotificationsTab(props: NotificationsTabProps) {
  const { notificationPrefs, updateNotificationPref, requestWebPermission } = props;
  const options = props.frequencyOptions || frequencyOptions;
  const webPermission = notificationPrefs.webPermission;

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Notifications</h2>
      <div className={styles.gridGap} role="form" aria-label="Notification preferences">
        <p style={{ margin: 0, color: "#4b5563" }}>
          Choose how you want to be notified. We recommend keeping at least one channel on.
        </p>
        <div className={styles.gridGap}>
          <NotificationToggleRow
            label="Enable notifications"
            description="Master switch for all notifications."
            value={notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("enabled", next)}
          />
          <NotificationToggleRow
            label="Web notifications"
            description="Show alerts in your browser."
            value={notificationPrefs.browserPush}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("browserPush", next)}
            actionLabel={
              !notificationPrefs.enabled
                ? undefined
                : webPermission === "granted"
                ? "Granted"
                : "Enable"
            }
            onAction={!notificationPrefs.enabled ? undefined : requestWebPermission}
          />
          <NotificationToggleRow
            label="Email notifications"
            description="Receive updates in your inbox."
            value={notificationPrefs.email}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("email", next)}
          />
          <NotificationToggleRow
            label="SMS alerts"
            description="Send important alerts via text."
            value={notificationPrefs.sms}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("sms", next)}
          />
          <NotificationToggleRow
            label="Product updates"
            description="Get tips, announcements, and new feature highlights."
            value={notificationPrefs.productUpdates}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("productUpdates", next)}
          />
          <NotificationToggleRow
            label="Low stock alerts"
            description="Notify when items fall below threshold."
            value={notificationPrefs.lowStock}
            disabled={!notificationPrefs.enabled}
            onToggle={(next) => updateNotificationPref("lowStock", next)}
          />
          <div>
            <label className={styles.label}>Notification cadence</label>
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
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}