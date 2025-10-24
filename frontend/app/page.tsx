
import { RoscaFeatures } from "@/components/rosca-features"
import { RoscaStats } from "@/components/rosca-stats"
import { RoscaTestimonials } from "@/components/rosca-testimonials"
import { RoscaCTA } from "@/components/rosca-cta"
import { AnimatedSection } from "@/components/animated-section"
import { RoscaHero } from "@/components/rosca-hero"

export default function RoscaLanding() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10">
        <main className="max-w-7xl mx-auto relative">
          <RoscaHero />
        </main>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto px-6 mt-16" delay={0.1}>
          <RoscaStats />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto mt-16" delay={0.2}>
          <RoscaFeatures />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto mt-16" delay={0.3}>
          <RoscaTestimonials />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto mt-16" delay={0.4}>
          <RoscaCTA />
        </AnimatedSection>
      </div>
    </div>
  )
}