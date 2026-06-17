// @refresh reset
import { Star } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from "next-intl";

export default function AppPromo() {
const t = useTranslations("home.appPromo");

return (
  <section className="px-4 pb-[80px] pt-5">
    <div className="max-w-[1400px] mx-auto">
      <div className="relative w-full overflow-hidden rounded-[36px] bg-[#241814] shadow-[0_26px_90px_rgba(36,24,20,0.16)]">

        <Image
          src="/banner-bg.png"
          alt={t("bannerAlt")}
          width={1920}
          height={1080}
          className="h-[560px] w-full object-cover opacity-65 md:h-[520px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.16),transparent_24%),linear-gradient(90deg,rgba(36,24,20,0.92),rgba(206,24,27,0.72),rgba(36,24,20,0.35))]" />

        <div className="
          absolute
          top-0 md:-top-3
          left-1/2 md:left-0
          -translate-x-1/2 md:translate-x-0
          z-20
        ">
          <div className="w-[180px] sm:w-[250px] md:w-[240px] lg:w-[430px]">
            <img
              src="/banner-mobile.png"
              alt={t("appPreviewAlt")}
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="
          absolute top-0 h-full flex items-center
          px-4 sm:px-6
          md:left-10 md:pr-12 md:pl-[260px]
          lg:pr-16 lg:pl-[320px]
          w-full md:w-auto
          pt-30 md:pt-0
        ">
          <div className="text-white max-w-xl md:max-w-2xl text-center md:text-left">

            <h2 className="mb-4 text-[22px] font-black leading-tight sm:text-[28px] md:mb-8 md:text-[44px]">
              {t("titleLineOne")}<br className="hidden sm:block" />
              {t("titleLineTwo")}
            </h2>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 justify-center md:justify-start">

              <div className="flex justify-center md:justify-start -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-[40px] h-[40px] md:w-[57px] md:h-[58px] rounded-full border-2 md:border-[3px] border-white overflow-hidden bg-gray-200"
                  >
                    <img
                      src={`https://i.pravatar.cc/150?img=${i}`}
                      alt={t("customerAlt")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center md:items-start">
                <span className="text-sm md:text-lg font-bold">
                  {t("happyCustomer")}
                </span>
                <div className="flex items-center gap-2">
                  <Star size={16} fill="#FFD700" stroke="#FFD700" />
                  <span className="text-sm md:text-lg font-bold">4.8</span>
                  <span className="text-xs md:text-base opacity-90">
                    {t("review")}
                  </span>
                </div>
              </div>

            </div>

            <div className="flex md:hidden justify-center gap-3 mt-6">
              <img
                src="/app-store.png"
                className="w-[130px] sm:w-[150px]"
              />
              <img
                src="/google-play.png"
                className="w-[130px] sm:w-[150px]"
              />
            </div>

          </div>
        </div>

        <div className="
          hidden md:flex
          flex-col gap-3 absolute right-16 top-1/2 transform -translate-y-1/2 rounded-[28px] bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur
        ">
          <img src="/app-store.png" className="w-[220px] lg:w-[254px]" />
          <img src="/google-play.png" className="w-[220px] lg:w-[254px]" />
        </div>

      </div>
    </div>
  </section>
);
}
