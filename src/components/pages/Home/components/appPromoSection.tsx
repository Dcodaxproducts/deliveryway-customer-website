// @refresh reset
import { Bell, Navigation, RotateCcw, Search, ShoppingBag, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const promoFeatures = [
  { key: "offers", icon: Sparkles },
  { key: "faster", icon: Zap },
  { key: "tracking", icon: Navigation },
  { key: "reorder", icon: RotateCcw },
] as const;

const categoryItems = [
  { label: "Burger", image: "/burger.png" },
  { label: "Pizza", image: "/pizza.png" },
  { label: "Pasta", image: "/chowmein.png" },
] as const;

function StoreBadge({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={255}
      height={75}
      className="h-11 w-auto sm:h-12"
    />
  );
}

function AppPhone({ variant = "front" }: { variant?: "front" | "back" }) {
  const isBack = variant === "back";

  return (
    <div
      className={[
        "relative w-[188px] rounded-[34px] border-[8px] border-[#151515] bg-white shadow-[0_28px_55px_rgba(88,17,12,0.28)]",
        isBack ? "h-[360px] rotate-[7deg] opacity-95" : "h-[392px] -rotate-[4deg]",
      ].join(" ")}
    >
      <div className="absolute left-1/2 top-0 z-20 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-[#151515]" />
      <div className="h-full overflow-hidden rounded-[25px] bg-white">
        <div className="relative h-[154px] overflow-hidden rounded-b-[26px] bg-[#dc1219] px-3 pt-6 text-white">
          <div className="flex items-center justify-between text-[8px] font-semibold">
            <span>9:41</span>
            <span className="tracking-[0.08em]">LTE</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="min-w-0 rounded-full bg-white px-3 py-1.5 text-[8px] font-bold text-[#151515] shadow-md">
              <span className="block max-w-[104px] truncate">JL. Kampung Melon No. 32</span>
            </div>
            <div className="flex gap-1.5">
              <span className="grid size-7 place-items-center rounded-full bg-white text-[#dc1219] shadow-md">
                <Bell className="size-3.5" />
              </span>
              <span className="grid size-7 place-items-center rounded-full bg-white text-[#dc1219] shadow-md">
                <ShoppingBag className="size-3.5" />
              </span>
            </div>
          </div>

          <p className="mt-7 max-w-[108px] text-[18px] font-extrabold leading-[1.08]">
            Hungry? We&apos;ve got you covered!
          </p>

          <Image
            src="/burger.png"
            alt=""
            width={218}
            height={218}
            className="absolute -bottom-8 right-0 h-32 w-32 object-contain"
          />
        </div>

        <div className="relative z-10 -mt-5 mx-3 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[8px] text-[#929292] shadow-[0_8px_24px_rgba(26,26,26,0.16)]">
          <Search className="size-3.5 text-[#9aa0ad]" />
          What Do You Want To Eat?
        </div>

        <div className="px-3 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold text-[#151515]">Categories</h3>
            <span className="text-[7px] font-medium text-[#dc1219]">View all</span>
          </div>

          <div className="mt-3 flex justify-between">
            {categoryItems.map((item, index) => (
              <div key={item.label} className="flex flex-col items-center gap-1 text-[7px] font-medium text-[#202020]">
                <span
                  className={[
                    "grid size-9 place-items-center rounded-full bg-[#fff7f1] shadow-[0_5px_14px_rgba(60,31,21,0.12)]",
                    index === 1 ? "ring-4 ring-[#dc1219]" : "",
                  ].join(" ")}
                >
                  <Image src={item.image} alt="" width={44} height={44} className="h-8 w-8 object-contain" />
                </span>
                {item.label}
              </div>
            ))}
          </div>

          <div className="relative mt-4 h-[104px] overflow-hidden rounded-xl bg-[#08ad47] p-3 text-white">
            <p className="max-w-[94px] text-[18px] font-extrabold leading-tight">Veggie Cheese Burger</p>
            <div className="mt-3 space-y-1 text-[7px] font-medium">
              <p>Free delivery</p>
              <p>45 minutes</p>
            </div>
            <Image
              src="/burger.png"
              alt=""
              width={218}
              height={218}
              className="absolute -bottom-8 -right-4 h-32 w-32 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppPromo() {
  const t = useTranslations("home.appPromo");

  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-[#df171d] px-5 py-10 text-white shadow-[0_28px_80px_rgba(184,21,26,0.25)] sm:px-9 lg:min-h-[520px] lg:px-14 lg:py-14">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_22%,rgba(255,213,111,0.34),transparent_24%),linear-gradient(135deg,#ef2027_0%,#d51018_58%,#b90812_100%)]" />
          <div className="absolute -left-20 -top-24 -z-10 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 right-8 -z-10 size-80 rounded-full bg-[#ffb33e]/25 blur-3xl" />

          <Image
            src="/pizza.png"
            alt=""
            width={218}
            height={218}
            className="absolute left-[48%] top-8 hidden h-20 w-20 rotate-[-18deg] object-contain drop-shadow-xl lg:block"
          />
          <Image
            src="/steak.png"
            alt=""
            width={219}
            height={218}
            className="absolute right-8 top-9 hidden h-24 w-24 rotate-[18deg] object-contain drop-shadow-xl lg:block"
          />
          <Image
            src="/chowmein.png"
            alt=""
            width={512}
            height={512}
            className="absolute bottom-8 left-[43%] hidden h-24 w-24 rotate-[10deg] object-contain drop-shadow-xl lg:block"
          />

          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-[590px] text-center lg:text-left">
              <p className="mx-auto mb-4 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur lg:mx-0">
                {t("eyebrow")}
              </p>
              <h2 className="text-[34px] font-black leading-[1.04] tracking-normal sm:text-[48px] lg:text-[64px]">
                {t("headline")}
              </h2>
              <p className="mx-auto mt-5 max-w-[520px] text-base font-medium leading-7 text-white/86 lg:mx-0 lg:text-lg">
                {t("description")}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {promoFeatures.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.key}
                      className="flex items-center gap-3 rounded-2xl bg-white/13 px-4 py-3 text-left ring-1 ring-white/16 backdrop-blur"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#df171d]">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-sm font-bold leading-snug">{t(`features.${feature.key}`)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <StoreBadge src="/app-store.png" alt={t("appStoreAlt")} />
                <StoreBadge src="/google-play.png" alt={t("googlePlayAlt")} />
              </div>
            </div>

            <div className="relative mx-auto h-[420px] w-full max-w-[570px] sm:h-[500px] lg:h-[480px]">
              <div className="absolute inset-x-4 bottom-5 h-24 rounded-[999px] bg-black/18 blur-2xl" />
              <div className="absolute left-2 top-16 hidden sm:block lg:left-7">
                <AppPhone variant="back" />
              </div>
              <div className="absolute left-1/2 top-3 -translate-x-1/2 sm:left-[54%] sm:translate-x-0 lg:left-[48%]">
                <AppPhone />
              </div>
              <div className="absolute bottom-14 right-1 rounded-[28px] bg-white px-4 py-3 text-[#171717] shadow-[0_18px_45px_rgba(68,20,16,0.24)] sm:right-7">
                <p className="text-xs font-bold text-[#df171d]">{t("dealCardEyebrow")}</p>
                <p className="mt-1 text-lg font-black">{t("dealCardTitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
