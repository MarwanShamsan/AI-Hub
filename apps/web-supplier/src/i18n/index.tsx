import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import en from "./messages/en";
import ar from "./messages/ar";

export type Locale = "en" | "ar";

const STORAGE_KEY = "ai-hub.web-supplier.locale";

const dictionaries = {
  en,
  ar
} as const;

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: any, part) => acc?.[part], obj as any);
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "ar" || stored === "en") {
    return stored;
  }

  const browserLanguage = navigator.language.toLowerCase();
  return browserLanguage.startsWith("ar") ? "ar" : "en";
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.body.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale];
    const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

    return {
      locale,
      dir,
      setLocale: (nextLocale: Locale) => setLocaleState(nextLocale),
      t: (key: string, params?: Record<string, string | number>) => {
        const raw =
          (getByPath(dict, key) as string | undefined) ??
          (getByPath(dictionaries.en, key) as string | undefined) ??
          key;

        return interpolate(raw, params);
      }
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return value;
}