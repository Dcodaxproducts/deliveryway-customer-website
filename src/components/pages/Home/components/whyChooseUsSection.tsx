import Image from 'next/image';
import { useTranslations } from "next-intl";

const features = [
  {
    id: 1,
    titleKey: "easyTitle",
    descKey: "easyDescription",
    img: "/whychooseus1.png",
  },
  {
    id: 2,
    titleKey: "deliveryTitle",
    descKey: "deliveryDescription",
    img: "/whychooseus2.png",
  },
  {
    id: 3,
    titleKey: "qualityTitle",
    descKey: "qualityDescription",
    img: "/whychooseus3.png",
  },
] as const;

const FeatureCard = ({
  title,
  desc,
  img,
}: {
  title: string;
  desc: string;
  img: string;
}) => (
  <div className="flex flex-col items-center rounded-[30px] bg-white p-6 text-center text-gray-800 shadow-[0_18px_60px_rgba(206,24,27,0.08)]">
    
    {/* IMAGE */}
    <div className="relative mb-4 h-32 w-32 rounded-full bg-[#fff1ec] p-4 sm:h-40 sm:w-40 md:h-44 md:w-44">
      <Image src={img} alt={title} fill className="object-contain object-top" />
    </div>

    {/* TITLE */}
    <h3 className="
      text-xl sm:text-2xl md:text-[26px]
      font-black
      leading-tight md:leading-[30px] 
      mb-2
    ">
      {title}
    </h3>

    {/* DESCRIPTION */}
    <p className="
      text-sm sm:text-base md:text-lg 
      leading-relaxed 
      max-w-full md:max-w-[314px]
    ">
      {desc}
    </p>
  </div>
);

export default function WhyChooseUs() {
  const t = useTranslations("home.whyChooseUs");

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-12 md:py-[80px]">
      
      {/* HEADING */}
      <h2 className="
        text-2xl sm:text-3xl md:text-[42px] 
        font-black
        text-center 
        leading-tight md:leading-[30px] 
        mb-10 md:mb-[60px]
      ">
        {t("title")}
      </h2>

      {/* GRID */}
      <div className="
        grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
        gap-6 sm:gap-8
      ">
        {features.map((f) => (
          <FeatureCard key={f.id} title={t(f.titleKey)} desc={t(f.descKey)} img={f.img} />
        ))}
      </div>

    </section>
  );
}
