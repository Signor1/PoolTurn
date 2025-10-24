import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Coins, TrendingUp } from "lucide-react"
import Link from "next/link"

export function PoolTurnHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <Badge variant="outline" className="mb-6 px-4 py-2 text-sm glassmorphism neon-glow">
          <Shield className="w-4 h-4 mr-2" />
          Powered by Collateral Protection
        </Badge>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="holographic-text">PoolTurn</span>
          <br />
          <span className="text-foreground">Community Savings Circles</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Join trusted community savings circles with collateral protection. Save together, support each other,
          and build financial security through rotating credit associations.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 glassmorphism px-4 py-2 rounded-full">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">Collateral Protected</span>
          </div>
          <div className="flex items-center gap-2 glassmorphism px-4 py-2 rounded-full">
            <Users className="w-5 h-5 text-secondary" />
            <span className="text-sm">Community Verified</span>
          </div>
          <div className="flex items-center gap-2 glassmorphism px-4 py-2 rounded-full">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-sm">Transparent Payouts</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create-circle">
            <Button size="lg" className="px-8 py-4 text-lg neon-glow hover:neon-glow transition-all duration-300">
              Create Circle
            </Button>
          </Link>
          <Link href="/circles">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg glassmorphism hover:neon-glow-cyan transition-all duration-300 bg-transparent"
            >
              Browse Circles
            </Button>
          </Link>
        </div>

        <div className="mt-16 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { title: "Active Circles", value: "247", icon: Users },
              { title: "Total Saved", value: "$2.4M", icon: TrendingUp },
              { title: "Success Rate", value: "98.5%", icon: Shield },
              { title: "Members", value: "15K+", icon: Coins },
            ].map((stat, i) => (
              <div
                key={i}
                className="glassmorphism rounded-xl p-4 hover:neon-glow transition-all duration-300 "
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2 animate-pulse" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}