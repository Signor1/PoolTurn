"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Heart, Share2, Clock, Users, TrendingUp, Shield, Zap, ExternalLink, Copy, Eye } from "lucide-react"

interface AuctionDetailProps {
  auctionId: string
}

export function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const [bidAmount, setBidAmount] = useState("")
  const [isLiked, setIsLiked] = useState(false)

  // Mock auction data
  const auction = {
    id: auctionId,
    title: "Cyberpunk Cityscape #001",
    description:
      "A stunning digital artwork depicting a futuristic cyberpunk cityscape with neon lights, flying cars, and towering skyscrapers. This piece represents the intersection of technology and urban life in a dystopian future.",
    creator: {
      name: "DigitalDreamer",
      avatar: "/creator-avatar.png",
      verified: true,
      followers: "12.5K",
    },
    collection: {
      name: "Cyberpunk Dreams",
      items: 100,
      floorPrice: "1.2 ETH",
    },
    currentBid: "2.5",
    currency: "ETH",
    participants: 24,
    timeRemaining: "2h 45m 32s",
    startingBid: "0.5",
    reservePrice: "2.0",
    image: "/cyberpunk-nft-detail.png",
    category: "Digital Art",
    blockchain: "Shape Network",
    tokenId: "#001",
    contractAddress: "0x1234...5678",
    royalties: "5%",
    views: 1247,
    likes: 89,
    created: "2024-01-15",
    auctionEnd: "2024-01-20T15:30:00Z",
  }

  const bidHistory = [
    { bidder: "0x1234...5678", amount: "2.5", time: "2 minutes ago", isWinner: true },
    { bidder: "0x9876...4321", amount: "2.3", time: "15 minutes ago", isWinner: false },
    { bidder: "0x5555...9999", amount: "2.1", time: "1 hour ago", isWinner: false },
    { bidder: "0x7777...1111", amount: "1.8", time: "2 hours ago", isWinner: false },
    { bidder: "0x3333...7777", amount: "1.5", time: "4 hours ago", isWinner: false },
  ]

  const relatedNFTs = [
    { id: "2", title: "Cyberpunk Cityscape #002", price: "1.8 ETH", image: "/related-nft-1.png" },
    { id: "3", title: "Cyberpunk Cityscape #003", price: "2.1 ETH", image: "/related-nft-2.png" },
    { id: "4", title: "Cyberpunk Cityscape #004", price: "1.9 ETH", image: "/related-nft-3.png" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Auctions
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="glassmorphism">
                  <Clock className="w-3 h-3 mr-1" />
                  {auction.timeRemaining}
                </Badge>
                <Badge variant="secondary">{auction.category}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="glassmorphism bg-transparent"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                {auction.likes}
              </Button>
              <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* NFT Display */}
          <div className="space-y-6">
            <Card className="glassmorphism border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={auction.image || "/placeholder.svg"}
                    alt={auction.title}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      <Eye className="w-3 h-3 mr-1" />
                      {auction.views} views
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur-sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Details */}
            <Card className="glassmorphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  NFT Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{auction.contractAddress}</p>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Token ID</p>
                    <p className="font-mono text-sm">{auction.tokenId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blockchain</p>
                    <p className="text-sm">{auction.blockchain}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Royalties</p>
                    <p className="text-sm">{auction.royalties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auction Info */}
          <div className="space-y-6">
            {/* Main Auction Card */}
            <Card className="glassmorphism border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{auction.title}</h1>
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={auction.creator.avatar || "/placeholder.svg"}
                        alt={auction.creator.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{auction.creator.name}</p>
                        <p className="text-xs text-muted-foreground">{auction.creator.followers} followers</p>
                      </div>
                      {auction.creator.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">{auction.description}</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-3xl font-bold">
                        {auction.currentBid} {auction.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className="text-xl font-bold text-primary">{auction.timeRemaining}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{auction.participants} bidders</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Starting: {auction.startingBid} ETH</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Bidding Interface */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter bid amount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="glassmorphism bg-input/50 border-border/50 focus:border-primary/50"
                      />
                      <span className="flex items-center px-3 text-sm text-muted-foreground">ETH</span>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 neon-glow" size="lg">
                        <Zap className="w-4 h-4 mr-2" />
                        Place Bid
                      </Button>
                      <Button variant="outline" size="lg" className="glassmorphism bg-transparent">
                        Auto Bid
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Minimum bid: {Number.parseFloat(auction.currentBid) + 0.1} ETH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card className="glassmorphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Bid History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidHistory.map((bid, index) => (
                    <div key={index} className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-mono text-sm">{bid.bidder}</p>
                          <p className="text-xs text-muted-foreground">{bid.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{bid.amount} ETH</p>
                        {bid.isWinner && (
                          <Badge variant="secondary" className="text-xs">
                            Winning Bid
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related NFTs */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">More from this Collection</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedNFTs.map((nft) => (
              <Card
                key={nft.id}
                className="glassmorphism border-border/50 hover:neon-glow transition-all duration-300 cursor-pointer"
              >
                <CardContent className="p-0">
                  <img
                    src={nft.image || "/placeholder.svg"}
                    alt={nft.title}
                    className="w-full aspect-square object-cover rounded-t-lg"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{nft.title}</h3>
                    <p className="text-primary font-bold">{nft.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
