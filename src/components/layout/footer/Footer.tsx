"use client";

import type { LucideIcon } from "lucide-react";
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";

import { useAuthContext } from "@/hooks/useAuth";
import { useDomainContext } from "@/hooks/useDomainContext";
import { formatDisplayAddress } from "@/lib/address-display";
import { useHome } from "@/hooks/useHome";
import { normalizeBranch } from "@/lib/branch-selector";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";

type SocialLink = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const SOCIAL_LINKS: Record<string, { label: string; icon: LucideIcon }> = {
  website: { label: "Website", icon: Globe },
  facebook: { label: "Facebook", icon: Facebook },
  instagram: { label: "Instagram", icon: Instagram },
  tiktok: { label: "TikTok", icon: Music2 },
  x: { label: "X", icon: Twitter },
  twitter: { label: "X", icon: Twitter },
  linkedin: { label: "LinkedIn", icon: Linkedin },
};

const normalizeExternalHref = (value?: string | null) => {
  const href = value?.trim();

  if (!href) return null;

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  return href.includes(".") ? `https://${href}` : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getTextField = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
};

const getNestedTextField = (record: unknown, keys: string[]) => {
  const directValue = getTextField(record, keys);

  if (directValue) return directValue;
  if (!isRecord(record)) return null;

  return (
    getTextField(record.contactInfo, keys) ||
    getTextField(record.contacts, keys)
  );
};

const getRecordField = (record: unknown, key: string) =>
  isRecord(record) && isRecord(record[key]) ? record[key] : null;

const getFooterContactInfo = (homeData: unknown) => {
  if (!isRecord(homeData)) return null;
  const footer = getRecordField(homeData, "footer");

  return {
    phone:
      getNestedTextField(footer, [
        "phone",
        "phoneNumber",
        "contactPhone",
        "contactNumber",
        "mobile",
      ]) ||
      getNestedTextField(homeData.contactInfo, [
        "phone",
        "phoneNumber",
        "contactPhone",
        "contactNumber",
        "mobile",
      ]) ||
      getNestedTextField(homeData.contacts, [
        "phone",
        "phoneNumber",
        "contactPhone",
        "contactNumber",
        "mobile",
      ]),
    whatsapp:
      getNestedTextField(footer, [
        "whatsapp",
        "whatsApp",
        "whatsappNumber",
        "whatsAppNumber",
      ]) ||
      getNestedTextField(homeData.contactInfo, [
        "whatsapp",
        "whatsApp",
        "whatsappNumber",
        "whatsAppNumber",
      ]) ||
      getNestedTextField(homeData.contacts, [
        "whatsapp",
        "whatsApp",
        "whatsappNumber",
        "whatsAppNumber",
      ]),
    email:
      getNestedTextField(footer, ["email", "contactEmail", "supportEmail"]) ||
      getNestedTextField(homeData.contactInfo, [
        "email",
        "contactEmail",
        "supportEmail",
      ]) ||
      getNestedTextField(homeData.contacts, [
        "email",
        "contactEmail",
        "supportEmail",
      ]),
    address:
      getRecordField(footer, "address") ||
      getRecordField(homeData, "address") ||
      getRecordField(homeData.branch, "address"),
    socialMediaLinks:
      getRecordField(footer, "socialMediaLinks") ||
      getRecordField(homeData, "socialMediaLinks"),
    logoUrl: getTextField(footer, [
      "logoUrl",
      "storefrontLogoUrl",
      "branchLogoUrl",
      "restaurantLogoUrl",
    ]),
  };
};

const buildSocialLinks = (links?: unknown): SocialLink[] => {
  if (!isRecord(links)) return [];

  return Object.entries(links).reduce<SocialLink[]>((items, [key, value]) => {
    const normalizedKey = key.trim().toLowerCase();
    const meta = SOCIAL_LINKS[normalizedKey];
    const href = normalizeExternalHref(
      typeof value === "string" ? value : null,
    );

    if (!meta || !href) return items;

    items.push({
      key: normalizedKey,
      label: meta.label,
      href,
      icon: meta.icon,
    });

    return items;
  }, []);
};

