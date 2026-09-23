"use client";

import { useTranslations } from "next-intl";

import {
  LANGUAGE_LABELS,
  SUPPORTED_LOCALES,
  type AppLocale,
  isSupportedLocale,
} from "@/config/i18n";
import { useAppLocale } from "@/hooks/useAppLocale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select
      value={isLocaleReady ? locale : undefined}
      onValueChange={handleValueChange}
    >
      <SelectTrigger
        aria-label={t("changeLanguage")}
        className={cn(
          "h-10 w-auto min-w-[76px] rounded-full border border-[#E8ECF0] bg-white px-3 text-xs font-semibold text-[#20242A] shadow-sm hover:border-primary/30 focus-visible:ring-primary/25",
          className,
        )}
      >
        <SelectValue>
          {isLocaleReady ? getShortLocaleLabel(locale) : "EN"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="rounded-xl border-gray-100 shadow-xl">
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <SelectItem
            key={supportedLocale}
            value={supportedLocale}
            className="rounded-lg"
          >
            {LANGUAGE_LABELS[supportedLocale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
