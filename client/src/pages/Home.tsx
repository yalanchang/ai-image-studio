import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Images, Shield, ArrowRight, Star, Wand2, Layers, Clock } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Image Generation", desc: "Generate stunning images from text prompts using state-of-the-art AI models with style controls." },
  { icon: Wand2, title: "Advanced Editing", desc: "Style transfer, background replacement, object removal, and upscaling powered by AI." },
  { icon: Zap, title: "Real-time Processing", desc: "WebSocket-powered live progress updates so you always know the status of your generation." },
  { icon: Layers, title: "Prompt Assistant", desc: "AI-powered prompt optimization to enhance your descriptions for better results." },
  { icon: Images, title: "Image Gallery", desc: "Browse community creations, get inspired, and share your best work publicly." },
  { icon: Shield, title: "Credit System", desc: "Flexible credit-based pricing. Different operations consume different amounts of credits." },
];

const stats = [
  { value: "10M+", label: "Images Generated" },
  { value: "500K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "<30s", label: "Avg. Generation" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center h-16 gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">AI Studio</span>
          </div>
          <div className="hidden md:flex items-center gap-6 ml-6">
            <Link href="/gallery"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Gallery</span></Link>
            <Link href="/credits"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pricing</span></Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/generate">
                <Button size="sm"><Sparkles className="w-4 h-4 mr-1.5" />Start Creating</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
                <Zap className="w-4 h-4 mr-1.5" />Get Started Free
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 gap-2 px-4 py-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs">Powered by Google Gemini AI</span>
          </Badge>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            Create Stunning Images{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              with AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform your imagination into breathtaking visuals. Generate, edit, and share AI-powered artwork with professional-grade tools and real-time processing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/generate">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">
                  <Sparkles className="w-5 h-5" />Start Generating
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="gap-2 px-8 h-12 text-base" onClick={() => window.location.href = getLoginUrl()}>
                <Sparkles className="w-5 h-5" />Start Free — 100 Credits
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base bg-transparent">
                <Images className="w-5 h-5" />View Gallery
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-10 border-t border-border/50">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Everything You Need to Create</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete AI image creation platform built for professionals and creators alike.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit pricing */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Simple Credit Pricing</h2>
          <p className="text-muted-foreground text-lg mb-12">Pay only for what you use. No subscriptions, no hidden fees.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Generate", cost: 10, desc: "Standard image generation", icon: Sparkles },
              { name: "Edit & Style", cost: 12, desc: "Style transfer & editing", icon: Wand2 },
              { name: "Advanced", cost: 20, desc: "Object removal & upscale", icon: Layers },
            ].map(({ name, cost, desc, icon: Icon }) => (
              <div key={name} className="p-6 rounded-xl bg-card border border-border text-center">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display font-bold text-xl mb-1">{name}</div>
                <div className="text-3xl font-bold text-primary mb-1">{cost}<span className="text-sm text-muted-foreground font-normal"> credits</span></div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            New users receive 100 free credits on signup
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join thousands of creators already using AI Studio.</p>
          {isAuthenticated ? (
            <Link href="/generate">
              <Button size="lg" className="gap-2 px-10 h-12 text-base">
                <Sparkles className="w-5 h-5" />Open Studio
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="gap-2 px-10 h-12 text-base" onClick={() => window.location.href = getLoginUrl()}>
              <Zap className="w-5 h-5" />Get Started — It's Free
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">AI Studio</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 AI Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
