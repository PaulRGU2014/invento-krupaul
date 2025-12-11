// Shared types for SettingsForm and tabs
export type Profile = {
  name: string;
  email: string;
};

export type Security = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type Preferences = {
  theme: "system" | "light" | "dark";
};

export const frequencyOptions = [
  { value: "immediate", label: "Immediate" },
  { value: "hourly", label: "Hourly digest" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
] as const;

export type FrequencyOption = typeof frequencyOptions[number];
export type NotificationFrequency = FrequencyOption["value"];

export type NotificationPreferences = {
  enabled: boolean;
  browserPush: boolean;
  email: boolean;
  sms: boolean;
  productUpdates: boolean;
  lowStock: boolean;
  frequency: NotificationFrequency;
  webPermission?: NotificationPermission;
};

export type TabId = "profile" | "connected" | "security" | "preferences" | "notifications";
export type Tab = { id: TabId; label: string };