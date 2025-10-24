import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Twitter, Github, MessageCircle, Mail, Sparkles } from "lucide-react"
import { AnimatedSection } from "./animated-section"

export function RoscaFooter() {
  const footerLinks = {
    Platform: [
      { name: "Create Circle", href: "/create-circle" },
      { name: "Browse Circles", href: "/circles" },
      { name: "My Circles", href: "/my-circles" },
      { name: "Dashboard", href: "/dashboard" },
    ],
    Resources: [
      { name: "Documentation", href: "#" },
      { name: "How it Works", href: "#" },
      { name: "Safety Guide", href: "#" },
      { name: "FAQ", href: "#" },
    ],
    Community: [
      { name: "Discord", href: "#" },
      { name: "Twitter", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Newsletter", href: "#" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "Risk Disclosure", href: "#" },
    ],
  }

  return (
    <div className="bg-background">
      <AnimatedSection className="relative bg-background z-10 max-w-7xl mx-auto pt-16" delay={0.4}>
        <footer className="py-16 px-6 ">
          <div className="max-w-6xl mx-auto">
            {/* Newsletter Section */}
            <div className="glassmorphism rounded-2xl p-8 mb-12 text-center">
              <Badge variant="outline" className="mb-4 glassmorphism">
                <Mail className="w-4 h-4 mr-2" />
                Stay Updated
              </Badge>
              <h3 className="text-2xl font-bold mb-4">
                Stay Informed About <span className="holographic-text">Savings</span>
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Subscribe to our newsletter for platform updates, new circle opportunities, and financial education resources.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-input border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button className="px-6 neon-glow">Subscribe</Button>
              </div>
            </div>

            {/* Main Footer Content */}
            <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold holographic-text">RoscaSecure</span>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  The future of community savings. Join trusted circles, save together, and build financial resilience on Somnia Network.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                    <Github className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Footer Links */}
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="font-semibold mb-4">{category}</h4>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Separator className="mb-8" />

            {/* Bottom Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} RoscaSecure. All rights reserved. Built on Somnia Network.
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Powered by</span>
                <Badge variant="outline" className="glassmorphism">
                  Somnia Network
                </Badge>
              </div>
            </div>
          </div>
        </footer>
      </AnimatedSection>
    </div>
  )
}
