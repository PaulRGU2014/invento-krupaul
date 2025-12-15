"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from "react";

type Messages = Record<string, any>;

type I18nContextValue = {
  locale: string;
  t: (key: string, fallback?: string) => string;
  setLocale: (loc: string) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}

async function loadMessages(locale: string): Promise<Messages> {
  const base = await import("../i18n/en.json");
  let merged: Messages = base.default || base;

  if (locale === "th") {
    const gen = await import("../i18n/generated/th.json");
    const overrides = await import("../i18n/overrides/th.json");
    merged = deepMerge(merged, gen.default || gen);
    merged = deepMerge(merged, overrides.default || overrides);
  }
  return merged;
}

function deepMerge(target: Messages, source: Messages): Messages {
  const out: Messages = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const s = source[key];
    const t = (out as any)[key];
    if (s && typeof s === "object" && !Array.isArray(s)) {
      (out as any)[key] = deepMerge(t && typeof t === "object" ? t : {}, s);
    } else {
      (out as any)[key] = s;
    }
  }
  return out;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>("en");
  const [messages, setMessages] = useState<Messages>({});

  // Initialize from cookie or browser settings
  useEffect(() => {
    const cookieLocale = getCookie("locale");
    let initial = cookieLocale || (typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en");
    if (initial !== "th" && initial !== "en") initial = "en";
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    loadMessages(locale).then(setMessages).catch(() => setMessages({}));
    setCookie("locale", locale);
    if (typeof localStorage !== "undefined") {
      try { localStorage.setItem("locale", locale); } catch {}
    }
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      const parts = key.split(".");
      let cur: any = messages;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) {
          cur = cur[p];
        } else {
          cur = undefined;
          break;
        }
      }
      return typeof cur === "string" ? cur : fallback || key;
    };
  }, [messages]);

  const setLocale = (loc: string) => {
    setLocaleState(loc);
  };

  const value: I18nContextValue = { locale, t, setLocale };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
