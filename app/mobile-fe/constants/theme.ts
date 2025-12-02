/**
 * Centralized theme tokens used across the mobile app.
 * These values are chosen to match the desktop app's visual language.
 */

import { Platform } from 'react-native';

/* Core brand tokens (match desktop) */
const PRIMARY = '#007bff';
const PRIMARY_LIGHT = '#eff6ff';
const DANGER = '#dc2626';
const LOW_STOCK_BG = '#fef2f2';
const LOW_STOCK_BORDER = '#fecaca';
const CARD_BG = '#ffffff';
const BORDER = '#e5e7eb';
const APP_BG = '#f8f9fb';

export const Colors = {
  light: {
    text: '#111827',
    background: APP_BG,
    tint: PRIMARY,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: PRIMARY,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#ffffff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#ffffff',
  },
};

export const Theme = {
  primary: PRIMARY,
  primaryLight: PRIMARY_LIGHT,
  danger: DANGER,
  lowStockBg: LOW_STOCK_BG,
  lowStockBorder: LOW_STOCK_BORDER,
  cardBg: CARD_BG,
  border: BORDER,
  background: APP_BG,
  borderRadius: 12,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
