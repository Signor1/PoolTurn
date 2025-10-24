"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Upload, Sparkles, ImageIcon, Palette, Settings, Eye, Zap, ArrowLeft, Download, Share2 } from "lucide-react"

export function NFTCreationStudio() {
  const [activeTab, setActiveTab] = useState("ai-prompt")
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleGenerate = () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate AI generation progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          setPreviewImage("/ai-generated-nft-artwork.png")
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

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
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">NFT Creation Studio</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" className="neon-glow">
                <Zap className="w-4 h-4 mr-2" />
                Mint NFT
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Creation Panel */}
          <div className="space-y-6">
            <Card className="glassmorphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Create Your NFT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 glassmorphism">
                    <TabsTrigger value="ai-prompt" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Prompt
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ai-prompt" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Describe your NFT</label>
                      <Textarea
                        placeholder="A futuristic cyberpunk cityscape with neon lights and flying cars, digital art style..."
                        className="min-h-[100px] glassmorphism bg-input/50 border-border/50 focus:border-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Art Style</label>
                        <select className="w-full px-3 py-2 rounded-lg glassmorphism bg-input/50 border border-border/50 focus:border-primary/50 focus:outline-none">
                          <option>Digital Art</option>
                          <option>Realistic</option>
                          <option>Abstract</option>
                          <option>Anime</option>
                          <option>Oil Painting</option>
                          <option>Watercolor</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resolution</label>
                        <select className="w-full px-3 py-2 rounded-lg glassmorphism bg-input/50 border border-border/50 focus:border-primary/50 focus:outline-none">
                          <option>1024x1024</option>
                          <option>512x512</option>
                          <option>768x768</option>
                          <option>1024x768</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                        Cyberpunk
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                        Futuristic
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                        Neon
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">
                        Abstract
                      </Badge>
                    </div>

                    {isGenerating && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Generating your NFT...</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <Progress value={generationProgress} className="h-2" />
                      </div>
                    )}

                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-full neon-glow">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isGenerating ? "Generating..." : "Generate NFT"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4 mt-6">
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center glassmorphism hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Upload your image</h3>
                      <p className="text-muted-foreground mb-4">Drag and drop your image here, or click to browse</p>
                      <Button variant="outline" className="glassmorphism bg-transparent">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Supported formats: JPG, PNG, GIF, SVG (Max 10MB)
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* NFT Metadata */}
            <Card className="glassmorphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-secondary" />
                  NFT Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NFT Name</label>
                  <Input
                    placeholder="Enter NFT name"
                    className="glassmorphism bg-input/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe your NFT..."
                    className="glassmorphism bg-input/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Collection</label>
                    <select className="w-full px-3 py-2 rounded-lg glassmorphism bg-input/50 border border-border/50 focus:border-primary/50 focus:outline-none">
                      <option>Create New Collection</option>
                      <option>My Art Collection</option>
                      <option>Digital Dreams</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Royalties (%)</label>
                    <Input
                      type="number"
                      placeholder="5"
                      className="glassmorphism bg-input/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Traits</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Trait name" className="glassmorphism bg-input/50 border-border/50" />
                      <Input placeholder="Value" className="glassmorphism bg-input/50 border-border/50" />
                      <Button variant="outline" size="sm" className="glassmorphism bg-transparent">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="glassmorphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  NFT Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted/20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center mb-4 overflow-hidden">
                  {previewImage ? (
                    <img
                      src={previewImage || "/placeholder.svg"}
                      alt="NFT Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Your NFT will appear here</p>
                    </div>
                  )}
                </div>

                {previewImage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 glassmorphism bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 glassmorphism bg-transparent">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Minting Options */}
            <Card className="glassmorphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-secondary" />
                  Minting Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                  <div>
                    <h4 className="font-medium">Standard Mint</h4>
                    <p className="text-sm text-muted-foreground">Single NFT mint</p>
                  </div>
                  <Badge variant="secondary">Free</Badge>
                </div>

                <div className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                  <div>
                    <h4 className="font-medium">Series Generation</h4>
                    <p className="text-sm text-muted-foreground">Generate multiple variations</p>
                  </div>
                  <Badge variant="outline">0.01 ETH</Badge>
                </div>

                <div className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                  <div>
                    <h4 className="font-medium">Tokenbound NFT</h4>
                    <p className="text-sm text-muted-foreground">NFT with smart wallet</p>
                  </div>
                  <Badge variant="outline">0.005 ETH</Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Minting Fee</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gas Fee (estimated)</span>
                    <span>~$2.50</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>~$2.50</span>
                  </div>
                </div>

                <Button className="w-full neon-glow" size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Mint NFT
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
