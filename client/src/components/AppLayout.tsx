import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles, Images, LayoutGrid, Coins, ShieldCheck,
  Menu, X, Zap, LogOut, User, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/generate", label: "AI 生成", icon: Sparkles, description: "創作 AI 圖像" },
  { href: "/gallery", label: "社群圖庫", icon: LayoutGrid, description: "探索社群作品" },
  { href: "/my-images", label: "我的圖片", icon: Images, description: "管理我的創作" },
  { href: "/credits", label: "積分管理", icon: Coins, description: "查看與儲值積分" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: creditData } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* 側邊欄 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-sidebar-foreground">AI 圖像工作室</span>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 導航選單 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, description }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group ${active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{label}</div>
                    <div className={`text-xs truncate ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{description}</div>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 shrink-0" />}
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin" onClick={() => setSidebarOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer mt-2 ${location === "/admin" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">管理後台</div>
                  <div className={`text-xs ${location === "/admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>系統管理</div>
                </div>
              </div>
            </Link>
          )}
        </nav>

        {/* 積分小工具 */}
        {isAuthenticated && (
          <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-sidebar-accent border border-sidebar-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">可用積分</span>
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-xl font-bold text-sidebar-foreground">{creditData?.credits ?? user?.credits ?? 0}</div>
            <Link href="/credits">
              <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs">立即儲值</Button>
            </Link>
          </div>
        )}

        {/* 使用者區塊 */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "使用者"}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {user?.role === "admin" ? "管理員" : user?.role === "premium" ? "高級會員" : "一般會員"}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/my-images"><User className="w-4 h-4 mr-2" />我的圖片</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              登入
            </Button>
          )}
        </div>
      </aside>

      {/* 手機版遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 主要內容區 */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* 頂部導覽列 */}
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-4">
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {!isAuthenticated && (
            <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <Zap className="w-4 h-4 mr-1.5" />登入開始創作
            </Button>
          )}
          {isAuthenticated && (
            <Badge variant="secondary" className="gap-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              {creditData?.credits ?? user?.credits ?? 0} 積分
            </Badge>
          )}
        </header>

        {/* 頁面內容 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
