"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, Clock, Flame, Star, Users, Timer, Zap, ArrowLeft, Grid3X3, List } from "lucide-react"

export function AuctionHub() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeFilter, setActiveFilter] = useState("all")

  const mockAuctions = [
    {
      id: "1",
      title: "Cyberpunk Cityscape #001",
      creator: "DigitalDreamer",
      currentBid: "2.5 ETH",
      participants: 24,
      timeRemaining: "2h 45m",
      image: "/cyberpunk-nft-1.png",
      category: "Digital Art",
      status: "active",
      isHot: true,
    },
    {
      id: "2",
      title: "Abstract Fusion Series",
      creator: "ArtBot3000",
      currentBid: "1.8 ETH",
      participants: 18,
      timeRemaining: "5h 12m",
      image: "/abstract-nft-2.png",
      category: "AI Generated",
      status: "active",
      isHot: false,
    },
    {
      id: "3",
      title: "Neon Dreams Collection",
      creator: "FutureVision",
      currentBid: "3.2 ETH",
      participants: 31,
      timeRemaining: "1h 23m",
      image: "/neon-dreams-nft-3.png",
      category: "Digital Art",
      status: "ending-soon",
      isHot: true,
    },
    {
      id: "4",
      title: "Holographic Portraits",
      creator: "AIArtist",
      currentBid: "0.9 ETH",
      participants: 12,
      timeRemaining: "8h 45m",
      image: "/holographic-nft-4.png",
      category: "Portrait",
      status: "active",
      isHot: false,
    },
    {
      id: "5",
      title: "Quantum Landscapes",
      creator: "PixelMaster",
      currentBid: "4.1 ETH",
      participants: 42,
      timeRemaining: "12h 30m",
      image: "/quantum-nft-5.png",
      category: "Landscape",
      status: "featured",
      isHot: true,
    },
    {
      id: "6",
      title: "Digital Metamorphosis",
      creator: "TransformAI",
      currentBid: "1.5 ETH",
      participants: 19,
      timeRemaining: "6h 18m",
      image: "/metamorphosis-nft-6.png",
      category: "Abstract",
      status: "active",
      isHot: false,
    },
  ]

  const filteredAuctions = mockAuctions.filter((auction) => {
    if (activeFilter === "all") return true
    if (activeFilter === "ending-soon") return auction.status === "ending-soon"
    if (activeFilter === "featured") return auction.status === "featured"
    if (activeFilter === "hot") return auction.isHot
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Platform
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">Auction Hub</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                Create Auction
              </Button>
              <div className="flex items-center gap-1 glassmorphism rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions, creators, or collections..."
              className="pl-10 glassmorphism bg-input/50 border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-8">
          <TabsList className="glassmorphism">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Auctions
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="ending-soon" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Ending Soon
            </TabsTrigger>
            <TabsTrigger value="hot" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Hot
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glassmorphism border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">247</div>
              <div className="text-sm text-muted-foreground">Active Auctions</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">1,234</div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">45.2 ETH</div>
              <div className="text-sm text-muted-foreground">Volume Today</div>
            </CardContent>
          </Card>
          <Card className="glassmorphism border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">23</div>
              <div className="text-sm text-muted-foreground">Ending Soon</div>
            </CardContent>
          </Card>
        </div>

        {/* Auction Grid */}
        <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredAuctions.map((auction) => (
            <Card
              key={auction.id}
              className="glassmorphism border-border/50 hover:neon-glow transition-all duration-300 group cursor-pointer"
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={auction.image || "/placeholder.svg"}
                    alt={auction.title}
                    className="w-full aspect-square object-cover rounded-t-lg"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {auction.isHot && (
                      <Badge variant="destructive" className="bg-red-500/80 backdrop-blur-sm">
                        <Flame className="w-3 h-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                    {auction.status === "featured" && (
                      <Badge variant="secondary" className="bg-primary/80 backdrop-blur-sm">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {auction.status === "ending-soon" && (
                      <Badge variant="outline" className="bg-orange-500/80 backdrop-blur-sm border-orange-400">
                        <Timer className="w-3 h-3 mr-1" />
                        Ending Soon
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      {auction.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {auction.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">by {auction.creator}</p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Bid</p>
                      <p className="font-bold text-lg">{auction.currentBid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Time Left</p>
                      <p className="font-medium">{auction.timeRemaining}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{auction.participants} bidders</span>
                    </div>
                    <Button size="sm" className="neon-glow">
                      Place Bid
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="glassmorphism bg-transparent">
            Load More Auctions
          </Button>
        </div>
      </div>
    </div>
  )
}
