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

  return (
    <>
    <AboutBanner />
    <OurStorySection content={aboutQuery.data?.content} />
    <MissionVisionValues />
    <WhyChooseUsSection />
    <TeamSection />
    <TestimonialsSection />
    <CTASection />
    </>
  )
}

export { AboutPage }
