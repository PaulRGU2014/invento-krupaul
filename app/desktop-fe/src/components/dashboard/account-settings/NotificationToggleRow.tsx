// Notification toggle row (label, description, switch, optional action)
"use client";

import React from "react";
import styles from "./account-settings.module.scss";

export function NotificationToggleRow({
  label,
  description,
  value,
  disabled = false,
  onToggle,
  actionLabel,
  onAction,
}: {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return; // avoid double-trigger when clicking buttons
    onToggle(!value);
  };

  return (
    <div className={styles.toggleRow} onClick={handleRowClick} role="presentation">
      <div>
        <p className={styles.toggleLabel} style={{ margin: 0 }}>
          {label}
        </p>
        {description && (
          <p className={styles.toggleDescription}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-disabled={disabled}
        disabled={disabled}
        className={`${styles.toggle} ${value ? styles.toggleOn : ""} ${disabled ? styles.toggleDisabled : ""}`}
        onClick={() => onToggle(!value)}
      >
        <span className={styles.toggleKnob} />
      </button>
      {onAction && actionLabel && (
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}