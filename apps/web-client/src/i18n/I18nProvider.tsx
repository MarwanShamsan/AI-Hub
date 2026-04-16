import { createContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Locale } from "./types";
import { ar } from "./messages/ar";
import { en } from "./messages/en";

type I18nContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
};

const STORAGE_KEY = "app.locale";

export const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;

  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith("ar") ? "ar" : "en";
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  const messages = locale === "ar" ? ar : en;
  const dir = locale === "ar" ? "rtl" : "ltr";

  function setLocale(next: Locale) {
    setLocaleState(next);
  }

  function toggleLocale() {
    setLocaleState((prev) => (prev === "ar" ? "en" : "ar"));
  }

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      toggleLocale,
      t: (key: string) => messages[key] ?? key
    }),
    [locale, dir, messages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}