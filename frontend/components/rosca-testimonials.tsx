import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"

export function RoscaTestimonials() {
  const testimonials = [
    {
      name: "Maria Rodriguez",
      role: "Small Business Owner",
      avatar: "/digital-artist-avatar.png",
      content:
        "RoscaSecure helped me save for my business expansion. The collateral protection gave me confidence, and I built great relationships with my circle members. Saved $5000 in 10 months!",
      rating: 5,
      badge: "Entrepreneur",
    },
    {
      name: "David Kim",
      role: "Software Engineer",
      avatar: "/nft-collector-avatar.png",
      content:
        "As a tech person, I appreciate the transparency of smart contracts. No hidden fees, automatic payouts, and the reputation system ensures everyone stays committed.",
      rating: 5,
      badge: "Tech User",
    },
    {
      name: "Aisha Patel",
      role: "Community Organizer",
      avatar: "/web3-developer-avatar.png",
      content:
        "I've organized traditional ROSCAs for years. RoscaSecure brings the same community spirit with modern security. My group loves the automated system and trust features.",
      rating: 5,
      badge: "Organizer",
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4 glassmorphism">
          <Quote className="w-4 h-4 mr-2" />
          Success Stories
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Trusted by <span className="holographic-text">Savers</span> & Communities
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Join thousands of satisfied members who have achieved their savings goals with RoscaSecure
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="glassmorphism border-border/50 hover:neon-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <blockquote className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</blockquote>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full border-2 border-primary/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {testimonial.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
