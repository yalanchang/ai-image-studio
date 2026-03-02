import { Link } from "wouter";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Images, Shield, ArrowRight, Star, Wand2, Layers, Clock } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI 圖像生成", desc: "透過文字提示詞，使用最先進的 AI 模型生成精美圖像，支援多種藝術風格控制。" },
  { icon: Wand2, title: "進階圖像編輯", desc: "風格遷移、背景替換、物件移除與超解析度放大，全由 AI 驅動。" },
  { icon: Zap, title: "即時處理進度", desc: "WebSocket 即時推送生成進度，讓您隨時掌握任務狀態，無需等待刷新。" },
  { icon: Layers, title: "提示詞助手", desc: "AI 自動優化您的提示詞描述，讓生成結果更精準、更符合預期。" },
  { icon: Images, title: "社群圖庫", desc: "瀏覽社群創作、尋找靈感，並將您的最佳作品公開分享給所有人。" },
  { icon: Shield, title: "彈性積分制度", desc: "按使用量計費，不同操作消耗不同積分，靈活且透明，無隱藏費用。" },
];

const stats = [
  { value: "1,000萬+", label: "已生成圖像" },
  { value: "50萬+", label: "活躍用戶" },
  { value: "99.9%", label: "服務可用率" },
  { value: "<30秒", label: "平均生成時間" },
];

export default function Home() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const handleLogin = () => loginWithRedirect({ appState: { returnTo: "/generate" } });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 頂部導覽列 */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center h-16 gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">INSTANT</span>
          </div>
          <div className="hidden md:flex items-center gap-6 ml-6">
            <Link href="/gallery"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">社群圖庫</span></Link>
            <Link href="/credits"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">積分方案</span></Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/generate">
                <Button size="sm"><Sparkles className="w-4 h-4 mr-1.5" />開始創作</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={handleLogin}>
                <Zap className="w-4 h-4 mr-1.5" />免費註冊
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero 區塊 */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* 背景光暈 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 gap-2 px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs tracking-widest uppercase font-medium">想到。輸入。即刻生成。</span>
          </Badge>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            想象即現實{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              INSTANT
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            一句描述，就是一張作品。INSTANT 將您腦中的畫面在毫秒間轉化為震擼視覺——不需設計經驗，不需軟體授權，只需一個想法。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/generate">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">
                  <Sparkles className="w-5 h-5" />立即開始生成
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="gap-2 px-8 h-12 text-base" onClick={handleLogin}>
                <Sparkles className="w-5 h-5" />免費註冊 — 贈送 100 積分
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base bg-transparent">
                <Images className="w-5 h-5" />瀏覽圖庫
              </Button>
            </Link>
          </div>

          {/* 數據統計 */}
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

      {/* 功能特色 */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">一站式 AI 創作平台</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              為專業創作者與設計師打造，集生成、編輯、管理於一體的完整 AI 圖像工作流程。
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

      {/* 積分方案 */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">透明積分定價</h2>
          <p className="text-muted-foreground text-lg mb-12">按使用量付費，無訂閱費，無隱藏費用，用多少付多少。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "圖像生成", cost: 10, desc: "標準圖像生成", icon: Sparkles },
              { name: "編輯與風格", cost: 12, desc: "風格遷移與圖像編輯", icon: Wand2 },
              { name: "進階處理", cost: 20, desc: "物件移除與超解析度", icon: Layers },
            ].map(({ name, cost, desc, icon: Icon }) => (
              <div key={name} className="p-6 rounded-xl bg-card border border-border text-center">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display font-bold text-xl mb-1">{name}</div>
                <div className="text-3xl font-bold text-primary mb-1">{cost}<span className="text-sm text-muted-foreground font-normal"> 積分</span></div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            新用戶註冊即贈 100 積分，立即體驗
          </div>
        </div>
      </section>

      {/* 行動呼籲 */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">下一張傑作，就在下一秒。</h2>
          <p className="text-muted-foreground text-lg mb-8">超過十萬位創作者正在用 INSTANT 將想法變成作品——現在輪到您了。</p>
          {isAuthenticated ? (
            <Link href="/generate">
              <Button size="lg" className="gap-2 px-10 h-12 text-base">
                <Sparkles className="w-5 h-5" />進入工作室
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="gap-2 px-10 h-12 text-base" onClick={handleLogin}>
              <Zap className="w-5 h-5" />免費註冊
            </Button>
          )}
        </div>
      </section>

      {/* 頁腳 */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">INSTANT</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 INSTANT。版權所有。</p>
        </div>
      </footer>
    </div>
  );
}
