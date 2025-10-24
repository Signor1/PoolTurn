import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Shield, Zap, DollarSign, Users, Globe } from "lucide-react"

export function RoscaFeatures() {
  const features = [
    {
      icon: Shield,
      title: "Collateral Protection",
      description:
        "Your contributions are secured with smart contract collateral. Members must lock additional funds to ensure payment commitments are met.",
      badge: "Secure",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      icon: DollarSign,
      title: "Rotating Payouts",
      description:
        "Fair and transparent payout system where each member receives the full pot in rotation. No favoritism, just mathematical certainty.",
      badge: "Fair",
      gradient: "from-secondary/20 to-secondary/5",
    },
    {
      icon: Users,
      title: "Community Circles",
      description:
        "Join trusted savings groups with friends, family, or verified community members. Build financial cooperation through shared goals.",
      badge: "Social",
      gradient: "from-primary/20 to-secondary/20",
    },
    {
      icon: Zap,
      title: "Instant Settlements",
      description:
        "Automated smart contract execution ensures instant payouts when your turn comes. No waiting for manual transfers or approvals.",
      badge: "Automated",
      gradient: "from-secondary/20 to-primary/5",
    },
    {
      icon: Globe,
      title: "Somnia Network",
      description:
        "Built on Somnia Testnet for fast, secure, and cost-effective transactions. Experience the future of decentralized savings.",
      badge: "Web3",
      gradient: "from-primary/15 to-secondary/15",
    },
    {
      icon: Sparkles,
      title: "Reputation System",
      description:
        "Build your credibility through consistent participation. Higher reputation unlocks access to premium circles and better terms.",
      badge: "Trust",
      gradient: "from-secondary/20 to-primary/10",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 glassmorphism">
          <Sparkles className="w-4 h-4 mr-2" />
          Platform Features
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Everything You Need to <span className="holographic-text">Save Together</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          RoscaSecure combines traditional community savings wisdom with blockchain security to create the most
          trusted decentralized savings platform.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="glassmorphism border-border/50 hover:neon-glow transition-all duration-300 group"
          >
            <CardContent className="p-6">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <Badge variant="secondary" className="text-xs text-nowrap">
                  {feature.badge}
                </Badge>
              </div>

              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