export const Footer = () => {
  const pathname = usePathname();
  const t = useTranslations("footer");
  const { user, loading } = useAuthContext();
  const { context: domainContext, loading: domainLoading } = useDomainContext();
  const restaurantId = resolveHomeRestaurantId(user, null, domainContext);
  const branchId = resolveHomeBranchId(user, domainContext);
  const homeQuery = useHome(
    restaurantId,
    branchId || null,
    Boolean(!loading && !domainLoading && restaurantId),
  );
  const homeData = homeQuery.data?.data;
  const restaurant = homeData?.restaurant;
  const branch = useMemo(
    () => normalizeBranch(homeData?.branch),
    [homeData?.branch],
  );
  const restaurantName =
    restaurant?.name?.trim() ||
    homeData?.branding.restaurantName ||
    "DeliveryWay";
  const description =
    restaurant?.tagline?.trim() ||
    restaurant?.bio?.trim() ||
    restaurant?.description?.trim() ||
    homeData?.branding.tagline ||
    t("brandDescription");
  const footerContactInfo = getFooterContactInfo(homeData);
  const logoUrl =
    footerContactInfo?.logoUrl ||
    restaurant?.logoUrl?.trim() ||
    homeData?.branding.logo.light ||
    homeData?.branding.logo.default ||
    null;
  const branchAddress =
    formatDisplayAddress(footerContactInfo?.address) ||
    formatDisplayAddress(homeData?.branch) ||
    (branch?.address ? formatDisplayAddress(branch.address) : "");
  const branchPhone =
    footerContactInfo?.phone ||
    getNestedTextField(homeData?.branch, [
      "phone",
      "phoneNumber",
      "contactPhone",
      "contactNumber",
      "mobile",
    ]) ||
    getNestedTextField(restaurant, [
      "phone",
      "phoneNumber",
      "contactPhone",
      "contactNumber",
      "mobile",
    ]);
  const branchWhatsapp = footerContactInfo?.whatsapp;
  const branchEmail =
    footerContactInfo?.email ||
    getNestedTextField(homeData?.branch, [
      "email",
      "contactEmail",
      "supportEmail",
    ]) ||
    getNestedTextField(restaurant, ["email", "contactEmail", "supportEmail"]);
  const socialLinks = buildSocialLinks(
    footerContactInfo?.socialMediaLinks ?? restaurant?.socialMediaLinks,
  );
  const privacyHref = restaurantId
    ? `/privacy?restaurantId=${encodeURIComponent(restaurantId)}`
    : "/privacy";
  const impressumParams = new URLSearchParams();

  if (restaurantId) {
    impressumParams.set("restaurantId", restaurantId);
  }

  if (branchId) {
    impressumParams.set("branchId", branchId);
  }

  const impressumQuery = impressumParams.toString();
  const impressumHref = impressumQuery
    ? `/impressum?${impressumQuery}`
    : "/impressum";

  const quickLinks = [
    // { label: "Menu", href: "/menu" },
    { label: t("categories"), href: "/#categories" },
    { label: t("contact"), href: "/contact" },
    { label: t("orderNow"), href: "/items" },
  ];

  const companyLinks = [
    { label: t("about"), href: "/about" },
    { label: t("terms"), href: "/terms" },
    { label: t("privacyPolicy"), href: privacyHref },
    { label: t("impressum"), href: impressumHref },
    { label: t("refundPolicy"), href: "/refund" },
  ];

  const hideOnMobileHome = pathname === "/";

  return (
    <footer
      className={`border-t border-white/5 bg-[#111318] px-5 pb-4 pt-10 text-white transition-colors duration-300 md:pt-12 ${
        hideOnMobileHome ? "hidden md:block" : ""
      }`}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-7 lg:grid-cols-[1.2fr_0.65fr_0.75fr_1fr] lg:gap-x-10 lg:gap-y-7">
          {/* BRAND */}
          <div className="col-span-2 flex flex-col md:col-span-1">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : null}
              <div>
                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-white">
                  {restaurantName}
                </h2>
                {branch?.name ? (
                  <p className="mt-0.5 text-xs font-medium text-[#969BA4]">
                    {branch.name}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="mb-3 mt-2.5 max-w-[340px] text-sm leading-6 text-[#AEB1B8]">
              {description}
            </p>

            {/* SOCIAL */}
            {socialLinks.length > 0 ? (
              <div className="flex gap-2.5">
                {socialLinks.map(({ icon: Icon, href, key, label }) => (
                  <Link
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[#D8DADE] ring-1 ring-white/[0.06] transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-white"
                  >
                    <Icon size={16} />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="mb-3 text-[15px] font-semibold text-white">
              {t("quickLinks")}
            </h3>

            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#AEB1B8] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="mb-3 text-[15px] font-semibold text-white">
              {t("company")}
            </h3>

            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#AEB1B8] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-3 text-[15px] font-semibold text-white">
              {t("contact")}
            </h3>

            <div className="flex flex-col gap-2.5 text-sm leading-6">
              {branch?.name ? (
                <p className="text-white font-medium">
                  {t("branch")} :{" "}
                  <span className="font-normal text-[#AEB1B8]">
                    {branch.name}
                  </span>
                </p>
              ) : null}

              {branchAddress ? (
                <p className="text-white font-medium leading-relaxed">
                  {t("address")} :{" "}
                  <span className="font-normal text-[#AEB1B8]">
                    {branchAddress}
                  </span>
                </p>
              ) : null}

              {branchPhone ? (
                <p className="text-white font-medium">
                  {t("phone")} :{" "}
                  <a
                    href={`tel:${branchPhone.replace(/[^\d+]/g, "")}`}
                    className="font-normal text-[#AEB1B8] transition-colors hover:text-white"
                  >
                    {branchPhone}
                  </a>
                </p>
              ) : null}

              {branchWhatsapp ? (
                <p className="text-white font-medium">
                  WhatsApp :{" "}
                  <a
                    href={`https://wa.me/${branchWhatsapp.replace(/[^\d]/g, "")}`}
                    className="font-normal text-[#AEB1B8] transition-colors hover:text-white"
                  >
                    {branchWhatsapp}
                  </a>
                </p>
              ) : null}

              {branchEmail ? (
                <p className="text-white font-medium">
                  Email :{" "}
                  <a
                    href={`mailto:${branchEmail}`}
                    className="font-normal text-[#AEB1B8] transition-colors hover:text-white"
                  >
                    {branchEmail}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-white/[0.08] pt-4">
          <p className="text-center text-xs text-[#8E939C] sm:text-sm">
            {t("copyright", {
              year: new Date().getFullYear(),
              name: restaurantName,
            })}
          </p>
        </div>
      </div>
    </footer>
  );
};
