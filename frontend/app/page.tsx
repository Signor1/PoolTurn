
import { PoolTurnFeatures } from "@/components/poolturn-features"
import { PoolTurnStats } from "@/components/poolturn-stats"
import { PoolTurnTestimonials } from "@/components/poolturn-testimonials"
import { PoolTurnCTA } from "@/components/poolturn-cta"
import { AnimatedSection } from "@/components/animated-section"
import { PoolTurnHero } from "@/components/poolturn-hero"

export default function PoolTurnLanding() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10">
        <main className="max-w-7xl mx-auto relative">
          <PoolTurnHero />
        </main>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto px-6 mt-16" delay={0.1}>
          <PoolTurnStats />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto mt-16" delay={0.2}>
          <PoolTurnFeatures />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto mt-16" delay={0.3}>
          <PoolTurnTestimonials />
        </AnimatedSection>

        <AnimatedSection className="relative z-10 max-w-7xl mx-auto mt-16" delay={0.4}>
          <PoolTurnCTA />
        </AnimatedSection>
      </div>
    </div>
  )
}