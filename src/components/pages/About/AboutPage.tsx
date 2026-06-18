"use client";

import AboutBanner from '@/components/pages/About/components/AboutBanner'
import CTASection from '@/components/pages/About/components/CTASection'
import MissionVisionValues from '@/components/pages/About/components/MissionVisionValues'
import OurStorySection from '@/components/pages/About/components/OurStorySection'
import TeamSection from '@/components/pages/About/components/TeamSection'
import TestimonialsSection from '@/components/pages/About/components/TestimonialsSection'
import WhyChooseUsSection from '@/components/pages/About/components/WhyChooseUsSection'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { useAuth } from '@/hooks/useAuth'
import { resolveHomeRestaurantId } from '@/lib/home'
import { fetchAboutContent } from '@/services/public-content'

const AboutPage = () => {
  const { user, restaurantId: authRestaurantId } = useAuth()
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId)
  const aboutQuery = useQuery({
    queryKey: queryKeys.home.about(restaurantId),
    queryFn: () => fetchAboutContent(restaurantId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
  })
  const aboutContent = aboutQuery.data
  const pageContent = aboutContent?.pageContent

  return (
    <>
    <AboutBanner content={pageContent?.hero} coverImage={aboutContent?.restaurantCoverImage} />
    <OurStorySection content={aboutContent?.content} story={pageContent?.story} />
    <MissionVisionValues items={pageContent?.missionVisionValues} />
    <WhyChooseUsSection features={pageContent?.whyChooseUs} stats={pageContent?.stats} />
    <TeamSection team={pageContent?.team} />
    <TestimonialsSection testimonials={pageContent?.testimonials} />
    <CTASection content={pageContent?.cta} />
    </>
  )
}

export { AboutPage }
