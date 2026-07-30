"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CustomerReview } from "@/services/public-content";

type TestimonialItem = {
  name: string;
  initials: string;
  text: string;
  rating: number;
  orderedItems?: string;
};

type TestimonialsProps = {
  reviews?: CustomerReview[];
  menuItemId?: string | null;
  averageRating?: number | null;
};

const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "CG";
};

const buildCustomerName = (review: CustomerReview) => {
  return [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ") || "Customer";
};

const buildOrderedItems = (review: CustomerReview, menuItemId?: string | null) => {
  if (!menuItemId) {
    return "";
  }

  return review.order?.items
    .filter((item) => item.menuItemId === menuItemId)
    .map((item) => item.variationName || item.menuItemName || "This item")
    .join(", ") || "";
};

const StarRow = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-[2px] mb-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating
              ? "fill-[#E74C3C] text-[#E74C3C]"
              : "text-[#E74C3C] fill-transparent"
          }
        />
      ))}
    </div>
  );
};

export const buildCustomerTestimonials = (
  reviews: CustomerReview[],
  menuItemId?: string | null,
): TestimonialItem[] =>
  reviews.slice(0, 3).map((review) => {
    const name = buildCustomerName(review);
    const comment = review.comment?.trim();

    return {
      name,
      initials: getInitials(name),
      text: comment ? `"${comment}"` : "",
      rating: review.rating,
      orderedItems: buildOrderedItems(review, menuItemId),
    };
  });

const Testimonials = ({ reviews = [], menuItemId = null, averageRating = null }: TestimonialsProps) => {
  const t = useTranslations("items.reviews");
  const testimonials = buildCustomerTestimonials(reviews, menuItemId);
  const displayAverage =
    averageRating ??
    (reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : null);
  const reviewCount = reviews.length;

  if (!reviewCount || displayAverage === null) {
    return (
      <section className="px-6 py-12 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1200px] rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <h2 className="text-[28px] font-semibold text-gray-900">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{t("empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 md:px-12 lg:px-20">


      <div className="max-w-[1200px] mx-auto mb-10">
        <h2 className="text-[28px] font-semibold text-gray-900">
          {t("title")}
        </h2>

        <div className="flex items-center gap-3 mt-2">
          <div className="flex gap-[2px]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className="fill-[#E74C3C] text-[#E74C3C]"
              />
            ))}
          </div>

          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {displayAverage.toFixed(1)} / 5.0
            </span>
            <span className="ml-1 text-gray-400">
              ({t("verifiedCount", { count: reviewCount })})
            </span>
          </p>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

        {testimonials.map((item, index) => (
          <div key={index} className="flex flex-col">

            {/* Stars */}
            <StarRow rating={item.rating} />

            {/* Text */}
            {item.text ? (
              <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                {item.text}
              </p>
            ) : null}

            {item.orderedItems ? (
              <p className="mb-4 text-xs text-gray-400">
                {t("ordered", { items: item.orderedItems })}
              </p>
            ) : null}

            {/* User */}
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {item.initials}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.name}
                </p>
                <p className="text-[11px] tracking-wide uppercase text-gray-400">
                  {t("verifiedUser")}
                </p>
              </div>

            </div>
          </div>
        ))}

      </div>
    </section>
  );
};

export default Testimonials;
