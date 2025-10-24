import { TrendingUp, Users, Shield, DollarSign } from "lucide-react"

export function PoolTurnStats() {
  const stats = [
    {
      icon: TrendingUp,
      value: "847",
      label: "Active Circles",
      description: "Ongoing savings groups",
    },
    {
      icon: DollarSign,
      value: "$1.2M",
      label: "Total Saved",
      description: "Community wealth building",
    },
    {
      icon: Users,
      value: "5,234",
      label: "Trusted Members",
      description: "Verified savers",
    },
    {
      icon: Shield,
      value: "99.8%",
      label: "Success Rate",
      description: "Completed circles",
    },
  ]

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Building the Future of <span className="holographic-text">Community Savings</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Join thousands of savers in trusted, secure, and transparent rotating savings circles
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="glassmorphism rounded-xl p-6 text-center hover:neon-glow transition-all duration-300"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-2">{stat.value}</div>
            <div className="text-sm font-medium mb-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground">{stat.description}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
