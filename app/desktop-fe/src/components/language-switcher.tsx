"use client";

import React from "react";
import { useI18n } from "../lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label style={{ display: "inline-flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
      <span>{t("app.language", "Language")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t("app.language", "Language")}
      >
        <option value="en">English</option>
        <option value="th">{t("app.thai", "Thai")}</option>
      </select>
    </label>
  );
}
