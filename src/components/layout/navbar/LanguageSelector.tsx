"use client";

import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LOCALES,
  type AppLocale,
  isSupportedLocale,
} from "@/config/i18n";
import { useAppLocale } from "@/hooks/useAppLocale";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
};

const getShortLocaleLabel = (locale: AppLocale) => locale.toUpperCase();

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale, isLocaleReady } = useAppLocale();
  const t = useTranslations("navigation");

  const handleValueChange = (value: string) => {
    if (isSupportedLocale(value)) {
      setLocale(value);
    }
  };

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t("changeLanguage")}
        className={cn(
          "h-10 rounded-2xl border-[#E8ECF0] bg-white px-3 text-xs font-semibold text-primary shadow-sm hover:border-[var(--primary)]/35",
          className
        )}
      >
        <span>{isLocaleReady ? getShortLocaleLabel(locale) : "EN"}</span>
      </SelectTrigger>
      <SelectContent align="end" className="z-[99999] bg-white">
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <SelectItem key={supportedLocale} value={supportedLocale}>
            {LANGUAGE_LABELS[supportedLocale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
