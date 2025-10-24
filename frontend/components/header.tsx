"use client"

import type React from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"
const WalletConnect = dynamic(() => import("./wallet-connect").then((mod) => mod.WalletConnect), { ssr: false });


export function Header() {

  const navItems = [
    { name: "Create Circle", href: "/create-circle" },
    { name: "Browse Circles", href: "/circles" },
    { name: "My Circles", href: "/my-circles" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  const path = usePathname()

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only handle scroll for anchor links
    if (href.startsWith("#")) {
      e.preventDefault()
      const targetId = href.substring(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }


  return (
    <header className="w-full py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PT</span>
              </div>
              <span className=" text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                PoolTurn
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className={`text-muted-foreground hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors hover:bg-primary/10 ${path == item.href ? "bg-primary/10" : null}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Desktop Wallet Connect */}
          <div className="hidden md:block">
            <WalletConnect />
          </div>

          <Link href="/create-circle" className="hidden md:block">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium neon-glow">
              Create Circle
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="bg-background border-t border-border text-foreground glass-morphism"
            >
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)}
                    className="text-muted-foreground hover:text-foreground justify-start text-lg py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-4">
                  {/* Mobile Wallet Connect */}
                  <WalletConnect isMobile={true} />

                  <Link href="/create-circle" className="w-full">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium neon-glow">
                      Create Circle
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
